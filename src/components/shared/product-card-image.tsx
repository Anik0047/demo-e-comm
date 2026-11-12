"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPlaceholderIcon } from "@/components/shared/product-placeholder-icon";
import type { ProductCardData } from "@/types/product";

interface ProductCardImageProps {
  image: ProductCardData["mainImage"];
  name: string;
  placeholder: ProductCardData["placeholder"];
  sizes?: string;
}

export function ProductCardImage({
  image,
  name,
  placeholder,
  sizes = "(min-width: 1280px) calc((1280px - 96px) / 5), (min-width: 768px) calc((100vw - 80px) / 4), calc((100vw - 44px) / 2)",
}: ProductCardImageProps) {
  const [failed, setFailed] = useState(false);

  if (!image.url.trim() || failed) {
    return <ProductPlaceholderIcon icon={placeholder?.icon ?? "backpack"} />;
  }

  return (
    <Image
      src={image.url}
      alt={image.alt.trim() || name}
      fill
      sizes={sizes}
      loading="lazy"
      fetchPriority="auto"
      className="bg-white object-contain object-center"
      onError={() => setFailed(true)}
    />
  );
}
