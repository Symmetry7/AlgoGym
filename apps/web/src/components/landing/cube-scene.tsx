"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Hero cube (DESIGN.md §3.1): 3×3×3 dark rounded cubelets whose layers twist, slowly turning, lit from the top right.
const TWIST_MS = 1500;
const PAUSE_MS = 2200;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function CubeScene({ onFail }: { onFail?: () => void }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      onFail?.();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.32; // soft reflections only: the look is matte, not chrome
    renderer.toneMappingExposure = 1.1;

    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    // Light from the top right and behind, so edges catch a thin highlight and faces stay dark.
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(6, 9, 4);
    const back = new THREE.DirectionalLight(0xffffff, 3.4);
    back.position.set(3, 5, -8);
    const fill = new THREE.DirectionalLight(0xffffff, 0.55);
    fill.position.set(-7, 1, 5);
    scene.add(key, back, fill);

    // Tight gaps and small bevels, like machined blocks.
    const geo = new RoundedBoxGeometry(0.93, 0.93, 0.93, 6, 0.075);
    const canvasTex = (draw: (g: CanvasRenderingContext2D) => void) => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      draw(c.getContext("2d")!);
      const t = new THREE.CanvasTexture(c);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    };
    // Fine perforated mesh and a speckled stone grain: the two face textures.
    const meshTex = canvasTex((g) => {
      g.fillStyle = "#8a8a8a"; g.fillRect(0, 0, 256, 256); g.fillStyle = "#0a0a0a";
      for (let y = 4; y < 256; y += 8) for (let x = (y / 8) % 2 ? 8 : 4; x < 256; x += 8) { g.beginPath(); g.arc(x, y, 1.9, 0, Math.PI * 2); g.fill(); }
    });
    const grainTex = canvasTex((g) => {
      g.fillStyle = "#2c2c2f"; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 9000; i++) { const v = 40 + Math.random() * 120; g.fillStyle = `rgb(${v},${v},${v + 3})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1.4, 1.4); }
    });
    const base = new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0.55, roughness: 0.52 });
    const mesh = new THREE.MeshStandardMaterial({ color: 0x18181a, metalness: 0.6, roughness: 0.6, bumpMap: meshTex, bumpScale: 1.6, roughnessMap: meshTex });
    const grain = new THREE.MeshStandardMaterial({ color: 0x9a9aa0, map: grainTex, bumpMap: grainTex, bumpScale: 0.8, metalness: 0.1, roughness: 0.85 });
    const satin = new THREE.MeshStandardMaterial({ color: 0x3c3c41, metalness: 0.4, roughness: 0.35 });
    // Textures go on single faces of a few blocks (box groups: +x, -x, +y, -y, +z, -z), the rest stays plain.
    const SPECIAL: Record<number, [number, THREE.Material]> = { 2: [2, mesh], 8: [4, grain], 11: [0, mesh], 17: [2, satin], 20: [4, mesh], 24: [0, grain], 26: [2, grain], 6: [4, satin] };
    const materialFor = (i: number) => { const sp = SPECIAL[i]; if (!sp) return base; const arr: THREE.Material[] = Array(6).fill(base); arr[sp[0]] = sp[1]; return arr; };

    const cube = new THREE.Group();
    const cubelets: THREE.Mesh[] = [];
    let n = 0;
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const m = new THREE.Mesh(geo, materialFor(n++));
      m.position.set(x, y, z);
      cube.add(m);
      cubelets.push(m);
    }
    const tilt = new THREE.Group(); // pointer tilt, separate from the idle spin
    tilt.add(cube);
    scene.add(tilt);
    cube.rotation.set(0.62, -0.78, 0.05); // corner towards the viewer, top face visible

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      renderer.render(scene, camera);
      return () => cleanup();
    }

    // Layer twist: pick an axis and a slice, rotate it a quarter turn, then snap back onto the grid.
    const pivot = new THREE.Group();
    cube.add(pivot);
    const axes = ["x", "y", "z"] as const;
    let twist: { axis: (typeof axes)[number]; dir: number; start: number } | null = null;
    let nextAt = performance.now() + 600;
    const startTwist = (now: number) => {
      const axis = axes[Math.floor(Math.random() * 3)];
      const slice = Math.floor(Math.random() * 3) - 1;
      pivot.rotation.set(0, 0, 0);
      for (const c of cubelets) if (Math.round(c.position[axis]) === slice) pivot.attach(c);
      twist = { axis, dir: Math.random() < 0.5 ? 1 : -1, start: now };
    };
    const endTwist = () => {
      pivot.updateMatrixWorld();
      for (const c of [...pivot.children]) {
        cube.attach(c);
        c.position.set(Math.round(c.position.x), Math.round(c.position.y), Math.round(c.position.z));
        const e = new THREE.Euler().setFromQuaternion(c.quaternion);
        const q = Math.PI / 2;
        c.rotation.set(Math.round(e.x / q) * q, Math.round(e.y / q) * q, Math.round(e.z / q) * q);
      }
      twist = null;
    };

    let target = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => { target = { x: (e.clientY / innerHeight - 0.5) * 0.35, y: (e.clientX / innerWidth - 0.5) * 0.5 }; };
    if (matchMedia("(pointer: fine)").matches) addEventListener("pointermove", onMove);

    let raf = 0;
    let visible = true;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      cube.rotation.y += dt * 0.00007;
      tilt.rotation.x += (target.x - tilt.rotation.x) * 0.05;
      tilt.rotation.y += (target.y - tilt.rotation.y) * 0.05;
      if (!twist && now >= nextAt) startTwist(now);
      if (twist) {
        const t = Math.min(1, (now - twist.start) / TWIST_MS);
        pivot.rotation[twist.axis] = twist.dir * (Math.PI / 2) * ease(t);
        if (t === 1) { endTwist(); nextAt = now + PAUSE_MS; }
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    const play = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) play(); else stop(); });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : play());
    document.addEventListener("visibilitychange", onVis);
    play();

    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("pointermove", onMove);
      cleanup();
    };

    function cleanup() {
      ro.disconnect();
      geo.dispose();
      for (const mat of [base, mesh, grain, satin]) mat.dispose();
      meshTex.dispose();
      grainTex.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  }, [onFail]);

  return <div ref={host} aria-hidden className="size-full [&>canvas]:block [&>canvas]:size-full" />;
}
