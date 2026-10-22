"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SymmMark } from "@/components/brand/SymmMark";
import { LivingField } from "@/components/brand/LivingField";
import "@/screens/symm-showcase.css";

type Language = "cpp" | "java" | "python";
const grid = [[1, 1, 1, 1], [1, 2, 3, 4], [1, 3, 6, 10], [1, 4, 10, 20]];
const modules = [
  ["Grid fundamentals", "Represent cells with row and column indices."],
  ["Recursion & states", "Define the answer for a single grid cell."],
  ["Memoization", "Reuse answers to overlapping subproblems."],
  ["Tabulation", "Fill states in dependency order."],
  ["Grid DP patterns", "Adapt transitions to obstacles and costs."],
  ["Advanced problems", "Extend the state when position alone is insufficient."],
] as const;
const samples: Record<Language, string> = {
  cpp: "vector<vector<long long>> dp(r, vector<long long>(c));\ndp[0][0] = 1;\nfor (int i = 0; i < r; ++i)\n  for (int j = 0; j < c; ++j) {\n    if (i) dp[i][j] += dp[i - 1][j];\n    if (j) dp[i][j] += dp[i][j - 1];\n  }",
  java: "long[][] dp = new long[rows][cols];\ndp[0][0] = 1;\nfor (int i = 0; i < rows; i++)\n  for (int j = 0; j < cols; j++) {\n    if (i > 0) dp[i][j] += dp[i - 1][j];\n    if (j > 0) dp[i][j] += dp[i][j - 1];\n  }",
  python: "dp = [[0] * cols for _ in range(rows)]\ndp[0][0] = 1\nfor i in range(rows):\n    for j in range(cols):\n        if i: dp[i][j] += dp[i - 1][j]\n        if j: dp[i][j] += dp[i][j - 1]",
};

export default function SymmShowcase() {
  const { user, signInWithGoogle } = useAuth();
  const [language, setLanguage] = useState<Language>("cpp");
  const [showPath, setShowPath] = useState(false);
  const [selected, setSelected] = useState(0);
  const [cell, setCell] = useState<[number, number]>([3, 3]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [row, column] = cell;

  return <section id="learning-preview" className="symm-showcase" aria-labelledby="symm-showcase-title">
    <LivingField intensity="showcase" />
    <div className="symm-showcase-copy">
      <div className="symm-showcase-signature"><SymmMark className="size-8 rounded-lg object-contain" /><span>SYMM AI</span></div>
      <h2 id="symm-showcase-title">Learn the idea.<br /><span>Own the solution.</span></h2>
      <p>Turn a question into a learning path built around the concepts, code, and practice that help it click.</p>
      <div className="symm-showcase-action">
        {user ? <Link href="/training/symm">Explore Symm AI <ArrowRight size={17} /></Link> :
          <button type="button" disabled={pending} onClick={async () => {
            setPending(true); setError("");
            try { await signInWithGoogle("/training/symm"); }
            catch { setError("Sign-in could not start. Try again or use email."); setPending(false); }
          }}>{pending && <LoaderCircle size={16} className="animate-spin" />}Explore Symm AI <ArrowRight size={17} /></button>}
        {error && <p role="alert">{error} <Link href="/sign-in?next=%2Ftraining%2Fsymm">Email sign-in</Link></p>}
      </div>
    </div>
    <div className="symm-preview" aria-label="Interactive preview of a Symm AI learning path">
      <div className="symm-preview-top"><SymmMark className="size-6 rounded-md object-contain" /><span>SYMM AI</span><span className="symm-preview-demo">INTERACTIVE PREVIEW</span></div>
      <div className="symm-preview-body">
        <p className="symm-preview-label">Start with a question</p>
        <p className="symm-preview-prompt">Teach me Dynamic Programming on Grids.</p>
        <div className="symm-preview-controls">
          <div role="group" aria-label="Preview code language" className="symm-preview-languages">
            {(["cpp", "java", "python"] as const).map((choice) => <button type="button" key={choice} aria-pressed={language === choice} onClick={() => setLanguage(choice)}>{choice === "cpp" ? "C++" : choice === "java" ? "Java" : "Python"}</button>)}
          </div>
          <button type="button" className="symm-preview-generate" onClick={() => { setShowPath((value) => !value); setSelected(0); }}>{showPath ? "Explore the grid" : "Preview learning path"} <ArrowRight size={15} /></button>
        </div>
        {showPath ? <div className="symm-preview-roadmap">
          <p className="symm-preview-label">A path through the concept</p>
          <div className="symm-preview-grid"><ol>{modules.map(([name], index) => <li key={name}><button type="button" aria-current={selected === index ? "step" : undefined} onClick={() => setSelected(index)}><span className="symm-preview-node">{String(index + 1).padStart(2, "0")}</span><span>{name}</span></button></li>)}</ol>
            <div className="symm-preview-lesson"><p>Lesson {String(selected + 1).padStart(2, "0")}</p><h3>{modules[selected][0]}</h3><span>{modules[selected][1]}</span><pre><code>{samples[language]}</code></pre><small>Illustrative code sample. Open Symm AI for a full lesson.</small></div></div>
        </div> : <div className="symm-grid-demonstration">
          <div className="symm-grid-copy"><p className="symm-preview-label">Interactive concept</p><h3>Every answer builds on another.</h3><p>Select a cell to see how the two earlier answers combine.</p>
            <div className="symm-grid-equation" aria-live="polite">{row === 0 && column === 0 ? <><span>Start</span><span>=</span><strong>1</strong></> : <><span>{row > 0 ? grid[row - 1][column] : 0}</span><span>+</span><span>{column > 0 ? grid[row][column - 1] : 0}</span><span>=</span><strong>{grid[row][column]}</strong></>}</div>
            <p className="symm-grid-result">Paths to row {row + 1}, column {column + 1}</p></div>
          <div className="symm-grid-stage"><div className="symm-grid-axis"><span>START</span><span>RIGHT / DOWN</span></div>
            <div className="symm-grid-cells" role="group" aria-label="Explore path counts on a four-by-four grid">{grid.flatMap((values, y) => values.map((value, x) => {
              const source = (row - 1 === y && column === x) || (row === y && column - 1 === x);
              return <button key={`${y}-${x}`} type="button" aria-pressed={row === y && column === x} aria-label={`Row ${y + 1}, column ${x + 1}: ${value} paths`} className={source ? "is-source" : ""} onClick={() => setCell([y, x])}>{value}</button>;
            }))}</div><p>Each cell adds the paths from above and left.</p></div>
        </div>}
      </div>
    </div>
  </section>;
}
