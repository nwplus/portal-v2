# Nugget's take on your project (Q13)

One line about each project, shown on the `nugget` slide (the Lottie text layer that
reads "this project is so cool" in the asset). The doc field is
`project.nugget: string | null`; null hides the slide. Generated in the enrich stage,
after the per-project GitHub loop, then reviewed by organizers before the stage finishes.

## Decisions (2026-10-12, implemented 2026-10-13)

- **No persona voice.** Plain, warm and specific. Never mocks, ranks, or mentions judging
  or prizes.
- **No `WINNER` path.** Messages never depend on prizes, so the `prize` run never touches
  them. 9 paths.
- **One sentence, ≤ 80 characters.**
- **Organizers review every message before prod.**
- **Model: `claude-haiku-4-5` via the Message Batches API.**
- **One Nugget animation** for every path; `path` is never written to the doc.
- Sending the Devpost About text to the Anthropic API is **approved**.
- **Empty or junk About hides the slide** (`nugget: null`, no LLM call).
- Messages are **per project**; teammates share one.

## Message rules

Checked in code (`checkNuggetMessage`) on both model output and organizer edits:
- ≤ 80 characters, one sentence, at most one `!`.
- No emoji (the font has no emoji glyphs), URLs, @handles or hashtags.

In the prompt only (the model is asked, review catches misses): speak to "you"/"your team",
only mention facts in the project, never invent numbers or features, never mock, compare,
or mention judging or prizes, no political, religious or health claims.

## Paths

| id | Eligible when | Angle |
| -- | ------------- | ----- |
| `FUN` | always (About isn't junk) | it sounds fun to use or play |
| `NICHE_DETAIL` | always | one concrete detail, appreciated |
| `HEARTFELT` | always | the people it helps |
| `IMPRESSED` | ≥ 5 Built With, or team commits in the top quartile (≥ 4 projects with commits) | the scope of what was built |
| `CLUTCH` | `lastCommitAt` within 1 h of `hackathonEnd` | the last-minute push |
| `EARLY_CALM` | `lastCommitAt` ≥ 3 h before `hackathonEnd` | finishing early and calmly |
| `SOLO` | `teamSize === 1` | one person built it all |
| `AI_SIDEKICK` | an LLM API or AI tool in Built With (word match), or `detectAiTools` | building alongside AI; the team did the work |
| `CURIOUS` | always, always offered | light curiosity; the fallback |

`clutch` and `earlyCalm` use `computeEarlySubmission`, the same value as the
earlySubmission slide. The model gets them as booleans (`SIGNALS`), never as hours, so it
can't state a wrong number.

## How a path is chosen

`nuggetCandidates` takes the project's eligible paths, orders them by
`sha256(projectId + path)`, keeps the first 2 and adds `CURIOUS`. The model picks one it
can back with the text and writes the line; a path outside the candidates is rejected.

Candidates depend only on the project itself, so adding or removing a project never
changes anyone else's candidates (and never invalidates their reviewed messages). The hash
order spreads paths across the cohort; review prints the path counts so a skew is visible.
There is no cohort cap.

## Junk About

`cleanAbout` strips markdown, images, HTML and URLs, collapses whitespace and caps at 8000
characters. `isJunkAbout` then removes the Devpost template headings ("Inspiration", "What
it does", ...) and the title: fewer than 25 letters and digits (about 4 words), or lorem
ipsum, is junk. A one-sentence About still gets a message.

## Request

`claude-haiku-4-5`, no thinking, `max_tokens: 600`, structured outputs via
`output_config.format` (a hand-written JSON schema, `NUGGET_OUTPUT_SCHEMA`):

```ts
{ options: Array<{ path: NuggetPath, message: string, groundedOn: string }> }
```

`groundedOn` is the phrase of the title or About the line is based on, used only to flag
for review. The model returns 3 options, best first, and the first that passes the hard checks
wins: it can't count characters, so this replaces a retry batch (the first real run went
91 characters). The prompt asks for 8–12 words. The user message is JSON: `CANDIDATE_PATHS`, `SIGNALS`, and `PROJECT` (`title`,
`about`, `builtWith`, `teamSize`). The system prompt is `NUGGET_SYSTEM_PROMPT` in calc.ts and
says to treat PROJECT as data.

## Validation

`validateNuggetResult`:

- **Hard failures** mark the entry `source: "failed"` with the reason. Organizers then
  write a message in review or leave it blank. There is no retry batch and no templated
  fallback. Hard failures are:
  - a `stop_reason` other than `end_turn`;
  - output that isn't JSON or has the wrong shape;
  - a path outside the candidates, or an empty message;
  - anything `checkNuggetMessage` rejects;
  - batch results that errored, expired or were canceled.
- **Soft flags** are shown in review but don't reject the message:
  - `groundedOn` not found in the title or About;
  - a number in the message that isn't in the inputs;
  - a word from the denylist (word-bounded, so "badminton" is fine).

## Storage and resume

- `cache/{env}/{eventId}/nuggets.json` holds `projectId -> NuggetEntry`:
  `{ path, message, source: "llm" | "override" | "failed", flags, promptVersion, inputHash, reviewed, createdAt }`.
  - **Reuse:** an entry is reused while `promptVersion` (`NUGGET_PROMPT_VERSION`) and
    `inputHash` (sha256 of the input) match.
  - **Not a `raw/` entry:** `bypassCache` doesn't touch it, so re-pulling GitHub never
    discards review.
  - **Regenerating:** bump `NUGGET_PROMPT_VERSION` to regenerate everything, or delete an
    entry to regenerate one project. That includes retrying a failed one.
- `nugget-batch.json` holds the submitted batch id and the requests' `{projectId, inputHash, candidates}`, by `custom_id`.
  - `custom_id` is the first 32 hex characters of `sha256(projectId)`, since Devpost URLs
    don't fit `[a-zA-Z0-9_-]{1,64}`.
  - **Resume:** an interrupted run polls the same batch instead of resubmitting. Results
    whose `inputHash` no longer matches are dropped.
  - **Cleanup:** the file is deleted once the results are merged into the store.
- Polling checks every 30 s, with a progress bar on `request_counts`.

## Review

The pause happens when any current entry is unreviewed:

1. The run writes `output/nugget-review.json`: `{ projectId, title, path, message, source, reviewed, flags, about, generatedAt }`, with unreviewed entries first and flagged ones first within those.
2. It prints the path counts and the unreviewed messages with their flags.
3. Organizers edit `message` in the file. A blank message hides the slide.
4. The prompt offers these choices:
   - **c** checks every edit against `checkNuggetMessage`. If any fail, it prints them and asks again. Otherwise, changed messages become `source: "override"`, every entry is marked `reviewed: true`, and the run continues.
   - **s** (dev only) continues with the messages unreviewed. The next run asks again.
   - **a** aborts. Progress stays at enrich, and the GitHub data is cached, so a rerun is cheap.

If the run is aborted or interrupted, edits in the review file survive a rerun until that
message is regenerated (matched on `generatedAt`). Prod can only pass the pause with **c**, so an unreviewed
message never reaches a prod doc. Only projects whose inputs changed need review again.

## Trying the prompt

`nuggetLimit` in `script.ts` caps the number of messages stored in total (longest About
first); the rest stay null. Set it to `null` for the real run.

## Cost

About $0.20 per run for ~150 projects (Haiku 4.5, batch pricing). Runs where every
entry is stored make no API calls and don't need `ANTHROPIC_API_KEY`.

## Not done

- `detectAiTools` (co-author trailers, AI bot authors) is unit-checked only, not yet run
  against real repos; until then `AI_SIDEKICK` is mostly from Built With.
- Run against the real API on 2 dev test projects only (2026-10-13). Read every message in
  review on the first full run.
