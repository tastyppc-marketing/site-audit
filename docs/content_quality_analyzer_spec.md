# Content Quality Analyzer — Implementation Spec

> **Status**: Final — ready for implementation
> **Target file**: `platform/src/audit_platform/analyzers/content_quality.py`
> **Pydantic models**: `platform/src/audit_platform/models/content.py` (already written, do not modify)
> **Export**: Already wired in `analyzers/__init__.py`

---

## 1. Module Header

```python
"""Content quality analyzer.

Standalone analysis class for scoring page content quality, readability,
SEO keyword usage, duplicate detection (SimHash), and keyword cannibalization.
Works in two modes:
  - audit: from crawl-data.json page dicts (no raw HTML)
  - review: from raw HTML/text strings (full readability)
"""
```

---

## 2. Imports (exact list)

```python
from __future__ import annotations

import hashlib
import re
from collections import Counter, defaultdict
from datetime import datetime
from html.parser import HTMLParser
from typing import Any, Optional

import structlog

from audit_platform.models.content import (
    CannibalizationRecord,
    ContentQualityRecord,
    ContentStructure,
    DuplicateGroup,
    KeywordUsage,
    ReadabilityMetrics,
)
```

No other imports. No `math`, no third-party NLP libraries. Everything is stdlib + structlog + the project's own models.

---

## 3. Class Constants (all constants with values and types)

Defined as class-level attributes on `ContentQualityAnalyzer`:

| Name | Type | Value | Purpose |
|------|------|-------|---------|
| `THIN_THRESHOLD` | `int` | `300` | Minimum word count for non-thin content |
| `STALE_DAYS` | `int` | `365` | Days since `last_modified` before content is stale |
| `SIMHASH_BITS` | `int` | `64` | Bit width of SimHash fingerprint |
| `DUPLICATE_HAMMING_THRESHOLD` | `int` | `3` | Max hamming distance for duplicate |
| `NEAR_DUPLICATE_HAMMING_THRESHOLD` | `int` | `8` | Max hamming distance for near-duplicate |

These are **not** overridable via `__init__`. They are plain class attributes.

### Issues vocabulary (string constants)

These are **not** class constants. They are literal strings used inline wherever issues are appended. The implementer must use these exact strings:

```
"THIN_CONTENT"
"STALE_CONTENT"
"READABILITY_NOT_ANALYZED"
"MISSING_H1"
"MULTIPLE_H1"
"NO_KEYWORD_PROVIDED"
"LOW_SEO_SCORE"
"LOW_STRUCTURE_SCORE"
"NO_INTERNAL_LINKS"
"MISSING_ALT_TEXT"
"DUPLICATE_CONTENT"
"NEAR_DUPLICATE_CONTENT"
```

---

## 4. `_TextExtractor` Inner Class (full spec)

Defined **inside** the module at module level, **not** inside `ContentQualityAnalyzer`. Prefixed with `_` to indicate private.

```python
class _TextExtractor(HTMLParser):
```

### 4.1 Class attribute

```python
SKIP_TAGS = {'script', 'style', 'head', 'nav', 'footer', 'header'}
```

### 4.2 `__init__(self)`

```python
def __init__(self):
    super().__init__()
    self._skip_depth: int = 0
    self.paragraphs: list[str] = []
    self._current_para: list[str] = []
    self.list_count: int = 0
    self.table_count: int = 0
    self.has_toc: bool = False
```

### 4.3 `handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None`

1. Convert `tag` to lowercase (HTMLParser already does this, but be explicit: `tag = tag.lower()`). **Actually**: `HTMLParser` already lowercases tags. Do NOT add redundant `.lower()`. Use `tag` as-is.
2. If `tag in self.SKIP_TAGS`: increment `self._skip_depth += 1`.
3. If `tag in ('ul', 'ol')`: increment `self.list_count += 1`.
4. If `tag == 'table'`: increment `self.table_count += 1`.
5. If `tag == 'nav'`: check attrs for `id` or `class` containing `"toc"` or `"table-of-contents"` (case-insensitive). If found, set `self.has_toc = True`. **Implementation detail**: iterate `attrs`, for each `(name, value)` where `name in ('id', 'class')` and `value is not None`, check `'toc' in value.lower() or 'table-of-contents' in value.lower()`.
6. If `tag == 'p'`: reset `self._current_para = []`.

### 4.4 `handle_endtag(self, tag: str) -> None`

1. If `tag in self.SKIP_TAGS`: set `self._skip_depth = max(0, self._skip_depth - 1)`.
2. If `tag == 'p'`:
   a. `text = ' '.join(self._current_para).strip()`
   b. If `text` is truthy (non-empty after strip): `self.paragraphs.append(text)`.

### 4.5 `handle_data(self, data: str) -> None`

1. If `self._skip_depth == 0`: `self._current_para.append(data)`.

### 4.6 `full_text` property

```python
@property
def full_text(self) -> str:
    return ' '.join(p for p in self.paragraphs if p)
```

### Edge cases

- **Nested skip tags** (e.g., `<nav><style>...</style></nav>`): `_skip_depth` handles nesting correctly — increments on each open, decrements on each close, clamped to 0.
- **Unclosed `<p>` tags**: text accumulates in `_current_para` but never gets appended to `self.paragraphs` until a `</p>` is seen. This is acceptable — the `full_text` property only uses finalized paragraphs.
- **No `<p>` tags at all**: `self.paragraphs` stays empty, `full_text` returns `""`. The caller (`_extract_text_from_html`) handles this case (see §19).
- **Malformed HTML**: `HTMLParser` is lenient. It will not raise. Data between tags still flows through `handle_data`.

---

## 5. Class Skeleton

```python
class ContentQualityAnalyzer:
    """Standalone content quality analysis. No HTTP calls."""

    THIN_THRESHOLD: int = 300
    STALE_DAYS: int = 365
    SIMHASH_BITS: int = 64
    DUPLICATE_HAMMING_THRESHOLD: int = 3
    NEAR_DUPLICATE_HAMMING_THRESHOLD: int = 8

    def __init__(self) -> None:
        self.log = structlog.get_logger(self.__class__.__name__)
```

No other instance state. No config. No parameters. The logger name will be `"ContentQualityAnalyzer"`.

---

## 6. Public Method: `analyze_page()`

### Signature

```python
def analyze_page(
    self,
    page_data: dict[str, Any],
    target_keyword: Optional[str] = None,
    raw_html: Optional[str] = None,
) -> ContentQualityRecord:
```

### Algorithm (step by step)

1. **Log entry**: `self.log.debug("analyze_page_start", url=page_data.get("url", ""), mode="audit")`

2. **Extract fields from `page_data`** with safe defaults:
   ```
   url = page_data.get("url", "")
   title = page_data.get("title", "")
   description = page_data.get("description", "")
   h1_list = page_data.get("h1", [])            # list of strings
   h2_list = page_data.get("h2", [])             # list of strings (for keyword check)
   h2_count = page_data.get("h2Count", 0)
   h3_count = page_data.get("h3Count", 0)
   word_count = page_data.get("wordCount", 0)
   img_count = page_data.get("imgCount", 0)
   img_without_alt = page_data.get("imgWithoutAlt", 0)
   internal_links = page_data.get("contextualInternalLinks", 0)
   external_links = page_data.get("externalLinks", 0)
   existing_issues = page_data.get("issues", [])  # list of strings
   last_modified_raw = page_data.get("lastModified", None)  # ISO string or None
   ```

3. **Parse `last_modified`**: If `last_modified_raw` is a string, parse with `datetime.fromisoformat(last_modified_raw.replace("Z", "+00:00"))`. Wrap in try/except `(ValueError, TypeError, AttributeError)` — on failure, set `last_modified = None`. If `last_modified_raw` is already a `datetime`, use it directly. If `None`, keep `None`.

4. **Initialize issues list**: `issues = list(existing_issues)` (copy, do not mutate original).

5. **Thin content check**:
   - `is_thin = word_count < self.THIN_THRESHOLD`
   - If `is_thin`: append `"THIN_CONTENT"` to `issues`.

6. **Freshness check**: Call `_check_freshness(last_modified)` → `(is_stale, content_age_days)`.
   - If `is_stale`: append `"STALE_CONTENT"` to `issues`.

7. **Heading hierarchy check** (for structure):
   - If `len(h1_list) == 0`: `heading_hierarchy_valid = False`, append `"MISSING_H1"` to `issues`.
   - Elif `len(h1_list) > 1`: `heading_hierarchy_valid = False`, append `"MULTIPLE_H1"` to `issues`.
   - Else: `heading_hierarchy_valid = True`.

8. **Compute `heading_count`**: `heading_count = len(h1_list) + h2_count + h3_count`.

9. **Compute `images_with_alt`**: `images_with_alt = max(0, img_count - img_without_alt)`.

10. **Check missing alt text**: If `img_without_alt > 0`: append `"MISSING_ALT_TEXT"` to `issues`.

11. **Check no internal links**: If `internal_links == 0`: append `"NO_INTERNAL_LINKS"` to `issues`.

12. **Build `ContentStructure`**:
    ```python
    structure = ContentStructure(
        heading_count=heading_count,
        heading_hierarchy_valid=heading_hierarchy_valid,
        h2_count=h2_count,
        h3_count=h3_count,
        list_count=0,          # not available from crawl data
        image_count=img_count,
        images_with_alt=images_with_alt,
        table_count=0,         # not available from crawl data
        avg_paragraph_length=0.0,   # not available from crawl data
        short_paragraphs=0,
        long_paragraphs=0,
        internal_links=internal_links,
        external_links=external_links,
        has_toc=False,         # not detectable from crawl data
        has_faq_schema="FAQPage" in page_data.get("schemaTypes", []),
    )
    ```

13. **Readability handling**:
    - If `raw_html is not None` and `raw_html.strip() != ""`:
      a. Call `_extract_text_from_html(raw_html)` → `(full_text, paragraphs, list_count, table_count, has_toc)`.
      b. Call `_compute_readability(full_text, paragraphs)` → `readability: ReadabilityMetrics`.
      c. `readability_score = max(0.0, min(100.0, readability.flesch_reading_ease))`.
      d. Update `structure` fields from HTML parse: `structure.list_count = list_count`, `structure.table_count = table_count`, `structure.has_toc = has_toc`. Also compute paragraph stats from `paragraphs`:
         - `para_lengths = [len(p.split()) for p in paragraphs]`
         - `structure.avg_paragraph_length = sum(para_lengths) / len(para_lengths)` if `para_lengths` else `0.0`
         - `structure.short_paragraphs = sum(1 for l in para_lengths if l < 20)`
         - `structure.long_paragraphs = sum(1 for l in para_lengths if l > 150)`
         - `readability.paragraph_count = len(paragraphs)`
      e. If `readability.word_count > 0` and `word_count == 0`: set `word_count = readability.word_count` (use parsed word count when crawl data has none). Recalculate `is_thin` accordingly.
    - Else (no raw HTML):
      a. `readability = ReadabilityMetrics(word_count=word_count)`
      b. `readability_score = 0.0`
      c. Append `"READABILITY_NOT_ANALYZED"` to `issues`.

14. **Keyword usage**: Call `_compute_keyword_usage(target_keyword, url, title, description, h1_list, h2_list, full_text=None, word_count=word_count)` → `keyword_usage: Optional[KeywordUsage]`.
    - `full_text` is `None` here unless raw_html was provided (in which case pass the extracted full_text).
    - If `target_keyword is None` or `target_keyword.strip() == ""`: `keyword_usage = None`, append `"NO_KEYWORD_PROVIDED"` to `issues`.

15. **SEO score**: Call `_compute_seo_score(keyword_usage, mode="audit")` → `seo_score: float`.
    - If `seo_score < 50.0` and `keyword_usage is not None`: append `"LOW_SEO_SCORE"` to `issues`.

16. **Structure score**: Call `_compute_structure_score(structure)` → `structure_score: float`.
    - If `structure_score < 50.0`: append `"LOW_STRUCTURE_SCORE"` to `issues`.

17. **SimHash**: Call `_simhash(title, h1_list, h2_list, description)` → `simhash_hex: Optional[str]`.

18. **Quality score**: Call `_compute_quality_score(seo_score, readability_score, structure_score, is_thin)` → `quality_score: float`.

19. **Recommendations**: Call `_generate_recommendations(issues, word_count, content_age_days)` → `recommendations: list[str]`.

20. **Build and return `ContentQualityRecord`**:
    ```python
    record = ContentQualityRecord(
        url=url,
        title=title,
        mode="audit",
        quality_score=quality_score,
        readability_score=readability_score,
        seo_score=seo_score,
        structure_score=structure_score,
        readability=readability,
        keyword_usage=keyword_usage,
        structure=structure,
        is_thin=is_thin,
        thin_threshold=self.THIN_THRESHOLD,
        is_duplicate=False,        # set later by analyze_batch
        duplicate_of="",
        similarity_score=0.0,
        last_modified=last_modified,
        content_age_days=content_age_days,
        is_stale=is_stale,
        issues=issues,
        recommendations=recommendations,
        simhash=simhash_hex,
    )
    ```

21. **Log exit**: `self.log.debug("analyze_page_done", url=url, quality_score=quality_score)`

22. Return `record`.

### Edge cases

- **Empty `page_data` dict `{}`**: All `.get()` calls return defaults. `url=""`, `title=""`, `word_count=0`, `is_thin=True`, `heading_hierarchy_valid=False` (empty h1_list), `seo_score=0.0` (no keyword → NO_KEYWORD_PROVIDED). SimHash produces `None` (see §17). Returns a valid `ContentQualityRecord` with issues `["THIN_CONTENT", "MISSING_H1", "NO_INTERNAL_LINKS", "READABILITY_NOT_ANALYZED", "NO_KEYWORD_PROVIDED", "LOW_STRUCTURE_SCORE"]`.
- **`word_count = 0`**: `is_thin = True`. All readability formulas safely produce 0/default (no division by zero because readability isn't computed in audit mode without raw_html).
- **`img_count = 0`**: `images_with_alt = max(0, 0 - 0) = 0`. Alt text coverage in structure score: treat as 1.0 (no images = not penalized — see §15).

---

## 7. Public Method: `review_content()`

### Signature

```python
def review_content(
    self,
    raw_content: str,
    target_keyword: Optional[str] = None,
    url: str = "",
) -> ContentQualityRecord:
```

### Algorithm (step by step)

1. **Log entry**: `self.log.debug("review_content_start", url=url, content_length=len(raw_content))`

2. **Extract text from HTML**: Call `_extract_text_from_html(raw_content)` → `(full_text, paragraphs, list_count, table_count, has_toc)`.

3. **Handle empty content**: If `full_text.strip() == ""` AND `raw_content.strip() != ""`:
   - Treat `raw_content` as plain text (no HTML tags produced paragraphs).
   - Set `full_text = raw_content.strip()`.
   - Set `paragraphs = [full_text]`.

4. **Word count**: `words = full_text.split()`, `word_count = len(words)`.

5. **Title extraction**: Attempt to find `<title>` in `raw_content` via regex: `m = re.search(r'<title[^>]*>(.*?)</title>', raw_content, re.IGNORECASE | re.DOTALL)`. If found: `title = m.group(1).strip()`. Else: `title = ""`.

6. **H1 extraction**: Find all H1 tags: `h1_list = re.findall(r'<h1[^>]*>(.*?)</h1>', raw_content, re.IGNORECASE | re.DOTALL)`. Strip each: `h1_list = [h.strip() for h in h1_list]`. If `raw_content` has no HTML tags at all (checked in step 3 fallback), `h1_list = []`.

7. **H2 extraction**: `h2_list = [h.strip() for h in re.findall(r'<h2[^>]*>(.*?)</h2>', raw_content, re.IGNORECASE | re.DOTALL)]`.

8. **H3 extraction**: `h3_matches = re.findall(r'<h3[^>]*>(.*?)</h3>', raw_content, re.IGNORECASE | re.DOTALL)`.

9. **Description extraction**: `m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', raw_content, re.IGNORECASE)`. If found: `description = m.group(1).strip()`. Else: `description = ""`.

10. **Image counting**: `img_tags = re.findall(r'<img\b[^>]*>', raw_content, re.IGNORECASE)`. `img_count = len(img_tags)`. `img_without_alt = sum(1 for tag in img_tags if not re.search(r'alt\s*=\s*["\'][^"\']+["\']', tag, re.IGNORECASE))`. `images_with_alt = img_count - img_without_alt`.

11. **Link counting**:
    - `all_links = re.findall(r'<a\b[^>]*href\s*=\s*["\']([^"\']*)["\']', raw_content, re.IGNORECASE)`
    - Parse `url` to get domain: if `url` is non-empty, extract domain via `re.match(r'https?://([^/]+)', url)`. If `url` is empty, treat all links as external.
    - `internal_links = sum(1 for link in all_links if domain and domain in link)`
    - `external_links = len(all_links) - internal_links`

12. **Thin content check**: `is_thin = word_count < self.THIN_THRESHOLD`.

13. **Initialize issues**: `issues = []`. If `is_thin`: append `"THIN_CONTENT"`.

14. **Heading hierarchy check**:
    - If `len(h1_list) == 0`: `heading_hierarchy_valid = False`, append `"MISSING_H1"`.
    - Elif `len(h1_list) > 1`: `heading_hierarchy_valid = False`, append `"MULTIPLE_H1"`.
    - Else: `heading_hierarchy_valid = True`.

15. **Check missing alt text**: If `img_without_alt > 0`: append `"MISSING_ALT_TEXT"`.

16. **Check no internal links**: If `internal_links == 0`: append `"NO_INTERNAL_LINKS"`.

17. **Compute readability**: Call `_compute_readability(full_text, paragraphs)` → `readability: ReadabilityMetrics`.
    - `readability_score = max(0.0, min(100.0, readability.flesch_reading_ease))`

18. **Paragraph stats**:
    - `para_lengths = [len(p.split()) for p in paragraphs]`
    - `avg_paragraph_length = sum(para_lengths) / len(para_lengths)` if `para_lengths` else `0.0`
    - `short_paragraphs = sum(1 for l in para_lengths if l < 20)`
    - `long_paragraphs = sum(1 for l in para_lengths if l > 150)`

19. **Build `ContentStructure`**:
    ```python
    structure = ContentStructure(
        heading_count=len(h1_list) + len(h2_list) + len(h3_matches),
        heading_hierarchy_valid=heading_hierarchy_valid,
        h2_count=len(h2_list),
        h3_count=len(h3_matches),
        list_count=list_count,
        image_count=img_count,
        images_with_alt=images_with_alt,
        table_count=table_count,
        avg_paragraph_length=avg_paragraph_length,
        short_paragraphs=short_paragraphs,
        long_paragraphs=long_paragraphs,
        internal_links=internal_links,
        external_links=external_links,
        has_toc=has_toc,
        has_faq_schema="faqpage" in raw_content.lower(),
    )
    ```

20. **Keyword usage**: Call `_compute_keyword_usage(target_keyword, url, title, description, h1_list, h2_list, full_text=full_text, word_count=word_count)`.
    - If `target_keyword is None` or `target_keyword.strip() == ""`: `keyword_usage = None`, append `"NO_KEYWORD_PROVIDED"`.

21. **SEO score**: Call `_compute_seo_score(keyword_usage, mode="review")` → `seo_score`.
    - If `seo_score < 50.0` and `keyword_usage is not None`: append `"LOW_SEO_SCORE"`.

22. **Structure score**: Call `_compute_structure_score(structure)` → `structure_score`.
    - If `structure_score < 50.0`: append `"LOW_STRUCTURE_SCORE"`.

23. **SimHash**: Call `_simhash(title, h1_list, h2_list, description)` → `simhash_hex`.

24. **Quality score**: Call `_compute_quality_score(seo_score, readability_score, structure_score, is_thin)` → `quality_score`.

25. **Recommendations**: Call `_generate_recommendations(issues, word_count, None)` → `recommendations`.

26. **Build and return `ContentQualityRecord`**:
    ```python
    record = ContentQualityRecord(
        url=url,
        title=title,
        mode="review",
        quality_score=quality_score,
        readability_score=readability_score,
        seo_score=seo_score,
        structure_score=structure_score,
        readability=readability,
        keyword_usage=keyword_usage,
        structure=structure,
        is_thin=is_thin,
        thin_threshold=self.THIN_THRESHOLD,
        is_duplicate=False,
        duplicate_of="",
        similarity_score=0.0,
        last_modified=None,
        content_age_days=None,
        is_stale=False,
        issues=issues,
        recommendations=recommendations,
        simhash=simhash_hex,
    )
    ```

27. **Log exit**: `self.log.debug("review_content_done", url=url, quality_score=quality_score, word_count=word_count)`

28. Return `record`.

### Edge cases

- **Empty string `raw_content = ""`**: `full_text = ""`, `word_count = 0`, `is_thin = True`. Readability returns defaults (see §11). Returns valid record.
- **Plain text (no HTML tags)**: `_TextExtractor` produces no paragraphs. Step 3 fallback kicks in, treating entire input as one paragraph.
- **HTML with no `<p>` tags but text inside `<div>`s**: Same fallback — text in `_current_para` is never finalized. Step 3 catches this.
- **Single word**: `word_count = 1`. Readability formulas handle it (see §11 edge cases).

---

## 8. Public Method: `analyze_batch()`

### Signature

```python
def analyze_batch(
    self,
    pages: list[dict[str, Any]],
    target_keywords: Optional[dict[str, str]] = None,
) -> tuple[list[ContentQualityRecord], list[DuplicateGroup]]:
```

`target_keywords` maps URL → target keyword string. Example: `{"https://example.com/page": "mammoth lakes homes"}`.

### Algorithm (step by step)

1. **Log entry**: `self.log.info("analyze_batch_start", total=len(pages))`

2. **Handle empty input**: If `len(pages) == 0`: return `([], [])`.

3. **Analyze each page**:
   ```
   records: list[ContentQualityRecord] = []
   for i, page_data in enumerate(pages):
       url = page_data.get("url", "")
       kw = None
       if target_keywords is not None:
           kw = target_keywords.get(url)
       record = self.analyze_page(page_data, target_keyword=kw)
       records.append(record)
       if (i + 1) % 10 == 0:
           self.log.info("batch_progress", completed=i + 1, total=len(pages))
   ```

4. **Final progress log**: If `len(pages) % 10 != 0`: `self.log.info("batch_progress", completed=len(pages), total=len(pages))`.

5. **Build SimHash index**: Create a dict mapping URL to integer SimHash:
   ```
   simhash_map: dict[str, int] = {}
   for record in records:
       if record.simhash is not None:
           simhash_map[record.url] = int(record.simhash, 16)
   ```

6. **Duplicate detection**:
   - `urls = list(simhash_map.keys())`
   - `n = len(urls)`
   - Initialize: `duplicate_pairs: list[tuple[str, str, int]] = []` (url_a, url_b, hamming_distance)

   **If `n <= 1000`** (full pairwise):
   ```
   for i in range(n):
       for j in range(i + 1, n):
           dist = self._hamming_distance(simhash_map[urls[i]], simhash_map[urls[j]])
           if dist <= self.NEAR_DUPLICATE_HAMMING_THRESHOLD:
               duplicate_pairs.append((urls[i], urls[j], dist))
   ```

   **If `n > 1000`** (exact bucket only):
   ```
   buckets: dict[str, list[str]] = defaultdict(list)
   for url_key in urls:
       hex_fp = f"{simhash_map[url_key]:016x}"
       buckets[hex_fp].append(url_key)
   for hex_fp, bucket_urls in buckets.items():
       if len(bucket_urls) >= 2:
           for i in range(len(bucket_urls)):
               for j in range(i + 1, len(bucket_urls)):
                   duplicate_pairs.append((bucket_urls[i], bucket_urls[j], 0))
   ```

7. **Group duplicates**: Build `DuplicateGroup` objects from `duplicate_pairs`.

   Algorithm:
   ```
   # Union-Find to group connected URLs
   parent: dict[str, str] = {}

   def find(x: str) -> str:
       while parent.get(x, x) != x:
           parent[x] = parent.get(parent[x], parent[x])
           x = parent[x]
       return x

   def union(a: str, b: str) -> None:
       ra, rb = find(a), find(b)
       if ra != rb:
           parent[ra] = rb

   for url_a, url_b, dist in duplicate_pairs:
       union(url_a, url_b)

   # Group by root
   groups_map: dict[str, list[tuple[str, int]]] = defaultdict(list)
   # Track minimum hamming distance per pair within each group
   group_distances: dict[str, list[int]] = defaultdict(list)

   for url_a, url_b, dist in duplicate_pairs:
       root = find(url_a)
       group_distances[root].append(dist)

   # Build groups
   url_to_root: dict[str, str] = {}
   for url_key in simhash_map:
       root = find(url_key)
       if root in group_distances:  # only include URLs that participate in a pair
           url_to_root[url_key] = root

   grouped: dict[str, list[str]] = defaultdict(list)
   for url_key, root in url_to_root.items():
       grouped[root].append(url_key)
   ```

   For each group with `len(group_urls) >= 2`:
   a. `fingerprint = f"{simhash_map[group_urls[0]]:016x}"` (use first URL's hash).
   b. Compute `avg_hamming` from `group_distances[root]`: `avg_hamming = sum(group_distances[root]) / len(group_distances[root])`.
   c. `similarity = 1.0 - (avg_hamming / 64)`.
   d. Look up word counts from records: build a `url_to_record` map. `wc_list = [url_to_record[u].readability.word_count for u in group_urls]`. `word_count_range = (min(wc_list), max(wc_list))`.
   e. Determine recommendation:
      - If `avg_hamming <= self.DUPLICATE_HAMMING_THRESHOLD` and `max(wc_list) > 1.5 * min(wc_list)` (one page has significantly more content): `recommendation = "Canonicalize to longer page"`.
      - Elif `avg_hamming <= self.DUPLICATE_HAMMING_THRESHOLD`: `recommendation = "Merge or 301 redirect"`.
      - Else (near-duplicate): `recommendation = "Differentiate content"`.
   f. Create `DuplicateGroup(fingerprint=fingerprint, pages=group_urls, similarity=similarity, word_count_range=word_count_range, recommendation=recommendation)`.

8. **Update records with duplicate info**: Build `url_to_record = {r.url: r for r in records}`.
   For each `DuplicateGroup`:
   - For each URL in the group's `pages`:
     - `record = url_to_record[url]`
     - `record.is_duplicate = True`
     - `record.similarity_score = group.similarity`
     - `record.duplicate_of = group.pages[0]` if this URL is not `group.pages[0]`, else `group.pages[1]` (point to another page in the group).
     - If this record does not already have `"DUPLICATE_CONTENT"` or `"NEAR_DUPLICATE_CONTENT"` in issues:
       - Find the minimum hamming distance this URL has with any other URL in the group (iterate `duplicate_pairs` filtered to this URL). If `min_dist <= self.DUPLICATE_HAMMING_THRESHOLD`: append `"DUPLICATE_CONTENT"`. Else: append `"NEAR_DUPLICATE_CONTENT"`.

   **Simplified approach**: Instead of re-scanning pairs, determine the issue string from `group.similarity`:
   - If `similarity >= 1.0 - (self.DUPLICATE_HAMMING_THRESHOLD / 64)` (i.e., `similarity >= 0.953125`): append `"DUPLICATE_CONTENT"`.
   - Else: append `"NEAR_DUPLICATE_CONTENT"`.

   After appending duplicate issues, re-run `_generate_recommendations` is **not** needed. Instead, just append the relevant recommendation string directly:
   - If `"DUPLICATE_CONTENT"` was added: append `f"Duplicate of {record.duplicate_of}. Consider 301 redirect or canonical tag."` to `record.recommendations`.
   - If `"NEAR_DUPLICATE_CONTENT"` was added: append `f"Near-duplicate of {record.duplicate_of}. Differentiate content."` to `record.recommendations`.

9. **Log exit**: `self.log.info("analyze_batch_done", total=len(records), duplicate_groups=len(duplicate_groups))`

10. Return `(records, duplicate_groups)`.

### Edge cases

- **Batch with 0 pages**: Returns `([], [])` at step 2.
- **Batch with 1 page**: `analyze_page` runs once. No pairwise comparison possible (`n <= 1`, inner loop body never executes). Returns `([record], [])`.
- **Page with `simhash = None`**: Excluded from `simhash_map` in step 5. Not eligible for duplicate detection.
- **All pages identical SimHash**: One large group. `avg_hamming = 0`, `similarity = 1.0`, recommendation = "Merge or 301 redirect" (unless word counts diverge).
- **`target_keywords = None`**: Every page analyzed with `target_keyword=None`. All get `seo_score=0.0` and `"NO_KEYWORD_PROVIDED"`.

### Logging

| Event | Level | Fields |
|-------|-------|--------|
| `analyze_batch_start` | `info` | `total` |
| `batch_progress` | `info` | `completed`, `total` |
| `analyze_batch_done` | `info` | `total`, `duplicate_groups` |

---

## 9. Public Method: `detect_cannibalization()`

### Signature

```python
def detect_cannibalization(
    self,
    query_page_data: list[dict[str, Any]],
    min_impressions: int = 50,
) -> list[CannibalizationRecord]:
```

### Input format

Each dict in `query_page_data` has the following fields (from Search Console):
```python
{
    "query": str,
    "page": str,        # URL
    "clicks": int,
    "impressions": int,
    "ctr": float,
    "position": float,
}
```

### Algorithm (step by step)

1. **Log entry**: `self.log.debug("detect_cannibalization_start", rows=len(query_page_data), min_impressions=min_impressions)`

2. **Group by query**:
   ```
   groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
   for row in query_page_data:
       query = row.get("query", "")
       if query:
           groups[query].append(row)
   ```

3. **Filter**:
   ```
   results: list[CannibalizationRecord] = []
   for query, rows in groups.items():
       total_impressions = sum(r.get("impressions", 0) for r in rows)
       if total_impressions < min_impressions:
           continue
       if len(rows) < 2:
           continue
       # Process this query
   ```

4. **For each qualifying query**:

   a. **Sort pages by clicks descending**: `rows.sort(key=lambda r: r.get("clicks", 0), reverse=True)`.

   b. **Severity classification**:
      ```
      pages_in_top20 = sum(1 for r in rows if r.get("position", 100) < 20)
      if pages_in_top20 >= 2:
          severity = "high"
      elif pages_in_top20 == 1:
          severity = "medium"
      else:
          severity = "low"
      ```

   c. **Build page list for the record**:
      ```
      page_list = [
          {
              "url": r.get("page", ""),
              "clicks": r.get("clicks", 0),
              "impressions": r.get("impressions", 0),
              "position": r.get("position", 0.0),
          }
          for r in rows
      ]
      ```

   d. **Winner and losers**:
      ```
      winner_url = page_list[0]["url"]
      loser_urls = ", ".join(p["url"] for p in page_list[1:])
      ```

   e. **Recommendation**:
      ```
      if severity == "high":
          recommendation = f"Consolidate. Redirect {loser_urls} → {winner_url} or canonicalize."
      elif severity == "medium":
          recommendation = f"Differentiate: ensure {loser_urls} target a distinct keyword variant."
      else:
          recommendation = f"Low priority. Monitor {loser_urls} as rankings improve."
      ```

   f. **Build record**:
      ```python
      record = CannibalizationRecord(
          keyword=query,
          pages=page_list,
          severity=severity,
          recommendation=recommendation,
      )
      results.append(record)
      ```

5. **Sort results**: Sort `results` by severity: `high` first, then `medium`, then `low`. Within same severity, sort by total impressions descending.
   ```
   severity_order = {"high": 0, "medium": 1, "low": 2}
   results.sort(key=lambda r: (severity_order.get(r.severity, 3), -sum(p.get("impressions", 0) for p in r.pages)))
   ```

6. **Log exit**: `self.log.info("detect_cannibalization_done", total_records=len(results))`

7. Return `results`.

### Edge cases

- **Empty `query_page_data` list**: `groups` is empty → returns `[]`.
- **All queries have < `min_impressions`**: All filtered out → returns `[]`.
- **Query with only 1 page**: Filtered out at step 3 (`len(rows) < 2`).
- **All pages have 0 clicks**: Sorted arbitrarily (stable sort). Winner is first in sorted order. Still produces a valid record.
- **Missing fields in row dicts**: All `.get()` calls have defaults. `query=""` rows are skipped (empty string is falsy).

### Logging

| Event | Level | Fields |
|-------|-------|--------|
| `detect_cannibalization_start` | `debug` | `rows`, `min_impressions` |
| `detect_cannibalization_done` | `info` | `total_records` |

---

## 10. Private Helper: `_count_syllables()`

### Signature

```python
def _count_syllables(self, word: str) -> int:
```

### Algorithm

1. `word = word.lower().strip(".,!?;:")`
2. If `not word`: return `0`.
3. `count = len(re.findall(r'[aeiou]+', word))` — counts vowel groups.
4. If `word.endswith('e')` and `count > 1`: `count -= 1` — silent 'e' heuristic.
5. Return `max(1, count)`.

### Edge cases

- **Empty string after strip**: Returns `0`.
- **Word with no vowels** (e.g., "rhythm"): `count = 0`, `max(1, 0) = 1`. Correct.
- **Single letter "a"**: `count = 1`, doesn't end in 'e', `max(1, 1) = 1`. Correct.
- **"bie" (ends in e, 2 vowel groups)**: `count = 2`, ends in 'e' and `count > 1` → `count = 1`. Returns 1.
- **Non-English words**: Best-effort. The vowel group heuristic is English-centric but returns a reasonable approximation. No special handling.
- **Punctuation-only string**: `strip(".,!?;:")` removes all chars → empty → returns `0`.

### Logging

None. Pure computation.

---

## 11. Private Helper: `_compute_readability()`

### Signature

```python
def _compute_readability(self, text: str, paragraphs: list[str]) -> ReadabilityMetrics:
```

### Algorithm

1. **Handle empty text**: If `not text.strip()`: return `ReadabilityMetrics()` (all defaults: 0.0/0/"").

2. **Split into words**: `words = text.split()`. `word_count = len(words)`.

3. **Handle insufficient words**: If `word_count == 0`: return `ReadabilityMetrics()`.

4. **Split into sentences**: `sentences = re.split(r'(?<=[.!?])\s+', text)`. Filter empty: `sentences = [s for s in sentences if s.strip()]`. `sentence_count = len(sentences)`.

5. **Handle no sentences**: If `sentence_count == 0`: set `sentence_count = 1` (treat entire text as one sentence).

6. **Syllable counting**: `total_syllables = sum(self._count_syllables(w) for w in words)`.

7. **Complex words**: `complex_word_count = sum(1 for w in words if self._count_syllables(w) >= 3)`.

8. **Average sentence length**: `avg_sentence_length = word_count / sentence_count`.

9. **Average word length**: `avg_word_length = sum(len(w) for w in words) / word_count`.

10. **Flesch Reading Ease**:
    ```
    flesch = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (total_syllables / word_count)
    flesch = max(0.0, min(100.0, flesch))
    ```

11. **Flesch-Kincaid Grade**:
    ```
    fk_grade = 0.39 * (word_count / sentence_count) + 11.8 * (total_syllables / word_count) - 15.59
    ```

12. **Gunning Fog Index**:
    ```
    fog = 0.4 * ((word_count / sentence_count) + 100.0 * (complex_word_count / word_count))
    ```

13. **Reading level**: Determine from Flesch Reading Ease (pre-clamp value is fine since we already clamped):
    ```
    if flesch >= 90: reading_level = "5th grade"
    elif flesch >= 80: reading_level = "6th grade"
    elif flesch >= 70: reading_level = "7th grade"
    elif flesch >= 60: reading_level = "8th-9th grade"
    elif flesch >= 50: reading_level = "10th-12th grade"
    elif flesch >= 30: reading_level = "college"
    else: reading_level = "professional/technical"
    ```

14. **Build and return**:
    ```python
    return ReadabilityMetrics(
        flesch_reading_ease=round(flesch, 2),
        flesch_kincaid_grade=round(fk_grade, 2),
        gunning_fog_index=round(fog, 2),
        avg_sentence_length=round(avg_sentence_length, 2),
        avg_word_length=round(avg_word_length, 2),
        syllable_count=total_syllables,
        sentence_count=sentence_count,
        word_count=word_count,
        paragraph_count=len(paragraphs),
        reading_level=reading_level,
    )
    ```

### Edge cases

- **Single word**: `word_count=1`, `sentence_count=1`. `avg_sentence_length=1.0`. Flesch = `206.835 - 1.015*1 - 84.6*syllables`. If 1-syllable word: `206.835 - 1.015 - 84.6 = 121.22` → clamped to 100.0. Reading level = "5th grade". Valid.
- **No sentence-ending punctuation**: `re.split` finds no splits → entire text is one sentence. `sentence_count = 1`.
- **Text is only punctuation**: After splitting, `words` is empty → returns defaults.
- **Division by zero guards**: `word_count == 0` returns early (step 3). `sentence_count == 0` corrected to 1 (step 5). No division by zero is possible.

### Logging

None. Pure computation.

---

## 12. Private Helper: `_compute_keyword_usage()`

### Signature

```python
def _compute_keyword_usage(
    self,
    target_keyword: Optional[str],
    url: str,
    title: str,
    description: str,
    h1_list: list[str],
    h2_list: list[str],
    full_text: Optional[str],
    word_count: int,
) -> Optional[KeywordUsage]:
```

### Algorithm

1. If `target_keyword is None` or `target_keyword.strip() == ""`: return `None`.

2. `kw_lower = target_keyword.strip().lower()`

3. **In title**: `in_title = kw_lower in title.lower()`

4. **In H1**: `in_h1 = any(kw_lower in h.lower() for h in h1_list)`

5. **In meta description**: `in_meta_description = kw_lower in description.lower()`

6. **In URL**: `in_url = kw_lower.replace(" ", "-") in url.lower() or kw_lower.replace(" ", "") in url.lower() or kw_lower in url.lower()`
   Rationale: URLs encode spaces as hyphens or remove them. Check all three forms.

7. **In first 100 words** (review mode only — when `full_text` is not None):
   ```
   if full_text is not None:
       first_100 = " ".join(full_text.split()[:100]).lower()
       in_first_100_words = kw_lower in first_100
   else:
       in_first_100_words = False
   ```

8. **In headings (H2-H6)**: `heading_count = sum(1 for h in h2_list if kw_lower in h.lower())`. This counts how many H2+ headings contain the keyword. (Crawl data only provides h2 list; h3+ text is not available from crawl data. In review mode, h2_list comes from regex extraction.)

9. **Density**:
   ```
   if full_text is not None and word_count > 0:
       kw_words = kw_lower.split()
       # Count occurrences of the keyword phrase in full text
       text_lower = full_text.lower()
       count = 0
       start = 0
       while True:
           idx = text_lower.find(kw_lower, start)
           if idx == -1:
               break
           count += 1
           start = idx + 1
       density = (count * len(kw_words) / word_count) * 100.0
   else:
       count = 0
       density = 0.0
   ```
   Note: `density` is the percentage of total words that the keyword phrase occupies. For a 2-word keyword found 3 times in 300 words: `(3 * 2 / 300) * 100 = 2.0%`.

10. **Prominence score**:
    ```
    prominence = 0.0
    if in_title: prominence += 30.0
    if in_h1: prominence += 25.0
    if in_first_100_words: prominence += 20.0
    if in_meta_description: prominence += 15.0
    if in_url: prominence += 10.0
    ```
    Max possible = 100.0, already normalized.

11. **Build and return**:
    ```python
    return KeywordUsage(
        keyword=target_keyword.strip(),
        density=round(density, 2),
        count=count,
        in_title=in_title,
        in_h1=in_h1,
        in_first_100_words=in_first_100_words,
        in_meta_description=in_meta_description,
        in_url=in_url,
        heading_count=heading_count,
        prominence_score=round(prominence, 2),
    )
    ```

### Edge cases

- **Keyword is whitespace only**: `target_keyword.strip() == ""` → returns `None`.
- **Keyword not found anywhere**: All booleans False. `count=0`, `density=0.0`, `prominence_score=0.0`. Valid `KeywordUsage` with all False flags.
- **Keyword appears in URL with hyphens**: Step 6 checks hyphenated form.
- **Empty h1_list / h2_list**: `any(...)` on empty list returns False. `sum(...)` on empty list returns 0.
- **full_text is None (audit mode)**: `in_first_100_words = False`, `count = 0`, `density = 0.0`.
- **word_count = 0 with full_text provided**: density computation guarded by `word_count > 0`.

### Logging

None. Pure computation.

---

## 13. Private Helper: `_compute_structure()`

This helper is **not** a separate method. Structure is built inline in `analyze_page()` (step 12) and `review_content()` (step 19). No separate `_compute_structure()` method exists.

**Rationale**: The structure data comes from different sources in audit vs. review mode (crawl-data fields vs. regex/HTMLParser extraction), so it's assembled directly in each public method rather than unified into a shared helper.

---

## 14. Private Helper: `_compute_seo_score()`

### Signature

```python
def _compute_seo_score(self, keyword_usage: Optional[KeywordUsage], mode: str) -> float:
```

### Algorithm

1. If `keyword_usage is None`: return `0.0`.

2. `score = 0.0`

3. If `keyword_usage.in_title`: `score += 25.0`

4. If `keyword_usage.in_h1`: `score += 20.0`

5. If `keyword_usage.in_meta_description`: `score += 15.0`

6. If `mode == "review"` and `keyword_usage.in_first_100_words`: `score += 15.0`

7. If `keyword_usage.in_url`: `score += 15.0`

8. If `keyword_usage.heading_count >= 1`: `score += 10.0`

9. Return `score`.

### Points breakdown

| Condition | Points | Mode |
|-----------|--------|------|
| `in_title` | 25 | both |
| `in_h1` | 20 | both |
| `in_meta_description` | 15 | both |
| `in_first_100_words` | 15 | review only |
| `in_url` | 15 | both |
| `heading_count >= 1` | 10 | both |
| **Max total (review)** | **100** | |
| **Max total (audit)** | **85** | |

In audit mode, the maximum possible seo_score is 85.0 (since `in_first_100_words` is always False without full_text). This is by design — audit mode has less data available. **Exception**: if `raw_html` is passed to `analyze_page`, `full_text` is available and `in_first_100_words` can be True, but the mode is still `"audit"` so the 15 points are still not awarded. This is intentional — the `in_first_100_words` points are only for review mode.

### Edge cases

- **`keyword_usage = None`**: Returns `0.0`. Caller already appended `NO_KEYWORD_PROVIDED`.
- **Invalid mode string**: Treated as non-review. Only `mode == "review"` triggers the `in_first_100_words` bonus.

### Logging

None. Pure computation.

---

## 15. Private Helper: `_compute_structure_score()`

### Signature

```python
def _compute_structure_score(self, structure: ContentStructure) -> float:
```

### Algorithm

1. `score = 0.0`

2. If `structure.heading_hierarchy_valid`: `score += 30.0`

3. If `structure.h2_count >= 2`: `score += 20.0`

4. If `structure.internal_links >= 3`: `score += 15.0`

5. **Alt text coverage**:
   ```
   if structure.image_count == 0:
       score += 15.0    # no images = not penalized
   elif structure.images_with_alt / structure.image_count >= 0.80:
       score += 15.0
   ```

6. If `structure.list_count >= 1`: `score += 10.0`

7. If `structure.long_paragraphs == 0`: `score += 10.0`

8. Return `score`.

### Points breakdown

| Condition | Points |
|-----------|--------|
| `heading_hierarchy_valid == True` | 30 |
| `h2_count >= 2` | 20 |
| `internal_links >= 3` | 15 |
| alt coverage >= 80% OR no images | 15 |
| `list_count >= 1` | 10 |
| `long_paragraphs == 0` | 10 |
| **Max total** | **100** |

### Edge cases

- **`image_count = 0`**: Full 15 points awarded (not penalized).
- **`image_count = 1, images_with_alt = 1`**: Coverage = 100% ≥ 80% → 15 points.
- **`image_count = 1, images_with_alt = 0`**: Coverage = 0% < 80% → 0 points.
- **Audit mode, no raw_html**: `list_count=0`, `long_paragraphs=0`, `table_count=0`. The `long_paragraphs == 0` check awards 10 points (since it's 0 by default — this is correct: we can't detect long paragraphs without HTML, so we don't penalize).

### Logging

None. Pure computation.

---

## 16. Private Helper: `_compute_quality_score()`

### Signature

```python
def _compute_quality_score(
    self,
    seo_score: float,
    readability_score: float,
    structure_score: float,
    is_thin: bool,
) -> float:
```

### Algorithm

```python
thin_bonus = 100.0 if not is_thin else 0.0
quality = (
    0.35 * seo_score
    + 0.30 * readability_score
    + 0.25 * structure_score
    + 0.10 * thin_bonus
)
return round(quality, 2)
```

### Weight breakdown

| Component | Weight | Range |
|-----------|--------|-------|
| `seo_score` | 0.35 | 0-100 |
| `readability_score` | 0.30 | 0-100 |
| `structure_score` | 0.25 | 0-100 |
| thin bonus | 0.10 | 0 or 100 |
| **Result** | | **0-100** |

### Edge cases

- **Audit mode (readability_score=0.0)**: Quality score max is `0.35*85 + 0.30*0 + 0.25*100 + 0.10*100 = 29.75 + 0 + 25 + 10 = 64.75`. This is by design.
- **All zeros**: `quality = 0.0`.
- **All maxed**: `quality = 0.35*100 + 0.30*100 + 0.25*100 + 0.10*100 = 100.0`.

### Logging

None. Pure computation.

---

## 17. Private Helper: `_simhash()`

### Signature

```python
def _simhash(
    self,
    title: str,
    h1_list: list[str],
    h2_list: list[str],
    description: str,
) -> Optional[str]:
```

Returns a 16-character hex string, or `None` if input is insufficient to form trigrams.

### Algorithm

1. **Normalize input**:
   ```
   h1_joined = " ".join(h1_list)
   h2_joined = " ".join(h2_list)
   raw = f"{title} {h1_joined} {h2_joined} {description}"
   normalized = re.sub(r'[^\w\s]', '', raw.lower())
   tokens = normalized.split()
   ```

2. **Check minimum tokens**: If `len(tokens) < 3`: return `None`. Cannot form trigrams.

3. **Generate word trigrams**:
   ```
   shingles = Counter()
   for i in range(len(tokens) - 2):
       shingle = tokens[i] + tokens[i + 1] + tokens[i + 2]
       shingles[shingle] += 1
   ```

4. **Weighted bit vector**:
   ```
   V = [0] * 64
   for shingle, count in shingles.items():
       raw_hash = hashlib.sha256(shingle.encode()).digest()[:8]
       h = int.from_bytes(raw_hash, 'big')
       for i in range(64):
           if (h >> i) & 1:
               V[i] += count
           else:
               V[i] -= count
   ```

5. **Fingerprint**:
   ```
   simhash = 0
   for i in range(64):
       if V[i] > 0:
           simhash |= (1 << i)
   ```

6. Return `f"{simhash:016x}"`.

### Edge cases

- **All inputs empty**: `raw = "   "`, `tokens = []`, `len(tokens) < 3` → returns `None`.
- **Exactly 3 tokens**: Produces exactly 1 trigram. Valid. Returns a hash.
- **< 3 tokens** (1 or 2 words total across all fields): Returns `None`. The page is excluded from duplicate detection.
- **Unicode text**: `re.sub(r'[^\w\s]', '', ...)` keeps Unicode word chars (`\w` includes Unicode letters/digits). Trigrams will form from non-English words. SimHash still works — it's content-agnostic.
- **Duplicate tokens**: `Counter` correctly counts repeated shingles with higher weight.

### Logging

None. Pure computation.

---

## 18. Private Helper: `_hamming_distance()`

### Signature

```python
def _hamming_distance(self, a: int, b: int) -> int:
```

Both `a` and `b` are 64-bit integers (parsed from hex SimHash).

### Algorithm

```python
return bin(a ^ b).count('1')
```

### Edge cases

- **Identical hashes**: `a ^ b = 0`, `bin(0) = '0b0'`, `count('1') = 0`. Correct.
- **Maximally different**: Returns 64 (all bits differ).

### Logging

None. Pure computation.

---

## 19. Private Helper: `_extract_text_from_html()`

### Signature

```python
def _extract_text_from_html(
    self,
    html: str,
) -> tuple[str, list[str], int, int, bool]:
```

Returns: `(full_text, paragraphs, list_count, table_count, has_toc)`.

### Algorithm

1. Create `extractor = _TextExtractor()`.
2. `extractor.feed(html)`.
3. `extractor.close()`.
4. Return `(extractor.full_text, extractor.paragraphs, extractor.list_count, extractor.table_count, extractor.has_toc)`.

### Edge cases

- **Empty string**: `full_text = ""`, `paragraphs = []`, all counts 0, `has_toc = False`.
- **Plain text (no tags)**: All data goes into `_current_para` via `handle_data`. No `</p>` endtag fires, so `paragraphs` stays empty. `full_text = ""`. The **caller** handles this (see `review_content()` step 3: fallback treats raw_content as full_text).
- **Malformed HTML**: `HTMLParser` is lenient. Does not raise. Partial data is collected.
- **Nested tags within `<p>`**: `handle_data` is called for each text node. `_current_para` accumulates all text nodes between `<p>` open and `</p>` close, even across nested inline elements like `<strong>`, `<a>`, etc.

### Logging

None. Pure computation.

---

## 20. Private Helper: `_check_freshness()`

### Signature

```python
def _check_freshness(self, last_modified: Optional[datetime]) -> tuple[bool, Optional[int]]:
```

Returns: `(is_stale, content_age_days)`.

### Algorithm

1. If `last_modified is None`: return `(False, None)`.
2. `age_days = (datetime.utcnow() - last_modified).days`.
3. `is_stale = age_days > self.STALE_DAYS`.
4. Return `(is_stale, age_days)`.

### Edge cases

- **`last_modified` is None**: Returns `(False, None)`. `is_stale` is False, `content_age_days` is None.
- **`last_modified` is in the future**: `age_days` is negative. `is_stale = False` (negative < 365). `content_age_days` is negative. This is acceptable — the caller can interpret a negative age.
- **`last_modified` is timezone-aware**: `datetime.utcnow()` returns naive UTC. Subtraction of aware and naive datetimes raises `TypeError`. The `last_modified` parsing in `analyze_page()` step 3 should produce naive datetimes. If a timezone-aware datetime is passed, wrap the subtraction in try/except `TypeError` and return `(False, None)`.

### Logging

None. Pure computation.

---

## 21. Private Helper: `_generate_recommendations()`

### Signature

```python
def _generate_recommendations(
    self,
    issues: list[str],
    word_count: int,
    content_age_days: Optional[int],
) -> list[str]:
```

### Algorithm

Iterate issues and produce one recommendation string per actionable issue.

```python
recommendations: list[str] = []
for issue in issues:
    if issue == "THIN_CONTENT":
        recommendations.append(
            f"Page has only {word_count} words. Expand to {self.THIN_THRESHOLD}+ for substantive content."
        )
    elif issue == "STALE_CONTENT":
        if content_age_days is not None:
            recommendations.append(
                f"Content is {content_age_days} days old. Consider refreshing."
            )
    elif issue == "MISSING_H1":
        recommendations.append("Add an H1 tag to this page.")
    elif issue == "MULTIPLE_H1":
        recommendations.append("Use only one H1 tag per page.")
    elif issue == "NO_KEYWORD_PROVIDED":
        recommendations.append("Provide a target keyword for SEO analysis.")
    elif issue == "LOW_SEO_SCORE":
        recommendations.append(
            "Improve keyword placement: add target keyword to title, H1, meta description, and URL."
        )
    elif issue == "LOW_STRUCTURE_SCORE":
        recommendations.append(
            "Improve content structure: add H2 subheadings, internal links, and lists."
        )
    elif issue == "NO_INTERNAL_LINKS":
        recommendations.append("Add internal links to relevant pages on this site.")
    elif issue == "MISSING_ALT_TEXT":
        recommendations.append("Add descriptive alt text to all images.")
    elif issue == "READABILITY_NOT_ANALYZED":
        pass  # No actionable recommendation — this is informational
    # DUPLICATE_CONTENT and NEAR_DUPLICATE_CONTENT recommendations are
    # added directly in analyze_batch(), not here.
return recommendations
```

### Edge cases

- **Empty issues list**: Returns `[]`.
- **Unknown issue string** (e.g., from crawl-data pre-flagged issues like `"TITLE_TOO_LONG"`): No match in any branch. Silently skipped. No recommendation generated for it.
- **`content_age_days is None` with `STALE_CONTENT`**: This shouldn't happen (stale implies age is known), but guard with the `if content_age_days is not None` check. If None, skip the recommendation.

### Logging

None. Pure computation.

---

## 22. Edge Case Matrix

| Scenario | Behavior |
|----------|----------|
| **Empty `page_data` dict `{}`** | All fields default via `.get()`. `url=""`, `title=""`, `word_count=0`, `is_thin=True`. `h1_list=[]` → `MISSING_H1`. `internal_links=0` → `NO_INTERNAL_LINKS`. `READABILITY_NOT_ANALYZED` added. `NO_KEYWORD_PROVIDED` added. SimHash returns `None` (no tokens). `quality_score` near 0. Returns valid record with ~6 issues. |
| **`page_data` with `wordCount = 0`** | `is_thin = True`. `THIN_CONTENT` added. Readability metrics stay at defaults. Recommendation: "Page has only 0 words. Expand to 300+ for substantive content." |
| **No `target_keyword` provided** | `keyword_usage = None`. `seo_score = 0.0`. `NO_KEYWORD_PROVIDED` added to issues. No `LOW_SEO_SCORE` added (that check is gated on `keyword_usage is not None`). |
| **HTML with no `<p>` tags (plain text only)** | `_TextExtractor` collects no paragraphs. `full_text = ""`. `review_content()` step 3 fallback: treats entire `raw_content` as one paragraph. Readability computed on the full string. |
| **Single-word content** | `word_count=1`, `is_thin=True`. Readability: `sentence_count=1`, `avg_sentence_length=1.0`. Flesch clamped to 100.0. `reading_level="5th grade"`. Density may be 100% if that one word is the keyword. |
| **Non-English content** | Syllable counter is English-centric but returns `max(1, count)` — always at least 1. SimHash works on any Unicode text. Reading level labels are misleading for non-English but no crash. |
| **Batch with 0 pages** | `analyze_batch()` returns `([], [])` immediately. No logging of progress. |
| **Batch with 1 page** | Analyzes the single page. SimHash index has 1 entry. Pairwise loop body never executes (`range(0, 0)` or `range(1) × range(1,1)`). Returns `([record], [])`. |
| **Search Console data with only 1 page per query** | `len(rows) < 2` filter removes all queries. Returns `[]`. |
| **`target_keyword` provided but not found anywhere** | `KeywordUsage` returned with all booleans False, `count=0`, `density=0.0`, `prominence_score=0.0`. `seo_score = 0.0`. `LOW_SEO_SCORE` added. Recommendation generated. |
| **`imgCount = 0` (no images)** | `images_with_alt = 0`. In structure score: `image_count == 0` → 15 points awarded (not penalized). No `MISSING_ALT_TEXT` (since `imgWithoutAlt` defaults to 0). |
| **`last_modified = None`** | `_check_freshness` returns `(False, None)`. `is_stale = False`. `content_age_days = None`. No `STALE_CONTENT` issue. |
| **`raw_html = ""` (empty string)** | `raw_html.strip() == ""` → treated as no raw HTML. Audit mode: `READABILITY_NOT_ANALYZED`. Review mode: `full_text = ""`, `word_count = 0`, `is_thin = True`. Readability returns defaults. |
| **`raw_html` provided as plain text (no HTML tags)** | `_TextExtractor` finds no tags, all data goes to `_current_para`, no `</p>` triggers. `paragraphs = []`, `full_text = ""`. In `review_content()`: step 3 fallback catches this — uses `raw_content` as `full_text`. In `analyze_page()` with `raw_html`: same fallback needed. **Implementation note**: after calling `_extract_text_from_html()`, check if `full_text` is empty but `raw_html.strip()` is not. If so, set `full_text = raw_html.strip()` and `paragraphs = [full_text]`. |
| **SimHash of page with < 3 words** (cannot form trigrams) | `_simhash()` returns `None`. Page excluded from `simhash_map` in `analyze_batch()`. Not eligible for any duplicate comparison. `record.simhash = None`. |
| **All pages have identical SimHash** | All pages grouped into one `DuplicateGroup`. `avg_hamming = 0`. `similarity = 1.0`. Recommendation: "Merge or 301 redirect" (unless word counts diverge by 1.5x). Each record's `duplicate_of` points to another page in the group. |
| **`page_data` with unexpected field types** (e.g., `wordCount` is a string) | `.get()` returns the value as-is. Comparisons like `word_count < 300` may raise `TypeError` if the value is non-numeric. **Implementation note**: cast numeric fields defensively: `word_count = int(page_data.get("wordCount", 0) or 0)`. Use `int(...) or 0` pattern for `h2Count`, `h3Count`, `imgCount`, `imgWithoutAlt`, `contextualInternalLinks`, `externalLinks`. The `or 0` handles `None` values. |
| **`last_modified` as ISO string with timezone** | `datetime.fromisoformat()` in Python 3.11+ handles timezone offsets. The `replace("Z", "+00:00")` handles the Z suffix. Result is timezone-aware. `_check_freshness` subtraction with `datetime.utcnow()` (naive) would raise `TypeError`. **Fix**: strip timezone info after parsing: `last_modified = last_modified.replace(tzinfo=None)`. |
| **Batch with >1000 pages** | Only exact SimHash bucket matching (step 6 "n > 1000" branch). Near-duplicates (hamming 1-8) are not detected. Only pages with identical 64-bit fingerprints are grouped. This is a performance optimization. |
| **`h2` field missing from crawl data** | `page_data.get("h2", [])` returns `[]`. `h2_list` is empty. Keyword heading check returns 0. No crash. |
| **Crawl-data `issues` field contains duplicate issue strings that the analyzer also flags** | `existing_issues` are copied into `issues` list first. Analyzer may append the same string again (e.g., crawl data has `"MISSING_ALT_TEXT"` and analyzer also detects it). **Implementation note**: before appending any issue, check `if issue_str not in issues`. This prevents duplicate issue strings. |

---

## Appendix A: Complete Method Index

| # | Method | Visibility | Returns |
|---|--------|-----------|---------|
| 1 | `__init__()` | public | `None` |
| 2 | `analyze_page()` | public | `ContentQualityRecord` |
| 3 | `review_content()` | public | `ContentQualityRecord` |
| 4 | `analyze_batch()` | public | `tuple[list[ContentQualityRecord], list[DuplicateGroup]]` |
| 5 | `detect_cannibalization()` | public | `list[CannibalizationRecord]` |
| 6 | `_count_syllables()` | private | `int` |
| 7 | `_compute_readability()` | private | `ReadabilityMetrics` |
| 8 | `_compute_keyword_usage()` | private | `Optional[KeywordUsage]` |
| 9 | `_compute_seo_score()` | private | `float` |
| 10 | `_compute_structure_score()` | private | `float` |
| 11 | `_compute_quality_score()` | private | `float` |
| 12 | `_simhash()` | private | `Optional[str]` |
| 13 | `_hamming_distance()` | private | `int` |
| 14 | `_extract_text_from_html()` | private | `tuple[str, list[str], int, int, bool]` |
| 15 | `_check_freshness()` | private | `tuple[bool, Optional[int]]` |
| 16 | `_generate_recommendations()` | private | `list[str]` |

Module-level class (not a method of `ContentQualityAnalyzer`):

| # | Class | Visibility | Purpose |
|---|-------|-----------|---------|
| 1 | `_TextExtractor(HTMLParser)` | module-private | HTML → paragraph text extraction |

## Appendix B: Defensive Casting Pattern

For all numeric fields read from `page_data` in `analyze_page()`, use this pattern:

```python
def _safe_int(val: Any, default: int = 0) -> int:
    """Safely cast a value to int."""
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default
```

Apply to: `wordCount`, `h2Count`, `h3Count`, `imgCount`, `imgWithoutAlt`, `contextualInternalLinks`, `externalLinks`.

This is a **module-level utility function**, not a method on the class. Prefix with `_`.

## Appendix C: Issue Deduplication Pattern

Before appending any issue string to the `issues` list, check membership:

```python
def _add_issue(issues: list[str], issue: str) -> None:
    if issue not in issues:
        issues.append(issue)
```

Use this throughout `analyze_page()` and `review_content()` instead of bare `.append()`. This prevents duplicate issues when crawl-data pre-flags the same issue the analyzer detects.

This is a **module-level utility function**. Prefix with `_`.
