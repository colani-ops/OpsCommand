import { apiFetch } from "./api";

export type UserDto = {
  id: string;
  email: string;
  userName: string;
  assignedSquadId: number | null;
  roles: string[];
};

export type UserProfileDto = {
  id: string;
  email: string;
  userName: string | null;
  assignedSquadId: number | null;
  primaryRole: string | null;
  isActive: boolean;
};

export type AdminUpdateUserRequest = {
  role: string;
  assignedSquadId: number | null;
};

export function getUsers() {
  return apiFetch<UserDto[]>("/api/user");
}

export function getMe() {
  return apiFetch<UserDto>("/api/user/me");
}

export function getUserProfile(id: string) {
  return apiFetch<UserProfileDto>(`/api/user/${id}/profile`);
}

export function getPendingUsers() {
  return apiFetch<UserDto[]>("/api/user/pending");
}

export function approveUser(id: string) {
  return apiFetch<void>(`/api/user/${id}/approve`, {
    method: "POST",
  });
}

export function updateUserByAdmin(id: string, payload: AdminUpdateUserRequest) {
  return apiFetch<UserDto>(`/api/user/${id}/admin`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function disableUser(id: string) {
  return apiFetch<void>(`/api/user/${id}`, {
    method: "DELETE",
  });
}

export function restoreUser(id: string) {
  return apiFetch<void>(`/api/user/${id}/restore`, {
    method: "POST",
  });
}