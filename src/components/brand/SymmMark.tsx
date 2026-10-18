import type { SVGProps } from "react";

export function SymmMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" role="img" aria-label="Symm AI" {...props}>
      <rect x="3" y="3" width="12" height="12" rx="3" fill="currentColor" />
      <path d="M21 3h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" fill="currentColor" opacity=".55" />
      <path d="M6 18h5a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-5a3 3 0 0 1 3-3Z" fill="currentColor" opacity=".55" />
      <rect x="18" y="18" width="11" height="11" rx="3" fill="currentColor" />
    </svg>
  );
}
