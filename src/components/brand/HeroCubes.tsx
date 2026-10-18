"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";

/** Locally authored Blender mesh, rendered without remote services or tracking. */
export function HeroCubes() {
  const container = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [isPaused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let cleanup = () => {};
    async function initialize() {
      if (reduced.matches) return;
      try {
        const [THREE, { GLTFLoader }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);
        if (disposed) return;
        const renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: true,
          powerPreference: "low-power",
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        renderer.domElement.setAttribute("aria-hidden", "true");
        element!.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
        camera.position.set(0, 0.1, 9.3);
        camera.lookAt(0, 0, 0);
        const generator = new THREE.PMREMGenerator(renderer);
        const environment = new THREE.Scene();
        environment.background = new THREE.Color(0x101119);
        const softboxes:import('three').Mesh[]=[];
        const softbox=(color:number,width:number,height:number,x:number,y:number,z:number)=>{
          const panel=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
          panel.position.set(x,y,z);panel.lookAt(0,0,0);environment.add(panel);softboxes.push(panel);
        };
        softbox(0xfff1ff,2.8,5,-3,3,2);
        softbox(0x8c38ff,1.5,4,3,0,2);
        softbox(0x20afbb,2,3,-2,-2,-1);
        softbox(0xffbb65,3,1,1,4,-2);
        const environmentMap = generator.fromScene(environment, 0.04);
        scene.environment = environmentMap.texture;
        scene.environmentIntensity = 1.1;
        for(const panel of softboxes){panel.geometry.dispose();(panel.material as import('three').Material).dispose();}
        generator.dispose();
        const group = new THREE.Group();
        scene.add(group);
        scene.add(new THREE.AmbientLight(0xc5bbf2, 0.2));
        const key = new THREE.DirectionalLight(0xffe8ff, 2.6);
        key.position.set(-3, 4, 5);
        scene.add(key);
        const violet = new THREE.PointLight(0x9c65ff, 20);
        violet.position.set(3, 1, 2);
        scene.add(violet);
        const cyan = new THREE.PointLight(0x20a9b0, 14);
        cyan.position.set(-3, -1, 1);
        scene.add(cyan);
        const warm = new THREE.DirectionalLight(0xf7b55a, 2);
        warm.position.set(-3, 2, -1);
        scene.add(warm);
        let frame = 0;
        let visible = true;
        let elapsed = 0;
        let previous = 0;
        let model: import("three").Object3D | undefined;
        const resources = new Set<import("three").BufferGeometry>();
        const materials = new Set<import("three").Material>();
        const textures = new Set<import("three").Texture>();
        const resize = () => {
          const { width, height } = element!.getBoundingClientRect();
          renderer.setSize(width, height, false);
          camera.aspect = width / Math.max(height, 1);
          // Fill the hero while preserving the complete orbit on narrow screens.
          camera.position.z = Math.max(8.1, 7.2 / camera.aspect);
          camera.updateProjectionMatrix();
        };
        const observer = new ResizeObserver(resize);
        observer.observe(element!);
        resize();
        const intersection = new IntersectionObserver((entries) => {
          visible = entries[0].isIntersecting;
        });
        intersection.observe(element!);
        const lose = (event: Event) => {
          event.preventDefault();
          setReady(false);
        };
        renderer.domElement.addEventListener("webglcontextlost", lose);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          intersection.disconnect();
          renderer.domElement.removeEventListener("webglcontextlost", lose);
          for (const geometry of resources) geometry.dispose();
          for (const material of materials) material.dispose();
          for (const texture of textures) texture.dispose();
          environmentMap.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
        const gltf = await new GLTFLoader().loadAsync("/hero/algogym-cube.glb");
        model = gltf.scene;
        model.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            resources.add(object.geometry);
            for (const material of Array.isArray(object.material)
              ? object.material
              : [object.material]) {
              materials.add(material);
              for (const value of Object.values(material))
                if (value instanceof THREE.Texture) textures.add(value);
            }
          }
        });
        if (disposed) {
          cleanup();
          return;
        }
        const positions = [
          [-1.08, 0.55, 0.25],
          [0.15, 1.55, -0.2],
          [1.16, 0.4, 0.15],
          [0.75, -1.1, -0.35],
          [-0.65, -1.18, 0.3],
          [-0.7, 0.05, -1.15],
        ];
        const cubes = positions.map((_, index) => {
          const cube = model!.clone(true);
          cube.scale.setScalar(0.92);
          cube.rotation.set(
            0.3 + index * 0.19,
            -0.35 + index * 0.29,
            0.15 - index * 0.11,
          );
          group.add(cube);
          return cube;
        });
        const animate = (time: number) => {
          if (disposed) return;
          frame = requestAnimationFrame(animate);
          const delta = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
          previous = time;
          if (!visible || document.hidden || paused.current) return;
          if (!paused.current) elapsed += delta;
          const turn = (elapsed / 9) * Math.PI * 2;
          group.rotation.set(
            0.16 + Math.sin(turn) * 0.09,
            turn * 0.5,
            -0.15 + Math.sin(turn * 0.5) * 0.09,
          );
          const expansion = 1.02 + Math.sin(turn) * 0.14;
          cubes.forEach((cube, index) => {
            const [x, y, z] = positions[index];
            cube.position.set(
              x * expansion,
              y * expansion + Math.sin(turn + index) * 0.075,
              z * expansion,
            );
            cube.rotation.x = 0.25 + index * 0.21 + turn * 0.22;
            cube.rotation.y = -0.4 + index * 0.29 + turn * 0.34;
            cube.rotation.z =
              0.15 - index * 0.11 + Math.sin(turn + index) * 0.12;
          });
          renderer.render(scene, camera);
          element!.dataset.frames = String(
            Number(element!.dataset.frames ?? 0) + 1,
          );
          element!.dataset.motionTime = elapsed.toFixed(3);
        };
        renderer.render(scene, camera);
        setReady(true);
        frame = requestAnimationFrame(animate);
      } catch {
        if (!disposed) {
          cleanup();
          setReady(false);
        }
      }
    }
    void initialize();
    const preferenceChanged = () => {
      if (reduced.matches) {
        paused.current = true;
        setPaused(true);
        setReady(false);
        cleanup();
      }
    };
    reduced.addEventListener("change", preferenceChanged);
    return () => {
      disposed = true;
      reduced.removeEventListener("change", preferenceChanged);
      cleanup();
    };
  }, []);
  return (
    <div className="hero-cubes" data-ready={ready}>
      <Image
        src="/hero/algogym-cubes-poster.webp"
        alt="Six floating metallic cubes with lilac and iridescent reflections"
        width={1200}
        height={1200}
        sizes="(max-width: 700px) 90vw, 55vw"
        priority
        className={`hero-cubes-poster ${ready ? "is-rendering" : ""}`}
      />
      <div ref={container} className="hero-cubes-canvas" aria-hidden="true" />
      {ready && (
        <button
          className="hero-motion-toggle"
          aria-label={isPaused ? "Play hero animation" : "Pause hero animation"}
          aria-pressed={isPaused}
          onClick={() => {
            paused.current = !paused.current;
            setPaused(paused.current);
          }}
        >
          {isPaused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      )}
    </div>
  );
}
