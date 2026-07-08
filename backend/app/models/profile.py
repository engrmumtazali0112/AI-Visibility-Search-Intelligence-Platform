import uuid
from datetime import datetime, timezone

from app.extensions import db


def gen_uuid() -> str:
    return str(uuid.uuid4())


class BusinessProfile(db.Model):
    __tablename__ = "business_profiles"

    uuid = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    name = db.Column(db.String(255), nullable=False)
    domain = db.Column(db.String(255), nullable=False, index=True)
    industry = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    competitors = db.Column(db.JSON, nullable=False, default=list)
    status = db.Column(db.String(32), nullable=False, default="created")

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    pipeline_runs = db.relationship(
        "PipelineRun", backref="profile", lazy="dynamic", cascade="all, delete-orphan"
    )
    queries = db.relationship(
        "DiscoveredQuery", backref="profile", lazy="dynamic", cascade="all, delete-orphan"
    )
    recommendations = db.relationship(
        "ContentRecommendation", backref="profile", lazy="dynamic", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "profile_uuid": self.uuid,
            "name": self.name,
            "domain": self.domain,
            "industry": self.industry,
            "description": self.description,
            "competitors": self.competitors,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def to_dict_with_stats(self) -> dict:
        data = self.to_dict()
        query_count = self.queries.count()
        avg_score = db.session.query(db.func.avg(DiscoveredQuery.opportunity_score)).filter(
            DiscoveredQuery.profile_uuid == self.uuid
        ).scalar()
        last_run = self.pipeline_runs.order_by(PipelineRun.started_at.desc()).first()
        data["stats"] = {
            "total_queries": query_count,
            "avg_opportunity_score": round(avg_score, 3) if avg_score is not None else None,
            "last_run_status": last_run.status if last_run else None,
            "last_run_at": last_run.started_at.isoformat() if last_run else None,
        }
        return data


# Imported at bottom to avoid circular import issues while keeping relationship queries typed.
from app.models.query import DiscoveredQuery  # noqa: E402
from app.models.pipeline_run import PipelineRun  # noqa: E402
