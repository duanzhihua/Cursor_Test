import type {
  ModelInfo,
  ModelType,
  Session,
  SessionDetail,
  SSEEvent,
} from "../types";

interface SendMessageParams {
  sessionId: string;
  message: string;
  model: ModelType;
  onReasoning: (token: string) => void;
  onContent: (token: string) => void;
  onDone: (usage?: SSEEvent["usage"]) => void | Promise<void>;
  onError: (error: string) => void | Promise<void>;
  signal?: AbortSignal;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    return await requestJson<ModelInfo[]>("/api/models");
  } catch {
    console.error("Failed to fetch models, using defaults");
    return [];
  }
}

export async function fetchSessions(): Promise<Session[]> {
  return requestJson<Session[]>("/api/sessions");
}

export async function fetchSessionDetail(sessionId: string): Promise<SessionDetail> {
  return requestJson<SessionDetail>(`/api/sessions/${sessionId}`);
}

export async function createSession(model: ModelType): Promise<Session> {
  return requestJson<Session>("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "新对话",
      default_model: model,
    }),
  });
}

export async function renameSession(sessionId: string, title: string): Promise<Session> {
  return requestJson<Session>(`/api/sessions/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function deleteSession(sessionId: string): Promise<void> {
  await requestJson<void>(`/api/sessions/${sessionId}`, {
    method: "DELETE",
  });
}

export async function sendMessage({
  sessionId,
  message,
  model,
  onReasoning,
  onContent,
  onDone,
  onError,
  signal,
}: SendMessageParams): Promise<void> {
  const body = JSON.stringify({
    session_id: sessionId,
    message,
    model,
  });

  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    onError("网络连接失败，请检查后端服务是否启动");
    return;
  }

  if (!response.ok) {
    onError(`服务器错误: HTTP ${response.status}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("无法读取响应流");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        if (!jsonStr) continue;

        let event: SSEEvent;
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue;
        }

        switch (event.type) {
          case "reasoning":
            if (event.token) onReasoning(event.token);
            break;
          case "content":
            if (event.token) onContent(event.token);
            break;
          case "done":
            await onDone(event.usage ?? undefined);
            return;
          case "error":
            await onError(event.message ?? "未知错误");
            return;
        }
      }
    }

    await onDone();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }
    await onError("流式读取中断");
  }
}
