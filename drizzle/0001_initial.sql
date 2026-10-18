CREATE TABLE IF NOT EXISTS ai_systems (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  owner TEXT NOT NULL,
  department TEXT NOT NULL,
  model TEXT NOT NULL,
  purpose TEXT NOT NULL,
  risk TEXT NOT NULL CHECK (risk IN ('Critical','High','Medium','Low')),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('Production','Pilot','Review','Retired')),
  framework TEXT NOT NULL,
  last_review TEXT NOT NULL,
  next_review TEXT NOT NULL,
  controls INTEGER NOT NULL DEFAULT 0,
  controls_complete INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES ai_systems(id),
  system_name TEXT NOT NULL,
  type TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('Passed','Attention','Scheduled')),
  completed_at TEXT NOT NULL,
  assessor TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  version TEXT NOT NULL,
  coverage INTEGER NOT NULL CHECK (coverage BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('Active','Draft','Review')),
  updated_at TEXT NOT NULL,
  owner TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  system_id TEXT NOT NULL REFERENCES ai_systems(id),
  system_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Critical','High','Medium','Low')),
  status TEXT NOT NULL CHECK (status IN ('Open','In progress','Completed'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  system_id TEXT NOT NULL REFERENCES ai_systems(id),
  system_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical','High','Medium','Low')),
  status TEXT NOT NULL CHECK (status IN ('Open','Investigating','Resolved')),
  reported_at TEXT NOT NULL,
  owner TEXT NOT NULL,
  summary TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS evidence_files (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES ai_systems(id),
  system_name TEXT NOT NULL,
  name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_systems_risk_status ON ai_systems(risk, status);
CREATE INDEX IF NOT EXISTS idx_assessments_system_id ON assessments(system_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON governance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_evidence_system_id ON evidence_files(system_id);
