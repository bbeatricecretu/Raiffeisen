"""
seed.py
=======
Populate the database with realistic mock data for local development.

Run from the project root:
    python src/database/seed.py

This script is SAFE to re-run — it checks for existing data first.
After seeding, you can immediately test ai_service.py against real rows.
"""

import sys
from pathlib import Path

# Allow running this script directly from any working directory
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.database.database_client import DatabaseClient

# ──────────────────────────────────────────────────────────────────────────────
# Seed data
# ──────────────────────────────────────────────────────────────────────────────

MOCK_USERS = [
    {"name": "Andrei Pop",    "email": "andrei.pop@example.ro"},
    {"name": "Maria Ionescu", "email": "maria.ionescu@example.ro"},
]

# Pre-normalized merchants (as if AIService.normalize_merchant() already ran)
MOCK_MERCHANTS = [
    {"canonical_name": "Kaufland",    "brand": "Kaufland",    "merchant_type": "retail",        "confidence": 0.97},
    {"canonical_name": "Starbucks",   "brand": "Starbucks",   "merchant_type": "food",          "confidence": 0.99},
    {"canonical_name": "Rompetrol",   "brand": "Rompetrol",   "merchant_type": "gas",           "confidence": 0.95},
    {"canonical_name": "Netflix",     "brand": "Netflix",     "merchant_type": "entertainment", "confidence": 0.99},
    {"canonical_name": "Mega Image",  "brand": "Mega Image",  "merchant_type": "retail",        "confidence": 0.93},
    {"canonical_name": "Glovo",       "brand": "Glovo",       "merchant_type": "food",          "confidence": 0.96},
    {"canonical_name": "eMag",        "brand": "eMag",        "merchant_type": "retail",        "confidence": 0.98},
    {"canonical_name": "Farmacia Tei","brand": "Farmacia Tei","merchant_type": "service",       "confidence": 0.91},
]

# Transactions per user (raw_pos_string simulates real POS terminal output)
MOCK_TRANSACTIONS = [
    # ── Andrei Pop ────────────────────────────────────────────────────────
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Kaufland",
        "amount":          134.50,
        "currency":        "RON",
        "location":        "Cluj-Napoca",
        "date":            "2024-03-15T10:30:00",
        "category":        "retail",
        "raw_pos_string":  "KAUFLAND*7638273 CLUJ",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Starbucks",
        "amount":          22.00,
        "currency":        "RON",
        "location":        "Cluj-Napoca",
        "date":            "2024-03-15T08:15:00",
        "category":        "food",
        "raw_pos_string":  "STARBUCKS CLUJ CENTRU",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Rompetrol",
        "amount":          300.00,
        "currency":        "RON",
        "location":        "Cluj-Napoca",
        "date":            "2024-03-14T17:45:00",
        "category":        "gas",
        "raw_pos_string":  "ROMPETROL 1234 CLUJ",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Netflix",
        "amount":          44.99,
        "currency":        "RON",
        "location":        "",
        "date":            "2024-03-01T00:00:00",
        "category":        "entertainment",
        "raw_pos_string":  "PAYPAL *NETFLIX",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Starbucks",
        "amount":          18.50,
        "currency":        "RON",
        "location":        "Cluj-Napoca",
        "date":            "2024-03-13T09:00:00",
        "category":        "food",
        "raw_pos_string":  "STARBUCKS CLUJ CENTRU",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Glovo",
        "amount":          87.30,
        "currency":        "RON",
        "location":        "Cluj-Napoca",
        "date":            "2024-03-12T20:10:00",
        "category":        "food",
        "raw_pos_string":  "GLOVO*ORDER 9921 RO",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Kaufland",
        "amount":          210.80,
        "currency":        "RON",
        "location":        "Cluj-Napoca",
        "date":            "2024-03-10T11:00:00",
        "category":        "retail",
        "raw_pos_string":  "KAUFLAND*7638273 CLUJ",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "eMag",
        "amount":          549.99,
        "currency":        "RON",
        "location":        "Online",
        "date":            "2024-03-08T14:22:00",
        "category":        "retail",
        "raw_pos_string":  "EMAG.RO *ONLINE",
    },
    {
        "user_email":      "andrei.pop@example.ro",
        "merchant_name":   "Starbucks",
        "amount":          25.00,
        "currency":        "RON",
        "location":        "București",
        "date":            "2024-03-05T07:50:00",
        "category":        "food",
        "raw_pos_string":  "STARBUCKS BUCH OTOPENI",
    },
    # ── Maria Ionescu ─────────────────────────────────────────────────────
    {
        "user_email":      "maria.ionescu@example.ro",
        "merchant_name":   "Mega Image",
        "amount":          67.40,
        "currency":        "RON",
        "location":        "București",
        "date":            "2024-03-15T19:00:00",
        "category":        "retail",
        "raw_pos_string":  "MEGA IMAGE S1 BUCH",
    },
    {
        "user_email":      "maria.ionescu@example.ro",
        "merchant_name":   "Farmacia Tei",
        "amount":          43.20,
        "currency":        "RON",
        "location":        "București",
        "date":            "2024-03-14T12:30:00",
        "category":        "service",
        "raw_pos_string":  "FARMACIA TEI*288 BUC",
    },
    {
        "user_email":      "maria.ionescu@example.ro",
        "merchant_name":   "Netflix",
        "amount":          44.99,
        "currency":        "RON",
        "location":        "",
        "date":            "2024-03-01T00:00:00",
        "category":        "entertainment",
        "raw_pos_string":  "PAYPAL *NETFLIX",
    },
    {
        "user_email":      "maria.ionescu@example.ro",
        "merchant_name":   "Glovo",
        "amount":          112.00,
        "currency":        "RON",
        "location":        "București",
        "date":            "2024-03-11T21:05:00",
        "category":        "food",
        "raw_pos_string":  "GLOVO*ORDER 8837 RO",
    },
]


# ──────────────────────────────────────────────────────────────────────────────
# Seed runner
# ──────────────────────────────────────────────────────────────────────────────

def seed(db: DatabaseClient) -> None:
    print("🌱  Starting database seed...\n")

    # ── 1. Users ──────────────────────────────────────────────────────────
    user_map: dict[str, str] = {}  # email → id

    for u in MOCK_USERS:
        existing = db.get_user_by_email(u["email"])
        if existing:
            print(f"     User already exists: {u['email']}")
            user_map[u["email"]] = existing["id"]
        else:
            created = db.create_user(u["name"], u["email"])
            user_map[u["email"]] = created["id"]
            print(f"     Created user: {u['name']} → {created['id']}")

    # ── 2. Merchants ──────────────────────────────────────────────────────
    merchant_map: dict[str, str] = {}  # canonical_name → id

    for m in MOCK_MERCHANTS:
        result = db.upsert_merchant(m)
        merchant_map[m["canonical_name"]] = result["id"]
        print(f"     Merchant ready: {m['canonical_name']} → {result['id']}")

    # ── 3. Transactions ───────────────────────────────────────────────────
    print()
    for tx in MOCK_TRANSACTIONS:
        user_id     = user_map[tx["user_email"]]
        merchant_id = merchant_map.get(tx["merchant_name"])

        inserted = db.insert_transaction(
            user_id        = user_id,
            merchant_name  = tx["merchant_name"],
            amount         = tx["amount"],
            date           = tx["date"],
            raw_pos_string = tx["raw_pos_string"],
            currency       = tx.get("currency", "RON"),
            location       = tx.get("location", ""),
            category       = tx.get("category", ""),
            merchant_id    = merchant_id,
        )
        print(f"     Transaction: {tx['merchant_name']:15s} {tx['amount']:8.2f} RON  ({tx['date'][:10]})")

    # ── 4. Summary ────────────────────────────────────────────────────────
    health = db.health_check()
    print(f"\n  Seed complete. Row counts: {health['row_counts']}\n")


# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    db = DatabaseClient()

    # Monkey-patch a helper not in the main client (keep client lean)
    def _get_user_by_email(self, email: str):
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ?", (email,)
            ).fetchone()
        return dict(row) if row else None

    import types
    db.get_user_by_email = types.MethodType(_get_user_by_email, db)

    seed(db)
