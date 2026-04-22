# Script Audit: `platform/tests/test_eeat_signals.py`

Last updated: 2026-04-18

File: [platform/tests/test_eeat_signals.py](/root/site-audit/platform/tests/test_eeat_signals.py:1)

## Purpose

`test_eeat_signals.py` validates `EEATSignalAnalyzer`, the backend analyzer that
appears to score Experience, Expertise, Authoritativeness, and Trust signals.

The suite covers:

- full analysis output shape
- site-trust signal detection
- YMYL detection
- author-signal extraction
- effort and expertise scoring
- aggregate E-E-A-T score behavior
- issue generation
- edge cases

## Inputs

Test dependencies:

- `pytest`
- `EEATSignalAnalyzer`

Primary synthetic fixture:

- `sample_pages`

That fixture includes a mix of:

- homepage
- about page
- contact page
- privacy page
- long-form article
- thin listing page

## Outputs

No runtime artifacts. The file asserts analyzer behavior.

## How It Works

### 1. Builds a representative trust / content fixture

The sample pages intentionally include the kinds of pages and schema signals the
analyzer expects to interpret as trust markers.

### 2. Tests site-level trust detection

The suite verifies detection of:

- about page
- contact page
- privacy policy
- organization schema

### 3. Tests page-level E-E-A-T heuristics

It checks:

- YMYL classification
- author presence
- effort scoring
- expertise scoring

### 4. Tests issue generation and scoring

The suite includes targeted issue scenarios such as:

- YMYL page with low expertise
- missing about page
- empty / minimal page sets

## Strengths

- clear heuristic coverage for a concept that is otherwise hard to make concrete
- fixtures are readable and intentionally chosen
- validates both site-level and page-level outputs
- issue-generation tests make the analyzer’s expectations explicit

## Weaknesses

### Heuristic-heavy by nature

E-E-A-T is interpretive, so these tests are inherently tied to the analyzer’s
current heuristics and thresholds.

### Fixture realism is limited

The sample pages are useful, but they represent a relatively tidy website.
They do not stress messier content environments or ambiguous page types.

### Limited adversarial coverage

The suite checks a few issue cases, but not many borderline situations where
YMYL or expertise detection could be noisy.

## Failure Modes

- heuristic tweaks can cause broad test churn even if the product goal remains
  the same
- real-world pages with weak metadata may be classified differently from this
  clean synthetic fixture
- site trust can appear stronger in tests than in live sites where page signals
  are incomplete or inconsistent

## Improvement Targets

### High priority

- add borderline YMYL and author-signal cases
- add fixtures with partial schema and contradictory trust signals
- keep issue-generation tests because they define the practical business meaning
  of the analyzer

### Medium priority

- add more assertions around score composition if the analyzer’s weighting is
  important downstream

## Bottom Line

`test_eeat_signals.py` is a useful heuristic test suite for a hard-to-pin-down
analyzer.

It gives decent confidence in the intended scoring model, but it should be read
as validation of current heuristics, not as proof that E-E-A-T is being
measured objectively.
