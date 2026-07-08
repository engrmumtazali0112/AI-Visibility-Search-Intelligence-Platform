import type { ContentRecommendation } from "../../types";
import { PriorityBadge } from "../common";

const contentTypeLabels: Record<string, string> = {
  blog_post: "Blog post",
  landing_page: "Landing page",
  faq: "FAQ",
  comparison_page: "Comparison page",
};

export default function RecommendationCard({ rec }: { rec: ContentRecommendation }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="badge bg-primary-light text-primary-dark">
          {contentTypeLabels[rec.content_type] || rec.content_type}
        </span>
        <PriorityBadge priority={rec.priority} />
      </div>

      <p className="font-display text-base font-semibold leading-snug text-ink">{rec.title}</p>
      <p className="text-sm leading-relaxed text-muted">{rec.rationale}</p>

      {rec.target_keywords.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {rec.target_keywords.map((kw) => (
            <span key={kw} className="rounded-md bg-canvas px-2 py-1 text-xs text-ink">
              {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
