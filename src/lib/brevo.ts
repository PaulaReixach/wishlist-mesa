const BREVO_API_URL = "https://api.brevo.com/v3";

export type BrevoSender = {
  email: string;
  name: string;
};

export type BrevoCampaign = {
  id: number;
  name: string;
  status: string;
};

export type TransactionalEmail = {
  sender: BrevoSender;
  to: Array<{ email: string }>;
  replyTo?: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent: string;
  tags?: string[];
};

export type EmailCampaign = {
  name: string;
  sender: BrevoSender;
  replyTo?: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  recipients: { listIds: number[] };
  scheduledAt?: string;
  tag: string;
};

export interface BrevoClient {
  contactExists(email: string): Promise<boolean>;
  upsertContact(email: string, listId: number): Promise<void>;
  sendTransactionalEmail(email: TransactionalEmail): Promise<string>;
  findCampaignByName(name: string): Promise<BrevoCampaign | null>;
  createCampaign(campaign: EmailCampaign): Promise<number>;
  scheduleCampaign(campaignId: number, scheduledAt: string): Promise<void>;
  sendCampaignNow(campaignId: number): Promise<void>;
}

export class BrevoApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BrevoApiError";
  }
}

type BrevoErrorBody = {
  code?: string;
  message?: string;
};

export class BrevoHttpClient implements BrevoClient {
  constructor(private readonly apiKey: string) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    headers.set("api-key", this.apiKey);

    if (init.body) {
      headers.set("content-type", "application/json");
    }

    const response = await fetch(`${BREVO_API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const rawBody = await response.text();
    let body: unknown = null;

    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const error = (body ?? {}) as BrevoErrorBody;
      throw new BrevoApiError(
        response.status,
        error.code ?? "brevo_api_error",
        error.message ?? "Brevo no ha podido completar la solicitud.",
      );
    }

    return body as T;
  }

  async contactExists(email: string) {
    const identifier = encodeURIComponent(email);

    try {
      await this.request(`/contacts/${identifier}?identifierType=email_id`);
      return true;
    } catch (error) {
      if (error instanceof BrevoApiError && error.status === 404) {
        return false;
      }

      throw error;
    }
  }

  async upsertContact(email: string, listId: number) {
    await this.request("/contacts", {
      method: "POST",
      body: JSON.stringify({
        email,
        emailBlacklisted: false,
        listIds: [listId],
        updateEnabled: true,
      }),
    });
  }

  async sendTransactionalEmail(email: TransactionalEmail) {
    const result = await this.request<{ messageId?: string }>("/smtp/email", {
      method: "POST",
      body: JSON.stringify(email),
    });

    return result?.messageId ?? "accepted";
  }

  async findCampaignByName(name: string) {
    const limit = 100;
    let offset = 0;

    while (true) {
      const query = new URLSearchParams({
        type: "classic",
        limit: String(limit),
        offset: String(offset),
        sort: "desc",
      });
      const result = await this.request<{
        campaigns?: BrevoCampaign[];
        count?: number;
      }>(`/emailCampaigns?${query.toString()}`);
      const campaigns = result.campaigns ?? [];
      const match = campaigns.find((campaign) => campaign.name === name);

      if (match) {
        return match;
      }

      offset += campaigns.length;

      if (
        campaigns.length < limit ||
        (typeof result.count === "number" && offset >= result.count)
      ) {
        return null;
      }
    }
  }

  async createCampaign(campaign: EmailCampaign) {
    const result = await this.request<{ id: number }>("/emailCampaigns", {
      method: "POST",
      body: JSON.stringify(campaign),
    });

    return result.id;
  }

  async scheduleCampaign(campaignId: number, scheduledAt: string) {
    await this.request(`/emailCampaigns/${campaignId}`, {
      method: "PUT",
      body: JSON.stringify({ scheduledAt }),
    });
  }

  async sendCampaignNow(campaignId: number) {
    await this.request(`/emailCampaigns/${campaignId}/sendNow`, {
      method: "POST",
    });
  }
}

export function brevoErrorCode(error: unknown) {
  return error instanceof BrevoApiError ? error.code : "unknown_error";
}
