"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileText,
  LoaderCircle,
  Plus,
  Search,
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
import { StudyFeedback } from "@/components/study/StudyFeedback";
import { useStudy } from "@/hooks/use-study";
import type { StudyNote } from "@/lib/study-types";
export default function Notes() {
  const study = useStudy();
  const [tab, setTab] = useState<"question" | "general">("question");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState("");
  const [deleting, setDeleting] = useState<StudyNote | null>(null);
  const notes = (study.data?.notes ?? [])
    .filter(
      (note) =>
        (tab === "question" ? Boolean(note.question_id) : !note.question_id) &&
        `${note.title} ${note.body}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const active = study.data?.notes.find((note) => note.id === selected);
  const newGeneral = selected === "new";
  const save = async (action: Record<string, unknown>, message: string) => {
    try {
      const result = await study.save(action);
      toast.success(message);
      return result;
    } catch {
      return null;
    }
  };
  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Keep the insight, not just the answer
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">My Notes</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your learning notes, organized in one place.
            </p>
          </div>
          <Button
            onClick={() =>
              tab === "general" ? setSelected("new") : setAdding(true)
            }
          >
            <Plus size={14} />
            New note
          </Button>
        </header>
        <StudyFeedback study={study} />
        <div className="flex gap-2 border-b pb-3" aria-label="Note type">
          {(["question", "general"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={tab === value}
              onClick={() => {
                setTab(value);
                setSelected(null);
              }}
              className={`rounded-md px-4 py-2 text-xs ${tab === value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
            >
              {value === "question" ? "Question notes" : "General notes"}
            </button>
          ))}
        </div>
        <label className="relative block max-w-lg">
          <span className="sr-only">Search notes</span>
          <Search
            size={15}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles and notes"
            className="pl-9"
          />
        </label>
        {study.data && (
          <div className="grid min-h-[520px] overflow-hidden rounded-lg border bg-card md:grid-cols-[280px_1fr]">
            <aside
              className={`border-r ${selected ? "hidden md:block" : ""}`}
              aria-label="Saved notes"
            >
              {notes.length ? (
                <ul className="divide-y">
                  {notes.map((note) => (
                    <li key={note.id}>
                      <button
                        onClick={() => setSelected(note.id)}
                        aria-current={selected === note.id ? "true" : undefined}
                        className={`w-full p-4 text-left hover:bg-muted/40 ${selected === note.id ? "bg-muted/50" : ""}`}
                      >
                        <p className="truncate text-sm font-medium">
                          {note.title}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {note.body || "Empty note"}
                        </p>
                        <time
                          dateTime={note.updated_at}
                          className="mt-3 block text-[10px] text-muted-foreground"
                        >
                          Updated{" "}
                          {new Date(note.updated_at).toLocaleDateString()}
                        </time>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <FileText
                    size={23}
                    className="mx-auto mb-4 text-muted-foreground"
                  />
                  <p className="text-sm text-muted-foreground">
                    {search
                      ? "No notes match your search."
                      : `No ${tab === "question" ? "question" : "general"} notes yet.`}
                  </p>
                  {tab === "question" && (
                    <Link
                      href="/workspace"
                      className="mt-4 inline-block text-xs text-primary"
                    >
                      Open your question workspace
                    </Link>
                  )}
                </div>
              )}
            </aside>
            <section
              className={`${selected ? "block" : "hidden md:flex"} min-w-0 flex-col p-5 sm:p-7`}
            >
              {active || newGeneral ? (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelected(null)}
                    >
                      <ArrowLeft size={14} />
                      Back to notes
                    </Button>
                    {active && (
                      <button
                        className="p-2 text-muted-foreground hover:text-rose-300"
                        aria-label="Delete this note"
                        onClick={() => setDeleting(active)}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <NoteEditor
                    key={active?.id ?? "new"}
                    note={active}
                    pending={study.saving}
                    save={async (title, body) => {
                      const result = await save(
                        {
                          action: "note.save",
                          ...(active ? { id: active.id } : {}),
                          title,
                          body,
                          ...(!active ? { questionId: null } : {}),
                        },
                        "Note saved.",
                      );
                      if (result?.id) setSelected(result.id);
                    }}
                  />
                  {active?.question_id && (
                    <Link
                      href="/workspace"
                      className="mt-5 text-xs text-primary"
                    >
                      Open linked question in workspace
                    </Link>
                  )}
                </>
              ) : (
                <div className="m-auto py-24 text-center">
                  <FileText
                    size={30}
                    className="mx-auto mb-4 text-muted-foreground"
                  />
                  <h2 className="text-base font-medium">
                    Room for your next insight.
                  </h2>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-muted-foreground">
                    Select a note to read or edit it, or create a new one.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New question note</DialogTitle>
              <DialogDescription>
                Choose a saved question. Each question has one note that you can
                keep improving.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const item = study.data?.questions.find(
                  (item) => item.id === question,
                );
                if (!item) return;
                const result = await save(
                  {
                    action: "note.save",
                    questionId: item.id,
                    title: item.problems.title,
                    body: "",
                  },
                  "Question note created.",
                );
                if (result?.id) {
                  setSelected(result.id);
                  setAdding(false);
                }
              }}
              className="space-y-4"
            >
              <label className="block text-xs">
                Saved question
                <select
                  required
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-xs"
                >
                  <option value="">Select a question</option>
                  {study.data?.questions
                    .filter(
                      (item) =>
                        !study.data?.notes.some(
                          (note) => note.question_id === item.id,
                        ),
                    )
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.problems?.title ?? "Unavailable problem"}
                      </option>
                    ))}
                </select>
              </label>
              <p className="text-xs leading-6 text-muted-foreground">
                No questions available?{" "}
                <Link href="/workspace" className="text-primary">
                  Save one in your workspace.
                </Link>
              </p>
              {study.saveError && (
                <p role="alert" className="text-xs text-rose-300">
                  {study.saveError.message}
                </p>
              )}
              <Button
                type="submit"
                disabled={study.saving || !question}
                className="w-full"
              >
                Create note
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
              <DialogTitle>Delete this note?</DialogTitle>
              <DialogDescription>
                The saved note text will be removed. Its linked question stays
                in your workspace.
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
                      { action: "note.delete", id: deleting?.id },
                      "Note deleted.",
                    )
                  ) {
                    setSelected(null);
                    setDeleting(null);
                  }
                }}
              >
                Delete note
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
function NoteEditor({
  note,
  pending,
  save,
}: {
  note?: StudyNote;
  pending: boolean;
  save: (title: string, body: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void save(title, body);
  };
  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-5">
      <label className="text-xs">
        Title
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={160}
          placeholder="Give your note a title"
          className="mt-2"
        />
      </label>
      <label className="flex flex-1 flex-col text-xs">
        Note
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={40000}
          rows={14}
          placeholder="Write your approach, observations, or revision reminders…"
          className="mt-2 min-h-72 w-full flex-1 rounded-md border bg-background p-4 text-sm leading-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div className="flex items-center justify-between">
        <p className="text-[10px] tabular-nums text-muted-foreground">
          {body.length.toLocaleString()} / 40,000 characters · Plain text
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Save note
        </Button>
      </div>
    </form>
  );
}
