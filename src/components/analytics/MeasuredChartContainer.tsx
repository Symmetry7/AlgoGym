"use client";

import { cloneElement, useEffect, useRef, useState, type ReactElement } from "react";

/** Give Recharts real pixel dimensions when its responsive observer misses layout. */
export function MeasuredChartContainer({ children }: { children: ReactElement<{ width?: number; height?: number }>; width?: string | number; height?: string | number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const rect = element.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      if (width > 0 && height > 0)
        setSize((current) => current.width === width && current.height === height ? current : { width, height });
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  return <div ref={ref} className="h-full w-full min-w-0">{size.width && size.height ? cloneElement(children, size) : null}</div>;
}
