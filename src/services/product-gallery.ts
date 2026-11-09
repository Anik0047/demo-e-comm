import type { Product, ProductImage } from "@/types/product";

export interface GalleryImage extends ProductImage {
  credit?: { author: string; source: string; license: string; licenseUrl: string };
}

// Credits supplied with the existing mock photos, kept outside the Product schema.
const photoCredits = [
  { prefix: "JBL_GO2_Bluetooth_speaker", author: "Pittigrilli", version: "4.0" },
  { prefix: "Logitech_G700s_", author: "Kenming Wang", version: "2.0" },
  { prefix: "JETech_Powerbank_10000mAh-", author: "© Raimond Spekking", version: "4.0" },
  { prefix: "Beyerdynamic_DT_770_PRO_80_Ohm_", author: "en:User:MMuzammils", version: "3.0" },
];

export function getProductGallery(product: Pick<Product, "mainImage" | "gallery" | "name">): GalleryImage[] {
  const seen = new Set<string>();
  return [product.mainImage, ...product.gallery].flatMap((image) => {
    const url = image.url.trim();
    if (!url || seen.has(url)) return [];
    seen.add(url);
    const result: GalleryImage = { url, alt: image.alt.trim() || product.name };
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "thumb.wikimedia.org") {
        const filename = decodeURIComponent(parsed.pathname.split("/")[6] ?? "");
        const credit = photoCredits.find((item) => filename.startsWith(item.prefix));
        if (credit) result.credit = {
          author: credit.author,
          source: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
          license: `CC BY-SA ${credit.version}`,
          licenseUrl: `https://creativecommons.org/licenses/by-sa/${credit.version}/`,
        };
      }
    } catch {
      // Local image paths do not need remote attribution.
    }
    return [result];
  });
}
