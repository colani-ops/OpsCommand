import { apiFetch } from "./api";

const LOGIN_PATH = "/api/auth/login";
const REGISTER_PATH = "/api/auth/register";

export type AuthUser = {
  id: string;
  email: string;
  userName: string;
  roles: string[];
};

export type AuthResponse = {
  id: string;
  token: string;
  email: string;
  userName: string;
  roles: string[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  userName?: string;
};

export async function login(body: LoginRequest) {
  const result = await apiFetch<AuthResponse>(LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify(body),
  });

  localStorage.setItem("token", result.token);
  localStorage.setItem(
    "user",
    JSON.stringify({
      id: result.id,
      email: result.email,
      userName: result.userName,
      roles: result.roles,
    } satisfies AuthUser)
  );

  return result;
}

export async function register(body: RegisterRequest) {
  return apiFetch<void>(REGISTER_PATH, {
    method: "POST",
    body: JSON.stringify(body),
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
  for (const r of order) {
    if (user.roles.includes(r)) return r;
  }

  return user.roles[0];
}