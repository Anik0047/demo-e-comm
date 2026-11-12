"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { ProductGalleryImage } from "@/components/products/product-gallery-image";
import type { GalleryImage } from "@/services/product-gallery";

interface ProductImageViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  name: string;
  onClose: () => void;
}

export function ProductImageViewer({
  images,
  initialIndex,
  name,
  onClose,
}: ProductImageViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const touch = useRef<{ x: number; y: number } | null>(null);
  const move = (step: number) =>
    setIndex((current) => (current + step + images.length) % images.length);

  useEffect(() => {
    const element = dialog.current;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    closeButton.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      trigger?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 m-auto h-dvh max-h-dvh w-full max-w-6xl flex-col overflow-y-auto border border-line bg-canvas p-4 text-ink backdrop:bg-black/40 open:flex sm:h-[94dvh] sm:max-h-[94dvh] sm:rounded-2xl sm:p-6"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
        if (event.key === "Home" || event.key === "End") {
          event.preventDefault();
          setIndex(event.key === "Home" ? 0 : images.length - 1);
        }
        if (event.key === "Tab") {
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              "button, a[href]",
            ),
          );
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-4">
        <h2 id={titleId} className="min-w-0 text-base font-bold sm:text-xl">
          {name} — image viewer
        </h2>
        <button
          ref={closeButton}
          type="button"
          aria-label="Close image viewer"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-soft"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <div
        className="relative mt-4 min-h-32 flex-1 touch-pan-y bg-soft"
        onTouchStart={(event) => {
          const point = event.touches[0];
          touch.current = { x: point.clientX, y: point.clientY };
        }}
        onTouchCancel={() => {
          touch.current = null;
        }}
        onTouchEnd={(event) => {
          if (!touch.current) return;
          const point = event.changedTouches[0];
          const dx = point.clientX - touch.current.x;
          const dy = point.clientY - touch.current.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy))
            move(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <ProductGalleryImage
          key={images[index].url}
          image={images[index]}
          enlarged
          eager
          announceFailure
        />
      </div>
      <div className="mt-4 flex shrink-0 items-center justify-center gap-4">
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => move(-1)}
            className="btn btn-outline btn-md size-11 p-0"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
        )}
        <p role="status" aria-atomic="true" className="text-sm">
          Image {index + 1} of {images.length}
        </p>
        {images.length > 1 && (
          <button
            type="button"
            aria-label="Next image"
            onClick={() => move(1)}
            className="btn btn-outline btn-md size-11 p-0"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      {/* <div className="max-h-[25dvh] shrink-0 overflow-y-auto">
        <ProductImageCredits images={[images[index]]} startIndex={index} />
      </div> */}
    </dialog>
  );
}
