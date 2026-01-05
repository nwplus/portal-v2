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
  if (!trimmed) {
    return "";
  }

  const segments = trimmed.split("/").map((segment) => segment.trim());

  const normalizedSegments = segments.map((segment) => {
    if (!segment) {
      return "";
    }

    const words = segment.split(/\s+/);
    if (words.length === 0) {
      return "";
    }

    const [first, ...rest] = words;
    const firstNorm = first.toLowerCase();
    const restNorm = rest.map((word) => {
      if (!word.length) {
        return "";
      }

      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    });

    return [firstNorm, ...restNorm].join("");
  });

  return normalizedSegments.filter(Boolean).join("/");
}

/**
 * Normalizes a hostname by lowercasing it and stripping a leading "www." prefix.
 */
export function normalizeHost(hostname: string): string {
  const lower = hostname.toLowerCase();
  return lower.startsWith("www.") ? lower.slice(4) : lower;
}

/**
 * Returns true when the provided value is a valid https URL with a dotted hostname.
 * Bare hostnames such as "example" (which normalize to "https://example") are rejected.
 */
export function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }

    const host = normalizeHost(url.hostname);
    // Require a dot in the hostname so bare values like "example" (normalized
    // to "https://example") are not treated as valid URLs.
    if (!host.includes(".")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true when the provided value is an https URL pointing to a GitHub domain.
 * Accepts the main GitHub domain and common subdomains (e.g., "gist.github.com").
 */
export function isGithubUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }

    const host = normalizeHost(url.hostname);
    return host === "github.com" || host.endsWith(".github.com") || host.endsWith(".github.io");
  } catch {
    return false;
  }
}

/**
 * Returns true when the provided value is an https URL pointing to a LinkedIn domain.
 * Accepts "linkedin.com" and regional subdomains (e.g., "ca.linkedin.com").
 */
export function isLinkedinUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      return false;
    }

    const host = normalizeHost(url.hostname);
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}