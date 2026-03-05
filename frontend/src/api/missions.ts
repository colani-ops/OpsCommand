import { apiFetch } from "./api";

export type MissionStatus = "Prepared" | "Planned" | "Active" | "Completed" | "Cancelled";

export type MissionDto = {
  id: number;
  name: string;
  status: MissionStatus;
  commanderId: string | null;
  squadId: number | null;
  createdAt: string; // ISO
  createdByUserId: string;
  notes: string | null;
};

export type CreateMissionRequest = {
  name: string;
  commanderId?: string | null;
  notes?: string | null;
};

export type UpdateMissionRequest = {
  name?: string | null;
  notes?: string | null;
  status?: MissionStatus | null;
  // commanderId / clearCommander ne stavljamo ovdje (backend to blokira)
};

export function getMissions() {
  return apiFetch<MissionDto[]>("/api/mission");
}

export function getMyMissions() {
  return apiFetch<MissionDto[]>("/api/mission/my");
}

export function getMission(id: number) {
  return apiFetch<MissionDto>(`/api/mission/${id}`);
}

export function createMission(payload: CreateMissionRequest) {
  return apiFetch<MissionDto>("/api/mission", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMission(id: number, payload: UpdateMissionRequest) {
  return apiFetch<MissionDto>(`/api/mission/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMission(id: number) {
  return apiFetch<void>(`/api/mission/${id}`, { method: "DELETE" });
}

export function assignCommander(missionId: number, commanderId: string) {
  return apiFetch<MissionDto>(`/api/mission/${missionId}/commander`, {
    method: "PATCH",
    body: JSON.stringify({ commanderId }),
  });
}

export function unassignCommander(missionId: number) {
  return apiFetch<MissionDto>(`/api/mission/${missionId}/commander`, {
    method: "DELETE",
  });
}

export function activateMission(id: number) {
  return apiFetch<MissionDto>(`/api/mission/${id}/activate`, { method: "PATCH" });
}

export function completeMission(id: number, notes?: string | null) {
  return apiFetch<MissionDto>(`/api/mission/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ notes: notes ?? null }),
  });
}

export function cancelMission(id: number, notes?: string | null) {
  return apiFetch<MissionDto>(`/api/mission/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ notes: notes ?? null }),
  });
}