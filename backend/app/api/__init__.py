from app.api.profiles import profiles_bp
from app.api.queries import queries_bp


def register_blueprints(app):
    app.register_blueprint(profiles_bp)
    app.register_blueprint(queries_bp)
