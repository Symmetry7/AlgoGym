"use client";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ExternalLink,
  FileText,
  LoaderCircle,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useStudy } from "@/hooks/use-study";
import { useAuth } from "@/contexts/AuthContext";
import { useTracker } from "@/hooks/use-tracker";
import { StudyFeedback } from "@/components/study/StudyFeedback";
import { SheetCollection } from "@/components/study/SheetCollection";
import type { StudyQuestion } from "@/lib/study-types";
const statusNames = {
  planned: "Planned",
  in_progress: "In progress",
  completed: "Study completed",
};
export default function Workspace({
  initialTab = "workspace",
}: {
  initialTab?: string;
}) {
  const study = useStudy();
  const tracker = useTracker(0, "all", false);
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");
  const [stars, setStars] = useState(false);
  const [sort, setSort] = useState("recent");
  const [selected, setSelected] = useState("");
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [notice, setNotice] = useState("");
  const questions = study.data?.questions ?? [];
  const filtered = useMemo(
    () =>
      questions
        .filter(
          (question) =>
            question.problems &&
            (status === "all" || question.study_status === status) &&
            (platform === "all" || question.problems.provider === platform) &&
            (!stars || question.starred) &&
            `${question.problems.title} ${question.problems.tags.join(" ")} ${question.custom_tags.join(" ")}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "title"
            ? a.problems.title.localeCompare(b.problems.title)
            : sort === "oldest"
              ? a.created_at.localeCompare(b.created_at)
              : b.updated_at.localeCompare(a.updated_at),
        ),
    [questions, search, status, platform, stars, sort],
  );
  const completed = questions.filter(
    (question) => question.study_status === "completed",
  ).length;
  const save = async (action: Record<string, unknown>, message?: string) => {
    try {
      await study.save(action);
      if (message) {
        setNotice(message);
        toast.success(message);
      }
      return true;
    } catch {
      return false;
    }
  };
  const add = async (event: FormEvent) => {
    event.preventDefault();
    if (
      await save(
        { action: "question.add", url },
        "Question saved to your workspace.",
      )
    ) {
      setAdding(false);
      setUrl("");
    }
  };
  const changeTab = (value: string) => {
    setTab(value);
    setSelected("");
    window.history.replaceState(
      null,
      "",
      `/workspace${value === "workspace" ? "" : `?tab=${value}`}`,
    );
  };
  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Your practice, organized
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {tab === "workspace"
                ? "My Workspace"
                : tab === "sheets"
                  ? "My Sheets"
                  : "Explore Sheets"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Save questions, keep notes, and return with a clear next step.
            </p>
          </div>
          <Link
            href="/problems"
            className="inline-flex items-center gap-1 text-xs text-primary"
          >
            Explore problems
            <ArrowUpRight size={14} />
          </Link>
        </header>
        <nav
          className="flex gap-1 overflow-x-auto border-b pb-3"
          aria-label="Study workspace"
        >
          {[
            ["workspace", "My Workspace"],
            ["sheets", "My Sheets"],
            ["explore", "Explore Sheets"],
          ].map(([value, label]) => (
            <button
              key={value}
              aria-current={tab === value ? "page" : undefined}
              onClick={() => changeTab(value)}
              className={`shrink-0 rounded-md px-4 py-2 text-xs ${tab === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <StudyFeedback study={study} />
        {notice && (
          <p role="status" className="sr-only">
            {notice}
          </p>
        )}
        {study.data && tab !== "workspace" ? (
          <SheetCollection
            study={study}
            explore={tab === "explore"}
            onExplore={() => changeTab("explore")}
          />
        ) : study.data ? (
          <>
            <section
              className="grid grid-cols-3 gap-3"
              aria-label="Personal study totals"
            >
              {[
                ["Saved questions", questions.length],
                ["Study completed", completed],
                [
                  "Starred questions",
                  questions.filter((question) => question.starred).length,
                ],
              ].map(([title, count]) => (
                <div
                  key={String(title)}
                  className="rounded-lg border bg-card p-4"
                >
                  <p className="text-[11px] text-muted-foreground">{title}</p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums">
                    {count}
                  </p>
                </div>
              ))}
            </section>
            <section className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card px-5 py-4">
              <div>
                <h2 className="text-sm font-medium">Daily revision</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {completed < 20
                    ? `Complete ${20 - completed} more study questions to unlock a revision selection.`
                    : "Revisit up to five completed questions you reviewed least recently."}
                </p>
              </div>
              {completed < 20 ? (
                <div className="w-32">
                  <p className="mb-2 text-right text-[11px] text-muted-foreground">
                    {completed} / 20
                  </p>
                  <div className="h-1 rounded bg-muted">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${(completed / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const next = questions
                      .filter(
                        (question) => question.study_status === "completed",
                      )
                      .sort((a, b) =>
                        (a.last_reviewed_at ?? "").localeCompare(
                          b.last_reviewed_at ?? "",
                        ),
                      )[0];
                    if (next) {
                      setSelected(next.id);
                      setStatus("completed");
                      setSearch("");
                      setStars(false);
                    }
                  }}
                >
                  Start revision
                </Button>
              )}
            </section>
            <div className="flex flex-wrap gap-3">
              <label className="relative min-w-52 flex-1">
                <span className="sr-only">
                  Search saved questions and topics
                </span>
                <Search
                  size={15}
                  className="absolute left-3 top-3 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search questions or tags"
                  className="pl-9"
                />
              </label>
              <label>
                <span className="sr-only">Study status</span>
                <select
                  className="h-10 rounded-md border bg-card px-3 text-xs"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  {Object.entries(statusNames).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Platform</span>
                <select
                  className="h-10 rounded-md border bg-card px-3 text-xs"
                  value={platform}
                  onChange={(event) => setPlatform(event.target.value)}
                >
                  <option value="all">All platforms</option>
                  <option value="codeforces">Codeforces</option>
                  <option value="leetcode">LeetCode</option>
                </select>
              </label>
              <label>
                <span className="sr-only">Sort questions</span>
                <select
                  className="h-10 rounded-md border bg-card px-3 text-xs"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="recent">Recently updated</option>
                  <option value="oldest">Oldest added</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
              <Button
                variant="outline"
                aria-pressed={stars}
                onClick={() => setStars(!stars)}
              >
                <Star
                  size={14}
                  className={stars ? "fill-amber-400 text-amber-400" : ""}
                />
                Favorites
              </Button>
              <Button onClick={() => setAdding(true)}>
                <Plus size={15} />
                Add question
              </Button>
            </div>
            <div
              className={`grid gap-5 ${selected ? "xl:grid-cols-[1.25fr_1fr]" : ""}`}
            >
              <section
                className={`min-w-0 overflow-hidden rounded-lg border bg-card ${selected ? "hidden xl:block" : ""}`}
                aria-label="Saved questions"
              >
                {filtered.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="w-10 p-4">
                            <span className="sr-only">Favorite</span>
                          </th>
                          <th className="p-4 font-medium">Question</th>
                          <th className="p-4 font-medium">Difficulty</th>
                          <th className="p-4 font-medium">Study status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((question) => (
                          <tr
                            key={question.id}
                            className="border-b border-border/60 last:border-0 hover:bg-muted/30"
                          >
                            <td className="p-4">
                              <button
                                disabled={study.saving}
                                onClick={() =>
                                  void save({
                                    action: "question.update",
                                    id: question.id,
                                    starred: !question.starred,
                                  })
                                }
                                aria-label={`${question.starred ? "Unstar" : "Star"} ${question.problems.title}`}
                                className="p-1"
                              >
                                <Star
                                  size={14}
                                  className={
                                    question.starred
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground"
                                  }
                                />
                              </button>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => setSelected(question.id)}
                                className="text-left font-medium hover:text-primary"
                              >
                                {question.problems.title}
                              </button>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {question.problems.provider} ·{" "}
                                {[
                                  ...question.problems.tags,
                                  ...question.custom_tags,
                                ]
                                  .slice(0, 3)
                                  .join(" · ")}
                              </p>
                            </td>
                            <td className="p-4 text-muted-foreground">
                              {question.problems.cf_rating ??
                                question.problems.lc_difficulty ??
                                "Unrated"}
                            </td>
                            <td className="p-4">
                              <span
                                className={
                                  question.study_status === "completed"
                                    ? "text-emerald-400"
                                    : "text-muted-foreground"
                                }
                              >
                                {statusNames[question.study_status]}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-5 py-20 text-center">
                    <FileText
                      size={27}
                      className="mx-auto mb-4 text-muted-foreground"
                    />
                    <h2 className="text-lg font-medium">
                      {questions.length
                        ? "No matching questions"
                        : "Add your first question"}
                    </h2>
                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                      {questions.length
                        ? "Try another search or filter."
                        : "Save a Codeforces or LeetCode problem to plan your practice, add notes, and revisit it later."}
                    </p>
                    <Button
                      className="mt-6"
                      variant="outline"
                      onClick={() =>
                        questions.length
                          ? (setSearch(""),
                            setStatus("all"),
                            setPlatform("all"),
                            setStars(false))
                          : setAdding(true)
                      }
                    >
                      {questions.length ? "Clear filters" : "Add a question"}
                    </Button>
                  </div>
                )}
              </section>
              {selected &&
                questions.find((question) => question.id === selected) && (
                  <QuestionDetail
                    key={selected}
                    question={
                      questions.find((question) => question.id === selected)!
                    }
                    study={study}
                    verifiedIds={tracker.data?.solvedIds ?? []}
                    back={() => setSelected("")}
                    save={save}
                  />
                )}
            </div>
            <p className="text-[11px] leading-6 text-muted-foreground">
              Study completion is your personal checklist. Only server-verified
              eligible accepted submissions can earn Coins.
            </p>
          </>
        ) : null}
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a question</DialogTitle>
              <DialogDescription>
                Paste a public Codeforces or LeetCode problem URL. We’ll
                retrieve its real title and metadata.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(event) => void add(event)} className="space-y-4">
              <label className="block text-xs">
                Problem URL
                <Input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  type="url"
                  required
                  maxLength={500}
                  placeholder="https://codeforces.com/problemset/problem/4/A"
                  className="mt-2"
                />
              </label>
              {study.saveError && (
                <p role="alert" className="text-xs text-rose-300">
                  {study.saveError.message}
                </p>
              )}
              <Button type="submit" disabled={study.saving} className="w-full">
                {study.saving ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Plus size={15} />
                )}
                Save question
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
function QuestionDetail({
  question,
  study,
  verifiedIds,
  back,
  save,
}: {
  question: StudyQuestion;
  study: ReturnType<typeof useStudy>;
  verifiedIds: string[];
  back: () => void;
  save: (action: Record<string, unknown>, message?: string) => Promise<boolean>;
}) {
  const { user } = useAuth();
  const note = study.data?.notes.find(
    (item) => item.question_id === question.id,
  );
  const [body, setBody] = useState(note?.body ?? "");
  const [tags, setTags] = useState(question.custom_tags.join(", "));
  const [sheet, setSheet] = useState("");
  const [deleting, setDeleting] = useState(false);
  const verified = verifiedIds.includes(
    `${question.problems.provider}-${question.problems.external_problem_id.replace(":", "")}`,
  );
  useEffect(() => setBody(note?.body ?? ""), [note?.id]);
  return (
    <aside className="min-w-0 space-y-5 rounded-lg border bg-card p-5">
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={back}>
          <ArrowLeft size={14} />
          Back
        </Button>
        <a
          href={question.problems.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-primary"
        >
          Open problem
          <ExternalLink size={13} />
        </a>
      </div>
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          {question.problems.provider}
        </p>
        <h2 className="text-xl font-semibold">{question.problems.title}</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          {question.problems.cf_rating ??
            question.problems.lc_difficulty ??
            "Unrated"}{" "}
          · {question.problems.tags.join(" · ")}
        </p>
        <p
          className={`mt-3 text-xs ${verified ? "text-emerald-400" : "text-muted-foreground"}`}
        >
          {verified
            ? "✓ Accepted solve confirmed by server"
            : "No accepted-solve evidence in your synchronized history"}
        </p>
      </div>
      <label className="block text-xs">
        Personal study status
        <select
          value={question.study_status}
          disabled={study.saving}
          onChange={(event) =>
            void save(
              {
                action: "question.update",
                id: question.id,
                status: event.target.value,
              },
              "Study status saved.",
            )
          }
          className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-xs"
        >
          {Object.entries(statusNames).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save(
            {
              action: "note.save",
              ...(note ? { id: note.id } : {}),
              questionId: question.id,
              title: question.problems.title,
              body,
            },
            "Question note saved.",
          );
        }}
      >
        <label className="block text-xs">
          Question notes
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={40000}
            rows={9}
            placeholder="Approach, mistakes, complexity, or a reminder for next time…"
            className="mt-2 w-full rounded-md border bg-background p-3 text-xs leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={study.saving}
          className="mt-3"
        >
          <Check size={14} />
          Save note
        </Button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save(
            {
              action: "question.update",
              id: question.id,
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            },
            "Tags saved.",
          );
        }}
      >
        <label className="block text-xs">
          Your tags{" "}
          <span className="text-muted-foreground">
            (comma separated, up to 10)
          </span>
          <Input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            maxLength={320}
            className="mt-2"
          />
        </label>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          disabled={study.saving}
          className="mt-1"
        >
          Save tags
        </Button>
      </form>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (sheet)
            void save(
              {
                action: "sheet.add",
                sheetId: sheet,
                problemId: question.problem_id,
              },
              "Question added to sheet.",
            );
        }}
      >
        <label className="block text-xs">
          Add to an editable sheet
          <select
            required
            value={sheet}
            onChange={(event) => setSheet(event.target.value)}
            className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-xs"
          >
            <option value="">Select sheet</option>
            {study.data?.sheets
              .filter(
                (item) =>
                  item.created_by === user?.id ||
                  study.data?.collaborations.some(
                    (member) =>
                      member.sheet_id === item.id &&
                      member.role === "editor" &&
                      member.status === "accepted",
                  ),
              )
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
          </select>
        </label>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={study.saving || !sheet}
          className="mt-3"
        >
          Add to sheet
        </Button>
      </form>
      <Button
        size="sm"
        variant="ghost"
        disabled={study.saving}
        onClick={() =>
          void save(
            { action: "question.update", id: question.id, reviewed: true },
            "Review recorded.",
          )
        }
        className="w-full"
      >
        Mark reviewed today
      </Button>
      <button
        className="flex items-center gap-2 text-xs text-rose-300"
        onClick={() => setDeleting(true)}
      >
        <Trash2 size={13} />
        Remove from workspace
      </button>
      <Dialog open={deleting} onOpenChange={setDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this saved question?</DialogTitle>
            <DialogDescription>
              This deletes its personal note and study state. Total solves
              and Coins remain in your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={study.saving}
              onClick={async () => {
                if (
                  await save(
                    { action: "question.delete", id: question.id },
                    "Question removed.",
                  )
                )
                  back();
              }}
            >
              Remove question
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
// Own sheet IDs are supplied by the session-aware collection; collaborators remain explicit.
