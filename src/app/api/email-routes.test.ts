import assert from "node:assert/strict";
import { after, beforeEach, describe, it } from "node:test";
import type { Resend } from "resend";
import { handleLaunch } from "./beta-launch/route";
import { handleWaitlist } from "./waitlist/route";

type WaitlistClient = Pick<Resend, "contacts" | "emails">;
type LaunchClient = Pick<Resend, "broadcasts">;

type ProviderResult = {
  data: { id: string } | null;
  error: { name: string; message: string; statusCode: number } | null;
};

const success = (id: string): ProviderResult => ({
  data: { id },
  error: null,
});

const originalEnv = { ...process.env };

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
  createContact?: ProviderResult;
  updateContact?: ProviderResult;
  addToSegment?: ProviderResult;
  sendEmail?: ProviderResult;
}) {
  const calls = {
    createContact: [] as unknown[],
    updateContact: [] as unknown[],
    addToSegment: [] as unknown[],
    sendEmail: [] as unknown[],
  };

  const client = {
    contacts: {
      create: async (payload: unknown) => {
        calls.createContact.push(payload);
        return overrides?.createContact ?? success("contact_1");
      },
      update: async (payload: unknown) => {
        calls.updateContact.push(payload);
        return overrides?.updateContact ?? success("contact_1");
      },
      segments: {
        add: async (payload: unknown) => {
          calls.addToSegment.push(payload);
          return overrides?.addToSegment ?? success("contact_1");
        },
      },
    },
    emails: {
      send: async (payload: unknown, options: unknown) => {
        calls.sendEmail.push({ payload, options });
        return overrides?.sendEmail ?? success("email_1");
      },
    },
  } as unknown as WaitlistClient;

  return { client, calls };
}

function launchClient(result: ProviderResult = success("broadcast_1")) {
  const calls: unknown[] = [];
  const client = {
    broadcasts: {
      create: async (payload: unknown, options: unknown) => {
        calls.push({ payload, options });
        return result;
      },
    },
  } as unknown as LaunchClient;

  return { client, calls };
}

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_SEGMENT_ID = "segment_test";
  process.env.RESEND_FROM_EMAIL = "MESA <hola@mesa.test>";
  process.env.RESEND_REPLY_TO = "hola@mesa.test";
  process.env.NEXT_PUBLIC_SITE_URL = "https://mesa.test";
  process.env.MESA_APP_URL =
    "https://play.google.com/store/apps/details?id=com.mesa";
  process.env.MESA_LAUNCH_SECRET = "a-long-launch-secret";
});

after(() => {
  process.env = originalEnv;
});

describe("POST /api/waitlist", () => {
  it("guarda un contacto nuevo y envía la bienvenida", async () => {
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
    assert.deepEqual(calls.createContact[0], {
      email: "paula@example.com",
      unsubscribed: false,
      segments: [{ id: "segment_test" }],
    });

    const emailCall = calls.sendEmail[0] as {
      payload: { to: string; subject: string; html: string };
      options: { idempotencyKey: string };
    };
    assert.equal(emailCall.payload.to, "paula@example.com");
    assert.equal(emailCall.payload.subject, "Te hemos guardado un sitio en MESA");
    assert.match(emailCall.payload.html, /https:\/\/mesa\.test\/privacidad/);
    assert.match(emailCall.options.idempotencyKey, /^mesa-waitlist-[a-f0-9]{32}$/);
  });

  it("reactiva y conserva en el segmento un contacto existente", async () => {
    const duplicate: ProviderResult = {
      data: null,
      error: {
        name: "validation_error",
        message: "Contact already exists",
        statusCode: 409,
      },
    };
    const { client, calls } = waitlistClient({ createContact: duplicate });

    const response = await handleWaitlist(
      jsonRequest("/api/waitlist", { email: "paula@example.com" }),
      client,
    );
    const payload = await response.json();

    assert.equal(payload.ok, true);
    assert.equal(payload.emailSent, true);
    assert.equal(payload.alreadySubscribed, true);
    assert.deepEqual(calls.updateContact[0], {
      email: "paula@example.com",
      unsubscribed: false,
    });
    assert.deepEqual(calls.addToSegment[0], {
      email: "paula@example.com",
      segmentId: "segment_test",
    });
  });

  it("mantiene la suscripción aunque la bienvenida falle temporalmente", async () => {
    const emailFailure: ProviderResult = {
      data: null,
      error: {
        name: "rate_limit_exceeded",
        message: "Try again later",
        statusCode: 429,
      },
    };
    const { client } = waitlistClient({ sendEmail: emailFailure });

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

  it("rechaza correos inválidos antes de llamar al proveedor", async () => {
    const { client, calls } = waitlistClient();
    const response = await handleWaitlist(
      jsonRequest("/api/waitlist", { email: "no-es-un-email" }),
      client,
    );

    assert.equal(response.status, 400);
    assert.equal(calls.createContact.length, 0);
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
    assert.equal(calls.length, 0);
  });

  it("envía una sola campaña al segmento completo", async () => {
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
      broadcastId: "broadcast_1",
      scheduled: false,
    });

    const broadcastCall = calls[0] as {
      payload: {
        segmentId: string;
        send: boolean;
        subject: string;
        html: string;
      };
      options: { headers: { "Idempotency-Key": string } };
    };
    assert.equal(broadcastCall.payload.segmentId, "segment_test");
    assert.equal(broadcastCall.payload.send, true);
    assert.equal(
      broadcastCall.payload.subject,
      "La mesa está lista: MESA ya está disponible",
    );
    assert.match(
      broadcastCall.payload.html,
      /https:\/\/play\.google\.com\/store\/apps\/details\?id=com\.mesa/,
    );
    assert.equal(
      broadcastCall.options.headers["Idempotency-Key"],
      "mesa-app-launch-android-launch-2026",
    );
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
    assert.equal(calls.length, 0);
  });
});
