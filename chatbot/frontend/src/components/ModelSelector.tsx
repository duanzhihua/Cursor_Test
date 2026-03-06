import { useState, useRef, useEffect } from "react";
import { ChevronDown, Sparkles, MessageSquare, Check } from "lucide-react";
import type { ModelType, ModelInfo } from "../types";
import { useChatStore } from "../store/chatStore";

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
}

function getModelIcon(id: ModelType) {
  return id === "deepseek-reasoner" ? Sparkles : MessageSquare;
}

export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const models = useChatStore((s) => s.availableModels);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = models.find((m: ModelInfo) => m.id === value) ?? models[0];
  if (!selected) return null;

  const Icon = getModelIcon(value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
          bg-gray-700/50 hover:bg-gray-700 border border-gray-600
          text-gray-300 transition-colors"
      >
        <Icon size={14} className={value === "deepseek-reasoner" ? "text-purple-400" : "text-blue-400"} />
        <span>{selected.name}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-gray-800 border border-gray-700
          rounded-lg shadow-xl z-50 overflow-hidden"
        >
          {models.map((model: ModelInfo) => {
            const MIcon = getModelIcon(model.id);
            const isActive = model.id === value;
            return (
              <button
                key={model.id}
                onClick={() => {
                  onChange(model.id);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors
                  ${isActive ? "bg-blue-600/15" : "hover:bg-gray-700/60"}`}
              >
                <MIcon
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    model.id === "deepseek-reasoner" ? "text-purple-400" : "text-blue-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isActive ? "text-blue-300" : "text-gray-300"}`}>
                      {model.name}
                    </span>
                    {model.supports_thinking && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 leading-none">
                        思考链
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                </div>
                {isActive && <Check size={16} className="text-blue-400 mt-0.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
