import { useEffect } from "react";
import ChatPage from "./pages/ChatPage";
import { useChatStore } from "./store/chatStore";

function App() {
  const loadModels = useChatStore((s) => s.loadModels);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  return <ChatPage />;
}

export default App;
