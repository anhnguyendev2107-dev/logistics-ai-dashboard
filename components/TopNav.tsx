import Link from "next/link";
import { Boxes } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

interface TopNavProps {
  variant?: "dashboard" | "chat";
}

export function TopNav({ variant = "dashboard" }: TopNavProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-sm transition-transform group-hover:scale-105">
            <Boxes className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Logos<span className="text-zinc-400 dark:text-zinc-500"> · Logistics AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {variant === "chat" ? (
            <Link
              href="/"
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              ← Dashboard
            </Link>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
