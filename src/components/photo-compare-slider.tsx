"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, ArrowLeftRight } from "lucide-react";
import ZoomableImage from "@/components/zoomable-image";

interface Props {
  beforeUrl: string | null;
  afterUrl: string | null;
  beforeLabel?: string;
  afterLabel?: string;
  weightDiff?: number | null; // kg lost (negative) / gained (positive)
  daysDiff?: number | null;
}

/**
 * Interactive before/after slider. Drag the handle left/right to reveal.
 * Falls back to a static side-by-side if either image is missing.
 */
export function PhotoCompareSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = "Antes",
  afterLabel = "Actual",
  weightDiff,
  daysDiff,
}: Props) {
  const [position, setPosition] = useState(50); // 0-100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((clientX - rect.left) / rect.width) * 100;
      setPosition(Math.max(0, Math.min(100, pct)));
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };
    const onUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [isDragging]);

  // No photos at all
  if (!beforeUrl && !afterUrl) {
    return (
      <div className="aspect-[3/4] max-h-96 rounded-2xl bg-card-bg flex flex-col items-center justify-center text-muted">
        <Camera className="h-8 w-8 mb-2" />
        <p className="text-xs">Aun no tenes fotos de progreso</p>
      </div>
    );
  }

  // Only one photo — render plain
  if (!beforeUrl || !afterUrl) {
    const url = afterUrl || beforeUrl;
    return (
      <div className="aspect-[3/4] max-h-96 rounded-2xl overflow-hidden bg-card-bg relative">
        {url && (
          <ZoomableImage
            src={url}
            alt={afterUrl ? afterLabel : beforeLabel}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold pointer-events-none">
          {afterUrl ? afterLabel : beforeLabel}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="aspect-[3/4] max-h-96 rounded-2xl overflow-hidden relative select-none cursor-ew-resize bg-card-bg"
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        {/* BEFORE (base layer) */}
        <img
          src={beforeUrl}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* AFTER (clipped overlay) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${position}%)` }}
        >
          <img
            src={afterUrl}
            alt={afterLabel}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold pointer-events-none">
          {beforeLabel}
        </div>
        <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold text-black pointer-events-none">
          {afterLabel}
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
          style={{ left: `${position}%` }}
        />

        {/* Drag handle */}
        <div
          className="absolute top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-xl flex items-center justify-center pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <ArrowLeftRight className="h-4 w-4 text-black" />
        </div>

        {/* Hint overlay (first render) */}
        {position === 50 && !isDragging && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-semibold pointer-events-none animate-pulse">
            Deslizá para comparar
          </div>
        )}
      </div>

      {/* Stats pills */}
      {(weightDiff != null || daysDiff != null) && (
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          {daysDiff != null && daysDiff > 0 && (
            <span className="text-[11px] bg-card-bg border border-card-border px-3 py-1 rounded-full">
              {daysDiff} {daysDiff === 1 ? "dia" : "dias"} de diferencia
            </span>
          )}
          {weightDiff != null && weightDiff !== 0 && (
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                weightDiff < 0
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              }`}
            >
              {weightDiff > 0 ? "+" : ""}
              {weightDiff.toFixed(1)}kg
            </span>
          )}
        </div>
      )}
    </div>
  );
}
