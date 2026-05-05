import { apiFetch } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type UserDto = {
  id: string;
  email: string;
  userName: string;
  assignedSquadId: number | null;
  roles: string[];
  isActive?: boolean;
  profileImageUrl?: string | null;
};

export type UserProfileEquipmentSummaryDto = {
  primary: string[];
  secondary: string[];
  melee: string[];
  utility: string[];
};

export type UserProfileDto = {
  id: string;
  email: string;
  userName: string | null;
  assignedSquadId: number | null;
  primaryRole: string | null;
  isActive: boolean;
  profileImageUrl?: string | null;
  equipmentSummary?: UserProfileEquipmentSummaryDto;
};

export type AdminUpdateUserRequest = {
  role: string;
  assignedSquadId: number | null;
};

export type UpdateMeRequest = {
  userName?: string | null;
  email?: string | null;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export function resolveUserImageUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

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

export function updateMe(payload: UpdateMeRequest) {
  return apiFetch<UserDto>("/api/user/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function changeMyPassword(payload: ChangePasswordRequest) {
  return apiFetch<void>("/api/user/me/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadMyProfileImage(file: File) {
  const token = localStorage.getItem("token");

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/user/me/profile-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to upload profile image.");
  }

  return response.json() as Promise<{ profileImageUrl: string }>;
}

export async function deleteMyProfileImage() {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE_URL}/api/user/me/profile-image`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to delete profile image.");
  }
}
