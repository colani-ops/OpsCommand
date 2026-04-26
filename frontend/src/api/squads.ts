import { apiFetch } from "./api";
import { resolveUserImageUrl } from "./users";

export type SquadType = "Assault" | "Tactical" | "Recon";

export type SquadDto = {
  id: number;
  name: string;
  type: SquadType | string;
  commanderId: string | null;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
  missionsServed: number;
  missionsWon: number;
  bannerImageUrl?: string | null;
};

export type SquadMemberDto = {
  id: string;
  email: string;
  userName: string | null;
  role: string;
  isActive: boolean;
  profileImageUrl?: string | null;
};

export type MySquadDto = {
  id: number;
  name: string;
  type: SquadType | string;
  commanderId: string | null;
  commanderName: string | null;
  missionsServed: number;
  missionsWon: number;
  successRate: number;
  bannerImageUrl?: string | null;
  members: SquadMemberDto[];
};

export type SquadProfileDto = {
  id: number;
  name: string;
  type: SquadType | string | null;
  commanderId: string | null;
  commanderName: string | null;
  isActive: boolean;
  createdAt: string;
  deletedAt: string | null;
  missionsServed: number;
  missionsWon: number;
  successRate: number;
  bannerImageUrl?: string | null;
  equipment: SquadEquipmentDto[];
  members: SquadMemberDto[];
};

export type SquadEquipmentDto = {
  squadId: number;
  equipmentId: number;
  equipmentName: string;
  category: string | null;
  quantity: number;
};

export type AddSquadEquipmentRequest = {
  equipmentId: number;
  quantity: number;
};

export type UpdateSquadEquipmentRequest = {
  quantity: number;
};

export type CreateSquadRequest = {
  name: string;
  type: SquadType;
  commanderId: string | null;
};

export type UpdateSquadRequest = {
  name: string;
  type: SquadType;
  commanderId: string | null;
};

export function getSquads() {
  return apiFetch<SquadDto[]>("/api/squad");
}

export function getSquad(id: number) {
  return apiFetch<SquadDto>(`/api/squad/${id}`);
}

export function getSquadProfile(id: number) {
  return apiFetch<SquadProfileDto>(`/api/squad/${id}/profile`);
}

export function getMySquad() {
  return apiFetch<MySquadDto | null>("/api/squad/my");
}

export function createSquad(body: CreateSquadRequest) {
  return apiFetch<SquadDto>("/api/squad", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateSquad(id: number, body: UpdateSquadRequest) {
  return apiFetch<SquadDto>(`/api/squad/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteSquad(id: number) {
  return apiFetch<void>(`/api/squad/${id}`, { method: "DELETE" });
}

export function getSquadEquipment(squadId: number) {
  return apiFetch<SquadEquipmentDto[]>(`/api/squad/${squadId}/equipment`);
}

export function addSquadEquipment(squadId: number, body: AddSquadEquipmentRequest) {
  return apiFetch<SquadEquipmentDto>(`/api/squad/${squadId}/equipment`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateSquadEquipment(
  squadId: number,
  equipmentId: number,
  body: UpdateSquadEquipmentRequest
) {
  return apiFetch<SquadEquipmentDto>(`/api/squad/${squadId}/equipment/${equipmentId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteSquadEquipment(squadId: number, equipmentId: number) {
  return apiFetch<void>(`/api/squad/${squadId}/equipment/${equipmentId}`, {
    method: "DELETE",
  });
}

export function resolveSquadMemberImageUrl(path?: string | null) {
  return resolveUserImageUrl(path);
}