"use client";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { jsonRequest } from "@/hooks/use-account";
import {
  monthGrid,
  localDateKey,
  eventOnDate,
  contestICS,
  type ContestCalendarData,
  type ContestEvent,
} from "@/lib/contest-calendar";
const names = {
  codeforces: "Codeforces",
  leetcode: "LeetCode",
  codechef: "CodeChef",
  atcoder: "AtCoder",
};
const colors = {
  codeforces: "border-blue-400/35 text-blue-300",
  leetcode: "border-amber-400/35 text-amber-300",
  codechef: "border-orange-400/35 text-orange-300",
  atcoder: "border-slate-400/35 text-slate-300",
};
export default function Contests() {
  const { user } = useAuth();
  const cache = useQueryClient();
  const [anchor, setAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => localDateKey(new Date()));
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("all");
  const [subscribedOnly, setSubscribedOnly] = useState(false);
  const [limit, setLimit] = useState(20);
  const [message, setMessage] = useState("");
  const grid = monthGrid(anchor);
  const from = new Date(
    grid[0].getFullYear(),
    grid[0].getMonth(),
    grid[0].getDate(),
  ).toISOString();
  const last = grid.at(-1)!;
  const to = new Date(
    last.getFullYear(),
    last.getMonth(),
    last.getDate() + 1,
  ).toISOString();
  const query = useQuery({
    queryKey: ["contests", user?.id, from, to],
    queryFn: () =>
      jsonRequest<ContestCalendarData>(
        `/api/contests?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      ),
    enabled: Boolean(user),
    staleTime: 5 * 60000,
    retry: 1,
  });
  const mutation = useMutation({
    mutationFn: ({
      eventId,
      subscribe,
    }: {
      eventId: string;
      subscribe: boolean;
    }) =>
      jsonRequest("/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, subscribe }),
      }),
    onSuccess: async (_, variables) => {
      setMessage(
        variables.subscribe
          ? "Contest saved. Export it to your calendar for a 15-minute reminder."
          : "Contest subscription removed.",
      );
      await cache.invalidateQueries({ queryKey: ["contests", user?.id] });
    },
  });
  const subscribed = new Set(
    query.data?.subscriptions.map((row) => row.event_id) ?? [],
  );
  const events = useMemo(
    () =>
      query.data?.events.filter(
        (event) =>
          (provider === "all" || event.provider === provider) &&
          (!subscribedOnly || subscribed.has(event.id)) &&
          event.title.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [query.data, provider, subscribedOnly, search],
  );
  const selectedDate = new Date(`${selected}T12:00:00`);
  const agenda = events.filter(
    (event) =>
      Date.parse(event.ends_at) > new Date(`${selected}T00:00:00`).getTime(),
  );
  const weekStart = new Date(selectedDate);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const visibleDays =
    view === "month"
      ? grid
      : view === "week"
        ? Array.from(
            { length: 7 },
            (_, index) =>
              new Date(
                weekStart.getFullYear(),
                weekStart.getMonth(),
                weekStart.getDate() + index,
                12,
              ),
          )
        : [selectedDate];
  const navigate = (direction: number) => {
    const date =
      view === "month"
        ? new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1, 12)
        : new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate() + direction * (view === "week" ? 7 : 1),
            12,
          );
    setAnchor(date);
    setSelected(localDateKey(date));
    setLimit(20);
  };
  const today = () => {
    const date = new Date();
    setAnchor(date);
    setSelected(localDateKey(date));
    setLimit(20);
  };
  const exportEvents = (items: ContestEvent[]) => {
    const blob = new Blob([contestICS(items)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      items.length === 1
        ? `algogym-${items[0].provider}-${items[0].external_id}.ics`
        : "algogym-contests.ics";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Make room for your next round
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Contest Calendar
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Discover upcoming contests and save the ones you want to enter.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!events.some((event) => subscribed.has(event.id))}
            onClick={() =>
              exportEvents(events.filter((event) => subscribed.has(event.id)))
            }
          >
            <Download size={14} />
            Export saved in this range
          </Button>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-56 flex-1">
            <span className="sr-only">Search contests</span>
            <Search
              size={15}
              className="absolute left-3 top-3 text-muted-foreground"
            />
            <Input
              placeholder="Search contests"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </label>
          <label>
            <span className="sr-only">Filter by platform</span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              className="h-10 rounded-md border bg-card px-3 text-xs"
            >
              <option value="all">All platforms</option>
              {Object.entries(names).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={subscribedOnly}
              onChange={(event) => setSubscribedOnly(event.target.checked)}
              className="accent-primary"
            />
            Saved only
          </label>
        </div>
        {message && (
          <p role="status" className="text-xs text-primary">
            {message}
          </p>
        )}
        {mutation.error && (
          <p role="alert" className="text-xs text-rose-300">
            {mutation.error.message}
          </p>
        )}
        {query.data?.warnings.map((warning) => (
          <p
            key={warning}
            role="status"
            className="rounded-md border border-amber-400/20 p-3 text-xs leading-6 text-amber-300"
          >
            {warning}
          </p>
        ))}
        {query.isLoading ? (
          <div
            role="status"
            aria-label="Loading contest schedule"
            className="h-[600px] animate-pulse rounded-lg border bg-card"
          />
        ) : query.error ? (
          <div role="alert" className="rounded-lg border p-6">
            <p className="text-sm text-rose-300">{query.error.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => void query.refetch()}
            >
              Retry calendar
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-6 xl:grid-cols-[300px_1fr]">
            <aside className="order-2 space-y-4 xl:order-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">
                  From{" "}
                  {selectedDate.toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </h2>
                <button onClick={today} className="text-xs text-primary">
                  Today
                </button>
              </div>
              {agenda.length ? (
                agenda.slice(0, limit).map((event) => (
                  <article
                    key={event.id}
                    className={`rounded-lg border border-l-2 bg-card p-4 ${colors[event.provider]}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(event.starts_at).toLocaleDateString(
                          undefined,
                          { day: "numeric", month: "short" },
                        )}{" "}
                        ·{" "}
                        {new Date(event.starts_at).toLocaleTimeString(
                          undefined,
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                      <button
                        disabled={
                          mutation.isPending ||
                          Date.parse(event.ends_at) < Date.now()
                        }
                        onClick={() =>
                          mutation.mutate({
                            eventId: event.id,
                            subscribe: !subscribed.has(event.id),
                          })
                        }
                        className="text-[10px] text-foreground disabled:opacity-40"
                      >
                        {mutation.isPending &&
                        mutation.variables?.eventId === event.id
                          ? "Saving…"
                          : subscribed.has(event.id)
                            ? "✓ Saved"
                            : "Subscribe"}
                      </button>
                    </div>
                    <h3 className="mt-3 text-sm font-medium">
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {event.title}
                        <ExternalLink size={11} className="ml-1 inline" />
                      </a>
                    </h3>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {names[event.provider]} ·{" "}
                      {Math.round(
                        (Date.parse(event.ends_at) -
                          Date.parse(event.starts_at)) /
                          60000,
                      )}{" "}
                      minutes
                    </p>
                    <div className="mt-4 flex justify-between gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {event.subscribers} subscribers
                      </span>
                      <button
                        aria-label={`Export ${event.title} to calendar`}
                        onClick={() => exportEvents([event])}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        <Download size={11} />
                        Calendar
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed p-7 text-sm leading-6 text-muted-foreground">
                  No matching contests after this date within the displayed
                  calendar range. Try another date or platform.
                </div>
              )}
              {agenda.length > limit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setLimit(limit + 20)}
                >
                  Show more contests
                </Button>
              )}
            </aside>
            <section
              className="order-1 min-w-0 overflow-hidden rounded-lg border bg-card xl:order-2"
              aria-label="Interactive contest calendar"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <h2 className="text-base font-medium">
                  {anchor.toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    onClick={today}
                    className="rounded border px-3 py-1.5 text-xs"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    aria-label={`Previous ${view}`}
                    className="rounded border p-1.5"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    onClick={() => navigate(1)}
                    aria-label={`Next ${view}`}
                    className="rounded border p-1.5"
                  >
                    <ChevronRight size={15} />
                  </button>
                  <div className="ml-2 flex rounded border p-0.5">
                    {(["month", "week", "day"] as const).map((value) => (
                      <button
                        key={value}
                        aria-pressed={view === value}
                        onClick={() => setView(value)}
                        className={`rounded px-2 py-1 text-[11px] capitalize ${view === value ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="border-b px-4 py-2 text-[10px] text-muted-foreground">
                Times are shown in your browser’s local time zone. Select a day
                to update the agenda.
              </p>
              <div className="overflow-x-auto">
                <div className={view === "day" ? "min-w-0" : "min-w-[600px]"}>
                  {view !== "day" && (
                    <div className="grid grid-cols-7 border-b">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="py-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground"
                          >
                            {day}
                          </div>
                        ),
                      )}
                    </div>
                  )}
                  <div
                    className={`grid ${view === "day" ? "grid-cols-1" : "grid-cols-7"}`}
                  >
                    {visibleDays.map((date) => {
                      const dayEvents = events.filter((event) =>
                        eventOnDate(event, date),
                      );
                      const key = localDateKey(date);
                      return (
                        <div
                          key={key}
                          className={`min-w-0 border-b border-r p-2 ${view === "month" ? "min-h-[116px]" : "min-h-[300px]"} ${date.getMonth() !== anchor.getMonth() && view === "month" ? "bg-background/60" : ""} ${key === selected ? "bg-primary/5" : ""}`}
                        >
                          <button
                            onClick={() => {
                              setSelected(key);
                              setLimit(20);
                            }}
                            aria-label={`Show contests from ${date.toLocaleDateString()}`}
                            aria-pressed={key === selected}
                            className={`mb-2 ml-auto flex size-6 items-center justify-center rounded-full text-[11px] tabular-nums ${key === selected ? "bg-primary text-primary-foreground" : key === localDateKey(new Date()) ? "border border-primary text-primary" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            {date.getDate()}
                          </button>
                          <div className="space-y-1">
                            {dayEvents
                              .slice(0, view === "month" ? 3 : 30)
                              .map((event) => (
                                <button
                                  key={event.id}
                                  onClick={() => {
                                    setSelected(key);
                                    setLimit(100);
                                  }}
                                  title={`${event.title} · ${new Date(event.starts_at).toLocaleString()}`}
                                  className={`block w-full truncate rounded border px-1.5 py-1 text-left text-[9px] ${colors[event.provider]}`}
                                >
                                  {subscribed.has(event.id) ? "✓ " : ""}
                                  {event.title}
                                </button>
                              ))}
                            {view === "month" && dayEvents.length > 3 && (
                              <button
                                onClick={() => {
                                  setSelected(key);
                                  setView("day");
                                }}
                                className="text-[9px] text-muted-foreground"
                              >
                                +{dayEvents.length - 3} more
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
        <section className="rounded-lg border p-4 text-[11px] leading-6 text-muted-foreground">
          <p>
            <Check className="mr-1.5 inline size-3 text-primary" />
            Subscribe saves your interest in AlgoGym. Use Calendar or Export to
            add an actual 15-minute reminder to your calendar app; push/email
            reminders are not sent.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer">
              Schedule sources and coverage
            </summary>
            <ul className="mt-2 list-inside list-disc">
              {Object.entries(query.data?.coverage ?? {}).map(
                ([name, text]) => (
                  <li key={name}>
                    {name}: {text}
                  </li>
                ),
              )}
            </ul>
            <p className="mt-2">
              Schedules refresh at most every 15 minutes. An unavailable
              provider preserves its last saved events. Check the source
              platform before entering.
            </p>
          </details>
        </section>
      </div>
    </Layout>
  );
}
