import Link from "next/link";

export function ProductNotFound() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-12 font-body">
      <h1 className="font-head text-3xl font-extrabold">Product not found</h1>
      <p className="mt-4 text-mute">This product is unavailable. Browse the catalog to find something else.</p>
      <Link href="/products" className="btn btn-md btn-primary mt-6">Browse products</Link>
    </section>
  );
}
