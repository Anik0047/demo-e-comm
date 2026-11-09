"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPlaceholderIcon } from "@/components/shared/product-placeholder-icon";
import type { GalleryImage } from "@/services/product-gallery";

interface ProductGalleryImageProps {
  image?: GalleryImage;
  enlarged?: boolean;
  eager?: boolean;
}

export function ProductGalleryImage({
  image,
  enlarged = false,
  eager = false,
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
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-soft p-4 text-mute">
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
          : "(min-width: 1280px) 350px, (min-width: 1024px) 28vw, (min-width: 768px) 48vw, 100vw"
      }
      loading={eager ? "eager" : "lazy"}
      className="object-contain object-center"
      onError={() => {
        if (source !== image.url && !useOriginal) setUseOriginal(true);
        else setFailed(true);
      }}
    />
  );
}
