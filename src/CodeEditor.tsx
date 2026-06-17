// src/CodeEditor.tsx
import Editor, { OnMount } from "@monaco-editor/react";
import { useState, useRef, useEffect, useCallback } from "react";
import AIAssistant from "./AIAssistant";
import FileExplorer from "./components/FileExplorer";
import Terminal from "./components/Terminal";
import ThemeToggle from "./components/ThemeToggle";
import { io, Socket } from "socket.io-client";
import { ensureProjectFolder, readFile, saveFile, createFile } from "./api/fileSystem";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

const DEFAULT_CODE: Record<string, string> = {
  Frontend: `// Frontend Workspace\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Hello DevSpace</h1>\n    </div>\n  );\n}\n\nexport default App;`,
  Backend: `// Backend Workspace\nimport express from 'express';\n\nconst app = express();\nconst PORT = 3001;\n\napp.get('/', (req, res) => {\n  res.json({ message: 'DevSpace API running' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});`,
  Database: `-- Database Workspace\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);`,
  DevOps: `# DevOps Workspace\nversion: '3.8'\n\nservices:\n  app:\n    build: .\n    ports:\n      - "3001:3001"`,
  "UI/UX": `/* UI/UX Workspace */\n:root {\n  --primary: #6c63ff;\n  --secondary: #00d4ff;\n  --bg: #06060f;\n}`,
};

const LANGUAGE_MAP: Record<string, string> = {
  Frontend: "typescript", Backend: "typescript", Database: "sql", DevOps: "yaml", "UI/UX": "css",
};

const EXT_MAP: Record<string, string> = {
  tsx: "typescript", ts: "typescript", js: "javascript", jsx: "typescript",
  json: "json", css: "css", html: "html", md: "markdown", sql: "sql", yml: "yaml", yaml: "yaml",
};

const CURSOR_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff", "#ff9f43"];

interface Collaborator {
  socketId: string; name: string; color: string;
  position?: { lineNumber: number; column: number };
}

interface CodeEditorProps {
  domain: string;
  memberName: string;
  projectId?: string;
  userId?: string;
  allDomainCode?: Record<string, string>;
  onBack: () => void;
  onCodeChange?: (domain: string, code: string) => void;
}

function getExt(d: string) {
  if (d === "Database") return "sql";
  if (d === "DevOps") return "yml";
  if (d === "UI/UX") return "css";
  return "tsx";
}

export default function CodeEditor({
  domain, memberName, projectId, userId, allDomainCode, onBack, onCodeChange,
}: CodeEditorProps) {
  const effectiveProjectId = projectId ?? "local";
  const [code, setCode] = useState(DEFAULT_CODE[domain] ?? "// Start coding...");
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [activeFileName, setActiveFileName] = useState(`${domain.toLowerCase()}.${getExt(domain)}`);
  const [projectRoot, setProjectRoot] = useState<string>("");
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const [isSaved, setIsSaved] = useState(true);
  const [isTauri, setIsTauri] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const myColor = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);
  const suppressEmit = useRef(false);

  // Detect Tauri environment — fs/terminal only work in the desktop app
  useEffect(() => {
    setIsTauri(typeof (window as any).__TAURI_INTERNALS__ !== "undefined");
  }, []);

  // Resolve / create the on-disk project folder for this domain
  useEffect(() => {
    if (!isTauri) return;
    ensureProjectFolder(effectiveProjectId, domain)
      .then(setProjectRoot)
      .catch((err) => console.error("Failed to set up project folder:", err));
  }, [isTauri, effectiveProjectId, domain]);

  // Socket setup — real-time collaboration
  useEffect(() => {
    if (!projectId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit("join-project", {
      projectId,
      user: { id: userId || socket.id, name: memberName, color: myColor.current },
    });

    socket.on("user-joined", ({ socketId, user }: { socketId: string; user: { name: string; color: string } }) => {
      setCollaborators((prev) => ({ ...prev, [socketId]: { socketId, name: user.name, color: user.color } }));
    });

    socket.on("user-left", ({ socketId }: { socketId: string }) => {
      setCollaborators((prev) => { const n = { ...prev }; delete n[socketId]; return n; });
    });

    socket.on("code-update", ({ code: incoming, domain: d }: { code: string; domain: string }) => {
      if (d !== domain) return;
      suppressEmit.current = true;
      setCode(incoming);
      setTimeout(() => { suppressEmit.current = false; }, 50);
    });

    socket.on("cursor-update", ({ socketId, position, userName, color }: { socketId: string; position: { lineNumber: number; column: number }; userName: string; color: string }) => {
      setCollaborators((prev) => ({ ...prev, [socketId]: { socketId, name: userName, color, position } }));
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.disconnect();
    };
  }, [projectId, domain, memberName, userId]);

  // Remote cursor decorations
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const decorations = Object.values(collaborators)
      .filter((c) => c.position)
      .map((c) => ({
        range: {
          startLineNumber: c.position!.lineNumber, startColumn: c.position!.column,
          endLineNumber: c.position!.lineNumber, endColumn: c.position!.column + 1,
        },
        options: { className: "remote-cursor", stickiness: 1, zIndex: 100, hoverMessage: { value: c.name } },
      }));
    decorationsRef.current = (editor as any).deltaDecorations(decorationsRef.current, decorations);
  }, [collaborators]);

  const handleCodeChange = useCallback((val: string | undefined) => {
    const newCode = val ?? "";
    setCode(newCode);
    setIsSaved(false);
    onCodeChange?.(domain, newCode);
    if (!suppressEmit.current && projectId && socketRef.current) {
      socketRef.current.emit("code-change", { projectId, code: newCode, domain });
    }
  }, [domain, projectId, onCodeChange]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      if (projectId && socketRef.current) {
        socketRef.current.emit("cursor-move", {
          projectId, position: { lineNumber: e.position.lineNumber, column: e.position.column },
          userId, userName: memberName, color: myColor.current,
        });
      }
    });
  };

  // File selection from the real explorer — reads actual disk content
  const handleFileSelect = async (path: string) => {
    if (!isTauri) return;
    try {
      const content = await readFile(path);
      setCode(content);
      setActiveFilePath(path);
      setActiveFileName(path.split("/").pop() ?? path.split("\\").pop() ?? "file");
      setIsSaved(true);
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  };

  const handleSave = async () => {
    if (isTauri && activeFilePath) {
      try {
        await saveFile(activeFilePath, code);
        setIsSaved(true);
      } catch (err) {
        console.error("Save failed:", err);
      }
    } else if (isTauri && projectRoot) {
      // No file selected yet — create the default domain file
      try {
        const defaultName = `${domain.toLowerCase()}.${getExt(domain)}`;
        const path = await createFile(effectiveProjectId, domain, defaultName, code);
        setActiveFilePath(path);
        setActiveFileName(defaultName);
        setIsSaved(true);
      } catch (err) {
        console.error("Save failed:", err);
      }
    } else {
      setIsSaved(true); // web fallback — nothing to persist to disk
    }
  };

  const detectedLanguage = (() => {
    const ext = activeFileName.split(".").pop()?.toLowerCase() ?? "";
    return EXT_MAP[ext] ?? LANGUAGE_MAP[domain] ?? "typescript";
  })();

  const collabList = Object.values(collaborators);

  return (
    <div className="editor-container">
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="editor-back-btn" onClick={onBack}>←</button>
          <div className="editor-project-info">
            <span className="editor-domain-badge">{domain}</span>
            <span className="editor-member">{memberName}</span>
          </div>
        </div>
        <div className="editor-tabs">
          <div className="editor-tab active" style={{ borderTop: `2px solid ${myColor.current}` }}>
            <span className="tab-dot" />
            {activeFileName}
          </div>
        </div>
        <div className="editor-topbar-right">
          <ThemeToggle />
          <div className="editor-collaborators">
            <div className="collab-avatar" style={{ background: myColor.current }} title={memberName}>
              {memberName[0].toUpperCase()}
            </div>
            {collabList.map((c) => (
              <div key={c.socketId} className="collab-avatar" style={{ background: c.color }} title={c.name}>
                {c.name[0].toUpperCase()}
              </div>
            ))}
            {collabList.length > 0 && <span className="collab-count">{collabList.length + 1} online</span>}
          </div>
          <button className="editor-action-btn save" onClick={handleSave}>
            {isSaved ? "✓ Saved" : "💾 Save"}
          </button>
          <AIAssistant
            code={code} domain={domain} allDomainCode={allDomainCode}
            onFixApplied={(fixed) => { setCode(fixed); setIsSaved(false); }}
          />
        </div>
      </div>

      <div className="editor-body" style={{ display: "flex", position: "relative", flex: 1, overflow: "hidden" }}>
        {isTauri ? (
          <FileExplorer
            projectId={effectiveProjectId}
            domain={domain}
            activeFilePath={activeFilePath}
            onFileSelect={handleFileSelect}
          />
        ) : (
          <div className="file-explorer">
            <div className="file-explorer-header"><span>EXPLORER</span></div>
            <div className="file-explorer-section">
              <p className="file-explorer-empty">File system access requires the DevSpace desktop app. Running in browser preview mode — changes aren't saved to disk.</p>
            </div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              language={detectedLanguage}
              value={code}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: true },
                lineNumbers: "on",
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
                padding: { top: 16 },
                renderLineHighlight: "all",
                bracketPairColorization: { enabled: true },
              }}
            />
          </div>

          <div style={{ height: "200px", borderTop: "1px solid #3c3c3c", flexShrink: 0 }}>
            {isTauri && projectRoot ? (
              <Terminal cwd={projectRoot} />
            ) : (
              <div className="real-terminal">
                <div className="real-terminal-body">
                  <div className="real-terminal-line real-terminal-info">
                    Terminal requires the DevSpace desktop app to access your OS shell.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}