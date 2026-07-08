import logging
import os

from flask import Flask, jsonify

from app.api import register_blueprints
from app.config import config_by_name
from app.extensions import cors, db, migrate
from app.utils.errors import register_error_handlers


def create_app(config_name: str | None = None) -> Flask:
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name.get(config_name, config_by_name["development"]))

    logging.basicConfig(level=logging.INFO)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}})

    register_error_handlers(app)
    register_blueprints(app)

    # Import models so Flask-Migrate can detect them.
    from app import models  # noqa: F401

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    return app
