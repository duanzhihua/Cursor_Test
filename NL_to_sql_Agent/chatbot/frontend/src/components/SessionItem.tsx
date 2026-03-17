import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";

interface SessionItemProps {
  id: string;
  title: string;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export default function SessionItem({
  title,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: SessionItemProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRenameSubmit = () => {
    if (editValue.trim()) {
      onRename(editValue.trim());
    }
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleRenameSubmit();
    if (e.key === "Escape") {
      setEditValue(title);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 mx-2 rounded-lg bg-gray-700/50">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRenameSubmit}
          className="flex-1 bg-transparent text-sm text-gray-200 outline-none min-w-0"
        />
        <button onClick={handleRenameSubmit} className="p-1 text-green-400 hover:text-green-300">
          <Check size={14} />
        </button>
        <button
          onClick={() => { setEditValue(title); setEditing(false); }}
          className="p-1 text-gray-500 hover:text-gray-300"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer
        transition-colors text-sm
        ${isActive
          ? "bg-gray-700/70 text-white"
          : "text-gray-400 hover:bg-gray-800/60 hover:text-gray-200"}`}
    >
      <MessageSquare size={14} className="shrink-0" />
      <span className="flex-1 truncate">{title}</span>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {showConfirm ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 text-red-400 hover:text-red-300"
              title="确认删除"
            >
              <Check size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
              className="p-1 text-gray-500 hover:text-gray-300"
              title="取消"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true); setEditValue(title); }}
              className="p-1 text-gray-500 hover:text-gray-300"
              title="重命名"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              className="p-1 text-gray-500 hover:text-red-400"
              title="删除"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
