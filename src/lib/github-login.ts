/**
 * GitHub username parsing, shared by the application form (which validates the GitHub
 * field with it) and the Wrapped script (which attributes commits with it), so any value
 * the form accepts is one the script can read.
 *
 * Import-free on purpose: `wrapped/` imports this file by relative path under Node.
 */

/** GitHub usernames: alphanumerics and inner hyphens, at most 39 characters. */
const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

/** Answers meaning "I don't have one". Never read as a username. */
const NOT_APPLICABLE = /^(?:n\/a|na|none|no|nil|null|-)$/i;

/** First path segments on github.com that are site pages, not accounts. */
const RESERVED_PATHS = new Set([
  "about",
  "apps",
  "codespaces",
  "collections",
  "dashboard",
  "enterprise",
  "explore",
  "features",
  "issues",
  "join",
  "login",
  "marketplace",
  "new",
  "notifications",
  "orgs",
  "pricing",
  "pulls",
  "search",
  "settings",
  "signup",
  "sponsors",
  "topics",
  "trending",
]);

/**
 * The lowercased username in a GitHub field, or null.
 *
 * Reads `https://github.com/{username}` (any path after it, e.g. a repo link, is
 * ignored), `gist.github.com/{username}`, `{username}.github.io`, and a bare username
 * with or without `@`. A scheme and `www.` are optional.
 *
 * @param raw - the field as stored or typed
 * @returns the username, or null for blanks, "N/A"-style answers, other hosts and
 *   github.com pages that aren't accounts (`/orgs/…`, `/settings`, …)
 */
export function parseGithubLogin(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value || NOT_APPLICABLE.test(value)) return null;
  const login = loginIn(value);
  return login && GITHUB_LOGIN.test(login) ? login.toLowerCase() : null;
}

/** True when `value` is a bare username (`octocat` / `@octocat`) rather than a URL. */
export function isBareGithubLogin(value: string): boolean {
  const trimmed = value.trim();
  return !/[./:]/.test(trimmed) && parseGithubLogin(trimmed) !== null;
}

function loginIn(value: string): string | null {
  if (!/[./:]/.test(value)) return value.replace(/^@/, "");

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host.endsWith(".github.io")) return host.slice(0, -".github.io".length);
  if (host !== "github.com" && host !== "gist.github.com") return null;

  const first = url.pathname.split("/").find(Boolean);
  if (!first) return null;
  if (host === "github.com" && RESERVED_PATHS.has(first.toLowerCase())) return null;
  return first;
}
