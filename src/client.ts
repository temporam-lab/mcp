export type ApiResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: unknown };

export function getConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env.TEMPORAM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("TEMPORAM_API_KEY is required");
  }
  const raw = process.env.TEMPORAM_API_BASE?.trim() || "https://api.temporam.cn";
  return { apiKey, baseUrl: raw.replace(/\/+$/, "") };
}

export async function request(
  method: string,
  path: string,
  opts?: { query?: Record<string, string | number | undefined>; json?: unknown },
): Promise<ApiResult> {
  const { apiKey, baseUrl } = getConfig();
  const url = new URL(path, `${baseUrl}/`);
  if (opts?.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  };
  let body: string | undefined;
  if (opts?.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.json);
  }
  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let parsed: unknown = text;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = {
        error: { type: "api_error", code: "invalid_response", message: "Non-JSON response" },
      };
    }
  }
  if (!res.ok) {
    return { ok: false, status: res.status, body: parsed };
  }
  return { ok: true, status: res.status, body: parsed };
}

export function toolResult(result: ApiResult): {
  isError: boolean;
  content: Array<{ type: "text"; text: string }>;
} {
  const payload = result.ok
    ? result.body
    : {
        status: result.status,
        ...(isRecord(result.body) ? result.body : { error: result.body }),
      };
  return {
    isError: !result.ok,
    content: [{ type: "text", text: JSON.stringify(payload) }],
  };
}

export function clientError(message: string): {
  isError: true;
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: 0,
          error: { type: "api_error", code: "client_error", message },
        }),
      },
    ],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
