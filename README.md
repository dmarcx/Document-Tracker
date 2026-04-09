# 📋 מעקב מסמכים — Document Tracker

> אפליקציית ווב רב-משתמשים למעקב אחר תוקף מסמכים אישיים, עם סנכרון ענן בזמן אמת והתראות צבע לפי דחיפות.

🌐 **Live:** https://document-tracker-95417.web.app

---

## ✨ תכונות

| תכונה | תיאור |
|-------|-------|
| 🔐 התחברות עם Google | אימות מאובטח דרך Firebase Auth |
| ☁️ סנכרון ענן | נתונים מסונכרנים בזמן אמת בין כל המכשירים |
| ➕ הוספת מסמך | שם, סוג, תאריך פקיעה והערות |
| ✏️ עריכה | עריכת כל שדה של מסמך קיים |
| 🎨 קידוד צבעים | 🔴 אדום עד 30 יום · 🟠 כתום עד 60 יום · 🟢 ירוק מעבר לכך |
| ⚙️ סוגים מותאמים | הוסף/מחק סוגי מסמכים משלך + emoji — מסונכרנים לענן |
| ✚ הוסף סוג inline | בחר "הוסף סוג..." ישירות מה-dropdown |
| 📊 סטטיסטיקות | ספירת מסמכים לפי סטטוס בזמן אמת |

---

## 🏗️ ארכיטקטורה

```
Client (Vanilla HTML/CSS/JS)
        │
        ▼
Firebase Auth  ──▶  Google Sign-In (OAuth)
        │
Firebase Firestore
  users/{uid}/documents/{docId}   ← מסמכים (real-time onSnapshot)
  users/{uid}/config               ← סוגים מותאמים אישית
        │
Firebase Hosting
  https://document-tracker-95417.web.app
```

---

## 🔒 אבטחה — Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

כל משתמש ניגש אך ורק לנתונים שלו.

---

## 🚀 פריסה

האפליקציה פרוסה על Firebase Hosting:

```bash
firebase deploy
```

לפיתוח מקומי:

```bash
python -m http.server 8000
# פתח: http://localhost:8000
```

> ⚠️ אין לפתוח את `index.html` ישירות דרך `file:///` — Firebase Auth דורש הקשר HTTP אמיתי.

---

## 🏷️ סוגי מסמכים מובנים

| סוג | Emoji |
|-----|-------|
| ביטוח | 🛡️ |
| דרכון | 🛂 |
| פק"מ | 🏦 |
| אחר | 📄 |

ניתן להוסיף סוגים נוספים בשתי דרכים:
1. **מהטופס** — בחר `✚ הוסף סוג...` ב-dropdown
2. **מפאנל הניהול** — ⚙️ ניהול סוגי מסמכים

---

## 🎨 ספריות וטכנולוגיות

| שכבה | טכנולוגיה |
|------|-----------|
| Frontend | Vanilla HTML + CSS + JavaScript (ללא frameworks) |
| גופן | [Heebo](https://fonts.google.com/specimen/Heebo) — Google Fonts |
| אימות | Firebase Authentication (Google Sign-In) |
| בסיס נתונים | Firebase Firestore (v9 Modular SDK) |
| אירוח | Firebase Hosting |

---

## 📧 תזכורות אוטומטיות במייל

תזכורות יומיות נשלחות דרך GitHub Actions (חינמי — ללא Firebase Blaze).

### לוח זמנים לתזכורות
| מצב | תזכורת |
|-----|--------|
| בדיוק 60 יום | פעם אחת |
| 30–9 ימים | פעם בשבוע (30, 23, 16, 9) |
| 0–7 ימים | כל יום |

### הגדרה
1. **Firebase Service Account** — Firebase Console → ⚙️ → Service Accounts → Generate new private key
2. **Gmail App Password** — myaccount.google.com/apppasswords
3. **GitHub Repository Secrets** (`Settings → Secrets → Actions`):

| Secret | ערך |
|--------|-----|
| `FIREBASE_SERVICE_ACCOUNT` | תוכן ה-JSON המלא של ה-service account |
| `EMAIL_USER` | כתובת Gmail של השולח |
| `EMAIL_PASS` | Gmail App Password |

4. הרץ ידנית מ-GitHub Actions UI לאימות (`workflow_dispatch`)

### קבצים
```
.github/workflows/daily-reminders.yml   # הגדרת GitHub Actions (cron: 08:00 ישראל)
scripts/sendReminders.js                 # לוגיקת הסריקה ושליחת המייל
scripts/package.json                     # firebase-admin + nodemailer
```

---

## 📁 מבנה הפרויקט

```
Document Tracker/
├── index.html                    # האפליקציה המלאה (HTML + CSS + JS + Firebase SDK)
├── firebase.json                 # הגדרות Firebase Hosting
├── .firebaserc                   # קישור לפרויקט document-tracker-95417
├── .github/
│   └── workflows/
│       └── daily-reminders.yml  # GitHub Actions cron לתזכורות מייל
├── scripts/
│   ├── sendReminders.js         # סקריפט תזכורות (Node.js)
│   └── package.json             # תלויות: firebase-admin, nodemailer
├── CLAUDE.md                    # הקשר פרויקט לסוכן AI
└── README.md                    # קובץ זה
```

---

## 📝 רישיון

לשימוש אישי חופשי.
