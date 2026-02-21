# Document Tracker — Project Context

## Overview
A client-side web app for tracking personal documents with expiration dates.
All data is stored in `localStorage` — no backend required.

## Features
- **Add documents**: name, type, expiration date
- **Document types**: ביטוח (Insurance), דרכון (Passport), פק"מ, אחר (Other)
- **Urgency color coding**:
  - 🔴 Red — expired or expiring within 30 days
  - 🟠 Orange — expiring within 60 days
  - 🟢 Green — more than 60 days to go
- **Persistence**: `localStorage` (no server)

## Files
| File | Purpose |
|------|---------|
| `index.html` | Main app (single-file, self-contained) |
| `CLAUDE.md` | This project context file |

## Tech Stack
- Pure HTML + CSS + JavaScript (no frameworks)
- RTL layout (Hebrew UI)
- `localStorage` for persistence

## Run
Open `index.html` directly in any modern browser — no build step needed.

## Development Notes
- All logic lives in a single `index.html` for simplicity
- Date comparison uses `Date.now()` vs parsed ISO date strings
- The urgency thresholds are 30 days (red) and 60 days (orange)
