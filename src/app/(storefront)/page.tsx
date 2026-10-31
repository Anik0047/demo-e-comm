import { ShoppingBag } from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";

const swatches = [
  { name: "brand", bg: "bg-brand" },
  { name: "brand-strong", bg: "bg-brand-strong" },
  { name: "brand-tint", bg: "bg-brand-tint" },
  { name: "brand-soft", bg: "bg-brand-soft" },
  { name: "ink", bg: "bg-ink" },
  { name: "mute", bg: "bg-mute" },
  { name: "line", bg: "bg-line" },
  { name: "soft", bg: "bg-soft" },
  { name: "sale", bg: "bg-sale" },
  { name: "accent", bg: "bg-accent" },
  { name: "info", bg: "bg-info" },
  { name: "blush", bg: "bg-blush" },
];

export default function HomePage() {
  return (
    <main className="container-page section-y space-y-8">
      {/* Wordmark */}
      <div className="font-head text-3xl font-extrabold">
        <span className="text-ink">Kena</span>
        <span className="text-brand">kata</span>
      </div>

      {/* Typography */}
      <div className="space-y-2">
        <h1>Heading 1 - Multi-Vendor Marketplace</h1>
        <h2>Heading 2 - Design System &amp; Tokens</h2>
        <p className="text-mute">
          This is a typography sample paragraph using DM Sans for clean readability across Kenakata storefront interfaces.
        </p>
      </div>

      {/* Color swatches */}
      <div>
        <h3 className="mb-3 text-lg font-bold">Color Tokens</h3>
        <div className="flex flex-wrap gap-3">
          {swatches.map((swatch) => (
            <div key={swatch.name} className="flex flex-col items-center gap-1.5">
              <div className={`h-12 w-12 rounded-lg border border-line ${swatch.bg}`} />
              <span className="text-xs text-mute">{swatch.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <button type="button" className="btn btn-md btn-primary">
            Primary Button
          </button>
          <button type="button" className="btn btn-md btn-outline">
            Outline Button
          </button>
          <button type="button" className="btn btn-md btn-sale">
            Sale Button
          </button>
        </div>
      </div>

      {/* Badge, Card with Skeleton, Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold">Components &amp; Controls</h3>
        <div>
          <span className="badge badge-brand">New Arrival</span>
        </div>

        <div className="card max-w-sm p-4">
          <div className="skeleton h-24 w-full" />
        </div>

        <div className="max-w-sm">
          <input
            type="text"
            className="input"
            placeholder="Search products or vendors..."
          />
        </div>
      </div>

      {/* Icons */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold">Icons Verification</h3>
        <div className="flex items-center gap-4 text-ink">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-brand" />
            <span className="text-sm">Lucide (ShoppingBag)</span>
          </div>
          <div className="flex items-center gap-2">
            <FaFacebookF className="h-5 w-5 text-ink" />
            <span className="text-sm">react-icons/fa6 (FaFacebookF)</span>
          </div>
        </div>
      </div>
    </main>
  );
}
