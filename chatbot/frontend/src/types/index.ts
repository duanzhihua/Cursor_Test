export type ModelType = "deepseek-reasoner" | "deepseek-chat";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning_content?: string;
  model?: ModelType;
  isStreaming?: boolean;
  isThinking?: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ModelInfo {
  id: ModelType;
  name: string;
  description: string;
  supports_thinking: boolean;
}

export const DEFAULT_MODELS: ModelInfo[] = [
  {
    id: "deepseek-reasoner",
    name: "DeepSeek 深度思考",
    description: "开启思考链，擅长数学、逻辑推理、编程",
    supports_thinking: true,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek 对话",
    description: "通用对话，快速响应",
    supports_thinking: false,
  },
];

export interface SSEEvent {
  type: "reasoning" | "content" | "done" | "error";
  token?: string;
  message?: string;
  model?: string;
  usage?: { total_tokens: number; reasoning_tokens: number };
}
