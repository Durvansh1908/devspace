import { useState, useCallback, useEffect } from "react";

export interface CodeFile {
  id: string;
  projectId: string;
  domain: string;
  filename: string;
  code: string;
  language: string;
  lastModified: number;
  isSaved: boolean;
}

const STORAGE_KEY = "devspace_code_files";

export function useCodeStorage(projectId: string, domain: string) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load files from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allFiles = JSON.parse(stored) as CodeFile[];
        const projectFiles = allFiles.filter(
          (f) => f.projectId === projectId && f.domain === domain
        );
        setFiles(projectFiles);
      }
    } catch (err) {
      console.error("Failed to load code files:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, domain]);

  // Save file to localStorage and state
  const saveFile = useCallback(
    (code: string, filename: string) => {
      try {
        const fileId = `${projectId}-${domain}-${filename}`;
        const newFile: CodeFile = {
          id: fileId,
          projectId,
          domain,
          filename,
          code,
          language: getLanguageFromFilename(filename),
          lastModified: Date.now(),
          isSaved: true,
        };

        setFiles((prev) => {
          const existing = prev.find((f) => f.filename === filename);
          const updated = existing
            ? prev.map((f) => (f.filename === filename ? newFile : f))
            : [...prev, newFile];

          // Persist all files
          const stored = localStorage.getItem(STORAGE_KEY);
          const allFiles = stored ? (JSON.parse(stored) as CodeFile[]) : [];
          const filtered = allFiles.filter(
            (f) => !(f.projectId === projectId && f.domain === domain && f.filename === filename)
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify([...filtered, newFile]));

          return updated;
        });

        return newFile;
      } catch (err) {
        console.error("Failed to save code file:", err);
        return null;
      }
    },
    [projectId, domain]
  );

  // Get specific file
  const getFile = useCallback(
    (filename: string) => {
      return files.find((f) => f.filename === filename);
    },
    [files]
  );

  // Delete file
  const deleteFile = useCallback(
    (filename: string) => {
      try {
        setFiles((prev) => prev.filter((f) => f.filename !== filename));

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const allFiles = JSON.parse(stored) as CodeFile[];
          const updated = allFiles.filter(
            (f) => !(f.projectId === projectId && f.domain === domain && f.filename === filename)
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }

        return true;
      } catch (err) {
        console.error("Failed to delete code file:", err);
        return false;
      }
    },
    [projectId, domain]
  );

  // Clear all files for this domain
  const clearDomainFiles = useCallback(() => {
    try {
      setFiles([]);

      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allFiles = JSON.parse(stored) as CodeFile[];
        const updated = allFiles.filter(
          (f) => !(f.projectId === projectId && f.domain === domain)
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      return true;
    } catch (err) {
      console.error("Failed to clear domain files:", err);
      return false;
    }
  }, [projectId, domain]);

  return {
    files,
    isLoading,
    saveFile,
    getFile,
    deleteFile,
    clearDomainFiles,
  };
}

// Helper to determine language from filename
function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "csharp",
    rb: "ruby",
    go: "go",
    rs: "rust",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
    json: "json",
    html: "html",
    css: "css",
    scss: "scss",
    md: "markdown",
    sh: "bash",
  };
  return langMap[ext] || "plaintext";
}

// Export for initialization
export const CodeStorageManager = {
  getAllFiles: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CodeFile[]) : [];
    } catch {
      return [];
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  },

  exportFiles: (projectId: string, domain: string) => {
    const files = CodeStorageManager.getAllFiles();
    return files.filter((f) => f.projectId === projectId && f.domain === domain);
  },

  getStats: () => {
    const files = CodeStorageManager.getAllFiles();
    const totalSize = files.reduce((sum, f) => sum + f.code.length, 0);
    const byProject = new Map<string, number>();

    files.forEach((f) => {
      byProject.set(f.projectId, (byProject.get(f.projectId) || 0) + 1);
    });

    return {
      totalFiles: files.length,
      totalSize,
      byProject: Object.fromEntries(byProject),
    };
  },
};
