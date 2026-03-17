import React, { useEffect, useRef, useState } from "react";
import { useSessionContext } from "../../context/SessionContext";

export const ChatPane: React.FC = () => {
  const { sessions, activeSessionId, messages, sendMessage, isThinking } = useSessionContext();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isThinking) return;
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section
      style={{
        borderRadius: "1rem",
        background:
          "radial-gradient(circle at top, rgba(59,130,246,0.24), transparent 60%), rgba(15,23,42,0.95)",
        border: "1px solid rgba(31,41,55,0.9)",
        padding: "0.85rem 0.9rem 0.85rem",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.6rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#e5e7eb" }}>问答对话</div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
            当前会话：
            {activeSessionId
              ? sessions.find((s) => s.id === activeSessionId)?.name ?? `#${activeSessionId}`
              : "加载中..."}
          </div>
        </div>
        <div
          style={{
            fontSize: "0.7rem",
            color: "#9ca3af",
            padding: "0.15rem 0.6rem",
            borderRadius: 999,
            border: "1px solid rgba(55,65,81,0.9)",
            backgroundColor: "rgba(15,23,42,0.9)",
          }}
        >
          Phase 4 · 实时查询
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.6rem 0.45rem 0.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "0.4rem 0.7rem",
                  borderRadius: isUser ? "0.7rem 0.1rem 0.7rem 0.7rem" : "0.1rem 0.7rem 0.7rem 0.7rem",
                  background: isUser
                    ? "linear-gradient(135deg, #22c55e, #16a34a)"
                    : "linear-gradient(135deg, rgba(31,41,55,0.98), rgba(15,23,42,0.98))",
                  color: isUser ? "#022c22" : "#e5e7eb",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  boxShadow: isUser
                    ? "0 10px 25px rgba(34,197,94,0.35)"
                    : "0 10px 25px rgba(15,23,42,0.9)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "0.4rem 0.7rem",
                borderRadius: "0.1rem 0.7rem 0.7rem 0.7rem",
                background:
                  "linear-gradient(135deg, rgba(31,41,55,0.98), rgba(15,23,42,0.98))",
                border: "1px solid rgba(55,65,81,0.9)",
                fontSize: "0.8rem",
                color: "#9ca3af",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>助手正在思考</span>
              <span
                style={{
                  display: "inline-flex",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: "#6b7280",
                  }}
                />
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: "#9ca3af",
                  }}
                />
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    backgroundColor: "#6b7280",
                  }}
                />
              </span>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "0.7rem",
          borderRadius: "0.8rem",
          border: "1px solid rgba(55,65,81,0.95)",
          background:
            "radial-gradient(circle at top left, rgba(30,64,175,0.3), transparent 55%), rgba(15,23,42,0.96)",
          padding: "0.5rem 0.6rem 0.55rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.45rem",
        }}
      >
        <textarea
          placeholder="用自然语言描述你想分析的问题，例如“最近 7 天各地区销售额的趋势？”"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          style={{
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "#e5e7eb",
            fontSize: "0.84rem",
            lineHeight: 1.5,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>
            回车发送 · Shift+Enter 换行（已接入后端 NL→SQL 实时查询）
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            style={{
              borderRadius: 999,
              padding: "0.35rem 0.9rem",
              border: "none",
              cursor: !input.trim() || isThinking ? "not-allowed" : "pointer",
              fontSize: "0.8rem",
              fontWeight: 500,
              background: !input.trim() || isThinking
                ? "linear-gradient(135deg, #4b5563, #374151)"
                : "linear-gradient(135deg, #2563eb, #4f46e5)",
              color: "#e5e7eb",
              boxShadow: !input.trim() || isThinking
                ? "none"
                : "0 10px 25px rgba(59,130,246,0.45)",
              opacity: !input.trim() || isThinking ? 0.6 : 1,
            }}
          >
            发送
          </button>
        </div>
      </div>
    </section>
  );
};

