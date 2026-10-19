"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const fragment = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
    float cycle = uTime * 0.2244;
    vec2 upper = vec2(0.62 + 0.09 * sin(cycle), 0.39 + 0.06 * cos(cycle));
    vec2 lower = vec2(-0.63 + 0.07 * cos(cycle + 0.6), -0.43 + 0.06 * sin(cycle));

    vec2 a = p - upper;
    vec2 b = p - lower;
    float top = exp(-((a.x * a.x) / 0.38 + (a.y * a.y) / 0.11));
    float bottom = exp(-((b.x * b.x) / 0.42 + (b.y * b.y) / 0.15));
    float edge = max(top, bottom);
    float soft = smoothstep(0.055, 0.77, edge);

    vec3 ink = vec3(0.015, 0.019, 0.025);
    vec3 ice = vec3(0.53, 0.77, 0.83);
    vec3 blue = vec3(0.015, 0.54, 0.75);
    vec3 color = mix(ink, mix(ice, blue, clamp(edge * 0.75, 0.0, 1.0)), soft);
    float grain = hash(gl_FragCoord.xy + floor(uTime * 14.0) * 19.0) - 0.5;
    color += grain * (0.025 + 0.16 * soft);
    color = max(color, vec3(0.0));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function SymmAtmosphere() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvas.current) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas.current, antialias: false, alpha: false, powerPreference: "low-power" });
    } catch {
      return; // The CSS background remains visible without WebGL.
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }",
      fragmentShader: fragment,
      depthTest: false,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(geometry, material));
    const resize = () => {
      if (!canvas.current) return;
      const width = canvas.current.clientWidth;
      const height = canvas.current.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.current);
    resize();

    const started = performance.now();
    let frame = 0;
    let last = 0;
    const animate = (now: number) => {
      frame = requestAnimationFrame(animate);
      if (document.hidden || reducedMotion.matches || now - last < 32) return;
      last = now;
      uniforms.uTime.value = (now - started) / 1000;
      renderer.render(scene, camera);
    };
    if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvas} className="symm-atmosphere" aria-hidden="true" />;
}
