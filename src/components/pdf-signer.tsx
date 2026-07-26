import { useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { pdfjsLib } from "@/lib/pdf-worker";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface SignaturePlacement {
  page: number;         // 1-indexed
  xPct: number;         // 0..1 from left
  yPct: number;         // 0..1 from top
  widthPct: number;     // 0..1 of page width
}

/**
 * Renders a PDF page to a canvas and overlays a draggable/resizable signature box.
 * Provides `signAndGetBytes()` to stamp the signature PNG into the PDF and return bytes.
 */
export function PdfSigner({
  pdfBytes,
  signatureDataUrl,
  initialPlacement,
  onPlacementChange,
  onReady,
}: {
  pdfBytes: ArrayBuffer;
  signatureDataUrl: string | null;
  initialPlacement?: SignaturePlacement;
  onPlacementChange?: (p: SignaturePlacement) => void;
  onReady?: (api: { signAndGetBytes: () => Promise<Uint8Array>; placement: () => SignaturePlacement }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [pdf, setPdf] = useState<Awaited<ReturnType<typeof pdfjsLib.getDocument>["promise"]> | null>(null);
  const [pageNum, setPageNum] = useState(initialPlacement?.page ?? 1);
  const [pageCount, setPageCount] = useState(0);
  const [renderedSize, setRenderedSize] = useState({ w: 0, h: 0 });
  const [placement, setPlacement] = useState<SignaturePlacement>(
    initialPlacement ?? { page: 1, xPct: 0.6, yPct: 0.8, widthPct: 0.25 }
  );

  // Load pdf once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const doc = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
      if (cancelled) return;
      setPdf(doc);
      setPageCount(doc.numPages);
    })();
    return () => { cancelled = true; };
  }, [pdfBytes]);

  // Render current page
  useEffect(() => {
    if (!pdf) return;
    let cancelled = false;
    (async () => {
      const page = await pdf.getPage(pageNum);
      const wrap = wrapRef.current!;
      const containerWidth = wrap.clientWidth;
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      if (cancelled) return;
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      setRenderedSize({ w: viewport.width, h: viewport.height });
    })();
    return () => { cancelled = true; };
  }, [pdf, pageNum]);

  // Update placement page
  useEffect(() => {
    setPlacement((p) => ({ ...p, page: pageNum }));
  }, [pageNum]);

  useEffect(() => { onPlacementChange?.(placement); }, [placement, onPlacementChange]);

  // Drag handling
  const dragState = useRef<{ mode: "move" | "resize"; startX: number; startY: number; base: SignaturePlacement } | null>(null);
  const onPointerDown = (mode: "move" | "resize") => (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { mode, startX: e.clientX, startY: e.clientY, base: { ...placement } };
    e.stopPropagation();
    e.preventDefault();
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current || !renderedSize.w) return;
    const dx = (e.clientX - dragState.current.startX) / renderedSize.w;
    const dy = (e.clientY - dragState.current.startY) / renderedSize.h;
    setPlacement((p) => {
      const b = dragState.current!.base;
      if (dragState.current!.mode === "move") {
        return {
          ...p,
          xPct: Math.max(0, Math.min(1 - b.widthPct, b.xPct + dx)),
          yPct: Math.max(0, Math.min(1 - 0.05, b.yPct + dy)),
        };
      } else {
        return {
          ...p,
          widthPct: Math.max(0.08, Math.min(0.7, b.widthPct + dx)),
        };
      }
    });
  };
  const onPointerUp = () => { dragState.current = null; };

  // Expose signing API
  useEffect(() => {
    if (!onReady) return;
    onReady({
      placement: () => placement,
      signAndGetBytes: async () => {
        if (!signatureDataUrl) throw new Error("No signature available");
        const src = await PDFDocument.load(pdfBytes.slice(0));
        const pngBytes = await (await fetch(signatureDataUrl)).arrayBuffer();
        const png = await src.embedPng(pngBytes);
        const targetPage = src.getPage(placement.page - 1);
        const { width: pw, height: ph } = targetPage.getSize();
        const w = pw * placement.widthPct;
        const ratio = png.height / png.width;
        const h = w * ratio;
        // xPct/yPct measure top-left in browser coords; pdf-lib origin is bottom-left
        const x = pw * placement.xPct;
        const y = ph - ph * placement.yPct - h;
        targetPage.drawImage(png, { x, y, width: w, height: h });
        return await src.save();
      },
    });
  }, [placement, signatureDataUrl, pdfBytes, onReady]);

  // Box height derived from signature aspect (~ 1:3 default)
  const boxHeightPx = renderedSize.w && renderedSize.h
    ? Math.max(30, renderedSize.w * placement.widthPct * 0.35)
    : 40;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPageNum((n) => Math.max(1, n - 1))} disabled={pageNum <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium tabular-nums">
            Page {pageNum} / {pageCount || "…"}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setPageNum((n) => Math.min(pageCount || n, n + 1))} disabled={pageNum >= pageCount}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-[10px] text-muted-foreground">Drag the signature to place it</span>
      </div>

      <div ref={wrapRef} className="relative w-full bg-muted/30 rounded-lg border border-border overflow-hidden touch-none">
        <canvas ref={canvasRef} className="w-full h-auto block" />
        {signatureDataUrl && renderedSize.w > 0 && (
          <div
            className="absolute border-2 border-primary/70 bg-primary/5 cursor-move select-none"
            style={{
              left: placement.xPct * renderedSize.w,
              top: placement.yPct * renderedSize.h,
              width: placement.widthPct * renderedSize.w,
              height: boxHeightPx,
            }}
            onPointerDown={onPointerDown("move")}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img src={signatureDataUrl} alt="signature" className="w-full h-full object-contain pointer-events-none" />
            <div
              className="absolute -right-2 -bottom-2 h-5 w-5 rounded-sm bg-primary border-2 border-white cursor-nwse-resize"
              onPointerDown={onPointerDown("resize")}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              aria-label="Resize"
            />
          </div>
        )}
      </div>
    </div>
  );
}
