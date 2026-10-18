export type RiskLevel = "Critical" | "High" | "Medium" | "Low";
export type SystemStatus = "Production" | "Pilot" | "Review" | "Retired";
export type TaskStatus = "Open" | "In progress" | "Completed";

export interface Viewer {
  name: string;
  role: string;
  email?: string;
  initials: string;
}

export interface AiSystem {
  id: string;
  name: string;
  description: string;
  owner: string;
  department: string;
  model: string;
  purpose: string;
  risk: RiskLevel;
  score: number;
  status: SystemStatus;
  framework: string;
  lastReview: string;
  nextReview: string;
  controls: number;
  controlsComplete: number;
}

export interface Assessment {
  id: string;
  systemId: string;
  systemName: string;
  type: string;
  score: number;
  status: "Passed" | "Attention" | "Scheduled";
  completedAt: string;
  assessor: string;
}

export interface Policy {
  id: string;
  name: string;
  framework: string;
  version: string;
  coverage: number;
  status: "Active" | "Draft" | "Review";
  updatedAt: string;
  owner: string;
}

export interface GovernanceTask {
  id: string;
  title: string;
  systemId: string;
  systemName: string;
  owner: string;
  dueDate: string;
  priority: RiskLevel;
  status: TaskStatus;
}

export interface Incident {
  id: string;
  title: string;
  systemId: string;
  systemName: string;
  severity: RiskLevel;
  status: "Open" | "Investigating" | "Resolved";
  reportedAt: string;
  owner: string;
  summary: string;
}

export interface Activity {
  id: string;
  kind: string;
  title: string;
  detail: string;
  actor: string;
  createdAt: string;
}

export interface EvidenceFile {
  id: string;
  systemId: string;
  systemName: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface GovernanceMetrics {
  totalSystems: number;
  highRiskSystems: number;
  openTasks: number;
  openIncidents: number;
  averageCompliance: number;
  completedControls: number;
  totalControls: number;
}

export interface GovernanceSnapshot {
  viewer: Viewer;
  metrics: GovernanceMetrics;
  systems: AiSystem[];
  assessments: Assessment[];
  policies: Policy[];
  tasks: GovernanceTask[];
  incidents: Incident[];
  activities: Activity[];
  evidence: EvidenceFile[];
}
