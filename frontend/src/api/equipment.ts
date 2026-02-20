import { apiFetch } from "./api";

export type EquipmentDto = {
  id: number;
  name: string;
  category: string | null;
};

export type CreateEquipmentRequest = {
  name: string;
  category: string | null;
};

export type UpdateEquipmentRequest = {
  name: string;
  category: string | null;
};

export function getEquipment() {
  return apiFetch<EquipmentDto[]>("/api/equipment");
}

export function createEquipment(body: CreateEquipmentRequest) {
  return apiFetch<void>("/api/equipment", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateEquipment(id: number, body: UpdateEquipmentRequest) {
  return apiFetch<void>(`/api/equipment/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteEquipment(id: number) {
  return apiFetch<void>(`/api/equipment/${id}`, {
    method: "DELETE",
  });
}
