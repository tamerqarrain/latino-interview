/**
 * LATINO — Sheet-driven email notifier
 * ─────────────────────────────────────
 * Watches the interview-report Google Sheet for new rows and emails each one
 * to HR via GmailApp (Gmail-to-Gmail, sent as YOUR authorized Google account —
 * not subject to Railway's SMTP block or any shared sender's reputation).
 *
 * SETUP (one-time):
 *   1. Open the Google Sheet that receives the interview reports.
 *   2. Extensions → Apps Script.
 *   3. Delete any placeholder code, paste this whole file in, and Save.
 *   4. Update SHEET_NAME below if your tab isn't called "Sheet1".
 *   5. Run `initializeLastRow` once (▶ button, pick that function from the
 *      dropdown) — this tells the script "everything up to today is already
 *      handled," so it won't re-email your entire existing history. You'll
 *      get an OAuth consent prompt the first time — click through
 *      "Advanced" → "Go to (project name) (unsafe)" (safe here since it's
 *      your own script) and allow Gmail + Sheets access.
 *   6. Run `checkForNewRows` once manually to confirm it works without errors.
 *   7. Set up the recurring trigger: left sidebar clock icon (Triggers) →
 *      + Add Trigger → function: checkForNewRows → Event source: Time-driven
 *      → Type: Minutes timer → Every 5 minutes → Save.
 *
 * From then on, any new row appended to the sheet (including by the Latino
 * server via the Sheets API) gets emailed automatically within ~5 minutes.
 */

// ── CONFIG — edit these ──────────────────────────────────────────
const SHEET_NAME   = 'Sheet1'; // must match GOOGLE_SHEET_TAB in Railway
const RECIPIENTS   = ['tamer@mediaplus.com.jo', 'execdjo@lpj.org', 'lpsj.hr@lpj.org'];
const PROP_KEY     = 'lastEmailedRow';

// ── One-time setup helper: marks all EXISTING rows as already handled ──
function initializeLastRow() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  PropertiesService.getScriptProperties().setProperty(PROP_KEY, String(lastRow));
  Logger.log(`Initialized — will only email rows added after row ${lastRow}.`);
}

// ── Main function — run on a time trigger every few minutes ──
function checkForNewRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) { Logger.log(`Sheet "${SHEET_NAME}" not found.`); return; }

  const lastRow = sheet.getLastRow();
  const props   = PropertiesService.getScriptProperties();
  let lastEmailed = parseInt(props.getProperty(PROP_KEY), 10);
  if (isNaN(lastEmailed)) lastEmailed = 1; // header row only, first run safety net

  if (lastRow <= lastEmailed) return; // nothing new

  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const numNewRows = lastRow - lastEmailed;
  const dataRange  = sheet.getRange(lastEmailed + 1, 1, numNewRows, sheet.getLastColumn());
  const rows       = dataRange.getValues();

  rows.forEach((rowValues) => {
    try {
      sendRowEmail(headerRow, rowValues);
    } catch (e) {
      Logger.log('Failed to email a row: ' + e.message);
      // Don't advance lastEmailedRow past a row that failed — leave it to retry
      // next run. (If it keeps failing, check Logger / Executions for the reason.)
      throw e;
    }
  });

  // Only advance the marker once ALL new rows in this batch succeeded.
  props.setProperty(PROP_KEY, String(lastRow));
  Logger.log(`Emailed ${rows.length} new row(s), now at row ${lastRow}.`);
}

// ── Builds and sends one nicely formatted HTML email for a single row ──
// Mirrors the same visual structure as the server's own report email
// (candidate info → decision → assessment → summary → strengths/growth →
// interview Q&A → assessment answer breakdown) instead of a flat data dump.
function sendRowEmail(headerRow, rowValues) {
  const get = (label) => {
    const idx = headerRow.indexOf(label);
    const v = idx === -1 ? '' : rowValues[idx];
    return (v === null || v === undefined) ? '' : v;
  };

  const name           = get('اسم المرشح') || '(بدون اسم)';
  const role           = get('الوظيفة');
  const dateTime       = get('التاريخ والوقت');
  const email          = get('البريد الإلكتروني');
  const phone          = get('رقم الهاتف');
  const exp            = get('سنوات الخبرة');
  const location       = get('مكان السكن');
  const salary         = get('الراتب المتوقع (دينار)');
  const subject        = get('مادة التقييم');
  const assessScore    = get('نتيجة التقييم');
  const assessPct      = get('النسبة المئوية للتقييم');
  const overallScore   = get('النتيجة');
  const grade          = get('التقدير');
  const decision       = String(get('القرار') || '');
  const decisionReason = get('سبب القرار');
  const summary        = get('الملخص التنفيذي');
  const strengths      = String(get('نقاط القوة') || '').split(' • ').filter(Boolean);
  const growth         = String(get('مجالات التطوير') || '').split(' • ').filter(Boolean);
  const assessDetail   = String(get('تفاصيل إجابات التقييم') || '');

  const decisionColor = decision.indexOf('مؤهَّل للامتحان') !== -1 ? '#27ae60'
                       : decision.indexOf('بحاجة') !== -1          ? '#e8a020'
                       : '#e74c3c';
  const pctNum   = parseInt(String(assessPct), 10);
  const pctColor = !isNaN(pctNum) ? (pctNum >= 70 ? '#27ae60' : pctNum >= 50 ? '#e8a020' : '#e74c3c') : '#999';

  // ── Candidate info (simple two-column facts) ──
  const infoRows = [
    ['التاريخ', dateTime], ['الوظيفة', role], ['سنوات الخبرة', exp],
    ['مكان السكن', location], ['الراتب المتوقع', salary ? `${salary} دينار` : ''],
    ['البريد الإلكتروني', email], ['الهاتف', phone],
  ].filter(([, v]) => v !== '' && v !== undefined);
  const infoHTML = infoRows.map(([label, val]) => `
    <tr>
      <td style="padding:5px 10px;color:#999;font-size:12px;white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:5px 10px;color:#333;font-size:13px;">${escapeHtml(String(val))}</td>
    </tr>`).join('');

  // ── Assessment stat badge (only if a subject was assessed) ──
  const assessBadge = subject ? `
    <div style="background:#f9f9f9;border:1px solid #eee;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-weight:bold;color:#1a2840;font-size:14px;">📝 تقييم مادة ${escapeHtml(String(subject))}</div>
      <div style="background:${pctColor};color:#fff;padding:5px 12px;border-radius:16px;font-weight:bold;font-size:13px;">${escapeHtml(String(assessScore))} · ${escapeHtml(String(assessPct))}</div>
    </div>` : '';

  // ── Strengths / growth as two stacked bullet lists ──
  const bulletList = (items, color) => items.length
    ? `<ul style="margin:0;padding-right:18px;color:#444;font-size:13px;line-height:1.8;">${items.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
    : `<div style="color:#bbb;font-size:12px;">—</div>`;

  // ── Interview Q&A cards (up to 8 — skip any that are empty) ──
  let qaHTML = '';
  for (let i = 1; i <= 8; i++) {
    const q  = get(`س${i} سؤال`);
    const a   = get(`س${i} إجابة`);
    const sc  = get(`س${i} درجة`);
    const ev  = get(`س${i} تقييم`);
    if (!q && !a) continue;
    qaHTML += `
      <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #eee;">
        <div style="font-weight:bold;color:#1a2840;font-size:13px;margin-bottom:6px;">س${i}: ${escapeHtml(String(q))}</div>
        <div style="background:#f7f7f7;padding:8px 10px;border-radius:6px;color:#444;font-size:13px;margin-bottom:6px;">${escapeHtml(String(a || '(لا توجد إجابة)'))}</div>
        ${sc || ev ? `<div style="color:#c9a84c;font-size:12px;">${sc ? `التقييم: ${escapeHtml(String(sc))}/5` : ''} ${ev ? `— <span style="color:#666;">${escapeHtml(String(ev))}</span>` : ''}</div>` : ''}
      </div>`;
  }

  // ── Assessment answer breakdown — parse "س1: A ✓ (1/1) | س2: ..." into
  // individual color-coded rows instead of one crammed line of text ──
  let assessDetailHTML = '';
  if (assessDetail) {
    const items = assessDetail.split(' | ').filter(Boolean);
    assessDetailHTML = items.map(item => {
      const color = item.indexOf('✓') !== -1 ? '#27ae60' : item.indexOf('◐') !== -1 ? '#e8a020' : '#e74c3c';
      return `<div style="padding:6px 10px;border-bottom:1px solid #f2f2f2;font-size:13px;color:${color};">${escapeHtml(item)}</div>`;
    }).join('');
  }

  const section = (title, innerHTML) => innerHTML ? `
    <div style="font-weight:bold;color:#c9a84c;font-size:13px;border-bottom:1px solid #eee;padding-bottom:8px;margin:20px 0 12px;">${title}</div>
    ${innerHTML}` : '';

  const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><body style="font-family:Tahoma,Arial,sans-serif;background:#f0f0f0;margin:0;padding:20px;">
    <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
      <div style="background:#0d1520;color:#c9a84c;padding:24px 28px;">
        <div style="font-size:22px;font-weight:bold;">تقرير مقابلة (نسخة احتياطية من الجدول)</div>
        <div style="color:#9aa;font-size:13px;margin-top:4px;">نظام لاتينو · ${escapeHtml(String(dateTime || ''))}</div>
      </div>
      <div style="padding:28px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <td style="vertical-align:top;">
              <div style="font-size:22px;font-weight:bold;color:#1a2840;">${escapeHtml(name)}</div>
            </td>
            <td style="text-align:left;vertical-align:top;">
              ${overallScore ? `
              <div style="display:inline-block;border:3px solid ${decisionColor};border-radius:50%;width:60px;height:60px;text-align:center;line-height:60px;font-size:20px;font-weight:bold;color:${decisionColor};">${escapeHtml(String(grade || ''))}</div>
              <div style="color:#666;font-size:12px;margin-top:4px;">${escapeHtml(String(overallScore))}/100</div>` : ''}
            </td>
          </tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">${infoHTML}</table>

        <div style="background:${decisionColor}12;border:1px solid ${decisionColor};border-radius:8px;padding:14px 16px;text-align:center;margin-bottom:18px;">
          <div style="font-size:16px;font-weight:bold;color:${decisionColor};">${escapeHtml(decision || '—')}</div>
          ${decisionReason ? `<div style="color:#555;font-size:13px;margin-top:6px;line-height:1.6;">${escapeHtml(String(decisionReason))}</div>` : ''}
        </div>

        ${assessBadge}

        ${section('الملخص التنفيذي', summary ? `<div style="color:#333;line-height:1.8;font-size:14px;">${escapeHtml(String(summary))}</div>` : '')}

        ${(strengths.length || growth.length) ? `
        <table style="width:100%;margin-bottom:4px;"><tr>
          <td style="width:50%;vertical-align:top;padding-left:8px;">
            <div style="font-weight:bold;color:#27ae60;font-size:12px;margin-bottom:6px;">نقاط القوة</div>
            ${bulletList(strengths)}
          </td>
          <td style="width:50%;vertical-align:top;padding-right:8px;">
            <div style="font-weight:bold;color:#e8a020;font-size:12px;margin-bottom:6px;">مجالات التطوير</div>
            ${bulletList(growth)}
          </td>
        </tr></table>` : ''}

        ${section('أسئلة المقابلة وإجاباتها', qaHTML)}
        ${section(`تفاصيل إجابات تقييم مادة ${escapeHtml(String(subject || ''))}`, assessDetailHTML)}
      </div>
    </div>
  </body></html>`;

  const plain = `تقرير مقابلة: ${name} — ${role}\nالقرار: ${decision}`;

  GmailApp.sendEmail(RECIPIENTS.join(','), `تقرير مقابلة (نسخة من الجدول): ${name} — ${role}`, plain, {
    htmlBody: html,
    name: 'لاتينو',
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
