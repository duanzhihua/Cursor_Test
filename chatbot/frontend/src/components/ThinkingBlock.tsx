import { useState, useEffect } from "react";
import { ChevronRight, Brain } from "lucide-react";
import MarkdownBlock from "./MarkdownBlock";

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
}

export default function ThinkingBlock({ content, isStreaming = false }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isStreaming) setExpanded(true);
  }, [isStreaming]);

  return (
    <div className="mb-3 border border-gray-700/60 rounded-lg overflow-hidden bg-gray-800/30">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400
          hover:bg-gray-700/30 transition-colors"
      >
        <Brain size={16} className="text-purple-400 shrink-0" />
        <span className="font-medium text-purple-300">
          {isStreaming ? "思考中..." : "思考过程"}
        </span>
        {isStreaming && (
          <span className="flex gap-0.5 ml-1">
            <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        )}
        <ChevronRight
          size={16}
          className={`ml-auto shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 border-t border-gray-700/40 bg-gray-800/20 text-sm text-gray-400">
          {content ? (
            <MarkdownBlock content={content} />
          ) : (
            <span className="text-gray-600 italic">等待思考内容...</span>
          )}
        </div>
      </div>
    </div>
  );
}
