import { ChatPanel } from "@/components/ChatPanel";
import { TopNav } from "@/components/TopNav";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="flex h-screen flex-col">
      <TopNav variant="chat" />
      <ChatPanel />
    </div>
  );
}
