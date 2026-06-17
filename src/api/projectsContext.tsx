// src/api/projectsContext.tsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import type { Project, ProjectMember } from "../types/shared";
import { api } from "./client";

interface ProjectsContextType {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (
    name: string,
    description?: string,
    members?: ProjectMember[]
  ) => Promise<Project | null>;
  updateProject: (
    id: string,
    name: string,
    description?: string
  ) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  setActiveProject: (project: Project | null) => void;

  clearError: () => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined
);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const fetchProjects = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      const fetchedProjects = await api.getProjects();
      setProjects(fetchedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (id: string) => {
    try {
      setError(null);
      return await api.getProject(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch project");
      return null;
    }
  }, []);

  const createProject = useCallback(
    async (name: string, description?: string, members?: ProjectMember[]) => {
      try {
        setError(null);
        setIsLoading(true);
        const newProject = await api.createProject(name, description, members);
        setProjects((prev) => [...prev, newProject]);
        setActiveProject(newProject);
        return newProject;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create project"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, name: string, description?: string) => {
      try {
        setError(null);
        setIsLoading(true);
        const updated = await api.updateProject(id, name, description);
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
        if (activeProject?.id === id) setActiveProject(updated);
        return updated;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update project"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [activeProject]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        setError(null);
        setIsLoading(true);
        await api.deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProject?.id === id) setActiveProject(null);
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete project"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [activeProject]
  );

  const handleSetActiveProject = useCallback((project: Project | null) => {
    setActiveProject(project);
    clearError();
  }, [clearError]);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        error,
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
        setActiveProject: handleSetActiveProject,
        clearError,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within ProjectsProvider");
  }
  return context;
}