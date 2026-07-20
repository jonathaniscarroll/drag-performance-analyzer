# Drag Cass-essment

A Google Apps Script web app for scoring, archiving, and visualising drag performances. Built on a **matrix-authoring pattern** borrowed from the epiaesthetics analyzer — assessments are structured as positioned values across authorable continua.

Aesthetic: warm paper / dossier / notebook. Editorial, not SaaS.

---

## Architecture

| Layer | Technology |
|---|---|
| Backend | Google Apps Script (`src/Code.js`) |
| Frontend | `src/Index.html` via `HtmlService` |
| Data store | Google Sheet (ID in `SPREADSHEET_ID` constant) |
| Version control | [clasp](https://github.com/google/clasp) → this GitHub repo |
| CI/CD | GitHub Actions → `clasp push --force` on push to `main` |

---

## Google Sheet Schema

Sheets are created automatically on first load. **Do not rename them.**

### `Dimensions` sheet
Authors the rubric. Edit directly in the sheet or via the **Dimensions** tab in the app.

| Pole A | Pole B | Description |
|---|---|---|
| Control | Letting go | How much does the performer hold vs. release? |
| … | … | … |

### `Performers` sheet
Stable performer registry. Managed via the **Assess** tab in the app.

| Performer ID | Performer Name | Notes | Created At |
|---|---|---|---|
| `perf_abc123…` | Viva Las Dragus | she/her | 2026-07-20 |

### `Responses` sheet (schema v2)
One row per assessment. Columns shift right after the performer cols were added in v2 — old data is migrated automatically.

| Col | Field |
|---|---|
| A | Archive ID |
| B | Timestamp |
| C | Performance Name |
| D | Notes |
| E | Evaluator |
| F | **Performer ID** |
| G | **Performer Name** |
| H+ | Dimension scores (one per continuum, −5 → +5) |

> **Migration note:** If you have existing v1 rows (dims starting at col F), `ensureResponseHeaders_()` detects the old schema and inserts the two new performer columns automatically. Existing scores shift to col H+ intact.

---

## App Tabs

### Assess
- Choose an existing performer from the dropdown, or click **+ New** to add one inline — the dropdown refreshes and auto-selects immediately.
- Name the performance/show separately from the performer.
- Score each continuum with a slider (−5 = Pole A, +5 = Pole B, 0 = centre).
- Load any existing assessment to edit it.

### Archive
- Filter by **performer** and/or **day** (calendar day, `America/Halifax` timezone).
- Toggle between **Cards** view (clickable cards → jumps to edit) and **Matrix** view.
- Matrix view renders one SVG row per continuum: individual score dots (lilac) + average marker (dashed magenta line).

### Dimensions
- View current continua.
- Add new pole pairs with optional description.
- Full authoring is also available directly in the `Dimensions` Google Sheet.

---

## Backend Functions Reference

| Function | Purpose |
|---|---|
| `doGet()` | Serve the web app |
| `initializeSheets()` | Bootstrap all three sheets on first load |
| `getDimensionPairs()` | Return all continua |
| `addDimensionPair(a, b, desc)` | Append a new continuum |
| `getPerformerOptions()` | Return performers sorted alphabetically |
| `addPerformer(name, notes)` | Add performer with stable UUID, deduplicates by name |
| `submitAssessment(data)` | Write a new assessment row |
| `getAllResponses()` | Return all assessments |
| `getArchiveOptions()` | Return ID + name list for the edit dropdown |
| `getArchiveById(id)` | Return one assessment for editing |
| `updateArchiveAssessment(data)` | Overwrite an existing row |
| `getDistinctAssessmentDays()` | Return unique `yyyy-MM-dd` keys (Halifax tz) |
| `getResponsesByFilters(filters)` | Filter by `performerId` and/or `day` |
| `buildMatrixData(filters)` | Return per-dimension score arrays + averages for SVG rendering |

---

## Local Dev Setup

```bash
# 1. Install clasp globally
npm install -g @google/clasp

# 2. Authenticate
clasp login

# 3. Edit .clasp.json — set your scriptId
#    { "scriptId": "YOUR_SCRIPT_ID", "rootDir": "src" }

# 4. Push to Apps Script
clasp push

# 5. Open in Apps Script editor
clasp open

# 6. Deploy as web app (first time: do this manually in the editor)
#    Subsequent deploys: handled by GitHub Actions
