import os

from dotenv import load_dotenv

load_dotenv()

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402

app = create_app()


@app.cli.command("seed")
def seed():
    """Optional: create tables for quick local testing without migrations."""
    with app.app_context():
        db.create_all()
    print("Database tables created.")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=app.config.get("DEBUG", False))
