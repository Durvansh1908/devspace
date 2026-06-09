import { useState } from "react";
import { LogoIcon, LogoFull } from "./Logo";
import CodeEditor from "./CodeEditor";

type Domain = "Frontend" | "Backend" | "Database" | "DevOps" | "UI/UX";
type ActiveView = "home" | "projects" | "team" | "chill" | "settings";

interface Member {
  id: string;
  name: string;
  domain: Domain | null;
  online?: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

export default function Dashboard({ userName }: { userName?: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [creating, setCreating] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>("home");
const [editorDomain, setEditorDomain] = useState<string | null>(null);
if (editorDomain) {
  return <CodeEditor domain={editorDomain} memberName={userName ?? "Developer"} onBack={() => setEditorDomain(null)} />;
}
  return (
    <div className="dashboard">
      <aside className="icon-sidebar">
        <div className="icon-logo"><LogoIcon size={36} /></div>
        <div className="icon-divider" />
        {projects.map((p) => (
          <button
            key={p.id}
            className={`icon-project ${activeProject?.id === p.id ? "active" : ""}`}
            onClick={() => setActiveProject(p)}
            title={p.name}
          >
            {p.name[0].toUpperCase()}
          </button>
        ))}
        <button className="icon-add" onClick={() => setCreating(true)} title="New Project">+</button>
      </aside>

      <aside className="channel-sidebar">
        <div className="channel-header">
          {!activeProject ? <LogoFull size={18} /> : <h3>{activeProject.name}</h3>}
          <span className="online-badge">● Online</span>
        </div>
        <div className="channel-sections">
          <div className="channel-section">
            <p className="channel-label">WORKSPACE</p>
            <button className={`channel-item ${activeView === "home" ? "active" : ""}`} onClick={() => setActiveView("home")}>🏠 Overview</button>
            <button className={`channel-item ${activeView === "projects" ? "active" : ""}`} onClick={() => setActiveView("projects")}>📁 Projects</button>
            <button className={`channel-item ${activeView === "team" ? "active" : ""}`} onClick={() => setActiveView("team")}>👥 Team</button>
          </div>
          <div className="channel-section">
            <p className="channel-label">DOMAINS</p>
            {activeProject
  ? [...new Set(activeProject.members.filter(m => m.domain).map(m => m.domain))].map((d) => (
    <button key={d} className="channel-item domain-channel" onClick={() => setEditorDomain(d ?? "Frontend")}>
      <span className={`domain-dot ${d?.toLowerCase().replace("/", "")}`} />{d}
    </button>
  ))
  : <>
    <button className="channel-item domain-channel" onClick={() => setEditorDomain("Frontend")}><span className="domain-dot frontend" />Frontend</button>
    <button className="channel-item domain-channel" onClick={() => setEditorDomain("Backend")}><span className="domain-dot backend" />Backend</button>
  </>
}
          </div>
          <div className="channel-section">
            <p className="channel-label">SOCIAL</p>
            <button className={`channel-item ${activeView === "chill" ? "active" : ""}`} onClick={() => setActiveView("chill")}>🎮 Chill Zone</button>
          </div>
        </div>
        <div className="channel-user">
          <div className="user-avatar-sm">{userName?.[0] ?? "D"}</div>
          <div className="channel-user-info">
            <span>{userName ?? "Developer"}</span>
            <span className="user-status">● Active</span>
          </div>
          <button className="settings-btn" onClick={() => setActiveView("settings")}>⚙️</button>
        </div>
      </aside>

      <main className="dashboard-main">
        {creating && (
          <CreateProject
            onClose={() => setCreating(false)}
            onCreate={(project) => {
              setProjects([...projects, project]);
              setCreating(false);
              setActiveProject(project);
            }}
          />
        )}
        {!creating && activeView === "home" && <HomeView projects={projects} activeProject={activeProject} onCreateProject={() => setCreating(true)} onSelectProject={setActiveProject} />}
        {!creating && activeView === "projects" && <ProjectsView projects={projects} onCreateProject={() => setCreating(true)} onSelectProject={(p) => { setActiveProject(p); setActiveView("home"); }} />}
        {!creating && activeView === "team" && <TeamView members={activeProject?.members ?? []} />}
        {!creating && activeView === "chill" && <ChillView />}
        {!creating && activeView === "settings" && <SettingsView />}
      </main>

      <aside className="members-panel">
        <h4>TEAM MEMBERS</h4>
        {activeProject ? (
          <div className="members-section">
            <p className="members-label">ONLINE — {activeProject.members.length}</p>
            {activeProject.members.map((m) => (
              <div key={m.id} className="member-row">
                <div className="member-avatar-wrap">
                  <div className="user-avatar-sm">{m.name[0]}</div>
                  <span className="online-dot" />
                </div>
                <div className="member-info">
                  <span className="member-name-text">{m.name}</span>
                  <span className="member-domain-text">{m.domain ?? "Unassigned"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-members">
            <span>👥</span>
            <p>Create a project to see your team here</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function HomeView({ projects, activeProject, onCreateProject, onSelectProject }: {
  projects: Project[];
  activeProject: Project | null;
  onCreateProject: () => void;
  onSelectProject: (p: Project) => void;
}) {
  return (
    <div className="main-content">
      <div className="main-header">
        <div>
          <h1>{activeProject ? activeProject.name : "Welcome back 👋"}</h1>
          <p>{activeProject ? activeProject.description : "What are we building today?"}</p>
        </div>
        <button className="btn-primary" onClick={onCreateProject}>+ New Project</button>
      </div>
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-icon">📁</span>
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Total Projects</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-value">{activeProject?.members.length ?? 0}</div>
          <div className="stat-label">Team Members</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚡</span>
          <div className="stat-value">{activeProject ? [...new Set(activeProject.members.map(m => m.domain).filter(Boolean))].length : 0}</div>
          <div className="stat-label">Active Domains</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔥</span>
          <div className="stat-value">{activeProject?.members.length ?? 0}</div>
          <div className="stat-label">Online Now</div>
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="empty-state">
          <span>🚀</span>
          <h2>No projects yet</h2>
          <p>Create your first project and invite your team</p>
          <button className="btn-primary" onClick={onCreateProject}>Create Project</button>
        </div>
      ) : (
        <>
          <div className="projects-grid">
            {projects.map((p) => (
              <div key={p.id} className={`project-card ${activeProject?.id === p.id ? "selected" : ""}`} onClick={() => onSelectProject(p)}>
                <div className="project-card-header">
                  <h3>{p.name}</h3>
                  <span className="project-status">Active</span>
                </div>
                <p>{p.description}</p>
                <div className="project-members">
                  {p.members.map((m) => (
                    <div key={m.id} className="member-chip">
                      <span className="member-avatar">{m.name[0]}</span>
                      <span>{m.name}</span>
                      {m.domain && <span className="domain-tag">{m.domain}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="activity-feed">
            <h3>Recent Activity</h3>
            <div className="activity-item">
              <span className="activity-dot" />
              <span className="activity-text"><strong>Project created</strong> — {projects[projects.length - 1]?.name}</span>
              <span className="activity-time">Just now</span>
            </div>
            <div className="activity-item">
              <span className="activity-dot" />
              <span className="activity-text"><strong>Team assembled</strong> — {activeProject?.members.length ?? 0} members added</span>
              <span className="activity-time">Just now</span>
            </div>
            <div className="activity-item">
              <span className="activity-dot" />
              <span className="activity-text"><strong>Domains assigned</strong> — workspace ready</span>
              <span className="activity-time">Just now</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectsView({ projects, onCreateProject, onSelectProject }: {
  projects: Project[];
  onCreateProject: () => void;
  onSelectProject: (p: Project) => void;
}) {
  return (
    <div className="main-content">
      <div className="main-header">
        <div>
          <h1>Projects</h1>
          <p>{projects.length} project{projects.length !== 1 ? "s" : ""} total</p>
        </div>
        <button className="btn-primary" onClick={onCreateProject}>+ New Project</button>
      </div>
      <div className="projects-grid">
        {projects.map((p) => (
          <div key={p.id} className="project-card" onClick={() => onSelectProject(p)}>
            <div className="project-card-header">
              <h3>{p.name}</h3>
              <span className="project-status">Active</span>
            </div>
            <p>{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamView({ members }: { members: Member[] }) {
  return (
    <div className="main-content">
      <div className="main-header">
        <div>
          <h1>Team</h1>
          <p>{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
      </div>
      {members.length === 0 ? (
        <div className="empty-state">
          <span>👥</span>
          <h2>No team yet</h2>
          <p>Create a project and add team members</p>
        </div>
      ) : (
        <div className="team-grid">
          {members.map((m) => (
            <div key={m.id} className="team-card">
              <div className="team-avatar">{m.name[0]}</div>
              <h3>{m.name}</h3>
              <span className="domain-tag">{m.domain ?? "Unassigned"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChillView() {
  return (
    <div className="main-content">
      <div className="main-header">
        <div>
          <h1>Chill Zone 🎮</h1>
          <p>Take a break, hang out with your team</p>
        </div>
      </div>
      <div className="chill-grid">
        <div className="chill-card">
          <span>🎵</span>
          <h3>Music Room</h3>
          <p>Listen together while you code</p>
          <button className="btn-secondary">Coming Soon</button>
        </div>
        <div className="chill-card">
          <span>🎮</span>
          <h3>Quick Games</h3>
          <p>Take a 5 minute break</p>
          <button className="btn-secondary">Coming Soon</button>
        </div>
        <div className="chill-card">
          <span>☕</span>
          <h3>Coffee Chat</h3>
          <p>Random 1-on-1 with a teammate</p>
          <button className="btn-secondary">Coming Soon</button>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="main-content">
      <div className="main-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your workspace</p>
        </div>
      </div>
      <div className="settings-list">
        <div className="settings-item">
          <div>
            <strong>Profile</strong>
            <p>Update your name and avatar</p>
          </div>
          <button className="btn-secondary">Edit</button>
        </div>
        <div className="settings-item">
          <div>
            <strong>Notifications</strong>
            <p>Manage alerts and pings</p>
          </div>
          <button className="btn-secondary">Configure</button>
        </div>
        <div className="settings-item">
          <div>
            <strong>Theme</strong>
            <p>Dark mode and accent colors</p>
          </div>
          <button className="btn-secondary">Customize</button>
        </div>
      </div>
    </div>
  );
}

const DOMAINS: Domain[] = ["Frontend", "Backend", "Database", "DevOps", "UI/UX"];

function CreateProject({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (p: Project) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Member[]>([{ id: "1", name: "", domain: null }]);

  const addMember = () => setMembers([...members, { id: Date.now().toString(), name: "", domain: null }]);
  const updateMember = (id: string, field: keyof Member, value: string) => {
    setMembers(members.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };
  const handleCreate = () => {
    onCreate({
      id: Date.now().toString(),
      name,
      description,
      members: members.filter((m) => m.name.trim()),
      createdAt: new Date().toLocaleDateString(),
    });
  };

  return (
    <div className="create-project-overlay">
      <div className="create-project-modal">
        <div className="modal-header">
          <h2>{step === 1 ? "Name your project" : step === 2 ? "Add team members" : "Assign domains"}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-steps">
          {[1, 2, 3].map((s) => <div key={s} className={`modal-step-dot ${step >= s ? "active" : ""}`} />)}
        </div>
        {step === 1 && (
          <div className="modal-body">
            <input className="auth-input" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
            <textarea className="auth-input" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <button className="btn-primary" disabled={!name.trim()} onClick={() => setStep(2)}>Continue →</button>
          </div>
        )}
        {step === 2 && (
          <div className="modal-body">
            {members.map((m, i) => (
              <input key={m.id} className="auth-input" placeholder={`Member ${i + 1} name`} value={m.name} onChange={(e) => updateMember(m.id, "name", e.target.value)} />
            ))}
            <button className="btn-secondary" onClick={addMember}>+ Add Member</button>
            <button className="btn-primary" onClick={() => setStep(3)}>Continue →</button>
          </div>
        )}
        {step === 3 && (
          <div className="modal-body">
            {members.filter((m) => m.name.trim()).map((m) => (
              <div key={m.id} className="domain-assign-row">
                <span className="member-avatar">{m.name[0]}</span>
                <span className="member-name">{m.name}</span>
                <select className="domain-select" value={m.domain ?? ""} onChange={(e) => updateMember(m.id, "domain", e.target.value)}>
                  <option value="">Assign domain</option>
                  {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            ))}
            <button className="btn-primary" onClick={handleCreate}>🚀 Launch Project</button>
          </div>
        )}
      </div>
    </div>
  );
}