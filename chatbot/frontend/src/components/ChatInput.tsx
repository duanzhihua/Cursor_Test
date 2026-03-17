import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import ModelSelector from "./ModelSelector";
import type { ModelType } from "../types";

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading: boolean;
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
}

export default function ChatInput({ onSend, isLoading, selectedModel, onModelChange }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isLoading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="mb-2">
          <ModelSelector value={selectedModel} onChange={onModelChange} />
        </div>

        <div className="flex items-end gap-2 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2
          focus-within:border-blue-500/50 transition-colors"
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-gray-200 text-sm placeholder-gray-500
              resize-none outline-none min-h-[24px] max-h-[200px] py-1
              disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
              bg-blue-600 text-white hover:bg-blue-500
              disabled:opacity-40 disabled:hover:bg-blue-600
              transition-colors"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>

        <p className="text-xs text-gray-600 text-center mt-2">
          AI 可能会产生不准确的信息，请注意甄别
        </p>
      </div>
    </div>
  );
}
