import type { GalleryImage } from "@/services/product-gallery";

interface ProductImageCreditsProps { images: GalleryImage[]; startIndex?: number }

export function ProductImageCredits({ images, startIndex = 0 }: ProductImageCreditsProps) {
  const credited = images.filter((image) => image.credit);
  if (!credited.length) return null;
  return (
    <div className="mt-4 text-xs leading-relaxed text-mute">
      <p>Photos via Wikimedia Commons. Shown without cropping.</p>
      <ul className="flex flex-wrap gap-x-4">
        {credited.map((image, index) => image.credit && <li key={image.url} className="min-w-0">
          <a href={image.credit.source} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline hover:text-brand-strong">Image {startIndex + index + 1} — {image.credit.author}</a>
          {" · "}<a href={image.credit.licenseUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline hover:text-brand-strong">{image.credit.license}</a>
        </li>)}
      </ul>
    </div>
  );
}
