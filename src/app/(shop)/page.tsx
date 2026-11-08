import { Fragment } from "react";

import { Hero } from "@/components/home/hero";
import { getHomeSections } from "@/server/storefront";
import type { HomeSection } from "@/server/storefront/types";
import { CollectionCarousel } from "@/components/home/collection-carousel";
import { Rooms } from "@/components/home/rooms";
import { ca } from "zod/locales";
import { Editorial } from "@/components/home/editorial";
import { ProductGrid } from "@/components/home/product-grid";
import { BrandStory } from "@/components/home/brand-story";
import { Gifts } from "@/components/home/gifts";
import { Newsletter } from "@/components/home/newsletter";
import { Social } from "@/components/home/social";

function renderSection(section: HomeSection) {
  switch (section.type) {
    case "hero":
      return <Hero />;
    case "collection-carousel":
      return <CollectionCarousel />;
    case "rooms":
      return <Rooms />;
        case "editorial":
      return <Editorial />;
        case "product-grid":
      return <ProductGrid source={section.source} />;
        case "brand-story":
      return <BrandStory />;
      case "gifts":
      return <Gifts content={section.content} />;
          case "social":
      return <Social content={section.content} />;
    case "newsletter":
      return <Newsletter />;
    // Sledeće sekcije dodajemo redom: karusel, sobe, editorijal, mreža, priča, pokloni, mreže, novosti.
    default:
      return null;
  }
}

/** Početna: redosled i vidljivost sekcija dolaze iz admina (Početna → Sekcije). */
export default async function HomePage() {
  const sections = await getHomeSections();
  return sections.map((section) => <Fragment key={section.type}>{renderSection(section)}</Fragment>);
}