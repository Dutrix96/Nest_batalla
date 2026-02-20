import { http } from "../lib/http";
import type { CreateUserDto, UpdateUserDto, User } from "./types";

// ranking (jwt required)
export function apiRanking(take: number = 50, token?: string) {
  return http<User[]>(`/users/ranking?take=${take}`, { method: "GET", token });
}

// ===== admin crud (role ADMIN) =====
export function apiUsersList(token?: string) {
  return http<User[]>("/users", { method: "GET", token });
}

export function apiUsersGet(id: number, token?: string) {
  return http<User>(`/users/${id}`, { method: "GET", token });
}

export function apiUsersCreate(dto: CreateUserDto, token?: string) {
  return http<User>("/users", { method: "POST", token, body: dto });
}

export function apiUsersUpdate(id: number, dto: UpdateUserDto, token?: string) {
  return http<User>(`/users/${id}`, { method: "PATCH", token, body: dto });
}

export function apiUsersDelete(id: number, token?: string) {
  return http<User>(`/users/${id}`, { method: "DELETE", token });
}