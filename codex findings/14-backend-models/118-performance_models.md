# Script Audit: `platform/src/audit_platform/models/performance.py`

Last updated: 2026-04-18

File: [platform/src/audit_platform/models/performance.py](/root/site-audit/platform/src/audit_platform/models/performance.py:1)

## Purpose

`performance.py` defines the shared schema for performance data coming from
PageSpeed Insights and CrUX.

It is the bridge between two different performance-data sources:

- Lighthouse/PageSpeed lab data
- CrUX field data

## Inputs

Primary dependencies:

- `pydantic`
- `typing`

Primary runtime producers:

- `PageSpeedConnector`
- `CrUXConnector`

## Outputs

This file provides:

- `PageSpeedRecord`
- `CrUXRecord`
- `CoreWebVitals`

## How It Works

### 1. Separates source-specific record types

`PageSpeedRecord` models Lighthouse/PageSpeed results.

`CrUXRecord` models CrUX percentile field data.

### 2. Combines them into one umbrella object

`CoreWebVitals` can hold both:

- CrUX mobile/desktop field data
- Lighthouse mobile/desktop lab data

## Strengths

- clean separation between PSI and CrUX record shapes
- small and easy to understand
- convenient umbrella model for combined reporting

## Weaknesses

### `CoreWebVitals` is easy to misuse

The combined model is convenient, but it also invites confusion because it
stores different source types in the same object.

This matters because `PageSpeedConnector.get_core_web_vitals(...)` only
populates the Lighthouse fields, while the model name can make consumers assume
field CWV data is present too.

### Opportunities and diagnostics are loosely typed

`PageSpeedRecord.opportunities` and `PageSpeedRecord.diagnostics` are generic
`list[dict]` payloads.

### Units are implied, not encoded

The field names suggest units, but the model itself does not encode or document
them strongly. That leaves some interpretation burden on connectors and
consumers.

## Failure Modes

- mixed-source records can be interpreted as more complete than they are
- opportunity/diagnostic payloads can drift by connector behavior because the
  model does not constrain their structure
- reporting code can blur lab and field signals if it is not careful

## Improvement Targets

### High priority

- make mixed-source completeness explicit when `CoreWebVitals` is only partially
  populated

### Medium priority

- add typed submodels for opportunities and diagnostics if those structures are
  important to reporting
- document units more explicitly at the model or field-description level

## Bottom Line

`performance.py` is structurally clean, but it encodes an important semantic
trap: one wrapper model is carrying two different measurement systems.

That is manageable if the rest of the code is disciplined. If not, this file
becomes an easy place for lab-vs-field confusion to spread.
