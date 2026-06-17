// src/components/FileExplorer.tsx
import { useState, useEffect, useCallback } from "react";
import {
  listFiles, createFile, createFolder, deleteFile, renameFile, FileNode,
} from "../api/fileSystem";

interface FileExplorerProps {
  projectId: string;
  domain: string;
  activeFilePath: string | null;
  onFileSelect: (path: string) => void;
}

export default function FileExplorer({ projectId, domain, activeFilePath, onFileSelect }: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const [newName, setNewName] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const f = await listFiles(projectId, domain);
      setFiles(f.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      }));
    } catch (err) {
      console.error("Failed to list files:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, domain]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!newName.trim()) { setCreating(null); return; }
    try {
      if (creating === "file") await createFile(projectId, domain, newName.trim());
      else if (creating === "folder") await createFolder(projectId, domain, newName.trim());
      setNewName("");
      setCreating(null);
      await refresh();
    } catch (err) {
      console.error("Create failed:", err);
    }
  };

  const handleRename = async (oldPath: string) => {
    if (!renameValue.trim()) { setRenamingPath(null); return; }
    const dir = oldPath.substring(0, oldPath.lastIndexOf("/"));
    const newPath = `${dir}/${renameValue.trim()}`;
    try {
      await renameFile(oldPath, newPath);
      setRenamingPath(null);
      await refresh();
    } catch (err) {
      console.error("Rename failed:", err);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await deleteFile(path);
      setContextMenu(null);
      await refresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    const map: Record<string, string> = {
      tsx: "⚛️", ts: "🔷", js: "💛", jsx: "⚛️", json: "📋",
      css: "🎨", html: "🌐", md: "📝", sql: "🗄️", yml: "⚙️", yaml: "⚙️",
    };
    return map[ext ?? ""] ?? "📄";
  };

  return (
    <div className="file-explorer" onClick={() => setContextMenu(null)}>
      <div className="file-explorer-header">
        <span>EXPLORER</span>
        <div className="file-explorer-actions">
          <button title="New File" onClick={() => { setCreating("file"); setNewName(""); }}>📄+</button>
          <button title="New Folder" onClick={() => { setCreating("folder"); setNewName(""); }}>📁+</button>
          <button title="Refresh" onClick={refresh}>↻</button>
        </div>
      </div>

      <div className="file-explorer-section">
        <p className="file-explorer-label">▾ {domain.toUpperCase()}</p>

        {loading && <div className="file-explorer-loading">Loading...</div>}

        {creating && (
          <div className="file-explorer-new-row">
            <span>{creating === "file" ? "📄" : "📁"}</span>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(null); }}
              onBlur={handleCreate}
              placeholder={creating === "file" ? "filename.tsx" : "folder-name"}
            />
          </div>
        )}

        {!loading && files.length === 0 && !creating && (
          <p className="file-explorer-empty">No files yet — create one above</p>
        )}

        {files.map((f) => (
          <div
            key={f.path}
            className={`editor-file ${activeFilePath === f.path ? "active" : ""}`}
            onClick={() => !f.isDirectory && onFileSelect(f.path)}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, path: f.path }); }}
          >
            {renamingPath === f.path ? (
              <input
                autoFocus
                className="file-explorer-rename-input"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(f.path); if (e.key === "Escape") setRenamingPath(null); }}
                onBlur={() => handleRename(f.path)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span>{f.isDirectory ? "📁" : getFileIcon(f.name)}</span> {f.name}
              </>
            )}
          </div>
        ))}
      </div>

      {contextMenu && (
        <div className="file-context-menu" style={{ top: contextMenu.y, left: contextMenu.x }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setRenamingPath(contextMenu.path); setRenameValue(contextMenu.path.split("/").pop() ?? ""); setContextMenu(null); }}>
            ✏️ Rename
          </button>
          <button onClick={() => handleDelete(contextMenu.path)} className="file-context-danger">
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
}