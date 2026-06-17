// Shared types between frontend and backend

export type Domain = "Frontend" | "Backend" | "Database" | "DevOps" | "UI/UX";

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ProjectMember {
  id: string;
  project_id?: string;
  projectId?: string;
  name: string;
  domain: Domain | null;
  online?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_by?: string;
  createdBy?: string;
  members: ProjectMember[];
  created_at?: string;
  createdAt?: string;
}

export interface CodeChange {
  projectId: string;
  domain: Domain;
  code: string;
  userId?: string;
  timestamp?: number;
}

export interface CursorPosition {
  projectId: string;
  userId?: string;
  position: number;
  timestamp?: number;
}

export interface UserPresence {
  socketId: string;
  userId?: string;
  projectId: string;
  timestamp: number;
}

export interface ApiError {
  error: string;
  status?: number;
  timestamp?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export const VALID_DOMAINS: Domain[] = ["Frontend", "Backend", "Database", "DevOps", "UI/UX"];
