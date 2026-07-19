#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${1:-$HOME/drag-performance-analyzer}"
SHEET_URL_DEFAULT="https://docs.google.com/spreadsheets/d/12L-GE7BJyd6wt4-NphafFBwuM4hkhgXMrTgpiCHHHkw/edit?usp=sharing"
SHEET_URL="${2:-$SHEET_URL_DEFAULT}"
SCRIPT_ID="${SCRIPT_ID:-}"
SECRET_NAME="${SECRET_NAME:-CLASPRC_JSON}"
REPO_SLUG="${REPO_SLUG:-jonathaniscarroll/drag-performance-analyzer}"
ENABLE_GH_SECRETS="${ENABLE_GH_SECRETS:-1}"

need() { command -v "$1" >/dev/null 2>&1 || { echo "Missing required command: $1" >&2; exit 1; }; }
need git
need node
need npm
need clasp

extract_sheet_id() {
  python3 - <<'PY' "$1"
import re, sys
url = sys.argv[1]
m = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
print(m.group(1) if m else '')
PY
}

SHEET_ID="$(extract_sheet_id "$SHEET_URL")"
if [[ -z "$SHEET_ID" ]]; then
  echo "Could not parse Google Sheet ID from URL: $SHEET_URL" >&2
  exit 1
fi

mkdir -p "$REPO_DIR/src" "$REPO_DIR/.github/workflows"
cd "$REPO_DIR"

if [[ ! -d .git ]]; then
  git init
  git branch -M main
fi

cat > .claspignore <<'CLASPIGNORE'
node_modules/
.git/
.env
*.md
.DS_Store
CLASPIGNORE

if [[ -n "$SCRIPT_ID" ]]; then
  cat > .clasp.json <<CLASPJSON
{
  "scriptId": "$SCRIPT_ID",
  "rootDir": "src"
}
CLASPJSON
elif [[ ! -f .clasp.json ]]; then
  cat > .clasp.json <<'CLASPJSON'
{
  "scriptId": "PUT_YOUR_SCRIPT_ID_HERE",
  "rootDir": "src"
}
CLASPJSON
fi

cat > src/appsscript.json <<'APPS'
{
  "timeZone": "America/Halifax",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "access": "ANYONE",
    "executeAs": "USER_DEPLOYING"
  }
}
APPS

cat > src/Code.gs <<'CODE'
const SHEET_NAME = 'Performances';
const REQUIRED_HEADERS = [
  'Performer',
  'Song',
  'Category',
  'Aesthetic',
  'TechnicalScore',
  'CharismaScore',
  'NervosityScore',
  'UniquenessScore',
  'TalentScore',
  'Notes'
];

function doGet() {
  ensureSheetFormat_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Drag Performance Analyzer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function ensureSheetFormat_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME, 0);

  const maxCols = Math.max(sh.getMaxColumns(), REQUIRED_HEADERS.length);
  if (sh.getMaxColumns() < REQUIRED_HEADERS.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), REQUIRED_HEADERS.length - sh.getMaxColumns());
  }

  const current = sh.getRange(1, 1, 1, REQUIRED_HEADERS.length).getValues()[0];
  const isEmpty = current.every(v => String(v).trim() === '');
  const matches = REQUIRED_HEADERS.every((h, i) => String(current[i]).trim() === h);

  if (isEmpty || !matches) {
    sh.getRange(1, 1, 1, REQUIRED_HEADERS.length).setValues([REQUIRED_HEADERS]);
    sh.getRange(1, 1, 1, REQUIRED_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1a1222')
      .setFontColor('#f0e8ff');
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, REQUIRED_HEADERS.length);
  }
}

function getHeaderMap_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[h] = i);
  return map;
}

function getPerformances() {
  ensureSheetFormat_();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const map = getHeaderMap_();
  return values.slice(1).filter(r => r.some(v => String(v).trim() !== '')).map(r => ({
    performer: r[map.Performer] || '',
    song: r[map.Song] || '',
    category: r[map.Category] || '',
    aesthetic: r[map.Aesthetic] || '',
    technicalScore: r[map.TechnicalScore] || 0,
    charismaScore: r[map.CharismaScore] || 0,
    nervosityScore: r[map.NervosityScore] || 0,
    uniquenessScore: r[map.UniquenessScore] || 0,
    talentScore: r[map.TalentScore] || 0,
    notes: r[map.Notes] || ''
  }));
}

function addPerformance(data) {
  ensureSheetFormat_();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const map = getHeaderMap_();
  const row = new Array(Object.keys(map).length).fill('');
  row[map.Performer] = data.performer || '';
  row[map.Song] = data.song || '';
  row[map.Category] = data.category || '';
  row[map.Aesthetic] = data.aesthetic || '';
  row[map.TechnicalScore] = data.technicalScore || 0;
  row[map.CharismaScore] = data.charismaScore || 0;
  row[map.NervosityScore] = data.nervosityScore || 0;
  row[map.UniquenessScore] = data.uniquenessScore || 0;
  row[map.TalentScore] = data.talentScore || 0;
  row[map.Notes] = data.notes || '';
  sh.appendRow(row);
  return { success: true };
}

function getCategories() {
  return [
    'Lip Sync', 'Live Vocal', 'Comedy', 'Hosting', 'Runway', 'Camp',
    'Eleganza', 'Avant Garde', 'Club Kid', 'Burlesque', 'Pageant',
    'Goth', 'Horror', 'Political', 'Narrative', 'Nautico'
  ];
}
CODE

if [[ ! -f src/Index.html ]]; then
  cat > src/Index.html <<'HTML'
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Drag Performance Analyzer</title></head>
<body><h1>Drag Performance Analyzer</h1><p>Replace with your preferred UI if needed.</p></body>
</html>
HTML
fi

mkdir -p .github/workflows
cat > .github/workflows/deploy.yml <<'YAML'
name: Deploy to Google Apps Script

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install clasp
        run: npm install -g @google/clasp

      - name: Write clasp credentials
        run: echo "$CLASPRC_JSON" > ~/.clasprc.json
        env:
          CLASPRC_JSON: ${{ secrets.CLASPRC_JSON }}

      - name: Push to Apps Script
        run: clasp push --force
YAML

if [[ "$ENABLE_GH_SECRETS" == "1" ]]; then
  if command -v gh >/dev/null 2>&1; then
    if gh auth status >/dev/null 2>&1; then
      if [[ -f "$HOME/.clasprc.json" ]]; then
        gh secret set "$SECRET_NAME" --repo "$REPO_SLUG" < "$HOME/.clasprc.json"
        echo "GitHub secret $SECRET_NAME set on $REPO_SLUG"
      else
        echo "No ~/.clasprc.json found; run clasp login first." >&2
      fi
    else
      echo "gh is installed but not authenticated; run gh auth login to enable secret setup." >&2
    fi
  else
    echo "gh CLI not installed; skipping GitHub secret setup." >&2
  fi
fi

cat <<INFO

Done.

Next steps:
1. Open the Google Sheet: https://docs.google.com/spreadsheets/d/$SHEET_ID/edit
2. In that sheet: Extensions -> Apps Script
3. Replace the project files with src/Code.gs, src/Index.html, src/appsscript.json from this repo, or run clasp push if .clasp.json has the right scriptId.
4. If .clasp.json still says PUT_YOUR_SCRIPT_ID_HERE, paste the Apps Script project ID into it.
5. Commit and push:
   git add .
   git commit -m "Set up drag analyzer GAS + workflow"
   git remote add origin git@github.com:${REPO_SLUG}.git   # if needed
   git push -u origin main
6. In Apps Script, deploy as Web app once from the editor or with clasp deploy.

Optional env vars:
- SCRIPT_ID=...                # set before running to write real scriptId
- REPO_SLUG=owner/repo         # default jonathaniscarroll/drag-performance-analyzer
- SECRET_NAME=CLASPRC_JSON     # GitHub Actions secret name
- ENABLE_GH_SECRETS=0          # skip gh secret upload

INFO
