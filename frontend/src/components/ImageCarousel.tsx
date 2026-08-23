import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ImageCarouselProps {
  images: string[];
  title: string;
}

export function ImageCarousel({ images, title }: ImageCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, images.length]);

  if (images.length === 0) return null;

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }

  function showPrev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }

  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  return (
    <div className="group/carousel relative">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setLightboxIndex(i)}
            className="aspect-video w-64 shrink-0 snap-start overflow-hidden rounded-xl bg-base-800 ring-1 ring-hairline/5 transition hover:ring-amber-400/50 sm:w-80"
          >
            <img src={src} alt={`${title} still ${i + 1}`} loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollByPage(-1)}
        className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-base-950/80 p-2 text-slate-200 opacity-0 ring-1 ring-hairline/10 transition hover:bg-base-800 group-hover/carousel:opacity-100 sm:flex"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByPage(1)}
        className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-base-950/80 p-2 text-slate-200 opacity-0 ring-1 ring-hairline/10 transition hover:bg-base-800 group-hover/carousel:opacity-100 sm:flex"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-base-900/80 p-2 text-slate-200 hover:bg-base-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-base-900/80 p-2 text-slate-200 hover:bg-base-800 sm:left-4"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img
            src={images[lightboxIndex]}
            alt={`${title} still ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-base-900/80 p-2 text-slate-200 hover:bg-base-800 sm:right-4"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-400">
            {lightboxIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </div>
  );
}
