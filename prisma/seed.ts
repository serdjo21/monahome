import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { HomeSectionType, PrismaClient } from "../src/generated/prisma/client";

import { campaigns, products, rooms } from "./seed-data";

// Puni razvojnu bazu probnim podacima. Može da se pokrene više puta: postojeći zapisi se ažuriraju.
// Pokretanje: npm run db:seed

const connectionString = process.env.DIRECT_URL;
if (!connectionString) throw new Error("DIRECT_URL nije podešen u .env");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function seedRooms() {
  for (const [position, room] of rooms.entries()) {
    const data = {
      name: room.name,
      description: room.description,
      imageAlt: room.imageAlt,
      heroImageAlt: room.heroImageAlt,
      editorialText: room.editorialText,
      editorialImageAlt: room.editorialImageAlt,
      position,
    };    await prisma.category.upsert({
      where: { slug: room.slug },
      create: { slug: room.slug, ...data },
      update: data,
    });
  }
}

async function seedProducts() {
  for (const product of products) {
    const data = {
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      priceRsd: product.priceRsd,
      compareAtRsd: product.compareAtRsd,
      isNew: product.isNew,
      status: "ACTIVE" as const,
      publishedAt: new Date(),
    };

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, ...data },
      update: data,
    });

    // Varijante: jedna po boji; proizvod bez boja dobija jednu osnovnu varijantu.
    const colors = product.colors.length > 0 ? product.colors : [null];
    for (const [position, color] of colors.entries()) {
      const sku = `${product.slug}-${color ? slugify(color.name) : "osnovna"}`.toUpperCase();
      const variant = {
        colorName: color?.name ?? null,
        colorHex: color?.hex ?? null,
        size: product.size,
        position,
      };
      await prisma.productVariant.upsert({
        where: { sku },
        create: { productId: saved.id, sku, stock: 10, ...variant },
        update: variant,
      });
    }

    // Fotografije: za sada samo opisi kadra (putanje se dodaju kad stignu prave fotografije).
    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    await prisma.productImage.createMany({
      data: product.imageAlts.map((alt, position) => ({ productId: saved.id, path: "", alt, position })),
    });

    // Sobe u kojima se proizvod prikazuje.
    for (const roomSlug of product.rooms) {
      const category = await prisma.category.findUniqueOrThrow({ where: { slug: roomSlug } });
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: saved.id, categoryId: category.id } },
        create: { productId: saved.id, categoryId: category.id },
        update: {},
      });
    }
  }
}

async function seedCampaigns() {
  for (const campaign of campaigns) {
    const data = {
      name: campaign.name,
      status: campaign.isDefault ? ("DRAFT" as const) : ("SCHEDULED" as const),
      isDefault: campaign.isDefault,
      startsAt: campaign.startsAt ? new Date(campaign.startsAt) : null,
      endsAt: campaign.endsAt ? new Date(campaign.endsAt) : null,
      season: campaign.season,
      headline: campaign.headline,
      intro: campaign.intro,
      ctaLabel: campaign.ctaLabel,
      ctaHref: campaign.ctaHref,
      layout: campaign.layout,
      theme: campaign.theme,
      heroImageAlt: campaign.heroImageAlt,
      editorialTitle: campaign.editorial?.title ?? null,
      editorialText: campaign.editorial?.text ?? null,
      editorialImageAlt: campaign.editorial?.imageAlt ?? null,
    };

    const saved = await prisma.campaign.upsert({
      where: { slug: campaign.slug },
      create: { slug: campaign.slug, ...data },
      update: data,
    });

    await prisma.campaignProduct.deleteMany({ where: { campaignId: saved.id } });
    for (const [position, slug] of campaign.productSlugs.entries()) {
      const product = await prisma.product.findUniqueOrThrow({ where: { slug } });
      await prisma.campaignProduct.create({ data: { campaignId: saved.id, productId: product.id, position } });
    }
  }
}

async function seedHomeSections() {
  const order: HomeSectionType[] = [
    HomeSectionType.HERO,
    HomeSectionType.COLLECTION_CAROUSEL,
    HomeSectionType.ROOMS,
    HomeSectionType.EDITORIAL,
    HomeSectionType.PRODUCT_GRID,
    HomeSectionType.BRAND_STORY,
    HomeSectionType.GIFTS,
    HomeSectionType.SOCIAL,
    HomeSectionType.NEWSLETTER,
  ];

  for (const [position, type] of order.entries()) {
    await prisma.homeSection.upsert({
      where: { type },
      create: { type, position, settings: type === HomeSectionType.PRODUCT_GRID ? { source: "new" } : undefined },
      update: { position },
    });
  }
}

async function main() {
  await seedRooms();
  await seedProducts();
  await seedCampaigns();
  await seedHomeSections();
  console.log(`Seed završen: ${rooms.length} soba, ${products.length} proizvoda, ${campaigns.length} kampanje.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());