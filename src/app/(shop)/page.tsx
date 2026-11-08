import { getActiveCampaign, getHomeSections, getRooms } from "@/server/storefront";

export default async function Page() {
  const [campaign, rooms, sections] = await Promise.all([getActiveCampaign(), getRooms(), getHomeSections()]);

  return (
    <div className="container-page flex flex-col gap-8 py-section">
      <div>
        <p className="eyebrow text-ink-muted">{campaign.season}</p>
        <h1 className="font-display text-display-1 italic">{campaign.headline}</h1>
      </div>
      <p className="text-body-lg text-ink-muted">Sobe: {rooms.map((r) => r.name).join(" · ")}</p>
      <p className="text-body-lg text-ink-muted">Sekcije: {sections.map((s) => s.type).join(" → ")}</p>
      <ul className="flex flex-col">
        {campaign.products.map((p) => (
          <li key={p.id} className="flex justify-between border-b border-hairline py-2">
            <span>{p.name}</span>
            <span>{p.colors.map((c) => c.name).join(", ") || p.meta}</span>
            <span>{p.priceRsd} RSD</span>
          </li>
        ))}
      </ul>
    </div>
  );
}