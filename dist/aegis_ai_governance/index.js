//#region worker/core.ts
var riskLevels = [
	"Critical",
	"High",
	"Medium",
	"Low"
];
var systemStatuses = [
	"Production",
	"Pilot",
	"Review",
	"Retired"
];
var taskStatuses = [
	"Open",
	"In progress",
	"Completed"
];
var InputError = class extends Error {};
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function cleanText(value, field, maxLength = 180) {
	if (typeof value !== "string") throw new InputError(`${field} must be text.`);
	const result = Array.from(value.trim(), (character) => {
		const code = character.charCodeAt(0);
		return code <= 31 || code === 127 ? " " : character;
	}).join("");
	if (!result) throw new InputError(`${field} is required.`);
	if (result.length > maxLength) throw new InputError(`${field} must be ${maxLength} characters or fewer.`);
	return result;
}
function enumValue(value, allowed, field) {
	if (typeof value !== "string" || !allowed.includes(value)) throw new InputError(`${field} has an unsupported value.`);
	return value;
}
function calculateMetrics(systems, openTasks, openIncidents) {
	const totalControls = systems.reduce((sum, item) => sum + item.controls, 0);
	const completedControls = systems.reduce((sum, item) => sum + item.controlsComplete, 0);
	return {
		totalSystems: systems.length,
		highRiskSystems: systems.filter((item) => item.risk === "Critical" || item.risk === "High").length,
		openTasks,
		openIncidents,
		averageCompliance: systems.length ? Math.round(systems.reduce((sum, item) => sum + item.score, 0) / systems.length) : 0,
		completedControls,
		totalControls
	};
}
function isSameOrigin(request) {
	const origin = request.headers.get("Origin");
	if (!origin) return true;
	try {
		return new URL(origin).origin === new URL(request.url).origin;
	} catch {
		return false;
	}
}
function isLocalRequest(request) {
	const hostname = new URL(request.url).hostname;
	return hostname === "localhost" || hostname === "127.0.0.1";
}
function makeId(prefix) {
	return `${prefix}_${crypto.randomUUID()}`;
}
function safeFileName(value) {
	return (value.replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\s+/g, " ").trim() || "evidence-file").slice(0, 120);
}
var allowedEvidenceTypes = new Set([
	"application/pdf",
	"image/png",
	"image/jpeg",
	"text/plain",
	"text/csv",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);
function hasValidFileSignature(type, bytes) {
	if (type === "application/pdf") return bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70;
	if (type === "image/png") return bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
	if (type === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
	if (type.includes("openxmlformats")) return bytes[0] === 80 && bytes[1] === 75;
	return type === "text/plain" || type === "text/csv";
}
//#endregion
//#region worker/seed.ts
var seedSystems = [
	[
		"sys_customer",
		"Customer Support Copilot",
		"Summarizes support cases and drafts agent responses.",
		"Maya Chen",
		"Customer Experience",
		"Azure OpenAI GPT-4.1",
		"Agent assistance",
		"High",
		82,
		"Production",
		"NIST AI RMF",
		"2026-09-12",
		"2026-12-12",
		18,
		15
	],
	[
		"sys_fraud",
		"Fraud Signal Engine",
		"Detects anomalous payment behavior for analyst review.",
		"Arjun Mehta",
		"Risk & Finance",
		"XGBoost ensemble",
		"Fraud detection",
		"Critical",
		74,
		"Production",
		"ISO/IEC 42001",
		"2026-09-05",
		"2026-11-05",
		24,
		18
	],
	[
		"sys_hiring",
		"Talent Match Assistant",
		"Ranks candidate profiles against approved job criteria.",
		"Nina Shah",
		"People Operations",
		"Fine-tuned BERT",
		"Candidate matching",
		"High",
		68,
		"Review",
		"EU AI Act",
		"2026-08-28",
		"2026-10-28",
		21,
		14
	],
	[
		"sys_forecast",
		"Demand Forecast Studio",
		"Predicts regional inventory demand for planning teams.",
		"Owen Brooks",
		"Supply Chain",
		"Temporal Fusion Transformer",
		"Demand planning",
		"Medium",
		91,
		"Production",
		"NIST AI RMF",
		"2026-09-22",
		"2027-01-22",
		14,
		13
	],
	[
		"sys_docs",
		"Document Intelligence",
		"Extracts structured fields from supplier documents.",
		"Sara Kim",
		"Operations",
		"LayoutLM v3",
		"Document extraction",
		"Low",
		95,
		"Pilot",
		"ISO/IEC 42001",
		"2026-09-18",
		"2027-02-18",
		12,
		12
	]
];
var seedAssessments = [
	[
		"assess_1",
		"sys_customer",
		"Customer Support Copilot",
		"Responsible AI review",
		82,
		"Passed",
		"2026-09-12",
		"Rutuja Dhamal"
	],
	[
		"assess_2",
		"sys_fraud",
		"Fraud Signal Engine",
		"Model risk assessment",
		74,
		"Attention",
		"2026-09-05",
		"Risk Council"
	],
	[
		"assess_3",
		"sys_hiring",
		"Talent Match Assistant",
		"Bias and fairness audit",
		68,
		"Attention",
		"2026-08-28",
		"Rutuja Dhamal"
	],
	[
		"assess_4",
		"sys_forecast",
		"Demand Forecast Studio",
		"Data quality review",
		91,
		"Passed",
		"2026-09-22",
		"Model Assurance"
	]
];
var seedPolicies = [
	[
		"policy_1",
		"Responsible AI Standard",
		"NIST AI RMF",
		"3.2",
		88,
		"Active",
		"2026-09-20",
		"Rutuja Dhamal"
	],
	[
		"policy_2",
		"High-Risk System Controls",
		"EU AI Act",
		"2.1",
		76,
		"Active",
		"2026-09-08",
		"Legal & Compliance"
	],
	[
		"policy_3",
		"Model Monitoring Standard",
		"ISO/IEC 42001",
		"1.8",
		92,
		"Active",
		"2026-09-17",
		"Model Assurance"
	],
	[
		"policy_4",
		"Generative AI Usage Policy",
		"Internal",
		"1.3",
		64,
		"Review",
		"2026-09-25",
		"Security Council"
	]
];
var seedTasks = [
	[
		"task_1",
		"Complete hiring bias remediation",
		"sys_hiring",
		"Talent Match Assistant",
		"Nina Shah",
		"2026-10-24",
		"High",
		"In progress"
	],
	[
		"task_2",
		"Approve fraud model monitoring thresholds",
		"sys_fraud",
		"Fraud Signal Engine",
		"Arjun Mehta",
		"2026-10-21",
		"Critical",
		"Open"
	],
	[
		"task_3",
		"Refresh copilot red-team evidence",
		"sys_customer",
		"Customer Support Copilot",
		"Maya Chen",
		"2026-10-30",
		"Medium",
		"Open"
	],
	[
		"task_4",
		"Validate forecast drift report",
		"sys_forecast",
		"Demand Forecast Studio",
		"Owen Brooks",
		"2026-11-03",
		"Low",
		"Open"
	]
];
var seedIncidents = [[
	"incident_1",
	"Elevated false-positive rate",
	"sys_fraud",
	"Fraud Signal Engine",
	"High",
	"Investigating",
	"2026-10-16",
	"Arjun Mehta",
	"False positives increased after a regional feature distribution shift."
], [
	"incident_2",
	"Unapproved prompt template",
	"sys_customer",
	"Customer Support Copilot",
	"Medium",
	"Open",
	"2026-10-17",
	"Maya Chen",
	"A draft prompt template was enabled before governance approval."
]];
var seedActivities = [
	[
		"activity_1",
		"assessment",
		"Assessment completed",
		"Responsible AI review passed for Customer Support Copilot.",
		"Rutuja Dhamal",
		"2026-10-18T08:45:00.000Z"
	],
	[
		"activity_2",
		"incident",
		"Incident opened",
		"Fraud Signal Engine false-positive rate requires investigation.",
		"Arjun Mehta",
		"2026-10-17T14:20:00.000Z"
	],
	[
		"activity_3",
		"policy",
		"Policy updated",
		"Generative AI Usage Policy moved into stakeholder review.",
		"Rutuja Dhamal",
		"2026-10-16T11:15:00.000Z"
	],
	[
		"activity_4",
		"control",
		"Control evidence approved",
		"Forecast model drift report accepted.",
		"Model Assurance",
		"2026-10-15T09:05:00.000Z"
	]
];
//#endregion
//#region worker/index.ts
var schema = `
CREATE TABLE IF NOT EXISTS ai_systems (id TEXT PRIMARY KEY,name TEXT NOT NULL,description TEXT NOT NULL,owner TEXT NOT NULL,department TEXT NOT NULL,model TEXT NOT NULL,purpose TEXT NOT NULL,risk TEXT NOT NULL,score INTEGER NOT NULL,status TEXT NOT NULL,framework TEXT NOT NULL,last_review TEXT NOT NULL,next_review TEXT NOT NULL,controls INTEGER NOT NULL DEFAULT 0,controls_complete INTEGER NOT NULL DEFAULT 0,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS assessments (id TEXT PRIMARY KEY,system_id TEXT NOT NULL,system_name TEXT NOT NULL,type TEXT NOT NULL,score INTEGER NOT NULL,status TEXT NOT NULL,completed_at TEXT NOT NULL,assessor TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS policies (id TEXT PRIMARY KEY,name TEXT NOT NULL,framework TEXT NOT NULL,version TEXT NOT NULL,coverage INTEGER NOT NULL,status TEXT NOT NULL,updated_at TEXT NOT NULL,owner TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS governance_tasks (id TEXT PRIMARY KEY,title TEXT NOT NULL,system_id TEXT NOT NULL,system_name TEXT NOT NULL,owner TEXT NOT NULL,due_date TEXT NOT NULL,priority TEXT NOT NULL,status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY,title TEXT NOT NULL,system_id TEXT NOT NULL,system_name TEXT NOT NULL,severity TEXT NOT NULL,status TEXT NOT NULL,reported_at TEXT NOT NULL,owner TEXT NOT NULL,summary TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY,kind TEXT NOT NULL,title TEXT NOT NULL,detail TEXT NOT NULL,actor TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS evidence_files (id TEXT PRIMARY KEY,system_id TEXT NOT NULL,system_name TEXT NOT NULL,name TEXT NOT NULL,object_key TEXT NOT NULL UNIQUE,mime_type TEXT NOT NULL,size INTEGER NOT NULL,uploaded_by TEXT NOT NULL,uploaded_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_ai_systems_risk_status ON ai_systems(risk,status);
CREATE INDEX IF NOT EXISTS idx_assessments_system_id ON assessments(system_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON governance_tasks(status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_evidence_system_id ON evidence_files(system_id);`;
function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store"
		}
	});
}
function viewerFrom(request) {
	const email = request.headers.get("oai-authenticated-user-email") ?? void 0;
	const name = request.headers.get("oai-authenticated-user-name")?.trim() || "Rutuja Dhamal";
	return {
		name,
		email,
		role: "Main admin",
		initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "RD"
	};
}
function canWrite(request) {
	return isLocalRequest(request) || Boolean(request.headers.get("oai-authenticated-user-id") || request.headers.get("oai-authenticated-user-email"));
}
async function ensureDatabase(db) {
	await db.exec(schema);
	if (((await db.prepare("SELECT COUNT(*) AS count FROM ai_systems").first())?.count ?? 0) > 0) return;
	await db.batch([
		...seedSystems.map((values) => db.prepare("INSERT INTO ai_systems (id,name,description,owner,department,model,purpose,risk,score,status,framework,last_review,next_review,controls,controls_complete) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(...values)),
		...seedAssessments.map((values) => db.prepare("INSERT INTO assessments (id,system_id,system_name,type,score,status,completed_at,assessor) VALUES (?,?,?,?,?,?,?,?)").bind(...values)),
		...seedPolicies.map((values) => db.prepare("INSERT INTO policies (id,name,framework,version,coverage,status,updated_at,owner) VALUES (?,?,?,?,?,?,?,?)").bind(...values)),
		...seedTasks.map((values) => db.prepare("INSERT INTO governance_tasks (id,title,system_id,system_name,owner,due_date,priority,status) VALUES (?,?,?,?,?,?,?,?)").bind(...values)),
		...seedIncidents.map((values) => db.prepare("INSERT INTO incidents (id,title,system_id,system_name,severity,status,reported_at,owner,summary) VALUES (?,?,?,?,?,?,?,?,?)").bind(...values)),
		...seedActivities.map((values) => db.prepare("INSERT INTO activities (id,kind,title,detail,actor,created_at) VALUES (?,?,?,?,?,?)").bind(...values))
	]);
}
async function queryAll(db, query) {
	return (await db.prepare(query).all()).results;
}
async function getSnapshot(db, viewer) {
	const [systems, assessments, policies, tasks, incidents, activities, evidence] = await Promise.all([
		queryAll(db, "SELECT id,name,description,owner,department,model,purpose,risk,score,status,framework,last_review AS lastReview,next_review AS nextReview,controls,controls_complete AS controlsComplete FROM ai_systems ORDER BY CASE risk WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, name"),
		queryAll(db, "SELECT id,system_id AS systemId,system_name AS systemName,type,score,status,completed_at AS completedAt,assessor FROM assessments ORDER BY completed_at DESC"),
		queryAll(db, "SELECT id,name,framework,version,coverage,status,updated_at AS updatedAt,owner FROM policies ORDER BY coverage DESC"),
		queryAll(db, "SELECT id,title,system_id AS systemId,system_name AS systemName,owner,due_date AS dueDate,priority,status FROM governance_tasks ORDER BY CASE status WHEN 'Open' THEN 1 WHEN 'In progress' THEN 2 ELSE 3 END, due_date"),
		queryAll(db, "SELECT id,title,system_id AS systemId,system_name AS systemName,severity,status,reported_at AS reportedAt,owner,summary FROM incidents ORDER BY reported_at DESC"),
		queryAll(db, "SELECT id,kind,title,detail,actor,created_at AS createdAt FROM activities ORDER BY created_at DESC LIMIT 20"),
		queryAll(db, "SELECT id,system_id AS systemId,system_name AS systemName,name,mime_type AS mimeType,size,uploaded_by AS uploadedBy,uploaded_at AS uploadedAt FROM evidence_files ORDER BY uploaded_at DESC")
	]);
	const openTasks = tasks.filter((task) => task.status !== "Completed").length;
	const openIncidents = incidents.filter((incident) => incident.status !== "Resolved").length;
	return {
		viewer,
		systems,
		assessments,
		policies,
		tasks,
		incidents,
		activities,
		evidence,
		metrics: calculateMetrics(systems, openTasks, openIncidents)
	};
}
async function addActivity(db, kind, title, detail, actor) {
	await db.prepare("INSERT INTO activities (id,kind,title,detail,actor,created_at) VALUES (?,?,?,?,?,?)").bind(makeId("activity"), kind, title, detail, actor, (/* @__PURE__ */ new Date()).toISOString()).run();
}
async function systemById(db, systemId) {
	return db.prepare("SELECT id,name FROM ai_systems WHERE id = ?").bind(systemId).first();
}
async function handleAction(request, env) {
	if (!isSameOrigin(request)) return json({ error: "Cross-origin request rejected." }, 403);
	if (!canWrite(request)) return json({ error: "Authentication is required for changes in production." }, 401);
	if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Content-Type must be application/json." }, 415);
	if (Number(request.headers.get("content-length") || "0") > 65536) return json({ error: "Request is too large." }, 413);
	const raw = await request.json();
	if (!isRecord(raw)) throw new InputError("Request body must be an object.");
	const action = cleanText(raw.action, "action", 40);
	const viewer = viewerFrom(request);
	if (action === "create-system") {
		const name = cleanText(raw.name, "name", 100);
		const owner = cleanText(raw.owner, "owner", 100);
		const department = cleanText(raw.department, "department", 100);
		const model = cleanText(raw.model, "model", 120);
		const purpose = cleanText(raw.purpose, "purpose", 160);
		const description = cleanText(raw.description, "description", 500);
		const risk = enumValue(raw.risk, riskLevels, "risk");
		const status = enumValue(raw.status, systemStatuses, "status");
		const framework = cleanText(raw.framework, "framework", 100);
		const id = makeId("system");
		const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		const nextReview = new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10);
		await env.DB.prepare("INSERT INTO ai_systems (id,name,description,owner,department,model,purpose,risk,score,status,framework,last_review,next_review,controls,controls_complete) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(id, name, description, owner, department, model, purpose, risk, 0, status, framework, today, nextReview, 12, 0).run();
		await addActivity(env.DB, "system", "AI system registered", `${name} was added to the governance inventory.`, viewer.name);
	} else if (action === "complete-task" || action === "advance-task") {
		const id = cleanText(raw.id, "id", 90);
		const task = await env.DB.prepare("SELECT title,status FROM governance_tasks WHERE id = ?").bind(id).first();
		if (!task) return json({ error: "Task not found." }, 404);
		const status = action === "complete-task" ? "Completed" : task.status === "Open" ? "In progress" : "Completed";
		enumValue(status, taskStatuses, "status");
		await env.DB.prepare("UPDATE governance_tasks SET status = ? WHERE id = ?").bind(status, id).run();
		await addActivity(env.DB, "task", "Review task updated", `${task.title} moved to ${status}.`, viewer.name);
	} else if (action === "create-incident") {
		const title = cleanText(raw.title, "title", 140);
		const summary = cleanText(raw.summary, "summary", 600);
		const owner = cleanText(raw.owner, "owner", 100);
		const severity = enumValue(raw.severity, riskLevels, "severity");
		const systemId = cleanText(raw.systemId, "systemId", 90);
		const system = await systemById(env.DB, systemId);
		if (!system) return json({ error: "AI system not found." }, 404);
		await env.DB.prepare("INSERT INTO incidents (id,title,system_id,system_name,severity,status,reported_at,owner,summary) VALUES (?,?,?,?,?,?,?,?,?)").bind(makeId("incident"), title, system.id, system.name, severity, "Open", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), owner, summary).run();
		await addActivity(env.DB, "incident", "Incident reported", `${title} was reported for ${system.name}.`, viewer.name);
	} else if (action === "resolve-incident") {
		const id = cleanText(raw.id, "id", 90);
		const incident = await env.DB.prepare("SELECT title FROM incidents WHERE id = ?").bind(id).first();
		if (!incident) return json({ error: "Incident not found." }, 404);
		await env.DB.prepare("UPDATE incidents SET status = 'Resolved' WHERE id = ?").bind(id).run();
		await addActivity(env.DB, "incident", "Incident resolved", `${incident.title} was marked resolved.`, viewer.name);
	} else if (action === "run-assessment") {
		const systemId = cleanText(raw.systemId, "systemId", 90);
		const system = await systemById(env.DB, systemId);
		if (!system) return json({ error: "AI system not found." }, 404);
		const score = 70 + Math.floor(Math.random() * 26);
		await env.DB.prepare("INSERT INTO assessments (id,system_id,system_name,type,score,status,completed_at,assessor) VALUES (?,?,?,?,?,?,?,?)").bind(makeId("assessment"), system.id, system.name, "On-demand governance review", score, score >= 80 ? "Passed" : "Attention", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), viewer.name).run();
		await env.DB.prepare("UPDATE ai_systems SET score = ?, last_review = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(score, (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), system.id).run();
		await addActivity(env.DB, "assessment", "Assessment completed", `${system.name} received a governance score of ${score}.`, viewer.name);
	} else return json({ error: "Unsupported action." }, 400);
	return json(await getSnapshot(env.DB, viewer));
}
async function handleEvidence(request, env) {
	if (!canWrite(request)) return json({ error: "Authentication is required for evidence access in production." }, 401);
	if (request.method === "GET") {
		const id = new URL(request.url).searchParams.get("id");
		if (!id || id.length > 100) return json({ error: "A valid evidence id is required." }, 400);
		const file = await env.DB.prepare("SELECT name,object_key AS objectKey,mime_type AS mimeType FROM evidence_files WHERE id = ?").bind(id).first();
		if (!file) return json({ error: "Evidence file not found." }, 404);
		const object = await env.EVIDENCE.get(file.objectKey);
		if (!object) return json({ error: "Stored evidence object is unavailable." }, 404);
		return new Response(object.body, { headers: {
			"Content-Type": file.mimeType,
			"Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
			"X-Content-Type-Options": "nosniff",
			"Cache-Control": "private, no-store"
		} });
	}
	if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
	if (!isSameOrigin(request)) return json({ error: "Cross-origin request rejected." }, 403);
	if (Number(request.headers.get("content-length") || "0") > 11e6) return json({ error: "Evidence file must be 10 MB or smaller." }, 413);
	const form = await request.formData();
	const upload = form.get("file");
	const systemIdValue = form.get("systemId");
	if (!(upload instanceof File)) return json({ error: "Select a file to upload." }, 400);
	if (typeof systemIdValue !== "string") return json({ error: "Select an AI system." }, 400);
	const system = await systemById(env.DB, cleanText(systemIdValue, "systemId", 90));
	if (!system) return json({ error: "AI system not found." }, 404);
	if (!allowedEvidenceTypes.has(upload.type)) return json({ error: "Unsupported file type." }, 415);
	if (upload.size < 1 || upload.size > 1e7) return json({ error: "Evidence file must be between 1 byte and 10 MB." }, 413);
	const bytes = await upload.arrayBuffer();
	if (!hasValidFileSignature(upload.type, new Uint8Array(bytes).slice(0, 16))) return json({ error: "File content does not match its declared type." }, 415);
	const id = makeId("evidence");
	const objectKey = `evidence/${system.id}/${crypto.randomUUID()}`;
	const name = safeFileName(upload.name);
	const viewer = viewerFrom(request);
	await env.EVIDENCE.put(objectKey, bytes, { httpMetadata: { contentType: upload.type } });
	try {
		await env.DB.prepare("INSERT INTO evidence_files (id,system_id,system_name,name,object_key,mime_type,size,uploaded_by,uploaded_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id, system.id, system.name, name, objectKey, upload.type, upload.size, viewer.name, (/* @__PURE__ */ new Date()).toISOString()).run();
	} catch (error) {
		await env.EVIDENCE.delete(objectKey);
		throw error;
	}
	await addActivity(env.DB, "evidence", "Evidence uploaded", `${name} was attached to ${system.name}.`, viewer.name);
	return json(await getSnapshot(env.DB, viewer), 201);
}
function withSecurityHeaders(response, request) {
	const headers = new Headers(response.headers);
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("X-Frame-Options", "DENY");
	headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
	headers.set("Cross-Origin-Opener-Policy", "same-origin");
	headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
	if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}
//#endregion
//#region \0virtual:cloudflare/worker-entry
var worker_entry_default = { async fetch(request, env) {
	try {
		const url = new URL(request.url);
		if (url.pathname === "/api/governance") {
			await ensureDatabase(env.DB);
			if (request.method === "GET") return withSecurityHeaders(json(await getSnapshot(env.DB, viewerFrom(request))), request);
			if (request.method === "POST") return withSecurityHeaders(await handleAction(request, env), request);
			return withSecurityHeaders(json({ error: "Method not allowed." }, 405), request);
		}
		if (url.pathname === "/api/evidence") {
			await ensureDatabase(env.DB);
			return withSecurityHeaders(await handleEvidence(request, env), request);
		}
		return withSecurityHeaders(await env.ASSETS.fetch(request), request);
	} catch (error) {
		if (error instanceof InputError || error instanceof SyntaxError) return withSecurityHeaders(json({ error: error instanceof InputError ? error.message : "Invalid request body." }, 400), request);
		console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
		return withSecurityHeaders(json({ error: "The request could not be completed." }, 500), request);
	}
} };
//#endregion
export { worker_entry_default as default };
