import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// shortcut: legacy files that failed lint when it was introduced (M1) get these rules as warnings.
// Delete entries as M2 removes or rewrites each file; new code must not be added here.
const legacyFiles = [
  "server/api-handlers/study.ts",
  "server/api-handlers/tracker.ts",
  "server/problem-details.ts",
  "server/providers.ts",
  "server/study-problem.ts",
  "server/sync-worker.ts",
  "src/components/auth/SignInDialog.tsx",
  "src/components/layout/Layout.tsx",
  "src/components/layout/ThemeToggle.tsx",
  "src/hooks/use-catalog.ts",
  "src/lib/problem-store.ts",
  "src/lib/tracker-types.ts",
  "src/screens/Index.tsx",
  "src/screens/NotFound.tsx",
  "src/screens/Privacy.tsx",
  "src/screens/Settings.tsx"
];

const config = [
  ...nextVitals,
  ...nextTs,
  { files: legacyFiles, rules: {
    "@next/next/no-assign-module-variable": "warn",
    "@next/next/no-html-link-for-pages": "warn",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "warn",
    "react-hooks/purity": "warn",
    "react-hooks/refs": "warn",
    "react-hooks/set-state-in-effect": "warn",
    "react/no-unescaped-entities": "warn"
  } },
  { ignores: [".next/**", ".worktrees/**", ".local-backups/**", "tmp/**", "output/**", "node_modules/**", "next-env.d.ts", "supabase/functions/**"] },
];

export default config;
