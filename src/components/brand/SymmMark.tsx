import Image from "next/image";

export function SymmMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/symm-mark-3d.png"
      alt=""
      aria-hidden="true"
      width={64}
      height={64}
      className={className}
    />
  );
}
