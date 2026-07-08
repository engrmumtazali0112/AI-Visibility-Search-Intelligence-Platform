from flask import jsonify


class APIError(Exception):
    """Raised anywhere in the app to produce a consistent JSON error response."""

    def __init__(self, message: str, status_code: int = 400, details: dict | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> dict:
        return {
            "error": {
                "message": self.message,
                "status_code": self.status_code,
                "details": self.details,
            }
        }


def register_error_handlers(app):
    @app.errorhandler(APIError)
    def handle_api_error(err: APIError):
        response = jsonify(err.to_dict())
        response.status_code = err.status_code
        return response

    @app.errorhandler(404)
    def handle_404(err):
        return jsonify({
            "error": {"message": "Resource not found", "status_code": 404, "details": {}}
        }), 404

    @app.errorhandler(405)
    def handle_405(err):
        return jsonify({
            "error": {"message": "Method not allowed", "status_code": 405, "details": {}}
        }), 405

    @app.errorhandler(500)
    def handle_500(err):
        return jsonify({
            "error": {"message": "Internal server error", "status_code": 500, "details": {}}
        }), 500
