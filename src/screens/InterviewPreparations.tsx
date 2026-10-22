"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "@/hooks/use-account";
import "./interview-preparations.css";

type Company = {
  slug: string;
  name: string;
  description: string;
  count: number;
};
type Question = {
  id: string;
  title: string;
  source: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  tags: string[];
  popularity: string | null;
};
type QuestionState = {
  question_id: string;
  completed: boolean;
  bookmarked: boolean;
};
type Sheet = { company: Company; questions: Question[] };
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
        title: "PostgreSQL Tutorial",
        description: "Official SQL syntax and examples.",
        url: "https://www.postgresql.org/docs/current/tutorial.html",
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
          <Link
            href="/dashboard"
            aria-label="AlgoGym dashboard"
            className="ip-brand-mark"
          >
            A<span>G</span>
          </Link>
          <div>
            <strong>AlgoGym</strong>
            <small>Interview Preparations</small>
          </div>
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
              {group.items.map(([slug, label]) => (
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
                  {label}
                </Link>
              ))}
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
          <span>Interview Preparations</span>
          <Link href="/interview-preparations/progress">
            My progress <ChevronRight size={15} />
          </Link>
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
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> Company Wise DSA
      </div>
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
                <span className="ip-company-mark">
                  {company.name.slice(0, 2).toUpperCase()}
                </span>
                <strong>{company.name}</strong>
              </div>
              <p>
                Public DSA practice for {company.name}. Build your fundamentals
                and track every question.
              </p>
              <div className="ip-company-foot">
                <span>{company.count} Questions</span>
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
    </>
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
    const next = { ...current, [field]: !current[field] };
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
}: {
  questions: Question[];
  states: Map<string, QuestionState>;
  onToggle: (id: string, field: "completed" | "bookmarked") => void;
  saving: string;
  showPopularity?: boolean;
}) {
  if (!questions.length)
    return (
      <div className="ip-empty">No questions match the selected filters.</div>
    );
  return (
    <div className="ip-table-scroll">
      <table className="ip-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Problem</th>
            <th>Tags</th>
            <th>Link</th>
            <th>Difficulty</th>
            {showPopularity && <th>Popularity</th>}
            <th>Save</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((question, index) => (
            <tr key={question.id}>
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
                <a
                  href={question.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {question.title}
                </a>
              </td>
              <td>
                <div className="ip-tags">
                  {question.tags.slice(0, 2).map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </td>
              <td>
                <a
                  className="ip-source"
                  href={question.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${question.title} on ${question.source}`}
                >
                  {question.source}
                  <ArrowUpRight size={13} />
                </a>
              </td>
              <td>
                <span
                  className={`ip-difficulty ip-${(question.difficulty ?? "").toLowerCase()}`}
                >
                  {question.difficulty ?? "—"}
                </span>
              </td>
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
        <span className="ip-company-mark ip-large-mark">
          {company.name.slice(0, 2).toUpperCase()}
        </span>
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
  const { states, toggle, saving, error } = useQuestionState();
  const directory = useQuery({
    queryKey: ["interview-directory"],
    queryFn: () =>
      jsonRequest<{ companies: Company[] }>("/api/interview?mode=directory"),
  });
  const catalog = useQuery({
    queryKey: ["interview-questions"],
    queryFn: () =>
      jsonRequest<{ questions: Question[] }>("/api/interview?mode=questions"),
  });
  const questions = catalog.data?.questions ?? [];
  const completed = questions.filter(
    (question) => states.get(question.id)?.completed,
  ).length;
  const saved = questions.filter(
    (question) => states.get(question.id)?.bookmarked,
  );
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> My Progress
      </div>
      <div className="ip-page-heading">
        <h1>My Progress</h1>
        <p>
          Your saved work follows each canonical question across company sheets.
        </p>
      </div>
      <div className="ip-progress-summary">
        <div>
          <strong>{completed}</strong>
          <span>Questions completed</span>
        </div>
        <div>
          <strong>{saved.length}</strong>
          <span>Bookmarks</span>
        </div>
        <div>
          <strong>{directory.data?.companies.length ?? 0}</strong>
          <span>Company sheets</span>
        </div>
      </div>
      <h2>Bookmarked questions</h2>
      {error && (
        <p role="alert" className="ip-error">
          {error}
        </p>
      )}
      <QuestionTable
        questions={saved}
        states={states}
        onToggle={toggle}
        saving={saving}
        showPopularity={false}
      />
    </>
  );
}

function Category({ slug }: { slug: string }) {
  const source = starterResources[slug];
  if (slug === "patterns") return <Patterns />;
  if (slug === "package-wise") return <PracticeCategory slug={slug} />;
  if (slug === "sql") return <QuestionCategory slug={slug} />;
  if (!source)
    return (
      <div className="ip-empty">This preparation section is unavailable.</div>
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
      <div className="ip-resource-list">
        {source.links.map((item) => (
          <a
            key={item.title}
            href={item.url}
            target={item.url.startsWith("http") ? "_blank" : undefined}
            rel={
              item.url.startsWith("http") ? "noopener noreferrer" : undefined
            }
          >
            <div>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </div>
            <ArrowUpRight size={18} />
          </a>
        ))}
      </div>
    </>
  );
}

const patternGroups: Array<[string, string[]]> = [
  ["Fast and Slow Pointer", ["lc-linked-list-cycle"]],
  ["Overlapping Intervals", ["lc-merge-intervals"]],
  ["Prefix Sum", ["lc-product-of-array-except-self"]],
  ["Sliding Window", ["lc-longest-substring-without-repeating-characters"]],
  ["Two Pointers", ["lc-3sum"]],
  ["Cyclic Sort", ["lc-missing-number"]],
  ["Reversal of Linked List", ["lc-reverse-linked-list"]],
  ["Breadth-First Search", ["lc-binary-tree-level-order-traversal"]],
  [
    "Depth-First Search",
    ["lc-number-of-islands", "lc-maximum-depth-of-binary-tree"],
  ],
  ["Backtracking", ["lc-subsets"]],
  ["Modified Binary Search", ["lc-search-in-rotated-sorted-array"]],
  ["Bitwise XOR", ["lc-single-number"]],
  ["Top K Elements", ["lc-top-k-frequent-elements"]],
  ["K-way Merge", ["lc-merge-k-sorted-lists"]],
  ["Two Heaps", ["lc-find-median-from-data-stream"]],
  ["Monotonic Stack", ["lc-daily-temperatures"]],
  [
    "Trees",
    ["lc-maximum-depth-of-binary-tree", "lc-binary-tree-level-order-traversal"],
  ],
  ["Dynamic Programming", ["lc-climbing-stairs", "lc-coin-change"]],
  ["Graphs", ["lc-course-schedule", "lc-number-of-islands"]],
  ["Greedy", ["lc-jump-game"]],
];

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
  const groupedIds = new Set(patternGroups.flatMap(([, ids]) => ids));
  const extraIds = questions
    .filter((question) => !groupedIds.has(question.id))
    .map((question) => question.id);
  const visibleGroups: Array<[string, string[]]> = extraIds.length
    ? [...patternGroups, ["Additional practice", extraIds]]
    : patternGroups;
  const completed = questions.filter(
    (question) => states.get(question.id)?.completed,
  ).length;
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} /> 20 DSA Patterns
      </div>
      <div className="ip-page-heading">
        <h1>20 DSA Patterns</h1>
        <p>
          Recognize the pattern, then practice the underlying problem. Progress
          follows each question wherever it appears.
        </p>
      </div>
      <p className="ip-count">
        {completed}/{questions.length} unique problems completed
      </p>
      {query.isLoading ? (
        <p className="ip-feedback">Loading patterns…</p>
      ) : query.error ? (
        <p className="ip-error">{query.error.message}</p>
      ) : (
        <div className="ip-pattern-list">
          {visibleGroups.map(([name, ids]) => {
            const items = ids
              .map((id) => byId.get(id))
              .filter((question): question is Question => Boolean(question));
            const solved = items.filter(
              (question) => states.get(question.id)?.completed,
            ).length;
            return (
              <section key={name}>
                <button
                  aria-expanded={open === name}
                  onClick={() => setOpen(open === name ? null : name)}
                >
                  <span>{name}</span>
                  <small>
                    {solved}/{items.length} completed
                  </small>
                  <ChevronDown size={17} />
                </button>
                {open === name && (
                  <div className="ip-pattern-body">
                    <QuestionTable
                      questions={items}
                      states={states}
                      onToggle={toggle}
                      saving={saving}
                      showPopularity={false}
                    />
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
  const questions = query.data?.questions ?? [];
  const visible = filterQuestions(
    questions,
    states,
    difficulty,
    "",
    bookmarked,
  );
  const completed = questions.filter(
    (question) => states.get(question.id)?.completed,
  ).length;
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} />
        {titles[slug]}
      </div>
      <div className="ip-page-heading">
        <h1>{titles[slug]}</h1>
        <p>
          Practice public SQL exercises and track each result in your AlgoGym
          account.
        </p>
      </div>
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
          <button
            className={!difficulty && !bookmarked ? "ip-selected" : ""}
            onClick={() => {
              setDifficulty("");
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

function PracticeCategory({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: ["interview-sheet", "google"],
    queryFn: () =>
      jsonRequest<Sheet>("/api/interview?mode=sheet&company=google"),
  });
  const { states, toggle, saving, error } = useQuestionState();
  const [selected, setSelected] = useState("");
  const questions = query.data?.questions ?? [];
  const visible = questions.filter(
    (question) => !selected || question.difficulty === selected,
  );
  return (
    <>
      <div className="ip-crumb">
        Preparation <ChevronRight size={13} />
        {titles[slug]}
      </div>
      <div className="ip-page-heading">
        <h1>{titles[slug]}</h1>
        <p>
          Build foundations across difficulty levels. Compensation bands are not
          a reliable proxy for question difficulty.
        </p>
      </div>
      <div className="ip-category-filters">
        <button
          className={!selected ? "ip-selected" : ""}
          onClick={() => setSelected("")}
        >
          All
        </button>
        {["Easy", "Medium", "Hard"].map((name) => (
          <button
            key={name}
            className={selected === name ? "ip-selected" : ""}
            onClick={() => setSelected(name)}
          >
            {name}
          </button>
        ))}
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
      ) : path[0] === "progress" ? (
        <Progress />
      ) : path[0] === "admin" ? (
        <Admin />
      ) : (
        <Category slug={path[0]} />
      )}
    </Shell>
  );
}
