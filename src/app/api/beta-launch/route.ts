import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  BrevoHttpClient,
  brevoErrorCode,
  type BrevoClient,
} from "@/lib/brevo";
import { launchEmailHtml } from "@/lib/emails";

export const runtime = "nodejs";

type LaunchBrevoClient = Pick<
  BrevoClient,
  | "findCampaignByName"
  | "createCampaign"
  | "scheduleCampaign"
  | "sendCampaignNow"
>;

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
  brevoClient?: LaunchBrevoClient,
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
    apiKey: process.env.BREVO_API_KEY,
    listId: Number(process.env.BREVO_LIST_ID),
    senderEmail: process.env.BREVO_SENDER_EMAIL,
    senderName: process.env.BREVO_SENDER_NAME?.trim() || "MESA",
    replyTo: process.env.BREVO_REPLY_TO,
    appUrl: process.env.MESA_APP_URL,
  };

  if (
    !config.apiKey ||
    !Number.isSafeInteger(config.listId) ||
    config.listId <= 0 ||
    !config.senderEmail ||
    !config.appUrl
  ) {
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

  const brevo = brevoClient ?? new BrevoHttpClient(config.apiKey);
  const { campaignId, scheduledAt } = parsed.data;
  const campaignName = `MESA app launch · ${campaignId}`;

  try {
    const existingCampaign = await brevo.findCampaignByName(campaignName);

    if (existingCampaign) {
      if (existingCampaign.status === "draft") {
        if (scheduledAt) {
          await brevo.scheduleCampaign(existingCampaign.id, scheduledAt);
        } else {
          await brevo.sendCampaignNow(existingCampaign.id);
        }
      }

      return Response.json({
        ok: true,
        campaignId: existingCampaign.id,
        scheduled:
          Boolean(scheduledAt) || existingCampaign.status === "scheduled",
        alreadyCreated: true,
      });
    }

    const createdCampaignId = await brevo.createCampaign({
      name: campaignName,
      sender: {
        email: config.senderEmail,
        name: config.senderName,
      },
      replyTo: config.replyTo,
      subject: "La mesa está lista: MESA ya está disponible",
      previewText: "Ya puedes descargar MESA y crear vuestro primer grupo.",
      htmlContent: launchEmailHtml(),
      recipients: { listIds: [config.listId] },
      scheduledAt,
      tag: `mesa-launch-${campaignId}`,
    });

    if (!scheduledAt) {
      await brevo.sendCampaignNow(createdCampaignId);
    }

    return Response.json({
      ok: true,
      campaignId: createdCampaignId,
      scheduled: Boolean(scheduledAt),
      alreadyCreated: false,
    });
  } catch (error) {
    console.error("App launch campaign error:", brevoErrorCode(error));
    return Response.json(
      { ok: false, message: "No se ha podido crear el envío de lanzamiento." },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  return handleLaunch(request);
}
