// src/components/Terminal.tsx
import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TerminalLine {
  type: "input" | "output" | "error" | "info";
  text: string;
}

interface TerminalProps {
  cwd: string; // working directory, e.g. $HOME/devspace-projects/<project>/<domain>
}

export default function Terminal({ cwd }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: "info", text: `DevSpace Terminal — ${cwd}` },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [running, setRunning] = useState(false);
  const [platform, setPlatform] = useState<string>("unknown");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    invoke<string>("get_platform").then(setPlatform).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const runCommand = async () => {
    const cmd = input.trim();
    if (!cmd || running) return;

    setLines((prev) => [...prev, { type: "input", text: cmd }]);
    setHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");
    setRunning(true);

    // Built-in client-side commands
    if (cmd === "clear") {
      setLines([]);
      setRunning(false);
      return;
    }

    try {
      const output = await invoke<string>("run_terminal_command", { command: cmd, cwd });
      if (output.trim()) {
        setLines((prev) => [...prev, { type: "output", text: output.trimEnd() }]);
      }
    } catch (err) {
      setLines((prev) => [...prev, { type: "error", text: String(err) }]);
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      runCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
      } else {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
    }
  };

  const promptSymbol = platform === "windows" ? "PS>" : "$";

  return (
    <div className="real-terminal">
      <div className="real-terminal-body">
        {lines.map((line, i) => (
          <div key={i} className={`real-terminal-line real-terminal-${line.type}`}>
            {line.type === "input" ? (
              <>
                <span className="real-terminal-prompt">{promptSymbol}</span> {line.text}
              </>
            ) : (
              line.text
            )}
          </div>
        ))}
        {running && (
          <div className="real-terminal-line real-terminal-info">
            <span className="real-terminal-spinner" /> Running...
          </div>
        )}
        <div className="real-terminal-input-row">
          <span className="real-terminal-prompt">{promptSymbol}</span>
          <input
            className="real-terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            autoFocus
            spellCheck={false}
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}