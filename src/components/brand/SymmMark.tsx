export function SymmMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      {Array.from({ length: 6 }, (_, index) => (
        <path key={index} transform={`rotate(${index * 60} 32 32)`}
          d="M32 7C43 7 49 13 49 22C49 28 45 32 39 34L32 30C39 28 42 25 42 21C42 16 38 14 32 14V7Z"
          fill="currentColor" />
      ))}
    </svg>
  );
}
