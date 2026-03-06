import { useEffect } from "react";
import ChatPage from "./pages/ChatPage";
import { useChatStore } from "./store/chatStore";

function App() {
  const initializeApp = useChatStore((s) => s.initializeApp);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return <ChatPage />;
}

export default App;
