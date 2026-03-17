import axios from "axios";

// 开发阶段：走 Vite 代理，避免浏览器 CORS 问题
// 生产环境可通过 VITE_BACKEND_URL 覆盖为真实后端地址
const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim().length > 0
    ? import.meta.env.VITE_BACKEND_URL
    : "";

// ---------- 后端接口类型（与 Phase 3 规范保持一致） ----------

export interface SessionSummary {
  id: number;
  name: string;
  updated_at: string;
}

export interface SessionCreateResponse {
  session_id: number;
}

export interface ChartSpec {
  type: string;
  x_field?: string | null;
  y_field?: string | null;
  series_field?: string | null;
  title?: string | null;
  extra: Record<string, unknown>;
}

export interface ChatQueryResponse {
  session_id: number;
  answer_text: string;
  sql: string;
  data: Array<Record<string, unknown>>;
  chart_spec: ChartSpec;
  nl2sql_analysis: string;
}

// ---------- 基础健康检查 ----------

export async function fetchHealth(): Promise<"ok" | "error"> {
  try {
    const resp = await axios.get<{ status: string }>(`${API_BASE_URL}/health`);
    return resp.data.status === "ok" ? "ok" : "error";
  } catch {
    return "error";
  }
}

// ---------- Phase 3：会话与聊天接口 ----------

export async function createSession(name?: string): Promise<SessionCreateResponse> {
  const resp = await axios.post<SessionCreateResponse>(`${API_BASE_URL}/api/session/create`, {
    name,
  });
  return resp.data;
}

export async function listSessions(): Promise<SessionSummary[]> {
  const resp = await axios.get<SessionSummary[]>(`${API_BASE_URL}/api/session/list`);
  return resp.data;
}

export async function chatQuery(params: {
  session_id?: number;
  user_query: string;
  chart_preferences?: Record<string, unknown>;
}): Promise<ChatQueryResponse> {
  const resp = await axios.post<ChatQueryResponse>(`${API_BASE_URL}/api/chat/query`, params);
  return resp.data;
}

