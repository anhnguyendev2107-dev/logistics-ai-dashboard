"use client";

import { Plus, Trash2, MessageSquare } from "lucide-react";
import { groupByRecency, type Conversation } from "@/lib/chat/history";
import { cn } from "@/lib/utils";

interface HistorySidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function HistorySidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: HistorySidebarProps) {
  const groups = groupByRecency(conversations);
  return (
    <aside className="hidden h-[calc(100vh-3.5rem)] w-64 flex-shrink-0 flex-col border-r border-zinc-200/60 bg-white/40 backdrop-blur-md lg:flex dark:border-zinc-800/60 dark:bg-zinc-950/40">
      <div className="p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
        >
          <Plus className="h-3.5 w-3.5" />
          New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 ? (
          <p className="mt-6 px-2 text-center text-xs text-zinc-400">
            No history yet. Send your first question →
          </p>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="mb-3">
              <div className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400 dark:text-zinc-500">
                {g.label}
              </div>
              <ul className="space-y-0.5">
                {g.items.map((c) => (
                  <li key={c.id}>
                    <ConversationRow
                      conv={c}
                      active={c.id === activeId}
                      onSelect={() => onSelect(c.id)}
                      onDelete={() => onDelete(c.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

function ConversationRow({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors",
        active
          ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
      )}
    >
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 truncate text-left"
      >
        <MessageSquare className="h-3 w-3 flex-shrink-0 opacity-60" />
        <span className="truncate">{conv.title}</span>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Delete this conversation?")) onDelete();
        }}
        className="invisible flex-shrink-0 rounded p-0.5 text-zinc-400 hover:bg-red-100 hover:text-red-600 group-hover:visible dark:hover:bg-red-950/40 dark:hover:text-red-400"
        aria-label="Delete conversation"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
