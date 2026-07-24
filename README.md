# Sanskrit Study Portal (Gita Super Site Format)

A highly structured, visually polished personal study and note-taking application designed specifically for Sanskrit text (especially *sūtra* literature) and commentaries. 

The application is built using **Django (Python)** for its backend REST APIs, **React (TypeScript)** with modern, warm Vanilla CSS for its frontend portal, and **PostgreSQL** as its relational database, all fully containerized via **Docker**.

## Key Features

1. **Gita Super Site Format:**
   - Visualizes individual sūtras within a beautifully formatted, prominent central card.
   - Vertically stacks content into clear, distinct linguistic layers:
     - **Large, Authentic Devanāgarī Script** (using Google's *Yatra One* and *Sanskrit* typography).
     - **IAST Diacritics Transliteration** (for accurate pronunciation guide).
     - **English Translation**.
2. **Multi-level Hierarchy (Books & Chapters):**
   - Organizes study topics under logical hierarchies: **Book (Work being studied) ➔ Sections & Chapters ➔ Subsections ➔ Sūtras**.
   - Sidebars render the entire recursive text index tree beautifully for easy browsing.
3. **Structured Commentaries & Notes:**
   - Supports writing multiple personal commentaries or study observations directly linked to specific sūtras.
   - Notes include fields for an optional **Cross-Reference Sūtra** that renders with the same high-fidelity stacked Devanāgarī/IAST structure as main sūtras.
4. **Sanskrit Term Index (Glossary):**
   - Maintains a searchable repository of philosophical/grammatical terms.
   - Instantly searchable by Devanāgarī, IAST transliteration, or English definitions.
5. **Built-in Harvard-Kyoto (HK) Transliterator Assistant:**
   - Includes typing assistants on input forms that instantly convert simplified Harvard-Kyoto characters into beautiful Devanāgarī script and IAST diacritics as you type!

---

## Quick Start (Using Docker)

To boot up the complete application stack (Database, API, and Frontend), simply run:

```bash
docker compose up -d
```

### Accessing the Portals

- **Web Frontend Interface:** [http://localhost:5173/](http://localhost:5173/)
- **Django Admin Console:** [http://localhost:8000/admin/](http://localhost:8000/admin/)
  - *Username:* `admin`
  - *Password:* `adminpassword`
- **Backend API Endpoints:** [http://localhost:8000/api/](http://localhost:8000/api/)

---

## Running Automated Tests

A comprehensive integration test suite is included in the backend to verify schemas, API routing, recursive tree rendering, and model filtering. To run the tests, execute:

```bash
docker compose run --rm -e DB_HOST="" backend python manage.py test
```

*(Note: We pass `DB_HOST=""` to run tests instantly in-memory using an optimized SQLite config without waiting on a live PostgreSQL database connection.)*

---

## Transliterator Typing Guidelines (Harvard-Kyoto Map)

The built-in typing assistant accepts **Harvard-Kyoto (HK)** input. Use the table below for quick reference when inputting Sanskrit text:

### Vowels
| Type | HK Input | Devanāgarī | IAST |
| --- | --- | --- | --- |
| Short | `a`, `i`, `u` | अ, इ, उ | a, i, u |
| Long | `A`, `I`, `U` | आ, ई, ऊ | ā, ī, ū |
| Vocalic R | `R` | ऋ | ṛ |
| Diphthongs | `e`, `ai`, `o`, `au` | ए, ऐ, ओ, औ | e, ai, o, au |

### Special Characters
| Type | HK Input | Devanāgarī | IAST |
| --- | --- | --- | --- |
| Anusvāra | `M` | ं | ṃ |
| Visarga | `H` | ः | ḥ |
| Avagraha | `'` | ऽ | ' |

### Consonants
- **Retroflexes (Caps):** `T` (ट), `Th` (ठ), `D` (ड), `Dh` (ढ), `N` (ण), `S` (ष)
- **Sibilants:** `z` (श), `S` (ष), `s` (स)
- **Velar/Palatal Nasals:** `G` (ङ), `J` (ञ)
- *Example:* Typing `yogaScittavRttinirodhaH` will generate:
  - **Devanāgarī:** योगश्चित्तवृत्तिनिरोधः
  - **IAST:** yogaś-citta-vṛtti-nirodhaḥ
