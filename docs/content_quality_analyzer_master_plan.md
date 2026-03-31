# Master Plan: Content Quality Analyzer (`analyzers/content_quality.py`)

> **Status**: Draft — produced by GI-Mapper, 2026-03-22
> **Next**: Handed to Spec Writer (Task #2) to produce implementation specs

---

## 1. Architecture Decision

`ContentQualityAnalyzer` is a **standalone processing class** — not a connector.

- **No Inheritance**: Does NOT inherit `BaseConnector` (no HTTP calls, no API rate limiting)
- **Logging**: Uses `structlog` via `structlog.get_logger(__name__)`
- **Statelessness**: Stateless for single-page calls. `analyze_batch` uses a transient SimHash cache only during the call
- **Location**: `platform/src/audit_platform/analyzers/content_quality.py`
- **Exports**: Already wired in `analyzers/__init__.py` as `ContentQualityAnalyzer`

**Pattern reference**: Closest to `LocalSEOConnector` — pure analysis logic with structlog, no HTTP, takes input dicts and returns structured results.

---

## 2. Data Flow Map

```
AUDIT MODE
  crawl-sitemap.js
    → seo/crawl-data.json  (pages[]: dict with metadata only, NO raw HTML)
    → ContentQualityAnalyzer.analyze_page(page_data, target_keyword?)
    → ContentQualityRecord (readability at defaults, READABILITY_NOT_ANALYZED in issues)

REVIEW MODE
  raw text or HTML string
    → ContentQualityAnalyzer.review_content(raw_content, target_keyword?, url?)
    → ContentQualityRecord (full readability computed via HTMLParser + formulas)

BATCH MODE
  list of crawl page dicts
    → ContentQualityAnalyzer.analyze_batch(pages, target_keywords?)
    → (list[ContentQualityRecord], list[DuplicateGroup])
    Note: runs analyze_page on each, then SimHash cross-comparison for duplicates

CANNIBALIZATION MODE
  SearchConsoleConnector.get_query_page_data()
    → [{query, page, clicks, impressions, ctr, position}, ...]
    → ContentQualityAnalyzer.detect_cannibalization(query_page_data, min_impressions=50)
    → list[CannibalizationRecord]
```

---

## 3. Critical Constraint: Readability in Audit Mode

`crawl-sitemap.js` extracts metadata via `page.evaluate()` in Playwright. It captures word count from `body.textContent` but **does not store raw HTML body text** in the JSON output.

Readability formulas (Flesch, Kincaid, Gunning Fog) require:
- Sentence count (needs sentence boundary detection on raw text)
- Syllable count (needs phoneme-level analysis of words)
- Paragraph count (needs `<p>` tag structure)

**Resolution**:
- In `analyze_page()`: Skip readability computation. Leave `ReadabilityMetrics` at defaults (all 0.0). Set `readability_score = 0.0`. Add `"READABILITY_NOT_ANALYZED"` to `issues`.
- `analyze_page()` accepts an optional `raw_html: Optional[str] = None` parameter. If provided, run full readability pipeline. This allows future callers who DO have the HTML to get full scores.
- In `review_content()`: Always computes full readability from the provided text/HTML.

---

## 4. Method Signatures

```python
import re
import math
import hashlib
from collections import Counter, defaultdict
from datetime import datetime
from html.parser import HTMLParser
from typing import Any, Optional

import structlog

from audit_platform.models.content import (
    ContentQualityRecord,
    ContentStructure,
    DuplicateGroup,
    CannibalizationRecord,
    KeywordUsage,
    ReadabilityMetrics,
)


class ContentQualityAnalyzer:
    """Standalone content quality analysis. No HTTP calls."""

    THIN_THRESHOLD: int = 300          # words
    STALE_DAYS: int = 365              # days since last_modified
    SIMHASH_BITS: int = 64
    DUPLICATE_HAMMING_THRESHOLD: int = 3   # bits differing → likely duplicate
    NEAR_DUPLICATE_HAMMING_THRESHOLD: int = 8  # bits → near duplicate

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)

    def analyze_page(
        self,
        page_data: dict[str, Any],
        target_keyword: Optional[str] = None,
        raw_html: Optional[str] = None,
    ) -> ContentQualityRecord:
        """Audit mode: analyze a page dict from crawl-data.json.

        If raw_html is provided, also computes readability metrics.
        """

    def review_content(
        self,
        raw_content: str,
        target_keyword: Optional[str] = None,
        url: str = "",
    ) -> ContentQualityRecord:
        """Review mode: analyze raw HTML or text content."""

    def analyze_batch(
        self,
        pages: list[dict[str, Any]],
        target_keywords: Optional[dict[str, str]] = None,
    ) -> tuple[list[ContentQualityRecord], list[DuplicateGroup]]:
        """Batch audit mode: analyze all pages and detect duplicates.

        target_keywords: optional dict mapping url → target_keyword
        """

    def detect_cannibalization(
        self,
        query_page_data: list[dict[str, Any]],
        min_impressions: int = 50,
    ) -> list[CannibalizationRecord]:
        """Detect keyword cannibalization from Search Console query+page data."""
```

---

## 5. Integration Points

### 5.1 crawl-data.json → ContentQualityRecord Field Mapping

| crawl-data.json field        | ContentQualityRecord / sub-model field         |
|------------------------------|------------------------------------------------|
| `url`                        | `url`                                          |
| `title`                      | `title`                                        |
| `description`                | (feeds KeywordUsage.in_meta_description)       |
| `h1` (list)                  | (feeds KeywordUsage.in_h1, heading checks)     |
| `h2Count`                    | `structure.h2_count`                           |
| `h3Count`                    | `structure.h3_count`                           |
| `wordCount`                  | `readability.word_count`, thin check           |
| `imgCount`                   | `structure.image_count`                        |
| `imgWithoutAlt`              | `structure.images_with_alt = imgCount - imgWithoutAlt` |
| `contextualInternalLinks`    | `structure.internal_links`                     |
| `externalLinks`              | `structure.external_links`                     |
| `issues` (pre-flagged)       | merged into `ContentQualityRecord.issues`      |

### 5.2 ContentQualityRecord → PageAuditRecord Relationship

`ContentQualityRecord` is richer than `PageAuditRecord` — it adds:
- Readability metrics
- Keyword prominence scoring
- Duplicate/similarity flags
- Composite quality scores
- Structured recommendations

These are complementary, not redundant. An audit pipeline can produce both: `PageAuditRecord` from crawl metadata, and `ContentQualityRecord` from the same crawl data.

### 5.3 Output → audit-data.json Integration

The batch output gets serialized into `audit-data.json` for the HTML report:

```json
{
  "client": { ... },
  "pages": [
    {
      "url": "https://example.com/page",
      "contentQuality": {
        "quality_score": 72.5,
        "readability_score": 0.0,
        "seo_score": 65.0,
        "structure_score": 80.0,
        "is_thin": false,
        "is_duplicate": false,
        "issues": ["READABILITY_NOT_ANALYZED", "MISSING_H1"],
        "recommendations": ["Add an H1 tag to this page."],
        "readability": { "word_count": 450, ... },
        "structure": { "h2_count": 3, "internal_links": 5, ... },
        "keyword_usage": { "keyword": "mammoth lakes real estate", "density": 1.8, ... }
      }
    }
  ],
  "contentQualitySummary": {
    "pagesAnalyzed": 45,
    "thinPages": 12,
    "duplicateGroups": 3,
    "avgQualityScore": 58.2,
    "cannibalizationIssues": 4
  },
  "duplicates": [
    {
      "fingerprint": "a3f8...",
      "pages": ["https://example.com/page-a", "https://example.com/page-b"],
      "similarity": 0.94,
      "recommendation": "canonicalize"
    }
  ],
  "cannibalization": [
    {
      "keyword": "mammoth lakes homes for sale",
      "pages": [
        {"url": "...", "clicks": 45, "impressions": 320, "position": 8.2},
        {"url": "...", "clicks": 12, "impressions": 180, "position": 14.1}
      ],
      "severity": "high",
      "recommendation": "Consolidate into one authoritative page. Redirect the weaker URL."
    }
  ]
}
```

---

## 6. Duplicate Detection Algorithm (SimHash — stdlib only)

**Algorithm**: Charikar SimHash over word trigrams.

```
Step 1 — Text Normalization
  Input: page title + h1 + h2 list + (description if available)
  Normalize: lowercase, strip punctuation (re.sub), split on whitespace

Step 2 — Shingle Generation
  Generate word trigrams: [w0+w1+w2, w1+w2+w3, ...]
  Use collections.Counter to get shingle frequencies

Step 3 — Hash Each Shingle
  For each shingle:
    raw_hash = hashlib.sha256(shingle.encode()).digest()[:8]  # 8 bytes = 64 bits
    h = int.from_bytes(raw_hash, 'big')

Step 4 — Weighted Vector
  V = [0] * 64
  For each (shingle, count):
    h = hash(shingle)
    For bit i in range(64):
      if (h >> i) & 1:
        V[i] += count
      else:
        V[i] -= count

Step 5 — Fingerprint
  simhash = 0
  For i in range(64):
    if V[i] > 0:
      simhash |= (1 << i)
  Store as 16-char hex: f"{simhash:016x}"

Step 6 — Pairwise Comparison
  hamming_distance(a, b) = bin(a ^ b).count('1')

  distance <= 3   → DUPLICATE  (similarity ~= 0.95+)
  distance <= 8   → NEAR_DUPLICATE (similarity ~= 0.85+)

  Group pages by fingerprint bucket (fingerprint itself for exact,
  or compare all pairs for near-duplicate detection)
```

**DuplicateGroup.recommendation logic:**
- If one page has much higher word count → "canonicalize to longer page"
- If pages are nearly identical → "merge or 301 redirect"
- If pages are somewhat similar → "differentiate content"

---

## 7. Cannibalization Detection Algorithm

**Input**: `list[{query, page, clicks, impressions, ctr, position}]` from `SearchConsoleConnector.get_query_page_data()`

```
Step 1 — Group by query
  from collections import defaultdict
  groups = defaultdict(list)
  for row in data:
    groups[row['query']].append(row)

Step 2 — Filter noise
  Keep only queries where sum(impressions) >= min_impressions (default 50)
  Keep only queries with len(pages) >= 2

Step 3 — Severity classification
  For each qualifying query:
    positions = [row['position'] for row in pages]
    pages_in_top20 = sum(1 for p in positions if p < 20)

    if pages_in_top20 >= 2:
      severity = 'high'     # Multiple pages competing on page 1-2
    elif pages_in_top20 == 1:
      severity = 'medium'   # One page on page 1-2, others lower
    else:
      severity = 'low'      # All pages beyond page 2

Step 4 — Recommendation
  Sort pages by clicks DESC
  winner = pages[0]  # highest clicks
  losers = pages[1:]

  if severity == 'high':
    rec = f"Consolidate. Redirect {loser_urls} → {winner['page']} or canonicalize."
  elif severity == 'medium':
    rec = f"Differentiate: ensure {loser_urls} target a distinct keyword variant."
  else:
    rec = f"Low priority. Monitor {loser_urls} as rankings improve."

Step 5 — Build CannibalizationRecord
  CannibalizationRecord(
    keyword=query,
    pages=[{url, clicks, impressions, position} for each page],
    severity=severity,
    recommendation=rec,
  )
```

---

## 8. Scoring Philosophy

### 8.1 Composite `quality_score` Formula

```
quality_score = (
    0.35 * seo_score
  + 0.30 * readability_score
  + 0.25 * structure_score
  + 0.10 * (100.0 if not is_thin else 0.0)
)
```

In audit mode where `readability_score=0.0`, the formula auto-adjusts weight distribution downward. This is intentional — it incentivizes passing raw HTML when available.

### 8.2 `readability_score` (0-100)

In **review mode**: Use Flesch Reading Ease directly (it's already 0-100). Clamp to [0, 100].

In **audit mode**: `readability_score = 0.0` (cannot compute without raw text). Add `"READABILITY_NOT_ANALYZED"` to issues.

### 8.3 `seo_score` (0-100) — requires target_keyword

Points are only awarded if `target_keyword` is provided. If no keyword given, `seo_score = 0.0` and `keyword_usage = None`.

| Condition                                    | Points |
|----------------------------------------------|--------|
| keyword in title (case-insensitive)          | 25     |
| keyword in H1 (any H1)                       | 20     |
| keyword in meta description                  | 15     |
| keyword in first 100 words (review mode)     | 15     |
| keyword in URL (page_data['url'])            | 15     |
| keyword in at least one H2-H6               | 10     |
| **Total**                                    | **100**|

Keyword matching: case-insensitive substring match. For `in_first_100_words`, split on whitespace and check the first 100 tokens.

### 8.4 `structure_score` (0-100)

| Condition                                    | Points |
|----------------------------------------------|--------|
| `heading_hierarchy_valid` = True             | 30     |
| h2_count >= 2                                | 20     |
| internal_links (contextual) >= 3            | 15     |
| alt text coverage >= 80% of images          | 15     |
| list_count >= 1                              | 10     |
| no long_paragraphs (> 150 words)            | 10     |
| **Total**                                    | **100**|

**Heading hierarchy valid** check (audit mode): True if `h1` list has exactly 1 entry AND we have h2Count > 0 (no skipped levels detectable from crawl data). Set False if h1 is empty or h1 has > 1 entry.

**Alt text coverage**: `(imgCount - imgWithoutAlt) / imgCount` if `imgCount > 0`, else 1.0 (no images = not penalized).

---

## 9. Readability Formulas (Review Mode Only)

### Syllable Counter (stdlib approximation)

```python
def _count_syllables(word: str) -> int:
    word = word.lower().strip(".,!?;:")
    if not word:
        return 0
    # Count vowel groups as syllable approximation
    count = len(re.findall(r'[aeiou]+', word))
    # Silent 'e' at end
    if word.endswith('e') and count > 1:
        count -= 1
    return max(1, count)
```

### Sentence Detector

Split on `[.!?]+\s` boundaries using `re.split(r'(?<=[.!?])\s+', text)`.

### Readability Formulas

```
# Flesch Reading Ease
flesch = 206.835 - 1.015*(words/sentences) - 84.6*(syllables/words)
# Clamp to [0, 100]

# Flesch-Kincaid Grade Level
fk_grade = 0.39*(words/sentences) + 11.8*(syllables/words) - 15.59

# Gunning Fog Index
complex_words = words with >= 3 syllables
fog = 0.4 * ((words/sentences) + 100*(complex_words/words))
```

### Reading Level Labels

| Flesch Reading Ease | Label                  |
|---------------------|------------------------|
| 90-100              | '5th grade'            |
| 80-89               | '6th grade'            |
| 70-79               | '7th grade'            |
| 60-69               | '8th-9th grade'        |
| 50-59               | '10th-12th grade'      |
| 30-49               | 'college'              |
| 0-29                | 'professional/technical' |

---

## 10. Thin Content & Staleness

### Thin Content
- Default threshold: `THIN_THRESHOLD = 300` words
- Source: `page_data['wordCount']` in audit mode, computed word count in review mode
- If `word_count < THIN_THRESHOLD`:
  - Set `is_thin = True`
  - Add `"THIN_CONTENT"` to `issues`
  - Add recommendation: `f"Page has only {word_count} words. Expand to 300+ for substantive content."`

### Stale Content
- Only detectable if `last_modified` is provided in the page dict
- If `(datetime.utcnow() - last_modified).days > STALE_DAYS (365)`:
  - Set `is_stale = True`
  - Set `content_age_days = days elapsed`
  - Add `"STALE_CONTENT"` to `issues`
  - Add recommendation: `f"Content is {content_age_days} days old. Consider refreshing."`
- **Crawl data note**: `crawl-sitemap.js` does NOT collect `last_modified`. This field will be populated if the caller provides it or from HTTP `Last-Modified` headers in future crawl enhancement.

---

## 11. HTML Parser for Review Mode

```python
class _TextExtractor(HTMLParser):
    """Strips HTML tags; tracks paragraphs and lists."""
    SKIP_TAGS = {'script', 'style', 'head', 'nav', 'footer', 'header'}

    def __init__(self):
        super().__init__()
        self._skip_depth = 0
        self.paragraphs: list[str] = []
        self._current_para: list[str] = []
        self.list_count: int = 0
        self.table_count: int = 0
        self.has_toc: bool = False

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP_TAGS:
            self._skip_depth += 1
        if tag in ('ul', 'ol'):
            self.list_count += 1
        if tag == 'table':
            self.table_count += 1
        if tag == 'p':
            self._current_para = []

    def handle_endtag(self, tag):
        if tag in self.SKIP_TAGS:
            self._skip_depth = max(0, self._skip_depth - 1)
        if tag == 'p':
            text = ' '.join(self._current_para).strip()
            if text:
                self.paragraphs.append(text)

    def handle_data(self, data):
        if self._skip_depth == 0:
            self._current_para.append(data)

    @property
    def full_text(self) -> str:
        return ' '.join(p for p in self.paragraphs if p)
```

---

## 12. Dependencies

All stdlib — no new pip packages:

| Module                     | Usage                                          |
|----------------------------|------------------------------------------------|
| `re`                       | Text normalization, sentence splitting, regex  |
| `math`                     | `math.log` unused in Flesch but available      |
| `hashlib`                  | SimHash shingle hashing (SHA-256)             |
| `collections.Counter`      | Shingle frequency, word frequency              |
| `collections.defaultdict`  | Grouping in batch/cannibalization              |
| `html.parser.HTMLParser`   | HTML stripping in review mode                  |
| `datetime`                 | Staleness checking, `analyzed_at`              |
| `structlog`                | Structured logging (already in pyproject.toml) |

---

## 13. Issues Vocabulary

Standard issue string constants used in `ContentQualityRecord.issues`:

| Constant                       | Trigger                                               |
|--------------------------------|-------------------------------------------------------|
| `THIN_CONTENT`                 | word_count < 300                                      |
| `STALE_CONTENT`                | last_modified > 365 days ago                          |
| `READABILITY_NOT_ANALYZED`     | Audit mode, no raw HTML provided                      |
| `MISSING_H1`                   | h1 list is empty                                      |
| `MULTIPLE_H1`                  | h1 list has > 1 entry                                 |
| `NO_KEYWORD_PROVIDED`          | target_keyword=None, seo_score=0                      |
| `LOW_SEO_SCORE`                | seo_score < 50                                        |
| `LOW_STRUCTURE_SCORE`          | structure_score < 50                                  |
| `NO_INTERNAL_LINKS`            | contextualInternalLinks == 0                          |
| `MISSING_ALT_TEXT`             | imgWithoutAlt > 0                                     |
| `DUPLICATE_CONTENT`            | SimHash hamming distance <= 3                         |
| `NEAR_DUPLICATE_CONTENT`       | SimHash hamming distance <= 8                         |

---

## 14. Handoff Notes for Spec Writer

1. The `analyze_batch()` return type is `tuple[list[ContentQualityRecord], list[DuplicateGroup]]`. The `DuplicateGroup` entries also update the `is_duplicate`, `duplicate_of`, `similarity_score`, and `simhash` fields on the corresponding `ContentQualityRecord` objects in the list.

2. The `analyze_batch()` method should log progress with structlog: `self.log.info("batch_progress", completed=n, total=len(pages))` every 10 pages.

3. SimHash comparison is O(n²) for near-duplicate detection. For >1000 pages, skip near-duplicate (only check exact buckets). For this project's use case (50-200 content pages), full pairwise is fine.

4. `generate-report.js` will need a corresponding update (separate task) to render the `contentQuality` data. The master plan covers the data contract; the JS rendering is out of scope for the Python analyzer.

5. The `KeywordUsage.prominence_score` is computed as a weighted sum:
   - `in_title` → 30 pts
   - `in_h1` → 25 pts
   - `in_first_100_words` → 20 pts
   - `in_meta_description` → 15 pts
   - `in_url` → 10 pts
   - Normalized to 0-100.
