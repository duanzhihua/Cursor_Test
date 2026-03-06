import { Plus, PanelLeftClose } from "lucide-react";
import SessionItem from "./SessionItem";
import type { Session } from "../types";

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClose: () => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onClose,
}: SidebarProps) {
  return (
    <div className="h-full flex flex-col bg-gray-950 border-r border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-800/60">
        <h1 className="text-base font-semibold text-gray-200 px-1">ChatBot</h1>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
          title="收起侧边栏"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 py-3">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg
            border border-gray-700 border-dashed text-gray-400
            hover:text-gray-200 hover:border-gray-500 hover:bg-gray-800/40
            transition-colors text-sm"
        >
          <Plus size={16} />
          新建对话
        </button>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto py-1 space-y-0.5">
        {sessions.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">暂无对话</p>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              id={session.id}
              title={session.title}
              isActive={session.id === currentSessionId}
              onSelect={() => onSelectSession(session.id)}
              onDelete={() => onDeleteSession(session.id)}
              onRename={(title) => onRenameSession(session.id, title)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-800/60">
        <p className="text-xs text-gray-600 text-center">Powered by DeepSeek</p>
      </div>
    </div>
  );
}
