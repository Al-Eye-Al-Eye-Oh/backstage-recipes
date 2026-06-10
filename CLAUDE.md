# Backstage Recipes — Project Handoff

## Overview
A mobile-first PWA for bar operators to store and scale cocktail recipes, tinctures, and syrups. Users can enter recipes manually or import them from a PDF. Recipes are stored in Supabase and the app is deployed on Vercel.

---

## Tech Stack
- **Frontend:** React + Vite, Tailwind CSS, React Router v6
- **PWA:** vite-plugin-pwa (add-to-home-screen on iOS)
- **Database:** Supabase (PostgreSQL)
- **PDF Parsing:** PDF.js (client-side text extraction) + Gemini API (AI ingredient parsing)
- **Deployment:** Vercel
- **Dev server:** `vercel dev` (required to run both Vite frontend and `/api` serverless functions together)

---

## Project Structure
```
recipe-scaler/
├── api/
│   └── parse-recipe.js        # Vercel serverless function — calls Gemini to parse PDF text
├── public/                    # PWA icons
├── src/
│   ├── lib/
│   │   ├── supabase.js        # Supabase client
│   │   └── units.js           # Unit list, conversion logic (ml, oz, L, g, kg, dash, etc.)
│   ├── components/
│   │   └── BottomNav.jsx      # iOS-style bottom nav (Recipes, New Recipe, Import PDF)
│   ├── pages/
│   │   ├── RecipeList.jsx     # Home screen — lists all saved recipes
│   │   ├── RecipeForm.jsx     # Create/edit recipe form
│   │   ├── RecipeDetail.jsx   # View a recipe's ingredients, navigate to scaling
│   │   ├── ScaleView.jsx      # Scale recipe by ingredient with unit conversion
│   │   └── ImportRecipe.jsx   # PDF upload → Gemini parse → review → save
│   ├── App.jsx                # Routes
│   ├── main.jsx
│   └── index.css              # Tailwind + iOS safe area insets
├── index.html                 # iOS PWA meta tags
├── vite.config.js             # Vite + PWA plugin config
├── tailwind.config.js
├── vercel.json                # API rewrite rules
├── supabase-schema.sql        # Run this once in Supabase SQL editor to create tables
└── .env                       # Local env vars (not committed to git)
```

---

## Environment Variables
Create a `.env` file in the project root with:
```
VITE_SUPABASE_URL=https://exzoeebzvmudxqgmbmky.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_oaY0lUgSMCFh7CR73DPodw_0uP4-dUn
GEMINI_API_KEY=<your Gemini API key>
```

`VITE_` prefixed vars are exposed to the frontend. `GEMINI_API_KEY` is server-side only (used in `/api/parse-recipe.js`).

For Vercel deployment, add these same variables in the Vercel project dashboard under **Settings → Environment Variables**.

---

## Supabase Setup
The database schema has already been applied to the Supabase project. For reference, the schema is in `supabase-schema.sql`:

```sql
create table recipes (
  id bigint generated always as identity primary key,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table ingredients (
  id bigint generated always as identity primary key,
  recipe_id bigint references recipes(id) on delete cascade not null,
  name text not null,
  quantity numeric not null,
  unit text not null,
  position int default 0
);
```

Row Level Security is enabled with open policies (no auth yet — lock down after adding user authentication).

---

## Running Locally
You **must** use `vercel dev` instead of `npm run dev`. The `/api` serverless functions (Gemini parsing) only run under `vercel dev`.

```bash
# Install dependencies
npm install

# Install Vercel CLI (once)
npm install -g vercel

# Start dev server (first run will prompt Vercel login + project setup)
vercel dev
```

App runs at `http://localhost:3000`.

---

## Gemini API — Current Status (Unresolved)
The PDF import feature is built and working but the Gemini API is currently blocked by a **quota limit of 0** on the free tier. This is a Google account/project billing restriction.

**To fix:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select the Google Cloud project associated with the API key
3. Go to **Billing** → link a billing account (Google gives $300 free credit; recipe parsing costs fractions of a cent)
4. Update `GEMINI_API_KEY` in `.env` with a working key

**Current model in use:** `gemini-2.0-flash-lite` (in `api/parse-recipe.js`)

**Alternative options if Gemini remains blocked:**
- Switch to OpenAI API (similar integration, ~$0.01 per 100 PDFs)
- Replace AI parsing with regex-based extraction (free, works for consistently formatted PDFs)

---

## Core Features Built

### Recipe Management
- Create, edit, delete recipes
- Each recipe has a name, optional description, and a list of ingredients (name, quantity, unit)

### Scaling
- Open any recipe → tap "Scale This Recipe"
- Select any ingredient as the anchor (e.g. "I have 1.75L of bourbon")
- Enter the target quantity and unit
- All other ingredients scale proportionally
- Per-ingredient unit override (e.g. display result in ml instead of oz)
- Scale factor shown for reference
- Copy scaled recipe to clipboard as plain text

### Units Supported
`ml`, `oz`, `L`, `tsp`, `tbsp`, `cup`, `dash`, `barspoon`, `g`, `kg`, `pinch`, `each`

Liquid units convert between each other. Weight units (`g`/`kg`) convert between each other. Liquid ↔ weight conversion is intentionally not supported.

### PDF Import
- Upload a PDF (single or multi-recipe)
- PDF.js extracts text client-side
- Text sent to `/api/parse-recipe` → Gemini parses into structured JSON
- Review/edit each parsed recipe before saving
- Progress tracker for multi-recipe PDFs
- Skip individual recipes
- **Currently blocked by Gemini API quota (see above)**

---

## Deployment to Vercel
1. Push project to a GitHub repository
2. Import the repo at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
4. Deploy — Vercel auto-deploys on every push to main

The app was named **backstage-recipes** in Vercel during local setup.

---

## iOS PWA Installation
Once deployed to Vercel:
1. Open the Vercel URL in **Safari** on iPhone
2. Tap the **Share** button → **"Add to Home Screen"**
3. App launches fullscreen with no browser chrome, bottom nav, and safe area insets handled

---

## Potential Next Features
- Notes field on recipes (e.g. "stir 60 sec, strain into growler")
- Scale by total output volume (e.g. "I want 10L total")
- Recipe categories/tags (syrups, tinctures, batched cocktails)
- User authentication (lock recipes to an account)
- Print/share view formatted for the team
