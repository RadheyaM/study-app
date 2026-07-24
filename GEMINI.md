# Sanskrit Study Portal - Developer Guidelines & Memory

Welcome to the Sanskrit Study Portal. This repository contains a Django backend API and a React (TypeScript) Vite frontend designed for structuring, analyzing, and taking notes on Sanskrit scripture.

---

## 🏗️ Architectural Overview
- **Backend:** Django Rest Framework (DRF) running inside Docker.
  - Core app: `backend/study`
  - DB: PostgreSQL or SQLite (managed via Docker Compose).
- **Frontend:** React 18, Vite, TypeScript, and Vanilla CSS.
  - Main app loop: `frontend/src/App.tsx`
  - Transliteration utility: `frontend/src/sanscript.ts`

---

## ⌨️ Custom Sanskrit Transliteration
We use a custom, hybrid transliteration engine defined in `frontend/src/sanscript.ts` supporting both strict **Harvard-Kyoto (HK)** and **Google Transliteration / EasySanskritTyping** phonetic combinations:
- **Key Conjuncts:** 
  - `gy` / `jn` -> **ज्ञ** (`jñ` in IAST)
  - `ksh` / `ks` -> **क्ष** (`kṣ` in IAST)
  - `tr` -> **त्र** (`tr` in IAST)
  - `shr` -> **श्र** (`śr` in IAST)
- **Phonetic Consonants:**
  - `ch` -> **च** (IAST `c`)
  - `chh` -> **छ** (IAST `ch`)
  - `ny` -> **ञ** (IAST `ñ`)
  - `shh` / `Sh` -> **ष** (IAST `ṣ`)
  - `sh` -> **श** (IAST `ś`)
- **Phonetic Vowels:**
  - `aa` -> **आ** (IAST `ā`)
  - `ii` / `ee` -> **ई** (IAST `ī`)
  - `uu` / `oo` -> **ऊ** (IAST `ū`)
- **Punctuation Specials:**
  - `OM` / `om` -> **ॐ**
  - `.` / `|` -> **।** (Single Danda)
  - `..` / `||` -> **॥** (Double Danda)

### Reverse Transliteration:
Use `iastToHk(iast: string): string` to convert diacritic-rich academic IAST back into phonetic, user-friendly typing assistant values to pre-populate inputs during editing.

---

## 🗂️ Database Model Adjustments
- The `Sutra` model (`backend/study/models.py`) contains fields to support custom naming conventions and non-sequential identifiers:
  - `item_label` (CharField, default="Sūtra"): Custom label (e.g., Verse, Sloka, Karika, Mantra).
  - `item_number` (CharField, blank=True, default=""): Custom display numbering / identifiers (e.g., "1.1", "43a").
- Serialize these fields in DRF and render them on the frontend as `{s.item_label} #{s.item_number}`.

---

## 🌳 Sidebar Tree State Derivation
- **Top-Level Grouping:** Books are top-level expandable tree nodes.
- **Derived Sections State:** Instead of a separate `sections` state variable, `sections` are derived reactively:
  `const sections = activeBook ? (bookTrees[activeBook.id] || []) : [];`
- **Eager Loading:** Books and their full nested hierarchies are loaded eagerly via `fetchBooks()` and stored in the `bookTrees` state mapping.

---

## 📝 Notion-Style Notes with BlockNote
- Notes are authored and rendered using **BlockNote v0.11.2** in `App.tsx`.
- **Custom React Block (`sutraBox`):** Allows inline insertion of structured scripture cards containing:
  - *Book Name*
  - *Item Label* (e.g. Verse) & *Number*
  - *Devanāgarī Text*
  - *Translation / Details*
- **Backward Compatibility:** Notes are saved as JSON strings. If JSON parsing fails on load, it is wrapped automatically in a paragraph block to preserve legacy plain text notes.

---

## 🛠️ Docker & Local Operations
Ensure you run Docker commands with compliance for the local operating system:
- **Build & Launch Dev Environment:**
  `docker-compose up --build -d`
- **Stop Containers:**
  `docker-compose down`
- **Install Frontend Dependencies:**
  `docker-compose run --rm frontend npm install`
- **Frontend Production Compilation Check:**
  `docker-compose run --rm frontend npm run build`
- **Generate Backend Migrations:**
  `docker-compose run --rm backend python manage.py makemigrations`
- **Apply Backend Migrations:**
  `docker-compose run --rm backend python manage.py migrate`
