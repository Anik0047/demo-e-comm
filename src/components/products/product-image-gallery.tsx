"use client";

import { useId, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ZoomIn } from "lucide-react";
import { ProductGalleryImage } from "@/components/products/product-gallery-image";
import { ProductImageViewer } from "@/components/products/product-image-viewer";
import type { GalleryImage } from "@/services/product-gallery";

interface ProductImageGalleryProps { images: GalleryImage[]; name: string }

export function ProductImageGallery({ images, name }: ProductImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const gridId = useId();
  const move = (step: number) => setActive((current) => (current + step + images.length) % images.length);

  return (
    <section aria-label={`${name} images`} className="min-w-0 lg:col-span-7">
      {!images.length ? <div className="relative aspect-square rounded-2xl bg-soft"><ProductGalleryImage /></div> : <>
        <div className="md:hidden" onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
          if (event.key === "Home" || event.key === "End") { event.preventDefault(); setActive(event.key === "Home" ? 0 : images.length - 1); }
        }}>
          <button type="button" aria-label={`Enlarge image ${active + 1} of ${images.length}: ${images[active].alt}`}
            className="relative block aspect-square w-full touch-pan-y overflow-hidden rounded-2xl bg-soft hover:ring-2 hover:ring-line"
            onTouchStart={(event) => { const point = event.touches[0]; touch.current = { x: point.clientX, y: point.clientY }; swiped.current = false; }}
            onTouchCancel={() => { touch.current = null; }}
            onTouchEnd={(event) => {
              if (!touch.current) return;
              const point = event.changedTouches[0];
              const dx = point.clientX - touch.current.x;
              const dy = point.clientY - touch.current.y;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { swiped.current = true; move(dx < 0 ? 1 : -1); }
              touch.current = null;
            }}
            onClick={() => { if (swiped.current) { swiped.current = false; return; } setViewer(active); }}>
            <ProductGalleryImage key={images[active].url} image={images[active]} eager />
            <span className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full border border-line bg-canvas"><ZoomIn aria-hidden="true" className="size-5" /></span>
          </button>
          <div className="mt-3 flex items-center justify-center gap-4">
            {images.length > 1 && <button type="button" aria-label="Previous image" onClick={() => move(-1)} className="btn btn-outline btn-md size-11 p-0"><ChevronLeft aria-hidden="true" className="size-5" /></button>}
            <p role="status" aria-atomic="true" className="text-sm text-mute">Image {active + 1} of {images.length}</p>
            {images.length > 1 && <button type="button" aria-label="Next image" onClick={() => move(1)} className="btn btn-outline btn-md size-11 p-0"><ChevronRight aria-hidden="true" className="size-5" /></button>}
          </div>
        </div>
        <div id={gridId} className="hidden grid-cols-2 gap-2 md:grid">
          {images.slice(0, expanded ? images.length : 4).map((image, index) => (
            <button key={image.url} type="button" aria-label={`Enlarge image ${index + 1} of ${images.length}: ${image.alt}`}
              className="relative aspect-square min-w-0 overflow-hidden rounded-2xl bg-soft hover:ring-2 hover:ring-line"
              onClick={() => setViewer(index)}>
              <ProductGalleryImage image={image} eager={index < 2} />
              <span className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full border border-line bg-canvas"><ZoomIn aria-hidden="true" className="size-5" /></span>
            </button>
          ))}
        </div>
        {images.length > 4 && <button type="button" aria-expanded={expanded} aria-controls={gridId} className="btn btn-outline btn-md mx-auto mt-4 hidden md:flex" onClick={() => setExpanded((current) => !current)}>
          {expanded ? "Show less" : `Show more (${images.length - 4})`}{expanded ? <ChevronUp aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />}
        </button>}
        {viewer !== null && <ProductImageViewer images={images} initialIndex={viewer} name={name} onClose={() => setViewer(null)} />}
      </>}
    </section>
  );
}
