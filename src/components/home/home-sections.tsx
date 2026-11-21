import { Fragment } from "react";

import { getHomeSections } from "@/server/storefront";
import type { Campaign, HomeSection } from "@/server/storefront/types";

import { BrandStory } from "./brand-story";
import { CollectionCarousel } from "./collection-carousel";
import { Editorial } from "./editorial";
import { Gifts } from "./gifts";
import { Hero } from "./hero";
import { Newsletter } from "./newsletter";
import { ProductGrid } from "./product-grid";
import { Rooms } from "./rooms";
import { Social } from "./social";

function renderSection(section: HomeSection, campaign: Campaign | undefined) {
  switch (section.type) {
    case "hero":
      return <Hero campaign={campaign} />;
    case "collection-carousel":
      return <CollectionCarousel campaign={campaign} />;
    case "rooms":
      return <Rooms />;
    case "editorial":
      return <Editorial campaign={campaign} />;
    case "product-grid":
      return <ProductGrid content={section.content} />;
    case "brand-story":
      return <BrandStory content={section.content} />;
    case "gifts":
      return <Gifts content={section.content} />;
    case "social":
      return <Social content={section.content} />;
    case "newsletter":
      return <Newsletter content={section.content} />;
    default: {
      const unreachable: never = section;
      return unreachable;
    }
  }
}

/**
 * Sekcije početne, redom i vidljivošću iz admina (Početna → Sekcije).
 * Bez `campaign` koristi aktivnu kampanju; pregled kampanje prosleđuje svoju.
 */
export async function HomeSections({ campaign }: { campaign?: Campaign }) {
  const sections = await getHomeSections();
  return sections.map((section) => <Fragment key={section.type}>{renderSection(section, campaign)}</Fragment>);
}