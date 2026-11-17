# MovieRec — Requirements Specification (Member D)

Owner: Member D (Frontend & Integration) · Status: **draft for team confirmation** · Due: 2026-11-18

This document defines what the web application must do. All endpoints and field names below
match the implemented backend (`backend/app/routers/`) and `sql/schema.sql`, so frontend,
backend and database stay consistent.

---

## 1. User Stories

| ID | As a… | I want to… | So that… | Priority |
|----|-------|-----------|----------|----------|
| US-1 | visitor | browse popular movies on the home page | I can discover well-rated movies without typing anything | P0 |
| US-2 | visitor | search movies by title text and filter by genre | I can quickly find a specific movie or a type of movie | P0 |
| US-3 | signed-in user | view a movie's detail page (year, genres, average rating, rating count) | I can decide whether to watch it | P0 |
| US-4 | signed-in user | rate a movie from 0.5 to 5.0 in 0.5 steps, and change my rating later | my profile reflects my true opinion, and recommendations improve | P0 |
| US-5 | signed-in user | see my own rating history, newest first | I can review and edit what I have rated | P1 |
| US-6 | signed-in user | get personalized recommendations based on my rating history | I get suggestions tailored to my taste, not just popular titles | P0 |
| US-7 | signed-in user | see movies similar to the movie I am viewing | I can find "more like this" from any detail page | P1 |
| US-8 | anyone | switch the current user profile (demo mode) | we can demonstrate different users' histories without a login system | P0 |

> Note: the schema stores `user_id` only (no password), so US-8 is our login substitute.
> The app keeps the selected `user_id` in the browser (localStorage) and shows per-user
> activity counts (`GET /api/users/{id}`).

## 2. Page Inventory

| # | Page | Route | Key data (API) | User stories |
|---|------|-------|----------------|--------------|
| 1 | Home / Popular | `/` | popular list (see §3.1); genres for filter chips `GET /api/genres` | US-1, US-8 |
| 2 | Search Results | `/search?q=&genre=` | `GET /api/movies?query=&genre_id=&limit=&offset=` | US-2 |
| 3 | Movie Detail | `/movie/:id` | `GET /api/movies/{id}` + `PUT /api/users/{uid}/ratings/{mid}` + `GET /api/recommendations/movies/{id}/similar` | US-3, US-4, US-7 |
| 4 | My Ratings | `/me/ratings` | `GET /api/users/{uid}/ratings?limit=&offset=` | US-5, US-4 |
| 5 | For You (Recommendations) | `/me/recommendations` | `GET /api/recommendations/users/{uid}` (+ `?refresh=true`) | US-6 |
| – | User switcher (header widget, all pages) | – | `GET /api/users/{uid}` | US-8 |

Shared layout: top bar (logo → home, search box, user switcher), 5–10 movies per page with
pagination (limit/offset), consistent movie card (title, year, genres, avg rating).

## 3. Functional Requirements & Priorities

### 3.1 P0 — must have
- **FR-1 Browse**: home page lists popular movies (cover-style cards, ≥5 per page).
  ⚠️ *Open decision:* the backend has no `/api/recommendations/popular` yet (see
  `docs/recommendation-requirements-pending.md`). Until the formula is confirmed, the
  frontend will call it as `GET /api/recommendations/popular?limit=…` and fall back to
  `GET /api/movies` — **Member A to implement; team to confirm the popularity formula
  (proposal: Bayesian average of ratings with ≥50 ratings).**
- **FR-2 Search**: keyword search on title (trigram-backed, partial match allowed) + optional
  genre filter; empty result must show a friendly empty state.
- **FR-3 Detail**: show title/year/genres/avg_rating/rating_count; 404 state if movie missing.
- **FR-4 Rate**: half-star control (0.5–5.0); values outside range or not multiples of 0.5
  rejected client-side before hitting the 422 from the API; PUT is idempotent (re-submitting
  updates). Pre-fill current user's existing rating on the detail page.
- **FR-5 Personalized recommendations**: ranked list with `score`; show "based on your N
  ratings" hint; `refresh=true` button available when cache is stale.
- **FR-6 User switcher**: choose/enter any existing `user_id`; invalid id shows error state;
  switching user updates My Ratings and For You pages everywhere.
- **FR-7 Pagination**: 10 items per page default (backend max 100); prev/next controls.

### 3.2 P1 — should have
- **FR-8 Rating history**: newest first, each row links to movie detail; click a rating to edit in place.
- **FR-9 Similar movies**: "More like this" section (up to 10, `similarity_score` shown as % ).
- **FR-10 Genre chips** on home/search mapping `name → genre_id` via `/api/genres`.

### 3.3 P2 — nice to have (only if 12/4 buffer allows)
- **FR-11** Tag display on detail page (`movie_tags` exists in schema; no read API yet — would
  need Member A endpoint `GET /api/movies/{id}/tags`).
- **FR-12** Skeleton loading / animation polish for demo video.

## 4. Non-functional / interface contract
- All requests go to `/api/*` (base URL via env `VITE_API_BASE`, default `http://localhost:8000/api`).
- CORS already allows Vite dev origin `localhost:5173` (`backend/app/main.py`).
- Error handling: surface API `detail` messages (404/422) to the user, never blank screens.
- Target browser: Chrome (demo recording environment).

## 5. Definition of Done (for the graded deliverable)
1. All 5 pages work against the real backend on `ml-latest-small` (or agreed dev dataset).
2. Demo user journey passes: switch user → search movie → rate 4.5 → My Ratings shows it →
   For You list changes after refresh.
3. No console errors during the recorded flow.

---

**Confirmation requested from:** A (FR-1 formula & endpoint, FR-11 feasibility), B (field
naming consistency), C (dev dataset decision — ml-latest-small vs sampled-100k, and TA
confirmation items), all (page list and priorities).
