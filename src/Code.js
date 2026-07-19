const SPREADSHEET_ID = '12L-GE7BJyd6wt4-NphafFBwuM4hkhgXMrTgpiCHHHkw';
const RESPONSES_SHEET = 'Responses';
const DIMENSIONS_SHEET = 'Dimensions';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Archive Epiaesthetic Matrix')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function initializeSheets() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    let dimSheet = ss.getSheetByName(DIMENSIONS_SHEET);
    if (!dimSheet) dimSheet = ss.insertSheet(DIMENSIONS_SHEET);
    if (dimSheet.getLastRow() === 0) {
      dimSheet.getRange(1, 1, 1, 3).setValues([['Pole A', 'Pole B', 'Description']]);
    }

    let respSheet = ss.getSheetByName(RESPONSES_SHEET);
    if (!respSheet) respSheet = ss.insertSheet(RESPONSES_SHEET);
    if (respSheet.getLastRow() === 0) {
      respSheet.getRange(1, 1, 1, 5).setValues([['Archive ID', 'Timestamp', 'Archive Name', 'Archive Notes', 'Evaluator']]);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

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

function ensureResponseHeaders_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(RESPONSES_SHEET);
  const dimCount = getDimensionCount_();

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 5).setValues([['Archive ID', 'Timestamp', 'Archive Name', 'Archive Notes', 'Evaluator']]);
  }

  const neededCols = 5 + dimCount;
  if (sheet.getMaxColumns() < neededCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), neededCols - sheet.getMaxColumns());
  }

  for (let i = 0; i < dimCount; i++) {
    sheet.getRange(1, 6 + i).setValue('Dimension ' + (i + 1));
  }
}

function generateArchiveId_() {
  return 'arc_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
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

function submitAssessment(data) {
  try {
    initializeSheets();
    ensureResponseHeaders_();

    if (!data || !data.archiveName) {
      return { success: false, error: 'Missing archive name' };
    }

    const dimCount = getDimensionCount_();
    const scores = normalizeScores_(data.responses || [], dimCount);
    const row = [
      generateArchiveId_(),
      new Date(),
      String(data.archiveName || '').trim(),
      String(data.archiveNotes || '').trim(),
      String(data.evaluator || '').trim()
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

    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row[0] || !row[2]) continue;

      responses.push({
        archiveId: String(row[0]),
        archive: String(row[2]),
        notes: row[3] ? String(row[3]) : '',
        evaluator: row[4] ? String(row[4]) : '',
        timestamp: row[1] && row[1].toISOString ? row[1].toISOString() : String(row[1] || ''),
        data: row.slice(5).map(function(v) {
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
    .map(function(r) {
      return { archiveId: r.archiveId, archive: r.archive };
    })
    .sort(function(a, b) {
      return a.archive.localeCompare(b.archive);
    });

  return { success: true, archives: archives };
}

function getArchiveById(archiveId) {
  const all = getAllResponses();
  if (!all.success) return { success: false, error: all.error };

  const found = all.responses.find(function(r) {
    return r.archiveId === String(archiveId || '').trim();
  });

  if (!found) return { success: false, error: 'Archive not found' };

  return {
    success: true,
    archive: {
      archiveId: found.archiveId,
      archiveName: found.archive,
      archiveNotes: found.notes,
      evaluator: found.evaluator,
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
      return { success: false, error: 'Missing archive ID or name' };
    }

    const dimCount = getDimensionCount_();
    const scores = normalizeScores_(data.responses || [], dimCount);

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(RESPONSES_SHEET);
    const values = sheet.getDataRange().getValues();

    let rowIndex = -1;
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === archiveId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) return { success: false, error: 'Archive ID not found' };

    const row = [
      archiveId,
      new Date(),
      archiveName,
      String((data && data.archiveNotes) || '').trim(),
      String((data && data.evaluator) || '').trim()
    ].concat(scores);

    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { success: true, archiveId: archiveId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}