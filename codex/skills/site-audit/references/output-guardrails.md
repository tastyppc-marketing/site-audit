# Output Guardrails

## Meta tags

- Re-check title and description lengths before finalizing.
- Prefer full page coverage over partial page sets.
- Include enough evidence for QA, such as per-row counts or another explicit validation method.
- Verify any performance claims before using them in titles or descriptions.

## Schema markup

- Validate JSON-LD after drafting it.
- Keep entity `@id` values consistent across pages.
- Watch for corrupted numeric text, missing currency symbols, or malformed string values.
- Do not publish placeholder `sameAs`, ratings, or review data unless the user confirms they are real.
- Prefer complete contact and business fields over partial schema blocks.

## Community pages and blog posts

- Keep factual details aligned across title, description, body copy, and schema.
- Include FAQ-style sections when they improve search and AI-overview usefulness.
- Include internal linking suggestions or embedded internal links for deployment.
- Favor specific local details over generic lifestyle copy.

## Data discipline

- Treat `seo/audit-data.json` and `ppc/ppc-data.json` as the structured source of truth for generated decks and spreadsheets.
- Do not invent rankings, budgets, conversion rates, review counts, or sales stats.
- Flag missing verification instead of silently guessing.

## Parallel-output rule

- Keep Claude outputs intact unless asked to replace them.
- When generating Codex-authored markdown deliverables beside Claude ones, use `codex-` prefixes so both versions can coexist cleanly.
