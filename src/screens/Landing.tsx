"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  LoaderCircle,
} from "lucide-react";
import {
  codingProviders,
  CodingPlatformMark,
} from "@/components/brand/CodingPlatformMark";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { HeroCubes } from "@/components/brand/HeroCubes";
import { LandingFeatures } from "@/components/brand/LandingFeatures";
import { GoogleMark } from "@/components/auth/GoogleMark";
import { useAuth } from "@/contexts/AuthContext";
import "./landing.css";

const SymmShowcase = dynamic(() => import("@/components/brand/SymmShowcase"), {
  loading: () => <div style={{ minHeight: 500 }} aria-hidden="true" />,
});

const links = [
  ["Explore", "/problems"],
  ["Training", "/training"],
  ["Leaderboards", "/leaderboards"],
  ["Communities", "/societies"],
  ["Pricing", "/pricing"],
] as const;

function GoogleStart() {
  const { user, signInWithGoogle } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="landing-auth-action">
      <button
        className="hero-google-button"
        disabled={pending}
        onClick={async () => {
          if (user) {
            window.location.assign("/dashboard");
            return;
          }
          setPending(true);
          setError("");
          try {
            await signInWithGoogle();
          } catch (reason) {
            setPending(false);
            setError(
              reason instanceof Error
                ? reason.message
                : "Sign-in could not be started. Please retry.",
            );
          }
        }}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          !user && <GoogleMark />
        )}
        {user
          ? "Open your dashboard"
          : pending
            ? "Connecting…"
            : "Continue with Google"}
        <ArrowRight size={16} />
      </button>
      {error && (
        <p role="alert" className="landing-auth-error">
          {error} <Link href="/sign-in">Try another sign-in option</Link>
        </p>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing-page">
      <a href="#main-content" className="landing-skip">
        Skip to content
      </a>
      <main id="main-content">
        <section className="landing-stage" aria-label="Welcome to AlgoGym">
          <header className="landing-header">
            <nav aria-label="Main navigation" className="landing-nav">
              <Link href="/" aria-label="AlgoGym home">
                <AlgoGymLogo />
              </Link>
              <div className="landing-desktop-links">
                {links.map(([label, href]) => (
                  <Link key={href} href={href}>
                    {label}
                  </Link>
                ))}
              </div>
              <div className="landing-nav-actions">
                <Link href="/sign-in" className="landing-sign-in">
                  Sign in <ArrowUpRight size={14} />
                </Link>
                <details className="landing-mobile-menu">
                  <summary>Menu</summary>
                  <div>
                    {links.map(([label, href]) => (
                      <Link key={href} href={href}>
                        {label}
                      </Link>
                    ))}
                  </div>
                </details>
              </div>
            </nav>
          </header>
          <section className="landing-hero">
            <div className="hero-copy">
              <h1>
                Your competitive programming{" "}
                <span className="hero-workspace">
                  <span className="hero-wave-letter">
                    <span className="sr-only">w</span>
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      viewBox="0 0 68 66"
                    >
                      <path d="M 3 21 L 13 5 L 27 57 L 39 22 L 51 48 L 64 18" />
                    </svg>
                  </span>
                  <span className="hero-workspace-text">orkspace.</span>
                </span>
              </h1>
              <p className="hero-description">
                Every problem is a building block.
                <br />
                <span>Keep stacking.</span>
              </p>
              <div className="hero-platforms">
                <span>CODING PLATFORMS</span>
                {codingProviders.map((provider) => (
                  <span
                    key={provider.id}
                    title={`${provider.name}${provider.available ? "" : " — integration in progress"}`}
                  >
                    <CodingPlatformMark platform={provider.id} />
                    <span>{provider.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <HeroCubes />
            <div className="hero-stage-bottom">
              <div>
                <GoogleStart />
                <p className="hero-auth-note">
                  <Link href="/sign-in">Or sign in with email</Link>
                </p>
              </div>
              <Link
                href="#how-it-works"
                aria-label="Discover how AlgoGym works"
                className="hero-scroll-link"
              >
                <ArrowDown size={18} />
              </Link>
            </div>
          </section>
        </section>
        <SymmShowcase />
        <LandingFeatures>
          <GoogleStart />
        </LandingFeatures>
        <section className="landing-lab-pricing" aria-label="Plans and the team behind AlgoGym">
          <div className="landing-lab-pricing-inner">
            <div>
              <p className="landing-kicker">Go further</p>
              <h2>Choose your pace.</h2>
              <p>Start with Symm AI and structured practice. See the planned Pro and Premium learning options.</p>
              <Link href="/pricing">Explore plans <ArrowRight size={17} /></Link>
            </div>
            <div>
              <p className="landing-kicker">Our lab</p>
              <h2>Built with InseLabs.</h2>
              <p>AlgoGym is shaped by a small technology team focused on thoughtful learning tools.</p>
              <a href="https://www.inselabs.com/" target="_blank" rel="noopener noreferrer">Visit InseLabs <ArrowUpRight size={17} /></a>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Link href="/" aria-label="AlgoGym home">
          <AlgoGymLogo className="w-[104px]" />
        </Link>
        <span>A workspace for competitive programmers.</span>
        <Link href="/pricing">Pricing</Link>
        <a href="https://www.inselabs.com/" target="_blank" rel="noopener noreferrer">Our Lab</a>
        <a href="https://www.linkedin.com/company/inselabs/" target="_blank" rel="noopener noreferrer">Contact</a>
        <Link href="/privacy">Privacy</Link>
      </footer>
    </div>
  );
}
