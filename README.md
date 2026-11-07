# Rules Lawyer

A mobile-first, static daily Magic: The Gathering rules puzzle.

**The daily challenge is the product.** The Workshop is a private editorial tool for importing, reviewing, correcting, previewing, and exporting question content.

## Goals

- One shared daily puzzle for everyone.
- Short, approachable rules scenarios rather than trivia.
- Clear explanations with traceable Comprehensive Rules references.
- No backend, accounts, API keys, or build step.
- Repository files are the source of truth.
- Browser storage is only a convenience for unfinished Workshop work and player progress.

## Run locally

Open `index.html` in a browser, or use GitHub Pages. The project uses browser-native JavaScript and JSON files.

For local testing, a simple static server is more reliable than opening files directly:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

1. Create a repository and upload these files.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the default branch and `/ (root)`.
4. Save. GitHub Pages will publish `index.html`.

The Workshop is available at `/workshop.html`. It is an editorial convenience, not an authenticated admin area. Anyone who can access the site can open it. Do not put secrets or private information in the repository.

## Content workflow

1. Generate a proposed batch using `docs/question-authoring.md`.
2. Import the JSON in the Workshop.
3. Review the player-facing question and editorial briefing.
4. Correct the fields in the editor, or mark the question as needing expert review.
5. Preview the player experience.
6. Export the batch JSON.
7. Replace the corresponding file under `content/questions/` in GitHub and commit it.
8. Run the checks in `docs/content-workflow.md`.

**Important:** The Workshop does not commit to GitHub. It exports JSON for you to paste or upload into the repository. Local browser drafts are not the canonical copy.

## Daily selection

The game fetches all JSON files listed in `content/manifest.json`, filters to questions with `status: "approved"` and `review.rules: "verified"`, sorts them by stable ID, and selects one using the UTC date. This means everyone sees the same daily question, regardless of local timezone.

The first version intentionally has no answer submission to a server, global leaderboard, or cross-device account sync.

## Rules accuracy and intellectual property

Rules Lawyer is an independent fan project and is not affiliated with or endorsed by Wizards of the Coast.

- Always record the Comprehensive Rules version used for verification.
- Link each ruling to specific rules and, where appropriate, official policy documents.
- A structural validation pass is not rules validation.
- AI-generated answers and explanations must not be treated as authoritative.
- Have a qualified rules expert review technically uncertain questions before marking them verified.
- Review Wizards of the Coast fan-content and trademark guidance before public launch.
- Follow Scryfall's current API and bulk-data terms if card data is added later. This starter does not call Scryfall or bundle card images.

## Project structure

```text
.
├── index.html                 # Daily player experience
├── workshop.html              # Mobile-first editorial workshop
├── content/
│   ├── manifest.json          # Explicit list of question batches
│   └── questions/
│       └── batch-001.json     # Starter reviewed example
├── src/
│   ├── common.js
│   ├── game.js
│   └── workshop.js
└── docs/
    ├── content-workflow.md
    ├── question-authoring.md
    └── question-schema.json
```

## Current scope

This is a working starter, not a finished content library. It includes one carefully scoped example question so the complete import/edit/preview/export path can be exercised. Build the initial 50-question library in reviewed batches; do not fill the repository with unverified generated questions.
