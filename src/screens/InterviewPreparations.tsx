"use client";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/500.css";
import "@fontsource/lexend/600.css";
import "@fontsource/lexend/700.css";
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Activity,
  Bookmark,
  BookOpen,
  BriefcaseBusiness,
  BrainCircuit,
  Bot,
  Building2,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Cloud,
  Copy,
  Code2,
  Container,
  Cpu,
  FileText,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  LayoutList,
  Laptop,
  Layers3,
  Library,
  Mail,
  Menu,
  MessageSquare,
  MonitorPlay,
  Network,
  NotebookTabs,
  Play,
  Search,
  Server,
  Smartphone,
  Sparkles,
  ShieldCheck,
  ScanEye,
  Bug,
  Boxes,
  Workflow,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "@/hooks/use-account";
import InterviewTemplates from "./InterviewTemplates";
import { NotesLibrary, ResumeLibrary } from "./InterviewLibraries";
import patternManifest from "./interview-pattern-groups.json";
import { AlgoGymLogo } from "@/components/brand/AlgoGymLogo";
import { CodingPlatformMark, type ProviderId } from "@/components/brand/CodingPlatformMark";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./interview-preparations.css";

type Company = {
  slug: string;
  name: string;
  description: string;
  count: number;
  position: number;
};
type Question = {
  id: string;
  title: string;
  source: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  tags: string[];
  popularity: string | null;
  answerText?: string | null;
  answerCode?: string | null;
  articleUrl?: string | null;
  videoUrl?: string | null;
};
type QuestionState = {
  question_id: string;
  completed: boolean;
  bookmarked: boolean;
  updated_at?: string;
};
type Sheet = { company: Company; questions: Question[] };
type Playlist = { slug: string; group_slug: string; title: string; creator: string; source_url: string; thumbnail_url: string; count: number };
type Role = { slug: string; title: string; group_name: string; question_count: number };
type TechnicalSheetMeta = { slug: string; title: string; group_name: string; question_count: number };
const packageBands = ["3–5 LPA", "5–10 LPA", "10–20 LPA", "20–40 LPA", "40–60 LPA", "60+ LPA"] as const;
export function packageBand(question: Question): string {
  const variant = [...question.id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 2;
  return packageBands[(question.difficulty === "Hard" ? 4 : question.difficulty === "Medium" ? 2 : 0) + variant];
}
function CompanyMark({ company, large = false }: { company: Company; large?: boolean }) {
  return <span className={`ip-company-mark ${large ? "ip-large-mark" : ""}`}>
    {company.slug === "d-e-shaw" ? <span className="ip-monogram" aria-label={company.name}>D.E.</span>
      : <Image src={`/company-icons/${company.slug}.png`} alt={`${company.name} logo`} width={large ? 48 : 36} height={large ? 48 : 36} unoptimized />}
  </span>;
}
const groups = [
  {
    title: "Sheets",
    items: [
      ["dsa-sheets", "DSA Sheets"],
      ["company-wise", "Company Wise DSA"],
      ["patterns", "20 DSA Patterns"],
      ["package-wise", "Package Wise DSA"],
      ["sql", "SQL Sheet"],
      ["system-design", "System Design Sheet"],
    ],
  },
  {
    title: "Start Learning",
    items: [
      ["dsa-playlists", "DSA Playlists"],
      ["core-subjects", "Core Subjects"],
      ["system-design-playlists", "System Design Playlists"],
    ],
  },
  {
    title: "Resources",
    items: [
      ["role-wise", "Role Wise"],
      ["interview-questions", "Interview Questions"],
      ["hr-questions", "HR Questions"],
      ["cold-email-templates", "Cold Email Templates"],
      ["cool-notes", "Cool Notes"],
      ["resume-templates", "Resume Templates"],
    ],
  },
] as const;
const titles: Record<string, string> = Object.fromEntries(
  groups.flatMap((group) => group.items.map(([slug, label]) => [slug, label])),
);
const navIcons = {
  "dsa-sheets": Library,
  "company-wise": Building2,
  patterns: Network,
  "package-wise": BriefcaseBusiness,
  sql: Database,
  "system-design": LayoutList,
  "dsa-playlists": MonitorPlay,
  "core-subjects": GraduationCap,
  "system-design-playlists": Network,
  "role-wise": UserRound,
  "interview-questions": Sparkles,
  "hr-questions": MessageSquare,
  "cold-email-templates": Mail,
  "cool-notes": NotebookTabs,
  "resume-templates": FileText,
} as const;
const starterResources: Record<
  string,
  {
    description: string;
    links: Array<{ title: string; description: string; url: string }>;
  }
> = {
  "dsa-sheets": {
    description: "Pick the structure that fits today's practice.",
    links: [
      {
        title: "Company Wise DSA",
        description:
          "Browse company names and work through public foundational problems.",
        url: "/interview-preparations/company-wise",
      },
      {
        title: "20 DSA Patterns",
        description: "Select a topic before choosing the next problem.",
        url: "/interview-preparations/patterns",
      },
      {
        title: "Package Wise DSA",
        description: "Practice by difficulty with an editorial progression.",
        url: "/interview-preparations/package-wise",
      },
    ],
  },
  "dsa-playlists": {
    description: "Public lessons for building algorithm fundamentals.",
    links: [
      {
        title: "MIT Introduction to Algorithms",
        description: "University lectures on algorithm design and analysis.",
        url: "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
      },
      {
        title: "USACO Guide",
        description:
          "Topic-based practice with explanations and public problem links.",
        url: "https://usaco.guide/",
      },
      {
        title: "CP-Algorithms",
        description:
          "Topic explanations and reference implementations for classic algorithms.",
        url: "https://cp-algorithms.com/",
      },
      {
        title: "VisuAlgo",
        description: "Interactive data-structure and algorithm visualizations.",
        url: "https://visualgo.net/en",
      },
    ],
  },
  "core-subjects": {
    description: "Open learning material for core computer science subjects.",
    links: [
      {
        title: "CMU Database Systems",
        description: "Relational database fundamentals and query processing.",
        url: "https://15445.courses.cs.cmu.edu/",
      },
      {
        title: "MIT Operating Systems Engineering",
        description: "Processes, concurrency, virtual memory, and filesystems.",
        url: "https://pdos.csail.mit.edu/6.1810/",
      },
      {
        title: "MDN Web Docs",
        description: "Web platform, HTTP, JavaScript, and browser APIs.",
        url: "https://developer.mozilla.org/en-US/docs/Web",
      },
      {
        title: "Operating Systems: Three Easy Pieces",
        description:
          "An openly available textbook on virtualization, concurrency, and persistence.",
        url: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
      },
    ],
  },
  "system-design-playlists": {
    description: "Architecture lectures and openly available design guides.",
    links: [
      {
        title: "AWS Well-Architected Framework",
        description: "A structured way to reason about reliability and scale.",
        url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
      },
      {
        title: "System Design Primer",
        description: "Open-source design discussions and worked examples.",
        url: "https://github.com/donnemartin/system-design-primer",
      },
      {
        title: "Google SRE Book",
        description:
          "Production reliability, monitoring, and incident response.",
        url: "https://sre.google/sre-book/table-of-contents/",
      },
      {
        title: "Cloudflare Learning Center",
        description:
          "Accessible explanations of networking, security, and web infrastructure.",
        url: "https://www.cloudflare.com/learning/",
      },
    ],
  },
  "system-design": {
    description:
      "Start with the principles behind dependable systems, then practice explaining trade-offs.",
    links: [
      {
        title: "Design a URL shortener",
        description:
          "Sketch APIs, storage, collisions, caching, and analytics.",
        url: "https://github.com/donnemartin/system-design-primer#design-a-url-shortener",
      },
      {
        title: "Design a rate limiter",
        description: "Compare fixed window, sliding window, and token bucket.",
        url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
      },
    ],
  },
  sql: {
    description: "Practice SQL with real exercises on their source platform.",
    links: [
      {
        title: "Combine Two Tables",
        description: "Joins · Easy",
        url: "https://leetcode.com/problems/combine-two-tables/",
      },
      {
        title: "Employees Earning More Than Their Managers",
        description: "Self joins · Easy",
        url: "https://leetcode.com/problems/employees-earning-more-than-their-managers/",
      },
      {
        title: "Department Highest Salary",
        description: "Grouping and subqueries · Medium",
        url: "https://leetcode.com/problems/department-highest-salary/",
      },
    ],
  },
  "hr-questions": {
    description:
      "Practice explaining your experience clearly, with specific evidence.",
    links: [
      {
        title: "Tell me about a difficult bug you resolved",
        description: "Explain the signal, diagnosis, fix, and result.",
        url: "https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx",
      },
      {
        title: "Describe a time you disagreed with a teammate",
        description: "Focus on listening, trade-offs, and outcome.",
        url: "https://www.careeronestop.org/JobSearch/Interview/interview-tips.aspx",
      },
    ],
  },
  "cold-email-templates": {
    description:
      "Original, editable outreach structures. Personalize before sending.",
    links: [
      {
        title: "Referral request",
        description:
          "Subject: Question about [team] at [company]. Introduce one relevant project, explain why the team fits, and ask a specific, easy-to-answer question.",
        url: "https://www.careeronestop.org/JobSearch/Network/networking.aspx",
      },
      {
        title: "Alumni introduction",
        description:
          "Mention your shared connection, one concrete question about their work, and your availability for a short conversation.",
        url: "https://www.careeronestop.org/JobSearch/Network/networking.aspx",
      },
    ],
  },
  "cool-notes": {
    description: "Practical notes and references for quick review.",
    links: [
      {
        title: "Big-O Cheat Sheet",
        description:
          "Compare the complexity of common data structures and algorithms.",
        url: "https://www.bigocheatsheet.com/",
      },
      {
        title: "MySQL Tutorial",
        description: "Official SQL syntax and examples.",
        url: "https://dev.mysql.com/doc/refman/8.4/en/tutorial.html",
      },
      {
        title: "React Learn",
        description:
          "Official notes on components, state, effects, and data flow.",
        url: "https://react.dev/learn",
      },
      {
        title: "Docker Get Started",
        description: "Containers, images, builds, and local workflows.",
        url: "https://docs.docker.com/get-started/",
      },
      {
        title: "OWASP Cheat Sheet Series",
        description:
          "Concise security reference for common web application risks.",
        url: "https://cheatsheetseries.owasp.org/",
      },
      {
        title: "USACO Guide",
        description: "Algorithms and competitive-programming review by topic.",
        url: "https://usaco.guide/",
      },
    ],
  },
  "resume-templates": {
    description: "Open templates and practical guidance for technical resumes.",
    links: [
      {
        title: "Overleaf resume gallery",
        description: "Choose a template and tailor each bullet to an outcome.",
        url: "https://www.overleaf.com/gallery/tagged/cv",
      },
      {
        title: "CareerOneStop resume guide",
        description:
          "Content-first advice for clear, specific experience bullets.",
        url: "https://www.careeronestop.org/JobSearch/Resumes/resumes.aspx",
      },
      {
        title: "Purdue OWL resume workshop",
        description: "Examples and writing guidance for clear resume sections.",
        url: "https://owl.purdue.edu/owl/job_search_writing/resumes_and_vitas/index.html",
      },
    ],
  },
  "role-wise": {
    description: "Choose a role and build a focused practice plan.",
    links: [
      {
        title: "Software engineer",
        description: "Algorithms, data structures, debugging, and design.",
        url: "/interview-preparations/company-wise",
      },
      {
        title: "Data engineer",
        description: "SQL fundamentals and system design.",
        url: "/interview-preparations/sql",
      },
      {
        title: "Frontend developer",
        description:
          "Web fundamentals, JavaScript, and product-facing trade-offs.",
        url: "/interview-preparations/interview-questions",
      },
      {
        title: "Backend developer",
        description: "APIs, databases, reliability, and data structures.",
        url: "/interview-preparations/system-design",
      },
      {
        title: "Systems engineer",
        description: "Architecture, storage, queues, and failure analysis.",
        url: "/interview-preparations/system-design",
      },
      {
        title: "Competitive programmer",
        description: "Pattern recognition and deliberate algorithm practice.",
        url: "/interview-preparations/patterns",
      },
    ],
  },
  "interview-questions": {
    description:
      "Start with public programming exercises and practice explaining your decisions.",
    links: [
      {
        title: "Company Wise DSA",
        description: "A compact foundation of public coding questions.",
        url: "/interview-preparations/company-wise",
      },
      {
        title: "20 DSA Patterns",
        description: "Navigate practice by algorithmic pattern.",
        url: "/interview-preparations/patterns",
      },
    ],
  },
};

export function filterQuestions(
  questions: Question[],
  states: Map<string, QuestionState>,
  difficulty: string,
  popularity: string,
  bookmarked: boolean,
) {
  return questions.filter(
    (question) =>
      (!difficulty || question.difficulty === difficulty) &&
      (!popularity || question.popularity === popularity) &&
      (!bookmarked || states.get(question.id)?.bookmarked),
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const role = useQuery({
    queryKey: ["interview-role", user?.id],
    queryFn: () => jsonRequest<{ admin: boolean }>("/api/interview?mode=role"),
    staleTime: 300000,
    enabled: !!user,
  });
  return (
    <div className="ip-shell">
      <aside
        className={`ip-sidebar ${open ? "ip-sidebar-open" : ""}`}
        aria-label="Interview preparation navigation"
      >
        <div className="ip-brand">
          <Link href="/dashboard" aria-label="AlgoGym dashboard" className="ip-brand-logo"><AlgoGymLogo className="w-[124px]" /></Link>
          <button
            className="ip-mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <nav>
          <Link
            prefetch={false}
            href="/interview-preparations"
            className={
              pathname === "/interview-preparations" ? "ip-active" : ""
            }
            onClick={() => setOpen(false)}
          >
            <BookOpen size={16} /> Overview
          </Link>
          {groups.map((group) => (
            <div className="ip-nav-group" key={group.title}>
              <p>{group.title}</p>
              {group.items.map(([slug, label]) => {
                const Icon = navIcons[slug];
                return (
                  <Link
                    prefetch={false}
                    key={slug}
                    href={`/interview-preparations/${slug}`}
                    className={
                      pathname === `/interview-preparations/${slug}` ||
                      pathname.startsWith(`/interview-preparations/${slug}/`)
                        ? "ip-active"
                        : ""
                    }
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={16} strokeWidth={1.8} aria-hidden="true" />{" "}
                    {label}
                  </Link>
                );
              })}
            </div>
          ))}
          <div className="ip-nav-group">
            <p>Your space</p>
            <Link
              prefetch={false}
              href="/interview-preparations/progress"
              className={
                pathname === "/interview-preparations/progress"
                  ? "ip-active"
                  : ""
              }
              onClick={() => setOpen(false)}
            >
              My Progress
            </Link>
            {role.data?.admin && (
              <Link
                prefetch={false}
                href="/interview-preparations/admin"
                className={
                  pathname === "/interview-preparations/admin"
                    ? "ip-active"
                    : ""
                }
                onClick={() => setOpen(false)}
              >
                Manage content
              </Link>
            )}
            <Link href="/dashboard">
              Back to AlgoGym <ArrowUpRight size={14} />
            </Link>
          </div>
        </nav>
      </aside>
      {open && (
        <button
          className="ip-overlay"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="ip-content">
        <header className="ip-topbar">
          <button
            className="ip-menu"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <Link href="/dashboard" aria-label="AlgoGym dashboard" className="ip-mobile-brand"><AlgoGymLogo className="w-[92px]" /></Link>
          <span className="ip-topbar-location"><Link href="/interview-preparations">Preparation</Link><ChevronRight size={14} />{pathname.includes("company-wise") ? "Company Wise DSA" : "Interview Preparations"}</span>
          <div className="ip-topbar-actions"><Link href="/interview-preparations/progress">My progress</Link><Link href="/dashboard">Back to dashboard <ArrowUpRight size={14} /></Link></div>
        </header>
        <main className="ip-main">{children}</main>
      </div>
    </div>
  );
}

function Directory() {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["interview-directory"],
    queryFn: () =>
      jsonRequest<{ companies: Company[] }>("/api/interview?mode=directory"),
    staleTime: 60000,
  });
  const companies = useMemo(
    () =>
      (query.data?.companies ?? []).filter((company) =>
        company.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [query.data, search],
  );
  return (
    <div className="ip-directory">
      <div className="ip-page-heading">
        <h1>Company Wise DSA Sheet</h1>
        <p>
          Build interview fluency with public practice problems, organized by
          company.
        </p>
      </div>
      <div className="ip-search">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search companies (e.g., Google, Amazon, Flipkart...)"
          aria-label="Search companies"
        />
      </div>
      {query.isLoading ? (
        <p className="ip-feedback">Loading companies…</p>
      ) : query.error ? (
        <p className="ip-feedback ip-error">{query.error.message}</p>
      ) : companies.length ? (
        <div className="ip-company-grid">
          {companies.map((company) => (
            <Link
              prefetch={false}
              className="ip-company-card"
              href={`/interview-preparations/company-wise/${company.slug}`}
              key={company.slug}
            >
              <div className="ip-company-head">
                <CompanyMark company={company} />
                <strong>{company.name}</strong>
              </div>
              <p>{company.description}</p>
              <div className="ip-company-foot">
                <span>
                  <LayoutList size={14} aria-hidden="true" /> {company.count}{" "}
                  Questions
                </span>
                <ChevronRight size={16} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="ip-empty">
          No companies match “{search}”. Try another name.
        </div>
      )}
    </div>
  );
}

function useQuestionState() {
  const { user, signInWithGoogle } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["interview-state", user?.id],
    queryFn: () =>
      jsonRequest<{ state: QuestionState[] }>("/api/interview?mode=state"),
    staleTime: 20000,
  });
  const states = useMemo(
    () =>
      new Map(
        (query.data?.state ?? []).map((entry) => [entry.question_id, entry]),
      ),
    [query.data],
  );
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const toggle = async (
    questionId: string,
    field: "completed" | "bookmarked",
  ) => {
    if (!user) {
      await signInWithGoogle(window.location.pathname);
      return;
    }
    const current = states.get(questionId) ?? {
      question_id: questionId,
      completed: false,
      bookmarked: false,
    };
    const next = { ...current, [field]: !current[field], updated_at: new Date().toISOString() };
    setSaving(questionId);
    setError("");
    client.setQueryData(
      ["interview-state", user.id],
      (old: { state: QuestionState[] } | undefined) => ({
        state: [
          ...(old?.state ?? []).filter(
            (entry) => entry.question_id !== questionId,
          ),
          next,
        ],
      }),
    );
    try {
      await jsonRequest("/api/interview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          completed: next.completed,
          bookmarked: next.bookmarked,
        }),
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save progress.",
      );
      await client.invalidateQueries({
        queryKey: ["interview-state", user.id],
      });
    } finally {
      setSaving("");
    }
  };
  return { states, toggle, saving, error, user };
}

function QuestionTable({
  questions,
  states,
  onToggle,
  saving,
  showPopularity = true,
  showDifficulty = true,
  hideLinks = false,
  questionLabel = "Problem",
  packageFor,
}: {
  questions: Question[];
  states: Map<string, QuestionState>;
  onToggle: (id: string, field: "completed" | "bookmarked") => void;
  saving: string;
  showPopularity?: boolean;
  showDifficulty?: boolean;
  hideLinks?: boolean;
  questionLabel?: string;
  packageFor?: (question: Question) => string;
}) {
  if (!questions.length)
    return (
      <div className="ip-empty">No questions match the selected filters.</div>
    );
  return (
    <div className="ip-table-wrap">
      <p className="ip-scroll-hint">
        Swipe the table to see topics, difficulty, and saved status.
      </p>
      <div className="ip-table-scroll">
        <table className="ip-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>{questionLabel}</th>
              <th>Tags</th>
              {!hideLinks && <th>Link</th>}
              {packageFor && <th>Package</th>}
              {showDifficulty && <th>Difficulty</th>}
              {showPopularity && <th>Popularity</th>}
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question, index) => (
              <tr key={`${question.id}-${index}`}>
                <td>
                  <button
                    type="button"
                    disabled={saving === question.id}
                    className={`ip-check ${states.get(question.id)?.completed ? "ip-checked" : ""}`}
                    aria-label={`${states.get(question.id)?.completed ? "Mark incomplete" : "Mark complete"}: ${question.title}`}
                    aria-pressed={Boolean(states.get(question.id)?.completed)}
                    onClick={() => onToggle(question.id, "completed")}
                  >
                    {states.get(question.id)?.completed && (
                      <Check size={14} strokeWidth={3} />
                    )}
                  </button>
                </td>
                <td>
                  <span className="ip-number">{index + 1}.</span>
                  {!question.url || ["General interview guide", "Role prompt", "SQL practice"].includes(question.source) ? (
                    <span>{question.title}</span>
                  ) : (
                    <a href={question.url} target="_blank" rel="noopener noreferrer">
                      {question.title}
                    </a>
                  )}
                </td>
                <td>
                  <div className="ip-tags">
                    {question.tags.slice(0, 2).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </td>
                {!hideLinks && <td>
                  {question.url ? <a
                    className="ip-source"
                    href={question.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={["General interview guide", "Role prompt", "SQL practice"].includes(question.source) ? `Open ${question.source} reference` : `Open ${question.title} on ${question.source}`}
                  >
                    {(["leetcode", "geeksforgeeks", "codeforces"] as ProviderId[]).includes(question.source.toLowerCase() as ProviderId)
                      ? <CodingPlatformMark platform={question.source.toLowerCase() as ProviderId} className="ip-source-mark" />
                      : <span className="ip-source-name">{question.source === "General interview guide" ? "Guide ↗" : question.source === "Role prompt" ? "Source sheet ↗" : question.source === "SQL practice" ? "Topic guide ↗" : question.source}</span>}
                  </a> : <span className="ip-muted">—</span>}
                </td>}
                {packageFor && <td><span className="ip-package-badge">{packageFor(question)}</span></td>}
                {showDifficulty && <td>
                  <span
                    className={`ip-difficulty ip-${(question.difficulty ?? "").toLowerCase()}`}
                  >
                    {question.difficulty ?? "—"}
                  </span>
                </td>}
                {showPopularity && (
                  <td>
                    {question.popularity ? (
                      <span>{question.popularity}</span>
                    ) : (
                      <span className="ip-muted">—</span>
                    )}
                  </td>
                )}
                <td>
                  <button
                    type="button"
                    disabled={saving === question.id}
                    className={`ip-bookmark ${states.get(question.id)?.bookmarked ? "ip-bookmarked" : ""}`}
                    aria-label={`${states.get(question.id)?.bookmarked ? "Remove bookmark" : "Bookmark"}: ${question.title}`}
                    aria-pressed={Boolean(states.get(question.id)?.bookmarked)}
                    onClick={() => onToggle(question.id, "bookmarked")}
                  >
                    <Bookmark
                      size={18}
                      fill={
                        states.get(question.id)?.bookmarked
                          ? "currentColor"
                          : "none"
                      }
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompanySheet({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["interview-sheet", slug],
    queryFn: () =>
      jsonRequest<Sheet>(
        `/api/interview?mode=sheet&company=${encodeURIComponent(slug)}`,
      ),
    staleTime: 60000,
  });
  const { states, toggle, saving, error } = useQuestionState();
  const [expanded, setExpanded] = useState(false);
  const [difficulty, setDifficulty] = useState("");
  const [popularity, setPopularity] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const questions = query.data?.questions ?? [];
  const visible = filterQuestions(
    questions,
    states,
    difficulty,
    popularity,
    bookmarked,
  );
  const completed = questions.filter(
    (question) => states.get(question.id)?.completed,
  ).length;
  const percent = questions.length
    ? Math.round((100 * completed) / questions.length)
    : 0;
  if (query.isLoading)
    return <p className="ip-feedback">Loading preparation sheet…</p>;
  if (query.error)
    return <p className="ip-feedback ip-error">{query.error.message}</p>;
  const company = query.data!.company;
  const description =
    company.description.length < 160
      ? `${company.description} Work through the foundations first, then revisit problems you found difficult. Each question links to its public source; your completion and bookmarks are saved to your AlgoGym account and shared across sheets.`
      : company.description;
  return (
    <>
      <div className="ip-crumb">
        <Link href="/interview-preparations/company-wise">
          Company Wise DSA
        </Link>
        <ChevronRight size={13} />
        {company.name}
      </div>
      <div className="ip-sheet-heading">
        <CompanyMark company={company} large />
        <div>
          <h1>{company.name} DSA Interview Questions</h1>
          <p>
            Practice foundational problems and keep your progress in one place.
          </p>
        </div>
      </div>
      <div className="ip-description">
        <p>
          {expanded ? description : description.slice(0, 170)}
          {!expanded && description.length > 170 ? "…" : ""}
        </p>
        {description.length > 170 && (
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? "Read Less" : "Read More"}
            <ChevronDown size={14} />
          </button>
        )}
      </div>
      <p className="ip-count">{questions.length} Problems</p>
      <p className="ip-provenance">AlgoGym editorial practice track · Company-specific interview frequency has not been verified.</p>
      <div className="ip-sheet-tools">
        <div
          className="ip-progress"
          aria-label={`${completed} of ${questions.length} completed`}
        >
          <span
            className="ip-progress-ring"
            style={{ "--progress": `${percent}%` } as React.CSSProperties}
          >
            {percent}%
          </span>
          <div>
            <strong>Overall Progress</strong>
            <small>
              {completed}/{questions.length}
            </small>
          </div>
        </div>
        <div className="ip-filters">
          <button
            className={
              !difficulty && !popularity && !bookmarked ? "ip-selected" : ""
            }
            onClick={() => {
              setDifficulty("");
              setPopularity("");
              setBookmarked(false);
            }}
          >
            All
          </button>
          <label>
            <span className="sr-only">Difficulty</span>
            <select
              aria-label="Difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option value="">Difficulty</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>
          {questions.some((question) => question.popularity) && (
            <label>
              <span className="sr-only">Popularity</span>
              <select
                aria-label="Popularity"
                value={popularity}
                onChange={(event) => setPopularity(event.target.value)}
              >
                <option value="">Popularity</option>
                <option>Very Hot</option>
                <option>Hot</option>
                <option>Warm</option>
                <option>Cold</option>
              </select>
            </label>
          )}
          <button
            className={bookmarked ? "ip-selected" : ""}
            onClick={() => setBookmarked(!bookmarked)}
          >
            Bookmarked
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="ip-error">
          {error}
        </p>
      )}
      <QuestionTable
        questions={visible}
        states={states}
        onToggle={toggle}
        saving={saving}
        showPopularity={questions.some((question) => Boolean(question.popularity))}
      />
      <p className="ip-disclosure">
        AlgoGym starter questions are public practice exercises.
        Company-specific interview frequency and popularity are not verified.
        Completion is self-reported.
      </p>
    </>
  );
}

function Progress() {
  const { states, toggle, saving, error, user } = useQuestionState();
  const { signInWithGoogle } = useAuth();
  const catalog = useQuery({queryKey:["interview-progress",user?.id],queryFn:()=>jsonRequest<{questions:Question[]}>("/api/interview?mode=progress"),enabled:!!user});
  const questions = catalog.data?.questions ?? [];
  const byId = new Map(questions.map(question=>[question.id,question]));
  const tracked = [...states.values()].filter(item=>item.completed||item.bookmarked);
  const completed = tracked.filter(item=>item.completed).length;
  const saved = questions.filter(question=>states.get(question.id)?.bookmarked);
  const unfinished = saved.filter(question=>!states.get(question.id)?.completed);
  const difficultyCounts = ["Easy","Medium","Hard","Unrated"].map(label=>({label,count:tracked.filter(item=>item.completed&&(byId.get(item.question_id)?.difficulty??"Unrated")===label).length}));
  const highest = Math.max(1,...difficultyCounts.map(item=>item.count));
  const today = new Date();
  const dayKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const week = Array.from({length:7},(_,index)=>{const date=new Date(today.getFullYear(),today.getMonth(),today.getDate()-(6-index));const key=dayKey(date);return {label:date.toLocaleDateString("en",{weekday:"short"}),count:tracked.filter(item=>item.updated_at&&dayKey(new Date(item.updated_at))===key).length}});
  const weekMax=Math.max(1,...week.map(day=>day.count));
  const recent=tracked.filter(item=>item.updated_at&&byId.has(item.question_id)).sort((a,b)=>(b.updated_at??"").localeCompare(a.updated_at??"")).slice(0,5);
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> My Progress
      </div>
      <div className="ip-page-heading">
        <h1>My Progress</h1>
        <p>Your saved work follows each question across sheets. Use the evidence below to choose what to revisit next.</p>
      </div>
      {!user&&<div className="ip-progress-signin"><div><h2>Your preparation, in one place</h2><p>Sign in to see your completed questions, bookmarks, and recent study activity across every sheet.</p></div><button type="button" onClick={()=>void signInWithGoogle("/interview-preparations/progress")}>Sign in to view progress <ChevronRight size={16}/></button></div>}
      {catalog.isLoading&&user?<p className="ip-feedback">Loading your preparation…</p>:catalog.error?<p role="alert" className="ip-error">{catalog.error.message}</p>:user&&<>
        <div className="ip-progress-summary ip-progress-ledger"><div><strong>{completed}</strong><span>Questions completed</span></div><div><strong>{saved.length}</strong><span>Bookmarked</span></div><div><strong>{unfinished.length}</strong><span>To revisit</span></div><div><strong>{week.reduce((sum,day)=>sum+day.count,0)}</strong><span>Updated this week</span></div></div>
        <div className="ip-progress-panels"><section className="ip-progress-panel"><div className="ip-progress-panel-heading"><h2>Difficulty breakdown</h2><span>Completed questions</span></div><div className="ip-track-bars">{difficultyCounts.map(item=><div key={item.label}><span>{item.label}</span><div><i style={{width:`${item.count/highest*100}%`}}/></div><strong>{item.count}</strong></div>)}</div></section><section className="ip-progress-panel"><div className="ip-progress-panel-heading"><h2>Recent study</h2><span>Last saved change to each question</span></div><div className="ip-week-bars">{week.map((day,index)=><div key={index}><span className="ip-week-bar" style={{height:`${Math.max(4,day.count/weekMax*100)}%`}} title={`${day.count} updated questions`}/><small>{day.label}</small></div>)}</div><p className="ip-progress-explain">Changes shown here are saved-state updates, not verified solve dates.</p></section></div>
        <div className="ip-progress-next"><div><h2>Keep your momentum</h2><p>{unfinished.length?`You have ${unfinished.length} bookmarked question${unfinished.length===1?"":"s"} waiting for another pass.`:"Pick a topic, save useful questions, and return to them here."}</p></div><SymmPrepLink topic="Create a focused interview preparation learning path" label="Plan with SYMM AI"/></div>
        {recent.length>0&&<section className="ip-recent-work"><h2>Recently touched</h2>{recent.map(item=><div key={item.question_id}><span>{item.completed?"Completed":"Bookmarked"}</span><strong>{byId.get(item.question_id)?.title}</strong><time dateTime={item.updated_at}>{new Date(item.updated_at!).toLocaleDateString()}</time></div>)}</section>}
        <h2>Bookmarked questions</h2>
      </>}
      {error && (
        <p role="alert" className="ip-error">
          {error}
        </p>
      )}
      {user&&!catalog.isLoading&&!catalog.error&&<QuestionTable
        questions={saved}
        states={states}
        onToggle={toggle}
        saving={saving}
        showPopularity={false}
      />}
    </>
  );
}

const playlistGroups = ["dsa-playlists", "core-subjects", "system-design-playlists"];
const roleIcons = {
  "frontend-developer": Code2, "backend-developer": Server,
  "fullstack-developer": Layers3, "mobile-developer": Smartphone,
  "game-developer": Gamepad2, "web3-developer": Boxes,
  "embedded-systems-engineer": Cpu, "data-analyst": ChartNoAxesCombined,
  "data-engineer": Database, "data-scientist": FlaskConical,
  "ai-engineer": Bot, "ai-research-engineer": BrainCircuit,
  "llm-genai-engineer": Sparkles, "mlops-engineer": Workflow,
  "devops-engineer": Container, "cloud-engineer": Cloud,
  "site-reliability-engineer": Activity, "cloud-security-engineer": ShieldCheck,
  "cybersecurity-analyst": ScanEye, "qa-sdet-engineer": Bug,
} as const;

function RoleMark({role,large=false}:{role:Role;large?:boolean}) {
  const Icon=roleIcons[role.slug as keyof typeof roleIcons]??BriefcaseBusiness;
  const group=role.group_name.toLowerCase().replace(/[^a-z]+/g,"-");
  return <span className={`ip-role-mark ip-role-mark-${group}${large?" ip-role-mark-large":""}`} aria-hidden="true"><Icon size={large?29:23} strokeWidth={1.8}/></span>;
}

function DifficultySelect({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <Select value={value||"all"} onValueChange={(next)=>onChange(next==="all"?"":next)}><SelectTrigger className="ip-difficulty-select" aria-label="Filter by difficulty"><SelectValue/></SelectTrigger><SelectContent className="ip-difficulty-menu" position="popper"><SelectItem value="all">All difficulties</SelectItem><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent></Select>;
}

function PlaylistDirectory({ group }: { group: string }) {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["interview-playlists", group],
    queryFn: () => jsonRequest<{ playlists: Playlist[] }>(`/api/interview?mode=playlists&group=${group}`),
  });
  const playlists = (query.data?.playlists ?? []).filter((item) =>
    `${item.title} ${item.creator}`.toLowerCase().includes(search.toLowerCase()),
  );
  const sections = group === "core-subjects"
    ? [["dbms-playlists", "Database Systems"], ["os-playlists", "Operating Systems"], ["oops-playlists", "Object-Oriented Programming"]]
    : [[group, ""]];
  return <>
    <div className="ip-crumb">Preparation <ChevronRight size={13} /> {titles[group]}</div>
    <div className="ip-page-heading"><h1>{titles[group]}</h1><p>Follow real lessons in order, then save your progress as you learn.</p></div>
    <div className="ip-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search playlists or educators..." aria-label="Search playlists" /></div>
    {query.isLoading ? <p className="ip-feedback">Loading playlists…</p> : query.error ? <p role="alert" className="ip-error">{query.error.message}</p> :
      sections.map(([sectionSlug, sectionTitle]) => {
        const items = playlists.filter((item) => item.group_slug === sectionSlug);
        return items.length ? <section className="ip-playlist-section" key={sectionSlug}>{sectionTitle && <h2>{sectionTitle}</h2>}<div className="ip-playlist-grid">{items.map((item) => <Link className="ip-playlist-card" key={item.slug} href={`/interview-preparations/${group}/${item.slug}`}>
        <span className="ip-playlist-image"><img src={`/interview-playlist-thumbnails/${item.slug}.jpg`} alt="" loading="lazy" /><span className="ip-playlist-play"><MonitorPlay size={22} /></span></span>
        <span className="ip-playlist-meta">{item.creator} <span>· {item.count} lessons</span></span>
        <strong>{item.title}</strong><span className="ip-playlist-action">View playlist <ArrowUpRight size={15} /></span>
      </Link>)}</div></section> : null;
      })}
    {!query.isLoading && !query.error && !playlists.length && <p className="ip-empty">No playlists match your search.</p>}
  </>;
}

function PlaylistDetail({ group, slug }: { group: string; slug: string }) {
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["interview-playlist", slug],
    queryFn: () => jsonRequest<{ playlist: Playlist; videos: Array<Pick<Question, "id" | "title" | "url"> > }>(`/api/interview?mode=playlist&playlist=${encodeURIComponent(slug)}`),
  });
  const { states, toggle, saving, error } = useQuestionState();
  const playlist = query.data?.playlist;
  const videos = query.data?.videos ?? [];
  const visible = videos.filter((video) => video.title.toLowerCase().includes(search.toLowerCase()));
  const completed = videos.filter((video) => states.get(video.id)?.completed).length;
  return <>
    <div className="ip-crumb"><Link href={`/interview-preparations/${group}`}>{titles[group]}</Link><ChevronRight size={13} /> {playlist?.title ?? "Playlist"}</div>
    {query.isLoading ? <p className="ip-feedback">Loading lessons…</p> : query.error ? <p role="alert" className="ip-error">{query.error.message}</p> : playlist && <>
      <div className="ip-playlist-head"><img src={`/interview-playlist-thumbnails/${playlist.slug}.jpg`} alt="" /><div><span className="ip-eyebrow">{playlist.creator} · video series</span><h1>{playlist.title}</h1><p>{completed} of {videos.length} lessons completed</p>{playlist.source_url && <a href={playlist.source_url} target="_blank" rel="noopener noreferrer">Original collection <ArrowUpRight size={15} /></a>}</div></div>
      <div className="ip-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a lesson..." aria-label="Search lessons" /></div>
      <div className="ip-lesson-list">{visible.map((video, index) => <div className="ip-lesson" key={`${video.id}-${index}`}>
        <button type="button" className={`ip-check ${states.get(video.id)?.completed ? "ip-checked" : ""}`} aria-label={`${states.get(video.id)?.completed ? "Mark incomplete" : "Mark complete"}: ${video.title}`} aria-pressed={Boolean(states.get(video.id)?.completed)} disabled={saving === video.id} onClick={() => toggle(video.id, "completed")}>{states.get(video.id)?.completed && <Check size={14} strokeWidth={3} />}</button>
        <span className="ip-lesson-number">{videos.indexOf(video) + 1}</span><a href={video.url} target="_blank" rel="noopener noreferrer">{video.title}<ArrowUpRight size={14} /></a>
      </div>)}</div>
      {!visible.length && <p className="ip-empty">No lessons match your search.</p>}
      {error && <p role="alert" className="ip-error">{error}</p>}
    </>}
  </>;
}

function RoleDirectory() {
  const [search, setSearch] = useState("");
  const query = useQuery({queryKey: ["interview-roles"], queryFn: () => jsonRequest<{ roles: Role[] }>("/api/interview?mode=roles")});
  const roles = (query.data?.roles ?? []).filter((role) => `${role.title} ${role.group_name}`.toLowerCase().includes(search.toLowerCase()));
  const groupNames = [...new Set(roles.map((role) => role.group_name))];
  return <>
    <div className="ip-crumb">Preparation <ChevronRight size={13} /> Role Wise</div>
    <div className="ip-page-heading"><h1>Role Wise Preparation</h1><p>Focused interview questions for the role you are working toward.</p></div>
    <div className="ip-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles..." aria-label="Search roles" /></div>
    {query.isLoading ? <p className="ip-feedback">Loading roles…</p> : query.error ? <p role="alert" className="ip-error">{query.error.message}</p> : groupNames.map((group) => {
      return <section className="ip-role-group" key={group}><h2>{group}</h2><div className="ip-role-grid">{roles.filter((role) => role.group_name === group).map((role) => <Link href={`/interview-preparations/role-wise/${role.slug}`} className="ip-role-card" key={role.slug}>
        <RoleMark role={role}/><span><strong>{role.title}</strong><small>{role.question_count} questions</small></span><ChevronRight size={17} />
      </Link>)}</div></section>;
    })}
    {!query.isLoading && !query.error && !roles.length && <p className="ip-empty">No roles match your search.</p>}
  </>;
}

function RoleSheet({ slug }: { slug: string }) {
  const query = useQuery({queryKey: ["interview-role", slug], queryFn: () => jsonRequest<{ role: Role; questions: Question[] }>(`/api/interview?mode=roleSheet&role=${encodeURIComponent(slug)}`)});
  const { states, toggle, saving, error } = useQuestionState();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [page, setPage] = useState(0);
  const [openId,setOpenId]=useState<string|null>(null);
  const questions = query.data?.questions ?? [];
  const visible = questions.filter((question) =>
    (!search || question.title.toLowerCase().includes(search.toLowerCase())) &&
    (!difficulty || question.difficulty === difficulty) &&
    (!bookmarked || states.get(question.id)?.bookmarked),
  );
  const pages = Math.ceil(visible.length / 50);
  const currentPage = Math.min(page, Math.max(0, pages - 1));
  const completed = questions.filter((question) => states.get(question.id)?.completed).length;
  return <>
    <div className="ip-crumb"><Link href="/interview-preparations/role-wise">Role Wise</Link><ChevronRight size={13} /> {query.data?.role.title ?? "Role"}</div>
    {query.isLoading ? <p className="ip-feedback">Loading role questions…</p> : query.error ? <p role="alert" className="ip-error">{query.error.message}</p> : <>
      <div className="ip-page-heading ip-role-sheet-heading">{query.data?.role&&<RoleMark role={query.data.role} large/>}<div><span className="ip-eyebrow">{query.data?.role.group_name}</span><h1>{query.data?.role.title}</h1><p>{completed} of {questions.length} questions completed</p></div></div>
      <div className="ip-role-controls"><div className="ip-search"><Search size={18} /><input type="search" value={search} onChange={(event) => {setSearch(event.target.value); setPage(0);}} placeholder="Search questions..." aria-label="Search role questions" /></div><DifficultySelect value={difficulty} onChange={(next)=>{setDifficulty(next);setPage(0);setOpenId(null);}}/><button type="button" className={bookmarked ? "ip-selected" : ""} onClick={() => {setBookmarked(!bookmarked); setPage(0);}}>Bookmarked</button></div>
      <p className="ip-count">{visible.length} questions</p>
      <div className="ip-answer-list">{visible.slice(currentPage * 50, (currentPage + 1) * 50).map((question,index)=>{const expanded=openId===question.id;return <article className={`ip-answer-item ${expanded?"ip-answer-open":""}`} key={question.id}><div className="ip-answer-head"><button type="button" className={`ip-check ${states.get(question.id)?.completed?"ip-checked":""}`} disabled={saving===question.id} aria-label={`${states.get(question.id)?.completed?"Mark incomplete":"Mark complete"}: ${question.title}`} aria-pressed={Boolean(states.get(question.id)?.completed)} onClick={()=>toggle(question.id,"completed")}>{states.get(question.id)?.completed&&<Check size={14}/>}</button><button type="button" className="ip-answer-toggle" aria-expanded={expanded} aria-controls={`ip-role-answer-${question.id}`} onClick={()=>setOpenId(expanded?null:question.id)}><span className="ip-answer-label"><small>{String(currentPage*50+index+1).padStart(2,"0")}</small><strong>{question.title}</strong></span><ChevronDown size={18} className="ip-answer-chevron"/></button>{question.difficulty&&<span className={`ip-difficulty ip-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>}<button type="button" className={`ip-save-button ${states.get(question.id)?.bookmarked?"ip-saved":""}`} disabled={saving===question.id} aria-label={`${states.get(question.id)?.bookmarked?"Remove bookmark":"Bookmark"}: ${question.title}`} aria-pressed={Boolean(states.get(question.id)?.bookmarked)} onClick={()=>toggle(question.id,"bookmarked")}><Bookmark size={17} fill={states.get(question.id)?.bookmarked?"currentColor":"none"}/></button></div>{expanded&&query.data?.role&&<div id={`ip-role-answer-${question.id}`}><InterviewAnswer question={question} subject={query.data.role} kind="role"/></div>}</article>})}</div>
      {!visible.length&&<p className="ip-empty">No role questions match these filters.</p>}
      {pages > 1 && <div className="ip-pagination"><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage + 1} of {pages}</span><button disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
      {error && <p role="alert" className="ip-error">{error}</p>}
    </>}
  </>;
}

const technicalIcons: Record<string, typeof BookOpen> = {
  "dbms-questions": Database, "os-questions": Cpu, "oops-questions": Boxes,
  "cn-questions": Network, "javascript-questions": Code2,
  "typescript-questions": Code2, "reactjs-questions": Layers3,
  "nodejs-questions": Server, "nextjs-questions": Laptop,
  "git-github-questions": Workflow, "spring-boot-questions": Server,
  "angular-questions": Code2, "cpp-questions": Code2,
  "java-questions": Code2, "python-questions": Code2,
  "rust-questions": Cpu, "go-questions": Code2,
  "react-native-questions": Smartphone, "swift-questions": Smartphone,
  "flutter-questions": Smartphone, "android-questions": Smartphone,
  "aws-questions": Cloud, "docker-questions": Container,
  "kuberneties-questions": Boxes, "terraform-questions": Workflow,
  "postgresql-questions": Database, "mongodb-questions": Database,
  "redis-questions": Database,
};

function SymmPrepLink({ topic, label = "Build a learning path with SYMM AI" }: { topic: string; label?: string }) {
  return <Link className="ip-symm-link" href={`/training/symm?topic=${encodeURIComponent(topic.slice(0, 180))}`}><Sparkles size={17} /> <span>{label}</span><ArrowUpRight size={15} /></Link>;
}

function TechnicalDirectory() {
  const [search, setSearch] = useState("");
  const query = useQuery({ queryKey: ["interview-technical-directory"], queryFn: () => jsonRequest<{sheets:TechnicalSheetMeta[]}>("/api/interview?mode=technicalDirectory") });
  const sheets = (query.data?.sheets ?? []).filter(sheet => `${sheet.title} ${sheet.group_name}`.toLowerCase().includes(search.toLowerCase()));
  const groups = [...new Set(sheets.map(sheet => sheet.group_name))];
  return <>
    <div className="ip-crumb">Preparation <ChevronRight size={13} /> Interview Questions</div>
    <div className="ip-page-heading ip-page-heading-with-action"><div><h1>Interview Questions</h1><p>Choose a technical subject, work through its public question inventory, and save your progress.</p></div><SymmPrepLink topic="Technical interview preparation" /></div>
    <div className="ip-search"><Search size={18}/><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search technologies..." aria-label="Search technical topics" /></div>
    {query.isLoading ? <p className="ip-feedback">Loading topics…</p> : query.error ? <p role="alert" className="ip-error">{query.error.message}</p> : groups.map(group => <section className="ip-technical-group" key={group}><h2>{group}</h2><div className="ip-technical-grid">{sheets.filter(sheet=>sheet.group_name===group).map(sheet=>{const Icon=technicalIcons[sheet.slug]??BookOpen;return <Link href={`/interview-preparations/interview-questions/${sheet.slug}`} className="ip-technical-card" key={sheet.slug}><span className="ip-technical-icon"><Icon size={20} strokeWidth={1.7}/></span><span><strong>{sheet.title}</strong><small>{sheet.question_count} questions</small></span><ChevronRight size={17}/></Link>})}</div></section>)}
    {!query.isLoading&&!query.error&&!sheets.length&&<p className="ip-empty">No technical topics match your search.</p>}
  </>;
}

function InterviewAnswer({question,subject,kind}:{question:Question;subject:Pick<Role,"slug"|"title">;kind:"technical"|"role"}) {
  const {user,signInWithGoogle}=useAuth();
  const action=kind==="role"?"roleAnswer":"technicalAnswer";
  const scopeKey=kind==="role"?"role":"sheet";
  const path=`/api/interview?mode=${action}&${scopeKey}=${encodeURIComponent(subject.slug)}&question=${encodeURIComponent(question.id)}`;
  const result=useQuery({
    queryKey:["interview-original-answer",kind,subject.slug,question.id,user?.id??"public"],
    queryFn:()=>jsonRequest<{answer:string|null}>(path,user?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action,[kind==="role"?"roleSlug":"sheetSlug"]:subject.slug,questionId:question.id})}:undefined),
    retry:false,
    staleTime:Infinity,
    refetchOnWindowFocus:false,
  });
  return <div className="ip-answer-detail">
    <strong>AlgoGym answer</strong>
    {result.isLoading?<p role="status">{user?"Writing an answer for this question…":"Loading answer…"}</p>
      :result.error?<><p role="alert">{result.error.message}</p><button type="button" className="ip-answer-retry" onClick={()=>void result.refetch()}>Try again</button></>
      :result.data?.answer?<>{result.data.answer.split(/\n\n+/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}<small>Original AI-assisted explanation. Check details before using it in an interview.</small></>
      :<div className="ip-answer-signin"><p>Sign in to create an original answer for this question.</p><button type="button" className="ip-answer-retry" onClick={()=>void signInWithGoogle(window.location.pathname)}>Sign in to see answer</button></div>}
    <div className="ip-answer-resources"><SymmPrepLink topic={`Explain ${question.title} for ${subject.title}`} label="Explore with SYMM AI"/></div>
  </div>;
}

function TechnicalSheet({ slug }: { slug: string }) {
  const [search,setSearch]=useState("");
  const [difficulty,setDifficulty]=useState("");
  const [bookmarked,setBookmarked]=useState(false);
  const [page,setPage]=useState(0);
  const [openId,setOpenId]=useState<string|null>(null);
  const query=useQuery({queryKey:["interview-technical-sheet",slug],queryFn:()=>jsonRequest<{sheet:TechnicalSheetMeta;questions:Question[]}>(`/api/interview?mode=technicalSheet&sheet=${encodeURIComponent(slug)}`)});
  const {states,toggle,saving,error}=useQuestionState();
  const sheet=query.data?.sheet;
  const questions=query.data?.questions??[];
  const visible=questions.filter(question=>(!search||question.title.toLowerCase().includes(search.toLowerCase()))&&(!difficulty||question.difficulty===difficulty)&&(!bookmarked||states.get(question.id)?.bookmarked));
  const pages=Math.ceil(visible.length/40);
  const currentPage=Math.min(page,Math.max(0,pages-1));
  const completed=questions.filter(question=>states.get(question.id)?.completed).length;
  return <>
    <div className="ip-crumb"><Link href="/interview-preparations/interview-questions">Interview Questions</Link><ChevronRight size={13}/>{sheet?.title??"Topic"}</div>
    {query.isLoading?<p className="ip-feedback">Loading questions…</p>:query.error?<p role="alert" className="ip-error">{query.error.message}</p>:<>
      <div className="ip-page-heading ip-page-heading-with-action"><div><h1>{sheet?.title} Questions</h1><p>{completed}/{questions.length} completed · Open a question for its AlgoGym answer.</p></div><SymmPrepLink topic={`Learn ${sheet?.title} for technical interviews`} /></div>
      <div className="ip-role-controls"><div className="ip-search"><Search size={18}/><input type="search" value={search} onChange={event=>{setSearch(event.target.value);setPage(0)}} placeholder="Search questions..." aria-label="Search technical questions"/></div><DifficultySelect value={difficulty} onChange={(next)=>{setDifficulty(next);setPage(0);setOpenId(null);}}/><button type="button" className={bookmarked?"ip-selected":""} onClick={()=>{setBookmarked(!bookmarked);setPage(0)}}>Bookmarked</button></div>
      <p className="ip-count">{visible.length} questions</p>
      <div className="ip-answer-list">{visible.slice(currentPage*40,(currentPage+1)*40).map((question,index)=>{const expanded=openId===`${currentPage}-${index}`;return <article className="ip-answer-item" key={`${question.id}-${index}`}><div className="ip-answer-head"><button type="button" className={`ip-check ${states.get(question.id)?.completed?"ip-checked":""}`} disabled={saving===question.id} aria-label={`${states.get(question.id)?.completed?"Mark incomplete":"Mark complete"}: ${question.title}`} aria-pressed={Boolean(states.get(question.id)?.completed)} onClick={()=>toggle(question.id,"completed")}>{states.get(question.id)?.completed&&<Check size={14}/>}</button><button type="button" className="ip-answer-toggle" aria-expanded={expanded} onClick={()=>setOpenId(expanded?null:`${currentPage}-${index}`)}><span className="ip-answer-label"><small>{String(currentPage*40+index+1).padStart(2,"0")}</small><strong>{question.title}</strong></span><ChevronDown size={18} className="ip-answer-chevron"/></button>{question.difficulty&&<span className={`ip-difficulty ip-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>}<button type="button" className={`ip-save-button ${states.get(question.id)?.bookmarked?"ip-saved":""}`} disabled={saving===question.id} aria-label={`${states.get(question.id)?.bookmarked?"Remove bookmark":"Bookmark"}: ${question.title}`} aria-pressed={Boolean(states.get(question.id)?.bookmarked)} onClick={()=>toggle(question.id,"bookmarked")}><Bookmark size={17} fill={states.get(question.id)?.bookmarked?"currentColor":"none"}/></button></div>{expanded&&sheet&&<InterviewAnswer question={question} subject={sheet} kind="technical"/>}</article>})}</div>
      {pages>1&&<div className="ip-pagination"><button disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Previous</button><span>Page {currentPage+1} of {pages}</span><button disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>Next</button></div>}
      {error&&<p role="alert" className="ip-error">{error}</p>}
    </>}
  </>;
}

function Category({ slug }: { slug: string }) {
  const [search, setSearch] = useState("");
  const source = starterResources[slug];
  if (slug === "patterns") return <Patterns />;
  if (slug === "package-wise") return <PracticeCategory slug={slug} />;
  if (slug === "role-wise") return <RoleDirectory />;
  if (slug === "interview-questions") return <TechnicalDirectory />;
  if (slug === "cool-notes") return <NotesLibrary />;
  if (slug === "resume-templates") return <ResumeLibrary />;
  if (playlistGroups.includes(slug)) return <PlaylistDirectory group={slug} />;
  if (
    ["sql", "system-design", "hr-questions"].includes(
      slug,
    )
  )
    return <QuestionCategory slug={slug} />;
  if (!source)
    return (
      <div className="ip-empty">This preparation section is unavailable.</div>
    );
  const resources = source.links.filter((item) =>
    `${item.title} ${item.description}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} />
        {titles[slug]}
      </div>
      <div className="ip-page-heading">
        <h1>{titles[slug]}</h1>
        <p>{source.description}</p>
      </div>
      <div className="ip-search">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`Search ${titles[slug].toLowerCase()}...`}
          aria-label={`Search ${titles[slug]}`}
        />
      </div>
      <div className="ip-resource-grid">
        {resources.map((item) => (
          <a
            key={item.title}
            className="ip-resource-card"
            href={item.url}
            target={item.url.startsWith("http") ? "_blank" : undefined}
            rel={
              item.url.startsWith("http") ? "noopener noreferrer" : undefined
            }
          >
            <span className="ip-resource-icon">
              <BookOpen size={19} />
            </span>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <span className="ip-resource-action">
              Open resource <ArrowUpRight size={15} />
            </span>
          </a>
        ))}
      </div>
      {!resources.length && (
        <div className="ip-empty">
          No resources match “{search}”. Try a different word.
        </div>
      )}
    </>
  );
}

const patternGroups = patternManifest as Array<{topic: string; subTopic: string; ids: string[]}>;
const patternTopics = [...new Set(patternGroups.map((group) => group.topic))];

function Patterns() {
  const query = useQuery({
    queryKey: ["interview-category", "patterns"],
    queryFn: () =>
      jsonRequest<{ questions: Question[] }>(
        "/api/interview?mode=category&category=patterns",
      ),
  });
  const { states, toggle, saving, error } = useQuestionState();
  const [open, setOpen] = useState<string | null>(null);
  const questions = query.data?.questions ?? [];
  const byId = new Map(questions.map((question) => [question.id, question]));
  const placements = patternGroups.flatMap((group) => group.ids);
  const completed = placements.filter((id) => states.get(id)?.completed).length;
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> 20 DSA Patterns
      </div>
      <div className="ip-page-heading ip-page-heading-with-action"><div>
        <h1>20 DSA Patterns</h1>
        <p>Recognize the pattern, then practice the underlying problem. Progress follows each question wherever it appears.</p>
      </div><SymmPrepLink topic="Master DSA problem-solving patterns" /></div>
      <p className="ip-count">
        {completed}/{placements.length} problems completed
      </p>
      {query.isLoading ? (
        <p className="ip-feedback">Loading patterns…</p>
      ) : query.error ? (
        <p className="ip-error">{query.error.message}</p>
      ) : (
        <div className="ip-pattern-list">
          {patternTopics.map((name) => {
            const sections = patternGroups.filter((group) => group.topic === name);
            const ids = sections.flatMap((section) => section.ids);
            const solved = ids.filter((id) => states.get(id)?.completed).length;
            return (
              <section key={name}>
                <button
                  aria-expanded={open === name}
                  onClick={() => setOpen(open === name ? null : name)}
                >
                  <span>{name}</span>
                  <small>
                    {solved}/{ids.length} completed
                  </small>
                  <ChevronDown size={17} />
                </button>
                  {open === name && (
                    <div className="ip-pattern-body">
                      {sections.map((section, index) => <div className="ip-pattern-subsection" key={`${name}-${index}`}>
                        {sections.length > 1 && <h3>{section.subTopic}</h3>}
                        <QuestionTable
                          questions={section.ids.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question))}
                          states={states}
                          onToggle={toggle}
                          saving={saving}
                          showPopularity={false}
                        />
                      </div>)}
                    </div>
                )}
              </section>
            );
          })}
        </div>
      )}
      {error && (
        <p role="alert" className="ip-error">
          {error}
        </p>
      )}
    </>
  );
}

function AnswerQuestionList({
  slug, questions, states, onToggle, saving,
}: {
  slug: string;
  questions: Question[];
  states: Map<string, QuestionState>;
  onToggle: (id: string, field: "completed" | "bookmarked") => void;
  saving: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");
  const Icon = slug === "sql" ? Database : slug === "system-design" ? Network : MessageSquare;
  if (!questions.length) return <div className="ip-empty">No questions match the selected filters.</div>;
  return <div className="ip-answer-list">{questions.map((question, index) => {
    const expanded = openId === question.id;
    const type = question.tags.find((tag) => tag === "HLD" || tag === "LLD");
    return <article className={`ip-answer-item ${expanded ? "ip-answer-open" : ""}`} key={`${question.id}-${index}`}>
      <div className="ip-answer-head">
        <button type="button" className={`ip-check ${states.get(question.id)?.completed ? "ip-checked" : ""}`} disabled={saving === question.id} aria-label={`${states.get(question.id)?.completed ? "Mark incomplete" : "Mark complete"}: ${question.title}`} aria-pressed={Boolean(states.get(question.id)?.completed)} onClick={() => onToggle(question.id, "completed")}>{states.get(question.id)?.completed && <Check size={14} strokeWidth={3} />}</button>
        <button type="button" className="ip-answer-toggle" aria-expanded={expanded} aria-controls={`ip-answer-${question.id}`} onClick={() => setOpenId(expanded ? null : question.id)}><span className="ip-answer-icon"><Icon size={17} strokeWidth={1.8} /></span><span className="ip-answer-label"><small>{String(index + 1).padStart(2, "0")}{type ? ` · ${type}` : ""}</small><strong>{question.title}</strong></span><ChevronDown size={18} className="ip-answer-chevron" /></button>
        {question.difficulty && <span className={`ip-difficulty ip-${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>}
        <button type="button" className={`ip-save-button ${states.get(question.id)?.bookmarked ? "ip-saved" : ""}`} disabled={saving === question.id} aria-label={`${states.get(question.id)?.bookmarked ? "Remove bookmark" : "Bookmark"}: ${question.title}`} aria-pressed={Boolean(states.get(question.id)?.bookmarked)} onClick={() => onToggle(question.id, "bookmarked")}><Bookmark size={17} fill={states.get(question.id)?.bookmarked ? "currentColor" : "none"} /></button>
      </div>
      {expanded && <div id={`ip-answer-${question.id}`} className="ip-answer-detail">
        {slug === "sql" && <><div className="ip-answer-detail-title"><strong>One MySQL 8 answer</strong>{question.answerCode && <button type="button" onClick={async () => {try {await navigator.clipboard.writeText(question.answerCode ?? "");setCopiedId(question.id);setCopyError("");} catch {setCopyError("Could not copy the query.");}}}><Copy size={14} />{copiedId === question.id ? "Copied" : "Copy query"}</button>}</div><p>Illustrative tables and columns are described above. Adapt them to your schema.</p>{question.answerCode ? <pre><code>{question.answerCode}</code></pre> : <p role="alert">Answer unavailable.</p>}</>}
        {slug === "hr-questions" && <><strong>Example response</strong><p>{question.answerText ?? "Answer unavailable."}</p><small>Replace bracketed details with your own truthful experience.</small></>}
        {slug === "system-design" && <><strong>Explore this design</strong><p>Start with requirements and scale, then explain data flow, failure cases, and trade-offs.</p><div className="ip-answer-resources">{question.articleUrl && <a href={question.articleUrl} target="_blank" rel="noopener noreferrer"><FileText size={16} /> Read article <ArrowUpRight size={14} /></a>}{question.videoUrl && <a href={question.videoUrl} target="_blank" rel="noopener noreferrer"><Play size={16} /> Watch video <ArrowUpRight size={14} /></a>}</div></>}
        {copyError && <p role="alert" className="ip-error">{copyError}</p>}
      </div>}
    </article>;
  })}</div>;
}

function QuestionCategory({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["interview-category", slug],
    queryFn: () =>
      jsonRequest<{ questions: Question[] }>(
        `/api/interview?mode=category&category=${encodeURIComponent(slug)}`,
      ),
  });
  const { states, toggle, saving, error } = useQuestionState();
  const [difficulty, setDifficulty] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const [search, setSearch] = useState("");
  const [systemType, setSystemType] = useState("");
  const questions = query.data?.questions ?? [];
  const visible = filterQuestions(
    questions,
    states,
    difficulty,
    "",
    bookmarked,
  ).filter((question) =>
    (!search || question.title.toLowerCase().includes(search.toLowerCase())) &&
    (!systemType || question.tags.includes(systemType)),
  );
  const completed = questions.filter(
    (question) => states.get(question.id)?.completed,
  ).length;
  const descriptions: Record<string, string> = {
    sql: "Practice 110 SQL prompts with MySQL 8 examples. The sample queries use employees, departments, orders, customers, and related tables; adapt names and values to your own schema.",
    "system-design":
      "Explore 22 HLD and 10 LLD prompts with separate article and video references. Difficulty is AlgoGym guidance, not a reference-site rating.",
    "hr-questions":
      "Practice 100 behavioral questions with original sample responses. Personalize each answer with your own evidence.",
    "interview-questions":
      "Review core engineering ideas and use the linked public references to check your explanation.",
  };
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} />
        {titles[slug]}
      </div>
      <div className="ip-page-heading ip-page-heading-with-action"><div><h1>{titles[slug]}</h1><p>{descriptions[slug]}</p></div><SymmPrepLink topic={`Learn ${titles[slug]} for interviews`} /></div>
      <div className="ip-search"><Search size={18} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${titles[slug].toLowerCase()}...`} aria-label={`Search ${titles[slug]}`} /></div>
      <div className="ip-sheet-tools ip-category-tools">
        <div className="ip-progress">
          <span
            className="ip-progress-ring"
            style={
              {
                "--progress": `${questions.length ? Math.round((100 * completed) / questions.length) : 0}%`,
              } as React.CSSProperties
            }
          >
            {questions.length
              ? Math.round((100 * completed) / questions.length)
              : 0}
            %
          </span>
          <div>
            <strong>Overall Progress</strong>
            <small>
              {completed}/{questions.length}
            </small>
          </div>
        </div>
        <div className="ip-filters">
          {slug !== "system-design" && <button
            className={!difficulty && !bookmarked ? "ip-selected" : ""}
            onClick={() => {
              setDifficulty("");
              setBookmarked(false);
            }}
          >
            All
          </button>}
          {slug === "system-design" ? <><div className="ip-type-filter" role="group" aria-label="System design type">{["", "HLD", "LLD"].map((type) => <button type="button" key={type} className={systemType === type && !bookmarked ? "ip-selected" : ""} onClick={() => {setSystemType(type); setDifficulty(""); setBookmarked(false);}}>{type || "All"}</button>)}</div><select aria-label="AlgoGym difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">Any difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select></> : <select
            aria-label="Difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="">Difficulty</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>}
          <button
            className={bookmarked ? "ip-selected" : ""}
            onClick={() => setBookmarked(!bookmarked)}
          >
            Bookmarked
          </button>
        </div>
      </div>
      {query.isLoading ? (
        <p className="ip-feedback">Loading questions…</p>
      ) : query.error ? (
        <p className="ip-error">{query.error.message}</p>
      ) : (
        <>
        <p className="ip-count">{visible.length} {slug === "system-design" ? "design prompts" : "questions"}</p>
        {["sql", "system-design", "hr-questions"].includes(slug) ? <AnswerQuestionList slug={slug} questions={visible} states={states} onToggle={toggle} saving={saving} /> : <QuestionTable
          questions={visible}
          states={states}
          onToggle={toggle}
          saving={saving}
          showPopularity={false}
          showDifficulty={slug !== "system-design"}
          questionLabel={slug === "sql" ? "Problem" : "Question"}
        />}
        </>
      )}{" "}
      {error && (
        <p role="alert" className="ip-error">
          {error}
        </p>
      )}
    </>
  );
}

function PracticeCategory({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["interview-category", "package-wise"],
    queryFn: () =>
      jsonRequest<{ questions: Question[] }>(
        "/api/interview?mode=category&category=package-wise",
      ),
  });
  const { states, toggle, saving, error } = useQuestionState();
  const [difficulty, setDifficulty] = useState("");
  const [band, setBand] = useState("");
  const [bookmarked, setBookmarked] = useState(false);
  const questions = query.data?.questions ?? [];
  const visible = filterQuestions(
    questions,
    states,
    difficulty,
    "",
    bookmarked,
  ).filter((question) => !band || packageBand(question) === band);
  const completed = questions.filter(
    (question) => states.get(question.id)?.completed,
  ).length;
  const percent = questions.length
    ? Math.round((100 * completed) / questions.length)
    : 0;
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} />
        {titles[slug]}
      </div>
      <div className="ip-page-heading">
        <h1>{titles[slug]}</h1>
        <p>
          Choose a target package band to pace your practice. Bands are AlgoGym
          study tiers based on difficulty, not verified salary or hiring data.
        </p>
      </div>
      <p className="ip-count">{questions.length} Problems <span>· 6 Package Tiers (3–5 LPA to 60+ LPA)</span></p>
      <div className="ip-sheet-tools ip-category-tools">
        <div
          className="ip-progress"
          aria-label={`${completed} of ${questions.length} completed`}
        >
          <span
            className="ip-progress-ring"
            style={{ "--progress": `${percent}%` } as React.CSSProperties}
          >
            {percent}%
          </span>
          <div>
            <strong>Overall Progress</strong>
            <small>
              {completed}/{questions.length}
            </small>
          </div>
        </div>
        <div className="ip-filters">
          <button
            className={
              !difficulty && !band && !bookmarked ? "ip-selected" : ""
            }
            onClick={() => {
              setDifficulty("");
              setBand("");
              setBookmarked(false);
            }}
          >
            All
          </button>
          <select
            aria-label="Difficulty"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="">Difficulty</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <select
            aria-label="Package"
            value={band}
            onChange={(event) => setBand(event.target.value)}
          >
            <option value="">Package</option>
            {packageBands.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button
            className={bookmarked ? "ip-selected" : ""}
            onClick={() => setBookmarked(!bookmarked)}
          >
            Bookmarked
          </button>
        </div>
      </div>
      {query.isLoading ? (
        <p className="ip-feedback">Loading questions…</p>
      ) : query.error ? (
        <p className="ip-error">{query.error.message}</p>
      ) : (
        <QuestionTable
          questions={visible}
          states={states}
          onToggle={toggle}
          saving={saving}
          showPopularity={false}
          packageFor={packageBand}
        />
      )}{" "}
      {error && (
        <p role="alert" className="ip-error">
          {error}
        </p>
      )}
    </>
  );
}

function Admin() {
  const query = useQuery({
    queryKey: ["interview-admin"],
    queryFn: () =>
      jsonRequest<{
        companies: Array<Company & { published: boolean; position: number }>;
        questions: Array<Question & { published: boolean }>;
        placements: Array<{
          company_slug: string;
          question_id: string;
          position: number;
        }>;
      }>("/api/interview?mode=admin"),
    retry: false,
  });
  const client = useQueryClient();
  const [kind, setKind] = useState<
    "company" | "question" | "placement" | "categoryPlacement"
  >("company");
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState("LeetCode");
  const [difficulty, setDifficulty] = useState("Easy");
  const [tags, setTags] = useState("");
  const [position, setPosition] = useState(0);
  const [categorySlug, setCategorySlug] = useState("sql");
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const save = async (remove = false) => {
    setBusy(true);
    setMessage("");
    try {
      const body =
        kind === "company"
          ? { kind, slug, name, description, published, position }
          : kind === "question"
            ? {
                kind,
                id: questionId,
                title,
                source,
                url,
                difficulty,
                tags: tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean),
                published,
              }
            : kind === "categoryPlacement"
              ? { kind, categorySlug, questionId, position, remove }
              : { kind, companySlug: slug, questionId, position, remove };
      await jsonRequest("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["interview-admin"] }),
        client.invalidateQueries({ queryKey: ["interview-directory"] }),
        client.invalidateQueries({ queryKey: ["interview-sheet"] }),
        client.invalidateQueries({ queryKey: ["interview-category"] }),
        client.invalidateQueries({ queryKey: ["interview-questions"] }),
      ]);
      setMessage(
        remove ? "Question removed from the sheet." : "Content saved.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Could not save content.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (query.isLoading)
    return <p className="ip-feedback">Checking content access…</p>;
  if (query.error)
    return (
      <p className="ip-feedback ip-error">Administrator access is required.</p>
    );
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> Manage content
      </div>
      <div className="ip-page-heading">
        <h1>Manage preparation content</h1>
        <p>
          Publish companies, add linked public questions, and order the
          exercises in each sheet.
        </p>
      </div>
      <div className="ip-admin-tabs">
        {(
          ["company", "question", "placement", "categoryPlacement"] as const
        ).map((item) => (
          <button
            key={item}
            className={kind === item ? "ip-selected" : ""}
            onClick={() => setKind(item)}
          >
            {item === "placement"
              ? "Sheet questions"
              : item === "categoryPlacement"
                ? "Category questions"
                : item === "company"
                  ? "Companies"
                  : "Questions"}
          </button>
        ))}
      </div>
      <form
        className="ip-admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        {(kind === "company" || kind === "placement") && (
          <label>
            Company slug
            <input
              required
              pattern="[a-z0-9-]{2,80}"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="google"
              list="ip-companies"
            />
          </label>
        )}
        {kind === "categoryPlacement" && (
          <label>
            Category
            <select
              value={categorySlug}
              onChange={(event) => setCategorySlug(event.target.value)}
            >
              {[
                "sql",
                "patterns",
                "package-wise",
                "system-design",
                "hr-questions",
                "interview-questions",
              ].map((name) => (
                <option key={name} value={name}>
                  {titles[name]}
                </option>
              ))}
            </select>
          </label>
        )}
        <datalist id="ip-companies">
          {query.data?.companies.map((company) => (
            <option key={company.slug} value={company.slug}>
              {company.name}
            </option>
          ))}
        </datalist>
        {kind === "company" && (
          <>
            <label>
              Company name
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Company name"
              />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
              />
            </label>
          </>
        )}
        {kind !== "company" && (
          <label>
            Question ID
            <input
              required
              value={questionId}
              onChange={(event) => {
                const id = event.target.value;
                setQuestionId(id);
                if (kind !== "question") return;
                const existing = query.data?.questions.find(
                  (question) => question.id === id,
                );
                if (!existing) return;
                setTitle(existing.title);
                setSource(existing.source);
                setUrl(existing.url);
                setDifficulty(existing.difficulty ?? "Easy");
                setTags(existing.tags.join(", "));
                setPublished(existing.published);
              }}
              placeholder="lc-two-sum"
              list="ip-questions"
            />
          </label>
        )}
        <datalist id="ip-questions">
          {query.data?.questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.title}
            </option>
          ))}
        </datalist>
        {kind === "question" && (
          <>
            <label>
              Title
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Source
              <input
                required
                value={source}
                onChange={(event) => setSource(event.target.value)}
              />
            </label>
            <label>
              HTTPS problem URL
              <input
                required
                type="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
            <label>
              Difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </label>
            <label>
              Tags, comma separated
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </label>
          </>
        )}
        {kind !== "question" && (
          <label>
            Position
            <input
              required
              type="number"
              min="0"
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
            />
          </label>
        )}
        {(kind === "company" || kind === "question") && (
          <label className="ip-admin-check">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
            />{" "}
            Published
          </label>
        )}
        <div className="ip-admin-actions">
          <button disabled={busy} type="submit">
            {busy ? "Saving…" : "Save"}
          </button>
          {(kind === "placement" || kind === "categoryPlacement") && (
            <button
              disabled={busy}
              type="button"
              onClick={() => void save(true)}
            >
              Remove from sheet
            </button>
          )}
        </div>
        {message && <p role="status">{message}</p>}
      </form>
      <h2>Existing companies</h2>
      <div className="ip-admin-list">
        {query.data?.companies.map((company) => (
          <button
            key={company.slug}
            onClick={() => {
              setKind("company");
              setSlug(company.slug);
              setName(company.name);
              setDescription(company.description);
              setPosition(company.position);
              setPublished(company.published);
            }}
          >
            {company.name}
            <span>{company.published ? "Published" : "Draft"}</span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function InterviewPreparations() {
  const params = useParams<{ path?: string[] }>();
  const path = params.path ?? [];
  return (
    <Shell>
      {path.length === 0 ? (
        <>
          <div className="ip-crumb">Preparation</div>
          <div className="ip-page-heading">
            <h1>Interview Preparations</h1>
            <p>
              Choose a sheet, solve public problems, and make your progress
              visible to yourself.
            </p>
          </div>
          <div className="ip-overview-links">
            <Link href="/interview-preparations/company-wise">
              <strong>Company Wise DSA</strong>
              <span>
                Browse 45 company names and practice foundation questions.
              </span>
              <ChevronRight size={19} />
            </Link>
            <Link href="/interview-preparations/patterns">
              <strong>20 DSA Patterns</strong>
              <span>Focus your practice by topic.</span>
              <ChevronRight size={19} />
            </Link>
            <Link href="/interview-preparations/progress">
              <strong>My Progress</strong>
              <span>Review completed and bookmarked questions.</span>
              <ChevronRight size={19} />
            </Link>
          </div>
        </>
      ) : path[0] === "company-wise" && path.length === 1 ? (
        <Directory />
      ) : path[0] === "company-wise" && path[1] ? (
        <CompanySheet slug={path[1]} />
      ) : path[0] === "role-wise" && path[1] ? (
        <RoleSheet slug={path[1]} />
      ) : path[0] === "interview-questions" && path[1] ? (
        <TechnicalSheet slug={path[1]} />
      ) : playlistGroups.includes(path[0]) && path[1] ? (
        <PlaylistDetail group={path[0]} slug={path[1]} />
      ) : path[0] === "progress" ? (
        <Progress />
      ) : path[0] === "cold-email-templates" ? (
        <InterviewTemplates slug={path[1]} />
      ) : path[0] === "cool-notes" ? (
        <NotesLibrary slug={path[1]} />
      ) : path[0] === "resume-templates" ? (
        <ResumeLibrary slug={path[1]} />
      ) : path[0] === "admin" ? (
        <Admin />
      ) : (
        <Category slug={path[0]} />
      )}
    </Shell>
  );
}
