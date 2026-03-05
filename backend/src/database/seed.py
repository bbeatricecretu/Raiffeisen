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
import uuid
from pathlib import Path

# Allow running this script directly from any working directory
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.database.database_client import DatabaseClient

# ──────────────────────────────────────────────────────────────────────────────
# Seed data
# ──────────────────────────────────────────────────────────────────────────────

MOCK_USERS = [    {"name": "Maria Ionescu", "email": "maria.ionescu@example.ro"},]


MOCK_TEAMS = [
    {"name": "Tech Entrepreneurs", "created_by": "me", "code": "TECH2024", "image_url": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop"},
    {"name": "Investors Club", "created_by": "me", "code": "INVEST24", "image_url": "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=200&fit=crop"},
]

MOCK_POSTS = [
    {"team_code": "TECH2024", "user_email": "alex.petrescu@email.com", "title": "Welcome all!", "text": "Excited to launch this community! Let's build great things."},
    {"team_code": "INVEST24", "user_email": "alex.petrescu@email.com", "title": "Market Outlook", "text": "Q3 results are looking promising for tech stocks."},
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

    initial_balances = {
        "andrei.pop@example.ro": 12500.50,
        "maria.ionescu@example.ro": 8340.20,
        "alex.petrescu@email.com": 24851.20,
        "soniatestacc11@gmail.com": 10000.00
    }

    # ── 1. Users ──────────────────────────────────────────────────────────
    user_map = {}  # email → id

    for u in MOCK_USERS:
        # Check if user exists
        with db._get_connection() as conn:
            # Handle special 'me' ID case 
            if u.get("id") == "me":
                existing = conn.execute("SELECT * FROM users WHERE id = 'me'").fetchone()
            else:
                existing = conn.execute("SELECT * FROM users WHERE email = ?", (u["email"],)).fetchone()

        if existing:
            uid = existing["id"]
            print(f"     User already exists: {u['name']} ({uid})")
            user_map[u["email"]] = uid
            # Ensure balance is correct if null
            if 'balance' not in existing or existing['balance'] is None:
                 balance = initial_balances.get(u["email"], 2500.0)
                 with db._get_connection() as conn:
                     conn.execute("UPDATE users SET balance = ? WHERE id = ?", (balance, uid))
        else:
            balance = initial_balances.get(u["email"], 2500.0)
            if u.get("id") == "me":
                uid = "me"
                with db._get_connection() as conn:
                    conn.execute(
                        "INSERT INTO users (id, name, email, password, balance, agreed) VALUES (?, ?, ?, ?, ?, 1)",
                        (uid, u["name"], u["email"], "password", balance)
                    )
                print(f"     User manually created: {u['name']} ({uid})")
                user_map[u["email"]] = uid
            else:
                new_u = db.create_user(
                    name=u["name"], 
                    email=u["email"], 
                    password="password",
                    balance=balance,
                    agreed=True
                )
                print(f"     User created: {u['name']} ({new_u['id']})")
                user_map[u["email"]] = new_u['id']

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
            city           = tx.get("location", ""),
            category       = tx.get("category", ""),
            merchant_id    = merchant_id,
        )
        print(f"     Transaction: {tx['merchant_name']:15s} {tx['amount']:8.2f} RON  ({tx['date'][:10]})")

    # ── 4. Teams ────────────────────────────────────────────────────────
    print()
    team_map = {} # code -> id
    
    for team in MOCK_TEAMS:
        # Check if team exists
        existing_team = None
        with db._get_connection() as conn:
            existing_team = conn.execute("SELECT * FROM teams WHERE code = ?", (team["code"],)).fetchone()
            
        if existing_team:
            print(f"     Team exists: {team['name']} ({existing_team['code']})")
            team_map[team["code"]] = existing_team["id"]
        else:
            # Create (with manual code setting to match our mocks)
            creator_id = user_map.get(team.get("user_email")) or "me"
            
            # Use raw sql to force specific code
            team_id = str(uuid.uuid4())
            with db._get_connection() as conn:
                conn.execute(
                    "INSERT INTO teams (id, name, code, image_url, created_by) VALUES (?, ?, ?, ?, ?)",
                    (team_id, team["name"], team["code"], team["image_url"], creator_id)
                )
                conn.execute(
                    "INSERT INTO team_members (user_id, team_id, role) VALUES (?, ?, 'admin')",
                    (creator_id, team_id)
                )
            print(f"     Created team: {team['name']} → {team['code']}")
            team_map[team["code"]] = team_id

    # ── 5. Posts ────────────────────────────────────────────────────────
    print()
    for post in MOCK_POSTS:
        team_id = team_map.get(post["team_code"])
        user_id = user_map.get(post["user_email"]) or "me"
        
        if team_id and user_id:
            # Check if post exists (simple check)
            # Actually create_post generates ID, duplicate checks harder. 
            # Just create it to show content.
            p = db.create_post(team_id, user_id, title=post["title"], text=post["text"])
            print(f"     Post created within {post['team_code']}")

    # ── 6. Summary ────────────────────────────────────────────────________
    health = db.health_check()
    print(f"\n  Seed complete. Row counts: {health['row_counts']}\n")

import uuid


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
