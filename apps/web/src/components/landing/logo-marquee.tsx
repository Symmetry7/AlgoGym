import Image from "next/image";
import Link from "next/link";
import { focusRing } from "@/components/shell/ui";
import { cn } from "@/lib/utils";

type Company = { slug: string; name: string };

function Row({ items, reverse }: { items: Company[]; reverse?: boolean }) {
  return (
    <div className="ag-marquee-host ag-marquee-mask overflow-hidden py-3">
      <ul className={cn("ag-marquee gap-x-14", reverse && "ag-marquee-reverse")} style={{ ["--ag-marquee-duration" as string]: `${Math.max(30, items.length * 3.2)}s` }}>
        {[...items, ...items].map((c, i) => (
          <li key={`${c.slug}-${i}`} aria-hidden={i >= items.length || undefined} className="shrink-0">
            <Link href={`/problems?company=${c.slug}`} tabIndex={i >= items.length ? -1 : undefined} className={cn("flex items-center gap-3 rounded-sm opacity-70 transition-opacity duration-ag-hover hover:opacity-100", focusRing)}>
              {/* The icon files have their own backgrounds, so they sit in grayscale on a small white tile. */}
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white">
                <Image src={`/company-icons/${c.slug}.png`} alt="" width={22} height={22} unoptimized className="size-[22px] object-contain grayscale" />
              </span>
              <span className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.02em] text-white">{c.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Two rows of company logos drifting in opposite directions (paused on hover and with reduced motion). */
export function LogoMarquee({ companies }: { companies: Company[] }) {
  if (companies.length === 0) return null;
  const half = Math.ceil(companies.length / 2);
  return (
    <section aria-labelledby="logos" className="py-16 md:py-24">
      <h2 id="logos" className="mx-auto max-w-[460px] px-4 text-center text-[18px] leading-[1.5] text-[#a1a4a5]">
        Students and developers practise the problems asked at these companies.
      </h2>
      <div className="mt-12 space-y-6">
        <Row items={companies.slice(0, half)} />
        <Row items={companies.slice(half)} reverse />
      </div>
    </section>
  );
}
