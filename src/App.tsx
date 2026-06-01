import { useState, Suspense } from "react";
import "./App.css";
import ParticleBackground from "./ParticleBackground";
import Spline from "@splinetool/react-spline";
import { LogoFull } from "./Logo";
import Dashboard from "./Dashboard";

type Screen = "landing" | "login" | "signup" | "dashboard";

function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  return (
    <div className="app">
      {screen === "landing" && <Landing onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />}
      {screen === "login" && <Login onBack={() => setScreen("landing")} onSuccess={() => setScreen("dashboard")} />}
      {screen === "signup" && <Signup onBack={() => setScreen("landing")} onSuccess={() => setScreen("dashboard")} />}
      {screen === "dashboard" && <Dashboard />}
    </div>
  );
}

function Landing({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return (
    <div className="landing">
      <ParticleBackground />
      <div className="landing-content">
        <div className="badge">✦ Built for developers, by developers</div>
        <div className="logo-area">
          <LogoFull size={56} />
        </div>
        <p className="tagline">Code together. Ship together.<br />No switching tabs.</p>
        <p className="sub-tagline">The all-in-one collaborative IDE for student dev teams.<br />Editor, voice, domains, and accountability — in one place.</p>
        <div className="landing-buttons">
          <button className="btn-primary" onClick={onSignup}>Get Started Free</button>
          <button className="btn-secondary" onClick={onLogin}>Log In</button>
        </div>
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🖥️</span>
            <div className="feature-text">
              <strong>Live Collaborative Editor</strong>
              <span>Code together in real time</span>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🎙️</span>
            <div className="feature-text">
              <strong>Built-in Voice & Video</strong>
              <span>No Zoom, no switching apps</span>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">🗂️</span>
            <div className="feature-text">
              <strong>Domain Workspaces</strong>
              <span>Frontend & backend, isolated</span>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon">📊</span>
            <div className="feature-text">
              <strong>Contribution Tracking</strong>
              <span>No more one-man shows</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  return (
    <div className="auth-screen">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="auth-screen-inner">
        <div className="spline-side">
          <div className="spline-overlay" />
          <Suspense fallback={<div className="spline-loading">Loading 3D...</div>}>
            <Spline scene="https://prod.spline.design/NTDjDVUj-ktUEizj/scene.splinecode" />
          </Suspense>
        </div>
        <div className="auth-box">
          <div className="auth-logo"><LogoFull size={28} /></div>
          <h2>Welcome back</h2>
          <p>Log in to your workspace</p>
          <input type="email" placeholder="Email address" className="auth-input" />
          <input type="password" placeholder="Password" className="auth-input" />
          <button className="btn-primary" onClick={onSuccess}>Log In</button>
        </div>
      </div>
    </div>
  );
}

function Signup({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  return (
    <div className="auth-screen">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <div className="auth-screen-inner">
        <div className="spline-side">
          <div className="spline-overlay" />
          <Suspense fallback={<div className="spline-loading">Loading 3D...</div>}>
            <Spline scene="https://prod.spline.design/NTDjDVUj-ktUEizj/scene.splinecode" />
          </Suspense>
        </div>
        <div className="auth-box">
          <div className="auth-logo"><LogoFull size={28} /></div>
          <h2>Create your account</h2>
          <p>Let's get you set up</p>
          <div className={`form-step ${step >= 1 ? "visible" : ""}`}>
            <input type="text" placeholder="Full Name" className="auth-input" value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && name.trim() && setStep(2)} />
            {step === 1 && name.trim() && (
              <button className="btn-primary" onClick={() => setStep(2)}>Continue →</button>
            )}
          </div>
          <div className={`form-step ${step >= 2 ? "visible" : "hidden"}`}>
            <input type="email" placeholder="Email address" className="auth-input" value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && email.trim() && setStep(3)} />
            {step === 2 && email.trim() && (
              <button className="btn-primary" onClick={() => setStep(3)}>Continue →</button>
            )}
          </div>
          <div className={`form-step ${step >= 3 ? "visible" : "hidden"}`}>
            <input type="password" placeholder="Create password" className="auth-input" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            {step === 3 && password.trim() && (
              <button className="btn-primary" onClick={onSuccess}>Get Started Free 🚀</button>
            )}
          </div>
          <div className="step-dots">
            <span className={`dot ${step >= 1 ? "active" : ""}`} />
            <span className={`dot ${step >= 2 ? "active" : ""}`} />
            <span className={`dot ${step >= 3 ? "active" : ""}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;