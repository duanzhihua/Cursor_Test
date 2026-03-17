import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Message } from "../mocks/data";
import type { ChartSpec, ChatQueryResponse, SessionSummary } from "../services/api";
import { chatQuery, createSession, listSessions } from "../services/api";

interface SessionContextValue {
  sessions: SessionSummary[];
  activeSessionId: number | null;
  setActiveSessionId: (id: number | null) => void;
  messages: Message[];
  lastChartData: {
    chartSpec: ChartSpec | null;
    data: Array<Record<string, unknown>>;
    sql: string | null;
    nl2sql_analysis: string | null;
  };
  sendMessage: (content: string) => Promise<void>;
  isThinking: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const useSessionContext = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return ctx;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastChart, setLastChart] = useState<{
    chartSpec: ChartSpec | null;
    data: Array<Record<string, unknown>>;
    sql: string | null;
    nl2sql_analysis: string | null;
  }>({
    chartSpec: null,
    data: [],
    sql: null,
    nl2sql_analysis: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const list = await listSessions();
        if (list.length === 0) {
          const created = await createSession("默认会话");
          setSessions([{ id: created.session_id, name: "默认会话", updated_at: new Date().toISOString() }]);
          setActiveSessionId(created.session_id);
        } else {
          setSessions(list);
          setActiveSessionId(list[0]?.id ?? null);
        }
      } catch (e) {
        console.error("加载会话列表失败", e);
      }
    })();
  }, []);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isThinking) return;

    const now = new Date().toISOString();
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: now,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      let sessionId = activeSessionId;
      let resp: ChatQueryResponse;
      if (!sessionId) {
        const created = await createSession("默认会话");
        sessionId = created.session_id;
        setActiveSessionId(sessionId);
        setSessions((prev) => [
          { id: sessionId!, name: "默认会话", updated_at: now },
          ...prev,
        ]);
      }

      resp = await chatQuery({
        session_id: sessionId!,
        user_query: trimmed,
      });

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: resp.answer_text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLastChart({
        chartSpec: resp.chart_spec,
        data: resp.data,
        sql: resp.sql,
        nl2sql_analysis: resp.nl2sql_analysis,
      });
    } catch (e) {
      console.error("chatQuery 失败", e);
      const errMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "后端查询失败，请稍后重试。",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const value = useMemo<SessionContextValue>(
    () => ({
      sessions,
      activeSessionId,
      setActiveSessionId,
      messages,
      lastChartData: lastChart,
      sendMessage,
      isThinking,
    }),
    [sessions, activeSessionId, messages, lastChart, isThinking],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

