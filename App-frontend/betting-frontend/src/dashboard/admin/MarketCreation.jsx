// src/admin/MarketCreation.jsx
import React, { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const CATEGORY_OPTIONS = [
  "SPORTS",
  "POLITICS",
  "FINANCE",
  "ENTERTAINMENT",
  "TECHNOLOGY",
  "OTHER",
];

export default function MarketCreation({ onMarketCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SPORTS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resolutionSource, setResolutionSource] = useState("");
  const [outcomes, setOutcomes] = useState(["Yes", "No"]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleOutcomeChange = (index, value) => {
    const updated = [...outcomes];
    updated[index] = value;
    setOutcomes(updated);
  };

  const handleAddOutcome = () => {
    setOutcomes((prev) => [...prev, ""]);
  };

  const handleRemoveOutcome = (index) => {
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("SPORTS");
    setStartDate("");
    setEndDate("");
    setResolutionSource("");
    setOutcomes(["Yes", "No"]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Basic client-side validation (backend also validates)
    if (!title.trim()) {
      setErrorMessage("Title is required.");
      return;
    }
    if (!resolutionSource.trim()) {
      setErrorMessage("Resolution source is required.");
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage("Start and end dates are required.");
      return;
    }
    const cleanedOutcomes = outcomes.map((o) => o.trim()).filter(Boolean);
    if (cleanedOutcomes.length < 2) {
      setErrorMessage("At least two non-empty outcomes are required.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,                         // enum string: "SPORTS", etc.
      startDate,                        // "YYYY-MM-DDTHH:mm"
      endDate,
      resolutionSource: resolutionSource.trim(),
      outcomes: cleanedOutcomes,
    };

    try {
      setIsSubmitting(true);

      const res = await fetch(`${API_BASE_URL}/api/admin/markets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If you use Authorization header instead of cookies, add it here
          // "Authorization": `Bearer ${token}`,
        },
        credentials: "include", // send cookies/JWT if using httpOnly cookie auth
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data = await res.json();
      setSuccessMessage(`Market "${data.title}" created successfully.`);
      resetForm();

      // Notify parent component and switch to manage tab
      if (onMarketCreated) {
        setTimeout(() => {
          onMarketCreated();
        }, 1500); // Give user time to see success message
      }
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to create market.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-slate-50">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-50 mb-1">
          Create New Market
        </h2>
        <p className="text-sm text-slate-400">
          Configure a new market with outcomes, dates, and resolution
          criteria. This will appear on the user-facing Markets page.
        </p>
      </div>

        {/* Status messages */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/40"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Market Title
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder='e.g. "Will the Raptors win their next game?"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Description (optional)
            </label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              rows={3}
              placeholder="Add any extra context for this market..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category + Dates */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Category
              </label>
              <select
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0) + opt.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Resolution Source */}
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              Resolution Source
            </label>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder='e.g. "NBA official box score", "Elections Canada results"'
              value={resolutionSource}
              onChange={(e) => setResolutionSource(e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-500">
              This explains how Pryzm will objectively resolve the market.
            </p>
          </div>

          {/* Outcomes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-200">
                Outcomes
              </label>
              <button
                type="button"
                onClick={handleAddOutcome}
                className="text-xs rounded-lg border border-violet-600 bg-violet-600/10 px-2 py-1 font-medium text-violet-200 hover:bg-violet-600/20 transition"
              >
                + Add Outcome
              </button>
            </div>
            <div className="space-y-2">
              {outcomes.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    placeholder={
                      index === 0
                        ? "Yes"
                        : index === 1
                        ? "No"
                        : `Outcome ${index + 1}`
                    }
                    value={value}
                    onChange={(e) =>
                      handleOutcomeChange(index, e.target.value)
                    }
                  />
                  {outcomes.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOutcome(index)}
                      className="rounded-lg border border-red-500/60 bg-red-500/10 px-2 py-1 text-xs text-red-200 hover:bg-red-500/20 transition"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              You must define at least two outcomes (e.g., Yes/No or multiple
              candidates).
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 transition"
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-violet-500 to-sky-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-violet-500/40 disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create Market"}
            </button>
          </div>
        </form>
      </div>
  );
}
