# Recommendation module — current design

The team has selected **Genre-based Jaccard Similarity** for the Movie Similarity
feature. The course project brief/rubric has not yet been supplied, so confirm that
this method satisfies the instructor's requirements before treating the algorithm as
final for submission.

## 1. Movie Similarity — selected method

For each movie, represent its genres as a set. For source movie A and candidate movie B:

\[
J(A,B)=\frac{|A\cap B|}{|A\cup B|}
\]

The score is between 0 and 1. A higher score indicates greater genre overlap. Movies
with no genre associations have no similarity recommendations. The source movie is
excluded from its own results.

The database implementation is in `sql/recommendations.sql`:

- `movie_similarity` stores the ranked top-50 recommendations for a source movie.
- `movie_similarity_cache` records that a source movie has been calculated, including
  cases where no similar movies are found.
- `refresh_movie_similarity(movie_id, limit)` calculates and stores the result.
- The API calculates a movie's cache on its first request and reads the precomputed
  rows on later requests. This lazy precomputation avoids constructing a global
  all-movie pair table, which could create a very large intermediate join on MovieLens
  25M.
- If a movie's genre assignments change, refresh its cache by calling
  `SELECT refresh_movie_similarity(movie_id, 50);`.

## 2. Popular Movies — still to be confirmed

The ranking formula has not yet been selected. Possible definitions include rating
count, average rating, or a Bayesian weighted rating. Do not implement one until the
project brief or team confirms the required definition and minimum-rating threshold.

## 3. Items to verify against the course brief

1. Does the instructor accept genre-based content similarity, or must similarity use
   user ratings/tags?
2. Is a top-50 lazy precomputed cache acceptable, or is a full materialized view/table
   expected?
3. Is an evaluation metric or recommendation-quality experiment required?
4. What exact definition should be used for Popular Movies?
5. Are recommendations global or personalized per user?
