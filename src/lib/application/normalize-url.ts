/**
 * Normalizes loosely entered URLs into a canonical `https://host/path` form.
 *
 * Examples:
 * - "linkedin.com/in/user-name" → "https://linkedin.com/in/user-name"
 * - "github.com/user" → "https://github.com/user"
 * - "  https://Example.com/Profile  " → "https://example.com/Profile"
 *
 * The function is conservative: if the value contains whitespace or cannot be parsed
 * as a URL even after adding a scheme, the original trimmed value is returned so that
 * validation errors can surface instead of silently mangling input.
 */
export function normalizeUrl(raw: unknown): string {
  if (typeof raw !== "string") return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  // Avoid aggressively rewriting inputs that clearly are not URLs.
  if (/\s/.test(trimmed)) {
    return trimmed;
  }

  let candidate = trimmed;

  // Add an https scheme when the user types a bare domain like "linkedin.com/in/user-name".
  if (!/^https?:\/\//i.test(candidate)) {
    if (candidate.startsWith("//")) {
      candidate = `https:${candidate}`;
    } else {
      candidate = `https://${candidate}`;
    }
  }

  try {
    const url = new URL(candidate);

    // Normalize hostname casing and strip leading "www." for a cleaner look.
    url.hostname = url.hostname.toLowerCase();
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
    }

    return url.toString();
  } catch {
    // If parsing fails, fall back to the candidate string so that validation can
    // surface a useful error instead of silently changing the value.
    return candidate;
  }
}
