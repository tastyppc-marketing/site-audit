# Site Audit Repository

SEO and PPC audit workspace with reusable scripts, templates, archived research, and client-specific deliverables.

This repository is safe to share without committed `node_modules` folders. Dependencies are intentionally excluded from Git and should be installed locally by each collaborator.

## What Is In This Repo

- `docs/` - Core playbook and process documentation
- `template/` - Reusable starter project for a new audit
- `clients/` - Client-specific audit projects
- `deliverables/` - Top-level deliverables and exported files
- `archive/` - Older scripts, results, and historical working files
- `Livinginparkcity/` - Local working folder currently left out of Git on purpose
- `.claude/` - Claude-specific local configuration used in this workspace

## Getting Started

### 1. Clone The Repository

```bash
git clone <repo-url>
cd "site audit"
```

### 2. Pick The Project You Want To Use

Most collaborators will work in one of these folders:

- `template/`
- `clients/murray-gardner/`

If you want to start a new client project, copy `template/` into `clients/<client-name>/`.

### 3. Install Dependencies

Run these commands inside the specific project folder you plan to use:

```bash
npm install
npm run setup
```

`npm run setup` installs the Playwright Chromium browser used by the scripts.

## Common Scripts

Run these from inside a project folder such as `template/` or `clients/murray-gardner/`:

```bash
npm run browse
npm run crawl
npm run search
npm run check
npm run spreadsheet
npm run presentation
npm run generate
```

For PPC work:

```bash
npm run parse-ppc
npm run ppc-spreadsheet
npm run ppc-presentation
npm run ppc-generate
```

## Important Notes For Collaborators

- `node_modules/` is not committed. That is normal and expected.
- If the repo is freshly cloned, scripts will not run until `npm install` has been run in the project folder.
- Some Windows-created symlink shim files inside `node_modules/.bin` cannot be stored cleanly in this repo on this filesystem, which is another reason dependencies are excluded.
- `Livinginparkcity/` is intentionally ignored in Git right now and will not be included when others clone the repository.

## Documentation

- Main process guide: `docs/SEO-AUDIT-PLAYBOOK.md`
- Template usage guide: `template/README.md`
- Example client setup: `clients/murray-gardner/README.md`

## Recommended Sharing Workflow

1. Clone the repo.
2. Open the client or template folder you want to work in.
3. Run `npm install`.
4. Run `npm run setup`.
5. Start using the scripts or follow the playbook.
