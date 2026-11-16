# Backend (FastAPI)

This backend is built against the **Member B v2 PostgreSQL schema** in `sql/schema.sql`.
It does not create or modify the database schema. Load the dataset and install the
application indexes using the existing project instructions before testing database routes.

## 1. Install dependencies

From the project root:

```bash
python -m pip install -r requirements.txt
```

## 2. Configure PostgreSQL

The backend reads the same environment variables used by the data loader:

| Variable | Default | Meaning |
|---|---|---|
| `PGHOST` | `localhost` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGUSER` | current OS/database user | Database user |
| `PGPASSWORD` | unset | Database password |
| `PGDATABASE` | `movierec_dev` | Database name |
| `PGCONNECT_TIMEOUT` | `5` | Connection timeout in seconds |
| `CORS_ORIGINS` | localhost ports 3000 and 5173 | Comma-separated frontend origins |

Do not commit database passwords or `.env` files. Set the variables in the terminal
before starting the API. Example (macOS/Linux):

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=movierec_dev
# Set PGPASSWORD only if your local PostgreSQL setup requires it.
```

PowerShell example:

```powershell
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGDATABASE = "movierec_dev"
```

## 3. Start the API

Run from the project root (the folder containing `backend/` and `sql/`):

```bash
python -m uvicorn app.main:app --app-dir backend --reload
```

Then open:

- Swagger UI: <http://127.0.0.1:8000/docs>
- ReDoc: <http://127.0.0.1:8000/redoc>
- Health check: <http://127.0.0.1:8000/api/health>

Keep the terminal running while using these URLs. `127.0.0.1` is the same computer,
not a public website. The health check verifies the database connection too.

## 4. Implemented endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API and database |
| GET | `/api/genres` | List genre IDs and names |
| GET | `/api/movies` | Browse/search/filter by `genre_id` |
| GET | `/api/movies/{movie_id}` | Movie details, genres, rating summary |
| GET | `/api/users/{user_id}` | User ID and activity counts available in schema |
| GET | `/api/users/{user_id}/ratings` | Rating history |
| PUT | `/api/users/{user_id}/ratings/{movie_id}` | Create/update a half-star rating |
| GET | `/api/recommendations/movies/{movie_id}/similar?limit=10` | Top-N movies by Genre-based Jaccard Similarity |

The current schema has no username, email, or other profile fields. Therefore the user
endpoint returns `user_id`, rating count, tag count, and watch count; it does not invent
profile information. A user and movie must already exist before a rating can be submitted.

## 5. Movie Similarity recommendation

The team selected Genre-based Jaccard Similarity for the first version. The score is
`|A intersection B| / |A union B|`, where A and B are the movies' genre sets. The first
request for a source movie computes and caches its top 50 results in `movie_similarity`;
subsequent requests read the cache. The SQL function uses an advisory transaction lock
when refreshing the same source movie concurrently. Run `sql/recommendations.sql` before
calling this endpoint. If a movie's genres change, manually refresh it with
`SELECT refresh_movie_similarity(movie_id, 50);`.

The Popular Movies ranking formula remains unimplemented until the course brief or team
confirms whether it should use rating count, average rating, Bayesian weighted rating, or
another definition. Confirm that the instructor accepts genre-based similarity before
final submission; see `docs/recommendation-requirements-pending.md`.

## 6. Notes

- All SQL values are passed as bound parameters.
- Genre filtering uses `movie_genres.genre_id`, consistent with Member B's schema and
  the `idx_movie_genres_genre` application index.
- Rating writes use `ON CONFLICT (user_id, movie_id) DO UPDATE`, consistent with the
  ratings composite primary key and half-star database constraint.
- No authentication/authorization layer is included in this coursework scaffold.
