import Editor from "@monaco-editor/react";
import { useState } from "react";

const DEFAULT_CODE: Record<string, string> = {
  Frontend: `// Frontend Workspace\nimport React from 'react';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>Hello DevSpace</h1>\n    </div>\n  );\n}\n\nexport default App;`,
  Backend: `// Backend Workspace\nimport express from 'express';\n\nconst app = express();\nconst PORT = 3001;\n\napp.get('/', (req, res) => {\n  res.json({ message: 'DevSpace API running' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server running on port \${PORT}\`);\n});`,
  Database: `-- Database Workspace\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE TABLE projects (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  description TEXT,\n  created_by INTEGER REFERENCES users(id)\n);`,
  DevOps: `# DevOps Workspace\nversion: '3.8'\n\nservices:\n  app:\n    build: .\n    ports:\n      - "3001:3001"\n    environment:\n      - NODE_ENV=production\n  \n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_DB: devspace\n      POSTGRES_PASSWORD: secret`,
  "UI/UX": `/* UI/UX Workspace */\n:root {\n  --primary: #6c63ff;\n  --secondary: #00d4ff;\n  --bg: #06060f;\n  --text: #f0f0ff;\n}\n\n.container {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  background: var(--bg);\n}`,
};

const LANGUAGE_MAP: Record<string, string> = {
  Frontend: "typescript",
  Backend: "typescript",
  Database: "sql",
  DevOps: "yaml",
  "UI/UX": "css",
};

interface CodeEditorProps {
  domain: string;
  memberName: string;
  onBack: () => void;
}

export default function CodeEditor({ domain, memberName, onBack }: CodeEditorProps) {
  const [code, setCode] = useState(DEFAULT_CODE[domain] ?? "// Start coding...");
  const [activeFile, setActiveFile] = useState(`${domain.toLowerCase()}.${getExt(domain)}`);

  function getExt(d: string) {
    if (d === "Database") return "sql";
    if (d === "DevOps") return "yml";
    if (d === "UI/UX") return "css";
    return "tsx";
  }

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
          <div className="editor-tab active">
            <span className="tab-dot" />
            {activeFile}
          </div>
        </div>
        <div className="editor-topbar-right">
          <button className="editor-action-btn">▶ Run</button>
          <button className="editor-action-btn">💾 Save</button>
          <div className="editor-collaborators">
            <div className="collab-avatar">{memberName[0]}</div>
          </div>
        </div>
      </div>

      {/* Editor body */}
      <div className="editor-body">
        {/* File explorer sidebar */}
        <div className="editor-sidebar">
          <div className="editor-sidebar-title">EXPLORER</div>
          <div className="editor-sidebar-section">
            <p className="editor-sidebar-label">▾ DEVSPACE</p>
            <div className={`editor-file active`} onClick={() => setActiveFile(`${domain.toLowerCase()}.${getExt(domain)}`)}>
              <span>📄</span> {domain.toLowerCase()}.{getExt(domain)}
            </div>
            <div className="editor-file" onClick={() => setActiveFile("package.json")}>
              <span>📦</span> package.json
            </div>
            <div className="editor-file" onClick={() => setActiveFile("README.md")}>
              <span>📝</span> README.md
            </div>
          </div>
        </div>

        {/* Monaco editor */}
        <div className="editor-main">
          <Editor
            height="100%"
            language={LANGUAGE_MAP[domain] ?? "typescript"}
            value={code}
            onChange={(val) => setCode(val ?? "")}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
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

        {/* Terminal panel */}
        <div className="editor-terminal">
          <div className="terminal-tabs">
            <span className="terminal-tab active">TERMINAL</span>
            <span className="terminal-tab">OUTPUT</span>
            <span className="terminal-tab">PROBLEMS</span>
          </div>
          <div className="terminal-body">
            <p className="terminal-line"><span className="terminal-prompt">devspace@{domain.toLowerCase()}:~$</span> ready</p>
            <p className="terminal-line terminal-success">✓ {domain} workspace loaded</p>
            <p className="terminal-line"><span className="terminal-prompt">devspace@{domain.toLowerCase()}:~$</span> <span className="terminal-cursor">▋</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}