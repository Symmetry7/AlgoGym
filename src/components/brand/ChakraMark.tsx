import type { ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  variant?: "main" | "compact" | "light" | "dark" | "small";
};

export function CoinMark({ variant: _variant, ...props }: Props) {
  return <img src="/brand/coin.webp" alt="Coin" width={40} height={40} {...props} />;
}

// Keep the export while older screens migrate their import names.
export const ChakraMark = CoinMark;
