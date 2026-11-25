"use client";
import { useId, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
/** The supplied wordmark, framed to remove the original image's empty margins. */
export function AlgoGymLogo({
  className = "",
  sizes = "256px",
}: {
  className?: string;
  sizes?: string;
}) {
  const filterId = `wordmark-${useId().replace(/:/g, "")}`;
  return (
    <span
      className={cn(
        "algogym-wordmark relative inline-block w-[132px] shrink-0 overflow-hidden align-middle",
        className,
      )}
      style={
        {
          aspectRatio: "1176 / 275",
          "--wordmark-knockout": `url(#${filterId})`,
        } as CSSProperties
      }
    >
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  3 3 3 0 -0.3"
            />
          </filter>
        </defs>
      </svg>
      <Image
        src="/brand/algogym-wordmark.png"
        alt="AlgoGym"
        width={2048}
        height={683}
        sizes={sizes}
        quality={90}
        className="pointer-events-none absolute h-auto max-w-none"
        style={{ width: "174.15%", left: "-37.3%", top: "-70.9%" }}
      />
    </span>
  );
}
