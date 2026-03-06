import type { Message, ModelType, ModelInfo, SSEEvent } from "../types";

interface SendMessageParams {
  message: string;
  model: ModelType;
  history: Message[];
  onReasoning: (token: string) => void;
  onContent: (token: string) => void;
  onDone: (usage?: SSEEvent["usage"]) => void;
  onError: (error: string) => void;
}

export async function fetchModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch("/api/models");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    console.error("Failed to fetch models, using defaults");
    return [];
  }
}

export async function sendMessage({
  message,
  model,
  history,
  onReasoning,
  onContent,
  onDone,
  onError,
}: SendMessageParams): Promise<void> {
  const historyItems = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const body = JSON.stringify({
    message,
    model,
    history: historyItems,
  });

  let response: Response;
  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
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
            onDone(event.usage ?? undefined);
            return;
          case "error":
            onError(event.message ?? "未知错误");
            return;
        }
      }
    }

    onDone();
  } catch {
    onError("流式读取中断");
  }
}
