# Script Audit: `template/reports/multipage/normalizer.test.js`

Last updated: 2026-04-18

File: [template/reports/multipage/normalizer.test.js](/root/site-audit/template/reports/multipage/normalizer.test.js:1)

## Purpose

`normalizer.test.js` is the unit-test file for normalization helpers exported by
`generate-multipage-report.js`.

It covers:

- `deepCamelCaseKeys`
- `normalizeAuditData`
- `validateAuditData`

## Inputs

Runtime dependencies:

- the Node test runner / Jest-style environment
- `generate-multipage-report.js`
- mocked filesystem access for research-file loading

## Outputs

- test pass/fail results in the test runner

## How It Works

### 1. Monkeypatches `fs`

Before running normalization tests, it overrides:

- `fs.existsSync`
- `fs.readFileSync`

so the normalizer can be exercised against synthetic research-file inputs.

### 2. Tests low-level key normalization

It verifies snake_case to camelCase conversion behavior, recursion, array
handling, and overwrite protection.

### 3. Tests higher-level audit normalization

It checks whether research artifacts are hoisted into the expected report
contract.

### 4. Tests validation warnings

It verifies that missing sections trigger issues and complete data avoids them.

## Strengths

- exercises one of the most important hidden layers in the repo
- covers both low-level and higher-level normalization behavior
- uses mocked file inputs to test realistic research ingestion paths

## Weaknesses

### Global fs monkeypatching

The test file replaces core `fs` methods directly.
That is workable, but brittle if tests ever run concurrently or if other tests
share the same process.

### Coupled to internal implementation details

Because it imports helpers directly from the generator file, it relies on that
script exporting internal functions intentionally.

### Coverage still selective

The tests cover important flows, but not the full breadth of normalization and
fallback behavior in the multipage generator.

## Failure Modes

- tests interfere with each other through shared fs monkeypatch state
- generator internals change shape and break tests even when behavior is still
  acceptable
- edge-case normalization paths remain untested

## Improvement Targets

### High priority

- Move normalization logic into a dedicated module and test it directly
- Replace ad hoc fs monkeypatching with a safer mocking approach
- Expand coverage for the browser-facing fallback contracts seen in page
  renderers

### Medium priority

- Add fixture files representing real client research bundles
- Add explicit tests for API-error propagation and partial-data fallback flows

## Bottom Line

`normalizer.test.js` is one of the more valuable test files in the repo because
it targets the normalization layer where many report problems originate.
Its main weakness is the test harness style, not the choice of what to test.
