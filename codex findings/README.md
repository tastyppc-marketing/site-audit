# Codex Findings

Last updated: 2026-04-18

This folder contains the script-by-script audit of the `site-audit` repository.
Each analyzed script gets its own markdown file.

## Audit Phases

1. Orchestrators and entrypoints
2. Data-gathering scripts
3. Data-population and normalization scripts
4. Report generators
5. Shared report runtime scripts
6. Page renderers
7. Python analyzers
8. API connectors
9. QA and tests
10. Platform entrypoints
11. Connector test scripts
12. Backend source analyzers
13. Backend connectors
14. Backend models
15. Auth modules
16. Config modules
17. Utility modules
18. Template root source
19. Archived utilities
20. Root-level utilities

## Completed Findings

### 01 Orchestrators

- [01-build_audit.md](/root/site-audit/codex%20findings/01-orchestrators/01-build_audit.md)
- [02-generate_multipage_report.md](/root/site-audit/codex%20findings/01-orchestrators/02-generate_multipage_report.md)

### 02 Data Gathering

- [03-crawl_sitemap.md](/root/site-audit/codex%20findings/02-data-gathering/03-crawl_sitemap.md)
- [04-extract_text.md](/root/site-audit/codex%20findings/02-data-gathering/04-extract_text.md)
- [05-gather_pagespeed.md](/root/site-audit/codex%20findings/02-data-gathering/05-gather_pagespeed.md)
- [06-browse.md](/root/site-audit/codex%20findings/02-data-gathering/06-browse.md)
- [07-check_technical.md](/root/site-audit/codex%20findings/02-data-gathering/07-check_technical.md)
- [08-gather_domain_metrics.md](/root/site-audit/codex%20findings/02-data-gathering/08-gather_domain_metrics.md)
- [09-gather_backlinks.md](/root/site-audit/codex%20findings/02-data-gathering/09-gather_backlinks.md)
- [10-gather_organic_metrics.md](/root/site-audit/codex%20findings/02-data-gathering/10-gather_organic_metrics.md)
- [11-gather_keyword_volumes.md](/root/site-audit/codex%20findings/02-data-gathering/11-gather_keyword_volumes.md)
- [12-gather_local_pack.md](/root/site-audit/codex%20findings/02-data-gathering/12-gather_local_pack.md)
- [13-gather_local_seo.md](/root/site-audit/codex%20findings/02-data-gathering/13-gather_local_seo.md)
- [19-ddg_search.md](/root/site-audit/codex%20findings/02-data-gathering/19-ddg_search.md)

### 03 Data Population And Normalization

- [14-populate_audit_data.md](/root/site-audit/codex%20findings/03-data-population-and-normalization/14-populate_audit_data.md)

### 04 Report Generators

- [15-generate_spreadsheet.md](/root/site-audit/codex%20findings/04-report-generators/15-generate_spreadsheet.md)
- [16-generate_presentation.md](/root/site-audit/codex%20findings/04-report-generators/16-generate_presentation.md)
- [20-generate_ppc_spreadsheet.md](/root/site-audit/codex%20findings/04-report-generators/20-generate_ppc_spreadsheet.md)
- [21-generate_ppc_presentation.md](/root/site-audit/codex%20findings/04-report-generators/21-generate_ppc_presentation.md)
- [23-generate_report_html.md](/root/site-audit/codex%20findings/04-report-generators/23-generate_report_html.md)
- [59-generate_ppc_report.md](/root/site-audit/codex%20findings/04-report-generators/59-generate_ppc_report.md)

### 05 Shared Report Runtime

- [22-fetch_with_retry.md](/root/site-audit/codex%20findings/05-shared-report-runtime/22-fetch_with_retry.md)
- [24-data_loader.md](/root/site-audit/codex%20findings/05-shared-report-runtime/24-data_loader.md)
- [25-debug_data.md](/root/site-audit/codex%20findings/05-shared-report-runtime/25-debug_data.md)
- [26-charts.md](/root/site-audit/codex%20findings/05-shared-report-runtime/26-charts.md)
- [27-search.md](/root/site-audit/codex%20findings/05-shared-report-runtime/27-search.md)
- [28-print.md](/root/site-audit/codex%20findings/05-shared-report-runtime/28-print.md)
- [29-utils.md](/root/site-audit/codex%20findings/05-shared-report-runtime/29-utils.md)
- [30-nav.md](/root/site-audit/codex%20findings/05-shared-report-runtime/30-nav.md)
- [31-table_pagination.md](/root/site-audit/codex%20findings/05-shared-report-runtime/31-table_pagination.md)
- [32-table_filters.md](/root/site-audit/codex%20findings/05-shared-report-runtime/32-table_filters.md)
- [33-explainer.md](/root/site-audit/codex%20findings/05-shared-report-runtime/33-explainer.md)
- [60-ppc_data_loader.md](/root/site-audit/codex%20findings/05-shared-report-runtime/60-ppc_data_loader.md)
- [61-ppc_utils.md](/root/site-audit/codex%20findings/05-shared-report-runtime/61-ppc_utils.md)
- [62-ppc_nav.md](/root/site-audit/codex%20findings/05-shared-report-runtime/62-ppc_nav.md)
- [63-ppc_charts.md](/root/site-audit/codex%20findings/05-shared-report-runtime/63-ppc_charts.md)
- [64-ppc_search.md](/root/site-audit/codex%20findings/05-shared-report-runtime/64-ppc_search.md)
- [65-ppc_print.md](/root/site-audit/codex%20findings/05-shared-report-runtime/65-ppc_print.md)

### 06 Page Renderers

- [34-multipage_architecture.md](/root/site-audit/codex%20findings/06-page-renderers/34-multipage_architecture.md)
- [35-index_page.md](/root/site-audit/codex%20findings/06-page-renderers/35-index_page.md)
- [36-keywords_page.md](/root/site-audit/codex%20findings/06-page-renderers/36-keywords_page.md)
- [37-technical_page.md](/root/site-audit/codex%20findings/06-page-renderers/37-technical_page.md)
- [38-content_page.md](/root/site-audit/codex%20findings/06-page-renderers/38-content_page.md)
- [39-links_page.md](/root/site-audit/codex%20findings/06-page-renderers/39-links_page.md)
- [40-competitors_page.md](/root/site-audit/codex%20findings/06-page-renderers/40-competitors_page.md)
- [41-local_page.md](/root/site-audit/codex%20findings/06-page-renderers/41-local_page.md)
- [42-action_plan_page.md](/root/site-audit/codex%20findings/06-page-renderers/42-action_plan_page.md)
- [58-backlink_opportunities_page.md](/root/site-audit/codex%20findings/06-page-renderers/58-backlink_opportunities_page.md)
- [66-ppc_index_page.md](/root/site-audit/codex%20findings/06-page-renderers/66-ppc_index_page.md)
- [67-ppc_structure_page.md](/root/site-audit/codex%20findings/06-page-renderers/67-ppc_structure_page.md)
- [68-ppc_quality_score_page.md](/root/site-audit/codex%20findings/06-page-renderers/68-ppc_quality_score_page.md)
- [69-ppc_search_terms_page.md](/root/site-audit/codex%20findings/06-page-renderers/69-ppc_search_terms_page.md)
- [70-ppc_wasted_spend_page.md](/root/site-audit/codex%20findings/06-page-renderers/70-ppc_wasted_spend_page.md)
- [71-ppc_budget_page.md](/root/site-audit/codex%20findings/06-page-renderers/71-ppc_budget_page.md)
- [72-ppc_action_plan_page.md](/root/site-audit/codex%20findings/06-page-renderers/72-ppc_action_plan_page.md)

### 09 QA And Tests

- [43-qa_test.md](/root/site-audit/codex%20findings/09-qa-and-tests/43-qa_test.md)
- [44-normalizer_test.md](/root/site-audit/codex%20findings/09-qa-and-tests/44-normalizer_test.md)
- [73-conftest.md](/root/site-audit/codex%20findings/09-qa-and-tests/73-conftest.md)
- [74-test_reporting_intelligence.md](/root/site-audit/codex%20findings/09-qa-and-tests/74-test_reporting_intelligence.md)
- [75-test_config.md](/root/site-audit/codex%20findings/09-qa-and-tests/75-test_config.md)
- [76-test_models.md](/root/site-audit/codex%20findings/09-qa-and-tests/76-test_models.md)
- [77-test_competitor.md](/root/site-audit/codex%20findings/09-qa-and-tests/77-test_competitor.md)
- [78-test_rank_tracker.md](/root/site-audit/codex%20findings/09-qa-and-tests/78-test_rank_tracker.md)
- [79-test_technical_seo.md](/root/site-audit/codex%20findings/09-qa-and-tests/79-test_technical_seo.md)
- [80-test_eeat_signals.md](/root/site-audit/codex%20findings/09-qa-and-tests/80-test_eeat_signals.md)
- [81-test_content_quality.md](/root/site-audit/codex%20findings/09-qa-and-tests/81-test_content_quality.md)
- [82-test_ppc_analyzer.md](/root/site-audit/codex%20findings/09-qa-and-tests/82-test_ppc_analyzer.md)
- [83-test_content_gap.md](/root/site-audit/codex%20findings/09-qa-and-tests/83-test_content_gap.md)
- [84-test_internal_linking.md](/root/site-audit/codex%20findings/09-qa-and-tests/84-test_internal_linking.md)
- [85-test_indexation_crawlability.md](/root/site-audit/codex%20findings/09-qa-and-tests/85-test_indexation_crawlability.md)
- [86-test_backlinks.md](/root/site-audit/codex%20findings/09-qa-and-tests/86-test_backlinks.md)
- [87-test_local_seo.md](/root/site-audit/codex%20findings/09-qa-and-tests/87-test_local_seo.md)
- [88-tests_package_init.md](/root/site-audit/codex%20findings/09-qa-and-tests/88-tests_package_init.md)

### 10 Platform Entrypoints

- [45-run_all.md](/root/site-audit/codex%20findings/10-platform-entrypoints/45-run_all.md)
- [46-run_backlink_analysis.md](/root/site-audit/codex%20findings/10-platform-entrypoints/46-run_backlink_analysis.md)
- [47-run_rank_tracker.md](/root/site-audit/codex%20findings/10-platform-entrypoints/47-run_rank_tracker.md)
- [48-generate_oauth_token.md](/root/site-audit/codex%20findings/10-platform-entrypoints/48-generate_oauth_token.md)

### 11 Connector Test Scripts

- [49-test_pagespeed.md](/root/site-audit/codex%20findings/11-connector-test-scripts/49-test_pagespeed.md)
- [50-test_dataforseo.md](/root/site-audit/codex%20findings/11-connector-test-scripts/50-test_dataforseo.md)
- [51-test_google_ads.md](/root/site-audit/codex%20findings/11-connector-test-scripts/51-test_google_ads.md)
- [52-test_search_console.md](/root/site-audit/codex%20findings/11-connector-test-scripts/52-test_search_console.md)
- [53-test_ga4.md](/root/site-audit/codex%20findings/11-connector-test-scripts/53-test_ga4.md)
- [54-test_business_profile.md](/root/site-audit/codex%20findings/11-connector-test-scripts/54-test_business_profile.md)
- [55-test_crux.md](/root/site-audit/codex%20findings/11-connector-test-scripts/55-test_crux.md)
- [56-test_brand_mentions.md](/root/site-audit/codex%20findings/11-connector-test-scripts/56-test_brand_mentions.md)
- [57-test_local_seo.md](/root/site-audit/codex%20findings/11-connector-test-scripts/57-test_local_seo.md)

### 12 Backend Source Analyzers

- [89-analyzers_package_init.md](/root/site-audit/codex%20findings/12-backend-analyzers/89-analyzers_package_init.md)
- [90-backlinks_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/90-backlinks_analyzer.md)
- [91-competitor_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/91-competitor_analyzer.md)
- [92-reporting_intelligence_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/92-reporting_intelligence_analyzer.md)
- [93-rank_tracker_source.md](/root/site-audit/codex%20findings/12-backend-analyzers/93-rank_tracker_source.md)
- [94-content_gap_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/94-content_gap_analyzer.md)
- [95-content_quality_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/95-content_quality_analyzer.md)
- [96-eeat_signals_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/96-eeat_signals_analyzer.md)
- [97-indexation_crawlability_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/97-indexation_crawlability_analyzer.md)
- [98-internal_linking_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/98-internal_linking_analyzer.md)
- [99-local_seo_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/99-local_seo_analyzer.md)
- [100-ppc_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/100-ppc_analyzer.md)
- [101-technical_seo_analyzer.md](/root/site-audit/codex%20findings/12-backend-analyzers/101-technical_seo_analyzer.md)

### 13 Backend Connectors

- [102-connectors_package_init.md](/root/site-audit/codex%20findings/13-backend-connectors/102-connectors_package_init.md)
- [103-base_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/103-base_connector.md)
- [104-dataforseo_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/104-dataforseo_connector.md)
- [105-google_ads_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/105-google_ads_connector.md)
- [106-search_console_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/106-search_console_connector.md)
- [107-business_profile_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/107-business_profile_connector.md)
- [108-brand_mentions_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/108-brand_mentions_connector.md)
- [109-crux_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/109-crux_connector.md)
- [110-ga4_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/110-ga4_connector.md)
- [111-local_seo_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/111-local_seo_connector.md)
- [112-pagespeed_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/112-pagespeed_connector.md)
- [113-social_audit_connector.md](/root/site-audit/codex%20findings/13-backend-connectors/113-social_audit_connector.md)

### 14 Backend Models

- [114-models_package_init.md](/root/site-audit/codex%20findings/14-backend-models/114-models_package_init.md)
- [115-content_models.md](/root/site-audit/codex%20findings/14-backend-models/115-content_models.md)
- [116-linking_models.md](/root/site-audit/codex%20findings/14-backend-models/116-linking_models.md)
- [117-local_models.md](/root/site-audit/codex%20findings/14-backend-models/117-local_models.md)
- [118-performance_models.md](/root/site-audit/codex%20findings/14-backend-models/118-performance_models.md)
- [119-ppc_models.md](/root/site-audit/codex%20findings/14-backend-models/119-ppc_models.md)
- [120-seo_models.md](/root/site-audit/codex%20findings/14-backend-models/120-seo_models.md)

### 15 Auth Modules

- [121-auth_package_init.md](/root/site-audit/codex%20findings/15-auth-modules/121-auth_package_init.md)
- [122-oauth_auth.md](/root/site-audit/codex%20findings/15-auth-modules/122-oauth_auth.md)
- [123-service_account_auth.md](/root/site-audit/codex%20findings/15-auth-modules/123-service_account_auth.md)

### 16 Config Modules

- [124-config_package_init.md](/root/site-audit/codex%20findings/16-config-modules/124-config_package_init.md)
- [125-settings_config.md](/root/site-audit/codex%20findings/16-config-modules/125-settings_config.md)

### 17 Utility Modules

- [126-utils_package_init.md](/root/site-audit/codex%20findings/17-utility-modules/126-utils_package_init.md)
- [127-logging_utils.md](/root/site-audit/codex%20findings/17-utility-modules/127-logging_utils.md)
- [128-retry_utils.md](/root/site-audit/codex%20findings/17-utility-modules/128-retry_utils.md)

### 18 Template Root Source

- [129-generate_report_legacy_template.md](/root/site-audit/codex%20findings/18-template-root-source/129-generate_report_legacy_template.md)
- [130-tailwind_config_template.md](/root/site-audit/codex%20findings/18-template-root-source/130-tailwind_config_template.md)

### 19 Archived Utilities

- [131-check_competitor_schema_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/131-check_competitor_schema_archive.md)
- [132-check_remaining_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/132-check_remaining_archive.md)
- [133-check_schema_detail_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/133-check_schema_detail_archive.md)
- [134-debug_google_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/134-debug_google_archive.md)
- [135-generate_presentation_v2_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/135-generate_presentation_v2_archive.md)
- [136-generate_spreadsheet_v2_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/136-generate_spreadsheet_v2_archive.md)
- [137-google_search_v2_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/137-google_search_v2_archive.md)
- [138-google_search_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/138-google_search_archive.md)
- [139-search_bing_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/139-search_bing_archive.md)
- [140-search_ddg_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/140-search_ddg_archive.md)
- [141-temp_pcler_about_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/141-temp_pcler_about_archive.md)
- [142-temp_tisha_about_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/142-temp_tisha_about_archive.md)
- [143-keyword_research_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/143-keyword_research_archive.md)
- [144-monitor_sh_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/144-monitor_sh_archive.md)
- [145-search_curl_sh_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/145-search_curl_sh_archive.md)
- [146-watch_results_sh_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/146-watch_results_sh_archive.md)
- [147-root_package_archive.md](/root/site-audit/codex%20findings/19-archived-utilities/147-root_package_archive.md)

### 20 Root-Level Utilities

- [148-benchmark_analyzer_root.md](/root/site-audit/codex%20findings/20-root-level-utilities/148-benchmark_analyzer_root.md)
- [149-benchmark_test_root.md](/root/site-audit/codex%20findings/20-root-level-utilities/149-benchmark_test_root.md)
- [150-install_sh_root.md](/root/site-audit/codex%20findings/20-root-level-utilities/150-install_sh_root.md)
- [151-root_package_json.md](/root/site-audit/codex%20findings/20-root-level-utilities/151-root_package_json.md)
- [152-audit_platform_package_init.md](/root/site-audit/codex%20findings/20-root-level-utilities/152-audit_platform_package_init.md)
- [153-template_package_json.md](/root/site-audit/codex%20findings/20-root-level-utilities/153-template_package_json.md)

### 07 Python Analyzers

- [17-analyze_backlink_quality.md](/root/site-audit/codex%20findings/07-python-analyzers/17-analyze_backlink_quality.md)

### 08 API Connectors

- [18-parse_google_ads.md](/root/site-audit/codex%20findings/08-api-connectors/18-parse_google_ads.md)

## Next Planned Files

Upcoming analysis targets in the current pass:

- generated client copies only if you want the audit to extend beyond canonical source into per-client artifacts
- backup folders only if you want the audit to include historical duplicates rather than just canonical source
