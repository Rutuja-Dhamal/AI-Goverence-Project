import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Archive,
  ArrowRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import type {
  AiSystem,
  GovernanceSnapshot,
  GovernanceTask,
  Incident,
  RiskLevel,
} from "./types";

type ViewId = "overview" | "inventory" | "assessments" | "policies" | "queue" | "incidents" | "evidence";
type ModalId = "system" | "incident" | "assessment" | "evidence" | null;

const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "inventory" as const, label: "AI inventory", icon: Bot },
  { id: "assessments" as const, label: "Assessments", icon: ClipboardCheck },
  { id: "policies" as const, label: "Policies & controls", icon: FileCheck2 },
  { id: "queue" as const, label: "Review queue", icon: Archive },
  { id: "incidents" as const, label: "Incidents", icon: ShieldAlert },
  { id: "evidence" as const, label: "Evidence vault", icon: FileText },
];

const riskClass: Record<RiskLevel, string> = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1_048_576) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1_048_576).toFixed(1)} MB`;
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Progress({ value, compact = false }: { value: number; compact?: boolean }) {
  return (
    <div className={`progress-wrap ${compact ? "compact" : ""}`} aria-label={`${value}% complete`}>
      <div className="progress-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
      <strong>{value}%</strong>
    </div>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return <div className="empty"><FileText size={28} /><strong>{title}</strong><span>{detail}</span></div>;
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<GovernanceSnapshot | null>(null);
  const [view, setView] = useState<ViewId>("overview");
  const [modal, setModal] = useState<ModalId>(null);
  const [search, setSearch] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/governance", { headers: { Accept: "application/json" } });
      const body = await response.json() as GovernanceSnapshot & { error?: string };
      if (!response.ok) throw new Error(body.error || "Unable to load governance data.");
      setData(body);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load governance data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(""), 3500);
    return () => window.clearTimeout(id);
  }, [notice]);

  async function action(payload: Record<string, unknown>, successMessage: string) {
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json() as GovernanceSnapshot & { error?: string };
      if (!response.ok) throw new Error(body.error || "The update could not be saved.");
      setData(body);
      setModal(null);
      setNotice(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The update could not be saved.");
    } finally {
      setWorking(false);
    }
  }

  async function uploadEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/evidence", { method: "POST", body: new FormData(event.currentTarget) });
      const body = await response.json() as GovernanceSnapshot & { error?: string };
      if (!response.ok) throw new Error(body.error || "The file could not be uploaded.");
      setData(body);
      setModal(null);
      setNotice("Evidence uploaded securely.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The file could not be uploaded.");
    } finally {
      setWorking(false);
    }
  }

  const filteredSystems = useMemo(() => {
    if (!data) return [];
    const needle = search.toLowerCase().trim();
    if (!needle) return data.systems;
    return data.systems.filter((system) => [system.name, system.owner, system.department, system.model, system.risk].some((value) => value.toLowerCase().includes(needle)));
  }, [data, search]);

  const openTasks = data?.tasks.filter((task) => task.status !== "Completed") ?? [];
  const activeIncidents = data?.incidents.filter((incident) => incident.status !== "Resolved") ?? [];

  function selectView(next: ViewId) {
    setView(next);
    setMobileNav(false);
    setSearch("");
  }

  if (loading && !data) {
    return <div className="loading-screen"><div className="brand-mark"><Shield size={28} /></div><div className="loader" /><strong>Loading Aegis governance workspace…</strong></div>;
  }

  if (!data) {
    return <div className="loading-screen error-screen"><ShieldAlert size={44} /><h1>Workspace unavailable</h1><p>{error}</p><button className="primary-button" onClick={() => void load()}><RefreshCw size={16} /> Try again</button></div>;
  }

  const title = navigation.find((item) => item.id === view)?.label ?? "Overview";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand"><span className="brand-mark"><Shield size={22} /></span><div><strong>Aegis</strong><small>AI Governance</small></div></div>
        <nav aria-label="Primary navigation">
          <span className="nav-label">Workspace</span>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => selectView(id)}>
              <Icon size={18} /><span>{label}</span>
              {id === "queue" && openTasks.length > 0 && <em>{openTasks.length}</em>}
              {id === "incidents" && activeIncidents.length > 0 && <em className="danger-count">{activeIncidents.length}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <Sparkles size={18} />
          <strong>Governance posture</strong>
          <span>{data.metrics.averageCompliance}% organization score</span>
          <Progress value={data.metrics.averageCompliance} compact />
        </div>
        <div className="sidebar-user"><span className="avatar">RD</span><div><strong>Rutuja Dhamal</strong><small>Main admin</small></div><ChevronRight size={16} /></div>
      </aside>

      {mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div><span className="eyebrow">Governance workspace</span><h1>{title}</h1></div>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <button className="secondary-button" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> Sync</button>
            <button className="primary-button" onClick={() => setModal("system")}><Plus size={17} /> Register AI system</button>
          </div>
        </header>

        <div className="content">
          {error && <div className="alert error"><AlertTriangle size={18} /><span>{error}</span><button onClick={() => setError("")}><X size={16} /></button></div>}
          {notice && <div className="alert success"><CheckCircle2 size={18} /><span>{notice}</span></div>}

          {view === "overview" && <Overview data={data} openTasks={openTasks} onNavigate={selectView} onTask={(task) => void action({ action: "advance-task", id: task.id }, "Review task updated.")} />}
          {view === "inventory" && <Inventory systems={filteredSystems} search={search} setSearch={setSearch} onRegister={() => setModal("system")} />}
          {view === "assessments" && <Assessments data={data} onRun={() => setModal("assessment")} />}
          {view === "policies" && <Policies data={data} />}
          {view === "queue" && <ReviewQueue tasks={data.tasks} onAdvance={(task) => void action({ action: "advance-task", id: task.id }, "Review task updated.")} working={working} />}
          {view === "incidents" && <Incidents incidents={data.incidents} onCreate={() => setModal("incident")} onResolve={(incident) => void action({ action: "resolve-incident", id: incident.id }, "Incident marked resolved.")} working={working} />}
          {view === "evidence" && <Evidence data={data} onUpload={() => setModal("evidence")} />}
        </div>
      </main>

      {modal === "system" && <SystemModal onClose={() => setModal(null)} onSubmit={(payload) => void action(payload, "AI system registered.")} working={working} />}
      {modal === "incident" && <IncidentModal systems={data.systems} onClose={() => setModal(null)} onSubmit={(payload) => void action(payload, "Incident reported.")} working={working} />}
      {modal === "assessment" && <AssessmentModal systems={data.systems} onClose={() => setModal(null)} onSubmit={(payload) => void action(payload, "Assessment completed.")} working={working} />}
      {modal === "evidence" && <EvidenceModal systems={data.systems} onClose={() => setModal(null)} onSubmit={uploadEvidence} working={working} />}
    </div>
  );
}

function Overview({ data, openTasks, onNavigate, onTask }: { data: GovernanceSnapshot; openTasks: GovernanceTask[]; onNavigate: (view: ViewId) => void; onTask: (task: GovernanceTask) => void }) {
  const riskCounts = (["Critical", "High", "Medium", "Low"] as RiskLevel[]).map((risk) => ({ risk, value: data.systems.filter((item) => item.risk === risk).length }));
  const maxRisk = Math.max(...riskCounts.map((item) => item.value), 1);
  return <>
    <section className="welcome"><div><span className="eyebrow purple">Sunday, 18 October</span><h2>Good Morning, Rutuja</h2><p>Here is your organization’s AI governance posture and the work that needs attention.</p></div><div className="welcome-score"><Gauge size={25} /><div><span>Governance score</span><strong>{data.metrics.averageCompliance}<small>/100</small></strong></div></div></section>
    <section className="metric-grid">
      <Metric icon={Bot} label="AI systems" value={data.metrics.totalSystems} detail={`${data.systems.filter((item) => item.status === "Production").length} in production`} tone="violet" />
      <Metric icon={AlertTriangle} label="High-risk systems" value={data.metrics.highRiskSystems} detail="Require active oversight" tone="amber" />
      <Metric icon={ClipboardCheck} label="Open reviews" value={data.metrics.openTasks} detail={`${openTasks.filter((item) => item.priority === "Critical").length} critical priority`} tone="blue" />
      <Metric icon={ShieldAlert} label="Active incidents" value={data.metrics.openIncidents} detail="Across monitored systems" tone="red" />
    </section>
    <section className="dashboard-grid">
      <article className="panel span-2"><PanelTitle title="AI system portfolio" subtitle="Risk and control posture across registered systems" action="View inventory" onAction={() => onNavigate("inventory")} />
        <div className="system-list">{data.systems.slice(0, 4).map((system) => <div className="system-row" key={system.id}><span className="system-icon"><Bot size={18} /></span><div className="system-copy"><strong>{system.name}</strong><span>{system.department} · {system.model}</span></div><Badge tone={riskClass[system.risk]}>{system.risk}</Badge><div className="score-cell"><strong>{system.score}</strong><span>score</span></div><Progress value={Math.round((system.controlsComplete / system.controls) * 100)} compact /></div>)}</div>
      </article>
      <article className="panel"><PanelTitle title="Risk distribution" subtitle="Current inventory" />
        <div className="risk-chart">{riskCounts.map(({ risk, value }) => <div key={risk}><div className="risk-meta"><span><i className={riskClass[risk]} />{risk}</span><strong>{value}</strong></div><div className="risk-bar"><span className={riskClass[risk]} style={{ width: `${(value / maxRisk) * 100}%` }} /></div></div>)}</div>
        <div className="chart-note"><Shield size={17} /><span><strong>{data.metrics.highRiskSystems} systems</strong> need enhanced governance controls.</span></div>
      </article>
      <article className="panel span-2"><PanelTitle title="Priority review queue" subtitle="Actions requiring owner attention" action="Open queue" onAction={() => onNavigate("queue")} />
        <div className="task-list">{openTasks.slice(0, 4).map((task) => <div className="task-row" key={task.id}><span className={`priority-line ${riskClass[task.priority]}`} /><div><strong>{task.title}</strong><span>{task.systemName} · Due {formatDate(task.dueDate)}</span></div><Badge tone={task.status === "In progress" ? "info" : "neutral"}>{task.status}</Badge><button className="row-action" onClick={() => onTask(task)}>{task.status === "Open" ? "Start" : "Complete"}<ArrowRight size={14} /></button></div>)}</div>
      </article>
      <article className="panel"><PanelTitle title="Recent activity" subtitle="Latest governance events" />
        <div className="activity-list">{data.activities.slice(0, 4).map((item) => <div key={item.id}><span className="activity-dot"><ActivityIcon size={14} /></span><p><strong>{item.title}</strong><span>{item.detail}</span><small>{item.actor} · {formatDate(item.createdAt)}</small></p></div>)}</div>
      </article>
    </section>
  </>;
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof Bot; label: string; value: number; detail: string; tone: string }) {
  return <article className="metric-card"><span className={`metric-icon ${tone}`}><Icon size={21} /></span><div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>;
}

function PanelTitle({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <header className="panel-title"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action}<ChevronRight size={15} /></button>}</header>;
}

function Inventory({ systems, search, setSearch, onRegister }: { systems: AiSystem[]; search: string; setSearch: (value: string) => void; onRegister: () => void }) {
  return <section className="page-stack"><div className="page-intro"><div><span className="eyebrow purple">System registry</span><h2>AI inventory</h2><p>Track ownership, risk classification, lifecycle status, and control readiness.</p></div><button className="primary-button" onClick={onRegister}><Plus size={17} /> Register system</button></div>
    <div className="toolbar"><label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search systems, owners, models…" /></label><span>{systems.length} systems shown</span></div>
    <div className="table-card"><table><thead><tr><th>System</th><th>Owner</th><th>Risk</th><th>Status</th><th>Framework</th><th>Controls</th><th>Score</th></tr></thead><tbody>{systems.map((system) => <tr key={system.id}><td><div className="table-primary"><span className="system-icon"><Bot size={17} /></span><div><strong>{system.name}</strong><small>{system.model}</small></div></div></td><td><strong>{system.owner}</strong><small>{system.department}</small></td><td><Badge tone={riskClass[system.risk]}>{system.risk}</Badge></td><td><Badge tone={system.status === "Production" ? "success" : "neutral"}>{system.status}</Badge></td><td>{system.framework}</td><td><Progress value={Math.round((system.controlsComplete / system.controls) * 100)} compact /></td><td><strong className="score-number">{system.score}</strong></td></tr>)}</tbody></table>{systems.length === 0 && <Empty title="No matching systems" detail="Try a different search term." />}</div>
  </section>;
}

function Assessments({ data, onRun }: { data: GovernanceSnapshot; onRun: () => void }) {
  return <section className="page-stack"><div className="page-intro"><div><span className="eyebrow purple">Assurance program</span><h2>Risk assessments</h2><p>Evaluate system safety, fairness, data quality, and regulatory readiness.</p></div><button className="primary-button" onClick={onRun}><Sparkles size={17} /> Run assessment</button></div>
    <div className="summary-strip"><div><strong>{data.assessments.length}</strong><span>Completed reviews</span></div><div><strong>{data.assessments.filter((item) => item.status === "Passed").length}</strong><span>Passed</span></div><div><strong>{data.assessments.filter((item) => item.status === "Attention").length}</strong><span>Need attention</span></div><div><strong>{Math.round(data.assessments.reduce((sum, item) => sum + item.score, 0) / Math.max(data.assessments.length, 1))}</strong><span>Average score</span></div></div>
    <div className="card-grid">{data.assessments.map((item) => <article className="assessment-card" key={item.id}><div className="assessment-score"><strong>{item.score}</strong><span>/100</span></div><div><Badge tone={item.status === "Passed" ? "success" : "high"}>{item.status}</Badge><h3>{item.systemName}</h3><p>{item.type}</p></div><footer><span>Assessed by {item.assessor}</span><strong>{formatDate(item.completedAt)}</strong></footer></article>)}</div>
  </section>;
}

function Policies({ data }: { data: GovernanceSnapshot }) {
  return <section className="page-stack"><div className="page-intro"><div><span className="eyebrow purple">Control library</span><h2>Policies & controls</h2><p>Map internal requirements to leading AI governance frameworks.</p></div></div>
    <div className="card-grid policies">{data.policies.map((policy) => <article className="policy-card" key={policy.id}><header><span className="document-icon"><FileCheck2 size={20} /></span><Badge tone={policy.status === "Active" ? "success" : "medium"}>{policy.status}</Badge></header><h3>{policy.name}</h3><p>{policy.framework} · Version {policy.version}</p><div className="policy-coverage"><span>Control coverage</span><Progress value={policy.coverage} /></div><footer><span>Owner: {policy.owner}</span><small>Updated {formatDate(policy.updatedAt)}</small></footer></article>)}</div>
  </section>;
}

function ReviewQueue({ tasks, onAdvance, working }: { tasks: GovernanceTask[]; onAdvance: (task: GovernanceTask) => void; working: boolean }) {
  return <section className="page-stack"><div className="page-intro"><div><span className="eyebrow purple">Action center</span><h2>Review queue</h2><p>Move governance actions from triage through completion.</p></div></div>
    <div className="kanban">{(["Open", "In progress", "Completed"] as const).map((status) => <section className="kanban-column" key={status}><header><span>{status}</span><em>{tasks.filter((task) => task.status === status).length}</em></header>{tasks.filter((task) => task.status === status).map((task) => <article className="task-card" key={task.id}><Badge tone={riskClass[task.priority]}>{task.priority}</Badge><h3>{task.title}</h3><p>{task.systemName}</p><div><span>Owner</span><strong>{task.owner}</strong></div><div><span>Due</span><strong>{formatDate(task.dueDate)}</strong></div>{status !== "Completed" && <button className="secondary-button full" disabled={working} onClick={() => onAdvance(task)}>{status === "Open" ? "Start review" : "Mark complete"}<ArrowRight size={15} /></button>}</article>)}</section>)}</div>
  </section>;
}

function Incidents({ incidents, onCreate, onResolve, working }: { incidents: Incident[]; onCreate: () => void; onResolve: (incident: Incident) => void; working: boolean }) {
  return <section className="page-stack"><div className="page-intro"><div><span className="eyebrow purple">Issue management</span><h2>AI incidents</h2><p>Record, investigate, and resolve harmful or unexpected AI behavior.</p></div><button className="primary-button" onClick={onCreate}><Plus size={17} /> Report incident</button></div>
    <div className="incident-list">{incidents.map((incident) => <article className="incident-card" key={incident.id}><span className={`incident-icon ${riskClass[incident.severity]}`}><AlertTriangle size={21} /></span><div className="incident-main"><div><Badge tone={riskClass[incident.severity]}>{incident.severity}</Badge><Badge tone={incident.status === "Resolved" ? "success" : "info"}>{incident.status}</Badge></div><h3>{incident.title}</h3><p>{incident.summary}</p><footer><span>{incident.systemName}</span><span>Owner: {incident.owner}</span><span>Reported {formatDate(incident.reportedAt)}</span></footer></div>{incident.status !== "Resolved" && <button className="secondary-button" disabled={working} onClick={() => onResolve(incident)}><Check size={16} /> Resolve</button>}</article>)}</div>
  </section>;
}

function Evidence({ data, onUpload }: { data: GovernanceSnapshot; onUpload: () => void }) {
  return <section className="page-stack"><div className="page-intro"><div><span className="eyebrow purple">Audit readiness</span><h2>Evidence vault</h2><p>Store governance artifacts against the systems they support.</p></div><button className="primary-button" onClick={onUpload}><Upload size={17} /> Upload evidence</button></div>
    <div className="evidence-note"><Shield size={20} /><div><strong>Protected evidence storage</strong><span>Files are validated, stored under opaque identifiers, and downloaded only through the authenticated API.</span></div></div>
    <div className="table-card"><table><thead><tr><th>File</th><th>AI system</th><th>Uploaded by</th><th>Date</th><th>Size</th><th /></tr></thead><tbody>{data.evidence.map((file) => <tr key={file.id}><td><div className="table-primary"><span className="document-icon"><FileText size={17} /></span><div><strong>{file.name}</strong><small>{file.mimeType}</small></div></div></td><td>{file.systemName}</td><td>{file.uploadedBy}</td><td>{formatDate(file.uploadedAt)}</td><td>{formatBytes(file.size)}</td><td><a className="row-action" href={`/api/evidence?id=${encodeURIComponent(file.id)}`}>Download</a></td></tr>)}</tbody></table>{data.evidence.length === 0 && <Empty title="No evidence uploaded yet" detail="Add assessments, approvals, monitoring reports, or control records." />}</div>
  </section>;
}

function SystemModal({ onClose, onSubmit, working }: { onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void; working: boolean }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit({ action: "create-system", ...Object.fromEntries(form.entries()) }); }
  return <Modal title="Register AI system" subtitle="Add a system to the governed inventory." onClose={onClose}><form className="form" onSubmit={submit}><div className="form-grid"><Field label="System name"><input name="name" required maxLength={100} placeholder="e.g. Claims Review Assistant" /></Field><Field label="Owner"><input name="owner" required maxLength={100} placeholder="Accountable owner" /></Field><Field label="Department"><input name="department" required maxLength={100} placeholder="Business unit" /></Field><Field label="Model or provider"><input name="model" required maxLength={120} placeholder="Model architecture" /></Field><Field label="Purpose"><input name="purpose" required maxLength={160} placeholder="Approved business purpose" /></Field><Field label="Framework"><select name="framework" defaultValue="NIST AI RMF"><option>NIST AI RMF</option><option>ISO/IEC 42001</option><option>EU AI Act</option><option>Internal</option></select></Field><Field label="Risk level"><select name="risk" defaultValue="Medium"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></Field><Field label="Lifecycle status"><select name="status" defaultValue="Review"><option>Production</option><option>Pilot</option><option>Review</option><option>Retired</option></select></Field><Field label="Description" wide><textarea name="description" required maxLength={500} rows={3} placeholder="What the system does, who it affects, and its decision context." /></Field></div><FormActions onClose={onClose} working={working} label="Register system" /></form></Modal>;
}

function IncidentModal({ systems, onClose, onSubmit, working }: { systems: AiSystem[]; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void; working: boolean }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit({ action: "create-incident", ...Object.fromEntries(form.entries()) }); }
  return <Modal title="Report AI incident" subtitle="Create an auditable record for investigation." onClose={onClose}><form className="form" onSubmit={submit}><div className="form-grid"><Field label="Incident title" wide><input name="title" required maxLength={140} placeholder="Concise incident description" /></Field><Field label="AI system"><select name="systemId" required>{systems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Severity"><select name="severity" defaultValue="Medium"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></select></Field><Field label="Incident owner" wide><input name="owner" required maxLength={100} defaultValue="Rutuja Dhamal" /></Field><Field label="Summary" wide><textarea name="summary" required maxLength={600} rows={4} placeholder="Describe what happened, the observed impact, and immediate containment." /></Field></div><FormActions onClose={onClose} working={working} label="Report incident" /></form></Modal>;
}

function AssessmentModal({ systems, onClose, onSubmit, working }: { systems: AiSystem[]; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void; working: boolean }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); onSubmit({ action: "run-assessment", ...Object.fromEntries(form.entries()) }); }
  return <Modal title="Run governance assessment" subtitle="Generate an on-demand control-readiness score." onClose={onClose}><form className="form" onSubmit={submit}><Field label="Select AI system"><select name="systemId" required>{systems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><div className="assessment-info"><Sparkles size={21} /><div><strong>Automated review simulation</strong><span>The demo evaluates the selected system and records a result in the audit history.</span></div></div><FormActions onClose={onClose} working={working} label="Run assessment" /></form></Modal>;
}

function EvidenceModal({ systems, onClose, onSubmit, working }: { systems: AiSystem[]; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; working: boolean }) {
  return <Modal title="Upload evidence" subtitle="Attach an approved artifact to an AI system." onClose={onClose}><form className="form" onSubmit={onSubmit}><Field label="AI system"><select name="systemId" required>{systems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><label className="upload-zone"><Upload size={28} /><strong>Select an evidence file</strong><span>PDF, PNG, JPEG, CSV, TXT, DOCX, or XLSX · up to 10 MB</span><input name="file" type="file" required accept=".pdf,.png,.jpg,.jpeg,.csv,.txt,.docx,.xlsx" /></label><FormActions onClose={onClose} working={working} label="Upload evidence" /></form></Modal>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) { return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>; }

function FormActions({ onClose, working, label }: { onClose: () => void; working: boolean; label: string }) { return <div className="form-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={working}>{working ? <><RefreshCw className="spin" size={16} /> Saving…</> : label}</button></div>; }
