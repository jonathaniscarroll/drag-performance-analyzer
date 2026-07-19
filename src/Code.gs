/**
 * Drag Performance Analyzer
 * Based on the epiaesthetics analyzer pattern.
 * Reads data from the bound Google Sheet and serves the web app.
 */

// --- Config ---
const SHEET_NAME = 'Performances';
const COLUMNS = {
  performer: 0,
  song: 1,
  category: 2,
  aesthetic: 3,
  technicalScore: 4,
  charismaScore: 5,
  nervosityScore: 6,
  uniquenessScore: 7,
  talentScore: 8,
  notes: 9
};

// --- Web App Entry ---
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Drag Performance Analyzer')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- Data Functions (called from client via google.script.run) ---

function getPerformances() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows.shift(); // remove header row
  return rows.map(row => ({
    performer: row[COLUMNS.performer],
    song: row[COLUMNS.song],
    category: row[COLUMNS.category],
    aesthetic: row[COLUMNS.aesthetic],
    technicalScore: row[COLUMNS.technicalScore],
    charismaScore: row[COLUMNS.charismaScore],
    nervosityScore: row[COLUMNS.nervosityScore],
    uniquenessScore: row[COLUMNS.uniquenessScore],
    talentScore: row[COLUMNS.talentScore],
    notes: row[COLUMNS.notes]
  }));
}

function addPerformance(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, error: 'Sheet not found' };
  sheet.appendRow([
    data.performer,
    data.song,
    data.category,
    data.aesthetic,
    data.technicalScore,
    data.charismaScore,
    data.nervosityScore,
    data.uniquenessScore,
    data.talentScore,
    data.notes
  ]);
  return { success: true };
}

function getCategories() {
  // RuPaul-style SNTM scoring categories
  return [
    'Charisma', 'Uniqueness', 'Nerve', 'Talent',
    'Lip Sync', 'Runway: Camp', 'Runway: Eleganza',
    'Runway: Avant Garde', 'Acting', 'Comedy'
  ];
}
