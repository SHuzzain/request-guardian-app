import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export interface SignaturePadHandle {
  toPngBlob: () => Promise<Blob | null>;
  clear: () => void;
  isEmpty: () => boolean;
}

/** Simple touch/mouse signature pad. Calls onChange(true) once the user starts drawing. */
export function SignaturePad({
  onReady,
  height = 180,
}: {
  onReady?: (handle: SignaturePadHandle) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const empty = useRef(true);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    const c = canvasRef.current!;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.4;

    const handle: SignaturePadHandle = {
      toPngBlob: () =>
        new Promise((resolve) => {
          if (empty.current) return resolve(null);
          // Trim: for simplicity, export as-is
          c.toBlob((b) => resolve(b), "image/png");
        }),
      clear: () => {
        ctx.clearRect(0, 0, c.width, c.height);
        empty.current = true;
        force((n) => n + 1);
      },
      isEmpty: () => empty.current,
    };
    onReady?.(handle);
  }, [onReady]);

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <div className="w-full">
      <div className="rounded-lg border border-border bg-white touch-none overflow-hidden" style={{ height }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drawing.current = true;
            last.current = pos(e);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const p = pos(e);
            const ctx = canvasRef.current!.getContext("2d")!;
            ctx.beginPath();
            ctx.moveTo(last.current!.x, last.current!.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            last.current = p;
            empty.current = false;
          }}
          onPointerUp={() => { drawing.current = false; last.current = null; force((n) => n + 1); }}
          onPointerLeave={() => { drawing.current = false; last.current = null; }}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            const c = canvasRef.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            empty.current = true;
            force((n) => n + 1);
          }}
        >
          <Eraser className="h-3.5 w-3.5 mr-1" /> Clear
        </Button>
      </div>
    </div>
  );
}
