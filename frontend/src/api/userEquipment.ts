import { apiFetch } from "./api";

export type UserEquipmentDto = {
  equipmentId: number;
  equipmentName: string;
  category: string | null;
  quantity: number;
};

export type AddUserEquipmentRequest = {
  equipmentId: number;
  quantity: number;
};

export type UpdateUserEquipmentRequest = {
  quantity: number;
};

export function getAvailableUserEquipment() {
  return apiFetch<UserEquipmentDto[]>("/api/userequipment/available");
}

export function getMyUserEquipment() {
  return apiFetch<UserEquipmentDto[]>("/api/userequipment/me");
}

export function addMyUserEquipment(body: AddUserEquipmentRequest) {
  return apiFetch<UserEquipmentDto>("/api/userequipment/me", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateMyUserEquipment(equipmentId: number, body: UpdateUserEquipmentRequest) {
  return apiFetch<UserEquipmentDto>(`/api/userequipment/me/${equipmentId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteMyUserEquipment(equipmentId: number) {
  return apiFetch<void>(`/api/userequipment/me/${equipmentId}`, {
    method: "DELETE",
  });
}