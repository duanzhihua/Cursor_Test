import { SessionProvider } from "./context/SessionContext";
import { AppShell } from "./components/layout/AppShell";

export function App() {
  return (
    <SessionProvider>
      <AppShell />
    </SessionProvider>
  );
}

