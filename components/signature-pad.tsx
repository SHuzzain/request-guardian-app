"use client";

import React, { useEffect, useRef } from "react";
import { Eraser } from "lucide-react";

export interface SignaturePadHandle {
  toPngDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

export function SignaturePad({
  onReady,
  height = 160,
}: {
  onReady?: (handle: SignaturePadHandle) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const empty = useRef(true);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a"; // slate-900
    ctx.lineWidth = 2.5;

    const handle: SignaturePadHandle = {
      toPngDataUrl: () => {
        if (empty.current) return null;
        return c.toDataURL("image/png");
      },
      clear: () => {
        ctx.clearRect(0, 0, c.width, c.height);
        empty.current = true;
      },
      isEmpty: () => empty.current,
    };

    onReady?.(handle);
  }, [onReady]);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleClear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    empty.current = true;
  };

  return (
    <div className="w-full space-y-2">
      <div
        className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white touch-none overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = getPos(e);
          }}
          onPointerMove={(e) => {
            if (!drawing.current || !last.current) return;
            const p = getPos(e);
            const c = canvasRef.current;
            if (!c) return;
            const ctx = c.getContext("2d");
            if (!ctx) return;

            ctx.beginPath();
            ctx.moveTo(last.current.x, last.current.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            last.current = p;
            empty.current = false;
          }}
          onPointerUp={() => {
            drawing.current = false;
            last.current = null;
          }}
          onPointerLeave={() => {
            drawing.current = false;
            last.current = null;
          }}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>
    </div>
  );
}
