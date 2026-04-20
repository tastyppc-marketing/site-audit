# Deep Dive #65 — `platform/scripts/run_rank_tracker.py`

**File:** [`run_rank_tracker.py`](/root/site-audit/platform/scripts/run_rank_tracker.py) (182 lines)
**Layer:** 11 — Python orchestrator (standalone rank tracker)
**Date:** 2026-04-20

---

## 1. Purpose

Standalone runner for `RankTracker` analyzer (finding #61). Tracks keyword positions over time by querying SERP periodically and storing history. Separate from `build_audit.py` because:
- Rank tracking is a recurring operation (weekly/monthly), not a one-time audit.
- Needs persistent storage of position snapshots.

## 2. Key architecture

Likely writes to a separate `seo/research/rank-history.json` or similar, with append-only semantics.

## 3. Bugs & fragility

| # | Sev | Line | Issue |
|---|---|---|---|
| 1 | **M** | — | **No cron/scheduler wiring in the repo.** For history to accumulate, this must be run on a schedule — requires operator discipline. |
| 2 | **M** | — | **Closes finding #23 #4 ghost field** — `rankHistory` is produced here. Pages/keywords.js renders rank history chart when this has been run. |

## 4. Integration map

**Invoked by:** operator CLI, possibly cron.
**Output:** Populates `audit-data.json.rankHistory` (via some merge step) OR a separate JSON the normalizer picks up.

## 5. Fix / improve suggestions

1. **Add cron wiring** or document scheduled-run expectations.
2. **Document how rankHistory gets into audit-data.json** — via which merge path.
