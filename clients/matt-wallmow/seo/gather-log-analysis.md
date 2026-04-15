# Gather Script Baseline (v1) Log Analysis
**Project:** Matt Wallmow SEO Audit
**Date:** April 15, 2026
**Source:** `clients/matt-wallmow/seo/gather-log.txt`

## 1. Failure Analysis
- **PageSpeed Insights (PSI):** Failed with HTTP 500 for `redmanrealtygroup.com` [mobile]. 
  - *Cause:* Transient server-side error at Google.
  - *Observation:* No retry was attempted, confirming the script was using the old un-refactored code.
- **Local Pack Check:** Timed out after the 8th keyword.
  - *Cause:* The DFS SERP API takes ~30s per query. Processing 25 keywords sequentially exceeds the default 10-minute shell timeout.
- **Directory Checks:** `gather-local-seo.js` succeeded but 3/4 directories found is actually low for a established brand. (Manual check needed for Yelp/Facebook blocks).

## 2. Data Integrity Issues
- **Keyword Volumes:** Only 9 out of 25 keywords returned volume data.
  - *Diagnosis:* Not a script bug. DataForSEO Google Ads API returns `null` for keywords with <10 monthly searches. 
  - *Affected terms:* Brand terms ("Matt Wallmow realtor") and niche long-tail ("log cabin for sale Rhinelander WI").
- **Organic Metrics:** Succeeded for all 6 domains. Shorewest.com is the outlier with 61k keywords, which may skew competitor charts if not using log scale.

## 3. Improvements Beyond Retry Logic
While Task #8 (Retry Logic) addresses the transient 500s, further improvements are needed:
1.  **Concurrency:** PageSpeed Insights calls should be parallelized (at least n=2) to reduce total runtime from 4+ minutes to <2 minutes.
2.  **Keyword Volume Fallback:** `gather-keyword-volumes.js` should treat `null` results as "<10" rather than missing data to avoid empty cells in the final report.
3.  **Local Pack Optimization:** 
    - Reduce keyword list for Local Pack to TOP 5 high-intent keywords only.
    - Alternatively, implement batching or increase script timeout to 15+ minutes.
4.  **Bot Detection Awareness:** Many directory checks (Yelp, Facebook) fail silently or return 403 when run from a data center IP. Need to implement real browser user-agents or proxy support for `gather-local-seo.js`.

## 4. Conclusion
The baseline run confirms that without retry logic and concurrency control, the data gathering process is brittle and slow. The Task #8/9 upgrades are critical. The current report is usable but has significant data gaps in PageSpeed and Local Pack that will be filled in the v2 run.
