// src/CodeEditor.tsx
import Editor, { OnMount } from "@monaco-editor/react";
import { useState, useRef, useEffect, useCallback } from "react";
import AIAssistant from "./AIAssistant";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3001";

const DEFAULT_CODE: Record<string, string> = {
  Frontend: `// Frontend Workspace\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Hello DevSpace</h1>\n    </div>\n  );\n}\n\nexport default App;`,
  Backend: `// Backend Workspace\nimport express from 'express';\n\nconst app = express();\nconst PORT = 3001;\n\napp.get('/', (req, res) => {\n  res.json({ message: 'DevSpace API running' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});`,
  Database: `-- Database Workspace\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);`,
  DevOps: `# DevOps Workspace\nversion: '3.8'\n\nservices:\n  app:\n    build: .\n    ports:\n      - "3001:3001"`,
  "UI/UX": `/* UI/UX Workspace */\n:root {\n  --primary: #6c63ff;\n  --secondary: #00d4ff;\n  --bg: #06060f;\n}`,
};

const LANGUAGE_MAP: Record<string, string> = {
  Frontend: "typescript",
  Backend: "typescript",
  Database: "sql",
  DevOps: "yaml",
  "UI/UX": "css",
};

const CURSOR_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#c77dff", "#ff9f43"];

interface Collaborator {
  socketId: string;
  name: string;
  color: string;
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
  domain,
  memberName,
  projectId,
  userId,
  allDomainCode,
  onBack,
  onCodeChange,
}: CodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CODE[domain] ?? "// Start coding...");
  const [activeFile, setActiveFile] = useState(`${domain.toLowerCase()}.${getExt(domain)}`);
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const [isSaved, setIsSaved] = useState(true);
  const [terminalLines, setTerminalLines] = useState([
    { type: "prompt", text: `devspace@${domain.toLowerCase()}:~$ ready` },
    { type: "success", text: `✓ ${domain} workspace loaded` },
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const myColor = useRef(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);
  const suppressEmit = useRef(false);

  // Socket setup
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
      setCollaborators((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
    });

    socket.on("code-update", ({ code: incoming, domain: d }: { code: string; domain: string }) => {
      if (d !== domain) return;
      suppressEmit.current = true;
      setCode(incoming);
      setTimeout(() => { suppressEmit.current = false; }, 50);
    });

    socket.on("cursor-update", ({ socketId, position, userName, color }: { socketId: string; position: { lineNumber: number; column: number }; userName: string; color: string }) => {
      setCollaborators((prev) => ({
        ...prev,
        [socketId]: { socketId, name: userName, color, position },
      }));
    });

    return () => {
      socket.emit("leave-project", projectId);
      socket.disconnect();
    };
  }, [projectId, domain, memberName, userId]);

  // Render remote cursors in Monaco
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const decorations = Object.values(collaborators)
      .filter((c) => c.position)
      .map((c) => ({
        range: {
          startLineNumber: c.position!.lineNumber,
          startColumn: c.position!.column,
          endLineNumber: c.position!.lineNumber,
          endColumn: c.position!.column + 1,
        },
        options: {
          className: "remote-cursor",
          beforeContentClassName: "remote-cursor-label",
          stickiness: 1,
          zIndex: 100,
          glyphMarginClassName: undefined,
          hoverMessage: { value: c.name },
        },
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
          projectId,
          position: { lineNumber: e.position.lineNumber, column: e.position.column },
          userId,
          userName: memberName,
          color: myColor.current,
        });
      }
    });
  };

  const handleSave = () => {
    setIsSaved(true);
    setTerminalLines((prev) => [
      ...prev,
      { type: "prompt", text: `devspace@${domain.toLowerCase()}:~$ save` },
      { type: "success", text: `✓ ${activeFile} saved` },
    ]);
  };

  const handleRun = () => {
    setTerminalLines((prev) => [
      ...prev,
      { type: "prompt", text: `devspace@${domain.toLowerCase()}:~$ run` },
      { type: "info", text: `▶ Running ${domain} workspace...` },
      { type: "success", text: `✓ Compiled successfully` },
    ]);
  };

  const handleTerminalCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalLines((prev) => [
      ...prev,
      { type: "prompt", text: `devspace@${domain.toLowerCase()}:~$ ${cmd}` },
      { type: "output", text: `Command '${cmd}' executed` },
    ]);
    setTerminalInput("");
  };

  const collabList = Object.values(collaborators);

  return (
    <div className="editor-container">
      {/* Top bar */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="editor-back-btn" onClick={onBack}>←</button>
          <div className="editor-project-info">
            <span className="editor-domain-badge">{domain}</span>
            <span className="editor-member">{memberName}</span>
          </div>
        </div>
        <div className="editor-tabs">
          {["Frontend", "Backend", "Database", "DevOps", "UI/UX"]
            .filter((d) => allDomainCode?.[d] !== undefined || d === domain)
            .map((d) => (
              <div
                key={d}
                className={`editor-tab ${d === domain ? "active" : ""}`}
                style={{ borderTop: d === domain ? `2px solid ${myColor.current}` : undefined }}
              >
                <span className="tab-dot" />
                {d.toLowerCase()}.{getExt(d)}
              </div>
            ))}
        </div>
        <div className="editor-topbar-right">
          <div className="editor-collaborators">
            <div className="collab-avatar" style={{ background: myColor.current }} title={memberName}>
              {memberName[0].toUpperCase()}
            </div>
            {collabList.map((c) => (
              <div key={c.socketId} className="collab-avatar" style={{ background: c.color }} title={c.name}>
                {c.name[0].toUpperCase()}
              </div>
            ))}
            {collabList.length > 0 && (
              <span className="collab-count">{collabList.length + 1} online</span>
            )}
          </div>
          <button className="editor-action-btn run" onClick={handleRun}>▶ Run</button>
          <button className="editor-action-btn save" onClick={handleSave}>
            {isSaved ? "✓ Saved" : "💾 Save"}
          </button>
          <AIAssistant
            code={code}
            domain={domain}
            allDomainCode={allDomainCode}
            onFixApplied={(fixed) => { setCode(fixed); setIsSaved(false); }}
          />
        </div>
      </div>

      {/* Editor body */}
      <div className="editor-body">
        {/* Sidebar */}
        <div className="editor-sidebar">
          <div className="editor-sidebar-title">EXPLORER</div>
          <div className="editor-sidebar-section">
            <p className="editor-sidebar-label">▾ DEVSPACE</p>
            {[
              { name: `${domain.toLowerCase()}.${getExt(domain)}`, icon: "📄" },
              { name: "package.json", icon: "📦" },
              { name: "README.md", icon: "📝" },
            ].map((f) => (
              <div
                key={f.name}
                className={`editor-file ${activeFile === f.name ? "active" : ""}`}
                onClick={() => setActiveFile(f.name)}
              >
                <span>{f.icon}</span> {f.name}
              </div>
            ))}
          </div>

          {collabList.length > 0 && (
            <div className="editor-sidebar-section" style={{ marginTop: "16px" }}>
              <p className="editor-sidebar-label">▾ COLLABORATORS</p>
              {collabList.map((c) => (
                <div key={c.socketId} className="editor-file" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                  {c.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monaco */}
        <div className="editor-main">
          <Editor
            height="100%"
            language={LANGUAGE_MAP[domain] ?? "typescript"}
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

        {/* Terminal */}
        <div className="editor-terminal">
          <div className="terminal-tabs">
            <span className="terminal-tab active">TERMINAL</span>
            <span className="terminal-tab">OUTPUT</span>
            <span className="terminal-tab">PROBLEMS</span>
          </div>
          <div className="terminal-body">
            {terminalLines.map((line, i) => (
              <p key={i} className={`terminal-line ${line.type === "success" ? "terminal-success" : line.type === "info" ? "terminal-info" : ""}`}>
                {line.type === "prompt" ? (
                  <><span className="terminal-prompt">{line.text.split("$ ")[0]}$</span> {line.text.split("$ ")[1]}</>
                ) : line.text}
              </p>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="terminal-prompt">devspace@{domain.toLowerCase()}:~$</span>
              <input
                style={{ background: "transparent", border: "none", outline: "none", color: "#f0f0ff", flex: 1, fontFamily: "monospace", fontSize: "13px" }}
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalCommand}
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}