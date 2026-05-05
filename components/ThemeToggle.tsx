"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Inert placeholder before hydration so the layout doesn't shift.
    return (
      <div
        aria-hidden
        className={cn(
          "h-8 w-8 rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
          className,
        )}
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const Icon = isDark ? Sun : Moon;
  const next = isDark ? "light" : "dark";

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border text-zinc-600 transition-colors",
        "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
