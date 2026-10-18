"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ExternalLink,
  LoaderCircle,
  Plus,
  Share2,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useStudy, useStudySheet } from "@/hooks/use-study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { StudySheet } from "@/lib/study-types";
const categories = [
  ["all", "All"],
  ["popular", "Popular"],
  ["quick-revision", "Quick revision"],
  ["complete-dsa", "Complete DSA"],
  ["topic-specific", "Topic specific"],
  ["competitive", "Competitive"],
  ["company-wise", "Company wise"],
];
const EMPTY = {
  title: "",
  description: "",
  visibility: "private",
  category: "competitive",
};
export function SheetCollection({
  study,
  explore,
  onExplore,
}: {
  study: ReturnType<typeof useStudy>;
  explore: boolean;
  onExplore: () => void;
}) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [limit, setLimit] = useState(6);
  const [selected, setSelected] = useState("");
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState<StudySheet | null>(null);
  const [fields, setFields] = useState(EMPTY);
  const [deleting, setDeleting] = useState<StudySheet | null>(null);
  const [share, setShare] = useState<StudySheet | null>(null);
  const [recipient, setRecipient] = useState("");
  const [role, setRole] = useState("viewer");
  const data = study.data!;
  const save = async (action: Record<string, unknown>, message: string) => {
    try {
      await study.save(action);
      toast.success(message);
      return true;
    } catch {
      return false;
    }
  };
  const openEditor = (sheet: StudySheet | null) => {
    setEditing(sheet);
    setFields(
      sheet
        ? {
            title: sheet.title,
            description: sheet.description ?? "",
            visibility: sheet.visibility,
            category: sheet.category,
          }
        : EMPTY,
    );
    setEditor(true);
    study.resetSaveError();
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (
      await save(
        {
          action: editing ? "sheet.update" : "sheet.create",
          ...(editing ? { id: editing.id } : {}),
          ...fields,
        },
        editing ? "Sheet updated." : "Sheet created.",
      )
    )
      setEditor(false);
  };
  const matches = (sheet: StudySheet) =>
    (category === "all" ||
      category === "popular" ||
      sheet.category === category) &&
    `${sheet.title} ${sheet.description ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  const publicSheets = data.sheets
    .filter((sheet) => sheet.visibility === "public" && matches(sheet))
    .sort((a, b) =>
      category === "popular"
        ? b.followers - a.followers
        : b.updated_at.localeCompare(a.updated_at),
    );
  const own = data.sheets.filter(
    (sheet) => sheet.created_by === user?.id && matches(sheet),
  );
  const followed = data.sheets.filter(
    (sheet) =>
      data.follows.some((follow) => follow.sheet_id === sheet.id) &&
      matches(sheet),
  );
  const shared = data.sheets.filter(
    (sheet) =>
      data.collaborations.some(
        (member) =>
          member.sheet_id === sheet.id && member.status === "accepted",
      ) && matches(sheet),
  );
  const cards = (sheets: StudySheet[], empty: string) => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {sheets.length ? (
        sheets.map((sheet) => (
          <article
            key={sheet.id}
            className="flex flex-col overflow-hidden rounded-lg border bg-card"
          >
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
              <span>
                {sheet.visibility === "public"
                  ? "Community sheet"
                  : sheet.visibility === "college"
                    ? "College sheet"
                    : "Private sheet"}
              </span>
              <span>{sheet.training_items?.[0]?.count ?? 0} problems</span>
            </div>
            <div className="flex flex-1 flex-col p-4">
              <button
                onClick={() => setSelected(sheet.id)}
                className="text-left text-sm font-medium hover:text-primary"
              >
                {sheet.title}
              </button>
              <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                {sheet.description ||
                  "A focused collection of practice problems."}
              </p>
              <div className="mt-5 flex items-center justify-between border-t pt-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users size={12} />
                  {sheet.followers.toLocaleString()} followers
                </span>
                {sheet.created_by === user?.id ? (
                  <span className="text-primary">Your sheet</span>
                ) : (
                  <button
                    disabled={study.saving}
                    onClick={() =>
                      void save(
                        {
                          action: "sheet.follow",
                          sheetId: sheet.id,
                          follow: !data.follows.some(
                            (follow) => follow.sheet_id === sheet.id,
                          ),
                        },
                        data.follows.some(
                          (follow) => follow.sheet_id === sheet.id,
                        )
                          ? "Sheet unfollowed."
                          : "Sheet followed.",
                      )
                    }
                    className="rounded border px-3 py-1.5 disabled:opacity-40"
                  >
                    {data.follows.some((follow) => follow.sheet_id === sheet.id)
                      ? "Following"
                      : "Follow"}
                  </button>
                )}
              </div>
            </div>
          </article>
        ))
      ) : (
        <p className="col-span-full rounded-lg border border-dashed p-8 text-sm leading-6 text-muted-foreground">
          {empty}
        </p>
      )}
    </div>
  );
  return (
    <div className="space-y-7">
      {selected ? (
        <SheetContents
          id={selected}
          study={study}
          back={() => setSelected("")}
          onEdit={openEditor}
          onDelete={setDeleting}
          onShare={setShare}
        />
      ) : (
        <>
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">
                {explore
                  ? "Track coding sheets in one place"
                  : "Personal, followed, and shared sheets"}
              </h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Use community collections or build your own. Counts come from
                actual saved items and follows.
              </p>
            </div>
            <Button size="sm" onClick={() => openEditor(null)}>
              <Plus size={14} />
              Create a sheet
            </Button>
          </header>
          <div className="flex flex-wrap gap-3">
            <label className="min-w-56 flex-1">
              <span className="sr-only">Search study sheets</span>
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setLimit(6);
                }}
                placeholder="Search any coding sheet"
              />
            </label>
            {!explore && (
              <Button variant="outline" onClick={onExplore}>
                Explore sheets
                <ArrowUpRight size={14} />
              </Button>
            )}
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            aria-label="Sheet category"
          >
            {categories.map(([value, label]) => (
              <button
                key={value}
                onClick={() => {
                  setCategory(value);
                  setLimit(6);
                }}
                aria-pressed={category === value}
                className={`shrink-0 rounded-md border px-3 py-2 text-xs ${category === value ? "border-primary/50 bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {!explore && data.invitations.length > 0 && (
            <section className="rounded-lg border bg-card p-5">
              <h3 className="mb-4 text-sm font-medium">Sheet invitations</h3>
              <ul className="divide-y">
                {data.invitations.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm">{invite.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Invited as {invite.role}. Access begins only after you
                        accept.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={study.saving}
                        onClick={() =>
                          void save(
                            {
                              action: "sheet.respond",
                              id: invite.id,
                              accept: false,
                            },
                            "Invitation declined.",
                          )
                        }
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        disabled={study.saving}
                        onClick={() =>
                          void save(
                            {
                              action: "sheet.respond",
                              id: invite.id,
                              accept: true,
                            },
                            "Invitation accepted.",
                          )
                        }
                      >
                        Accept
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {explore ? (
            <section>
              <h3 className="mb-4 text-sm font-medium">
                {category === "company-wise"
                  ? "Company-tagged community sheets"
                  : "Discover sheets"}
              </h3>
              {cards(
                publicSheets.slice(0, limit),
                "No public sheets match this selection yet. Create a sheet and choose Public to share your own collection.",
              )}
              {publicSheets.length > limit && (
                <Button
                  variant="ghost"
                  className="mx-auto mt-5 flex"
                  onClick={() => setLimit(limit + 6)}
                >
                  Show more
                </Button>
              )}
              {category === "company-wise" && (
                <p className="mt-4 text-xs leading-6 text-muted-foreground">
                  Community curation is not verified hiring-frequency data.
                  AlgoGym has no licensed company interview-question feed or
                  paid kit.
                </p>
              )}
            </section>
          ) : (
            <>
              <section>
                <h3 className="mb-4 text-sm font-medium">Followed sheets</h3>
                {cards(
                  followed,
                  "No sheets followed. Explore the directory to find a collection.",
                )}
              </section>
              <section>
                <h3 className="mb-4 text-sm font-medium">Custom sheets</h3>
                {cards(
                  own,
                  "No custom sheets yet. Create one to organize your own practice.",
                )}
              </section>
              <section>
                <h3 className="mb-4 text-sm font-medium">Shared with you</h3>
                {cards(
                  shared,
                  "No accepted sheet invitations yet. Owners can invite your AlgoGym username.",
                )}
              </section>
            </>
          )}
          <p className="text-[11px] leading-6 text-muted-foreground">
            This directory includes at most the 200 most recently updated
            accessible sheets. Published third-party collections need
            attributable, authorized source content; titles and follower numbers
            from the recording are not copied.
          </p>
        </>
      )}
      <Dialog open={editor} onOpenChange={setEditor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit sheet" : "Create a sheet"}
            </DialogTitle>
            <DialogDescription>
              Organize your own problem collection. Private is the default.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <label className="block text-xs">
              Title
              <Input
                required
                maxLength={160}
                value={fields.title}
                onChange={(event) =>
                  setFields({ ...fields, title: event.target.value })
                }
                className="mt-2"
              />
            </label>
            <label className="block text-xs">
              Description
              <textarea
                rows={3}
                maxLength={2000}
                value={fields.description}
                onChange={(event) =>
                  setFields({ ...fields, description: event.target.value })
                }
                className="mt-2 w-full rounded-md border bg-background p-3 text-xs leading-6"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-xs">
                Visibility
                <select
                  value={fields.visibility}
                  onChange={(event) =>
                    setFields({ ...fields, visibility: event.target.value })
                  }
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                >
                  <option value="private">Private</option>
                  <option value="college">My college</option>
                  <option value="public">Public</option>
                </select>
              </label>
              <label className="block text-xs">
                Category
                <select
                  value={fields.category}
                  onChange={(event) =>
                    setFields({ ...fields, category: event.target.value })
                  }
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                >
                  {categories
                    .filter(([value]) => !["all", "popular"].includes(value))
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            {study.saveError && (
              <p role="alert" className="text-xs text-rose-300">
                {study.saveError.message}
              </p>
            )}
            <Button type="submit" disabled={study.saving} className="w-full">
              {study.saving ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Save sheet
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(share)}
        onOpenChange={(open) => !open && setShare(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a collaborator</DialogTitle>
            <DialogDescription>
              Invite another AlgoGym member to {share?.title}. They must accept
              before accessing private content.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                await save(
                  {
                    action: "sheet.invite",
                    sheetId: share?.id,
                    username: recipient,
                    role,
                  },
                  "Invitation sent.",
                )
              ) {
                setShare(null);
                setRecipient("");
              }
            }}
            className="space-y-4"
          >
            <label className="block text-xs">
              AlgoGym username
              <Input
                required
                minLength={3}
                maxLength={30}
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                className="mt-2"
              />
            </label>
            <label className="block text-xs">
              Role
              <select
                className="mt-2 h-10 w-full rounded-md border bg-background px-3"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="viewer">Viewer · read only</option>
                <option value="editor">Editor · add/remove problems</option>
              </select>
            </label>
            {study.saveError && (
              <p role="alert" className="text-xs text-rose-300">
                {study.saveError.message}
              </p>
            )}
            <Button disabled={study.saving} type="submit" className="w-full">
              Send invitation
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.title}?</DialogTitle>
            <DialogDescription>
              This removes the sheet, follows, and collaboration invitations.
              Personal questions, notes, verified solves and Chakra are
              retained.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={study.saving}
              onClick={async () => {
                if (
                  await save(
                    { action: "sheet.delete", id: deleting?.id },
                    "Sheet deleted.",
                  )
                ) {
                  setDeleting(null);
                  setSelected("");
                }
              }}
            >
              Delete sheet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function SheetContents({
  id,
  study,
  back,
  onEdit,
  onDelete,
  onShare,
}: {
  id: string;
  study: ReturnType<typeof useStudy>;
  back: () => void;
  onEdit: (sheet: StudySheet) => void;
  onDelete: (sheet: StudySheet) => void;
  onShare: (sheet: StudySheet) => void;
}) {
  const { user } = useAuth();
  const detail = useStudySheet(id);
  const [problem, setProblem] = useState("");
  const [message, setMessage] = useState("");
  const data = detail.data;
  const save = async (action: Record<string, unknown>, text: string) => {
    try {
      await study.save(action);
      setMessage(text);
      toast.success(text);
    } catch {
      /* Shared mutation feedback is displayed by the workspace. */
    }
  };
  if (detail.isLoading)
    return (
      <p
        role="status"
        className="flex items-center gap-2 py-10 text-sm text-muted-foreground"
      >
        <LoaderCircle className="animate-spin" size={15} />
        Loading sheet…
      </p>
    );
  if (detail.error || !data)
    return (
      <section className="rounded-lg border p-6">
        <p role="alert" className="text-sm text-rose-300">
          {detail.error?.message ?? "This sheet is unavailable."}
        </p>
        <Button variant="outline" className="mt-4" onClick={back}>
          Back to sheets
        </Button>
      </section>
    );
  const own = data.sheet.created_by === user?.id;
  const completed = data.items.filter((item) =>
    study.data?.questions.some(
      (question) =>
        question.problem_id === item.problem_id &&
        question.study_status === "completed",
    ),
  ).length;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={back}
            className="mb-3 -ml-3"
          >
            <ArrowLeft size={14} />
            Back to sheets
          </Button>
          <h2 className="text-xl font-semibold">{data.sheet.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {data.sheet.description}
          </p>
        </div>
        {own && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(data.sheet)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShare(data.sheet)}
            >
              <Share2 size={13} />
              Share
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(data.sheet)}
              aria-label="Delete sheet"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        )}
      </header>
      <div className="rounded-lg border bg-card p-5">
        <p className="text-xs text-muted-foreground">Personal study progress</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-1.5 flex-1 rounded bg-muted">
            <div
              className="h-full rounded bg-primary"
              style={{
                width: data.items.length
                  ? `${(completed / data.items.length) * 100}%`
                  : "0%",
              }}
            />
          </div>
          <span className="text-xs tabular-nums">
            {completed} / {data.items.length}
          </span>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Your study checklist is separate from verified accepted submissions
          and Chakra.
        </p>
      </div>
      {data.canEdit && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (problem)
              void save(
                { action: "sheet.add", sheetId: id, problemId: problem },
                "Problem added to sheet.",
              );
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <label className="min-w-64 flex-1 text-xs">
            Add a saved workspace problem
            <select
              required
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-xs"
            >
              <option value="">Select a saved question</option>
              {study.data?.questions
                .filter(
                  (question) =>
                    !data.items.some(
                      (item) => item.problem_id === question.problem_id,
                    ),
                )
                .map((question) => (
                  <option key={question.id} value={question.problem_id}>
                    {question.problems?.title ?? "Unavailable problem"}
                  </option>
                ))}
            </select>
          </label>
          <Button type="submit" disabled={study.saving || !problem}>
            <Plus size={14} />
            Add
          </Button>
          <Link href="/workspace" className="pb-3 text-xs text-primary">
            Save another question
            <ArrowUpRight size={12} className="ml-1 inline" />
          </Link>
        </form>
      )}
      {message && (
        <p role="status" className="text-xs text-emerald-400">
          {message}
        </p>
      )}
      <section className="overflow-hidden rounded-lg border bg-card">
        {data.items.length ? (
          <ol className="divide-y">
            {data.items.map((item, index) => {
              const question = study.data?.questions.find(
                (question) => question.problem_id === item.problem_id,
              );
              return (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 p-4"
                >
                  <span className="w-6 text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <a
                      href={item.problems.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:text-primary"
                    >
                      {item.problems.title}
                      <ExternalLink size={12} className="ml-2 inline" />
                    </a>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.problems.provider} ·{" "}
                      {item.problems.cf_rating ??
                        item.problems.lc_difficulty ??
                        "Unrated"}{" "}
                      ·{" "}
                      {question?.study_status === "completed"
                        ? "Study completed"
                        : question
                          ? "Saved to workspace"
                          : "Not saved to workspace"}
                    </p>
                  </div>
                  {!question && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={study.saving}
                      onClick={() =>
                        void save(
                          { action: "question.add", url: item.problems.url },
                          "Question saved to workspace.",
                        )
                      }
                    >
                      Save question
                    </Button>
                  )}
                  {data.canEdit && (
                    <button
                      aria-label={`Remove ${item.problems.title} from sheet`}
                      disabled={study.saving}
                      onClick={() =>
                        void save(
                          { action: "sheet.remove", id: item.id },
                          "Problem removed from sheet.",
                        )
                      }
                      className="p-2 text-muted-foreground hover:text-rose-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="p-12 text-center">
            <BookOpen
              size={25}
              className="mx-auto mb-4 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              This sheet has no problems yet.
              {data.canEdit ? " Add a question from your workspace above." : ""}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
