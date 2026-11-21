import Link from "next/link";

import {
  BrandStoryForm,
  GiftsForm,
  NewsletterForm,
  ProductGridForm,
  SocialForm,
} from "@/components/admin/home-section-forms";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import type { HomeSectionType } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import {
  HOME_SECTION_LABEL,
  HOME_SECTION_SOURCE,
  readBrandStory,
  readGifts,
  readNewsletter,
  readProductGrid,
  readSocial,
  SOCIAL_POST_SLOTS,
} from "@/lib/home-content";
import { moveHomeSection, setHomeImage, toggleHomeSection } from "@/server/admin/home-actions";
import { getAdminHomeSections, settingsOf } from "@/server/admin/home";
import { requireRole } from "@/server/auth/guard";
import { mediaUrl } from "@/server/storefront/media";

export const metadata = { title: "Početna" };

// Admin uvek čeka proveru prijave, pa se ne prikazuje „instant“ pre podataka.
export const instant = false;

const arrow =
  "flex size-8 items-center justify-center border border-hairline text-ink transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-30";
const smallLink = "text-caption text-ink underline underline-offset-4 hover:text-ink-muted";

/** Sekcije koje se uređuju ovde imaju svoj panel ispod liste. */
const ANCHOR: Partial<Record<HomeSectionType, string>> = {
  PRODUCT_GRID: "mreza-proizvoda",
  BRAND_STORY: "prica-brenda",
  GIFTS: "pokloni",
  SOCIAL: "mreze",
  NEWSLETTER: "novosti",
};

export default async function AdminHomePage() {
  await requireRole("ADMIN", "/admin/pocetna");
  const rows = await getAdminHomeSections();
  const others = rows.filter((row) => row.type !== "HERO");

  const productGrid = readProductGrid(settingsOf(rows, "PRODUCT_GRID"));
  const brandStory = readBrandStory(settingsOf(rows, "BRAND_STORY"));
  const gifts = readGifts(settingsOf(rows, "GIFTS"));
  const social = readSocial(settingsOf(rows, "SOCIAL"));
  const newsletter = readNewsletter(settingsOf(rows, "NEWSLETTER"));

  const viewLink = (
    <Link href="/" target="_blank" className={smallLink}>
      Pogledaj početnu
    </Link>
  );

  return (
    <>
      <AdminPageHeader
        title="Početna"
        description="Redosled i uključivanje sekcija, i tekstovi sekcija koje ne dolaze iz kampanje ili soba."
        actions={viewLink}
      />

      <div className="flex max-w-5xl flex-col gap-8">
        <Panel title="Sekcije">
          <ol className="flex flex-col">
            {rows.map((row) => {
              const isHero = row.type === "HERO";
              const index = others.findIndex((other) => other.type === row.type);
              const source = HOME_SECTION_SOURCE[row.type];
              const anchor = ANCHOR[row.type];
              return (
                <li
                  key={row.type}
                  className={cn(
                    "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-hairline py-3 last:border-b-0",
                    !row.isEnabled && "opacity-60",
                  )}
                >
                  <div className="flex w-[4.25rem] gap-1.5">
                    {isHero ? (
                      <span className="text-caption text-ink-muted">Uvek prvi</span>
                    ) : (
                      <>
                        <form action={moveHomeSection}>
                          <input type="hidden" name="type" value={row.type} />
                          <input type="hidden" name="direction" value="up" />
                          <button
                            type="submit"
                            disabled={index === 0}
                            aria-label={`${HOME_SECTION_LABEL[row.type]}: gore`}
                            className={arrow}
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveHomeSection}>
                          <input type="hidden" name="type" value={row.type} />
                          <input type="hidden" name="direction" value="down" />
                          <button
                            type="submit"
                            disabled={index === others.length - 1}
                            aria-label={`${HOME_SECTION_LABEL[row.type]}: dole`}
                            className={arrow}
                          >
                            ↓
                          </button>
                        </form>
                      </>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-body text-ink">{HOME_SECTION_LABEL[row.type]}</p>
                    <p className="text-caption text-ink-muted">
                      {source ? (
                        <>
                          Sadržaj iz:{" "}
                          <Link href={source.href} className="underline underline-offset-4 hover:text-ink">
                            {source.label}
                          </Link>
                        </>
                      ) : anchor ? (
                        <a href={`#${anchor}`} className="underline underline-offset-4 hover:text-ink">
                          Uredi tekstove
                        </a>
                      ) : null}
                    </p>
                  </div>

                  {isHero ? (
                    <span className="text-caption text-ink-muted">Uključena</span>
                  ) : (
                    <form action={toggleHomeSection}>
                      <input type="hidden" name="type" value={row.type} />
                      <button
                        type="submit"
                        className={cn(
                          "inline-flex h-8 items-center border px-3 text-[0.6875rem] tracking-[0.08em] uppercase transition-colors",
                          row.isEnabled
                            ? "border-ink bg-ink text-surface hover:bg-ink/85"
                            : "border-hairline text-ink-muted hover:border-ink hover:text-ink",
                        )}
                      >
                        {row.isEnabled ? "Uključena" : "Isključena"}
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="pt-3 pb-1 text-caption text-ink-muted">
            Klik na „Uključena“ isključuje sekciju (i obrnuto). Isključena sekcija zadržava svoje tekstove.
          </p>
        </Panel>

        <div id="mreza-proizvoda" className="scroll-mt-20">
          <Panel title="Mreža proizvoda">
            <div className="py-2">
              <ProductGridForm settings={productGrid} />
            </div>
          </Panel>
        </div>

        <div id="prica-brenda" className="scroll-mt-20">
          <Panel title="Priča brenda">
            <div className="py-2">
              <BrandStoryForm
                settings={brandStory}
                imageSrc={mediaUrl(brandStory.imagePath)}
                saveImage={setHomeImage.bind(null, "BRAND_STORY")}
              />
            </div>
          </Panel>
        </div>

        <div id="pokloni" className="scroll-mt-20">
          <Panel title="Pokloni">
            <div className="py-2">
              <GiftsForm
                settings={gifts}
                imageSrc={mediaUrl(gifts.imagePath)}
                saveImage={setHomeImage.bind(null, "GIFTS")}
              />
            </div>
          </Panel>
        </div>

        <div id="mreze" className="scroll-mt-20">
          <Panel title="Mreže (Instagram i TikTok)">
            <div className="py-2">
              <SocialForm
                settings={social}
                imageSrcs={social.posts.map((post) => mediaUrl(post.imagePath))}
                saveImages={Array.from({ length: SOCIAL_POST_SLOTS }, (_, i) =>
                  setHomeImage.bind(null, `SOCIAL_${i}` as const),
                )}
              />
            </div>
          </Panel>
        </div>

        <div id="novosti" className="scroll-mt-20">
          <Panel title="Novosti">
            <div className="py-2">
              <NewsletterForm settings={newsletter} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}