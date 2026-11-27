"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Hero cube (DESIGN.md §3.1): 3×3×3 dark rounded cubelets whose layers twist, slowly turning, lit from the top right.
const TWIST_MS = 1100;
const PAUSE_MS = 1600;
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
    scene.environmentIntensity = 0.55;
    renderer.toneMappingExposure = 1.05;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 10.5);

    // Studio lighting: a strong key from the top right, a cool rim behind, a soft fill below.
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(5, 8, 7);
    const rim = new THREE.DirectionalLight(0xc8d2ff, 2.2);
    rim.position.set(-7, 3, -6);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-3, -6, 4);
    scene.add(key, rim, fill);

    const geo = new RoundedBoxGeometry(0.955, 0.955, 0.955, 6, 0.07);
    // Perforated metal: a dot grid drawn once into a canvas, used as bump and roughness.
    const dots = document.createElement("canvas");
    dots.width = dots.height = 256;
    const g = dots.getContext("2d")!;
    g.fillStyle = "#9a9a9a";
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = "#101010";
    for (let y = 8; y < 256; y += 16) for (let x = (y / 16) % 2 ? 16 : 8; x < 256; x += 16) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); }
    const dotTex = new THREE.CanvasTexture(dots);
    dotTex.wrapS = dotTex.wrapT = THREE.RepeatWrapping;
    const gloss = new THREE.MeshPhysicalMaterial({ color: 0x050506, metalness: 0.85, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08 });
    const matte = new THREE.MeshPhysicalMaterial({ color: 0x121215, metalness: 0.25, roughness: 0.7, sheen: 0.4, sheenColor: new THREE.Color(0x2a2a30) });
    const perforated = new THREE.MeshStandardMaterial({ color: 0x1b1b1f, metalness: 0.7, roughness: 0.55, bumpMap: dotTex, bumpScale: 2.2, roughnessMap: dotTex });
    const silver = new THREE.MeshPhysicalMaterial({ color: 0x8c8c94, metalness: 1, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.2 });
    const materialFor = (i: number) => ([4, 13, 22].includes(i) ? silver : [1, 9, 16, 25].includes(i) ? perforated : i % 3 === 0 ? matte : gloss);

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
    cube.rotation.set(0.5, -0.6, 0.12);

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
      cube.rotation.y += dt * 0.00018;
      cube.rotation.x += dt * 0.00005;
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
      for (const mat of [gloss, matte, perforated, silver]) mat.dispose();
      dotTex.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
  }, [onFail]);

  return <div ref={host} aria-hidden className="size-full [&>canvas]:block [&>canvas]:size-full" />;
}
