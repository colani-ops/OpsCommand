import { apiFetch } from "./api";

export type EquipmentCategory = "Primary" | "Secondary" | "Melee" | "Utility";

export type EquipmentDto = {
  id: number;
  name: string;
  category: EquipmentCategory | string | null;
  quantity: number;
  description: string | null;
  effectiveness: number;
  deletedAt: string | null;
  allocatedQuantity: number;
  availableQuantity: number;
};

export type CreateEquipmentRequest = {
  name: string;
  category: EquipmentCategory;
  quantity: number;
  description?: string | null;
  effectiveness: number;
};

export type UpdateEquipmentRequest = {
  category?: EquipmentCategory;
  quantity?: number;
  description?: string | null;
  effectiveness?: number;
};

export function getEquipment() {
  return apiFetch<EquipmentDto[]>("/api/equipment");
}

export function getEquipmentById(id: number) {
  return apiFetch<EquipmentDto>(`/api/equipment/${id}`);
}

export function createEquipment(body: CreateEquipmentRequest) {
  return apiFetch<EquipmentDto>("/api/equipment", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateEquipment(id: number, body: UpdateEquipmentRequest) {
  return apiFetch<EquipmentDto>(`/api/equipment/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function deleteEquipment(id: number) {
  return apiFetch<void>(`/api/equipment/${id}`, {
    method: "DELETE",
  });
}