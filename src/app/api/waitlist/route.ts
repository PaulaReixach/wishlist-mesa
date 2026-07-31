import { createHash } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { welcomeEmailHtml, welcomeEmailText } from "@/lib/emails";

export const runtime = "nodejs";

const waitlistSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Escribe un correo electrónico válido.")
    .max(254, "El correo es demasiado largo."),
  company: z.string().max(200).optional().default(""),
  startedAt: z.number().int().positive().optional(),
});

function configured() {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.RESEND_SEGMENT_ID &&
      process.env.RESEND_FROM_EMAIL,
  );
}

function isDuplicate(message: string, statusCode: number | null) {
  return (
    statusCode === 409 ||
    message.toLowerCase().includes("already") ||
    message.toLowerCase().includes("exists")
  );
}

export async function POST(request: Request) {
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

  const { email, company, startedAt } = parsed.data;

  // Campo trampa y tiempo mínimo: respondemos con éxito sin procesar a los bots.
  if (company || (startedAt && Date.now() - startedAt < 500)) {
    return Response.json({ ok: true });
  }

  if (!configured()) {
    if (process.env.NODE_ENV === "development") {
      return Response.json({ ok: true, preview: true });
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

  const resend = new Resend(process.env.RESEND_API_KEY);
  const segmentId = process.env.RESEND_SEGMENT_ID as string;
  const from = process.env.RESEND_FROM_EMAIL as string;
  const replyTo = process.env.RESEND_REPLY_TO;
  const hash = createHash("sha256").update(email).digest("hex").slice(0, 32);

  const contactResult = await resend.contacts.create({
    email,
    unsubscribed: false,
    segments: [{ id: segmentId }],
  });

  if (contactResult.error) {
    if (
      !isDuplicate(
        contactResult.error.message,
        contactResult.error.statusCode,
      )
    ) {
      console.error("Waitlist contact error:", contactResult.error.name);
      return Response.json(
        {
          ok: false,
          message:
            "No hemos podido guardar tu correo. Inténtalo de nuevo dentro de un momento.",
        },
        { status: 502 },
      );
    }

    const segmentResult = await resend.contacts.segments.add({
      email,
      segmentId,
    });

    if (
      segmentResult.error &&
      !isDuplicate(
        segmentResult.error.message,
        segmentResult.error.statusCode,
      )
    ) {
      console.error("Waitlist segment error:", segmentResult.error.name);
      return Response.json(
        {
          ok: false,
          message:
            "No hemos podido actualizar tu acceso. Inténtalo de nuevo dentro de un momento.",
        },
        { status: 502 },
      );
    }
  }

  const emailResult = await resend.emails.send(
    {
      from,
      to: email,
      replyTo,
      subject: "Te hemos guardado un sitio en MESA",
      html: welcomeEmailHtml(),
      text: welcomeEmailText,
      tags: [{ name: "type", value: "waitlist-welcome" }],
    },
    { idempotencyKey: `mesa-waitlist-${hash}` },
  );

  if (emailResult.error) {
    console.error("Waitlist welcome error:", emailResult.error.name);
    return Response.json(
      {
        ok: false,
        message:
          "Tu correo está guardado, pero la bienvenida no ha podido salir. Inténtalo de nuevo en unos minutos.",
      },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
