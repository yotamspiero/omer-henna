/**
 * אישורי הגעה · ערב המקווה חינה של עומר
 * מדביקים את כל הקובץ הזה ב-Extensions → Apps Script של גיליון Google חדש.
 * מחליפים את HOST_KEY למשהו משלכם (אותו מפתח נכנס לקישור של בעלת האירוע).
 */
const HOST_KEY = "CHANGE-ME-omer-2611";
const SHEET_NAME = "אישורים";
const HEADERS = ["עודכן", "שם", "תשובה", "מספר אנשים", "מזהה"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.setRightToLeft(true);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** האורחים שולחים לכאן */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || "{}");
    const name = String(d.name || "").replace(/\s+/g, " ").trim().slice(0, 60);
    const status = d.status === "no" ? "no" : "yes";
    const count = status === "yes" ? 1 : 0;
    const rid = String(d.rid || "").replace(/[^a-z0-9]/gi, "").slice(0, 24);
    if (name.length < 2 || !rid) return json_({ ok: false });

    const sh = sheet_();
    const row = [new Date(), name, status === "yes" ? "מגיעה" : "לא מגיעה", count, rid];
    const last = sh.getLastRow();
    if (last > 1) {
      const ids = sh.getRange(2, 5, last - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (ids[i][0] === rid) {                       // אותו אורח עדכן תשובה
          sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
          return json_({ ok: true, updated: true });
        }
      }
    }
    sh.appendRow(row);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

/** הדף של בעלת האירוע קורא מכאן (רק עם המפתח) */
function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== HOST_KEY) return json_({ ok: false, error: "key" });
  const sh = sheet_();
  const last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, 4).getValues() : [];
  return json_({
    ok: true,
    rows: rows.map(r => ({
      at: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
      name: r[1],
      status: r[2] === "מגיעה" ? "yes" : "no",
      count: Number(r[3]) || 0
    }))
  });
}
