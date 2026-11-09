"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductPlaceholderIcon } from "@/components/shared/product-placeholder-icon";
import type { ProductCardData } from "@/types/product";

interface ProductCardImageProps {
  image: ProductCardData["mainImage"];
  name: string;
  placeholder: ProductCardData["placeholder"];
}

export function ProductCardImage({
  image,
  name,
  placeholder,
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
      sizes="(min-width: 1280px) 300px, (min-width: 768px) 33vw, 50vw"
      loading="lazy"
      className="bg-canvas object-cover object-center"
      onError={() => setFailed(true)}
    />
  );
}
