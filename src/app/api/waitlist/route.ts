import { z } from "zod";
import {
  BrevoHttpClient,
  brevoErrorCode,
  type BrevoClient,
} from "@/lib/brevo";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/emails";

export const runtime = "nodejs";

type WaitlistBrevoClient = Pick<
  BrevoClient,
  "contactExists" | "upsertContact" | "sendTransactionalEmail"
>;

const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Escribe un correo electrónico válido.")
    .max(254, "El correo es demasiado largo."),
  company: z.string().max(200).optional().default(""),
});

function configured() {
  const listId = Number(process.env.BREVO_LIST_ID);

  return Boolean(
    process.env.BREVO_API_KEY &&
      Number.isSafeInteger(listId) &&
      listId > 0 &&
      process.env.BREVO_SENDER_EMAIL &&
      process.env.NEXT_PUBLIC_SITE_URL,
  );
}

export async function handleWaitlist(
  request: Request,
  brevoClient?: WaitlistBrevoClient,
) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > 10_000) {
    return Response.json(
      { ok: false, message: "La solicitud es demasiado grande." },
      { status: 413 },
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "No hemos podido leer el formulario." },
      { status: 400 },
    );
  }

  const parsed = waitlistSchema.safeParse(rawBody);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        message:
          parsed.error.issues[0]?.message ??
          "Revisa el correo e inténtalo de nuevo.",
      },
      { status: 400 },
    );
  }

  const { email, company } = parsed.data;

  // El campo trampa permite descartar bots sin bloquear autocompletados legítimos.
  if (company) {
    return Response.json({
      ok: true,
      preview: false,
      emailSent: false,
      alreadySubscribed: false,
    });
  }

  if (!configured()) {
    if (process.env.NODE_ENV === "development") {
      return Response.json({
        ok: true,
        preview: true,
        emailSent: false,
        alreadySubscribed: false,
      });
    }

    return Response.json(
      {
        ok: false,
        message:
          "La lista está terminando de prepararse. Vuelve a intentarlo en unos minutos.",
      },
      { status: 503 },
    );
  }

  const brevo =
    brevoClient ?? new BrevoHttpClient(process.env.BREVO_API_KEY as string);
  const listId = Number(process.env.BREVO_LIST_ID);
  const sender = {
    email: process.env.BREVO_SENDER_EMAIL as string,
    name: process.env.BREVO_SENDER_NAME?.trim() || "MESA",
  };
  const replyTo = process.env.BREVO_REPLY_TO?.trim();
  let alreadySubscribed: boolean;

  try {
    alreadySubscribed = await brevo.contactExists(email);
    await brevo.upsertContact(email, listId);
  } catch (error) {
    console.error("Waitlist contact error:", brevoErrorCode(error));
    return Response.json(
      {
        ok: false,
        message:
          "No hemos podido guardar tu correo. Inténtalo de nuevo dentro de un momento.",
      },
      { status: 502 },
    );
  }

  try {
    await brevo.sendTransactionalEmail({
      sender,
      to: [{ email }],
      ...(replyTo ? { replyTo: { email: replyTo, name: "MESA" } } : {}),
      subject: "Te hemos guardado un sitio en MESA",
      htmlContent: welcomeEmailHtml(),
      textContent: welcomeEmailText(),
      tags: ["mesa-waitlist-welcome"],
    });
  } catch (error) {
    console.error("Waitlist welcome error:", brevoErrorCode(error));
    return Response.json({
      ok: true,
      preview: false,
      emailSent: false,
      alreadySubscribed,
    });
  }

  return Response.json({
    ok: true,
    preview: false,
    emailSent: true,
    alreadySubscribed,
  });
}

export async function POST(request: Request) {
  return handleWaitlist(request);
}
