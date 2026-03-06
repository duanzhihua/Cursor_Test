import { create } from "zustand";
import type { Message, ModelInfo, ModelType, Session } from "../types";
import { DEFAULT_MODELS } from "../types";
import {
  createSession as createSessionApi,
  deleteSession as deleteSessionApi,
  fetchModels,
  fetchSessionDetail,
  fetchSessions,
  renameSession as renameSessionApi,
  sendMessage,
} from "../services/api";

interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  selectedModel: ModelType;
  availableModels: ModelInfo[];
  isLoading: boolean;
  isSessionLoading: boolean;
  sidebarOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setModel: (model: ModelType) => void;
  initializeApp: () => Promise<void>;
  loadModels: () => Promise<void>;
  loadSessions: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  createSession: () => Promise<string | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  sendUserMessage: (content: string) => Promise<void>;
  abortCurrentRequest: () => void;
}

const sessionMessages: Record<string, Message[]> = {};
let currentAbortController: AbortController | null = null;

function generateId() {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isModelType(model?: string): model is ModelType {
  return model === "deepseek-chat" || model === "deepseek-reasoner";
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: [],
  selectedModel: "deepseek-chat",
  availableModels: DEFAULT_MODELS,
  isLoading: false,
  isSessionLoading: false,
  sidebarOpen: true,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setModel: (model) => set({ selectedModel: model }),

  initializeApp: async () => {
    await Promise.all([get().loadModels(), get().loadSessions()]);
  },

  loadModels: async () => {
    const models = await fetchModels();
    if (models.length > 0) {
      set({ availableModels: models as ModelInfo[] });
    }
  },

  loadSessions: async () => {
    try {
      const sessions = await fetchSessions();
      const currentSessionId = get().currentSessionId;
      const nextSessionId = currentSessionId && sessions.some((s) => s.id === currentSessionId)
        ? currentSessionId
        : (sessions[0]?.id ?? null);

      set({
        sessions,
        currentSessionId: nextSessionId,
        messages: nextSessionId ? (sessionMessages[nextSessionId] ?? []) : [],
      });

      if (nextSessionId) {
        await get().switchSession(nextSessionId);
      }
    } catch (error) {
      console.error("Failed to load sessions", error);
    }
  },

  switchSession: async (sessionId) => {
    set({ currentSessionId: sessionId, isSessionLoading: true });

    try {
      const detail = await fetchSessionDetail(sessionId);
      sessionMessages[sessionId] = detail.messages;
      set((s) => ({
        currentSessionId: sessionId,
        messages: detail.messages,
        isSessionLoading: false,
        selectedModel: isModelType(detail.default_model) ? detail.default_model : s.selectedModel,
        sessions: s.sessions.map((session) =>
          session.id === detail.id ? { ...session, ...detail } : session,
        ),
      }));
    } catch (error) {
      console.error("Failed to load session detail", error);
      set({ isSessionLoading: false });
    }
  },

  createSession: async () => {
    try {
      const session = await createSessionApi(get().selectedModel);
      sessionMessages[session.id] = [];
      set((s) => ({
        sessions: [session, ...s.sessions],
        currentSessionId: session.id,
        messages: [],
      }));
      return session.id;
    } catch (error) {
      console.error("Failed to create session", error);
      return null;
    }
  },

  deleteSession: async (sessionId) => {
    await deleteSessionApi(sessionId);
    delete sessionMessages[sessionId];
    const remaining = get().sessions.filter((session) => session.id !== sessionId);
    const nextSessionId = get().currentSessionId === sessionId ? (remaining[0]?.id ?? null) : get().currentSessionId;

    set({
      sessions: remaining,
      currentSessionId: nextSessionId,
      messages: nextSessionId && nextSessionId !== sessionId ? (sessionMessages[nextSessionId] ?? []) : [],
    });

    if (nextSessionId) {
      await get().switchSession(nextSessionId);
    }
  },

  renameSession: async (sessionId, title) => {
    const updated = await renameSessionApi(sessionId, title);
    set((s) => ({
      sessions: s.sessions.map((session) =>
        session.id === sessionId ? { ...session, ...updated } : session,
      ),
    }));
  },

  abortCurrentRequest: () => {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    set({ isLoading: false });
  },

  sendUserMessage: async (content) => {
    const { selectedModel } = get();
    let { currentSessionId } = get();
    const trimmed = content.trim();

    if (!trimmed || get().isLoading) return;

    if (!currentSessionId) {
      currentSessionId = await get().createSession();
    }

    if (!currentSessionId) {
      return;
    }

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    const prevMessages = [...(sessionMessages[currentSessionId] ?? [])];
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
    if (get().currentSessionId === currentSessionId) {
      set({ messages: withAi });
    }
    set({ isLoading: true });

    const sessId = currentSessionId;
    const controller = new AbortController();
    currentAbortController = controller;

    const updateSessionMessages = (updater: (messages: Message[]) => Message[]) => {
      const nextMessages = updater(sessionMessages[sessId] ?? []);
      sessionMessages[sessId] = nextMessages;
      if (get().currentSessionId === sessId) {
        set({ messages: nextMessages });
      }
    };

    await sendMessage({
      sessionId: sessId,
      message: trimmed,
      model: selectedModel,
      signal: controller.signal,

      onReasoning: (token) => {
        updateSessionMessages((messages) => messages.map((m) =>
          m.id === aiMsgId
            ? { ...m, reasoning_content: (m.reasoning_content ?? "") + token, isThinking: true }
            : m,
        ));
      },

      onContent: (token) => {
        updateSessionMessages((messages) => messages.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: m.content + token, isThinking: false }
            : m,
        ));
      },

      onDone: async () => {
        if (currentAbortController === controller) {
          currentAbortController = null;
        }

        updateSessionMessages((messages) => messages.map((m) =>
          m.id === aiMsgId
            ? { ...m, isStreaming: false, isThinking: false }
            : m,
        ));

        try {
          const [sessions, detail] = await Promise.all([
            fetchSessions(),
            fetchSessionDetail(sessId),
          ]);
          sessionMessages[sessId] = detail.messages;
          set({
            sessions,
            messages: get().currentSessionId === sessId ? detail.messages : get().messages,
            isLoading: false,
          });
        } catch (error) {
          console.error("Failed to refresh session after response", error);
          set({ isLoading: false });
        }
      },

      onError: async (errorMsg) => {
        if (currentAbortController === controller) {
          currentAbortController = null;
        }

        updateSessionMessages((messages) => messages.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: m.content || `**错误**: ${errorMsg}`,
                isStreaming: false,
                isThinking: false,
              }
            : m,
        ));
        set({ isLoading: false });
      },
    });
  },
}));
