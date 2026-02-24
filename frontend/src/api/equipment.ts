import { apiFetch } from "./api";

export type EquipmentCategory = "Primary" | "Secondary" | "Melee" | "Utility";

export type EquipmentDto = {
  id: number;
  name: string;
  category: string | null;
  quantity: number;
  deletedAt: string | null;
};

export type CreateEquipmentRequest = {
  name: string;
  category: EquipmentCategory;
  quantity: number; // increment on create
};

export type UpdateEquipmentRequest = {
  category?: EquipmentCategory;
  quantity?: number; // set
};

export async function getEquipment(): Promise<EquipmentDto[]> {
  return apiFetch<EquipmentDto[]>("/api/equipment");
}

export async function createEquipment(payload: CreateEquipmentRequest): Promise<EquipmentDto> {
  return apiFetch<EquipmentDto>("/api/equipment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEquipment(id: number, payload: UpdateEquipmentRequest): Promise<EquipmentDto> {
  return apiFetch<EquipmentDto>(`/api/equipment/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEquipment(id: number): Promise<void> {
  await apiFetch<void>(`/api/equipment/${id}`, { method: "DELETE" });
}