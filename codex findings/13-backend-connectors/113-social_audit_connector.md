# Script Audit: `platform/src/audit_platform/connectors/social_audit.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/connectors/social_audit.py](/root/site-audit/platform/src/audit_platform/connectors/social_audit.py:1)

## Purpose

`social_audit.py` tries to discover a business's social profiles and score its
social-media presence.

In practice, it is a profile-presence checker and heuristic scorer, not a full
social-audit connector. It is exposed through the connector package but appears
to be largely standalone right now rather than deeply integrated into the main
audit flow.

## Inputs

Primary dependencies:

- `BaseConnector`
- `Settings`
- `httpx`
- `re`
- `urllib.parse`

Primary runtime inputs:

- business name
- domain
- discovered profile dicts

## Outputs

This connector returns:

- a dict of discovered profile entries from `find_social_profiles(...)`
- a scored summary dict from `analyze_social_presence(...)`

The outputs are readable, but much of the detail implied by the file name is
not actually collected.

## How It Works

### 1. Tries to scrape social links from the website

`_find_profiles_from_website(...)` fetches the site's homepage and scans the
HTML for social-profile URLs.

### 2. Guesses handle-based profile URLs

For missing platforms, `find_social_profiles(...)` builds a few slug variants
from the business name and domain and checks common platform URL patterns.

### 3. Scores coverage, not real activity

`analyze_social_presence(...)` assigns platform weights and gives bonus points
for broader platform coverage.

## Strengths

- the two-stage discovery flow is sensible: website-linked profiles first,
  guessed URLs second
- the code is easy to read
- the platform-weight scoring model is explicit and predictable

## Weaknesses

### Profile discovery is fragile

The guessed-profile path uses `HEAD` requests and only accepts `200` as a valid
result. Many social platforms redirect, throttle, or handle `HEAD` requests
inconsistently, so valid profiles can be missed.

### Handle guessing is shallow

The connector only tries a few name/domain slug variants. If the business uses
a different handle, the connector has no search-based fallback and will simply
miss the profile.

### Website scraping is limited to the homepage HTML

If social links are injected client-side, hidden behind navigation, or only
present on subpages, this connector will not see them.

### The file does not actually audit activity

Returned profile rows include `followers` and `last_post_date`, but they are
never populated. The scoring logic is therefore based almost entirely on
presence, not activity, freshness, or engagement.

### Bonus scoring can overstate maturity

`analyze_social_presence(...)` gives extra points for having many platforms,
even though it does not verify whether those platforms are active or useful.

### It also bypasses the base transport helper

Like several other connectors, this file uses `self.sync_client` directly
instead of a centralized sync request abstraction.

## Failure Modes

- false negatives for real profiles because platform URL checks are too strict
- social maturity can be overstated because scoring is based on coverage rather
  than actual activity
- consumers can read the file name as "social audit" when the implementation is
  really "social profile presence check"

## Improvement Targets

### High priority

- either rename the connector/summaries to reflect profile-presence checking or
  add real activity signals
- relax or redesign profile validation so redirects and platform quirks do not
  look like absent profiles
- add a search-based fallback rather than only guessing handle variants

### Medium priority

- move request execution onto shared base helpers
- add explicit confidence markers to discovered profiles

## Bottom Line

`social_audit.py` is a useful utility, but it is currently much narrower than
its name implies.

The main risk here is not that it fabricates numbers. The risk is that it
under-detects real profiles and then turns that incomplete discovery into a
confident-looking score.
