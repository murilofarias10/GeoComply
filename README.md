# GAS – GeoAlert System iGaming

<p align="center">
  <img src="images/Brand.png" alt="GAS Brand Logo" width="180" />
</p>

A full-stack intelligence dashboard that monitors Reddit posts related to the U.S. iGaming industry, classifies them using OpenAI GPT, and surfaces geolocation alerts with a US map visualization. Post data is persisted in a **Supabase (PostgreSQL)** database.

---

## Architecture

### Project Structure

```
GAS/
├── Dockerfile                # Multi-stage Docker build (frontend → backend)
├── render.yaml               # Render deployment config
├── .dockerignore
├── server/                   # Node.js + Express backend
│   ├── server.js             # Express app, API routes & static file serving
│   ├── redditService.js      # RSS fetching + Supabase read/write
│   ├── openaiService.js      # OpenAI GPT-4o-mini classification
│   ├── .env                  # Your real credentials (never commit this)
│   └── .env.example          # Template — copy to .env and fill in values
└── client/                   # React + Vite + Tailwind frontend
    ├── .npmrc                # legacy-peer-deps for react-simple-maps compat
    └── src/
        ├── App.jsx            # Main GAS dashboard
        ├── api.js             # API client
        └── components/
            ├── KpiCards.jsx   # Top KPI metrics
            ├── PostsTable.jsx # Posts data table with pagination
            ├── Filters.jsx    # Subreddit/classification/alert filters
            ├── UsMap.jsx      # US map with complaint hotspots
            ├── ActionButtons.jsx
            └── Toast.jsx
```

### System Flow

```
                    ┌─────────────┐
                    │    USER     │
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  GAS DASHBOARD         │
              │  (React – static build)│
              └────────────┬───────────┘
                            │
                   API calls (same origin)
                            │
                            ▼
              ┌────────────────────────┐
              │  EXPRESS SERVER        │
              │  (port 10000)          │
              │  • Serves React build  │
              │  • REST API            │
              └───┬──────────┬─────────┘
                  │          │
        ┌─────────┘          └──────────────┐
        ▼                                   ▼
┌───────────────────┐            ┌──────────────────────┐
│   SUPABASE        │            │ EXTERNAL SERVICES    │
│   PostgreSQL      │            │ • FetchRSS (Reddit)  │
│   reddit_posts    │            │ • OpenAI API         │
│   (persistent DB) │            └──────────────────────┘
└───────────────────┘
```

> **Production note:** The React app is compiled to static files during the Docker build and served directly by Express — there is no separate frontend server in production. Both the UI and the API run on a single port (`10000`).

---

## Deployment (Render)

The project ships as a **single Docker container** deployed on [Render](https://render.com).

### Docker build (multi-stage)

| Stage | Base image | What it does |
|-------|-----------|--------------|
| `frontend-builder` | `node:20-alpine` | Installs deps and runs `vite build` |
| `production` | `node:20-alpine` | Runs Express; copies the compiled React `dist/` as static files |

### Render config (`render.yaml`)

```yaml
services:
  - type: web
    name: geocomply-reddit-monitor
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free
    envVars:
      - key: OPENAI_API_KEY   # set in Render dashboard
      - key: SUPABASE_URL     # set in Render dashboard
      - key: SUPABASE_KEY     # set in Render dashboard
      - key: PASSWORD_PROTECTION  # set in Render dashboard
```

All secrets are injected as environment variables from the Render dashboard — **nothing sensitive is baked into the image**.

---

## Local Development Setup

### 1. Get API credentials

> **No Reddit API key needed!** Posts are fetched via pre-configured RSS feeds from [FetchRSS](https://fetchrss.com).

**OpenAI API (required for AI classification):**
1. Go to https://platform.openai.com/api-keys
2. Create a new secret key

**Supabase (required for data persistence):**
1. Go to https://supabase.com and create a project
2. From **Project Settings → API**, copy your Project URL and Publishable (anon) key
3. Create the `reddit_posts` table using the schema below

### 2. Configure environment variables

```bash
cd server
cp .env.example .env
# Fill in OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY, and PASSWORD_PROTECTION
```

`.env.example` shows all required variables:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=5000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your_supabase_publishable_key
PASSWORD_PROTECTION=your_password
```

### 3. Start the backend

```bash
cd server
npm install
npm run dev    # or: npm start
# Server runs on http://localhost:5000
```

### 4. Start the frontend

```bash
cd client
npm install --legacy-peer-deps
npm run dev
# Dashboard opens at http://localhost:3000 (proxies API to port 5000)
```

> `--legacy-peer-deps` is required because `react-simple-maps@3.0.0` has not yet declared support for React 19. The `client/.npmrc` file sets this automatically for Docker builds.

---

## Database Schema

Posts are stored in the `reddit_posts` table in Supabase:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Reddit post ID |
| `title` | TEXT | Post title |
| `text` | TEXT | Post body (HTML-stripped) |
| `subreddit` | TEXT | Source subreddit |
| `author` | TEXT | Reddit username |
| `created_utc` | BIGINT | Post creation time (Unix timestamp) |
| `url` | TEXT | Direct Reddit URL |
| `classification` | TEXT | AI classification result |
| `alert_level` | TEXT | HIGH / MEDIUM / LOW |
| `reason` | TEXT | AI explanation for classification |
| `analyzed_at` | TIMESTAMPTZ | When AI analysis was run |
| `state` | TEXT | Detected US state (2-letter code or null) |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/posts` | Retrieve all stored posts from Supabase |
| GET | `/stats` | Get KPI aggregates |
| POST | `/fetch` | Pull fresh posts from Reddit RSS feeds |
| POST | `/analyze` | Classify unanalyzed posts with OpenAI |
| POST | `/auth/verify` | Validate action password |
| DELETE | `/posts/clear` | Clear all stored posts |

---

## Dashboard Features

- **Fetch Reddit Posts** – Pulls the latest posts from 5 iGaming subreddits via RSS; only new posts are inserted (existing classifications are never overwritten)
- **Analyze with AI** – Sends unanalyzed posts to GPT-4o-mini for classification
- **Refresh Dashboard** – Reloads data without re-fetching
- **KPI Cards** – Total posts, geo issues, HIGH alerts, subreddits monitored (click for detail modals)
- **US Map** – Shows geolocation complaint hotspots across iGaming states
- **Posts Table** – Filterable, paginated table with expandable AI reasoning
- **Filters** – Filter by subreddit, classification, alert level, or keyword

---

## Classification Categories

| Category | Alert Level |
|----------|-------------|
| Geolocation error | HIGH / MEDIUM |
| App bug | HIGH / MEDIUM / LOW |
| User confusion | MEDIUM / LOW |
| Other not relevant | LOW |

---

## Monitored Subreddits (via FetchRSS)

`r/onlinegambling` · `r/sportsbetting` · `r/poker` · `r/gamblingaddiction` · `r/sportsbook`
