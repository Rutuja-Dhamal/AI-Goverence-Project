export const seedSystems = [
  ["sys_customer", "Customer Support Copilot", "Summarizes support cases and drafts agent responses.", "Maya Chen", "Customer Experience", "Azure OpenAI GPT-4.1", "Agent assistance", "High", 82, "Production", "NIST AI RMF", "2026-09-12", "2026-12-12", 18, 15],
  ["sys_fraud", "Fraud Signal Engine", "Detects anomalous payment behavior for analyst review.", "Arjun Mehta", "Risk & Finance", "XGBoost ensemble", "Fraud detection", "Critical", 74, "Production", "ISO/IEC 42001", "2026-09-05", "2026-11-05", 24, 18],
  ["sys_hiring", "Talent Match Assistant", "Ranks candidate profiles against approved job criteria.", "Nina Shah", "People Operations", "Fine-tuned BERT", "Candidate matching", "High", 68, "Review", "EU AI Act", "2026-08-28", "2026-10-28", 21, 14],
  ["sys_forecast", "Demand Forecast Studio", "Predicts regional inventory demand for planning teams.", "Owen Brooks", "Supply Chain", "Temporal Fusion Transformer", "Demand planning", "Medium", 91, "Production", "NIST AI RMF", "2026-09-22", "2027-01-22", 14, 13],
  ["sys_docs", "Document Intelligence", "Extracts structured fields from supplier documents.", "Sara Kim", "Operations", "LayoutLM v3", "Document extraction", "Low", 95, "Pilot", "ISO/IEC 42001", "2026-09-18", "2027-02-18", 12, 12]
] as const;

export const seedAssessments = [
  ["assess_1", "sys_customer", "Customer Support Copilot", "Responsible AI review", 82, "Passed", "2026-09-12", "Rutuja Dhamal"],
  ["assess_2", "sys_fraud", "Fraud Signal Engine", "Model risk assessment", 74, "Attention", "2026-09-05", "Risk Council"],
  ["assess_3", "sys_hiring", "Talent Match Assistant", "Bias and fairness audit", 68, "Attention", "2026-08-28", "Rutuja Dhamal"],
  ["assess_4", "sys_forecast", "Demand Forecast Studio", "Data quality review", 91, "Passed", "2026-09-22", "Model Assurance"],
] as const;

export const seedPolicies = [
  ["policy_1", "Responsible AI Standard", "NIST AI RMF", "3.2", 88, "Active", "2026-09-20", "Rutuja Dhamal"],
  ["policy_2", "High-Risk System Controls", "EU AI Act", "2.1", 76, "Active", "2026-09-08", "Legal & Compliance"],
  ["policy_3", "Model Monitoring Standard", "ISO/IEC 42001", "1.8", 92, "Active", "2026-09-17", "Model Assurance"],
  ["policy_4", "Generative AI Usage Policy", "Internal", "1.3", 64, "Review", "2026-09-25", "Security Council"],
] as const;

export const seedTasks = [
  ["task_1", "Complete hiring bias remediation", "sys_hiring", "Talent Match Assistant", "Nina Shah", "2026-10-24", "High", "In progress"],
  ["task_2", "Approve fraud model monitoring thresholds", "sys_fraud", "Fraud Signal Engine", "Arjun Mehta", "2026-10-21", "Critical", "Open"],
  ["task_3", "Refresh copilot red-team evidence", "sys_customer", "Customer Support Copilot", "Maya Chen", "2026-10-30", "Medium", "Open"],
  ["task_4", "Validate forecast drift report", "sys_forecast", "Demand Forecast Studio", "Owen Brooks", "2026-11-03", "Low", "Open"],
] as const;

export const seedIncidents = [
  ["incident_1", "Elevated false-positive rate", "sys_fraud", "Fraud Signal Engine", "High", "Investigating", "2026-10-16", "Arjun Mehta", "False positives increased after a regional feature distribution shift."],
  ["incident_2", "Unapproved prompt template", "sys_customer", "Customer Support Copilot", "Medium", "Open", "2026-10-17", "Maya Chen", "A draft prompt template was enabled before governance approval."],
] as const;

export const seedActivities = [
  ["activity_1", "assessment", "Assessment completed", "Responsible AI review passed for Customer Support Copilot.", "Rutuja Dhamal", "2026-10-18T08:45:00.000Z"],
  ["activity_2", "incident", "Incident opened", "Fraud Signal Engine false-positive rate requires investigation.", "Arjun Mehta", "2026-10-17T14:20:00.000Z"],
  ["activity_3", "policy", "Policy updated", "Generative AI Usage Policy moved into stakeholder review.", "Rutuja Dhamal", "2026-10-16T11:15:00.000Z"],
  ["activity_4", "control", "Control evidence approved", "Forecast model drift report accepted.", "Model Assurance", "2026-10-15T09:05:00.000Z"],
] as const;
