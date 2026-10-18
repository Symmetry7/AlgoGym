/** Decorative linework stays behind content and never intercepts interaction. */
export function LandingWaves() {
  return (
    <div className="landing-wave-backdrop" aria-hidden="true">
      {[0, 1, 2].map((band) => (
        <svg key={band} className={`landing-wave-band landing-wave-band-${band}`} viewBox="0 0 1440 800" preserveAspectRatio="none" focusable="false">
          <defs>
            <linearGradient id={`landing-wave-ink-${band}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7960cd" stopOpacity=".1" />
              <stop offset=".28" stopColor="#a78bfa" stopOpacity=".65" />
              <stop offset=".62" stopColor="#c4b5e9" stopOpacity=".45" />
              <stop offset="1" stopColor="#7960cd" stopOpacity=".1" />
            </linearGradient>
          </defs>
          <g fill="none" stroke={`url(#landing-wave-ink-${band})`} strokeWidth="1">
            {Array.from({length: 22}, (_, index) => (
              <path key={index} d={`M -100 ${100 + index * 20} C 330 ${-170 + index * 34}, 680 ${950 - index * 24}, 1540 ${170 + index * 17}`} vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        </svg>
      ))}
    </div>
  );
}
