import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../services/api";

export default function CreateProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [competitorInput, setCompetitorInput] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function addCompetitor() {
    const value = competitorInput.trim();
    if (value && !competitors.includes(value)) {
      setCompetitors([...competitors, value]);
    }
    setCompetitorInput("");
  }

  function removeCompetitor(value: string) {
    setCompetitors(competitors.filter((c) => c !== value));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Business name is required";
    if (!domain.trim()) errs.domain = "Domain is required";
    else if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain.trim())) errs.domain = "Enter a valid domain, e.g. example.com";
    if (!industry.trim()) errs.industry = "Industry is required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const profile = await api.createProfile({
        name: name.trim(),
        domain: domain.trim(),
        industry: industry.trim(),
        description: description.trim() || undefined,
        competitors,
      });
      navigate(`/profiles/${profile.profile_uuid}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-2xl font-bold text-ink">Register a business profile</h1>
      <p className="mt-1 text-sm text-muted">
        This is the entry point for the pipeline — once created, you can run query discovery,
        visibility scoring, and content recommendations against it.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 flex flex-col gap-5 p-6">
        <div>
          <label className="label" htmlFor="name">Business name</label>
          <input
            id="name"
            className="input"
            placeholder="Frase"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErrors.name && <p className="mt-1 text-xs text-bad">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="domain">Domain</label>
          <input
            id="domain"
            className="input"
            placeholder="frase.io"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          {fieldErrors.domain && <p className="mt-1 text-xs text-bad">{fieldErrors.domain}</p>}
        </div>

        <div>
          <label className="label" htmlFor="industry">Industry</label>
          <input
            id="industry"
            className="input"
            placeholder="SEO Content Tools"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          />
          {fieldErrors.industry && <p className="mt-1 text-xs text-bad">{fieldErrors.industry}</p>}
        </div>

        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="input min-h-[88px] resize-none"
            placeholder="AI-powered content briefs and SEO research"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="competitors">Competitors</label>
          <div className="flex gap-2">
            <input
              id="competitors"
              className="input"
              placeholder="surferseo.com"
              value={competitorInput}
              onChange={(e) => setCompetitorInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCompetitor();
                }
              }}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={addCompetitor}>
              Add
            </button>
          </div>
          {competitors.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {competitors.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCompetitor(c)}
                    className="text-primary-dark/60 hover:text-primary-dark"
                    aria-label={`Remove ${c}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm font-medium text-bad">{error}</p>}

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Creating…" : "Create profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
