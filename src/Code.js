const SPREADSHEET_ID = '12L-GE7BJyd6wt4-NphafFBwuM4hkhgXMrTgpiCHHHkw';
const RESPONSES_SHEET = 'Responses';
const DIMENSIONS_SHEET = 'Dimensions';
const PERFORMERS_SHEET = 'Performers';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Drag Cass-essment')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── Sheet initialisation ────────────────────────────────────────────────────

function initializeSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let dimSheet = ss.getSheetByName(DIMENSIONS_SHEET);
    if (!dimSheet) dimSheet = ss.insertSheet(DIMENSIONS_SHEET);
    if (dimSheet.getLastRow() === 0) {
      dimSheet.getRange(1, 1, 1, 3).setValues([['Pole A', 'Pole B', 'Description']]);
      const defaults = [
        ['Control', 'Letting go', 'How much does the performer hold vs. release?'],
        ['Glamour', 'Failure', 'Polished perfection vs. embraced imperfection'],
        ['Reading the room', 'Self-absorption', 'Audience awareness vs. internal focus'],
        ['Transformation', 'Authenticity', 'How much persona vs. self is present?'],
        ['Story arc', 'Pure sensation', 'Narrative structure vs. moment-to-moment feeling'],
        ['Technical mastery', 'Raw instinct', 'Craft vs. impulse'],
        ['Audience interaction', 'Fourth wall', 'Engagement vs. separation'],
        ['Novelty', 'Tradition', 'Innovation vs. honouring the form'],
        ['Dynamics/time', 'Flatness', 'Variation in pace, energy, rhythm vs. monotony'],
        ['Cultural reference', 'Abstraction', 'Rooted in lineage vs. free-floating'],
        ['Sex appeal', 'Wit', 'Body-led vs. mind-led pleasure'],
        ['Humour', 'Sincerity', 'Comic register vs. earnest register'],
      ];
      dimSheet.getRange(2, 1, defaults.length, 3).setValues(defaults);
    }

    ensurePerformersSheet_();
    ensureResponseHeaders_();

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function ensurePerformersSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(PERFORMERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PERFORMERS_SHEET);
    sheet.getRange(1, 1, 1, 4).setValues([['Performer ID', 'Performer Name', 'Notes', 'Created At']]);
  }
  return sheet;
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

function getDimensionPairs() {
  try {
    initializeSheets();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(DIMENSIONS_SHEET);
    const values = sheet.getDataRange().getValues();
    const pairs = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[0] && row[1]) {
        pairs.push({
          index: pairs.length,
          poleA: String(row[0]).trim(),
          poleB: String(row[1]).trim(),
          description: row[2] ? String(row[2]).trim() : ''
        });
      }
    }
    return { success: true, pairs: pairs, count: pairs.length };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function addDimensionPair(poleA, poleB, description) {
  try {
    initializeSheets();
    const a = String(poleA || '').trim();
    const b = String(poleB || '').trim();
    const d = String(description || '').trim();
    if (!a || !b) return { success: false, error: 'Both poles are required' };
    if (a === b) return { success: false, error: 'Poles must be different' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(DIMENSIONS_SHEET);
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const x = String(values[i][0] || '').trim();
      const y = String(values[i][1] || '').trim();
      if ((x === a && y === b) || (x === b && y === a)) {
        return { success: false, error: 'This dimension pair already exists' };
      }
    }
    sheet.appendRow([a, b, d]);
    return { success: true, message: 'Continuum added' };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function getDimensionCount_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(DIMENSIONS_SHEET);
  const values = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 0), 2).getValues();
  return values.filter(r => r[0] && r[1]).length;
}

// ─── Performers ───────────────────────────────────────────────────────────────

function getPerformerOptions() {
  try {
    initializeSheets();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PERFORMERS_SHEET);
    const values = sheet.getDataRange().getValues();
    const performers = [];
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row[0] && row[1]) {
        performers.push({
          performerId: String(row[0]).trim(),
          performerName: String(row[1]).trim(),
          notes: row[2] ? String(row[2]).trim() : ''
        });
      }
    }
    performers.sort(function(a, b) { return a.performerName.localeCompare(b.performerName); });
    return { success: true, performers: performers };
  } catch (error) {
    return { success: false, error: String(error), performers: [] };
  }
}

function addPerformer(name, notes) {
  try {
    initializeSheets();
    const n = String(name || '').trim();
    const nt = String(notes || '').trim();
    if (!n) return { success: false, error: 'Performer name is required' };
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(PERFORMERS_SHEET);
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][1] || '').trim().toLowerCase() === n.toLowerCase()) {
        return { success: false, error: 'A performer with this name already exists', performerId: String(values[i][0]) };
      }
    }
    const performerId = 'perf_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
    sheet.appendRow([performerId, n, nt, new Date()]);
    return { success: true, performerId: performerId, performerName: n };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Responses schema ─────────────────────────────────────────────────────────
// Schema v2: cols 1-7 = Archive ID | Timestamp | Performance Name | Notes | Evaluator | Performer ID | Performer Name
//            cols 8+ = dimension scores
// Schema v1 (legacy): cols 1-5 = Archive ID | Timestamp | Performance Name | Notes | Evaluator
//                     cols 6+ = dimension scores

const RESP_COL_ARCHIVE_ID    = 1;  // A
const RESP_COL_TIMESTAMP     = 2;  // B
const RESP_COL_PERF_NAME     = 3;  // C  (performance name / title)
const RESP_COL_NOTES         = 4;  // D
const RESP_COL_EVALUATOR     = 5;  // E
const RESP_COL_PERFORMER_ID  = 6;  // F  (NEW)
const RESP_COL_PERFORMER_NAME= 7;  // G  (NEW)
const RESP_DIM_START         = 8;  // H  (dimension scores start here in v2)

function ensureResponseHeaders_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RESPONSES_SHEET);
  if (!sheet) return;
  const dimCount = getDimensionCount_();

  if (sheet.getLastRow() === 0) {
    _writeResponseHeaders(sheet, dimCount);
    return;
  }

  // Detect schema version from header row
  const headerRow = sheet.getRange(1, 1, 1, Math.min(sheet.getLastColumn(), 10)).getValues()[0];
  const isV2 = String(headerRow[5] || '').toLowerCase().includes('performer id') ||
               String(headerRow[6] || '').toLowerCase().includes('performer name');

  if (!isV2) {
    migrateResponsesSchema_(sheet);
  } else {
    // Just ensure enough dimension columns
    const neededCols = RESP_DIM_START - 1 + dimCount;
    if (sheet.getMaxColumns() < neededCols) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), neededCols - sheet.getMaxColumns());
    }
    for (let i = 0; i < dimCount; i++) {
      sheet.getRange(1, RESP_DIM_START + i).setValue('Dimension ' + (i + 1));
    }
  }
}

function _writeResponseHeaders(sheet, dimCount) {
  const headers = ['Archive ID', 'Timestamp', 'Performance Name', 'Notes', 'Evaluator', 'Performer ID', 'Performer Name'];
  for (let i = 0; i < dimCount; i++) headers.push('Dimension ' + (i + 1));
  const neededCols = headers.length;
  if (sheet.getMaxColumns() < neededCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), neededCols - sheet.getMaxColumns());
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function migrateResponsesSchema_(sheet) {
  // Insert 2 columns after column 5 (Evaluator) for Performer ID + Performer Name
  // Old: A B C D E F G…  (dims at col 6+)
  // New: A B C D E F G H I…  (dims at col 8+)
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastCol >= 6) {
    sheet.insertColumnsAfter(5, 2);
  }

  // Write new headers
  sheet.getRange(1, 1, 1, 7).setValues([[
    'Archive ID', 'Timestamp', 'Performance Name', 'Notes', 'Evaluator', 'Performer ID', 'Performer Name'
  ]]);

  // Fill performer cols with blanks for existing rows (they're already blank after insert)
  // Set dimension headers
  const dimCount = getDimensionCount_();
  const newLastCol = sheet.getLastColumn();
  const neededCols = RESP_DIM_START - 1 + dimCount;
  if (newLastCol < neededCols) {
    sheet.insertColumnsAfter(newLastCol, neededCols - newLastCol);
  }
  for (let i = 0; i < dimCount; i++) {
    sheet.getRange(1, RESP_DIM_START + i).setValue('Dimension ' + (i + 1));
  }
}

function generateArchiveId_() {
  return 'resp_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
}

function normalizeScores_(responses, dimensionCount) {
  const scores = new Array(dimensionCount).fill(0);
  if (!Array.isArray(responses)) return scores;
  if (responses.length && typeof responses[0] === 'object') {
    responses.forEach(function(r) {
      const idx = parseInt(r.dimensionIndex, 10);
      const val = parseInt(r.value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < dimensionCount) {
        scores[idx] = isNaN(val) ? 0 : val;
      }
    });
  } else {
    for (let i = 0; i < Math.min(dimensionCount, responses.length); i++) {
      const val = parseInt(responses[i], 10);
      scores[i] = isNaN(val) ? 0 : val;
    }
  }
  return scores;
}

// ─── Submit / update assessments ─────────────────────────────────────────────

function submitAssessment(data) {
  try {
    initializeSheets();
    ensureResponseHeaders_();
    if (!data || !data.archiveName) {
      return { success: false, error: 'Missing performance name' };
    }
    const dimCount = getDimensionCount_();
    const scores = normalizeScores_(data.responses || [], dimCount);
    const row = [
      generateArchiveId_(),
      new Date(),
      String(data.archiveName || '').trim(),
      String(data.archiveNotes || '').trim(),
      String(data.evaluator || '').trim(),
      String(data.performerId || '').trim(),
      String(data.performerName || '').trim()
    ].concat(scores);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RESPONSES_SHEET);
    sheet.appendRow(row);
    return { success: true, archiveId: row[0] };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function getAllResponses() {
  try {
    initializeSheets();
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RESPONSES_SHEET);
    const values = sheet.getDataRange().getValues();
    const responses = [];
    const headerRow = values[0] || [];
    // Detect schema: v2 has Performer ID at col 6 (index 5)
    const isV2 = String(headerRow[5] || '').toLowerCase().includes('performer');
    const dimStart = isV2 ? RESP_DIM_START - 1 : 5; // 0-indexed

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0] || !row[2]) continue;
      responses.push({
        archiveId: String(row[0]),
        archive: String(row[2]),
        notes: row[3] ? String(row[3]) : '',
        evaluator: row[4] ? String(row[4]) : '',
        performerId: isV2 ? String(row[5] || '') : '',
        performerName: isV2 ? String(row[6] || '') : '',
        timestamp: row[1] && row[1].toISOString ? row[1].toISOString() : String(row[1] || ''),
        data: row.slice(dimStart).map(function(v) {
          const n = parseInt(v, 10);
          return isNaN(n) ? 0 : n;
        })
      });
    }
    return { success: true, responses: responses, count: responses.length };
  } catch (error) {
    return { success: false, error: String(error), responses: [] };
  }
}

function getArchiveOptions() {
  const all = getAllResponses();
  if (!all.success) return { success: false, error: all.error, archives: [] };
  const archives = all.responses
    .map(function(r) { return { archiveId: r.archiveId, archive: r.archive }; })
    .sort(function(a, b) { return a.archive.localeCompare(b.archive); });
  return { success: true, archives: archives };
}

function getArchiveById(archiveId) {
  const all = getAllResponses();
  if (!all.success) return { success: false, error: all.error };
  const found = all.responses.find(function(r) {
    return r.archiveId === String(archiveId || '').trim();
  });
  if (!found) return { success: false, error: 'Performance not found' };
  return {
    success: true,
    archive: {
      archiveId: found.archiveId,
      archiveName: found.archive,
      archiveNotes: found.notes,
      evaluator: found.evaluator,
      performerId: found.performerId,
      performerName: found.performerName,
      responses: found.data
    }
  };
}

function updateArchiveAssessment(data) {
  try {
    initializeSheets();
    ensureResponseHeaders_();
    const archiveId = String((data && data.archiveId) || '').trim();
    const archiveName = String((data && data.archiveName) || '').trim();
    if (!archiveId || !archiveName) {
      return { success: false, error: 'Missing performance ID or name' };
    }
    const dimCount = getDimensionCount_();
    const scores = normalizeScores_(data.responses || [], dimCount);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RESPONSES_SHEET);
    const values = sheet.getDataRange().getValues();
    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === archiveId) { rowIndex = i + 1; break; }
    }
    if (rowIndex === -1) return { success: false, error: 'Performance ID not found' };
    const row = [
      archiveId,
      new Date(),
      archiveName,
      String((data && data.archiveNotes) || '').trim(),
      String((data && data.evaluator) || '').trim(),
      String((data && data.performerId) || '').trim(),
      String((data && data.performerName) || '').trim()
    ].concat(scores);
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { success: true, archiveId: archiveId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Filtering & matrix data ──────────────────────────────────────────────────

function getDistinctAssessmentDays() {
  try {
    const all = getAllResponses();
    if (!all.success) return { success: false, error: all.error, days: [] };
    const tz = 'America/Halifax';
    const seen = {};
    all.responses.forEach(function(r) {
      if (!r.timestamp) return;
      try {
        const d = new Date(r.timestamp);
        const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
        if (!seen[key]) seen[key] = key;
      } catch(e) {}
    });
    const days = Object.keys(seen).sort().reverse();
    return { success: true, days: days };
  } catch (error) {
    return { success: false, error: String(error), days: [] };
  }
}

function getResponsesByFilters(filters) {
  try {
    const all = getAllResponses();
    if (!all.success) return { success: false, error: all.error, responses: [] };
    const tz = 'America/Halifax';
    let results = all.responses;
    if (filters && filters.performerId) {
      results = results.filter(function(r) {
        return r.performerId === filters.performerId ||
               (r.performerName && r.performerName === filters.performerId);
      });
    }
    if (filters && filters.day) {
      results = results.filter(function(r) {
        if (!r.timestamp) return false;
        try {
          const d = new Date(r.timestamp);
          const key = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
          return key === filters.day;
        } catch(e) { return false; }
      });
    }
    return { success: true, responses: results, count: results.length };
  } catch (error) {
    return { success: false, error: String(error), responses: [] };
  }
}

function buildMatrixData(filters) {
  try {
    const dimRes = getDimensionPairs();
    const filtRes = getResponsesByFilters(filters || {});
    if (!dimRes.success) return { success: false, error: dimRes.error };
    if (!filtRes.success) return { success: false, error: filtRes.error };
    // Build per-dimension arrays of scores
    const matrix = dimRes.pairs.map(function(d, i) {
      const scores = filtRes.responses
        .map(function(r) { return typeof r.data[i] === 'number' ? r.data[i] : parseInt(r.data[i], 10) || 0; });
      const avg = scores.length ? scores.reduce(function(a, b) { return a + b; }, 0) / scores.length : null;
      return {
        index: i,
        poleA: d.poleA,
        poleB: d.poleB,
        description: d.description,
        scores: scores,
        avg: avg
      };
    });
    return {
      success: true,
      matrix: matrix,
      responseCount: filtRes.responses.length,
      dimensions: dimRes.pairs
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
