"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import "@/screens/symm-showcase.css";

type Language = "cpp" | "java" | "python";
const modules = [
  ["Grid fundamentals", "Represent cells with row and column indices."],
  ["Recursion & states", "Define the answer for a single grid cell."],
  ["Memoization", "Reuse answers to overlapping subproblems."],
  ["Tabulation", "Fill states in dependency order."],
  ["Grid DP patterns", "Adapt transitions to obstacles and costs."],
  [
    "Advanced problems",
    "Extend the state when position alone is insufficient.",
  ],
] as const;
const samples: Record<Language, string> = {
  cpp: "vector<vector<long long>> dp(r, vector<long long>(c));\ndp[0][0] = 1;\nfor (int i = 0; i < r; ++i)\n  for (int j = 0; j < c; ++j) {\n    if (i) dp[i][j] += dp[i - 1][j];\n    if (j) dp[i][j] += dp[i][j - 1];\n  }",
  java: "long[][] dp = new long[rows][cols];\ndp[0][0] = 1;\nfor (int i = 0; i < rows; i++)\n  for (int j = 0; j < cols; j++) {\n    if (i > 0) dp[i][j] += dp[i - 1][j];\n    if (j > 0) dp[i][j] += dp[i][j - 1];\n  }",
  python:
    "dp = [[0] * cols for _ in range(rows)]\ndp[0][0] = 1\nfor i in range(rows):\n    for j in range(cols):\n        if i: dp[i][j] += dp[i - 1][j]\n        if j: dp[i][j] += dp[i][j - 1]",
};

export default function SymmShowcase() {
  const { user, signInWithGoogle } = useAuth();
  const [language, setLanguage] = useState<Language>("cpp");
  const [phase, setPhase] = useState<"prompt" | "roadmap">("prompt");
  const [selected, setSelected] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="symm-showcase" aria-labelledby="symm-showcase-title">
      <div className="symm-showcase-copy">
        <p className="symm-showcase-eyebrow">INTRODUCING SYMM AI</p>
        <h2 id="symm-showcase-title">
          Learn competitive programming <span>from first principles.</span>
        </h2>
        <p>Ask anything. Build understanding. Master every concept.</p>
        <div className="symm-showcase-action">
          {user ? (
            <Link href="/training/symm">
              Explore Symm AI <ArrowRight size={17} />
            </Link>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError("");
                try {
                  await signInWithGoogle("/training/symm");
                } catch {
                  setError("Sign-in could not start. Try again or use email.");
                  setPending(false);
                }
              }}
            >
              {pending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : null}{" "}
              Explore Symm AI <ArrowRight size={17} />
            </button>
          )}
          {error && (
            <p role="alert">
              {error}{" "}
              <Link href="/sign-in?next=%2Ftraining%2Fsymm">Email sign-in</Link>
            </p>
          )}
        </div>
      </div>
      <div
        className="symm-preview"
        aria-label="Interactive preview of a Symm AI learning path"
      >
        <div className="symm-preview-top">
          <span className="symm-preview-mark">✳</span>
          <span>SYMM AI</span>
          <span className="symm-preview-demo">PRODUCT PREVIEW</span>
        </div>
        <div className="symm-preview-body">
          <p className="symm-preview-label">YOUR QUESTION</p>
          <p className="symm-preview-prompt">
            Teach me Dynamic Programming on Grids.
          </p>
          <div className="symm-preview-controls">
            <div
              role="group"
              aria-label="Preview code language"
              className="symm-preview-languages"
            >
              {(["cpp", "java", "python"] as const).map((choice) => (
                <button
                  type="button"
                  key={choice}
                  aria-pressed={language === choice}
                  onClick={() => setLanguage(choice)}
                >
                  {choice === "cpp"
                    ? "C++"
                    : choice === "java"
                      ? "Java"
                      : "Python"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="symm-preview-generate"
              onClick={() => {
                setPhase(phase === "prompt" ? "roadmap" : "prompt");
                setSelected(0);
              }}
            >
              {phase === "prompt" ? "Generate learning path" : "Reset preview"}{" "}
              <ArrowRight size={14} />
            </button>
          </div>
          {phase === "roadmap" && (
            <div className="symm-preview-roadmap">
              <p className="symm-preview-label">DYNAMIC PROGRAMMING ON GRIDS</p>
              <div className="symm-preview-grid">
                <ol>
                  {modules.map(([name], index) => (
                    <li key={name}>
                      <button
                        type="button"
                        aria-current={selected === index ? "step" : undefined}
                        onClick={() => setSelected(index)}
                      >
                        <span className="symm-preview-node">
                          {selected > index ? (
                            <Check size={12} />
                          ) : (
                            String(index + 1).padStart(2, "0")
                          )}
                        </span>
                        <span>{name}</span>
                      </button>
                    </li>
                  ))}
                </ol>
                <div className="symm-preview-lesson">
                  <p>LESSON {String(selected + 1).padStart(2, "0")}</p>
                  <h3>{modules[selected][0]}</h3>
                  <span>{modules[selected][1]}</span>
                  <pre>
                    <code>{samples[language]}</code>
                  </pre>
                  <small>
                    Code sample: counting right and down paths. Open Symm AI for
                    a full lesson.
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
