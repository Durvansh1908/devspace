// src/types/shared.ts
// Single source of truth for types used across the frontend.
// These mirror server/src/types/index.ts — keep in sync manually,
// or replace with a shared workspace package if the monorepo grows.

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface ProjectMember {
  userId: string;
  role: "owner" | "editor" | "viewer";
  user?: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}