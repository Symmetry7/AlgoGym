"use client";
import { useEffect, useId, useState, useRef, type FormEvent } from "react";
import { Check, LoaderCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { jsonRequest, type College } from "@/hooks/use-account";

export function CollegeAutocomplete({
  value,
  onSelect,
}: {
  value: College | null;
  onSelect: (college: College | null) => void;
}) {
  const id = useId();
  const [text, setText] = useState(value?.name ?? "");
  const [options, setOptions] = useState<College[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const previousValue = useRef(value);
  useEffect(() => {
    if (value) setText(value.name);
    else if (previousValue.current && text === previousValue.current.name)
      setText("");
    previousValue.current = value;
  }, [value?.id]);
  useEffect(() => {
    if (text.trim().length < 2 || (value && text === value.name)) {
      setOptions([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      jsonRequest<{ colleges: College[] }>(
        `/api/colleges?q=${encodeURIComponent(text.trim())}`,
        { signal: controller.signal },
      )
        .then((result) => {
          setOptions(result.colleges);
          setActive(-1);
          setOpen(true);
        })
        .catch((reason) => {
          if (!controller.signal.aborted)
            setError(reason.message || "College search is unavailable.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [text, value?.id]);
  const choose = (college: College) => {
    onSelect(college);
    setText(college.name);
    setOpen(false);
    setActive(-1);
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>College or university</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            active >= 0 ? `${id}-option-${active}` : undefined
          }
          autoComplete="off"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onSelect(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActive((old) =>
                options.length
                  ? (old +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      options.length) %
                    options.length
                  : -1,
              );
            }
            if (
              event.key === "Enter" &&
              open &&
              active >= 0 &&
              options[active]
            ) {
              event.preventDefault();
              choose(options[active]);
            }
          }}
          placeholder="Search institution name or abbreviation"
          className="pl-9 pr-9"
        />
        {loading && (
          <LoaderCircle
            aria-label="Searching colleges"
            className="absolute right-3 top-3 size-4 animate-spin text-muted-foreground"
          />
        )}
        {value && !loading && (
          <Check className="absolute right-3 top-3 size-4 text-emerald-400" />
        )}
        {open && options.length > 0 && (
          <ul
            id={`${id}-results`}
            role="listbox"
            aria-label="Matching institutions"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg"
          >
            {options.map((college, index) => (
              <li
                key={college.id}
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={value?.id === college.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(college)}
                className={`cursor-pointer rounded px-3 py-3 ${active === index ? "bg-muted" : "hover:bg-muted"}`}
              >
                <p className="text-sm">{college.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[college.city, college.state].filter(Boolean).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {loading
          ? "Searching the college directory…"
          : error || value
            ? error || "Institution selected."
            : text.trim().length >= 2 && !options.length
              ? "No matching institution found. You can request an addition below."
              : "Type at least two characters. Select a result to use its canonical institution record."}
      </p>
    </div>
  );
}
export function RequestCollegeForm({ onSaved }: { onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await jsonRequest("/api/colleges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          city: form.get("city"),
          state: form.get("state"),
          ...(form.get("website") ? { website: form.get("website") } : {}),
        }),
      });
      setSaved(true);
      onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your request could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (saved)
    return (
      <p
        role="status"
        className="rounded-md border border-emerald-500/20 p-4 text-sm text-emerald-300"
      >
        Your institution request is pending review. You can continue your setup.
      </p>
    );
  return (
    <details className="rounded-md border p-4">
      <summary className="cursor-pointer text-sm font-medium">
        Request to Add College
      </summary>
      <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-4">
        {[
          ["name", "Official institution name"],
          ["city", "City / district"],
          ["state", "State / union territory"],
          ["website", "Official website (optional)"],
        ].map(([name, label]) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={`college-${name}`}>{label}</Label>
            <Input
              id={`college-${name}`}
              name={name}
              type={name === "website" ? "url" : "text"}
              required={name !== "website"}
              disabled={busy}
              minLength={name === "name" ? 3 : 2}
              maxLength={name === "website" ? 2083 : 200}
            />
          </div>
        ))}
        {error && (
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
        )}
        <Button variant="outline" disabled={busy}>
          {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}Submit
          for review
        </Button>
        <p className="text-xs text-muted-foreground">
          Requests are checked and merged with existing institutions when
          appropriate.
        </p>
      </form>
    </details>
  );
}
