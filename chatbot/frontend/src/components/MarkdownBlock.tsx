import { useState, useCallback, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.min.css";
import { Copy, Check } from "lucide-react";

function CodeBlock({ className, children, ...rest }: ComponentPropsWithoutRef<"code"> & { node?: unknown }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className ?? "");
  const isBlock = match || (typeof children === "string" && children.includes("\n"));

  const handleCopy = useCallback(() => {
    const text = String(children).replace(/\n$/, "");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [children]);

  if (!isBlock) {
    return (
      <code className="bg-gray-700/60 text-pink-300 px-1.5 py-0.5 rounded text-sm" {...rest}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-3">
      <div className="flex items-center justify-between bg-gray-700/80 rounded-t-lg px-4 py-1.5 text-xs text-gray-400">
        <span>{match?.[1] ?? "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-200 transition-colors"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="!mt-0 !rounded-t-none">
        <code className={className} {...rest}>
          {children}
        </code>
      </pre>
    </div>
  );
}

interface MarkdownBlockProps {
  content: string;
}

export default function MarkdownBlock({ content }: MarkdownBlockProps) {
  return (
    <div className="markdown-body prose prose-invert prose-sm max-w-none
      prose-p:my-2 prose-headings:my-3 prose-li:my-0.5
      prose-pre:bg-gray-800/80 prose-pre:rounded-b-lg
      prose-table:border-collapse
      prose-th:bg-gray-700/50 prose-th:px-3 prose-th:py-2 prose-th:border prose-th:border-gray-600
      prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-gray-700
      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
      prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-950/20 prose-blockquote:py-1 prose-blockquote:px-4
      prose-strong:text-gray-100
      prose-img:rounded-lg"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{ code: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
