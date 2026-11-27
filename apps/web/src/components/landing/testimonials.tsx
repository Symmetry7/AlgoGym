import type { Testimonial } from "@/content/testimonials";
import { CartoonAvatar } from "./avatar";

function Card({ t, hidden }: { t: Testimonial; hidden?: boolean }) {
  return (
    <figure aria-hidden={hidden || undefined} className="flex w-[320px] shrink-0 flex-col justify-between rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent)] p-6 sm:w-[440px] sm:p-8">
      <blockquote className="text-pretty text-[15px] leading-[1.6] text-[#a1a4a5] sm:text-[16px]">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <CartoonAvatar seed={t.name} size={40} />
        <span>
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[#f0f0f0]">
            {t.name}
            {!t.verified && <span className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-[#a1a4a5]">Sample</span>}
          </span>
          <span className="block text-[14px] text-[#a1a4a5]">{t.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Testimonial row that drifts slowly; pauses on hover and with reduced motion. Hidden when there's nothing real to show. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="testimonials" className="py-16 md:py-28">
      <div className="mx-auto max-w-[720px] px-4 text-center">
        <h2 id="testimonials" className="ag-text-gradient pb-1 font-display text-[40px] leading-none sm:text-[56px]">Loved by learners</h2>
        <p className="mt-5 text-pretty text-[18px] leading-[1.5] text-[#a1a4a5]">What students and developers say after preparing with Algogym.</p>
      </div>
      <div className="ag-marquee-host ag-marquee-mask mt-14 overflow-x-auto [scrollbar-width:none]">
        <div className="ag-marquee gap-5 px-4" style={{ ["--ag-marquee-duration" as string]: `${items.length * 12}s` }}>
          {[...items, ...items].map((t, i) => <Card key={i} t={t} hidden={i >= items.length} />)}
        </div>
      </div>
    </section>
  );
}
