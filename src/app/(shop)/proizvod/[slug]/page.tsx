import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetails } from "@/components/product/product-details";
import { ProductHeader } from "@/components/product/product-header";
import { ProductJsonLd } from "@/components/product/product-json-ld";
import { ProductView } from "@/components/product/product-view";
import { RelatedProducts } from "@/components/product/related-products";
import { getProduct, getProductSlugs } from "@/server/storefront";

/** Proizvodi se generišu unapred pri buildu; novi iz admina se renderuje pri prvoj poseti. */
export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/proizvod/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};

  const description = product.description ?? product.subtitle ?? undefined;
  const image = product.images.find((item) => item.src);

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      images: image?.src ? [{ url: image.src, alt: image.alt }] : undefined,
    },
  };
}

/**
 * Stranica odmah prikazuje okvir (skelet), a sadržaj stiže čim se pročita slug.
 * Za proizvode generisane pri buildu sadržaj je već u HTML-u, pa se skelet ni ne vidi.
 */
export default function ProductPage({ params }: PageProps<"/proizvod/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <ProductJsonLd product={product} />
      <div className="container-page pb-16 md:pb-section lg:pt-10">
        <ProductView
          product={product}
          header={<ProductHeader product={product} />}
          details={<ProductDetails product={product} />}
        />
      </div>
      <RelatedProducts product={product} />
    </>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden="true" className="container-page pb-16 md:pb-section lg:pt-10">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-x-6">
        <div className="-mx-5 aspect-[4/5] bg-surface-sunken md:-mx-10 lg:col-span-7 lg:mx-0" />
        <div className="flex flex-col gap-5 lg:col-span-5 xl:col-span-4 xl:col-start-9">
          <div className="h-3 w-1/3 bg-surface-sunken" />
          <div className="h-10 w-3/4 bg-surface-sunken" />
          <div className="h-5 w-1/4 bg-surface-sunken" />
          <div className="mt-6 h-13 w-full bg-surface-sunken" />
        </div>
      </div>
    </div>
  );
}