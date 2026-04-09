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

## 📁 מבנה הפרויקט

```
Document Tracker/
├── index.html      # האפליקציה המלאה (HTML + CSS + JS + Firebase SDK)
├── firebase.json   # הגדרות Firebase Hosting
├── .firebaserc     # קישור לפרויקט document-tracker-95417
├── CLAUDE.md       # הקשר פרויקט לסוכן AI
└── README.md       # קובץ זה
```

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

## 📝 רישיון

לשימוש אישי חופשי.
