// src/AIAssistant.tsx
import { useState } from "react";

interface AIAssistantProps {
  code: string;
  domain: string;
  allDomainCode?: Record<string, string>;
  onFixApplied: (fixedCode: string) => void;
}

type Message = {
  role: "user" | "ai";
  text: string;
  fixedCode?: string;
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function AIAssistant({ code, domain, allDomainCode, onFixApplied }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "analyze" | "cross">("analyze");

  const callAI = async (type: string, extra: Record<string, unknown> = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, domain, type, ...extra }),
      });
      if (!res.ok) throw new Error("Server error");
      return await res.json();
    } catch {
      return { text: "Error connecting to AI. Make sure the server is running.", fixedCode: undefined };
    } finally {
      setLoading(false);
    }
  };

  const analyzeCode = async () => {
    setActiveTab("analyze");
    setMessages([]);
    const data = await callAI("analyze");
    setMessages([{ role: "ai", text: data.text, fixedCode: data.fixedCode }]);
  };

  const analyzeCrossDomain = async () => {
    setActiveTab("cross");
    setMessages([]);
    const data = await callAI("cross-domain", { code: allDomainCode || { [domain]: code } });
    setMessages([{ role: "ai", text: data.text, fixedCode: data.fixedCode }]);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", text: userMsg }];
    setMessages(newMessages);

    const data = await callAI("chat", {
      message: userMsg,
      history: newMessages.slice(-6),
    });
    setMessages([...newMessages, { role: "ai", text: data.text, fixedCode: data.fixedCode }]);
  };

  return (
    <>
      <button className="ai-btn" onClick={() => setOpen(!open)}>
        <span className="ai-btn-icon">✨</span>
        <span>AI</span>
      </button>

      {open && (
        <div className="ai-panel">
          <div className="ai-panel-header">
            <div className="ai-header-left">
              <div className="ai-header-icon">✨</div>
              <div>
                <div className="ai-header-title">DevSpace AI</div>
                <div className="ai-header-sub">{domain} Assistant</div>
              </div>
            </div>
            <button className="ai-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="ai-tabs">
            <button className={`ai-tab ${activeTab === "analyze" ? "active" : ""}`} onClick={() => setActiveTab("analyze")}>
              🔍 Analyze
            </button>
            <button className={`ai-tab ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
              💬 Chat
            </button>
            <button className={`ai-tab ${activeTab === "cross" ? "active" : ""}`} onClick={() => setActiveTab("cross")}>
              🔗 All Domains
            </button>
          </div>

          <div className="ai-body">
            {messages.length === 0 && !loading && (
              <div className="ai-empty">
                <div className="ai-empty-icon">🤖</div>
                <p className="ai-empty-title">AI Ready</p>
                <p className="ai-empty-sub">
                  {activeTab === "analyze" && "Click Analyze to scan your code for errors and improvements"}
                  {activeTab === "chat" && "Ask me anything about your code"}
                  {activeTab === "cross" && "Analyze how all your domains work together"}
                </p>
              </div>
            )}

            {loading && (
              <div className="ai-thinking">
                <div className="ai-thinking-dots">
                  <span /><span /><span />
                </div>
                <p>Thinking...</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`ai-message ${msg.role}`}>
                {msg.role === "ai" && <div className="ai-message-avatar">✨</div>}
                <div className="ai-message-content">
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.text}</p>
                  {msg.fixedCode && (
                    <button className="ai-apply-btn" onClick={() => { onFixApplied(msg.fixedCode!); setOpen(false); }}>
                      ✓ Apply Fix to Editor
                    </button>
                  )}
                </div>
                {msg.role === "user" && <div className="ai-message-avatar user">You</div>}
              </div>
            ))}
          </div>

          {activeTab === "analyze" && (
            <button className="ai-analyze-btn" onClick={analyzeCode} disabled={loading}>
              {loading ? "Analyzing..." : "🔍 Analyze My Code"}
            </button>
          )}

          {activeTab === "cross" && (
            <button className="ai-analyze-btn" onClick={analyzeCrossDomain} disabled={loading}>
              {loading ? "Analyzing..." : "🔗 Analyze All Domains"}
            </button>
          )}

          {activeTab === "chat" && (
            <div className="ai-input-row">
              <input
                className="ai-input"
                placeholder="Ask about your code..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                disabled={loading}
              />
              <button className="ai-send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}