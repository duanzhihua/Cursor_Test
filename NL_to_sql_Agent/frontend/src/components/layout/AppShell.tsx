import React from "react";
import { Sidebar } from "../sessions/Sidebar";
import { ChatPane } from "../chat/ChatPane";
import { ChartPane } from "../charts/ChartPane";

export const AppShell: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(circle at top, #020617 0, #020617 40%, #000000 100%)",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          padding: "0.9rem 1.8rem",
          borderBottom: "1px solid rgba(15,23,42,0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background:
            "linear-gradient(90deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96), rgba(30,64,175,0.35))",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background:
                "conic-gradient(from 180deg at 50% 50%, #22c55e, #0ea5e9, #6366f1, #22c55e)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(59,130,246,0.7)",
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                backgroundColor: "#020617",
                display: "block",
              }}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.16em",
                color: "#9ca3af",
              }}
            >
              NL → SQL · ANALYTICS
            </div>
            <div style={{ fontSize: "1.05rem", fontWeight: 600 }}>智能数据分析工作台</div>
          </div>
        </div>
        <div
          style={{
            padding: "0.25rem 0.7rem",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.5)",
            fontSize: "0.75rem",
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(15,23,42,0.9)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: "#22c55e",
              boxShadow: "0 0 12px #22c55e",
            }}
          />
          <span>Phase 2 · Mock UI</span>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(220px, 260px) minmax(420px, 1.4fr) minmax(320px, 1.1fr)",
          gap: "0.75rem",
          padding: "0.9rem 1rem 1rem",
        }}
      >
        <Sidebar />
        <ChatPane />
        <ChartPane />
      </main>
    </div>
  );
};

