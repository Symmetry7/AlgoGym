import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// shortcut: legacy files that failed lint when it was introduced (M1) get these rules as warnings.
// Delete entries as M2 removes or rewrites each file; new code must not be added here.
const legacyFiles = [
  "apps/web/server/api-handlers/study.ts",
  "apps/web/server/api-handlers/tracker.ts",
  "apps/web/server/problem-details.ts",
  "apps/web/server/providers.ts",
  "apps/web/server/study-problem.ts",
  "apps/web/server/sync-worker.ts",
  "apps/web/src/components/auth/SignInDialog.tsx",
  "apps/web/src/components/layout/Layout.tsx",
  "apps/web/src/components/layout/ThemeToggle.tsx",
  "apps/web/src/hooks/use-catalog.ts",
  "apps/web/src/lib/problem-store.ts",
  "apps/web/src/lib/tracker-types.ts",
  "apps/web/src/screens/Index.tsx",
  "apps/web/src/screens/NotFound.tsx",
  "apps/web/src/screens/Privacy.tsx",
  "apps/web/src/screens/Settings.tsx"
];

const config = [
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: "apps/web/" } } },
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
  { ignores: [".next/**", "content/**", ".worktrees/**", ".local-backups/**", "tmp/**", "output/**", "node_modules/**", "apps/web/next-env.d.ts", "apps/web/.next/**", "supabase/functions/**"] },
];

export default config;
