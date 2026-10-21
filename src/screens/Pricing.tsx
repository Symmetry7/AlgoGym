"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { SymmMark } from "@/components/brand/SymmMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import "./pricing.css";

const plans = [
  {
    name: "Free",
    monthly: "₹0",
    annual: "₹0",
    credits: "3 signup credits at launch",
    features: ["Core Training Gym", "Beginner learning tracks", "Basic coding statistics", "Saved learning paths"],
  },
  {
    name: "Pro",
    monthly: "₹199",
    annual: "₹1,999",
    credits: "50 AI credits each month",
    features: ["Everything in Free", "Advanced training tracks", "Expanded upsolving tools", "Advanced practice statistics"],
  },
  {
    name: "Premium",
    monthly: "₹399",
    annual: "₹3,999",
    credits: "150 AI credits each month",
    features: ["Everything in Pro", "Curated problem sets", "One mentor group session per month", "Limited mentor Q&A"],
  },
] as const;

const comparison = [
  ["AI credits", "3 once at signup", "50 per month", "150 per month"],
  ["Training", "Foundations", "All training levels", "All training levels"],
  ["Practice sheets", "Starter sheets", "Advanced sheets", "Advanced + expert-curated"],
  ["Upsolving", "Recent attempts", "Expanded tools", "Expanded tools"],
  ["Statistics", "Core metrics", "Advanced analysis", "Advanced analysis"],
  ["Saved learning content", "Revisit anytime", "Revisit anytime", "Revisit anytime"],
  ["Mentorship", "Not included", "Not included", "Monthly group session + limited Q&A"],
  ["Support", "Standard", "Standard", "Priority"],
] as const;

export default function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  return (
    <main className="pricing-page">
      <nav className="pricing-nav" aria-label="Pricing navigation">
        <Link href="/" aria-label="AlgoGym home"><AlgoGymLogo className="w-32" /></Link>
        <div className="flex items-center gap-4"><ThemeToggle /><Link href="/" className="pricing-back"><ArrowLeft size={15} /> Back to AlgoGym</Link></div>
      </nav>
      <div className="pricing-content">
        <div className="pricing-intro">
          <div className="pricing-eyebrow"><SymmMark className="size-7 rounded-md" /> SYMM AI · PLANS</div>
          <h1>Choose how far you want to go.</h1>
          <p>Start learning for free. Go further with Symm AI.</p>
          <div role="group" aria-label="Billing period" className="pricing-period">
            <button type="button" aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>Monthly</button>
            <button type="button" aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>Yearly</button>
          </div>
        </div>
        <p className="pricing-availability" role="status">Pro and Premium are a preview. Checkout is unavailable until secure subscription billing launches.</p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={`pricing-card ${plan.name === "Pro" ? "pricing-card-featured" : ""}`}>
              <div className="pricing-card-top"><span>{plan.name}</span>{plan.name === "Pro" && <span className="pricing-recommended">RECOMMENDED</span>}</div>
              <div className="pricing-price"><strong>{billing === "monthly" ? plan.monthly : plan.annual}</strong><span>/{billing === "monthly" ? "month" : "year"}</span></div>
              <p className="pricing-credit-line">{plan.credits}</p>
              {plan.name === "Free" ? <Link className="pricing-cta" href="/sign-in?next=%2Ftraining%2Fsymm">Get started <ArrowRight size={15} /></Link> : <button className="pricing-cta" disabled title="Subscription checkout is not available yet">Billing coming soon</button>}
              <ul>{plan.features.map((feature) => <li key={feature}><Check size={15} aria-hidden="true" />{feature}</li>)}</ul>
            </article>
          ))}
        </div>
        <section className="pricing-comparison" aria-labelledby="comparison-title">
          <h2 id="comparison-title">Compare planned benefits</h2>
          <p>Preview of the launch plans. Paid benefits are not available to purchase yet.</p>
          <div className="pricing-table-scroll" tabIndex={0} role="region" aria-label="Plan comparison, scroll horizontally on small screens">
            <table>
              <caption className="sr-only">Planned Free, Pro and Premium benefits</caption>
              <thead><tr><th scope="col">Included</th>{plans.map((plan) => <th scope="col" key={plan.name}>{plan.name}</th>)}</tr></thead>
              <tbody>{comparison.map(([feature, ...values]) => <tr key={feature}><th scope="row">{feature}</th>{values.map((value, index) => <td key={index}>{value}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="pricing-credit-note">No credits for opening saved content. Annual plans are billed yearly, with credits replenished monthly. Mentorship is a group session and limited Q&A, not unlimited one-to-one coaching.</p>
        </section>
        <div className="pricing-terms">
          <h2>Before billing launches</h2>
          <p>Credit allowances, mentoring limits, tax treatment, renewal, cancellation and refund terms will be confirmed before anyone can subscribe. Existing learning paths and achievements remain yours to revisit.</p>
        </div>
      </div>
    </main>
  );
}
