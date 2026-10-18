import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement> & {
  variant?: "main" | "compact" | "light" | "dark" | "small";
};
export function ChakraMark({ variant = "compact", ...props }: Props) {
  const mono = variant === "light" || variant === "dark";
  const color = variant === "dark" ? "#171820" : mono ? "#f6f5fa" : "#a993f0";
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      role="img"
      aria-label="Chakra"
      {...props}
    >
      <path
        d="M20 2.5 36.5 12v16L20 37.5 3.5 28V12L20 2.5Z"
        stroke={color}
        strokeWidth="2.25"
      />
      <path
        d="m20 8.5 10 17H10l10-17Z"
        fill={color}
        fillOpacity={mono ? 1 : 0.88}
      />
      <path
        d="m20 31.5-5-8.5h10l-5 8.5Z"
        fill={color}
        fillOpacity={mono ? 1 : 0.55}
      />
      <path
        d="M20 17.5v7"
        stroke={variant === "dark" ? "#f6f5fa" : "#171820"}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
