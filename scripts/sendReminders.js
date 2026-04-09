'use strict';

/**
 * sendReminders.js
 *
 * Scans every user's documents in Firestore and sends email reminders
 * according to the following schedule:
 *
 *   • Exactly 60 days left  → send once
 *   • 30–9 days left        → send once a week (at 30, 23, 16, 9)
 *   • 0–7 days left         → send every day
 *
 * Required environment variables:
 *   FIREBASE_SERVICE_ACCOUNT  – full JSON string of a Firebase service-account key
 *   EMAIL_USER                – Gmail address used as the sender
 *   EMAIL_PASS                – Gmail App Password (not your regular password)
 */

const admin      = require('firebase-admin');
const nodemailer = require('nodemailer');

// ── Validate env ──────────────────────────────────────────────────────────────
const { FIREBASE_SERVICE_ACCOUNT, EMAIL_USER, EMAIL_PASS } = process.env;

if (!FIREBASE_SERVICE_ACCOUNT || !EMAIL_USER || !EMAIL_PASS) {
  console.error('❌  Missing required environment variables.');
  console.error('    Required: FIREBASE_SERVICE_ACCOUNT, EMAIL_USER, EMAIL_PASS');
  process.exit(1);
}

// ── Firebase Admin init ───────────────────────────────────────────────────────
let serviceAccount;
try {
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
} catch {
  console.error('❌  FIREBASE_SERVICE_ACCOUNT is not valid JSON.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns today's date string (YYYY-MM-DD) in the Asia/Jerusalem timezone,
 * so the script behaves correctly even when running on a UTC server.
 */
function getTodayIsrael() {
  // 'en-CA' locale formats as YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

/**
 * Returns how many whole days remain until docDateStr (YYYY-MM-DD).
 * Negative = already expired.
 */
function daysUntil(docDateStr) {
  const todayMs  = new Date(getTodayIsrael() + 'T00:00:00').getTime();
  const targetMs = new Date(docDateStr       + 'T00:00:00').getTime();
  return Math.round((targetMs - todayMs) / 86_400_000);
}

/**
 * Returns true if a reminder should be sent today for a document
 * with this many days remaining.
 *
 * Logic:
 *  - Exactly 60 days         → once (early warning)
 *  - 30, 23, 16, 9 days      → weekly ((30 - d) % 7 === 0, within 9–30)
 *  - 0–7 days (incl. today)  → every day
 */
function shouldRemind(daysLeft) {
  if (daysLeft === 60) return true;
  if (daysLeft >= 9 && daysLeft <= 30 && (30 - daysLeft) % 7 === 0) return true;
  if (daysLeft >= 0 && daysLeft <= 7)  return true;
  return false;
}

// ── Urgency helpers (mirror the client-side logic) ────────────────────────────
function urgencyClass(daysLeft) {
  if (daysLeft <= 30) return 'red';
  if (daysLeft <= 60) return 'orange';
  return 'green';
}

function urgencyLabel(daysLeft) {
  if (daysLeft < 0)   return `⚠️ פג לפני ${Math.abs(daysLeft)} ימים`;
  if (daysLeft === 0) return '🔴 פג היום!';
  if (daysLeft <= 7)  return `🔴 ${daysLeft} ימים נותרו`;
  if (daysLeft <= 30) return `🟠 ${daysLeft} ימים נותרו`;
  return `🟢 ${daysLeft} ימים נותרו`;
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ── Email builder ─────────────────────────────────────────────────────────────
function buildEmailHtml(docsToRemind, displayName) {
  const greeting = displayName ? `שלום ${displayName},` : 'שלום,';

  const docCards = docsToRemind.map(doc => {
    const cls   = urgencyClass(doc.daysLeft);
    const label = urgencyLabel(doc.daysLeft);
    const borderColor = cls === 'red' ? '#ff4d6d' : cls === 'orange' ? '#fb923c' : '#4ade80';
    const labelColor  = borderColor;

    return `
      <div style="
        background:#22263a;
        border-radius:10px;
        padding:16px 18px;
        margin-bottom:12px;
        border-right:4px solid ${borderColor};
      ">
        <div style="font-size:1rem;font-weight:700;margin-bottom:6px;">${escHtml(doc.name)}</div>
        <div style="font-size:0.82rem;color:#7b82a8;">
          סוג: ${escHtml(doc.type)} &nbsp;·&nbsp; תאריך פקיעה: ${formatDate(doc.date)}
        </div>
        <div style="font-weight:700;margin-top:8px;color:${labelColor};">${label}</div>
      </div>`;
  }).join('');

  const countLine = docsToRemind.length === 1
    ? 'מסמך אחד דורש תשומת לבך:'
    : `${docsToRemind.length} מסמכים דורשים תשומת לבך:`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,Helvetica,sans-serif;color:#e8eaf6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#1a1d27;border-radius:14px;overflow:hidden;border:1px solid #2e3352;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6c63ff,#a78bfa);padding:28px 28px 24px;text-align:center;">
            <div style="font-size:2.2rem;margin-bottom:8px;">📋</div>
            <h1 style="margin:0;color:#fff;font-size:1.4rem;letter-spacing:-0.5px;">תזכורת מסמכים</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">מעקב מסמכים — document-tracker-95417.web.app</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 6px;font-size:1rem;">${greeting}</p>
            <p style="margin:0 0 22px;color:#7b82a8;font-size:0.9rem;">${countLine}</p>

            ${docCards}

            <div style="text-align:center;margin-top:28px;">
              <a href="https://document-tracker-95417.web.app"
                 style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#a78bfa);
                        color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;
                        font-weight:700;font-size:0.95rem;">
                פתח את האפליקציה
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #2e3352;text-align:center;
                     color:#7b82a8;font-size:0.78rem;">
            קיבלת מייל זה כי הגדרת תזכורות ב-
            <a href="https://document-tracker-95417.web.app" style="color:#6c63ff;text-decoration:none;">
              מעקב מסמכים
            </a>.
            תאריך הרצה: ${getTodayIsrael()}
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailSubject(docsToRemind) {
  const urgent = docsToRemind.filter(d => d.daysLeft <= 7).length;
  if (urgent > 0) {
    return `🔴 תזכורת דחופה: ${urgent} מסמכ${urgent === 1 ? '' : 'ים'} עומד${urgent === 1 ? '' : 'ים'} לפוג בקרוב`;
  }
  return `📋 תזכורת מסמכים: ${docsToRemind.length} מסמכ${docsToRemind.length === 1 ? '' : 'ים'} לחידוש`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const today = getTodayIsrael();
  console.log(`\n🗓️  Running reminders for ${today} (Asia/Jerusalem)\n`);

  // 1. Fetch every document across all users via collectionGroup
  let allDocs;
  try {
    const snapshot = await db.collectionGroup('documents').get();
    allDocs = snapshot.docs;
    console.log(`📄  Found ${allDocs.length} total document(s) across all users.`);
  } catch (err) {
    console.error('❌  Failed to query Firestore:', err.message);
    process.exit(1);
  }

  // 2. Group documents that need reminders today by userId
  //    Firestore path: users/{userId}/documents/{docId}
  const byUser = {};
  for (const docSnap of allDocs) {
    const data = docSnap.data();

    // Guard: skip docs with missing/invalid date
    if (!data.date || typeof data.date !== 'string') continue;

    const daysLeft = daysUntil(data.date);
    if (!shouldRemind(daysLeft)) continue;

    // Extract userId from path segments: ['users', userId, 'documents', docId]
    const userId = docSnap.ref.path.split('/')[1];
    if (!byUser[userId]) byUser[userId] = [];
    byUser[userId].push({ ...data, daysLeft });
  }

  const usersToNotify = Object.keys(byUser).length;
  if (usersToNotify === 0) {
    console.log('✅  No reminders to send today.');
    return;
  }
  console.log(`📬  Sending reminders to ${usersToNotify} user(s).\n`);

  // 3. Set up nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // 4. For each user: resolve email via Firebase Auth, then send
  let sent = 0, failed = 0;
  for (const [userId, docsToRemind] of Object.entries(byUser)) {
    try {
      const userRecord = await admin.auth().getUser(userId);
      const toEmail    = userRecord.email;

      if (!toEmail) {
        console.warn(`⚠️   User ${userId} has no email address — skipping.`);
        continue;
      }

      // Sort by urgency (most urgent first)
      docsToRemind.sort((a, b) => a.daysLeft - b.daysLeft);

      await transporter.sendMail({
        from:    `"מעקב מסמכים" <${EMAIL_USER}>`,
        to:      toEmail,
        subject: buildEmailSubject(docsToRemind),
        html:    buildEmailHtml(docsToRemind, userRecord.displayName),
      });

      console.log(`  ✅  ${toEmail}  →  ${docsToRemind.length} doc(s):`,
        docsToRemind.map(d => `"${d.name}" (${d.daysLeft}d)`).join(', '));
      sent++;

    } catch (err) {
      console.error(`  ❌  Failed for user ${userId}:`, err.message);
      failed++;
    }
  }

  console.log(`\n📊  Done. Sent: ${sent} | Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('💥  Unhandled error:', err);
  process.exit(1);
});
