import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import API from "../api";
function Stars({ value, onChange }) {
  return (
    <div className="ty-stars" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={`ty-star ${value >= n ? "active" : ""}`}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ThankYou() {
  const navigate = useNavigate();

  const [ratings, setRatings] = useState({
    foodQuality: 0,
    ambience: 0,
    overall: 0,
  });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const setRating = (key, val) => setRatings((r) => ({ ...r, [key]: val }));

  const logoutAndGoLogin = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const onSkip = () => logoutAndGoLogin();

  const onSubmit = async () => {
    const { foodQuality, ambience, overall } = ratings;
    if (!foodQuality || !ambience || !overall) {
      setMsg("Please rate all questions before submitting.");
      return;
    }
    try {
      setSubmitting(true);
 const res = await API.post("/feedbacks", {
 ratings,
  comment: comment.trim() || undefined,
 });
if (!res?.data?.ok) throw new Error("Failed to save feedback");
      logoutAndGoLogin();
    } catch (e) {
      setMsg(e.message || "Could not save feedback.");
      setSubmitting(false);
    }
  };

  return (
    <main className="ty-shell">
      <div className="ty-card">
        <header className="ty-header">
          <h1>Thank you for dining with SmartDine! 🍽️</h1>
          <p className="ty-muted">We value your feedback to improve our service.</p>
        </header>

        <section className="ty-question-group">
          <div className="ty-question">
            <h2>How was the Food Quality?</h2>
            <Stars value={ratings.foodQuality} onChange={(v) => setRating("foodQuality", v)} />
          </div>

          <div className="ty-question">
            <h2>How was the Ambience?</h2>
            <Stars value={ratings.ambience} onChange={(v) => setRating("ambience", v)} />
          </div>

          <div className="ty-question">
            <h2>Overall Experience</h2>
            <Stars value={ratings.overall} onChange={(v) => setRating("overall", v)} />
          </div>
        </section>

        <section className="ty-comment">
          <label htmlFor="ty-comment">Any comments? (optional)</label>
          <textarea
            id="ty-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts..."
          />
        </section>

        <div className="ty-actions">
          <button className="btn ghost" onClick={onSkip} disabled={submitting}>
            Skip
          </button>
          <button className="btn primary" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        {msg && <p className="ty-msg">{msg}</p>}

        <p className="ty-legal">Your feedback helps us serve you better ❤️</p>
      </div>
    </main>
  );
}
