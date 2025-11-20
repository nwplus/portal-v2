export * from "./form-mapping";
export * from "./object-path";
export * from "./normalize-url";

/**
 * Normalizes a human-readable option label into a stable key used in
 * boolean maps for "Select All" questions.
 *
 * Rules:
 * - Trim whitespace.
 * - Split on "/" and normalize each segment independently.
 * - Within a segment, split on whitespace and camelCase the words:
 *   - first word → all lowercase
 *   - subsequent words → Capitalize first letter, lowercase the rest
 *
 * Examples:
 * - "computer science" → "computerScience"
 * - "He / Him / His" → "he/him/his"
 * - "Black / African / Afro-Caribbean / African-Canadian"
 *     → "black/african/afro-caribbean/african-canadian"
 */
export function normalizeOptionKey(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";

  const segments = trimmed.split("/").map((segment) => segment.trim());

  const normalizedSegments = segments.map((segment) => {
    if (!segment) return "";
    const words = segment.split(/\s+/);
    if (words.length === 0) return "";

    const [first, ...rest] = words;
    const firstNorm = first.toLowerCase();
    const restNorm = rest.map((word) => {
      if (!word.length) return "";
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    });

    return [firstNorm, ...restNorm].join("");
  });

  return normalizedSegments.filter(Boolean).join("/");
}
