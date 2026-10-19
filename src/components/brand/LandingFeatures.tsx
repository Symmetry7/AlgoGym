"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Code2,
  GitBranch,
  Users,
  Zap,
} from "lucide-react";
import { CodingPlatformMark, codingProviders } from "./CodingPlatformMark";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { LandingWaves } from "./LandingWaves";

/** Product illustrations describe capabilities, never fabricated user metrics. */
export function LandingFeatures({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const items = element.querySelectorAll<HTMLElement>(
      ".story-card, .discover-row, .brand-monument, .landing-invitation",
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 },
    );
    const configure = () => {
      observer.disconnect();
      element.dataset.motion = reduced.matches ? "reduced" : "ready";
      for (const item of items) {
        if (reduced.matches) item.classList.add("is-revealed");
        else if (!item.classList.contains("is-revealed"))
          observer.observe(item);
      }
    };
    configure();
    reduced.addEventListener("change", configure);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", configure);
    };
  }, []);

  return (
    <div className="landing-feature-sections" ref={root}>
      <LandingWaves />
      <section
        id="how-it-works"
        className="landing-story"
        aria-labelledby="story-title"
      >
        <p className="landing-kicker">Inside AlgoGym</p>
        <h2 id="story-title">Your accounts, practice, and community.</h2>
        <p className="landing-section-description">
          Keep a record of your work across platforms and decide what to
          practice next.
        </p>
        <div className="story-grid">
          <Link href="/onboarding" className="story-card story-connect">
            <div className="landing-provider-grid">
              {codingProviders.map(provider => <span key={provider.id} className="landing-provider-item"><CodingPlatformMark platform={provider.id} /><span>{provider.name}</span></span>)}
            </div>
            <div>
              <span className="story-label">Accounts</span>
              <h3>Connected profiles</h3>
              <p>
                Connect Codeforces and LeetCode to review your solves and
                platform ratings in one workspace.
              </p>
              <p className="landing-provider-note">Ownership checks for all six. Activity sync currently supports Codeforces and LeetCode.</p>
            </div>
            <ArrowUpRight className="card-arrow" size={20} />
          </Link>
          <p className="story-aside">
            Connect an account using your handle. Verify ownership through your
            public profile; your platform password stays private.
          </p>
          <Link href="/training" className="story-card story-rewards">
            <span className="verified-pill">
              <Check size={13} /> Verified submissions
            </span>
            <h3>Coin rewards</h3>
            <div className="chakra-emblem" aria-hidden="true">
              <Zap strokeWidth={1.2} />
            </div>
            <p>
              Eligible accepted solutions earn Coins based on difficulty. Each
              problem earns its first-solve reward once.
            </p>
            <ArrowUpRight className="card-arrow" size={20} />
          </Link>
          <div className="story-caption">
            <span>Use your existing accounts</span>
            <p>
              Submit solutions on the original platform. AlgoGym brings the
              results back to your profile.
            </p>
          </div>
          <Link href="/statistics" className="story-card story-growth">
            <span className="story-label">Statistics</span>
            <h3>Practice statistics</h3>
            <p>
              Review contest ratings, solved difficulty levels, and activity by
              topic to plan your next session.
            </p>
            <div className="growth-visual" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <ArrowUpRight className="card-arrow" size={20} />
          </Link>
          <Link href="/societies" className="story-card story-community">
            <span className="story-label">Community</span>
            <h3>College communities</h3>
            <p>
              Discover CP societies, request membership, and see how you rank
              among your peers.
            </p>
            <div className="community-visual" aria-hidden="true">
              <span>{"{ }"}</span>
              <span>
                <Users size={36} strokeWidth={1.2} />
              </span>
              <span>&lt;/&gt;</span>
            </div>
            <ArrowUpRight className="card-arrow" size={20} />
          </Link>
        </div>
      </section>

      <section
        className="landing-brand-moment"
        aria-labelledby="brand-moment-title"
      >
        <div className="brand-monument" aria-hidden="true">
          <AlgoGymLogo
            className="w-full"
            sizes="(max-width: 600px) 120vw, 768px"
          />
        </div>
        <div className="practice-stack">
          <div className="practice-stack-top">
            <Code2 size={18} />
            <span>Training Gym</span>
            <span className="practice-stack-dot" />
          </div>
          <h2 id="brand-moment-title">Choose what to practice.</h2>
          <div className="practice-track-links">
            <Link href="/training">
              Browse training tracks <ArrowUpRight size={16} />
            </Link>
            <Link href="/problems">
              Explore problems <ArrowUpRight size={16} />
            </Link>
          </div>
          <p>
            Filter by topic and difficulty, then solve on the source platform.
          </p>
        </div>
      </section>

      <section className="landing-discover" aria-labelledby="discover-title">
        <div className="discover-heading">
          <h2 id="discover-title">Explore the workspace</h2>
        </div>
        <Link href="/training" className="discover-row">
          <div className="discover-art art-path" aria-hidden="true">
            <GitBranch size={55} strokeWidth={1} />
            <span>START → SOLVE → REPEAT</span>
          </div>
          <div>
            <h3>Training tracks</h3>
            <p>Follow a track and open each problem on its source platform.</p>
          </div>
          <span className="discover-arrow">
            <ArrowUpRight size={21} />
          </span>
        </Link>
        <Link href="/statistics" className="discover-row">
          <div className="discover-art art-chart" aria-hidden="true">
            <svg viewBox="0 0 200 90">
              <path d="M0 65 C20 65 18 38 40 45 S65 85 90 53 S120 61 140 30 S170 40 200 10" />
            </svg>
            <span>UNDERSTAND YOUR PROGRESS</span>
          </div>
          <div>
            <h3>Performance analysis</h3>
            <p>
              Explore rating history, solve distribution, and practice activity.
            </p>
          </div>
          <span className="discover-arrow">
            <ArrowUpRight size={21} />
          </span>
        </Link>
        <Link href="/societies" className="discover-row">
          <div className="discover-art art-community" aria-hidden="true">
            <span>College communities</span>
            <span>CP societies</span>
          </div>
          <div>
            <h3>Societies and leaderboards</h3>
            <p>
              Discover societies and compare your progress on the leaderboards.
            </p>
          </div>
          <span className="discover-arrow">
            <ArrowUpRight size={21} />
          </span>
        </Link>
      </section>

      <section
        className="landing-invitation"
        aria-labelledby="invitation-title"
      >
        <p className="landing-kicker">Get started</p>
        <h2 id="invitation-title">Create your AlgoGym profile.</h2>
        {children}
        <p className="invitation-note">
          Sign in, select your college, and connect your coding accounts.
        </p>
      </section>
    </div>
  );
}
