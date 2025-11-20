/**
 * Safely retrieves a nested value from an object using a dot-delimited path.
 * Returns undefined when any segment is missing or non-object.
 */
export function getValueAtPath<TValue = unknown>(root: unknown, path: string): TValue | undefined {
  if (!root) return undefined;
  const segments = path.split(".");
  let current: unknown = root;

  for (const segment of segments) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current as TValue | undefined;
}
