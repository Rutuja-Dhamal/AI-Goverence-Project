import type { AiSystem, GovernanceMetrics, RiskLevel, SystemStatus, TaskStatus } from "../src/types";

export const riskLevels: readonly RiskLevel[] = ["Critical", "High", "Medium", "Low"];
export const systemStatuses: readonly SystemStatus[] = ["Production", "Pilot", "Review", "Retired"];
export const taskStatuses: readonly TaskStatus[] = ["Open", "In progress", "Completed"];

export class InputError extends Error {}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function cleanText(value: unknown, field: string, maxLength = 180): string {
  if (typeof value !== "string") throw new InputError(`${field} must be text.`);
  const result = Array.from(value.trim(), (character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127 ? " " : character;
  }).join("");
  if (!result) throw new InputError(`${field} is required.`);
  if (result.length > maxLength) throw new InputError(`${field} must be ${maxLength} characters or fewer.`);
  return result;
}

export function enumValue<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new InputError(`${field} has an unsupported value.`);
  }
  return value as T;
}

export function calculateMetrics(
  systems: Pick<AiSystem, "risk" | "score" | "controls" | "controlsComplete">[],
  openTasks: number,
  openIncidents: number,
): GovernanceMetrics {
  const totalControls = systems.reduce((sum, item) => sum + item.controls, 0);
  const completedControls = systems.reduce((sum, item) => sum + item.controlsComplete, 0);
  return {
    totalSystems: systems.length,
    highRiskSystems: systems.filter((item) => item.risk === "Critical" || item.risk === "High").length,
    openTasks,
    openIncidents,
    averageCompliance: systems.length
      ? Math.round(systems.reduce((sum, item) => sum + item.score, 0) / systems.length)
      : 0,
    completedControls,
    totalControls,
  };
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function safeFileName(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._ -]/g, "_").replace(/\s+/g, " ").trim();
  return (cleaned || "evidence-file").slice(0, 120);
}

export const allowedEvidenceTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export function hasValidFileSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "application/pdf") return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type.includes("openxmlformats")) return bytes[0] === 0x50 && bytes[1] === 0x4b;
  return type === "text/plain" || type === "text/csv";
}
