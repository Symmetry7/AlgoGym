import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// shortcut: legacy files that failed lint when it was introduced (M1) get these rules as warnings.
// Delete entries as M2 removes or rewrites each file; new code must not be added here.
const legacyFiles = [
  "server/api-handlers/contests.ts",
  "server/api-handlers/societies.ts",
  "server/api-handlers/statistics.ts",
  "server/api-handlers/study.ts",
  "server/api-handlers/symm.ts",
  "server/api-handlers/tracker.ts",
  "server/contests.ts",
  "server/next-api/statistics/contest.ts",
  "server/problem-details.ts",
  "server/providers.ts",
  "server/society-contest-sync.ts",
  "server/study-problem.ts",
  "server/symm-jobs.ts",
  "server/sync-worker.ts",
  "src/components/analytics/CodeforcesWorkspace.tsx",
  "src/components/auth/CollegeAutocomplete.tsx",
  "src/components/auth/ProfileOnboarding.tsx",
  "src/components/auth/SignInDialog.tsx",
  "src/components/auth/SocietyInvitePanel.tsx",
  "src/components/brand/HeroCubes.tsx",
  "src/components/brand/LivingField.tsx",
  "src/components/brand/SymmLaunchPreview.tsx",
  "src/components/layout/Layout.tsx",
  "src/components/layout/ThemeToggle.tsx",
  "src/components/societies/ContestManager.tsx",
  "src/components/societies/MemberComparison.tsx",
  "src/components/ui/command.tsx",
  "src/components/ui/textarea.tsx",
  "src/features/symm-ai/SymmAI.tsx",
  "src/features/symm-ai/SymmSidebar.tsx",
  "src/features/training/ThemeRounds.tsx",
  "src/features/training/Upsolve.tsx",
  "src/hooks/use-catalog.ts",
  "src/lib/problem-store.ts",
  "src/lib/tracker-types.ts",
  "src/screens/Contests.tsx",
  "src/screens/Index.tsx",
  "src/screens/NotFound.tsx",
  "src/screens/Onboarding.tsx",
  "src/screens/Privacy.tsx",
  "src/screens/Settings.tsx",
  "src/screens/SocietyContest.tsx",
  "src/screens/SocietyDetail.tsx",
  "src/screens/SocietyManage.tsx",
  "src/screens/SocietyRegistration.tsx",
  "src/screens/Workspace.tsx"
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
