export function safeNextPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value) ||
    value.startsWith("/api/") ||
    value.startsWith("/sign-in")
  )
    return fallback;
  try {
    if (
      decodeURIComponent(value).startsWith("//") ||
      /[\\\r\n]/.test(decodeURIComponent(value))
    )
      return fallback;
  } catch {
    return fallback;
  }
  return value;
}
const limits = new Map<string, { count: number; until: number }>();
// Supabase Auth also enforces its project-level rate limits. This is an additional per-instance guard.
export function allowAuthAttempt(
  key: string,
  maximum = 15,
  windowMs = 5 * 60_000,
) {
  const now = Date.now();
  if (limits.size > 10_000)
    for (const [entry, value] of limits)
      if (value.until < now) limits.delete(entry);
  const item = limits.get(key);
  if (!item || item.until < now) {
    limits.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  item.count += 1;
  return item.count <= maximum;
}
