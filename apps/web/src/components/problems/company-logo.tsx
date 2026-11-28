import Image from "next/image";
import { cn } from "@/lib/utils";

// shortcut: mirrors public/company-icons/*.png by hand; add a slug here when a new icon lands there.
const ICONS = new Set(
  "accenture adobe amazon apple atlassian barclays bloomberg capgemini cisco cognizant cred flipkart goldman-sachs google hcltech hsbc infosys intuit j-p-morgan-chase linkedin mastercard meesho meta microsoft morgan-stanley netflix oracle paypal paytm phonepe razorpay salesforce servicenow stripe swiggy tcs-tcs-nqt tech-mahindra tower-research-capital uber visa walmart wipro zepto zomato".split(" "),
);

/** A company's logo on a small white tile (the icons carry their own backgrounds), or its initial when there's no icon. */
export function CompanyLogo({ slug, name, size = 28, className }: { slug: string; name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-white ring-1 ring-black/10", className)}
      style={{ width: size, height: size }}
    >
      {ICONS.has(slug) ? (
        <Image src={`/company-icons/${slug}.png`} alt="" width={size} height={size} className="size-full object-contain p-[3px]" />
      ) : (
        <span aria-hidden className="font-ui text-[12px] font-semibold text-neutral-800">{name.slice(0, 1).toUpperCase()}</span>
      )}
    </span>
  );
}
