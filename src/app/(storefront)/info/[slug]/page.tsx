import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicInfoPage } from "@/services/public-info-pages";

interface PublicInfoPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PublicInfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getPublicInfoPage(slug);
  return page ? { title: `${page.title} | Kenakata`, description: page.summary } : {};
}

export default function PublicInfoRoute({ params }: PublicInfoPageProps) {
  return <Suspense fallback={<PublicInfoLoading />}><PublicInfoContent params={params} /></Suspense>;
}

async function PublicInfoContent({ params }: PublicInfoPageProps) {
  const { slug } = await params;
  const page = getPublicInfoPage(slug);
  if (!page) notFound();

  return <section className="mx-auto max-w-[900px] px-4 py-8 font-body md:py-12">
    <nav aria-label="Breadcrumb" className="mb-5 text-sm text-mute"><Link href="/" className="inline-flex min-h-11 items-center hover:text-brand-strong hover:underline">Home</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page" className="font-medium text-ink">{page.title}</span></nav>
    <article className="card p-5 sm:p-8">
      <h1 className="font-head text-3xl font-extrabold text-ink sm:text-4xl">{page.title}</h1>
      <p className="mt-3 text-base text-mute">{page.summary}</p>
      <div className="mt-8 space-y-6">
        {page.sections.map((section) => <section key={section.heading} aria-labelledby={`info-${section.heading.toLowerCase().replaceAll(" ", "-")}`}>
          <h2 id={`info-${section.heading.toLowerCase().replaceAll(" ", "-")}`} className="font-head text-xl font-bold text-ink">{section.heading}</h2>
          <p className="mt-2 leading-relaxed text-mute">{section.body}</p>
        </section>)}
      </div>
      <Link href="/products" className="btn btn-primary btn-md mt-8">Browse products</Link>
    </article>
  </section>;
}

function PublicInfoLoading() {
  return <section className="mx-auto max-w-[900px] px-4 py-8 font-body md:py-12" aria-label="Loading information page" aria-busy="true">
    <div className="card space-y-5 p-5 sm:p-8"><div className="skeleton h-10 w-64" /><div className="skeleton h-5 w-80 max-w-full" /><div className="skeleton h-32 w-full" /></div>
  </section>;
}
