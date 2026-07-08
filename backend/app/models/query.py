from datetime import datetime, timezone

from app.extensions import db
from app.models.profile import gen_uuid


class DiscoveredQuery(db.Model):
    __tablename__ = "discovered_queries"

    uuid = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    profile_uuid = db.Column(
        db.String(36), db.ForeignKey("business_profiles.uuid"), nullable=False, index=True
    )
    run_uuid = db.Column(
        db.String(36), db.ForeignKey("pipeline_runs.uuid"), nullable=True, index=True
    )

    query_text = db.Column(db.Text, nullable=False)
    intent = db.Column(db.String(32), nullable=True)  # comparison | best_of | informational | transactional

    estimated_search_volume = db.Column(db.Integer, default=0)
    competitive_difficulty = db.Column(db.Integer, default=50)  # 0-100
    opportunity_score = db.Column(db.Float, default=0.0, index=True)  # 0.0-1.0

    domain_visible = db.Column(db.Boolean, default=False)
    visibility_position = db.Column(db.Integer, nullable=True)
    visibility_status = db.Column(db.String(16), default="unknown")  # visible | not_visible | unknown

    discovered_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_checked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    recommendations = db.relationship(
        "ContentRecommendation", backref="source_query", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "query_uuid": self.uuid,
            "profile_uuid": self.profile_uuid,
            "run_uuid": self.run_uuid,
            "query_text": self.query_text,
            "intent": self.intent,
            "estimated_search_volume": self.estimated_search_volume,
            "competitive_difficulty": self.competitive_difficulty,
            "opportunity_score": round(self.opportunity_score, 3) if self.opportunity_score is not None else 0.0,
            "domain_visible": self.domain_visible,
            "visibility_position": self.visibility_position,
            "visibility_status": self.visibility_status,
            "discovered_at": self.discovered_at.isoformat() if self.discovered_at else None,
            "last_checked_at": self.last_checked_at.isoformat() if self.last_checked_at else None,
        }
