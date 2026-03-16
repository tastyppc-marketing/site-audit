# Audit Platform

Python integration foundation for an SEO + PPC audit platform. Provides modular
connectors to Google Ads, GA4, Search Console, PageSpeed Insights, CrUX, Google
Business Profile, and DataForSEO -- all backed by Pydantic data models, structured
logging, and retry-aware HTTP clients.

---

## Architecture

```
platform/
├── src/audit_platform/
│   ├── auth/                  # OAuth & service-account credential helpers
│   │   ├── oauth.py           # Google OAuth2 refresh-token credentials
│   │   └── service_account.py # Service-account credentials (GA4, etc.)
│   │
│   ├── config/
│   │   └── settings.py        # Pydantic-Settings: all env vars in one place
│   │
│   ├── connectors/            # One file per API integration
│   │   ├── base.py            # Shared httpx client, settings, logger
│   │   ├── google_ads.py      # GoogleAdsConnector   (google-ads SDK)
│   │   ├── ga4.py             # GA4Connector          (google-analytics-data)
│   │   ├── search_console.py  # SearchConsoleConnector (googleapiclient)
│   │   ├── pagespeed.py       # PageSpeedConnector    (httpx)
│   │   ├── crux.py            # CrUXConnector         (httpx)
│   │   ├── business_profile.py# BusinessProfileConnector (googleapiclient)
│   │   └── dataforseo.py      # DataForSEOConnector   (httpx, basic auth)
│   │
│   ├── models/                # Pydantic v2 data models
│   │   ├── seo.py             # KeywordRecord, BacklinkRecord, etc.
│   │   ├── ppc.py             # CampaignRecord, AdGroupRecord, etc.
│   │   ├── performance.py     # PageSpeedRecord, CrUXRecord, CoreWebVitals
│   │   └── local.py           # BusinessProfileRecord, LocalPerformanceRecord
│   │
│   └── utils/
│       ├── logging.py         # structlog configuration
│       └── retry.py           # tenacity-based retry decorator
│
├── scripts/
│   ├── generate_oauth_token.py  # One-time OAuth consent flow
│   └── run_all.py               # Smoke-test every connector
│
├── tests/
│   ├── conftest.py
│   ├── test_config.py
│   └── test_models.py
│
├── pyproject.toml
└── .env                       # Your local config (never committed)
```

### Data flow

```
 .env / env vars
       │
       ▼
   Settings  ──────►  auth/oauth.py  ──────►  Google OAuth Credentials
       │               auth/service_account.py ──► Service-Account Credentials
       │
       ▼
  BaseConnector ────►  httpx.Client (timeout, retry)
       │
       ├──► GoogleAdsConnector ──────► Google Ads API
       ├──► GA4Connector ────────────► GA4 Data API
       ├──► SearchConsoleConnector ──► Search Console API
       ├──► PageSpeedConnector ──────► PageSpeed Insights API
       ├──► CrUXConnector ───────────► CrUX API
       ├──► BusinessProfileConnector ► Business Profile API
       └──► DataForSEOConnector ─────► DataForSEO REST API
                                            │
                                            ▼
                                     Pydantic Models
                                   (models/*.py)
```

---

## Quick Start

```bash
# 1. Clone and install in editable mode
cd platform
pip install -e ".[dev]"

# 2. Create your local config
cp .env.example .env

# 3. Fill in the values (see Environment Variables below)
#    Then complete the manual Google setup checklist.

# 4. Generate your OAuth refresh token
python scripts/generate_oauth_token.py \
    --client-secrets-file path/to/client_secret.json

# 5. Smoke-test all connectors
python scripts/run_all.py
```

---

## Environment Variables

Create a `.env` file in the `platform/` directory.

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 client ID | Google Cloud Console > APIs & Services > Credentials |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 client secret | Same as above |
| `GOOGLE_REFRESH_TOKEN` | Yes | Long-lived refresh token | Run `scripts/generate_oauth_token.py` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Yes | Google Ads API developer token | Google Ads MCC > Tools & Settings > API Center |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | Yes | MCC (manager) account ID, no dashes | Google Ads top-level MCC account number |
| `GOOGLE_ADS_CUSTOMER_ID` | Yes | Target client account ID, no dashes | Google Ads account to audit |
| `GA4_PROPERTY_ID` | Yes | GA4 numeric property ID | GA4 Admin > Property Settings |
| `SEARCH_CONSOLE_SITE_URL` | Yes | Verified property URL (with protocol) | Search Console > Settings, e.g. `https://example.com/` or `sc-domain:example.com` |
| `PAGESPEED_API_KEY` | No | API key for higher PageSpeed quota | Google Cloud Console > Credentials > API Keys |
| `CRUX_API_KEY` | No | API key for CrUX (can reuse PageSpeed key) | Same as above |
| `GBP_ACCOUNT_ID` | No | Google Business Profile account ID | Business Profile API `accounts.list` response |
| `GBP_LOCATION_ID` | No | Location ID within that account | Business Profile API `locations.list` response |
| `DATAFORSEO_LOGIN` | Yes* | DataForSEO API login/email | app.dataforseo.com > API Settings |
| `DATAFORSEO_PASSWORD` | Yes* | DataForSEO API password | Same as above |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | No | Path to service-account JSON key file | Google Cloud Console > IAM > Service Accounts |
| `LOG_LEVEL` | No | Logging level (default: `INFO`) | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `HTTP_TIMEOUT` | No | HTTP timeout in seconds (default: `30`) | Any positive integer |

*Required only if you use the DataForSEO connector.

---

## Manual Google Setup Checklist

Complete these steps once before using the platform. Each step links to where
you need to go; the order matters because some steps depend on earlier ones.

### 1. Create a Google Cloud project

Go to [console.cloud.google.com](https://console.cloud.google.com/) and create
a new project (e.g., "SEO Audit Platform"). Note the project ID.

### 2. Enable APIs

In the new project, go to **APIs & Services > Library** and enable each of
these APIs:

- **Google Ads API**
- **Google Analytics Data API** (the GA4 API -- not the older Universal Analytics API)
- **Google Search Console API** (listed as "Google Search Console API")
- **PageSpeed Insights API**
- **Chrome UX Report API**
- **My Business Business Information API** (for Google Business Profile)
- **My Business Account Management API**

Search by exact name if they are hard to find. Each one should show "Enabled"
on its dashboard page when done.

### 3. Configure the OAuth consent screen

Go to **APIs & Services > OAuth consent screen**.

1. Choose **External** user type (unless you have a Workspace org and want Internal).
2. Fill in app name, user support email, and developer contact email.
3. On the Scopes page add these scopes:
   - `https://www.googleapis.com/auth/adwords`
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/webmasters.readonly`
   - `https://www.googleapis.com/auth/business.manage`
4. On the Test Users page, add the Google account(s) you will authenticate with.
5. Save. (You can publish the app later when ready; while in Testing mode only
   the listed test users can authorize.)

### 4. Create OAuth client credentials

Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.

1. Application type: **Desktop app**.
2. Name it anything (e.g., "Audit CLI").
3. Click **Create**, then **Download JSON**.
4. Save the downloaded file as `client_secret.json` in a safe location. You
   will pass its path to the token-generation script.

### 5. Create a service account (for GA4)

If you want to use a service account instead of (or in addition to) OAuth for
GA4:

1. Go to **IAM & Admin > Service Accounts > Create Service Account**.
2. Name it (e.g., "ga4-reader").
3. Skip the optional permissions page (you will grant access at the property
   level in step 8).
4. Click **Done**, then click the new service account row.
5. Go to **Keys > Add Key > Create New Key > JSON**. Download the file.
6. Set `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env` to the path of this file.

### 6. Get a Google Ads developer token

1. Sign in to your **MCC (Manager) account** at [ads.google.com](https://ads.google.com).
2. Go to **Tools & Settings > Setup > API Center**.
3. If you have never applied, you will see the developer token application
   form. Fill it out.
4. You will receive a developer token with **Test Account** access immediately.
   For production data you need to apply for **Basic** or **Standard** access
   (Google reviews this; it usually takes a few business days).
5. Copy the token into `GOOGLE_ADS_DEVELOPER_TOKEN` in `.env`.

### 7. Generate a refresh token

Run the included helper script:

```bash
python scripts/generate_oauth_token.py \
    --client-secrets-file path/to/client_secret.json
```

A browser window will open. Sign in with the Google account that has access to
the Ads, Analytics, Search Console, and Business Profile properties you want to
audit.

After consent, the script prints a `refresh_token`. Copy it into
`GOOGLE_REFRESH_TOKEN` in `.env`.

> **Tip:** The refresh token is long-lived but can be revoked if the user
> removes access or if you change scopes. If a connector starts returning 401
> errors, re-run this script.

### 8. Add the service account to your GA4 property

1. Open [analytics.google.com](https://analytics.google.com) and go to your
   GA4 property.
2. Navigate to **Admin > Property > Property Access Management**.
3. Click **+** (Add users) and enter the service account email (it looks like
   `name@project-id.iam.gserviceaccount.com`).
4. Grant the **Viewer** role.
5. Save. It may take a few minutes to propagate.

### 9. Verify Search Console property ownership

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add a property if you have not already. The URL-prefix method or domain
   method both work.
3. Verify ownership via DNS, HTML file, HTML tag, or Google Analytics.
4. The Google account you authenticated with in step 7 must be an **Owner** or
   **Full** user on this property.
5. Set `SEARCH_CONSOLE_SITE_URL` in `.env` to exactly the property URL shown in
   Search Console (e.g., `https://example.com/` or `sc-domain:example.com`).

### 10. Confirm Business Profile account and location access

1. Go to [business.google.com](https://business.google.com) and confirm the
   Google account from step 7 can see the business listing(s) you want to audit.
2. To find your account and location IDs, you can use the Business Profile API
   `accounts.list` and `accounts.locations.list` endpoints, or look in the
   Business Profile Manager URL bar.
3. Set `GBP_ACCOUNT_ID` and `GBP_LOCATION_ID` in `.env`.

### 11. Sign up for DataForSEO

1. Go to [app.dataforseo.com](https://app.dataforseo.com/) and create an
   account.
2. Go to **API Settings** in the dashboard.
3. Copy your API login (email) and API password.
4. Set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` in `.env`.
5. Fund your account or activate a trial. SERP tasks cost ~$0.0006 each;
   Backlink tasks cost ~$0.02 each.

---

## Testing Each Integration

After setup, verify each connector independently:

```bash
# Smoke-test all connectors at once
python scripts/run_all.py

# Run the full test suite (unit tests, no live API calls)
pytest tests/ -v
```

---

## API Cost Summary

| API | Cost | Notes |
|---|---|---|
| Google Ads API | Free | Explorer/Basic/Standard access tiers |
| GA4 Data API | Free | Subject to [quota limits](https://developers.google.com/analytics/devguides/reporting/data/v1/quotas) (tokens per day/hour) |
| Search Console API | Free | 50,000 rows per request max; rate limits apply |
| PageSpeed Insights API | Free | Optional API key raises quota from 25 to 400 req/100 sec |
| CrUX API | Free | Optional API key raises quota from 150 to 200 req/100 sec |
| Business Profile API | Free | Requires verified business ownership |
| DataForSEO SERP | ~$0.0006/request | Pay-as-you-go; no minimum on SERP API |
| DataForSEO Backlinks | ~$0.02/request | Pay-as-you-go; $100/mo minimum on standalone Backlinks plan |

---

## Project Structure

```
platform/
├── pyproject.toml                  # Build config, dependencies, tool settings
├── .env                            # Local environment variables (git-ignored)
├── README.md
│
├── src/audit_platform/
│   ├── __init__.py
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── oauth.py
│   │   └── service_account.py
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py
│   ├── connectors/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── google_ads.py
│   │   ├── ga4.py
│   │   ├── search_console.py
│   │   ├── pagespeed.py
│   │   ├── crux.py
│   │   ├── business_profile.py
│   │   └── dataforseo.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── seo.py
│   │   ├── ppc.py
│   │   ├── performance.py
│   │   └── local.py
│   └── utils/
│       ├── __init__.py
│       ├── logging.py
│       └── retry.py
│
├── scripts/
│   ├── generate_oauth_token.py
│   └── run_all.py
│
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_config.py
    └── test_models.py
```

---

## Future Additions

These components are planned but not yet implemented:

- **Site Crawler** -- Scrapy or httpx-based crawl engine to discover pages,
  extract on-page SEO signals, and feed `PageAuditRecord` models.
- **Scoring Engine** -- Rule-based and weighted scoring system that takes raw
  connector data and produces per-page and site-wide audit scores.
- **AI Layer** -- LLM-powered analysis for generating plain-language audit
  summaries, prioritized recommendations, and competitive insights.
- **Report Generator** -- PDF/HTML export pipeline for client-ready audit
  deliverables.
- **Scheduler** -- Periodic re-crawl and data refresh (cron or task queue).
