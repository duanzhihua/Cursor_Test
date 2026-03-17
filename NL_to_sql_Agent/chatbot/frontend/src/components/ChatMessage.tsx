import { User, Bot, Sparkles, MessageSquare } from "lucide-react";
import type { Message } from "../types";
import { useChatStore } from "../store/chatStore";
import MarkdownBlock from "./MarkdownBlock";
import ThinkingBlock from "./ThinkingBlock";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const models = useChatStore((s) => s.availableModels);
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex gap-3 justify-end py-4">
        <div className="max-w-[70%]">
          <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
          <User size={16} className="text-white" />
        </div>
      </div>
    );
  }

  const isReasoner = message.model === "deepseek-reasoner";
  const ModelIcon = isReasoner ? Sparkles : MessageSquare;
  const modelInfo = models.find((m) => m.id === message.model);
  const modelLabel = modelInfo?.name ?? (isReasoner ? "深度思考" : "对话模型");
  const hasThinking = !!(message.reasoning_content || message.isThinking);

  return (
    <div className="flex gap-3 py-4">
      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
        <Bot size={16} className="text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        {message.model && (
          <div className="flex items-center gap-1.5 mb-2">
            <ModelIcon
              size={12}
              className={isReasoner ? "text-purple-400" : "text-blue-400"}
            />
            <span className={`text-xs font-medium ${isReasoner ? "text-purple-400" : "text-blue-400"}`}>
              {modelLabel}
            </span>
            {isReasoner && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 leading-none">
                思考链
              </span>
            )}
          </div>
        )}

        {hasThinking && (
          <ThinkingBlock
            content={message.reasoning_content ?? ""}
            isStreaming={!!message.isThinking}
          />
        )}

        {message.content ? (
          <div className="text-sm leading-relaxed">
            <MarkdownBlock content={message.content} />
          </div>
        ) : (
          !message.isThinking && message.isStreaming && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 py-1">
              <span>正在生成回答</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
