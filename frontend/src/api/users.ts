import { apiFetch } from "./api";

export type UserDto = {
  id: string;
  email: string;
  userName: string;
  assignedSquadId: number | null;
  roles: string[];
};

export function getUsers() {
  return apiFetch<UserDto[]>("/api/user");
}