// Shared layout: sticky header with logo, nav links, search box and the
// user switcher that replaces login (FR-6/US-8).

import { useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { KNOWN_USER_IDS, USE_MOCK } from "../api/client";
import { useCurrentUser } from "../context/UserContext";

function UserSwitcher() {
  const { userId, setUserId } = useCurrentUser();
  const [custom, setCustom] = useState("");

  const submitCustom = (e: FormEvent) => {
    e.preventDefault();
    const id = Number(custom.trim());
    if (Number.isInteger(id) && id > 0) {
      setUserId(id);
      setCustom("");
    }
  };

  return (
    <form className="user-switch" onSubmit={submitCustom}>
      <label htmlFor="user-select">User</label>
      <select
        id="user-select"
        value={KNOWN_USER_IDS.includes(userId) ? userId : ""}
        onChange={(e) => e.target.value && setUserId(Number(e.target.value))}
      >
        {!KNOWN_USER_IDS.includes(userId) && (
          <option value="" disabled>
          #{userId}
          </option>
        )}
        {KNOWN_USER_IDS.map((id) => (
          <option key={id} value={id}>
            #{id}
          </option>
        ))}
      </select>
      <input
        aria-label="Custom user id"
        placeholder="ID"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />
    </form>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            Movie<span>Rec</span>
          </Link>
          <nav>
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/me/ratings">My Ratings</NavLink>
            <NavLink to="/me/recommendations">For You</NavLink>
          </nav>
          <form className="search-form" onSubmit={submitSearch} role="search">
            <input
              aria-label="Search movies"
              placeholder="Search movies by title…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <button className="search-btn" type="submit" aria-label="Search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </form>
          <UserSwitcher />
          {USE_MOCK && (
            <span className="mock-badge" title="VITE_USE_MOCK=true">
              mock data
            </span>
          )}
        </div>
      </header>
      <main className="container">
        <Outlet />
        <p className="footer-note">
          DSC5003 Group Project · Track 1 · MovieRec — frontend by Member D
        </p>
      </main>
    </>
  );
}
