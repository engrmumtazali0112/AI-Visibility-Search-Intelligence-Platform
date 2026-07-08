from __future__ import annotations

from datetime import datetime, timezone

from flask import Blueprint, jsonify

from app.agents import AgentError, VisibilityScoringAgent
from app.extensions import db
from app.models import BusinessProfile, DiscoveredQuery
from app.utils.errors import APIError

queries_bp = Blueprint("queries", __name__, url_prefix="/api/v1/queries")


@queries_bp.post("/<query_uuid>/recheck")
def recheck_query(query_uuid: str):
    query_row = db.session.get(DiscoveredQuery, query_uuid)
    if query_row is None:
        raise APIError("Query not found", status_code=404)

    profile = db.session.get(BusinessProfile, query_row.profile_uuid)
    if profile is None:
        raise APIError("Associated profile not found", status_code=404)

    agent = VisibilityScoringAgent()
    try:
        result = agent.run(query_row.query_text, profile.to_dict())
    except AgentError as exc:
        raise APIError(f"Recheck failed: {exc.message}", status_code=502)

    query_row.estimated_search_volume = result["estimated_search_volume"]
    query_row.competitive_difficulty = result["competitive_difficulty"]
    query_row.opportunity_score = result["opportunity_score"]
    query_row.domain_visible = result["domain_visible"]
    query_row.visibility_position = result["visibility_position"]
    query_row.visibility_status = result["visibility_status"]
    query_row.last_checked_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify(query_row.to_dict())
