// src/admin/MarketCreation.jsx
import { useState } from "react";
import { Field, Notice, btnPrimary, btnSecondary, btnSmall, inputCls, textareaCls } from "../../components/ui.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.pryzm.ca" : "http://localhost:8080");

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

      const res = await fetch(`${API_BASE_URL}/api/v1/admin/markets`, {
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

      setErrorMessage(err.message || "Failed to create market.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-[760px]">
      <div>
        <h2 className="m-0 text-[17px] font-[620] tracking-[-0.02em]">New market</h2>
        <p className="m-0 mt-1 text-[13.5px] text-mu">
          Configure outcomes, dates and resolution criteria. The market appears on the Markets page once it starts.
        </p>
      </div>

      {successMessage && <Notice kind="ok">{successMessage}</Notice>}
      {errorMessage && <Notice kind="err">{errorMessage}</Notice>}

      <Field label="Market title" htmlFor="mc-title">
        <input
          id="mc-title"
          type="text"
          className={inputCls}
          placeholder='e.g. "Will the Raptors win their next game?"'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field label="Description (optional)" htmlFor="mc-desc">
        <textarea
          id="mc-desc"
          className={textareaCls}
          rows={3}
          placeholder="Add any extra context for this market…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Category" htmlFor="mc-cat">
          <select id="mc-cat" className={`${inputCls} cursor-pointer`} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt.charAt(0) + opt.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </Field>
        <Field label="Starts" htmlFor="mc-start">
          <input id="mc-start" type="datetime-local" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Closes" htmlFor="mc-end">
          <input id="mc-end" type="datetime-local" className={inputCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Resolution source" htmlFor="mc-src" hint="How Pryzm will objectively resolve the market.">
        <input
          id="mc-src"
          type="text"
          className={inputCls}
          placeholder='e.g. "NBA official box score", "Elections Canada results"'
          value={resolutionSource}
          onChange={(e) => setResolutionSource(e.target.value)}
        />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-[7px]">
          <span className="text-[13px] text-tx2 font-medium">Outcomes</span>
          <button type="button" onClick={handleAddOutcome} className={`${btnSecondary} ${btnSmall}`}>+ Add outcome</button>
        </div>
        <div className="flex flex-col gap-2">
          {outcomes.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                className={inputCls}
                placeholder={index === 0 ? "Yes" : index === 1 ? "No" : `Outcome ${index + 1}`}
                value={value}
                onChange={(e) => handleOutcomeChange(index, e.target.value)}
              />
              {outcomes.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOutcome(index)}
                  className="h-[46px] px-3.5 rounded-[11px] border-0 bg-nos text-no text-[13.5px] font-semibold cursor-pointer flex-none"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1.5 text-[12.5px] text-mu">At least two outcomes (e.g. Yes / No, or several candidates).</p>
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" onClick={resetForm} className={btnSecondary} disabled={isSubmitting}>Reset</button>
        <button type="submit" disabled={isSubmitting} className={btnPrimary}>
          {isSubmitting ? "Creating…" : "Create market"}
        </button>
      </div>
    </form>
  );
}
