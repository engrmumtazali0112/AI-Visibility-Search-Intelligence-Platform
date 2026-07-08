from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.models import BusinessProfile, ContentRecommendation, DiscoveredQuery, PipelineRun
from app.services.pipeline import PipelineOrchestrator
from app.utils.errors import APIError

profiles_bp = Blueprint("profiles", __name__, url_prefix="/api/v1/profiles")

REQUIRED_FIELDS = ["name", "domain", "industry"]


@profiles_bp.post("")
def create_profile():
    body = request.get_json(silent=True) or {}

    missing = [f for f in REQUIRED_FIELDS if not body.get(f)]
    if missing:
        raise APIError(
            "Missing required fields", status_code=422, details={"missing_fields": missing}
        )

    competitors = body.get("competitors") or []
    if not isinstance(competitors, list):
        raise APIError("'competitors' must be a list of strings", status_code=422)

    profile = BusinessProfile(
        name=body["name"],
        domain=body["domain"],
        industry=body["industry"],
        description=body.get("description"),
        competitors=[str(c) for c in competitors],
        status="created",
    )
    db.session.add(profile)
    db.session.commit()

    return jsonify(profile.to_dict()), 201


@profiles_bp.get("")
def list_profiles():
    profiles = BusinessProfile.query.order_by(BusinessProfile.created_at.desc()).all()
    return jsonify({"profiles": [p.to_dict_with_stats() for p in profiles]})


@profiles_bp.get("/<profile_uuid>")
def get_profile(profile_uuid: str):
    profile = _get_profile_or_404(profile_uuid)
    return jsonify(profile.to_dict_with_stats())


@profiles_bp.post("/<profile_uuid>/run")
def run_pipeline(profile_uuid: str):
    profile = _get_profile_or_404(profile_uuid)

    orchestrator = PipelineOrchestrator()
    run = orchestrator.run(profile)

    top_queries = (
        DiscoveredQuery.query.filter_by(run_uuid=run.uuid)
        .order_by(DiscoveredQuery.opportunity_score.desc())
        .limit(3)
        .all()
    )
    recommendations = ContentRecommendation.query.filter_by(run_uuid=run.uuid).all()

    status_code = 200 if run.status in ("completed", "partial") else 502

    return jsonify({
        **run.to_dict(),
        "top_opportunity_queries": [q.to_dict() for q in top_queries],
        "recommendations": [r.to_dict() for r in recommendations],
    }), status_code


@profiles_bp.get("/<profile_uuid>/runs")
def list_runs(profile_uuid: str):
    _get_profile_or_404(profile_uuid)
    runs = (
        PipelineRun.query.filter_by(profile_uuid=profile_uuid)
        .order_by(PipelineRun.started_at.desc())
        .all()
    )
    return jsonify({"runs": [r.to_dict() for r in runs]})


@profiles_bp.get("/<profile_uuid>/queries")
def get_queries(profile_uuid: str):
    _get_profile_or_404(profile_uuid)

    query = DiscoveredQuery.query.filter_by(profile_uuid=profile_uuid)

    min_score = request.args.get("min_score", type=float)
    if min_score is not None:
        query = query.filter(DiscoveredQuery.opportunity_score >= min_score)

    status = request.args.get("status")
    if status:
        if status not in ("visible", "not_visible", "unknown"):
            raise APIError("Invalid 'status' filter", status_code=422,
                            details={"allowed": ["visible", "not_visible", "unknown"]})
        query = query.filter(DiscoveredQuery.visibility_status == status)

    query = query.order_by(DiscoveredQuery.opportunity_score.desc())

    page = request.args.get("page", default=1, type=int)
    per_page = request.args.get("per_page", default=20, type=int)
    page = max(page, 1)
    per_page = min(max(per_page, 1), 100)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "queries": [q.to_dict() for q in pagination.items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total_items": pagination.total,
            "total_pages": pagination.pages,
        },
    })


@profiles_bp.get("/<profile_uuid>/recommendations")
def get_recommendations(profile_uuid: str):
    _get_profile_or_404(profile_uuid)
    recs = (
        ContentRecommendation.query.filter_by(profile_uuid=profile_uuid)
        .order_by(ContentRecommendation.created_at.desc())
        .all()
    )
    return jsonify({"recommendations": [r.to_dict() for r in recs]})


def _get_profile_or_404(profile_uuid: str) -> BusinessProfile:
    profile = db.session.get(BusinessProfile, profile_uuid)
    if profile is None:
        raise APIError("Profile not found", status_code=404)
    return profile
