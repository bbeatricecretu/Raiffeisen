#!/usr/bin/env bash
# Startup script for Railway / Render / any Linux host.
# Seeds the database on first boot, then starts the API server.
set -e

cd "$(dirname "$0")"

# Seed if the database does not yet contain data
python - <<'EOF'
import sqlite3, os, sys
db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "raiffeisen.db")
if not os.path.exists(db):
    print("Database not found — seeding…")
    sys.exit(1)
try:
    conn = sqlite3.connect(db)
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    if count == 0:
        print("Database empty — seeding…")
        sys.exit(1)
    print(f"Database already has {count} user(s). Skipping seed.")
except Exception:
    print("Database needs seeding…")
    sys.exit(1)
EOF

SEED_NEEDED=$?
if [ "$SEED_NEEDED" -ne "0" ]; then
    python src/database/seed_rich.py
fi

exec uvicorn src.main:app --host 0.0.0.0 --port "${PORT:-8000}"
