"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface MermaidDiagramProps {
  /** The mermaid source (do not include ```mermaid fences). */
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className }: MermaidDiagramProps) {
  const id = useId().replace(/:/g, "_");
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  // Render the mermaid chart whenever the source or theme changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: resolvedTheme === "dark" ? "dark" : "default",
        themeVariables: {
          fontFamily: "var(--font-geist-sans), Inter, system-ui, sans-serif",
          fontSize: "14px",
          primaryColor: resolvedTheme === "dark" ? "#312e81" : "#e0e7ff",
          primaryTextColor: resolvedTheme === "dark" ? "#e0e7ff" : "#1e1b4b",
          primaryBorderColor: "#6366f1",
          lineColor: resolvedTheme === "dark" ? "#6366f1" : "#818cf8",
          secondaryColor: resolvedTheme === "dark" ? "#0f172a" : "#f8fafc",
          tertiaryColor: resolvedTheme === "dark" ? "#1e293b" : "#f1f5f9",
        },
        flowchart: { curve: "basis", padding: 20, useMaxWidth: true, htmlLabels: true },
      });
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(svg);
      } catch (err) {
        if (!cancelled) {
          setSvg(
            `<pre style="color:#dc2626;padding:1rem;font-family:monospace;font-size:11px;white-space:pre-wrap">Mermaid render error:\n${
              err instanceof Error ? err.message : String(err)
            }</pre>`,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200/70 bg-white/60 dark:border-zinc-800/70 dark:bg-zinc-950/60",
        className,
      )}
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={1}
        minScale={0.4}
        maxScale={4}
        doubleClick={{ mode: "toggle", step: 1.5 }}
        wheel={{ step: 0.15 }}
        panning={{ velocityDisabled: true }}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
              <ZoomBtn label="Zoom in" onClick={() => zoomIn()}>
                <Plus className="h-3.5 w-3.5" />
              </ZoomBtn>
              <Divider />
              <ZoomBtn label="Zoom out" onClick={() => zoomOut()}>
                <Minus className="h-3.5 w-3.5" />
              </ZoomBtn>
              <Divider />
              <ZoomBtn label="Reset" onClick={() => resetTransform()}>
                <RotateCcw className="h-3.5 w-3.5" />
              </ZoomBtn>
              <Divider />
              <ZoomBtn label="Fit" onClick={() => resetTransform()}>
                <Maximize2 className="h-3.5 w-3.5" />
              </ZoomBtn>
            </div>
            <div className="absolute bottom-3 left-3 z-10 rounded-md bg-zinc-900/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/80 backdrop-blur">
              scroll to zoom · drag to pan · double-click toggles
            </div>
            <TransformComponent
              wrapperClass="!w-full !h-[520px]"
              contentClass="flex items-center justify-center !w-full !h-full !p-6"
            >
              {svg ? (
                <div
                  className="mermaid-svg-host flex h-full w-full items-center justify-center [&>svg]:!h-auto [&>svg]:!max-h-full [&>svg]:!max-w-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              ) : (
                <div className="text-xs text-zinc-400">Rendering diagram…</div>
              )}
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}

function ZoomBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-zinc-200 dark:bg-zinc-800" />;
}
