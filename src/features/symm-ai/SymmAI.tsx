"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Library,
  LoaderCircle,
  Maximize2,
  Menu,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { RichText, CodeExample } from "./LessonContent";
import { CreditDialog, CreditIndicator, type AiCredits } from "./CreditIndicator";



import "katex/dist/katex.min.css";
import { SymmMark } from "@/components/brand/SymmMark";
import { LivingField } from "@/components/brand/LivingField";
import { SymmKineticType } from "@/components/brand/SymmKineticType";
import { SymmSidebar } from "./SymmSidebar";
import "./symm-workspace.css";
import { ChakraMark } from "@/components/brand/ChakraMark";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "@/hooks/use-account";
import { useTracker } from "@/hooks/use-tracker";
import { useBilling } from "@/hooks/use-billing";
import { chakraFor } from "@/lib/training";
import type { Lesson } from "@/../server/symm-ai";

type Path = {
  id: string;
  topic: string;
  title: string;
  description: string;
  level: string;
  goal: string;
  category: string;
  status: string;
  objectives: string[];
  prerequisites: string[];
  estimated_minutes: number;
  created_at: string;
  updated_at: string;
  preferred_language: "cpp" | "java" | "python";
  moduleCount?: number;
  lessonCount?: number;
  completedCount?: number;
};
type Module = {
  id: string;
  path_id: string;
  position: number;
  title: string;
  description: string;
  estimated_minutes: number;
  objectives: string[];
};
type LessonRow = {
  id: string;
  module_id: string;
  position: number;
  title: string;
  content: Lesson | null;
  status: string;
};
type Recommendation = {
  module_id: string;
  position: number;
  problems: {
    id: string;
    provider: string;
    title: string;
    url: string;
    cf_rating: number | null;
    lc_difficulty: string | null;
    tags: string[];
  } | null;
};
type Message = {
  id: string;
  role: "user" | "assistant";
  message: string;
  created_at: string;
};
type Detail = {
  path: Path;
  modules: Module[];
  lessons: LessonRow[];
  progress: { lesson_id: string; completed_at: string }[];
  recommendations: Recommendation[];
  moduleAwards: { module_id: string; points: number; awarded_at: string }[];
  codeVariants: {
    lesson_id: string;
    language: "cpp" | "java" | "python";
    code_content: string;
    explanation: string;
    generation_version: number;
  }[];
  conversation: Message[];
  configured: boolean;
  credits?: AiCredits | null;
};
type Home = { paths: Path[]; configured: boolean; credits?: AiCredits | null };

const suggestions = [
  "Dynamic programming on grids",
  "Shortest paths in graphs",
  "Binary search on the answer",
  "Number theory for contests",
];
const post = <T,>(body: object) =>
  jsonRequest<T>("/api/symm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const percent = (done: number, total: number) =>
  total ? Math.round((done / total) * 100) : 0;
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
    new Date(value),
  );
const codeLanguage = (value?: string) => {
  const normalized = (value ?? "").toLowerCase().replace(/[\s.]/g, "");
  if (["cpp", "c++", "c++17"].includes(normalized)) return "cpp";
  if (["java", "java17"].includes(normalized)) return "java";
  if (["python", "python3", "py"].includes(normalized)) return "python";
  return normalized;
};

function GridDiagram() {
  const values = [
    [1, 1, 1, 1],
    [1, 2, 3, 4],
    [1, 3, 6, 10],
    [1, 4, 10, 20],
  ];
  return (
    <figure className="my-6 rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] p-5">
      <figcaption className="mb-4 text-xs text-[var(--symm-muted)]">
        Paths to each cell when you can move right or down
      </figcaption>
      <div
        className="mx-auto grid max-w-[320px] grid-cols-4 gap-2"
        aria-label="Four by four grid showing path counts"
      >
        {values.flatMap((row, y) =>
          row.map((value, x) => (
            <div
              key={`${y}-${x}`}
              className={`flex aspect-square items-center justify-center rounded-md border font-mono text-sm ${x === 3 && y === 3 ? "border-[#b8a0f4] bg-[var(--symm-accent-surface)] text-[var(--symm-accent-text)]" : "border-[var(--symm-border)] bg-[var(--symm-elevated)] text-[var(--symm-muted)]"}`}
            >
              {value}
            </div>
          )),
        )}
      </div>
      <p className="mt-4 text-center text-xs text-[var(--symm-muted)]">
        Each interior cell is the sum of the cell above and the cell to its
        left.
      </p>
    </figure>
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 overflow-hidden rounded-full bg-[var(--symm-elevated)]"
    >
      <div
        className="h-full rounded-full bg-[#b8a0f4] transition-[width] duration-300 motion-reduce:transition-none"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function SymmAI({ pathId, libraryMode = false }: { pathId?: string; libraryMode?: boolean }) {
  const router = useRouter();
  const { user } = useAuth();
  const tracker = useTracker(0, "all", false);
  const billing = useBilling();
  const composer = useRef<HTMLTextAreaElement>(null);
  const tutorComposer = useRef<HTMLTextAreaElement>(null);
  const attemptedRecommendations = useRef(new Set<string>());
  const [home, setHome] = useState<Home | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [topic, setTopic] = useState("");
  useEffect(() => {
    if (pathId || libraryMode) return;
    const fromPreparation = new URLSearchParams(window.location.search).get("topic")?.trim();
    if (fromPreparation) setTopic((current) => current || fromPreparation.slice(0, 180));
  }, [pathId, libraryMode]);
  const [level, setLevel] = useState("beginner");
  const [goal, setGoal] = useState("fundamentals");
  const [hours, setHours] = useState(5);
  const [language, setLanguage] = useState<"cpp" | "java" | "python">("cpp");
  const [customize, setCustomize] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const credits = pathId ? detail?.credits : home?.credits;
  const [librarySearch, setLibrarySearch] = useState("");
  const [deletePath, setDeletePath] = useState<Path | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorWidth, setTutorWidth] = useState(340);
  const [tutorTall, setTutorTall] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [reportReason, setReportReason] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    for (const field of [composer.current, tutorComposer.current]) {
      if (!field) continue;
      field.style.height = "auto";
      field.style.height = `${Math.min(field.scrollHeight, field === composer.current ? 144 : 220)}px`;
    }
  }, [topic, message, tutorOpen]);
  useEffect(() => {
    if (pathId || libraryMode) return;
    const params = new URLSearchParams(window.location.search);
    const suggestedTopic = params.get("topic")?.trim();
    if (suggestedTopic) setTopic(suggestedTopic.slice(0, 180));
    const suggestedGoal = params.get("goal");
    if (suggestedGoal && ["fundamentals", "interview", "competitive", "mastery"].includes(suggestedGoal)) setGoal(suggestedGoal);
  }, [pathId, libraryMode]);
  useEffect(() => {
    const savedWidth = Number(window.localStorage.getItem("symm-tutor-width"));
    if (Number.isFinite(savedWidth) && savedWidth >= 300 && savedWidth <= 520)
      setTutorWidth(savedWidth);
  }, []);

  const load = async (lessonId?: string) => {
    try {
      if (pathId) {
        const fetched = await jsonRequest<Detail>(
          `/api/symm?path=${pathId}${lessonId ? `&lesson=${lessonId}` : ""}`,
        );
        setDetail(fetched);
        setLanguage(fetched.path.preferred_language || "cpp");
      } else {
        const fetched = await jsonRequest<Home>("/api/symm");
        setHome(fetched);
        const saved = window.localStorage.getItem(
          `symm-language:${user?.id ?? "guest"}`,
        );
        const choice = saved || fetched.paths[0]?.preferred_language;
        if (choice === "cpp" || choice === "java" || choice === "python")
          setLanguage(choice);
      }
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load Symm AI.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setLoading(true);
    void load();
  }, [pathId, user?.id]);
  useEffect(() => {
    if (pathId) return;
    const params = new URLSearchParams(window.location.search);
    const previousTopic = params.get("topic");
    if (previousTopic) setTopic(previousTopic.slice(0, 180));
    const previousLevel = params.get("level");
    if (["beginner", "intermediate", "advanced"].includes(previousLevel ?? ""))
      setLevel(previousLevel!);
    const previousGoal = params.get("goal");
    if (
      ["fundamentals", "interview", "competitive", "mastery"].includes(
        previousGoal ?? "",
      )
    )
      setGoal(previousGoal!);
  }, [pathId]);
  useEffect(() => {
    if (pathId && selected) void load(selected);
  }, [pathId, selected]);
  useEffect(() => {
    if (detail?.path.status !== "generating") return;
    const interval = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(interval);
  }, [detail?.path.status, pathId]);
  useEffect(() => {
    setReportOpen(false);
    setReportSaved(false);
    setQuestionIndex(0);
    setAnswer("");
  }, [selected]);

  const active = detail?.lessons.find((lesson) => lesson.id === selected);
  const activeModule = detail?.modules.find(
    (module) => module.id === active?.module_id,
  );
  const completedIds = new Set(
    detail?.progress.map((item) => item.lesson_id) ?? [],
  );
  const orderedLessons =
    detail?.modules.flatMap((module) =>
      detail.lessons.filter((lesson) => lesson.module_id === module.id),
    ) ?? [];
  const nextLesson = active
    ? orderedLessons[
        orderedLessons.findIndex((lesson) => lesson.id === active.id) + 1
      ]
    : undefined;
  const visiblePaths = (home?.paths ?? []).filter((path) =>
    `${path.title} ${path.topic}`
      .toLowerCase()
      .includes(librarySearch.trim().toLowerCase()),
  );

  const createPath = async () => {
    if (busy) return;
    if (credits?.available === 0) {
      setCreditsOpen(true);
      return;
    }
    if (topic.trim().length < 3) {
      setError("Describe what you want to learn in at least three characters.");
      composer.current?.focus();
      return;
    }
    setBusy("roadmap");
    setError("");
    try {
      const result = await post<{ pathId: string }>({
        action: "path.generate",
        requestId: crypto.randomUUID(),
        topic: topic.trim(),
        level,
        goal,
        hoursPerWeek: hours,
        language,
      });
      router.push(`/training/symm/${result.pathId}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your path could not be created. Please retry.",
      );
      if (cause instanceof Error && 'code' in cause && cause.code === 'credits_exhausted') setCreditsOpen(true);
    } finally {
      setBusy("");
    }
  };
  const chooseLanguage = async (next: "cpp" | "java" | "python") => {
    if (next === language || busy) return;
    if (!pathId) {
      setLanguage(next);
      window.localStorage.setItem(`symm-language:${user?.id ?? "guest"}`, next);
      return;
    }
    if (!detail) return;
    setBusy("language");
    setError("");
    try {
      await post({ action: "path.language", pathId, language: next });
      setLanguage(next);
      window.localStorage.setItem(`symm-language:${user?.id ?? "guest"}`, next);
      if (
        active?.status === "ready" &&
        active.content?.sections.some((section) => section.code)
      ) {
        const existing = detail.codeVariants?.find(
          (variant) =>
            variant.lesson_id === active.id && variant.language === next,
        );
        const native = active.content.sections.some(
          (section) => section.code && codeLanguage(section.language) === next,
        );
        if (!existing && !native) {
          const result = await post<{
            variant: Detail["codeVariants"][number] | null;
          }>({ action: "code.variant", lessonId: active.id, language: next });
          if (result.variant)
            setDetail((current) =>
              current
                ? {
                    ...current,
                    codeVariants: [
                      ...(current.codeVariants || []),
                      result.variant!,
                    ],
                  }
                : current,
            );
        }
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The code variant could not be prepared. Please retry.",
      );
    } finally {
      setBusy("");
    }
  };
  const retryCodeVariant = async () => {
    if (!active || busy) return;
    setBusy("language");
    setError("");
    try {
      const result = await post<{
        variant: Detail["codeVariants"][number] | null;
      }>({
        action: "code.variant",
        lessonId: active.id,
        language,
      });
      if (result.variant)
        setDetail((current) =>
          current
            ? {
                ...current,
                codeVariants: [
                  ...(current.codeVariants || []).filter(
                    (item) =>
                      item.lesson_id !== active.id ||
                      item.language !== language,
                  ),
                  result.variant!,
                ],
              }
            : current,
        );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The code variant could not be prepared.",
      );
    } finally {
      setBusy("");
    }
  };
  const openLesson = async (lesson: LessonRow) => {
    setSelected(lesson.id);
    setExpanded(lesson.module_id);
    setOutlineOpen(false);
    setError("");
    if (lesson.status === "ready" || busy) return;
    setBusy(`lesson:${lesson.id}`);
    try {
      try {
        await post({ action: "lesson.generate", lessonId: lesson.id });
      } catch (cause) {
        if (
          !(cause instanceof Error) ||
          !cause.message.includes("already generating")
        )
          throw cause;
      }
      for (let attempt = 0; attempt < 24; attempt++) {
        const current = await jsonRequest<Detail>(
          `/api/symm?path=${pathId}&lesson=${lesson.id}`,
        );
        setDetail(current);
        const currentLesson = current.lessons.find(
          (item) => item.id === lesson.id,
        );
        if (currentLesson?.status === "ready") break;
        if (currentLesson?.status === "failed")
          throw new Error(
            "This lesson could not be prepared. Open it again to retry.",
          );
        if (attempt === 23)
          throw new Error(
            "This lesson is still being prepared. You can continue exploring the roadmap.",
          );
        await new Promise((resolve) => window.setTimeout(resolve, 2500));
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "This lesson could not be prepared. Please retry.",
      );
    } finally {
      setBusy("");
    }
  };
  const completeLesson = async () => {
    if (!active || busy) return;
    setBusy("complete");
    setError("");
    try {
      await post({ action: "progress.complete", lessonId: active.id });
      await load(active.id);
      setSuccess("Lesson saved. Your learning progress is up to date.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Progress could not be saved.",
      );
    } finally {
      setBusy("");
    }
  };
  const askTutor = async (text: string) => {
    if (!active || active.status !== "ready" || !text.trim() || busy) return;
    setBusy("tutor");
    setError("");
    setTutorOpen(true);
    try {
      await post({
        action: "tutor.ask",
        lessonId: active.id,
        message: text.trim(),
      });
      setMessage("");
      setAnswer("");
      await load(active.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Symm AI could not reply. Please retry.",
      );
    } finally {
      setBusy("");
    }
  };
  const report = async () => {
    if (!active || reportReason.trim().length < 10 || busy) return;
    setBusy("report");
    setError("");
    try {
      await post({
        action: "lesson.report",
        lessonId: active.id,
        reason: reportReason.trim(),
      });
      setReportSaved(true);
      setReportOpen(false);
      setReportReason("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Feedback could not be saved.",
      );
    } finally {
      setBusy("");
    }
  };
  const claimModule = async (moduleId: string) => {
    setBusy(`claim:${moduleId}`);
    setError("");
    try {
      const result = await post<{ points: number }>({
        action: "module.claim",
        moduleId,
      });
      await load(selected ?? undefined);
      await tracker.refetch();
      if (result.points > 0)
        setSuccess(
          `+${result.points} coins added for accepted module practice.`,
        );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Module reward could not be claimed.",
      );
    } finally {
      setBusy("");
    }
  };
  const retryRecommendations = async (moduleId: string) => {
    setBusy(`recommend:${moduleId}`);
    setError("");
    try {
      await post({ action: "module.recommend", moduleId });
      await load(selected ?? undefined);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Recommendations are unavailable right now.",
      );
    } finally {
      setBusy("");
    }
  };
  useEffect(() => {
    if (!activeModule || detail?.path.category !== "competitive" || busy)
      return;
    if (
      detail.recommendations.some((item) => item.module_id === activeModule.id)
    )
      return;
    if (attemptedRecommendations.current.has(activeModule.id)) return;
    attemptedRecommendations.current.add(activeModule.id);
    void retryRecommendations(activeModule.id);
  }, [activeModule?.id, detail?.path.category, detail?.recommendations, busy]);
  const removePath = async () => {
    if (!deletePath) return;
    setBusy(`delete:${deletePath.id}`);
    setError("");
    try {
      await post({ action: "path.delete", pathId: deletePath.id });
      setDeletePath(null);
      await load();
      setSuccess("Learning path deleted.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Learning path could not be deleted.",
      );
    } finally {
      setBusy("");
    }
  };

  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "";
  const avatarName = String(
    user?.user_metadata?.full_name ?? user?.email ?? "Learner",
  );
  return (
    <div className={`symm-theme min-h-screen font-sans text-[var(--symm-text)] ${!pathId ? "symm-product-shell" : ""} ${pathId || libraryMode ? "bg-[var(--symm-bg)]" : "symm-home-shell"}`}>
      {!libraryMode && (!pathId || detail?.path.status !== "ready") && <LivingField intensity="workspace" active={composerFocused || topic.length > 0} />}
      {!pathId && <SymmSidebar paths={home?.paths ?? []} activeRoute={libraryMode ? "/training/symm/library" : "/training/symm"} />}
      <CreditDialog open={creditsOpen} onOpenChange={setCreditsOpen} credits={credits} />
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-[1700px]">
        <nav
          aria-label="Symm AI navigation"
          className={`flex h-[68px] items-center justify-between gap-3 border-b px-4 sm:px-8 lg:px-10 ${pathId ? "border-[var(--symm-border)]" : "symm-home-nav"}`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/training"
              className="flex size-9 items-center justify-center rounded-lg text-[var(--symm-muted)] transition-colors hover:bg-[var(--symm-surface)] hover:text-[var(--symm-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4]"
              aria-label="Back to Training Gym"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="h-5 w-px bg-[var(--symm-elevated)]" aria-hidden="true" />
            <Link
              href="/training/symm"
              aria-label="Symm AI home"
              className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-.02em]"
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--symm-elevated)]">
                <SymmMark className="size-7 object-contain" />
              </span>
              <span className="hidden sm:inline">Symm AI</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <CreditIndicator credits={credits} onClick={() => setCreditsOpen(true)} compact />
            {billing.data?.tier !== "pro" && billing.data?.tier !== "premium" && (
              <Link href="/pricing" className="symm-upgrade-link">Upgrade to Pro <ArrowRight size={13} /></Link>
            )}
            {pathId || libraryMode ? (
              <Link
                href="/training/symm"
                className="symm-nav-secondary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-[var(--symm-muted)] hover:bg-[var(--symm-surface)] hover:text-[var(--symm-text)]"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Path</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTopic("");
                  setError("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  composer.current?.focus();
                }}
                className="symm-nav-secondary inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-[var(--symm-muted)] hover:bg-[var(--symm-surface)] hover:text-[var(--symm-text)]"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Path</span>
              </button>
            )}
            <Link
              href="/training/symm/library"
              className={`${pathId ? "" : "symm-nav-secondary "}inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-[var(--symm-muted)] hover:bg-[var(--symm-surface)] hover:text-[var(--symm-text)]`}
            >
              <Library size={14} />
              <span className="hidden sm:inline">My Library</span>
            </Link>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={avatarName}
                className="ml-2 hidden size-8 rounded-full object-cover sm:block"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span
                title={avatarName}
                className="ml-2 hidden size-8 items-center justify-center rounded-full border border-[var(--symm-border)] bg-[var(--symm-accent-surface)] text-xs font-medium text-[var(--symm-accent-text)] sm:flex"
              >
                {avatarName[0]?.toUpperCase()}
              </span>
            )}
          </div>
        </nav>

        {!pathId ? (
          <main className={`${libraryMode ? "symm-library-page" : "symm-home-main"} px-4 pb-20 sm:px-8`}>
            {!libraryMode && (
            <div className="symm-home-stage mx-auto max-w-[900px]">
              <div className="symm-home-heading text-center">
                <SymmMark className="symm-home-mark mx-auto rounded-xl object-contain" />
                <h1>Meet SYMM AI.</h1>
                <SymmKineticType className="symm-home-kinetic" />
                <p>One question can become a way forward.</p>
              </div>
              <div className="symm-home-composer">
                <label className="sr-only" htmlFor="symm-topic">
                  What do you want to learn?
                </label>

                <textarea
                  ref={composer}
                  id="symm-topic"
                  value={topic}
                  maxLength={180}
                  aria-describedby="symm-composer-hint"
                  onChange={(event) => setTopic(event.target.value)}
                  onFocus={() => setComposerFocused(true)}
                  onBlur={() => setComposerFocused(false)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      if (topic.trim().length >= 3 && !busy && home?.configured) void createPath();
                    }
                  }}
                  placeholder="I want to understand dynamic programming on grids…"
                  rows={1}
                  className="symm-home-textarea"
                />
                <div className="symm-home-composer-footer">
                  <label className="sr-only" htmlFor="symm-language">Programming language</label>
                  <select id="symm-language" className="symm-home-language-select" value={language} onChange={(event) => void chooseLanguage(event.target.value as "cpp" | "java" | "python")}>
                    <option value="cpp">C++17</option>
                    <option value="java">Java 17</option>
                    <option value="python">Python 3</option>
                  </select>
                  <div className="symm-home-submit-actions">
                    <button
                      type="button"
                      onClick={() => void createPath()}
                      disabled={Boolean(busy) || !home?.configured || topic.trim().length < 3}
                      aria-label="Create learning path"
                      className="symm-home-send"
                    >
                      {busy === "roadmap" ? <LoaderCircle size={19} className="animate-spin" /> : <ArrowUp size={20} />}
                    </button>
                  </div>
                </div>
              </div><div className="symm-customize-separate"><button
                      type="button"
                      onClick={() => setCustomize(!customize)}
                      aria-expanded={customize}
                      aria-controls="symm-customize"
                      className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)] px-3 text-[var(--symm-text)] transition-colors hover:border-[#8c7cae] hover:bg-[var(--symm-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4]"
                    >
                      <span>Customize path</span>
                      <span className="hidden text-[var(--symm-muted)] sm:inline">
                        {level[0].toUpperCase() + level.slice(1)} · {hours}
                        h/week
                      </span>
                      <ChevronDown
                        size={14}
                        className={
                          customize
                            ? "rotate-180 transition-transform"
                            : "transition-transform"
                        }
                      />
                    </button>
                {customize && (
                  <div
                    id="symm-customize"
                    className="mt-4 grid gap-5 border-t border-[var(--symm-border)] pt-5 sm:grid-cols-2"
                  >
                    <fieldset className="min-w-0">
                      <legend className="mb-2 text-xs font-medium text-[var(--symm-text)]">
                        Starting point
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          ["beginner", "intermediate", "advanced"] as const
                        ).map((option) => (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={level === option}
                            onClick={() => setLevel(option)}
                            className={`min-h-9 rounded-md border px-3 text-xs capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4] ${level === option ? "border-[#b8a0f4] bg-[var(--symm-accent-surface)] text-[var(--symm-text)]" : "border-[var(--symm-border)] text-[var(--symm-muted)] hover:text-[var(--symm-text)]"}`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] leading-4 text-[var(--symm-muted)]">
                        Sets how much background each lesson explains.
                      </p>
                    </fieldset>
                    <fieldset className="min-w-0">
                      <legend className="mb-2 text-xs font-medium text-[var(--symm-text)]">
                        Learning goal
                      </legend>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ["fundamentals", "Fundamentals"],
                            ["competitive", "Competitive programming"],
                            ["interview", "Interviews"],
                            ["mastery", "Deep understanding"],
                          ] as const
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={goal === value}
                            onClick={() => setGoal(value)}
                            className={`min-h-9 rounded-md border px-3 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4] ${goal === value ? "border-[#b8a0f4] bg-[var(--symm-accent-surface)] text-[var(--symm-text)]" : "border-[var(--symm-border)] text-[var(--symm-muted)] hover:text-[var(--symm-text)]"}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--symm-border)] pt-4">
                      <label
                        htmlFor="symm-hours"
                        className="text-xs text-[var(--symm-text)]"
                      >
                        Study time{" "}
                        <span className="ml-2 text-[var(--symm-muted)]">
                          {hours} hours each week
                        </span>
                      </label>
                      <input
                        id="symm-hours"
                        type="range"
                        min={1}
                        max={40}
                        step={1}
                        value={hours}
                        onChange={(event) =>
                          setHours(Number(event.target.value))
                        }
                        className="symm-range w-full accent-[#b8a0f4] sm:w-48"
                      />
                    </div>
                  </div>
                )}
              </div>
              <p id="symm-composer-hint" className="mt-3 text-center text-[11px] text-[var(--symm-muted)]">
                Press Enter to create a path · Shift + Enter for a new line
              </p>
              {busy === "roadmap" && (
                <div
                  role="status"
                  className="mt-7 flex items-center gap-3 rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] px-5 py-4 text-sm text-[var(--symm-text)]"
                >
                  <LoaderCircle
                    size={17}
                    className="shrink-0 animate-spin text-[var(--symm-accent-text)]"
                  />
                  <span>
                    <strong className="font-medium text-white">
                      Building your curriculum.
                    </strong>{" "}
                    Mapping concepts and lessons from your learning goal. This
                    can take a moment.
                  </span>
                </div>
              )}
              {!home?.configured && !loading && (
                <p
                  role="status"
                  className="mt-5 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100"
                >
                  Generation is temporarily unavailable. You can still open
                  saved paths; try again when the AI service is ready.
                </p>
              )}
              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-200"
                >
                  {error}{" "}
                  <button
                    onClick={() => setError("")}
                    className="ml-2 underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {success && (
                <p
                  role="status"
                  className="mt-5 rounded-lg border border-[#b8a0f4]/30 bg-[var(--symm-accent-surface)] p-3 text-sm text-[var(--symm-accent-text)]"
                >
                  {success}
                </p>
              )}
              <div
                aria-label="Suggested topics"
                className="mt-7 flex flex-wrap justify-center gap-2"
              >
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => {
                      setTopic(`Teach me ${suggestion} from the fundamentals.`);
                      composer.current?.focus();
                    }}
                    className="rounded-full border border-[var(--symm-border)] px-3.5 py-2 text-[12px] text-[var(--symm-muted)] transition-colors duration-150 hover:border-[#b8a0f4] hover:bg-[var(--symm-elevated)] hover:text-[var(--symm-text)]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            )}
            {libraryMode && (
            <div className="symm-library-layout">
            <section
              id="library"
              className="symm-library-content min-w-0"
            >
              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[.16em] text-[var(--symm-muted)]">
                    YOUR WORKSPACE
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-[-.04em]">
                    My Library
                  </h1>
                  <p className="mt-2 text-sm text-[var(--symm-muted)]">Pick up where you left off.</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--symm-muted)]"
                  />
                  <label htmlFor="symm-search" className="sr-only">
                    Search learning paths
                  </label>
                  <input
                    id="symm-search"
                    autoFocus
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    placeholder="Search your library"
                    className="h-9 w-full rounded-lg border border-[var(--symm-border)] bg-[var(--symm-surface)] pl-9 pr-3 text-xs outline-none focus:border-[#b8a0f4]"
                  />
                </div>
              </div>
              {loading ? (
                <p
                  role="status"
                  className="flex items-center gap-2 py-8 text-sm text-[var(--symm-muted)]"
                >
                  <LoaderCircle size={16} className="animate-spin" />
                  Loading paths…
                </p>
              ) : visiblePaths.length ? (
                <div className="symm-library-list grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {visiblePaths.map((path) => (
                    <div
                      key={path.id}
                      className="symm-library-card group flex min-w-0 flex-col gap-5 rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] p-5"
                    >
                      <Link
                        href={`/training/symm/${path.id}`}
                        className="min-w-0 flex-1 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4]"
                      >
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="truncate text-sm font-medium group-hover:text-[var(--symm-accent-text)]">
                            {path.title}
                          </span>
                          <span className="text-[11px] text-[var(--symm-muted)]">
                            {path.moduleCount ?? 0} modules
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[var(--symm-muted)]">
                          {path.status === "ready"
                            ? `${percent(path.completedCount ?? 0, path.lessonCount ?? 0)}% complete`
                            : path.status === "failed"
                              ? "Generation failed"
                              : "Preparing"}{" "}
                          · Updated {dateLabel(path.updated_at)}
                        </p>
                        <div className="mt-2 max-w-[220px]">
                          <ProgressBar
                            value={percent(
                              path.completedCount ?? 0,
                              path.lessonCount ?? 0,
                            )}
                            label={`${path.title} completion`}
                          />
                        </div>
                      </Link>
                      <div className="flex items-center justify-between border-t border-[var(--symm-border)] pt-3"><Link
                        href={`/training/symm/${path.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[var(--symm-accent-text)]"
                      >
                        Continue <ArrowRight size={14} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeletePath(path)}
                        aria-label={`Delete ${path.title}`}
                        className="flex size-9 items-center justify-center rounded-lg text-[var(--symm-muted)] hover:bg-[var(--symm-elevated)] hover:text-rose-200"
                      >
                        <Trash2 size={15} />
                      </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-7 text-sm text-[var(--symm-muted)]">
                  {librarySearch
                    ? "No paths match your search."
                    : "Your courses will appear here after you create your first path."}
                </p>
              )}
            </section>
            </div>
            )}
          </main>
        ) : (
          <main className="px-4 pb-16 sm:px-6 lg:px-8">
            {loading && !detail ? (
              <p
                role="status"
                className="flex items-center gap-2 py-12 text-sm text-[var(--symm-muted)]"
              >
                <LoaderCircle size={17} className="animate-spin" />
                Loading learning path…
              </p>
            ) : detail && detail.path.status !== "ready" ? (
              <section
                className="mx-auto max-w-[780px] py-20"
                role="status"
                aria-live="polite"
              >
                <p className="text-xs uppercase tracking-[.18em] text-[var(--symm-accent-text)]">
                  Symm AI
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                  {detail?.path.title ?? "Preparing your learning path"}
                </h1>
                {detail?.path.status === "failed" ? (
                  <>
                    <p className="mt-4 text-sm text-[var(--symm-muted)]">
                      The curriculum could not be completed. Your request is
                      saved.
                    </p>
                    <button
                      type="button"
                      disabled={Boolean(busy)}
                      onClick={async () => {
                        if (!pathId) return;
                        if (credits?.available === 0) {
                          setCreditsOpen(true);
                          return;
                        }
                        setBusy("retry");
                        setError("");
                        try {
                          await post({ action: "path.retry", pathId });
                          await load();
                        } catch (cause) {
                          setError(
                            cause instanceof Error
                              ? cause.message
                              : "Could not resume generation.",
                          );
                          if (cause instanceof Error && 'code' in cause && cause.code === 'credits_exhausted') setCreditsOpen(true);
                        } finally {
                          setBusy("");
                        }
                      }}
                      className="mt-6 rounded-lg bg-[#cdbbf7] px-4 py-2.5 text-sm font-medium text-[#19151e] disabled:opacity-50"
                    >
                      Retry generation
                    </button>
                  </>
                ) : (
                  <>
                    <p className="mt-4 flex items-center gap-2 text-sm text-[var(--symm-muted)]">
                      <LoaderCircle size={16} className="animate-spin" />{" "}
                      Mapping concepts and building your curriculum. This page
                      updates when it is ready.
                    </p>
                    <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-[var(--symm-elevated)]">
                      <div className="h-full w-1/3 animate-pulse rounded-full bg-[#b8a0f4]" />
                    </div>
                  </>
                )}
                {error && (
                  <p role="alert" className="mt-5 text-sm text-rose-200">
                    {error}
                  </p>
                )}
              </section>
            ) : detail ? (
              <>
                <header className="mx-auto max-w-[1380px] border-b border-[var(--symm-border)] py-7 sm:py-9">
                  <Link
                    href="/training/symm/library"
                    className="inline-flex items-center gap-1.5 text-xs text-[var(--symm-muted)] hover:text-[var(--symm-text)]"
                  >
                    <ArrowLeft size={13} /> My Library
                  </Link>
                  <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
                    <div className="max-w-[760px]">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-[.16em] text-[var(--symm-accent-text)]">
                        Learning path · {detail.path.level}
                      </p>
                      <h1 className="text-[clamp(1.9rem,3.3vw,3rem)] font-semibold leading-tight tracking-[-.045em]">
                        {detail.path.title}
                      </h1>
                      <p className="mt-3 max-w-[650px] text-sm leading-6 text-[var(--symm-muted)]">
                        {detail.path.description}
                      </p>
                      <p className="mt-3 text-xs text-[var(--symm-muted)]">{detail.modules.length} modules · {detail.lessons.length} lessons · About {Math.round(detail.path.estimated_minutes / 60)} hours</p>
                      {detail.path.prerequisites.length > 0 && <p className="mt-2 text-xs text-[var(--symm-muted)]">Before you begin: {detail.path.prerequisites.join(" · ")}</p>}
                      <div role="group" aria-label="Code language" className="mt-5 inline-flex rounded-lg border border-[var(--symm-border)] bg-[var(--symm-surface)] p-1">
                        {(["cpp", "java", "python"] as const).map((option) => <button key={option} type="button" onClick={() => void chooseLanguage(option)} aria-pressed={language === option} className={`rounded-md px-3 py-1.5 text-xs transition-colors ${language === option ? "bg-[#b8a0f4] text-[#17131f]" : "text-[var(--symm-muted)] hover:text-[var(--symm-text)]"}`}>{option === "cpp" ? "C++17" : option === "java" ? "Java 17" : "Python 3"}</button>)}
                      </div>
                      <Link href={`/training/symm?topic=${encodeURIComponent(detail.path.topic)}&level=${detail.path.level}&goal=${detail.path.goal}`} className="ml-4 inline-flex items-center gap-1 text-xs text-[var(--symm-accent-text)] hover:text-[var(--symm-text)]">Create another version <ArrowRight size={12} /></Link>
                    </div>
                  </div>
                </header>
                {error && (
                  <div
                    role="alert"
                    className="mx-auto mt-5 max-w-[1380px] rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-sm text-rose-200"
                  >
                    {error}{" "}
                    <button
                      onClick={() => setError("")}
                      className="ml-2 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                {success && (
                  <div
                    role="status"
                    className="mx-auto mt-5 max-w-[1380px] rounded-lg border border-[#b8a0f4]/30 bg-[var(--symm-accent-surface)] p-3 text-sm text-[var(--symm-accent-text)]"
                  >
                    {success}
                  </div>
                )}
                <div
                  className={`symm-workspace-grid mx-auto mt-7 grid max-w-[1380px] gap-6 lg:grid-cols-[248px_minmax(0,1fr)] ${selected && tutorOpen ? "symm-workspace-grid--tutor" : ""}`}
                  style={
                    { "--symm-tutor-width": `${tutorWidth}px` } as CSSProperties
                  }
                >
                  <aside
                    className={`${outlineOpen ? "fixed inset-0 z-40 flex bg-black/70 p-3" : "hidden"} lg:sticky lg:top-5 lg:block lg:self-start`}
                  >
                    <div className="flex max-h-[90vh] w-[min(330px,90vw)] flex-col overflow-hidden rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] lg:max-h-[calc(100vh-2.5rem)] lg:w-auto">
                      <div className="flex items-center justify-between border-b border-[var(--symm-border)] px-4 py-3">
                        <h2 className="text-xs font-semibold uppercase tracking-[.12em] text-[var(--symm-muted)]">
                          Curriculum
                        </h2>
                        <button
                          className="lg:hidden"
                          aria-label="Close curriculum"
                          onClick={() => setOutlineOpen(false)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                      <div className="overflow-y-auto p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(null);
                            setOutlineOpen(false);
                          }}
                          className={`mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs ${!selected ? "bg-[var(--symm-accent-surface)] text-[var(--symm-accent-text)]" : "text-[var(--symm-muted)] hover:bg-[var(--symm-elevated)]"}`}
                        >
                          <Library size={14} /> Course overview
                        </button>
                        <ol>
                          {detail.modules.map((module, index) => {
                            const moduleLessons = detail.lessons.filter(
                              (lesson) => lesson.module_id === module.id,
                            );
                            const done = moduleLessons.filter((lesson) =>
                              completedIds.has(lesson.id),
                            ).length;
                            const isOpen = expanded === module.id;
                            return (
                              <li
                                key={module.id}
                                className="border-t border-[var(--symm-border)]"
                              >
                                <button
                                  onClick={() =>
                                    setExpanded(isOpen ? null : module.id)
                                  }
                                  aria-expanded={isOpen}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-3 text-left text-xs hover:bg-[var(--symm-elevated)]"
                                >
                                  <span
                                    className={`flex size-7 shrink-0 items-center justify-center rounded-md font-mono text-[11px] ${done === moduleLessons.length && done > 0 ? "bg-[var(--symm-accent-surface)] text-[var(--symm-accent-text)]" : "bg-[var(--symm-elevated)] text-[var(--symm-muted)]"}`}
                                  >
                                    {done === moduleLessons.length &&
                                    done > 0 ? (
                                      <Check size={14} />
                                    ) : (
                                      String(index + 1).padStart(2, "0")
                                    )}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate font-medium text-[var(--symm-text)]">
                                      {module.title}
                                    </span>
                                    <span className="mt-0.5 block text-[10px] text-[var(--symm-muted)]">
                                      {done}/{moduleLessons.length} lessons
                                    </span>
                                  </span>
                                  {isOpen ? (
                                    <ChevronDown size={13} />
                                  ) : (
                                    <ChevronRight size={13} />
                                  )}
                                </button>
                                <div
                                  className={`grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                                >
                                  <ol className="overflow-hidden pb-2 pl-7">
                                    {moduleLessons.map((lesson) => (
                                      <li key={lesson.id}>
                                        <button
                                          onClick={() =>
                                            void openLesson(lesson)
                                          }
                                          className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-[11px] leading-4 ${selected === lesson.id ? "bg-[var(--symm-accent-surface)] text-[var(--symm-accent-text)]" : "text-[var(--symm-muted)] hover:bg-[var(--symm-elevated)] hover:text-[var(--symm-text)]"}`}
                                        >
                                          {completedIds.has(lesson.id) ? (
                                            <Check
                                              size={13}
                                              className="mt-0.5 shrink-0"
                                            />
                                          ) : (
                                            <BookOpen
                                              size={13}
                                              className="mt-0.5 shrink-0"
                                            />
                                          )}
                                          {lesson.title}
                                        </button>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </div>
                  </aside>
                  <div className="min-w-0">
                    <button
                      onClick={() => setOutlineOpen(true)}
                      className="mb-4 inline-flex items-center gap-2 rounded-lg border border-[var(--symm-border)] px-3 py-2 text-xs text-[var(--symm-text)] lg:hidden"
                    >
                      <Menu size={15} /> Curriculum
                    </button>
                    {!selected ? (
                      <div className="space-y-7">
                        <section className="symm-course-progress" aria-label="Course progress">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {avatarUrl ? <img src={avatarUrl} alt="" referrerPolicy="no-referrer" className="size-11 rounded-full object-cover" /> : <span className="flex size-11 items-center justify-center rounded-full bg-[var(--symm-accent-surface)] text-sm">{avatarName[0]?.toUpperCase()}</span>}
                              <div><p className="text-base font-medium">Welcome back, {avatarName.split(" ")[0]}.</p><p className="text-xs text-[var(--symm-muted)]">Your next lesson is ready when you are.</p></div>
                            </div>
                            <button onClick={() => { const next = orderedLessons.find((lesson) => !completedIds.has(lesson.id)) ?? orderedLessons[0]; if (next) void openLesson(next); }} className="rounded-lg bg-[#b8a0f4] px-4 py-2.5 text-xs font-semibold text-[#17131f] hover:bg-[#d4c3ff]">Continue learning <ArrowRight size={14} className="ml-1 inline" /></button>
                          </div>
                          <div className="mt-7 flex justify-between text-xs"><span>{completedIds.size} of {orderedLessons.length} lessons complete</span><span className="font-medium tabular-nums">{percent(completedIds.size, orderedLessons.length)}%</span></div>
                          <div className="symm-course-progress-track mt-2" role="progressbar" aria-valuenow={percent(completedIds.size, orderedLessons.length)} aria-valuemin={0} aria-valuemax={100} aria-label="Course completion"><span style={{ width: `${percent(completedIds.size, orderedLessons.length)}%` }} /></div>
                          <div className="mt-2 flex justify-between text-[11px] text-[var(--symm-muted)]"><span>First lesson</span><span>Course complete</span></div>
                        </section>
                        <section
                          aria-label="Learning roadmap"
                          className="symm-roadmap"
                        >
                          <h2 className="mb-6 text-lg font-medium">
                            The roadmap
                          </h2>
                          <ol className="symm-roadmap-grid grid gap-3">
                            {detail.modules.map((module, index) => {
                              const moduleLessons = detail.lessons.filter(
                                (lesson) => lesson.module_id === module.id,
                              );
                              const done = moduleLessons.filter((lesson) =>
                                completedIds.has(lesson.id),
                              ).length;
                              const finished =
                                done === moduleLessons.length && done > 0;
                              return (
                                <li
                                  key={module.id}
                                  className="symm-roadmap-column relative min-w-0"
                                  data-complete={finished}
                                  style={{ "--module-index": index } as CSSProperties}
                                >
                                  <span
                                    className={`absolute left-5 top-5 z-10 flex size-[29px] items-center justify-center rounded-full border bg-[var(--symm-bg)] font-mono text-[10px] ${finished ? "border-[#b8a0f4] text-[var(--symm-accent-text)]" : "border-[var(--symm-border)] text-[var(--symm-muted)]"}`}
                                  >
                                    {finished ? (
                                      <Check size={14} />
                                    ) : (
                                      String(index + 1).padStart(2, "0")
                                    )}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setExpanded(
                                        expanded === module.id
                                          ? null
                                          : module.id,
                                      )
                                    }
                                    aria-expanded={expanded === module.id}
                                    className="symm-roadmap-card w-full rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] p-5 pl-16 text-left transition-colors hover:border-[#6d5c8c]"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="text-[10px] uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                        Module{" "}
                                        {String(index + 1).padStart(2, "0")}
                                      </span>
                                      <span className="flex items-center gap-1 text-[11px] text-[var(--symm-muted)]">
                                        <Clock3 size={12} />{" "}
                                        {module.estimated_minutes} min ·{" "}
                                        {moduleLessons.length} lessons
                                      </span>
                                    </div>
                                    <h3 className="mt-2 text-[16px] font-medium">
                                      {module.title}
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-[var(--symm-muted)]">
                                      {module.description}
                                    </p>
                                    <div className="mt-4 flex items-center gap-3">
                                      <div className="w-28">
                                        <ProgressBar
                                          value={percent(
                                            done,
                                            moduleLessons.length,
                                          )}
                                          label={`${module.title} progress`}
                                        />
                                      </div>
                                      <span className="text-[11px] text-[var(--symm-muted)]">
                                        {done}/{moduleLessons.length} completed
                                      </span>
                                      <ChevronDown
                                        size={14}
                                        className={`ml-auto transition-transform ${expanded === module.id ? "rotate-180" : ""}`}
                                      />
                                    </div>
                                  </button>
                                  {expanded === module.id && (
                                    <div className="mt-2 space-y-1 rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] p-2">
                                      {moduleLessons.map(
                                        (lesson, lessonIndex) => (
                                          <button
                                            key={lesson.id}
                                            onClick={() =>
                                              void openLesson(lesson)
                                            }
                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-[var(--symm-text)] hover:bg-[var(--symm-elevated)]"
                                          >
                                            <span className="font-mono text-[var(--symm-muted)]">
                                              {String(lessonIndex + 1).padStart(
                                                2,
                                                "0",
                                              )}
                                            </span>
                                            <span className="flex-1">
                                              {lesson.title}
                                            </span>
                                            {completedIds.has(lesson.id) ? (
                                              <Check
                                                size={14}
                                                className="text-[var(--symm-accent-text)]"
                                              />
                                            ) : (
                                              <ArrowRight size={13} />
                                            )}
                                          </button>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ol>
                        </section>
                      </div>
                    ) : (
                      active && (
                        <article className="mx-auto max-w-[830px] rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] px-5 py-6 sm:px-8 sm:py-9">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                Module{" "}
                                {String(
                                  (activeModule?.position ?? 0) + 1,
                                ).padStart(2, "0")}{" "}
                                · Lesson{" "}
                                {String(active.position + 1).padStart(2, "0")}
                              </p>
                              <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.3rem)] font-semibold tracking-[-.04em]">
                                {active.title}
                              </h2>
                              <p className="mt-2 text-[12px] text-[var(--symm-muted)]">
                                Generated by Symm AI · Read, question, and
                                practice at your own pace.
                              </p>
                            </div>
                            <button
                              onClick={() => setTutorOpen(true)}
                              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)] px-3 py-2 text-xs font-medium text-[var(--symm-text)] transition-colors hover:border-[#a28ac8] hover:bg-[var(--symm-accent-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4]"
                            >
                              <SymmMark className="size-6 object-contain" /> Ask
                              tutor
                            </button>
                          </div>
                          {active.status === "ready" && active.content ? (
                            <div className="mt-8">
                              <div className="mb-7 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--symm-border)] pb-5">
                                <span className="text-xs text-[var(--symm-muted)]">
                                  Code language
                                </span>
                                <div
                                  role="group"
                                  aria-label="Lesson code language"
                                  className="inline-flex rounded-lg border border-[var(--symm-border)] bg-[var(--symm-bg)] p-0.5"
                                >
                                  {(["cpp", "java", "python"] as const).map(
                                    (option) => (
                                      <button
                                        key={option}
                                        type="button"
                                        aria-pressed={language === option}
                                        disabled={Boolean(busy)}
                                        onClick={() =>
                                          void chooseLanguage(option)
                                        }
                                        className={`rounded-md px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${language === option ? "bg-[#b8a0f4] text-[#18151f]" : "text-[var(--symm-muted)] hover:text-[var(--symm-text)]"}`}
                                      >
                                        {option === "cpp"
                                          ? "C++"
                                          : option === "java"
                                            ? "Java"
                                            : "Python"}
                                      </button>
                                    ),
                                  )}
                                </div>
                              </div>
                              {busy === "language" && (
                                <p
                                  role="status"
                                  className="mb-4 text-xs text-[var(--symm-muted)]"
                                >
                                  Preparing the selected code language…
                                </p>
                              )}
                              {active.content.sections.some(
                                (section) => section.code,
                              ) &&
                                !active.content.sections.some(
                                  (section) =>
                                    section.code &&
                                    codeLanguage(section.language) === language,
                                ) &&
                                !detail.codeVariants?.some(
                                  (variant) =>
                                    variant.lesson_id === active.id &&
                                    variant.language === language,
                                ) &&
                                busy !== "language" && (
                                  <button
                                    type="button"
                                    onClick={() => void retryCodeVariant()}
                                    className="mb-5 rounded-lg border border-[var(--symm-border)] px-3 py-2 text-xs text-[var(--symm-accent-text)] hover:bg-[var(--symm-accent-surface)]"
                                  >
                                    Prepare{" "}
                                    {language === "cpp"
                                      ? "C++"
                                      : language === "java"
                                        ? "Java"
                                        : "Python"}{" "}
                                    code{" "}
                                    <ArrowRight
                                      size={13}
                                      className="ml-1 inline"
                                    />
                                  </button>
                                )}
                              <div className="rounded-lg border-l-2 border-[#b8a0f4] bg-[var(--symm-accent-surface)]/40 px-4 py-3">
                                <p className="text-[10px] font-medium uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                  Learning objective
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--symm-text)]">
                                  {activeModule?.objectives?.[0] ??
                                    `Understand ${active.title} and explain it in your own words.`}
                                </p>
                              </div>
                              <div className="mt-8">
                                <RichText>
                                  {active.content.introduction}
                                </RichText>
                              </div>
                              {active.content.workedExample && (
                                <section className="mt-8 rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)] p-5">
                                  <p className="text-[10px] font-medium uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                    Worked example
                                  </p>
                                  <h3 className="mt-3 text-base font-medium">
                                    {active.content.workedExample.problem}
                                  </h3>
                                  <div className="mt-4">
                                    <RichText>
                                      {active.content.workedExample.walkthrough}
                                    </RichText>
                                  </div>
                                </section>
                              )}
                              {/grid/i.test(
                                `${detail.path.title} ${active.title}`,
                              ) &&
                                /grid|path/i.test(active.title) && (
                                  <GridDiagram />
                                )}
                              {active.content.sections.map((section, index) => (
                                <section
                                  key={index}
                                  className="mt-9 border-t border-[var(--symm-border)] pt-7"
                                >
                                  <p className="text-[10px] font-mono text-[var(--symm-accent-text)]">
                                    {String(index + 1).padStart(2, "0")}
                                  </p>
                                  <h3 className="mt-2 text-lg font-semibold tracking-[-.02em]">
                                    {section.heading}
                                  </h3>
                                  <div className="mt-4">
                                    <RichText>{section.explanation}</RichText>
                                  </div>
                                  {section.example && (
                                    <div className="mt-5 rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)] p-4">
                                      <p className="mb-2 text-[10px] uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                        Worked example
                                      </p>
                                      <RichText>{section.example}</RichText>
                                    </div>
                                  )}
                                  {section.code &&
                                    codeLanguage(section.language) ===
                                      language &&
                                    !detail.codeVariants?.some(
                                      (variant) =>
                                        variant.lesson_id === active.id &&
                                        variant.language === language,
                                    ) && (
                                      <CodeExample
                                        code={section.code}
                                        language={section.language}
                                      />
                                    )}
                                </section>
                              ))}
                              {detail.codeVariants
                                ?.filter(
                                  (variant) =>
                                    variant.lesson_id === active.id &&
                                    variant.language === language,
                                )
                                .map((variant) => (
                                  <section
                                    key={variant.language}
                                    className="mt-9 border-t border-[var(--symm-border)] pt-7"
                                  >
                                    <h3 className="text-lg font-semibold">
                                      Implementation in{" "}
                                      {language === "cpp"
                                        ? "C++17"
                                        : language === "java"
                                          ? "Java 17"
                                          : "Python 3"}
                                    </h3>
                                    <CodeExample
                                      code={variant.code_content}
                                      language={variant.language}
                                    />
                                    <RichText>{variant.explanation}</RichText>
                                  </section>
                                ))}
                              {active.content.commonMistakes?.length ? (
                                <section className="mt-9 border-t border-[var(--symm-border)] pt-7">
                                  <h3 className="text-base font-medium">
                                    Common mistakes
                                  </h3>
                                  <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--symm-muted)]">
                                    {active.content.commonMistakes.map(
                                      (mistake, index) => (
                                        <li key={index}>{mistake}</li>
                                      ),
                                    )}
                                  </ul>
                                </section>
                              ) : null}
                              <section className="mt-9 border-t border-[var(--symm-border)] pt-7">
                                <p className="text-[10px] uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                  Knowledge check
                                </p>
                                <h3 className="mt-2 text-lg font-medium">
                                  Explain it in your own words
                                </h3>
                                <div className="mt-4 rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)] p-4">
                                  <p className="text-sm leading-6">
                                    {active.content.questions[questionIndex] ??
                                      active.content.questions[0]}
                                  </p>
                                  <p className="mt-2 text-[11px] text-[var(--symm-muted)]">
                                    Question {questionIndex + 1} of{" "}
                                    {active.content.questions.length}
                                  </p>
                                  <label
                                    htmlFor="symm-answer"
                                    className="sr-only"
                                  >
                                    Your answer
                                  </label>
                                  <textarea
                                    id="symm-answer"
                                    value={answer}
                                    maxLength={1400}
                                    onChange={(event) =>
                                      setAnswer(event.target.value)
                                    }
                                    rows={3}
                                    placeholder="Write your reasoning here…"
                                    className="mt-4 w-full resize-y rounded-lg border border-[var(--symm-border)] bg-[var(--symm-surface)] p-3 text-sm outline-none focus:border-[#b8a0f4]"
                                  />
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                    <button
                                      onClick={() => {
                                        setQuestionIndex(
                                          (questionIndex + 1) %
                                            active.content!.questions.length,
                                        );
                                        setAnswer("");
                                      }}
                                      disabled={
                                        active.content.questions.length < 2
                                      }
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)] px-3 py-2 text-xs font-medium text-[var(--symm-text)] transition-colors hover:border-[#b8a0f4] hover:bg-[var(--symm-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      Next question <ArrowRight size={13} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        void askTutor(
                                          `Knowledge check: ${active.content!.questions[questionIndex]}\nMy answer: ${answer}`,
                                        )
                                      }
                                      disabled={!answer.trim() || Boolean(busy)}
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#cdbbf7] px-3 py-2 text-xs font-medium text-[#19151e] transition-colors hover:bg-[#e0d3ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f8f7fc] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Check with Symm AI{" "}
                                      <ArrowRight size={13} />
                                    </button>
                                  </div>
                                </div>
                              </section>
                              <section className="mt-9 border-t border-[var(--symm-border)] pt-7">
                                <h3 className="text-base font-medium">
                                  Key takeaways
                                </h3>
                                <ul className="mt-4 space-y-2">
                                  {active.content.takeaways.map(
                                    (takeaway, index) => (
                                      <li
                                        key={index}
                                        className="flex gap-3 text-sm leading-6 text-[var(--symm-muted)]"
                                      >
                                        <Check
                                          size={15}
                                          className="mt-1 shrink-0 text-[var(--symm-accent-text)]"
                                        />
                                        {takeaway}
                                      </li>
                                    ),
                                  )}
                                </ul>
                              </section>
                              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--symm-border)] pt-6">
                                <div>
                                  <button
                                    onClick={() => setReportOpen(!reportOpen)}
                                    className="text-[11px] text-[var(--symm-muted)] underline underline-offset-4 hover:text-[var(--symm-text)]"
                                  >
                                    Report an issue with this lesson
                                  </button>
                                  {reportSaved && (
                                    <span
                                      role="status"
                                      className="ml-2 text-[11px] text-[var(--symm-accent-text)]"
                                    >
                                      Feedback saved
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() =>
                                    completedIds.has(active.id)
                                      ? nextLesson &&
                                        void openLesson(nextLesson)
                                      : void completeLesson()
                                  }
                                  disabled={
                                    Boolean(busy) ||
                                    (completedIds.has(active.id) && !nextLesson)
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-[#cdbbf7] px-4 py-2.5 text-sm font-medium text-[#19151e] hover:bg-[#e0d3ff] disabled:opacity-50"
                                >
                                  {busy === "complete" ? (
                                    <LoaderCircle
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : completedIds.has(active.id) ? (
                                    nextLesson ? (
                                      "Next lesson"
                                    ) : (
                                      "Course complete"
                                    )
                                  ) : (
                                    "Complete lesson"
                                  )}
                                  <ArrowRight size={15} />
                                </button>
                              </div>
                              {reportOpen && (
                                <div className="mt-4 rounded-lg border border-[var(--symm-border)] p-4">
                                  <label
                                    htmlFor="symm-report"
                                    className="text-xs text-[var(--symm-muted)]"
                                  >
                                    What should we improve?
                                  </label>
                                  <textarea
                                    id="symm-report"
                                    value={reportReason}
                                    onChange={(event) =>
                                      setReportReason(event.target.value)
                                    }
                                    rows={3}
                                    className="mt-2 w-full rounded-lg border border-[var(--symm-border)] bg-[var(--symm-surface)] p-3 text-sm outline-none focus:border-[#b8a0f4]"
                                  />
                                  <button
                                    onClick={() => void report()}
                                    disabled={
                                      reportReason.trim().length < 10 ||
                                      Boolean(busy)
                                    }
                                    className="mt-2 rounded-lg bg-[var(--symm-accent-surface)] px-3 py-2 text-xs text-[var(--symm-accent-text)] disabled:opacity-50"
                                  >
                                    Send feedback
                                  </button>
                                </div>
                              )}
                              <p className="mt-4 text-[11px] text-[var(--symm-muted)]">
                                Lesson completion records study progress. Coins
                                requires an eligible accepted solve.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-8 rounded-xl border border-dashed border-[var(--symm-border)] bg-[var(--symm-surface)] p-8 text-center">
                              {busy === `lesson:${active.id}` ? (
                                <LoaderCircle
                                  size={24}
                                  className="mx-auto animate-spin text-[var(--symm-accent-text)]"
                                />
                              ) : (
                                <BookOpen
                                  size={24}
                                  className="mx-auto text-[var(--symm-accent-text)]"
                                />
                              )}
                              <h3 className="mt-3 text-sm font-medium">
                                {active.status === "failed" &&
                                busy !== `lesson:${active.id}`
                                  ? "This lesson needs another attempt"
                                  : "Preparing your lesson"}
                              </h3>
                              <p className="mt-2 text-xs text-[var(--symm-muted)]">
                                {busy === `lesson:${active.id}`
                                  ? "Building the explanation and examples. Your lesson will open automatically."
                                  : "Lessons are generated when you open them and saved for later."}
                              </p>
                              {active.status === "failed" &&
                                busy !== `lesson:${active.id}` && (
                                  <button
                                    onClick={() => void openLesson(active)}
                                    disabled={
                                      Boolean(busy) || !detail.configured
                                    }
                                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#cdbbf7] px-4 py-2 text-xs font-medium text-[#19151e] transition-colors hover:bg-[#e0d3ff] disabled:opacity-50"
                                  >
                                    Try preparing again <ArrowRight size={14} />
                                  </button>
                                )}
                              {!detail.configured && (
                                <p className="mt-3 text-xs text-amber-200">
                                  The AI service is unavailable. Try again
                                  later.
                                </p>
                              )}
                            </div>
                          )}
                        </article>
                      )
                    )}
                    {active &&
                      activeModule &&
                      detail.path.category === "competitive" && (
                        <section className="mx-auto mt-6 max-w-[830px] rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] p-5 sm:p-7">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-[.14em] text-[var(--symm-accent-text)]">
                                Apply what you learned
                              </p>
                              <h3 className="mt-2 text-lg font-medium">
                                Practice problems
                              </h3>
                            </div>
                            <span className="text-[11px] text-[var(--symm-muted)]">
                              Total solves update after sync
                            </span>
                          </div>
                          {detail.recommendations.filter(
                            (item) =>
                              item.module_id === activeModule.id &&
                              item.problems,
                          ).length ? (
                            <div className="mt-4 divide-y divide-[#34343f]">
                              {detail.recommendations
                                .filter(
                                  (item) =>
                                    item.module_id === activeModule.id &&
                                    item.problems,
                                )
                                .map((item) => {
                                  const problem = item.problems!;
                                  const reward = chakraFor(
                                    problem.provider,
                                    problem.cf_rating ??
                                      problem.lc_difficulty ??
                                      undefined,
                                  );
                                  const verified = tracker.data?.solves.some(
                                    (solve) => solve.problemId === problem.id,
                                  );
                                  return (
                                    <a
                                      key={problem.id}
                                      href={problem.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex flex-wrap items-center gap-3 py-3 text-xs hover:text-[var(--symm-accent-text)]"
                                    >
                                      <span className="min-w-0 flex-1">
                                        <span className="mr-2 text-[var(--symm-muted)]">
                                          {problem.provider}
                                        </span>
                                        {problem.title}
                                      </span>
                                      <span className="text-[var(--symm-muted)]">
                                        {problem.cf_rating ??
                                          problem.lc_difficulty}
                                      </span>
                                      {verified && (
                                        <span className="text-[var(--symm-accent-text)]">
                                          Verified
                                        </span>
                                      )}
                                      {reward &&
                                        problem.provider === "codeforces" && (
                                          <span className="inline-flex items-center gap-1 text-[var(--symm-muted)]">
                                            <ChakraMark className="size-3" />
                                            {reward}
                                          </span>
                                        )}
                                      <ExternalLink size={13} />
                                    </a>
                                  );
                                })}
                            </div>
                          ) : (
                            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[var(--symm-muted)]">
                              No matching catalog problems yet.
                              <button
                                onClick={() =>
                                  void retryRecommendations(activeModule.id)
                                }
                                disabled={Boolean(busy)}
                                className="text-[var(--symm-accent-text)] underline disabled:opacity-50"
                              >
                                Search catalog again
                              </button>
                            </div>
                          )}
                          <div className="mt-5 flex gap-5 border-t border-[var(--symm-border)] pt-4 text-[11px] text-[var(--symm-muted)]">
                            <a
                              href="https://usaco.guide/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[var(--symm-text)]"
                            >
                              USACO Guide ↗
                            </a>
                            <a
                              href="https://youkn0wwho.academy/topic-list"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[var(--symm-text)]"
                            >
                              YouKn0wWho Academy ↗
                            </a>
                          </div>
                        </section>
                      )}
                    {detail.path.category === "competitive" && (
                      <section className="mx-auto mt-6 max-w-[830px] rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] p-5 sm:p-6">
                        <div className="flex items-center gap-2">
                          <ChakraMark className="size-5" />
                          <h3 className="text-sm font-medium">
                            Module rewards
                          </h3>
                          <span className="ml-auto text-[11px] text-[var(--symm-accent-text)]">
                            25 Coins each
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[var(--symm-muted)]">
                          Complete the lessons and one new eligible verified
                          practice solve in the module. Each solve can support
                          one module reward.
                        </p>
                        <div className="mt-4 divide-y divide-[#34343f]">
                          {detail.modules.map((module) => {
                            const lessons = detail.lessons.filter(
                              (lesson) => lesson.module_id === module.id,
                            );
                            const done =
                              lessons.length > 0 &&
                              lessons.every((lesson) =>
                                completedIds.has(lesson.id),
                              );
                            const awarded = detail.moduleAwards.some(
                              (award) => award.module_id === module.id,
                            );
                            const practiceIds = detail.recommendations
                              .filter((item) => item.module_id === module.id)
                              .map((item) => item.problems?.id);
                            const eligible = tracker.data?.solves.some(
                              (solve) =>
                                practiceIds.includes(solve.problemId) &&
                                solve.chakra &&
                                Date.parse(solve.acceptedAt) >=
                                  Date.parse(detail.path.created_at),
                            );
                            return (
                              <div
                                key={module.id}
                                className="flex flex-wrap items-center gap-2 py-3 text-xs"
                              >
                                <span className="min-w-0 flex-1 text-[var(--symm-text)]">
                                  {module.title}
                                </span>
                                <span className="text-[var(--symm-muted)]">
                                  {awarded
                                    ? "Awarded"
                                    : !done
                                      ? "Lessons pending"
                                      : eligible
                                        ? "Ready to claim"
                                        : "Accepted solve needed"}
                                </span>
                                <button
                                  onClick={() => void claimModule(module.id)}
                                  disabled={
                                    Boolean(busy) ||
                                    awarded ||
                                    !done ||
                                    !eligible
                                  }
                                  className="rounded-md border border-[var(--symm-border)] px-2.5 py-1.5 text-[var(--symm-accent-text)] hover:bg-[var(--symm-accent-surface)] disabled:cursor-not-allowed disabled:opacity-45"
                                >
                                  {awarded
                                    ? "Claimed"
                                    : busy === `claim:${module.id}`
                                      ? "Claiming…"
                                      : "Claim"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                  {selected && tutorOpen && (
                    <section
                      aria-label="Symm AI tutor"
                      className={`symm-tutor-panel fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden rounded-t-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] shadow-2xl xl:sticky xl:top-5 xl:z-auto xl:h-[min(780px,calc(100vh-2.5rem))] xl:rounded-xl xl:shadow-none ${tutorTall ? "h-[94vh]" : "h-[80vh]"}`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[var(--symm-border)] px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[var(--symm-border)] bg-[var(--symm-elevated)]">
                            <SymmMark className="size-8 object-contain" />
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-[var(--symm-text)]">
                              Symm tutor
                            </h3>
                            <p className="truncate text-[11px] text-[var(--symm-muted)]">
                              {active?.title}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setTutorTall(!tutorTall)}
                            aria-label={
                              tutorTall
                                ? "Reduce tutor height"
                                : "Expand tutor height"
                            }
                            className="rounded-md p-2 text-[var(--symm-muted)] hover:bg-[var(--symm-elevated)] hover:text-[var(--symm-text)] xl:hidden"
                          >
                            <Maximize2 size={16} />
                          </button>
                          <button
                            onClick={() => setTutorOpen(false)}
                            aria-label="Close tutor"
                            className="rounded-md p-2 text-[var(--symm-muted)] hover:bg-[var(--symm-elevated)] hover:text-[var(--symm-text)]"
                          >
                            <X size={17} />
                          </button>
                        </div>
                      </div>
                      <div className="hidden items-center justify-between gap-3 border-b border-[var(--symm-border)] px-4 py-2.5 xl:flex">
                        <label
                          htmlFor="symm-tutor-width"
                          className="text-[11px] text-[var(--symm-muted)]"
                        >
                          Panel width
                        </label>
                        <input
                          id="symm-tutor-width"
                          type="range"
                          min={300}
                          max={520}
                          step={10}
                          value={tutorWidth}
                          onChange={(event) => {
                            const value = Number(event.target.value);
                            setTutorWidth(value);
                            window.localStorage.setItem(
                              "symm-tutor-width",
                              String(value),
                            );
                          }}
                          aria-valuetext={`${tutorWidth} pixels`}
                          className="symm-range w-28 accent-[#b8a0f4]"
                        />
                      </div>
                      <p className="px-4 pt-4 text-xs leading-5 text-[var(--symm-muted)]">Ask about <span className="text-[var(--symm-text)]">{active?.title}</span>. We’ll work through it together.</p>
                      {active?.status !== "ready" && (
                        <p
                          role="status"
                          className="mx-4 mt-3 rounded-md border border-[var(--symm-border)] bg-[var(--symm-elevated)] px-3 py-2 text-xs leading-5 text-[var(--symm-accent-text)]"
                        >
                          Your lesson is being prepared. Tutoring opens when the
                          content is ready.
                        </p>
                      )}
                      {!detail.conversation.length && (
                        <div className="flex flex-wrap gap-2 px-4 pt-4">
                          {(
                            [
                              [
                                "Simplify",
                                "Explain the main idea more simply, then check my understanding.",
                              ],
                              [
                                "Walk through",
                                "Walk me through a small example, step by step.",
                              ],
                              [
                                "Quiz me",
                                "Quiz me with one reasoning question about this lesson.",
                              ],
                              [
                                "Find pitfalls",
                                "Show me a common mistake and help me understand why it fails.",
                              ],
                            ] as const
                          ).map(([label, prompt]) => (
                            <button
                              key={label}
                              type="button"
                              disabled={
                                Boolean(busy) || active?.status !== "ready"
                              }
                              onClick={() => void askTutor(prompt)}
                              className="rounded-full border border-[var(--symm-border)] bg-[var(--symm-elevated)] px-3 py-2 text-left text-xs text-[var(--symm-text)] transition-colors hover:border-[#8772a7] hover:bg-[var(--symm-elevated)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#b8a0f4] disabled:opacity-45"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                      <div
                        aria-live="polite"
                        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
                      >
                        {detail.conversation.length ? (
                          detail.conversation.map((item) => (
                            <div
                              key={item.id}
                              className={`symm-tutor-message rounded-lg p-3.5 text-[13px] leading-6 ${item.role === "user" ? "symm-tutor-message-user ml-5" : "symm-tutor-message-assistant mr-5"}`}
                            >
                              <p className="mb-2 text-[10px] uppercase tracking-[.1em] text-[var(--symm-accent-text)]">
                                {item.role === "user" ? "You" : "Symm AI"}
                              </p>
                              <RichText>{item.message}</RichText>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs leading-5 text-[var(--symm-muted)]">
                            Choose a starting point above, or write your own
                            question below.
                          </p>
                        )}
                      </div>
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          void askTutor(message);
                        }}
                        className="border-t border-[var(--symm-border)] p-3"
                      >
                        {error && (
                          <p
                            role="alert"
                            className="mb-3 rounded-md border border-rose-400/30 bg-rose-400/5 p-2 text-xs text-rose-200"
                          >
                            {error}
                          </p>
                        )}
                        <label htmlFor="symm-message" className="sr-only">
                          Ask the tutor
                        </label>
                        <div className="symm-tutor-composer flex items-end gap-2 rounded-xl border border-[var(--symm-border)] bg-[var(--symm-surface)] px-2 focus-within:border-[#9e83e7]">
                          <textarea
                            ref={tutorComposer}
                            id="symm-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                                event.preventDefault();
                                if (message.trim() && !busy && active?.status === "ready") void askTutor(message);
                              }
                            }}
                            maxLength={2000}
                            placeholder="Ask a question…"
                            rows={1}
                            className="symm-tutor-textarea min-w-0 flex-1 resize-none bg-transparent px-2 text-sm outline-none"
                          />
                          <button
                            type="submit"
                            aria-label="Send question"
                            disabled={
                              !message.trim() ||
                              Boolean(busy) ||
                              active?.status !== "ready"
                            }
                            className="flex size-8 items-center justify-center rounded-md bg-[#cdbbf7] text-[#19151e] disabled:opacity-45"
                          >
                            {busy === "tutor" ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Send size={15} />
                            )}
                          </button>
                        </div>
                      </form>
                    </section>
                  )}
                </div>
              </>
            ) : (
              error && (
                <p role="alert" className="py-12 text-sm text-rose-200">
                  {error}
                </p>
              )
            )}
          </main>
        )}
      </div>
      <AlertDialog
        open={Boolean(deletePath)}
        onOpenChange={(open) => {
          if (!open) setDeletePath(null);
        }}
      >
        <AlertDialogContent className="border-[var(--symm-border)] bg-[var(--symm-surface)] text-[var(--symm-text)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this learning path?</AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--symm-muted)]">
              The curriculum, lessons, tutor conversation, and study progress
              for “{deletePath?.title}” will be permanently removed. Verified
              problem solves and Coins awards remain in your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-rose-400/30 bg-rose-400/5 p-3 text-xs text-rose-200"
            >
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[var(--symm-border)] bg-transparent text-[var(--symm-text)] hover:bg-[var(--symm-elevated)]">
              Keep path
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void removePath();
              }}
              disabled={Boolean(busy)}
              className="bg-rose-400 text-[#1d1d25] hover:bg-rose-300"
            >
              Delete path
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
