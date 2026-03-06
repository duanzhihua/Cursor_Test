import { create } from "zustand";
import type { Message, Session, ModelType, ModelInfo } from "../types";
import { DEFAULT_MODELS } from "../types";
import { sendMessage, fetchModels } from "../services/api";

interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  selectedModel: ModelType;
  availableModels: ModelInfo[];
  isLoading: boolean;
  sidebarOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setModel: (model: ModelType) => void;
  loadModels: () => Promise<void>;
  switchSession: (sessionId: string) => void;
  createSession: () => string;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;
  sendUserMessage: (content: string) => void;
  abortCurrentRequest: () => void;
}

const sessionMessages: Record<string, Message[]> = {};

let nextSessionNum = 1;
let currentAbort: (() => void) | null = null;

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  selectedModel: "deepseek-chat",
  availableModels: DEFAULT_MODELS,
  isLoading: false,
  sidebarOpen: true,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setModel: (model) => set({ selectedModel: model }),

  loadModels: async () => {
    const models = await fetchModels();
    if (models.length > 0) {
      set({ availableModels: models as ModelInfo[] });
    }
  },

  switchSession: (sessionId) => {
    set({
      currentSessionId: sessionId,
      messages: sessionMessages[sessionId] ?? [],
    });
  },

  createSession: () => {
    const id = generateId();
    const now = new Date().toISOString();
    const session: Session = {
      id,
      title: `新对话 ${nextSessionNum++}`,
      created_at: now,
      updated_at: now,
    };
    sessionMessages[id] = [];
    set((s) => ({
      sessions: [session, ...s.sessions],
      currentSessionId: id,
      messages: [],
    }));
    return id;
  },

  deleteSession: (sessionId) => {
    delete sessionMessages[sessionId];
    set((s) => {
      const sessions = s.sessions.filter((sess) => sess.id !== sessionId);
      const needSwitch = s.currentSessionId === sessionId;
      return {
        sessions,
        currentSessionId: needSwitch ? (sessions[0]?.id ?? null) : s.currentSessionId,
        messages: needSwitch ? (sessionMessages[sessions[0]?.id] ?? []) : s.messages,
      };
    });
  },

  renameSession: (sessionId, title) => {
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? { ...sess, title, updated_at: new Date().toISOString() }
          : sess,
      ),
    }));
  },

  abortCurrentRequest: () => {
    if (currentAbort) {
      currentAbort();
      currentAbort = null;
    }
    set({ isLoading: false });
  },

  sendUserMessage: (content) => {
    const { selectedModel } = get();
    let { currentSessionId } = get();

    if (!content.trim()) return;

    if (!currentSessionId) {
      const id = generateId();
      const now = new Date().toISOString();
      const session: Session = {
        id,
        title: content.trim().slice(0, 20) || `新对话 ${nextSessionNum++}`,
        created_at: now,
        updated_at: now,
      };
      sessionMessages[id] = [];
      set((s) => ({
        sessions: [session, ...s.sessions],
        currentSessionId: id,
        messages: [],
      }));
      currentSessionId = id;
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    const prevMessages = get().messages;
    const withUser = [...prevMessages, userMsg];
    sessionMessages[currentSessionId] = withUser;

    const aiMsgId = generateId();
    const isThinkingModel = selectedModel === "deepseek-reasoner";
    const aiMsg: Message = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      reasoning_content: undefined,
      model: selectedModel,
      isStreaming: true,
      isThinking: isThinkingModel,
      created_at: new Date().toISOString(),
    };

    const withAi = [...withUser, aiMsg];
    sessionMessages[currentSessionId] = withAi;
    set({ messages: withAi, isLoading: true });

    let aborted = false;
    currentAbort = () => { aborted = true; };

    const sessId = currentSessionId;

    sendMessage({
      message: content.trim(),
      model: selectedModel,
      history: prevMessages,

      onReasoning: (token) => {
        if (aborted) return;
        const msgs = get().messages.map((m) =>
          m.id === aiMsgId
            ? { ...m, reasoning_content: (m.reasoning_content ?? "") + token, isThinking: true }
            : m,
        );
        sessionMessages[sessId] = msgs;
        set({ messages: msgs });
      },

      onContent: (token) => {
        if (aborted) return;
        const msgs = get().messages.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: m.content + token, isThinking: false }
            : m,
        );
        sessionMessages[sessId] = msgs;
        set({ messages: msgs });
      },

      onDone: () => {
        if (aborted) return;
        currentAbort = null;
        const msgs = get().messages.map((m) =>
          m.id === aiMsgId
            ? { ...m, isStreaming: false, isThinking: false }
            : m,
        );
        sessionMessages[sessId] = msgs;

        const title = get().sessions.find((s) => s.id === sessId)?.title;
        const isDefaultTitle = title?.startsWith("新对话");
        const firstUserContent = userMsg.content.slice(0, 20);

        set((s) => ({
          messages: msgs,
          isLoading: false,
          sessions: s.sessions.map((sess) =>
            sess.id === sessId
              ? {
                  ...sess,
                  title: isDefaultTitle && firstUserContent ? firstUserContent : sess.title,
                  updated_at: new Date().toISOString(),
                }
              : sess,
          ),
        }));
      },

      onError: (errorMsg) => {
        if (aborted) return;
        currentAbort = null;
        const msgs = get().messages.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: m.content || `**错误**: ${errorMsg}`,
                isStreaming: false,
                isThinking: false,
              }
            : m,
        );
        sessionMessages[sessId] = msgs;
        set({ messages: msgs, isLoading: false });
      },
    });
  },
}));
