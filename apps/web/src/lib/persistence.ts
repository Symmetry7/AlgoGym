export function readPersisted<T>(raw: string | null, initial: T): T {
  if (raw === null) return initial;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (initial instanceof Set) return (Array.isArray(parsed) ? new Set(parsed) : new Set()) as T;
    return parsed as T;
  } catch {
    return typeof initial === "string" ? raw as T : initial;
  }
}

export function writePersisted(value: unknown): string {
  return JSON.stringify(value instanceof Set ? [...value] : value);
}
