"use client";

import { useEffect, useState } from "react";
import "./symm-kinetic-type.css";

const phrases = [
  "Think beyond the obvious.",
  "Turn complexity into clarity.",
  "Explore ideas without limits.",
  "Your intelligence, amplified.",
];

export function SymmKineticType({ className = "" }: { className?: string }) {
  const [phrase, setPhrase] = useState(0);
  const [length, setLength] = useState(phrases[0].length);
  const [deleting, setDeleting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const complete = length === phrases[phrase].length;
    const empty = length === 0;
    const delay = complete && !deleting ? 2700 : empty && deleting ? 340 : deleting ? 27 : 48;
    const timer = window.setTimeout(() => {
      if (complete && !deleting) setDeleting(true);
      else if (empty && deleting) { setPhrase((value) => (value + 1) % phrases.length); setDeleting(false); }
      else setLength((value) => value + (deleting ? -1 : 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [deleting, length, phrase, reduced]);

  return (
    <span className={`symm-kinetic ${className}`}>
      <span className="sr-only">Think beyond the obvious. Turn complexity into clarity.</span>
      <span aria-hidden="true">{reduced ? phrases[0] : phrases[phrase].slice(0, length)}<span className="symm-kinetic-cursor" /></span>
    </span>
  );
}
