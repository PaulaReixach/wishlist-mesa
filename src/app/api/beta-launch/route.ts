import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { launchEmailHtml, launchEmailText } from "@/lib/emails";

export const runtime = "nodejs";

type LaunchResendClient = Pick<Resend, "broadcasts">;

const launchSchema = z.object({
  confirmation: z.literal("ENVIAR LANZAMIENTO MESA"),
  campaignId: z
    .string()
    .trim()
    .min(4)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  scheduledAt: z
    .string()
    .datetime({ offset: true })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "La fecha programada debe estar en el futuro.",
    })
    .optional(),
});

function secretsMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function handleLaunch(
  request: Request,
  resendClient?: LaunchResendClient,
) {
  const expectedSecret =
    process.env.MESA_LAUNCH_SECRET ?? process.env.BETA_LAUNCH_SECRET;
  const authorization = request.headers.get("authorization");
  const providedSecret = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (
    !expectedSecret ||
    !providedSecret ||
    !secretsMatch(providedSecret, expectedSecret)
  ) {
    return Response.json({ ok: false, message: "No autorizado." }, { status: 401 });
  }

  const config = {
    apiKey: process.env.RESEND_API_KEY,
    segmentId: process.env.RESEND_SEGMENT_ID,
    from: process.env.RESEND_FROM_EMAIL,
    replyTo: process.env.RESEND_REPLY_TO,
    appUrl: process.env.MESA_APP_URL,
  };

  if (!config.apiKey || !config.segmentId || !config.from || !config.appUrl) {
    return Response.json(
      { ok: false, message: "La configuración de email está incompleta." },
      { status: 503 },
    );
  }

  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return Response.json(
      { ok: false, message: "El cuerpo de la solicitud no es válido." },
      { status: 400 },
    );
  }

  const parsed = launchSchema.safeParse(rawBody);

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        message:
          parsed.error.issues[0]?.message ??
          "Confirma el envío, indica un campaignId único y revisa la fecha.",
      },
      { status: 400 },
    );
  }

  const resend = resendClient ?? new Resend(config.apiKey);
  const { campaignId, scheduledAt } = parsed.data;
  const result = await resend.broadcasts.create(
    {
      segmentId: config.segmentId,
      name: `MESA app launch · ${campaignId}`,
      from: config.from,
      replyTo: config.replyTo,
      subject: "La mesa está lista: MESA ya está disponible",
      previewText: "Ya puedes descargar MESA y crear vuestro primer grupo.",
      html: launchEmailHtml(),
      text: launchEmailText(),
      send: true,
      scheduledAt,
    },
    {
      headers: {
        "Idempotency-Key": `mesa-app-launch-${campaignId}`,
      },
    },
  );

  if (result.error) {
    console.error("App launch broadcast error:", result.error.name);
    return Response.json(
      { ok: false, message: "No se ha podido crear el envío de lanzamiento." },
      { status: 502 },
    );
  }

  return Response.json({
    ok: true,
    broadcastId: result.data.id,
    scheduled: Boolean(scheduledAt),
  });
}

export async function POST(request: Request) {
  return handleLaunch(request);
}
