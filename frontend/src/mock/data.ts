// Mock dataset for the prototype (task #2), shaped like sql/schema.sql so that
// flipping VITE_USE_MOCK=false later switches to the real backend with no page
// changes. Titles/years/ids follow MovieLens ml-latest-small conventions; the
// rating values below are fabricated for prototyping only.

import type { Genre, MovieDetail, UserSummary } from "../types";

export const GENRES: Genre[] = [
  { genre_id: 1, name: "Action" },
  { genre_id: 2, name: "Adventure" },
  { genre_id: 3, name: "Animation" },
  { genre_id: 4, name: "Children" },
  { genre_id: 5, name: "Comedy" },
  { genre_id: 6, name: "Crime" },
  { genre_id: 7, name: "Documentary" },
  { genre_id: 8, name: "Drama" },
  { genre_id: 9, name: "Fantasy" },
  { genre_id: 10, name: "Horror" },
  { genre_id: 11, name: "Musical" },
  { genre_id: 12, name: "Mystery" },
  { genre_id: 13, name: "Romance" },
  { genre_id: 14, name: "Sci-Fi" },
  { genre_id: 15, name: "Thriller" },
  { genre_id: 16, name: "War" },
  { genre_id: 17, name: "Western" },
];

interface RawMovie {
  id: number;
  title: string;
  year: number;
  genreNames: string[];
  avg: number;
  count: number;
}

const RAW: RawMovie[] = [
  { id: 1193, title: "One Flew Over the Cuckoo's Nest", year: 1975, genreNames: ["Drama"], avg: 4.32, count: 87 },
  { id: 608, title: "Fargo", year: 1996, genreNames: ["Comedy", "Crime", "Drama", "Thriller"], avg: 4.15, count: 72 },
  { id: 2571, title: "Matrix, The", year: 1999, genreNames: ["Action", "Sci-Fi"], avg: 4.2, count: 95 },
  { id: 593, title: "Silence of the Lambs, The", year: 1991, genreNames: ["Crime", "Drama", "Thriller"], avg: 4.25, count: 81 },
  { id: 260, title: "Star Wars: Episode IV - A New Hope", year: 1977, genreNames: ["Action", "Adventure", "Fantasy", "Sci-Fi"], avg: 4.35, count: 110 },
  { id: 1210, title: "Star Wars: Episode V - The Empire Strikes Back", year: 1980, genreNames: ["Action", "Adventure", "Fantasy", "Sci-Fi"], avg: 4.3, count: 102 },
  { id: 1211, title: "Star Wars: Episode VI - Return of the Jedi", year: 1983, genreNames: ["Action", "Adventure", "Fantasy", "Sci-Fi"], avg: 4.05, count: 94 },
  { id: 1221, title: "Godfather, The", year: 1972, genreNames: ["Crime", "Drama"], avg: 4.4, count: 99 },
  { id: 1222, title: "Godfather: Part II, The", year: 1974, genreNames: ["Crime", "Drama"], avg: 4.2, count: 76 },
  { id: 2959, title: "Apocalypse Now", year: 1979, genreNames: ["Drama", "War"], avg: 3.95, count: 51 },
  { id: 1196, title: "Star Trek: The Motion Picture", year: 1979, genreNames: ["Action", "Adventure", "Sci-Fi"], avg: 3.05, count: 37 },
  { id: 1197, title: "Star Trek II: The Wrath of Khan", year: 1982, genreNames: ["Action", "Adventure", "Sci-Fi"], avg: 3.7, count: 35 },
  { id: 597, title: "Ghost in the Shell", year: 1995, genreNames: ["Action", "Animation", "Sci-Fi", "Thriller"], avg: 4.1, count: 47 },
  { id: 2960, title: "Pulp Fiction", year: 1994, genreNames: ["Comedy", "Crime", "Drama", "Thriller"], avg: 4.3, count: 108 },
  { id: 3114, title: "Three Colors: Red", year: 1994, genreNames: ["Drama", "Mystery", "Romance"], avg: 3.8, count: 26 },
  { id: 3578, title: "Gladiator", year: 2000, genreNames: ["Action", "Adventure", "Drama"], avg: 4.0, count: 88 },
  { id: 1080, title: "Snatch", year: 2000, genreNames: ["Comedy", "Crime", "Thriller"], avg: 4.0, count: 65 },
  { id: 1136, title: "Monty Python and the Holy Grail", year: 1975, genreNames: ["Adventure", "Comedy", "Fantasy"], avg: 4.1, count: 59 },
  { id: 2010, title: "Spaceballs", year: 1987, genreNames: ["Comedy", "Sci-Fi"], avg: 3.0, count: 41 },
  { id: 2057, title: "Gojira", year: 1954, genreNames: ["Horror", "Sci-Fi"], avg: 3.6, count: 20 },
  { id: 2066, title: "L.A. Confidential", year: 1997, genreNames: ["Crime", "Drama", "Mystery", "Thriller"], avg: 4.0, count: 55 },
  { id: 2083, title: "Good Will Hunting", year: 1997, genreNames: ["Drama", "Romance"], avg: 4.1, count: 70 },
  { id: 2090, title: "Blade Runner", year: 1982, genreNames: ["Sci-Fi", "Thriller"], avg: 4.0, count: 68 },
  { id: 2091, title: "Good, the Bad and the Ugly, The", year: 1966, genreNames: ["Western"], avg: 4.05, count: 49 },
  { id: 2115, title: "Breakfast at Tiffany's", year: 1961, genreNames: ["Comedy", "Drama", "Romance"], avg: 3.6, count: 33 },
  { id: 592, title: "Fitzcarraldo", year: 1982, genreNames: ["Adventure", "Drama"], avg: 3.7, count: 15 },
  { id: 1100, title: "Bringing Up Baby", year: 1938, genreNames: ["Comedy", "Romance"], avg: 3.8, count: 24 },
  { id: 1102, title: "Grifters, The", year: 1990, genreNames: ["Crime", "Drama", "Thriller"], avg: 3.7, count: 21 },
  { id: 1103, title: "The Little Rascals", year: 1994, genreNames: ["Children", "Comedy"], avg: 2.7, count: 28 },
  { id: 1190, title: "Diner", year: 1982, genreNames: ["Comedy", "Drama"], avg: 3.6, count: 19 },
  { id: 1195, title: "Toy Story", year: 1995, genreNames: ["Adventure", "Animation", "Children", "Comedy", "Fantasy"], avg: 4.0, count: 92 },
  { id: 1194, title: "The Princess Bride", year: 1987, genreNames: ["Adventure", "Children", "Comedy", "Fantasy", "Romance"], avg: 3.9, count: 58 },
  { id: 1198, title: "Raiders of the Lost Ark", year: 1981, genreNames: ["Action", "Adventure"], avg: 4.2, count: 84 },
  { id: 1199, title: "Brazil", year: 1985, genreNames: ["Drama", "Sci-Fi"], avg: 3.8, count: 27 },
  { id: 1200, title: "Lawrence of Arabia", year: 1962, genreNames: ["Adventure", "Drama", "War"], avg: 3.95, count: 32 },
  { id: 1201, title: "Nightmare on Elm Street, A", year: 1984, genreNames: ["Fantasy", "Horror", "Thriller"], avg: 3.3, count: 39 },
  { id: 1204, title: "General, The", year: 1926, genreNames: ["Comedy", "War"], avg: 3.4, count: 12 },
  { id: 1205, title: "Celluloid Closet, The", year: 1995, genreNames: ["Documentary"], avg: 3.5, count: 9 },
  { id: 1206, title: "Some Like It Hot", year: 1959, genreNames: ["Comedy", "Musical"], avg: 4.0, count: 36 },
  { id: 1207, title: "Spy Who Loved Me, The", year: 1977, genreNames: ["Action", "Adventure", "Thriller"], avg: 3.3, count: 29 },
  { id: 1208, title: "Network", year: 1976, genreNames: ["Drama"], avg: 3.9, count: 23 },
  { id: 1209, title: "2001: A Space Odyssey", year: 1968, genreNames: ["Mystery", "Sci-Fi"], avg: 4.0, count: 63 },
  { id: 1212, title: "Dumb & Dumber", year: 1994, genreNames: ["Comedy"], avg: 3.0, count: 45 },
  { id: 1265, title: "Ran", year: 1985, genreNames: ["Action", "Drama", "War"], avg: 3.9, count: 16 },
  { id: 1270, title: "Back to the Future", year: 1985, genreNames: ["Adventure", "Children", "Comedy", "Sci-Fi"], avg: 4.1, count: 86 },
  { id: 1293, title: "Indian in the Cupboard, The", year: 1995, genreNames: ["Adventure", "Children", "Fantasy"], avg: 3.0, count: 26 },
  { id: 1296, title: "Akira", year: 1988, genreNames: ["Action", "Animation", "Sci-Fi"], avg: 3.9, count: 34 },
];

const GENRE_ID_BY_NAME = new Map(GENRES.map((g) => [g.name, g.genre_id]));

export interface MockMovie extends MovieDetail {
  genreIds: number[];
}

export const MOVIES: MockMovie[] = RAW.map((m) => ({
  movie_id: m.id,
  title: m.title,
  year: m.year,
  genres: m.genreNames,
  genreIds: m.genreNames.map((n) => GENRE_ID_BY_NAME.get(n) ?? 0),
  avg_rating: m.avg,
  rating_count: m.count,
}));

export function findMovie(movieId: number): MockMovie | undefined {
  return MOVIES.find((m) => m.movie_id === movieId);
}

export const USERS: UserSummary[] = [
  { user_id: 1, ratings_count: 0, tags_count: 0, watch_count: 0 },
  { user_id: 42, ratings_count: 0, tags_count: 0, watch_count: 0 },
  { user_id: 60, ratings_count: 0, tags_count: 0, watch_count: 0 },
  { user_id: 77, ratings_count: 0, tags_count: 0, watch_count: 0 },
];

/** [movie_id, rating, daysAgo] seed rows per user; half-star values only. */
export const SEED_RATINGS: Record<number, Array<[number, number, number]>> = {
  1: [
    [260, 5.0, 9], [1210, 4.5, 8], [2571, 4.0, 6], [1198, 4.5, 5],
    [1270, 4.0, 4], [1209, 3.5, 3], [1195, 4.0, 2], [1296, 3.0, 1],
  ],
  42: [
    [1221, 5.0, 12], [1222, 4.5, 11], [593, 4.0, 9], [608, 4.5, 7],
    [3578, 3.5, 5], [2066, 4.0, 4], [1265, 4.5, 3],
  ],
  60: [
    [1136, 5.0, 10], [2010, 3.5, 9], [1206, 4.0, 8], [1212, 3.0, 6],
    [1103, 2.5, 5], [1194, 4.5, 2],
  ],
  77: [
    [597, 4.5, 8], [2090, 4.0, 7], [1199, 3.5, 6], [1296, 4.5, 5],
    [3114, 3.0, 3],
  ],
};
