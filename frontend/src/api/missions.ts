import { apiFetch } from "./api";

export type MissionStatus = "Prepared" | "Planned" | "Active" | "Completed" | "Cancelled";
export type MissionTerrain = "Urban" | "Plains" | "Forest" | "Mountain";
export type MissionDifficulty =
  | "Very Low"
  | "Low"
  | "Medium"
  | "High"
  | "Very High";

export type MissionDto = {
  id: number;
  name: string;
  status: MissionStatus;
  commanderId: string | null;
  squadId: number | null;
  createdAt: string;
  createdByUserId: string;
  notes: string | null;

  terrain: MissionTerrain | null;
  difficulty: MissionDifficulty | null;

  successChanceSnapshot: number | null;
  wasSuccessful: boolean | null;
  executedAt: string | null;

  activatedAt: string | null;
  durationMinutes: number | null;
};

export type MissionExecutionResultDto = {
  missionId: number;
  missionName: string;
  terrain: string;
  difficulty: string;
  baseScore: number;
  equipmentScore: number;
  modifierScore: number;
  finalScore: number;
  successChance: number;
  wasSuccessful: boolean;
  outcome: string;
};

export type CreateMissionRequest = {
  name: string;
  commanderId?: string | null;
  notes?: string | null;
  terrain?: MissionTerrain | null;
  difficulty?: MissionDifficulty | null;
};

export type UpdateMissionRequest = {
  name?: string | null;
  notes?: string | null;
  terrain?: MissionTerrain | null;
  difficulty?: MissionDifficulty | null;
};

export type ActivateMissionRequest = {
  durationMinutes: number;
};

export type MissionReadinessDto = {
  missionId: number;
  missionName: string;
  status: string;
  commanderId: string | null;
  squadId: number | null;
  terrain: string;
  difficulty: string;
  baseScore: number;
  difficultyModifier: number;
  equipmentScore: number;
  finalScore: number;
  projectedSuccessChance: number;
  recommendedCategories: string[];
  readinessLabel: string;
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

export function activateMission(id: number, payload: ActivateMissionRequest) {
  return apiFetch<MissionDto>(`/api/mission/${id}/activate`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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

export function executeMission(id: number) {
  return apiFetch<MissionExecutionResultDto>(`/api/mission/${id}/execute`, {
    method: "POST",
  });
}

export function getMissionReadiness(id: number) {
  return apiFetch<MissionReadinessDto>(`/api/mission/${id}/readiness`);
}