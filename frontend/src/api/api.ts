const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

function getToken(): string | null {
  return localStorage.getItem("token");
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null as T;

  const text = await res.text();
  const data = text ? tryParseJson(text) : null;

  if (!res.ok) {
    // Ako je JSON, pokušaj izvući message/title/error; ako nije, koristi raw tekst
    const message =
      (data && (data.message || data.title || data.error)) ||
      (text && text.trim()) ||
      `Request failed (${res.status})`;

    throw new Error(message);
  }

  // Ako je backend vratio text koji nije JSON, backend bug ili mismatch
  if (data === null && text) {
    // crash safeguard
    return text as unknown as T;
  }

  return data as T;
}
