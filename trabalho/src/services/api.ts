export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let accessToken: string | null = null;

function readableErrorDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return String(item);
      const error = item as { loc?: unknown[]; msg?: unknown };
      const location = Array.isArray(error.loc) ? error.loc.slice(1).join(" → ") : "";
      const message = typeof error.msg === "string" ? error.msg : JSON.stringify(item);
      return location ? `${location}: ${message}` : message;
    });
    return messages.join("; ");
  }
  if (detail && typeof detail === "object") {
    const error = detail as { message?: unknown; msg?: unknown };
    if (typeof error.message === "string") return error.message;
    if (typeof error.msg === "string") return error.msg;
    return JSON.stringify(detail);
  }
  return null;
}

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) {
    throw new ApiError("Configure EXPO_PUBLIC_API_URL no arquivo .env.local.", 0);
  }

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Não foi possível conectar à API. Confira o servidor e a rede Wi-Fi.", 0);
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null) as { detail?: unknown } | null;
  if (!response.ok) {
    const detail = readableErrorDetail(payload?.detail);
    throw new ApiError(detail ?? `A API respondeu com erro ${response.status}.`, response.status);
  }
  return payload as T;
}
