import { Bot, Sparkles, Code, BookOpen } from "lucide-react";

interface WelcomeScreenProps {
  onExampleClick: (text: string) => void;
}

const EXAMPLES = [
  { icon: Code, text: "用 Python 实现一个 LRU 缓存", color: "text-green-400" },
  { icon: Sparkles, text: "证明根号 2 是无理数", color: "text-purple-400" },
  { icon: BookOpen, text: "解释 React 虚拟 DOM 的工作原理", color: "text-blue-400" },
];

export default function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600
        flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20"
      >
        <Bot size={32} className="text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">你好，有什么可以帮你？</h2>
      <p className="text-gray-500 text-sm mb-8 text-center max-w-md">
        支持 DeepSeek 推理模型与对话模型，可处理编程、数学、写作等各类问题
      </p>

      <div className="grid gap-3 w-full max-w-md">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.text}
            onClick={() => onExampleClick(ex.text)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl
              bg-gray-800/50 border border-gray-700/50
              hover:bg-gray-800 hover:border-gray-600
              transition-colors text-left group"
          >
            <ex.icon size={18} className={`${ex.color} shrink-0`} />
            <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">
              {ex.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
