"use client";

import { useEffect, useRef } from "react";
import "./living-field.css";

type LivingFieldProps = {
  className?: string;
  intensity?: "hero" | "showcase" | "workspace";
  active?: boolean;
};

/** A restrained field of paths: the same visual language at three intensities. */
export function LivingField({ className = "", intensity = "hero", active = false }: LivingFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !host || !context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = true;
    let frame = 0;
    let lastFrame = 0;
    let width = 1;
    let height = 1;
    let pointerX = 0.5;
    let pointerY = 0.5;
    let smoothX = 0.5;
    let smoothY = 0.5;

    const resize = () => {
      const bounds = host.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      smoothX += (pointerX - smoothX) * 0.055;
      smoothY += (pointerY - smoothY) * 0.055;
      const calm = intensity === "workspace";
      const strength = calm ? (activeRef.current ? 0.62 : 0.37) : intensity === "showcase" ? 0.62 : 1;
      const seconds = reduced.matches ? 0 : time * 0.00028;
      const centerX = width * (calm ? 0.53 : 0.68) + (smoothX - 0.5) * Math.min(width * 0.12, 90);
      const centerY = height * (calm ? 0.43 : 0.52) + (smoothY - 0.5) * Math.min(height * 0.1, 54);
      const reach = Math.min(width * 0.54, height * 0.82);

      // The light is confined to the intersection of the paths, leaving copy clear.
      const halo = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, reach);
      halo.addColorStop(0, `rgba(149, 107, 213, ${0.17 * strength})`);
      halo.addColorStop(0.32, `rgba(90, 76, 160, ${0.085 * strength})`);
      halo.addColorStop(1, "rgba(14, 12, 25, 0)");
      context.fillStyle = halo;
      context.fillRect(0, 0, width, height);

      const spread = Math.min(width, height) * (calm ? 0.34 : 0.43);
      for (let index = -15; index <= 15; index++) {
        const offset = index / 15;
        const phase = seconds + index * 0.19;
        const lift = Math.sin(phase) * (reduced.matches ? 0 : 11);
        const startX = centerX - reach * 1.28;
        const endX = centerX + reach * 1.15;
        const startY = centerY + offset * spread * 1.38 + lift;
        const endY = centerY - offset * spread * 0.86 - lift;
        const nearFocus = 1 - Math.min(Math.abs(offset), 1);
        context.beginPath();
        context.moveTo(startX, startY);
        context.bezierCurveTo(
          centerX - reach * 0.28, startY - offset * spread * 0.48,
          centerX + reach * 0.17, endY + offset * spread * 0.4,
          endX, endY,
        );
        context.strokeStyle = index % 4 === 0
          ? `rgba(222, 205, 255, ${(0.15 + nearFocus * 0.22) * strength})`
          : `rgba(153, 126, 217, ${(0.08 + nearFocus * 0.13) * strength})`;
        context.lineWidth = index % 4 === 0 ? 1.2 : 0.7;
        context.stroke();
      }

      // A few traveling signals give the field a sense of computation rather than wallpaper.
      for (let index = 0; index < 13; index++) {
        const track = (index * 7) % 27 - 13;
        const progress = (index * 0.137 + seconds * (0.23 + index % 3 * 0.045)) % 1;
        const x = centerX + (progress - 0.5) * reach * 2.2;
        const normalized = (x - centerX) / reach;
        const y = centerY + track / 15 * spread * (0.5 - normalized * 0.45) + Math.sin(seconds + track * 0.19) * 8;
        const radius = index % 4 === 0 ? 2.2 : 1.3;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(231, 213, 255, ${(0.28 + 0.34 * (1 - Math.abs(normalized))) * strength})`;
        context.fill();
      }
    };

    const tick = (time: number) => {
      if (time - lastFrame >= 32) {
        draw(time);
        lastFrame = time;
      }
      if (visible && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const syncAnimation = () => {
      cancelAnimationFrame(frame);
      draw(0);
      if (visible && !reduced.matches && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const onPointer = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointerX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      pointerY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    }, { threshold: 0.02 });
    const resizeObserver = new ResizeObserver(resize);
    observer.observe(host);
    resizeObserver.observe(host);
    host.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", syncAnimation);
    reduced.addEventListener("change", syncAnimation);
    resize();
    syncAnimation();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      host.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", syncAnimation);
      reduced.removeEventListener("change", syncAnimation);
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className={`living-field living-field--${intensity} ${className}`} aria-hidden="true" />;
}
