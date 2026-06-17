// src/api/client.ts
// Frontend API client with type safety

import type { Project, User, ApiResponse } from "../types/shared";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken() {
    return this.token || localStorage.getItem("auth_token");
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async signup(name: string, email: string, password: string) {
    const res = await this.request<{ token: string; user: User }>(
      "POST",
      "/auth/signup",
      { name, email, password }
    );
    this.setToken(res.token);
    return res.user;
  }

  async login(email: string, password: string) {
    const res = await this.request<{ token: string; user: User }>(
      "POST",
      "/auth/login",
      { email, password }
    );
    this.setToken(res.token);
    return res.user;
  }

  async getMe() {
    return this.request<User>("GET", "/auth/me");
  }

  async logout() {
    this.clearToken();
  }

  // Projects
  async getProjects() {
    return this.request<Project[]>("GET", "/projects");
  }

  async getProject(id: string) {
    return this.request<Project>("GET", `/projects/${id}`);
  }

  async createProject(name: string, description?: string, members?: ProjectMember[]) {
    return this.request<Project>("POST", "/projects", {
      name,
      description,
      members,
    });
  }

  async updateProject(id: string, name: string, description?: string) {
    return this.request<Project>("PUT", `/projects/${id}`, {
      name,
      description,
    });
  }

  async deleteProject(id: string) {
    return this.request<ApiResponse>("DELETE", `/projects/${id}`);
  }
}

// Missing import — add this after the imports block above
import type { ProjectMember } from "../types/shared";

export const api = new ApiClient();