# Drag Performance Analyzer

A Google Apps Script web app for scoring, archiving, and analyzing drag performances. Built on the **epiaesthetics analyzer** language and pattern.

## Stack
- **Backend**: Google Apps Script (`Code.gs`) bound to a Google Sheet
- **Frontend**: `Index.html` served via `HtmlService`
- **Version control**: [clasp](https://github.com/google/clasp) → this GitHub repo

## Local Dev Setup

```bash
# 1. Install clasp globally
npm install -g @google/clasp

# 2. Login
clasp login

# 3. Clone your existing GAS project (after deploying once from Apps Script UI)
#    Replace YOUR_SCRIPT_ID with the ID from your Apps Script project settings
clasp clone YOUR_SCRIPT_ID

# 4. Or link this repo to your script:
#    Edit .clasp.json and set your scriptId
```

## Workflow

```bash
# Push local changes to GAS
clasp push

# Pull GAS changes to local
clasp pull

# Open in Apps Script editor
clasp open

# Deploy as web app
clasp deploy --description "v1"
```

## Google Sheet Setup

Create a Google Sheet with a tab named `Performances` with these columns:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Performer | Song | Category | Aesthetic | TechnicalScore | CharismaScore | NervosityScore | UniquenessScore | TalentScore | Notes |

## Scoring System

Scores are based on the **C·U·N·T** rubric (1–10 per category):
- **Charisma** — stage presence and magnetism
- **Uniqueness** — originality of concept and execution
- **Nerve** — confidence and commitment
- **Talent** — technical skill (lip sync accuracy, dancing, acting)

## Connecting clasp to GitHub Actions (optional)

See `.github/workflows/` for an auto-push workflow on merge to main.
