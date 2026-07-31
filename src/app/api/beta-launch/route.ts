import { timingSafeEqual } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { betaLaunchEmailHtml, betaLaunchEmailText } from "@/lib/emails";

export const runtime = "nodejs";

const launchSchema = z.object({
  confirmation: z.literal("ENVIAR BETA MESA"),
  campaignId: z
    .string()
    .trim()
    .min(4)
    .max(60)
    .regex(/^[a-z0-9-]+$/),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

function secretsMatch(provided: string, expected: string) {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  return (
    providedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(providedBuffer, expectedBuffer)
  );
}

export async function POST(request: Request) {
  const expectedSecret = process.env.BETA_LAUNCH_SECRET;
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
  };

  if (!config.apiKey || !config.segmentId || !config.from) {
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
          "Confirma el envío, indica un campaignId único y revisa la fecha.",
      },
      { status: 400 },
    );
  }

  const resend = new Resend(config.apiKey);
  const { campaignId, scheduledAt } = parsed.data;
  const result = await resend.broadcasts.create(
    {
      segmentId: config.segmentId,
      name: `MESA beta launch · ${campaignId}`,
      from: config.from,
      replyTo: config.replyTo,
      subject: "La mesa está lista: ya puedes entrar en la beta",
      previewText: "Tu acceso a la beta privada de MESA ya está disponible.",
      html: betaLaunchEmailHtml(),
      text: betaLaunchEmailText,
      send: true,
      scheduledAt,
    },
    {
      headers: {
        "Idempotency-Key": `mesa-beta-launch-${campaignId}`,
      },
    },
  );

  if (result.error) {
    console.error("Beta launch broadcast error:", result.error.name);
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
