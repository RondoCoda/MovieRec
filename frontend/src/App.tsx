// Route table: / home, /search, /movie/:id, /me/ratings, /me/recommendations.

import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ForYouPage from "./pages/ForYouPage";
import HomePage from "./pages/HomePage";
import MovieDetailPage from "./pages/MovieDetailPage";
import MyRatingsPage from "./pages/MyRatingsPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/movie/:id" element={<MovieDetailPage />} />
        <Route path="/me/ratings" element={<MyRatingsPage />} />
        <Route path="/me/recommendations" element={<ForYouPage />} />
      </Route>
    </Routes>
  );
}
