import Link from "next/link";

export default function VendorNotFound() {
  return <section className="mx-auto max-w-[1280px] px-4 py-12 font-body text-center">
    <h1 className="font-head text-3xl font-extrabold sm:text-4xl">Store not found</h1>
    <p className="mx-auto mt-3 max-w-lg text-sm text-mute">This store isn’t available. Browse the marketplace to find another seller.</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link href="/products" className="btn btn-primary btn-md">Browse products</Link>
      <Link href="/" className="btn btn-outline btn-md">Go to homepage</Link>
    </div>
  </section>;
}
