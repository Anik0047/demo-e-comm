"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPlaceholderIcon } from "@/components/shared/product-placeholder-icon";
import type { GalleryImage } from "@/services/product-gallery";

interface ProductGalleryImageProps {
  image?: GalleryImage;
  enlarged?: boolean;
  eager?: boolean;
  highPriority?: boolean;
  announceFailure?: boolean;
}

export function ProductGalleryImage({
  image,
  enlarged = false,
  eager = false,
  highPriority = false,
  announceFailure = false,
}: ProductGalleryImageProps) {
  const [failed, setFailed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);
  let source = image?.url;
  if (enlarged && source && !useOriginal) {
    try {
      const url = new URL(source);
      if (
        url.hostname === "thumb.wikimedia.org" &&
        url.pathname.startsWith("/wikipedia/commons/thumb/")
      ) {
        url.pathname = url.pathname.replace(/\/\d+px-([^/]+)$/, "/1920px-$1");
        source = url.toString();
      }
    } catch {
      // Local images keep their original source.
    }
  }
  if (!image || failed)
    return (
      <span role={failed && announceFailure ? "status" : undefined} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-soft p-4 text-mute">
        <ProductPlaceholderIcon icon="backpack" className="size-16" />
        <span className="text-sm">
          {failed ? "Image unavailable" : "No product images yet"}
        </span>
      </span>
    );
  return (
    <Image
      src={source ?? image.url}
      alt={image.alt}
      fill
      sizes={
        enlarged
          ? "(min-width: 1152px) 1102px, (min-width: 640px) calc(100vw - 50px), calc(100vw - 34px)"
          : "(min-width: 1024px) calc((7 * (100vw - 64px) / 12 + 184px) / 2), (min-width: 768px) calc((100vw - 40px) / 2), calc(100vw - 32px)"
      }
      loading={eager ? "eager" : "lazy"}
      fetchPriority={highPriority ? "high" : "auto"}
      className="object-contain object-center"
      onError={() => {
        if (source !== image.url && !useOriginal) setUseOriginal(true);
        else setFailed(true);
      }}
    />
  );
}
