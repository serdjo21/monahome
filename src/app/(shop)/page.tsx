import { cacheLife } from "next/cache";

import { prisma } from "@/server/db";

async function getTestData() {
  "use cache";
  cacheLife("seconds");
  const [products, campaign] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" }, select: { name: true, priceRsd: true } }),
    prisma.campaign.findFirst({ where: { isDefault: false }, select: { headline: true } }),
  ]);
  return { products, campaign };
}

export default async function Page() {
  const { products, campaign } = await getTestData();
  return (
    <div className="container-page flex flex-col gap-6 py-section">
      <p className="eyebrow text-ink-muted">Test baze</p>
      <h1 className="font-display text-display-1 italic">{campaign?.headline ?? "Nema kampanje"}</h1>
      <ul className="flex flex-col gap-2">
        {products.map((p) => (
          <li key={p.name} className="flex justify-between border-b border-hairline py-2">
            <span>{p.name}</span>
            <span>{p.priceRsd} RSD</span>
          </li>
        ))}
      </ul>
    </div>
  );
}