import React from "react";
import { useSessionContext } from "../../context/SessionContext";

export const Sidebar: React.FC = () => {
  const { sessions, activeSessionId, setActiveSessionId } = useSessionContext();

  return (
    <aside
      style={{
        borderRadius: "1rem",
        background:
          "radial-gradient(circle at top left, rgba(37,99,235,0.28), transparent 55%), rgba(15,23,42,0.9)",
        border: "1px solid rgba(31,41,55,0.9)",
        padding: "0.85rem 0.75rem 0.75rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        minHeight: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#e5e7eb" }}>会话列表</div>
        {/* Phase 4：新建会话交互将在后续扩展为真实 createSession，这里先保留入口按钮 */}
        <span
          style={{
            borderRadius: 999,
            border: "1px solid rgba(59,130,246,0.25)",
            padding: "0.15rem 0.6rem",
            fontSize: "0.7rem",
            color: "#6b7280",
          }}
        >
          会话由后端自动创建
        </span>
      </div>

      <div
        style={{
          borderRadius: "0.8rem",
          backgroundColor: "rgba(15,23,42,0.8)",
          border: "1px dashed rgba(55,65,81,0.9)",
          padding: "0.5rem 0.6rem",
          fontSize: "0.75rem",
          color: "#9ca3af",
        }}
      >
        从左侧选择一个会话，查看其对话记录与推荐图表。
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingRight: "0.1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
        }}
      >
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              type="button"
              onClick={() => setActiveSessionId(session.id)}
              style={{
                width: "100%",
                textAlign: "left",
                borderRadius: "0.65rem",
                border: isActive
                  ? "1px solid rgba(59,130,246,0.95)"
                  : "1px solid rgba(31,41,55,0.9)",
                padding: "0.55rem 0.55rem",
                background: isActive
                  ? "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.9))"
                  : "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.9))",
                color: "#e5e7eb",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
                title={session.name}
              >
                {session.name}
              </span>
              {session.updated_at && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      backgroundColor: isActive ? "#22c55e" : "#6b7280",
                    }}
                  />
                  最近更新：{new Date(session.updated_at).toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

