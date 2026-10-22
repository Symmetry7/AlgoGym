"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Sparkles } from "lucide-react";
import { SymmMark } from "./SymmMark";
import "./symm-launch-preview.css";

const lessons = [
  {
    label: "Spot the pattern",
    title: "Turn the problem into a check.",
    code: "can(mid) → true or false",
    kind: "Concept",
  },
  {
    label: "Build the intuition",
    title: "Find the one-way boundary.",
    code: "false · false · true · true",
    kind: "Reasoning",
  },
  {
    label: "Write the solution",
    title: "Search for the first valid answer.",
    code: "if (can(mid)) hi = mid; else lo = mid + 1;",
    kind: "Implementation",
  },
  {
    label: "Make it yours",
    title: "Use the pattern in practice.",
    code: "learn → solve → reflect",
    kind: "Practice",
  },
] as const;

export function SymmLaunchPreview() {
  const [active, setActive] = useState(1);
  const [visible, setVisible] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const lesson = lessons[active];

  useEffect(() => {
    const node = previewRef.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={previewRef} id="product-preview" className="symm-launch" data-ui data-visible={visible} aria-label="Interactive preview of a SYMM AI learning path">
      <div className="symm-launch-toolbar">
        <div className="symm-launch-brand"><SymmMark className="size-7 rounded-md object-contain" /><strong>SYMM AI</strong><span className="symm-launch-crumb">/</span><span>Learning path</span></div>
        <span className="symm-launch-preview-label">INTERACTIVE PRODUCT PREVIEW</span>
      </div>
      <div className="symm-launch-question">
        <span className="symm-launch-question-icon"><Sparkles size={16} strokeWidth={1.7} /></span>
        <div><span>YOUR QUESTION</span><p>When should I binary search the answer?</p></div>
        <span className="symm-launch-question-action" aria-hidden="true"><ArrowUpRight size={18} /></span>
      </div>
      <div className="symm-launch-workspace">
        <div className="symm-launch-path">
          <div className="symm-launch-path-title"><span>YOUR PATH</span><span>4 steps</span></div>
          <div className="symm-launch-path-list" role="group" aria-label="Preview learning path steps">
            {lessons.map((item, index) => (
              <button key={item.label} type="button" className="symm-launch-step" aria-pressed={active === index} onClick={() => setActive(index)}>
                <span className="symm-launch-step-index">{index < active ? <Check size={14} strokeWidth={2.2} /> : index + 1}</span>
                <span>{item.label}</span>
                <ChevronRight className="symm-launch-chevron" size={15} />
              </button>
            ))}
          </div>
          <div className="symm-launch-path-progress"><span style={{ width: `${(active + 1) * 25}%` }} /></div>
        </div>
        <div className="symm-launch-lesson" key={active} aria-live="polite">
          <div className="symm-launch-lesson-meta"><span>STEP {active + 1} / 4</span><span>{lesson.kind}</span></div>
          <h2>{lesson.title}</h2>
          <div className="symm-launch-boundary" data-step={active + 1} role="img" aria-label="Binary search example: values switch from invalid to valid at one boundary">
            <div className="symm-launch-boundary-scale"><span>DOESN’T WORK</span><span>WORKS</span></div>
            <div className="symm-launch-boundary-cells">{Array.from({ length: 9 }, (_, index) => <span key={index} className={index === 4 ? "is-boundary" : index > 4 ? "is-valid" : ""}>{index === 4 ? <Check size={17} strokeWidth={2.5} /> : null}</span>)}</div>
            <div className="symm-launch-boundary-caption"><span>Search space</span><strong>first valid answer</strong></div>
          </div>
          <code className="symm-launch-code">{lesson.code}</code>
          <Link href="/training/symm?topic=binary%20search%20on%20the%20answer">Build your own path <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </div>
  );
}
