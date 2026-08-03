import assert from "node:assert/strict";
import { after, afterEach, beforeEach, describe, it } from "node:test";
import type {
  BrevoCampaign,
  BrevoClient,
  EmailCampaign,
  TransactionalEmail,
} from "@/lib/brevo";
import { BrevoHttpClient } from "@/lib/brevo";
import { handleLaunch } from "./beta-launch/route";
import { handleWaitlist } from "./waitlist/route";

type WaitlistClient = Pick<
  BrevoClient,
  "contactExists" | "upsertContact" | "sendTransactionalEmail"
>;
type LaunchClient = Pick<
  BrevoClient,
  | "findCampaignByName"
  | "createCampaign"
  | "scheduleCampaign"
  | "sendCampaignNow"
>;

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

function jsonRequest(path: string, body: unknown, authorization?: string) {
  return new Request(`http://localhost:3000${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function withoutExpectedErrorLog<T>(action: () => Promise<T>) {
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    return await action();
  } finally {
    console.error = originalConsoleError;
  }
}

function waitlistClient(overrides?: {
  contactExists?: boolean;
  contactError?: Error;
  emailError?: Error;
}) {
  const calls = {
    contactExists: [] as string[],
    upsertContact: [] as Array<{ email: string; listId: number }>,
    sendEmail: [] as TransactionalEmail[],
  };

  const client: WaitlistClient = {
    contactExists: async (email) => {
      calls.contactExists.push(email);

      if (overrides?.contactError) {
        throw overrides.contactError;
      }

      return overrides?.contactExists ?? false;
    },
    upsertContact: async (email, listId) => {
      calls.upsertContact.push({ email, listId });
    },
    sendTransactionalEmail: async (email) => {
      calls.sendEmail.push(email);

      if (overrides?.emailError) {
        throw overrides.emailError;
      }

      return "message_1";
    },
  };

  return { client, calls };
}

function launchClient(overrides?: {
  existingCampaign?: BrevoCampaign | null;
  createCampaignId?: number;
  error?: Error;
}) {
  const calls = {
    findCampaign: [] as string[],
    createCampaign: [] as EmailCampaign[],
    scheduleCampaign: [] as Array<{ campaignId: number; scheduledAt: string }>,
    sendNow: [] as number[],
  };

  const failIfConfigured = () => {
    if (overrides?.error) {
      throw overrides.error;
    }
  };

  const client: LaunchClient = {
    findCampaignByName: async (name) => {
      calls.findCampaign.push(name);
      failIfConfigured();
      return overrides?.existingCampaign ?? null;
    },
    createCampaign: async (campaign) => {
      calls.createCampaign.push(campaign);
      failIfConfigured();
      return overrides?.createCampaignId ?? 41;
    },
    scheduleCampaign: async (campaignId, scheduledAt) => {
      calls.scheduleCampaign.push({ campaignId, scheduledAt });
      failIfConfigured();
    },
    sendCampaignNow: async (campaignId) => {
      calls.sendNow.push(campaignId);
      failIfConfigured();
    },
  };

  return { client, calls };
}

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_SEGMENT_ID;
  delete process.env.RESEND_FROM_EMAIL;
  process.env.BREVO_API_KEY = "xkeysib-test";
  process.env.BREVO_LIST_ID = "27";
  process.env.BREVO_SENDER_EMAIL = "mesaappsupport@gmail.com";
  process.env.BREVO_SENDER_NAME = "MESA";
  process.env.BREVO_REPLY_TO = "mesaappsupport@gmail.com";
  process.env.NEXT_PUBLIC_SITE_URL = "https://mesa.test";
  process.env.MESA_APP_URL =
    "https://play.google.com/store/apps/details?id=com.mesa";
  process.env.MESA_LAUNCH_SECRET = "a-long-launch-secret";
});

after(() => {
  process.env = originalEnv;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("BrevoHttpClient", () => {
  it("reactiva el contacto y lo incorpora a la lista configurada", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    globalThis.fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(null, { status: 204 });
    };

    const client = new BrevoHttpClient("xkeysib-private");
    await client.upsertContact("paula@example.com", 27);

    assert.equal(requestUrl, "https://api.brevo.com/v3/contacts");
    assert.equal(requestInit?.method, "POST");
    assert.equal(
      new Headers(requestInit?.headers).get("api-key"),
      "xkeysib-private",
    );
    assert.deepEqual(JSON.parse(String(requestInit?.body)), {
      email: "paula@example.com",
      emailBlacklisted: false,
      listIds: [27],
      updateEnabled: true,
    });
  });

  it("pagina las campañas hasta encontrar el identificador existente", async () => {
    const requestedOffsets: string[] = [];
    globalThis.fetch = async (input) => {
      const url = new URL(String(input));
      const offset = url.searchParams.get("offset") ?? "";
      requestedOffsets.push(offset);

      if (offset === "0") {
        return Response.json({
          campaigns: Array.from({ length: 100 }, (_, index) => ({
            id: index + 1,
            name: `Otra campaña ${index + 1}`,
            status: "sent",
          })),
          count: 101,
        });
      }

      return Response.json({
        campaigns: [
          {
            id: 101,
            name: "MESA app launch · android-launch-2026",
            status: "sent",
          },
        ],
        count: 101,
      });
    };

    const client = new BrevoHttpClient("xkeysib-private");
    const campaign = await client.findCampaignByName(
      "MESA app launch · android-launch-2026",
    );

    assert.equal(campaign?.id, 101);
    assert.deepEqual(requestedOffsets, ["0", "100"]);
  });
});

describe("POST /api/waitlist", () => {
  it("guarda un contacto nuevo en la lista y envía la bienvenida", async () => {
    const { client, calls } = waitlistClient();
    const response = await handleWaitlist(
      jsonRequest("/api/waitlist", { email: " Paula@Example.com " }),
      client,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      preview: false,
      emailSent: true,
      alreadySubscribed: false,
    });
    assert.deepEqual(calls.contactExists, ["paula@example.com"]);
    assert.deepEqual(calls.upsertContact, [
      { email: "paula@example.com", listId: 27 },
    ]);
    assert.equal(calls.sendEmail[0].to[0].email, "paula@example.com");
    assert.deepEqual(calls.sendEmail[0].sender, {
      email: "mesaappsupport@gmail.com",
      name: "MESA",
    });
    assert.equal(
      calls.sendEmail[0].subject,
      "Te hemos guardado un sitio en MESA",
    );
    assert.match(
      calls.sendEmail[0].htmlContent,
      /https:\/\/mesa\.test\/privacidad/,
    );
  });

  it("reactiva un contacto existente y vuelve a confirmar su alta", async () => {
    const { client, calls } = waitlistClient({ contactExists: true });
    const response = await handleWaitlist(
      jsonRequest("/api/waitlist", { email: "paula@example.com" }),
      client,
    );

    assert.deepEqual(await response.json(), {
      ok: true,
      preview: false,
      emailSent: true,
      alreadySubscribed: true,
    });
    assert.equal(calls.upsertContact.length, 1);
    assert.equal(calls.sendEmail.length, 1);
  });

  it("mantiene la suscripción aunque la bienvenida falle temporalmente", async () => {
    const { client } = waitlistClient({
      emailError: new Error("rate limited"),
    });

    const response = await withoutExpectedErrorLog(() =>
      handleWaitlist(
        jsonRequest("/api/waitlist", { email: "paula@example.com" }),
        client,
      ),
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      preview: false,
      emailSent: false,
      alreadySubscribed: false,
    });
  });

  it("rechaza correos inválidos antes de llamar a Brevo", async () => {
    const { client, calls } = waitlistClient();
    const response = await handleWaitlist(
      jsonRequest("/api/waitlist", { email: "no-es-un-email" }),
      client,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.contactExists.length, 0);
    assert.equal(calls.upsertContact.length, 0);
  });
});

describe("POST /api/beta-launch", () => {
  it("rechaza peticiones sin el secreto privado", async () => {
    const { client, calls } = launchClient();
    const response = await handleLaunch(
      jsonRequest("/api/beta-launch", {
        confirmation: "ENVIAR LANZAMIENTO MESA",
        campaignId: "android-launch-2026",
      }),
      client,
    );

    assert.equal(response.status, 401);
    assert.equal(calls.findCampaign.length, 0);
  });

  it("crea y envía una campaña inmediata a toda la lista", async () => {
    const { client, calls } = launchClient();
    const response = await handleLaunch(
      jsonRequest(
        "/api/beta-launch",
        {
          confirmation: "ENVIAR LANZAMIENTO MESA",
          campaignId: "android-launch-2026",
        },
        "Bearer a-long-launch-secret",
      ),
      client,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      ok: true,
      campaignId: 41,
      scheduled: false,
      alreadyCreated: false,
    });
    assert.deepEqual(calls.sendNow, [41]);

    const campaign = calls.createCampaign[0];
    assert.equal(campaign.name, "MESA app launch · android-launch-2026");
    assert.deepEqual(campaign.recipients, { listIds: [27] });
    assert.equal(
      campaign.subject,
      "La mesa está lista: MESA ya está disponible",
    );
    assert.match(
      campaign.htmlContent,
      /https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.mesa/,
    );
    assert.match(campaign.htmlContent, /href="{{ unsubscribe }}"/);
  });

  it("programa la campaña sin enviarla inmediatamente", async () => {
    const { client, calls } = launchClient({ createCampaignId: 52 });
    const scheduledAt = "2099-09-01T10:00:00+02:00";
    const response = await handleLaunch(
      jsonRequest(
        "/api/beta-launch",
        {
          confirmation: "ENVIAR LANZAMIENTO MESA",
          campaignId: "android-launch-2099",
          scheduledAt,
        },
        "Bearer a-long-launch-secret",
      ),
      client,
    );

    assert.deepEqual(await response.json(), {
      ok: true,
      campaignId: 52,
      scheduled: true,
      alreadyCreated: false,
    });
    assert.equal(calls.createCampaign[0].scheduledAt, scheduledAt);
    assert.equal(calls.sendNow.length, 0);
  });

  it("no duplica una campaña que ya se había enviado", async () => {
    const { client, calls } = launchClient({
      existingCampaign: {
        id: 88,
        name: "MESA app launch · android-launch-2026",
        status: "sent",
      },
    });
    const response = await handleLaunch(
      jsonRequest(
        "/api/beta-launch",
        {
          confirmation: "ENVIAR LANZAMIENTO MESA",
          campaignId: "android-launch-2026",
        },
        "Bearer a-long-launch-secret",
      ),
      client,
    );

    assert.deepEqual(await response.json(), {
      ok: true,
      campaignId: 88,
      scheduled: false,
      alreadyCreated: true,
    });
    assert.equal(calls.createCampaign.length, 0);
    assert.equal(calls.sendNow.length, 0);
  });

  it("reanuda un borrador existente sin crear otra campaña", async () => {
    const { client, calls } = launchClient({
      existingCampaign: {
        id: 93,
        name: "MESA app launch · android-launch-2026",
        status: "draft",
      },
    });
    const response = await handleLaunch(
      jsonRequest(
        "/api/beta-launch",
        {
          confirmation: "ENVIAR LANZAMIENTO MESA",
          campaignId: "android-launch-2026",
        },
        "Bearer a-long-launch-secret",
      ),
      client,
    );

    assert.equal(response.status, 200);
    assert.deepEqual(calls.sendNow, [93]);
    assert.equal(calls.createCampaign.length, 0);
  });

  it("impide programar una campaña en el pasado", async () => {
    const { client, calls } = launchClient();
    const response = await handleLaunch(
      jsonRequest(
        "/api/beta-launch",
        {
          confirmation: "ENVIAR LANZAMIENTO MESA",
          campaignId: "android-launch-2026",
          scheduledAt: "2020-01-01T10:00:00+02:00",
        },
        "Bearer a-long-launch-secret",
      ),
      client,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.findCampaign.length, 0);
  });
});
