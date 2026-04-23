"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  // Si se pasa, el lightbox muestra varias fotos del set (navegables con teclas).
  gallery?: { src: string; alt?: string }[];
}

// Imagen que al hacer click se abre en un lightbox a pantalla completa.
// Cierra con Esc, click fuera o botón X. Soporta galería con flechas ← →.
export default function ZoomableImage({ src, alt = "", className = "", gallery }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const photos = gallery && gallery.length > 0 ? gallery : [{ src, alt }];
  const [index, setIndex] = useState(() => {
    const i = photos.findIndex((p) => p.src === src);
    return i >= 0 ? i : 0;
  });

  const close = useCallback(() => setOpen(false), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % photos.length), [photos.length]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + photos.length) % photos.length), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    // Bloquea scroll del body mientras el lightbox esta abierto.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, next, prev]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`${className} cursor-zoom-in`}
        onClick={() => {
          const i = photos.findIndex((p) => p.src === src);
          setIndex(i >= 0 ? i : 0);
          setOpen(true);
        }}
      />

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={photos[index].alt || "Foto ampliada"}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <button
            onClick={close}
            aria-label="Cerrar"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Anterior"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10 text-2xl font-light"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Siguiente"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10 text-2xl font-light"
              >
                ›
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/70 font-medium z-10">
                {index + 1} / {photos.length}
              </div>
            </>
          )}

          <img
            src={photos[index].src}
            alt={photos[index].alt || ""}
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
