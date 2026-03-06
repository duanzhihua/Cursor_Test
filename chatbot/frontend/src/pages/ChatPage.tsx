import { useEffect, useRef } from "react";
import { PanelLeft } from "lucide-react";
import { useChatStore } from "../store/chatStore";
import Sidebar from "../components/Sidebar";
import ChatMessage from "../components/ChatMessage";
import ChatInput from "../components/ChatInput";
import WelcomeScreen from "../components/WelcomeScreen";

export default function ChatPage() {
  const {
    sessions,
    currentSessionId,
    messages,
    selectedModel,
    isLoading,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    setModel,
    switchSession,
    createSession,
    deleteSession,
    renameSession,
    sendUserMessage,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleExampleClick = (text: string) => {
    sendUserMessage(text);
  };

  return (
    <div className="h-screen flex bg-gray-900 text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden
          ${sidebarOpen ? "w-64" : "w-0"}`}
      >
        <div className="w-64 h-full">
          <Sidebar
            sessions={sessions}
            currentSessionId={currentSessionId}
            onSelectSession={switchSession}
            onCreateSession={createSession}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/60">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-gray-500 hover:text-gray-300 rounded-lg
                hover:bg-gray-800 transition-colors"
              title="展开侧边栏"
            >
              <PanelLeft size={18} />
            </button>
          )}
          <h2 className="text-sm font-medium text-gray-300 truncate">
            {currentSessionId
              ? sessions.find((s) => s.id === currentSessionId)?.title ?? "对话"
              : "新对话"}
          </h2>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <WelcomeScreen onExampleClick={handleExampleClick} />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendUserMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelChange={setModel}
        />
      </div>
    </div>
  );
}
