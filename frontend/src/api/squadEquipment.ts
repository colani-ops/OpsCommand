import { apiFetch } from "./api";

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