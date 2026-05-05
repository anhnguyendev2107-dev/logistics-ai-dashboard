"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  label: string;
  /** Indent level: 0 = group heading, 1 = item, 2 = sub-item. */
  level?: 0 | 1 | 2;
}

export interface TocGroup {
  label: string;
  items: TocItem[];
}

export function TableOfContents({ groups }: { groups: TocGroup[] }) {
  const allIds = groups.flatMap((g) => g.items.map((i) => i.id));
  const [activeId, setActiveId] = useState<string | null>(allIds[0] ?? null);

  useEffect(() => {
    if (allIds.length === 0) return;
    const visible = new Map<string, number>(); // id -> ratio
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.set(e.target.id, e.intersectionRatio);
          } else {
            visible.delete(e.target.id);
          }
        }
        // pick the entry with the largest ratio; tie-broken by document order
        let best: string | null = null;
        let bestRatio = -1;
        for (const id of allIds) {
          const r = visible.get(id);
          if (r !== undefined && r > bestRatio) {
            best = id;
            bestRatio = r;
          }
        }
        if (best) setActiveId(best);
      },
      {
        // Trigger when section enters the top half of viewport
        rootMargin: "-15% 0px -65% 0px",
        threshold: [0, 0.2, 0.5, 0.8, 1],
      },
    );
    for (const id of allIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className="space-y-5">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            {g.label}
          </div>
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const isActive = item.id === activeId;
              const indent =
                item.level === 2 ? "pl-6" : item.level === 1 ? "pl-3" : "pl-2";
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => handleClick(e, item.id)}
                    className={cn(
                      "group flex items-center gap-2 rounded-md py-1 pr-2 text-xs transition-colors",
                      indent,
                      isActive
                        ? "font-medium text-indigo-700 dark:text-indigo-300"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1 w-1 flex-shrink-0 rounded-full transition-colors",
                        isActive
                          ? "bg-indigo-500"
                          : "bg-transparent group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
