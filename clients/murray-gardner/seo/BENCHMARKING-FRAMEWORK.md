# Dual-Route Benchmarking Framework: Claude vs Codex
## Murray Gardner SEO Audit — March 2026

### Purpose
Both Claude and Codex will independently produce every implementation deliverable (meta tags, schema markup, community pages, blog posts). This framework defines how we objectively score and compare outputs without bias toward either LLM's strengths.

---

## Scoring Methodology

### Blind Review Protocol
1. Both LLMs produce deliverables saved as `claude-{deliverable}.md` and `codex-{deliverable}.md`
2. A **code-reviewer agent** scores each independently against the rubric below
3. A **product-verifier agent** checks compliance with audit requirements
4. Scores are compared head-to-head per deliverable
5. The best sections from each are merged into the final deliverable

### Anti-Bias Measures
- Scoring criteria defined BEFORE either LLM sees the task
- Numerical scores only (1-10 per dimension) — no subjective "feels better"
- Each dimension has explicit criteria at each score level (see rubric below)
- Reviewer must cite specific evidence for each score
- Neither LLM's name is mentioned in the review prompt (files are labeled "Version A" and "Version B" with random assignment)

---

## Scoring Dimensions (4 categories, weighted)

### 1. SEO Technical Accuracy (30% weight)
Measures correctness of SEO implementation against 2026 best practices.

| Score | Criteria |
|-------|----------|
| 9-10 | All character counts within spec, keywords properly placed, schema validates, no technical errors |
| 7-8 | Minor character count deviations (<5 chars), keywords present but placement could improve |
| 5-6 | Some meta tags over/under length, missing keywords on 2-3 pages, minor schema issues |
| 3-4 | Multiple pages with wrong-length meta tags, keyword stuffing or absence, schema errors |
| 1-2 | Fundamental SEO errors throughout, invalid schema, missing required elements |

**Specific checks:**
- Meta title: 50-60 characters (with explicit count shown)
- Meta description: 120-155 characters (with explicit count shown)
- H1: exactly 1 per page, includes primary keyword
- Schema: validates against schema.org, uses @graph correctly, consistent @id URIs
- Canonical tags: properly formed
- FAQ sections: properly structured for AI Overview optimization

### 2. Content Quality & Depth (30% weight)
Measures the quality, uniqueness, and usefulness of written content.

| Score | Criteria |
|-------|----------|
| 9-10 | Unique, locally specific content with real data; expert voice; no generic filler; compelling CTAs |
| 7-8 | Mostly unique content, some generic sections; good local references; decent CTAs |
| 5-6 | Mix of unique and template content; some local details but not deeply researched |
| 3-4 | Mostly generic/template content; could apply to any market; weak CTAs |
| 1-2 | Entirely generic; no local specificity; reads like AI filler |

**Specific checks:**
- Community pages: 1,000+ words minimum
- Blog posts: 900-1,200 words
- Local specificity: mentions specific neighborhoods, price ranges, local landmarks
- Supporting keywords: uses LSI/semantic terms naturally
- Voice: matches luxury real estate brand tone
- Data: includes real market stats, price ranges, neighborhood details

### 3. Actionability & Deployment-Readiness (20% weight)
Measures how easily the client can implement the deliverables.

| Score | Criteria |
|-------|----------|
| 9-10 | Copy-paste ready; clear implementation instructions; no ambiguity; all fields populated |
| 7-8 | Nearly deployment-ready; 1-2 items need client verification; instructions clear |
| 5-6 | Needs moderate editing before deployment; some placeholders; instructions vague |
| 3-4 | Significant editing needed; multiple placeholders; unclear where to implement |
| 1-2 | Not usable without major rework |

**Specific checks:**
- No placeholder text (e.g., "[INSERT HERE]", "TBD")
- Implementation instructions included
- Priority order specified
- Platform-specific notes (if Sierra Interactive, WordPress, etc.)

### 4. 2026 Compliance & AI Optimization (20% weight)
Measures alignment with current SEO standards and AI Overview optimization.

| Score | Criteria |
|-------|----------|
| 9-10 | E-E-A-T signals strong; FAQ sections on every page; AI Overview-optimized; no deprecated patterns |
| 7-8 | Good E-E-A-T signals; FAQ on most pages; mostly AI Overview-ready |
| 5-6 | Some E-E-A-T signals; FAQ on some pages; partially AI-ready |
| 3-4 | Weak E-E-A-T signals; few/no FAQ sections; not optimized for AI |
| 1-2 | No E-E-A-T consideration; no AI optimization; uses deprecated patterns |

**Specific checks:**
- FAQ sections present (3-5 Q&As per content page)
- Q&As target "People Also Ask" queries from keyword research
- Author attribution present
- Experience signals (first-person, local knowledge demonstration)
- No keyword stuffing (natural language)
- Schema markup uses current patterns (not deprecated)

---

## Per-Deliverable Scoring Template

For each deliverable (meta-tags, schema-markup, community-pages, blog-posts):

```
### [Deliverable Name]

| Dimension | Weight | Version A Score | Version B Score | Evidence |
|-----------|--------|----------------|----------------|----------|
| SEO Technical | 30% | /10 | /10 | ... |
| Content Quality | 30% | /10 | /10 | ... |
| Actionability | 20% | /10 | /10 | ... |
| 2026 Compliance | 20% | /10 | /10 | ... |
| **Weighted Total** | 100% | **/10** | **/10** | |

Winner: Version [A/B]
Recommendation: [Use Version X as base, incorporate Y from Version Z]
```

---

## Composite Score & Final Decision

After scoring all 4 deliverables:

| Deliverable | Version A | Version B | Winner | Merge Notes |
|-------------|-----------|-----------|--------|-------------|
| Meta Tags | /10 | /10 | | |
| Schema Markup | /10 | /10 | | |
| Community Pages | /10 | /10 | | |
| Blog Posts | /10 | /10 | | |
| **Overall** | **/10** | **/10** | | |

The final merged deliverable takes the best-scoring sections from each version.

---

## Lessons Learned (To Be Filled After Comparison)

- Which LLM excelled at which type of content?
- What patterns emerged in scoring differences?
- Recommendations for future dual-route audits
