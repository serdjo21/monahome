import type { Metadata } from "next";
import { notFound } from "next/navigation";

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

export default async function ProductPage({ params }: PageProps<"/proizvod/[slug]">) {
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