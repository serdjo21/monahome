"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";

import { SectionHeading } from "./section-heading";

type CarouselProps = {
  headingId: string;
  eyebrow?: string;
  title: string;
  link?: { href: string; label: string };
  children: React.ReactNode;
};

/**
 * Horizontalni niz sa scroll-snap-om: radi prstom, trackpadom i tastaturom (Tab kroz kartice),
 * a strelice su dodatak za miš. Bez biblioteke.
 */
export function Carousel({ headingId, eyebrow, title, link, children }: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    setEdges({ start: track.scrollLeft <= 2, end: track.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateEdges();
    track.addEventListener("scroll", updateEdges, { passive: true });
    const observer = new ResizeObserver(updateEdges);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", updateEdges);
      observer.disconnect();
    };
  }, [updateEdges]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow =
    "inline-flex size-11 items-center justify-center border border-hairline text-ink transition-colors hover:border-ink disabled:cursor-default disabled:opacity-35 disabled:hover:border-hairline";

  return (
    <div>
      <div className="container-page">
        <SectionHeading id={headingId} eyebrow={eyebrow} title={title} link={link}>
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              aria-label="Prethodni proizvodi"
              className={arrow}
              disabled={edges.start}
              onClick={() => scrollByPage(-1)}
            >
              <ArrowLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Sledeći proizvodi"
              className={arrow}
              disabled={edges.end}
              onClick={() => scrollByPage(1)}
            >
              <ArrowRightIcon />
            </button>
          </div>
        </SectionHeading>
      </div>

      <ul
        ref={trackRef}
        aria-labelledby={headingId}
        className="no-scrollbar flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto overscroll-x-contain px-5 md:scroll-px-10 md:gap-6 md:px-10 xl:scroll-px-[var(--spacing-gutter)] xl:px-[var(--spacing-gutter)]"
      >
        {Children.map(children, (child) => (
          <li className="w-[70vw] shrink-0 snap-start sm:w-[42vw] lg:w-[calc((100%-3*1.5rem)/3.4)]">{child}</li>
        ))}
      </ul>
    </div>
  );
}