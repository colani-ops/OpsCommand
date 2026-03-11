import { apiFetch } from "./api";

const LOGIN_PATH = "/api/auth/login";
const REGISTER_PATH = "/api/auth/register";

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  roles: string[];
};

type LoginResponse = {
  id: string;
  token: string;
  email: string;
  userName: string;
  roles: string[];
};

type RegisterRequest = {
  email: string;
  password: string;
  userName?: string;
};

export async function login(email: string, password: string): Promise<void> {
  const res = await apiFetch<LoginResponse>(LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem("token", res.token);
  localStorage.setItem(
  "user",
  JSON.stringify({
    id: res.id,
    email: res.email,
    userName: res.userName,
    roles: res.roles
  } satisfies AuthUser)
);
}

export async function register(payload: RegisterRequest): Promise<string> {
  return apiFetch<string>(REGISTER_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("user");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem("token");
}

export function hasRole(...roles: string[]): boolean {
  const user = getUser();
  if (!user) return false;
  const userRoles = user.roles ?? [];
  return userRoles.some((r) => roles.includes(r));
}

export function getPrimaryRole(): string {
  const user = getUser();
  if (!user || !user.roles?.length) return "Guest";

  const order = ["SuperAdmin", "Admin", "Commander", "Member", "Recruit"];
  for (const r of order) if (user.roles.includes(r)) return r;
  return user.roles[0];
}

