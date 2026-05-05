import { ChatPanel } from "@/components/ChatPanel";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="fixed inset-0 flex flex-col">
      <ChatPanel />
    </div>
  );
}
