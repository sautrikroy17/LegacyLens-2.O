<div align="center">

<img src="https://raw.githubusercontent.com/sautrikroy17/LegacyLens-2.O/main/public/landing-preview.png" alt="LegacyLens 2.0 Landing Page" width="100%" style="border-radius:12px;" />

<br/>
<br/>

# 🔷 LegacyLens 2.0

### *Bridge the gap between English and SQL.*

**An AI-powered Natural Language Database Interface — built for humans, not just engineers.**

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-legacy--lens--beta.vercel.app-38bdf8?style=for-the-badge)](https://legacy-lens-beta.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-sautrikroy17%2FLegacyLens--2.O-181717?style=for-the-badge&logo=github)](https://github.com/sautrikroy17/LegacyLens-2.O)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**LegacyLens 2.0** is a production-grade, AI-powered Natural Language Database Interface (NLDBI) that allows non-technical users to query complex relational (`MySQL`) and NoSQL (`MongoDB`) databases using plain English — no SQL knowledge required.

Built for the competitive hackathon space, it unifies a serverless Next.js edge runtime with advanced AI inference (Pollinations AI / Gemini) to convert natural language into precise, executable database queries in real time.

---

## 🗂 Repository Structure

```
LegacyLens-2.O/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Main UI (Hero + DB Connect + Query Engine)
│   │   ├── layout.tsx            ← Root layout (fonts, metadata)
│   │   ├── globals.css           ← Design system (dark-cyan glassmorphism)
│   │   └── api/
│   │       ├── connect/
│   │       │   └── route.ts      ← POST /api/connect  (MySQL/MongoDB schema sniffing)
│   │       └── query/
│   │           └── route.ts      ← POST /api/query    (AI generation + query execution)
│   └── lib/
│       └── db.ts                 ← SQLite demo DB (better-sqlite3, auto-seeded)
├── public/
│   └── landing-preview.png       ← Landing page screenshot
├── next.config.ts
├── package.json
└── README.md
```

---

## 🎨 Frontend

The entire frontend is a **single-page React application** built with Next.js 16 App Router (`src/app/page.tsx`).

### UI Architecture

| Layer | Details |
|-------|---------|
| **Framework** | Next.js 16 + React 19 (App Router, `"use client"`) |
| **Animations** | Framer Motion — scroll-parallax, spring physics, `AnimatePresence` transitions |
| **Icons** | Lucide React |
| **Fonts** | Inter, Space Grotesk, Outfit (Google Fonts via `next/font`) |
| **Styling** | Vanilla CSS Modules + CSS custom properties (no Tailwind in core UI) |
| **Design System** | Dark navy `#03040b`, cyan accent `#38bdf8`, glassmorphism cards |

### User Flow (Two-Step Engine)

```
Step 1: Connect
  ├─ Select database type → MySQL | MongoDB
  ├─ Enter credentials (host, port, user, password, DB name)
  ├─ OR → Skip to Demo Mode (pre-seeded SQLite DB, no config needed)
  └─ On success → navigate to Query view

Step 2: Query
  ├─ Type or speak a natural language question (Voice via WebSpeech API)
  ├─ "Generate Query" → calls POST /api/query → AI returns raw SQL/Mongo JSON
  ├─ Review generated query in a live code block (editable)
  └─ "Execute Securely" → runs verified query → displays tabular results
```

### Key Frontend Features

- **🎙 Voice Recognition** — Native `webkitSpeechRecognition` integration; speak your queries hands-free
- **♿ Accessibility Suite** — Dyslexia-friendly font toggle (Comic Neue) + dynamic font-size scaler (`0.8rem`–`1.8rem`)
- **✨ Micro-animations** — Rotating Aperture icon, scroll-parallax watermark text, spring-physics card entrances
- **📱 Fully Responsive** — Mobile-first breakpoints with collapsing flex layouts

---

## ⚙️ Backend (API Routes)

All backend logic lives within Next.js API Routes (`src/app/api/`), running serverlessly on Vercel Edge.

### `POST /api/connect`

Accepts database credentials, connects to the live database, introspects its schema, and returns a structured schema string for the AI prompt.

| DB Type | Process |
|---------|---------|
| **MySQL** | `mysql2/promise` → `SHOW TABLES` → `DESCRIBE <table>` for each table |
| **MongoDB** | `MongoClient` → `listCollections()` → sample 5 docs per collection for field inference |

**Response:**
```json
{
  "success": true,
  "schemaString": "Table users (id int(11), name varchar(255), email varchar(255));\nTable orders (...);"
}
```

---

### `POST /api/query` — Phase 1: AI Generation

Takes a natural language query + schema string, builds a system prompt, and forwards to the AI engine.

**AI Prompt Strategy:**
- For **SQL** (MySQL / SQLite): instructs the model to return *only* raw SQL — no backticks, no explanation
- For **MongoDB**: instructs the model to return a JSON operation object: `{ operation, collection, filter?, pipeline? }`

**Inference Engine:**

```
Primary  →  Pollinations AI (https://text.pollinations.ai/) — free, no API key
```

---

### `POST /api/query` — Phase 2: Execution

After the user reviews and approves the generated query, a second call executes it against the live database.

| DB Type | Execution Method |
|---------|-----------------|
| **SQLite (Demo)** | `better-sqlite3` → `db.prepare(sql).all()` or `.run()` |
| **MySQL** | `mysql2/promise` — comment-stripped SQL, BigInt serialization |
| **MongoDB** | `find` / `aggregate` dispatch based on operation field |

**Security:** SQL comments (`--`, `/* */`) are stripped before execution. Write operations on MongoDB are safely bypassed in demo mode.

---

### `src/lib/db.ts` — Demo SQLite Database

Auto-seeded on first run with realistic data:

| Table | Records |
|-------|---------|
| `users` | 150 users (name, email, age, role, country, status, created_at) |
| `products` | 10 products across 4 categories |
| `orders` | ~400 orders with statuses (completed / pending / refunded) |

Uses WAL journal mode for performance. Schema exposed to AI for accurate query generation.

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Runtime** | React 19 |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev) |
| **AI Inference** | [Pollinations AI](https://pollinations.ai) |
| **MySQL Driver** | `mysql2` |
| **MongoDB Driver** | `mongodb` |
| **SQLite (Demo)** | `better-sqlite3` |
| **TypeScript** | v5 |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 🚀 Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/sautrikroy17/LegacyLens-2.O.git
cd LegacyLens-2.O

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **No API keys required for demo mode!** The app ships with a pre-seeded SQLite database. Click *"Skip to Demo"* on the connect screen to start querying immediately.

### Optional: Connect your own database

Create a `.env.local` file with your credentials:
```env
# Not required for demo — only if connecting a live MySQL/MongoDB instance
DB_HOST=your_host
DB_USER=your_user
DB_PASS=your_password
DB_NAME=your_database
```

---

## 🌍 Live Deployment

👉 **[https://legacy-lens-beta.vercel.app](https://legacy-lens-beta.vercel.app)**

Deployed on **Vercel** via continuous deployment from the `main` branch. Serverless functions handle all database connections and AI inference at the edge.

---

## 📸 Preview

![LegacyLens Landing Page](https://raw.githubusercontent.com/sautrikroy17/LegacyLens-2.O/main/public/landing-preview.png)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**© 2026 Sautrik Roy — Licensed under the [MIT License](LICENSE)**

*Built for the competitive Hackathon space. Any resemblance to actual production-grade engineering is entirely intentional.*

</div>
