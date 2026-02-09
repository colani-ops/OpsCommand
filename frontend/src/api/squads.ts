import { apiFetch } from "./api";

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
