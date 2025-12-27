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

/**
 * Validates pronouns field content.
 * Checks for reasonable length and prevents URLs.
 *
 * @param value - pronouns string to validate
 * @param maxLength - maximum character length (default: 50)
 * @returns error message if invalid, null if valid
 */
export function validatePronouns(value: string, maxLength = 50): string | null {
  if (!value.trim()) return null;
  if (value.length > maxLength) {
    return `Pronouns must be ${maxLength} characters or less`;
  }
  if (value.includes("http://") || value.includes("https://")) {
    return "Pronouns cannot contain URLs";
  }
  return null;
}

/**
 * Validates social media username or URL.
 * Accepts both full URLs and username formats (with or without @).
 *
 * @param value - username or URL to validate
 * @param platform - platform name for error messages
 * @returns error message if invalid, null if valid
 */
export function validateSocialUsername(value: string, platform: string): string | null {
  if (!value.trim()) return null;

  const trimmed = value.trim();

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return null;
    } catch {
      return `Invalid ${platform} URL format`;
    }
  }

  if (/\s/.test(trimmed)) {
    return `${platform} username cannot contain spaces`;
  }

  if (!/^[@\w.-]+$/.test(trimmed)) {
    return `${platform} username contains invalid characters`;
  }

  return null;
}

/**
 * Validates website URL or domain.
 * Accepts full URLs, www. prefixed domains, or bare domains.
 *
 * @param value - website URL or domain to validate
 * @returns error message if invalid, null if valid
 */
export function validateWebsite(value: string): string | null {
  if (!value.trim()) return null;

  const trimmed = value.trim();

  if (/\s/.test(trimmed)) {
    return "Website URL cannot contain spaces";
  }

  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("www.")
  ) {
    if (!/^[\w.-]+\.[\w.-]+/.test(trimmed)) {
      return "Please enter a valid website URL or domain";
    }
  }

  return null;
}
