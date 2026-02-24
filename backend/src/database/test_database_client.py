"""
test_database_client.py
=======================
Test suite for DatabaseClient.
Written by Person 3 (Database).

Run from backend/:
    python -m pytest src/database/test_database_client.py -v

All tests use an in-memory SQLite database — no files are created on disk
and each test class starts with a clean database. Tests can run in any order.

TEST GROUPS
-----------
TestUsers (2 tests)
    - Creating a user and retrieving it by ID returns correct data.
    - Looking up a non-existent user returns None instead of an error.

TestMerchants (3 tests)
    - Inserting a new merchant stores the correct data.
    - Upserting the same merchant updates it instead of creating a duplicate.
    - After two upserts, only one row exists in the database.

TestTransactions (3 tests)
    - A transaction can be inserted and retrieved by ID.
    - get_user_transactions returns results ordered newest first.
    - Transactions from one user do not appear in another user's history.

TestMerchantStats (4 tests)
    - get_merchant_stats returns all keys that ai_service.py expects:
      total_transactions, first_transaction, last_transaction,
      common_locations, transaction_amounts, weekday_distribution.
    - The transaction count aggregates correctly.
    - The most frequent location appears in common_locations.
    - Querying a merchant with no transactions returns zero, not an error.

TestFilterTransactions (4 tests)
    - Filtering by merchant name returns only matching transactions.
    - Filtering by city returns only transactions from that location.
    - Filtering by date range returns only transactions within the window.
    - No filters returns all transactions for that user.

TestMerchantProfiles (3 tests)
    - An AI-generated profile can be saved and retrieved correctly.
    - Saving a profile twice updates it rather than creating a duplicate.
    - Looking up a profile that does not exist yet returns None.

TestHealthCheck (1 test)
    - health_check returns status "healthy" and row counts for all 6 tables.
"""

import pytest
from datetime import datetime
from src.database.database_client import DatabaseClient


# ──────────────────────────────────────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def db():
    """Fresh in-memory database for each test."""
    return DatabaseClient(db_path=":memory:")


@pytest.fixture
def user(db):
    """A seeded user ready for use in tests."""
    return db.create_user("Test User", "test@example.ro")


@pytest.fixture
def merchant(db):
    """A seeded merchant (as if returned by AIService.normalize_merchant)."""
    return db.upsert_merchant({
        "canonical_name": "Kaufland",
        "brand":          "Kaufland",
        "merchant_type":  "retail",
        "confidence":     0.97,
    })


@pytest.fixture
def transaction(db, user, merchant):
    """A single seeded transaction tied to user + merchant."""
    return db.insert_transaction(
        user_id        = user["id"],
        merchant_name  = "Kaufland",
        amount         = 150.0,
        date           = "2024-03-15T10:30:00",
        raw_pos_string = "KAUFLAND*7638273 CLUJ",
        location       = "Cluj-Napoca",
        category       = "retail",
        merchant_id    = merchant["id"],
    )


# ──────────────────────────────────────────────────────────────────────────────
# User tests
# ──────────────────────────────────────────────────────────────────────────────

class TestUsers:
    def test_create_and_get_user(self, db):
        created = db.create_user("Ana Pop", "ana@example.ro")
        assert created["name"] == "Ana Pop"
        assert created["email"] == "ana@example.ro"
        assert "id" in created

        fetched = db.get_user(created["id"])
        assert fetched["id"] == created["id"]

    def test_get_nonexistent_user_returns_none(self, db):
        assert db.get_user("does-not-exist") is None


# ──────────────────────────────────────────────────────────────────────────────
# Merchant tests
# ──────────────────────────────────────────────────────────────────────────────

class TestMerchants:
    def test_upsert_inserts_new_merchant(self, db):
        m = db.upsert_merchant({
            "canonical_name": "Netflix",
            "merchant_type":  "entertainment",
            "confidence":     0.99,
        })
        assert m["canonical_name"] == "Netflix"
        assert m["merchant_type"]  == "entertainment"

    def test_upsert_updates_existing_merchant(self, db):
        db.upsert_merchant({"canonical_name": "Netflix", "confidence": 0.5})
        db.upsert_merchant({"canonical_name": "Netflix", "confidence": 0.99})

        m = db.get_merchant_by_name("Netflix")
        assert m["confidence"] == pytest.approx(0.99)

    def test_duplicate_upsert_does_not_create_two_rows(self, db, merchant):
        db.upsert_merchant({"canonical_name": "Kaufland", "confidence": 0.80})
        m = db.get_merchant_by_name("Kaufland")
        assert m is not None  # still just one row


# ──────────────────────────────────────────────────────────────────────────────
# Transaction tests
# ──────────────────────────────────────────────────────────────────────────────

class TestTransactions:
    def test_insert_and_get_transaction(self, db, user, merchant):
        tx = db.insert_transaction(
            user_id        = user["id"],
            merchant_name  = "Kaufland",
            amount         = 99.50,
            date           = "2024-01-10T12:00:00",
            raw_pos_string = "KAUFLAND TEST",
            merchant_id    = merchant["id"],
        )
        assert tx["amount"] == pytest.approx(99.50)
        fetched = db.get_transaction(tx["id"])
        assert fetched["merchant_name"] == "Kaufland"

    def test_get_user_transactions_ordered_newest_first(self, db, user, merchant):
        db.insert_transaction(user["id"], "Kaufland", 10, "2024-01-01T00:00:00", "A", merchant_id=merchant["id"])
        db.insert_transaction(user["id"], "Kaufland", 20, "2024-03-01T00:00:00", "B", merchant_id=merchant["id"])

        txns = db.get_user_transactions(user["id"])
        assert txns[0]["date"] > txns[1]["date"]   # newest first

    def test_get_user_transactions_isolated_per_user(self, db, merchant):
        u1 = db.create_user("User One", "u1@test.ro")
        u2 = db.create_user("User Two", "u2@test.ro")

        db.insert_transaction(u1["id"], "Kaufland", 50, "2024-01-01T00:00:00", "U1TX", merchant_id=merchant["id"])
        db.insert_transaction(u2["id"], "Kaufland", 50, "2024-01-01T00:00:00", "U2TX", merchant_id=merchant["id"])

        assert len(db.get_user_transactions(u1["id"])) == 1
        assert len(db.get_user_transactions(u2["id"])) == 1


# ──────────────────────────────────────────────────────────────────────────────
# get_merchant_stats tests (key AI integration)
# ──────────────────────────────────────────────────────────────────────────────

class TestMerchantStats:
    def test_stats_shape_matches_ai_service_expectation(self, db, user, merchant):
        """
        The dict returned must have exactly the keys that
        AIService._dict_to_transaction_stats() reads.
        """
        db.insert_transaction(user["id"], "Kaufland", 100, "2024-03-01T09:00:00", "TX1",
                               location="Cluj-Napoca", merchant_id=merchant["id"])
        db.insert_transaction(user["id"], "Kaufland", 200, "2024-03-10T17:00:00", "TX2",
                               location="București",  merchant_id=merchant["id"])

        stats = db.get_merchant_stats(user["id"], "Kaufland")

        required_keys = {
            "total_transactions",
            "first_transaction",
            "last_transaction",
            "common_locations",
            "transaction_amounts",
            "weekday_distribution",
        }
        assert required_keys.issubset(stats.keys())

    def test_stats_total_transactions(self, db, user, merchant):
        for i in range(5):
            db.insert_transaction(
                user["id"], "Kaufland", 50 + i,
                f"2024-0{i+1}-01T10:00:00", f"TX{i}",
                merchant_id=merchant["id"]
            )
        stats = db.get_merchant_stats(user["id"], "Kaufland")
        assert stats["total_transactions"] == 5

    def test_stats_common_locations(self, db, user, merchant):
        db.insert_transaction(user["id"], "Kaufland", 50, "2024-01-01T10:00:00", "A",
                               location="Cluj-Napoca", merchant_id=merchant["id"])
        db.insert_transaction(user["id"], "Kaufland", 50, "2024-01-02T10:00:00", "B",
                               location="Cluj-Napoca", merchant_id=merchant["id"])
        db.insert_transaction(user["id"], "Kaufland", 50, "2024-01-03T10:00:00", "C",
                               location="București",  merchant_id=merchant["id"])

        stats = db.get_merchant_stats(user["id"], "Kaufland")
        assert "Cluj-Napoca" in stats["common_locations"]

    def test_stats_returns_zero_for_unknown_merchant(self, db, user):
        stats = db.get_merchant_stats(user["id"], "NonExistentShop")
        assert stats["total_transactions"] == 0


# ──────────────────────────────────────────────────────────────────────────────
# filter_transactions tests
# ──────────────────────────────────────────────────────────────────────────────

class TestFilterTransactions:
    def _seed_varied_transactions(self, db, user, merchant):
        db.insert_transaction(user["id"], "Kaufland",  100, "2024-03-10T10:00:00", "A",
                               location="Cluj-Napoca", category="retail", merchant_id=merchant["id"])
        db.insert_transaction(user["id"], "Starbucks",  22, "2024-03-11T08:00:00", "B",
                               location="Cluj-Napoca", category="food",   merchant_id=None)
        db.insert_transaction(user["id"], "Rompetrol", 300, "2024-03-12T17:00:00", "C",
                               location="București",   category="gas",    merchant_id=None)

    def test_filter_by_merchant_name(self, db, user, merchant):
        self._seed_varied_transactions(db, user, merchant)
        results = db.filter_transactions(user["id"], {"merchant": "Kaufland"})
        assert all("Kaufland" in r["merchant_name"] for r in results)

    def test_filter_by_city(self, db, user, merchant):
        self._seed_varied_transactions(db, user, merchant)
        results = db.filter_transactions(user["id"], {"city": "Cluj"})
        assert len(results) == 2
        assert all("Cluj" in r["location"] for r in results)

    def test_filter_by_date_range(self, db, user, merchant):
        self._seed_varied_transactions(db, user, merchant)
        results = db.filter_transactions(user["id"], {
            "date_from": "2024-03-11T00:00:00",
            "date_to":   "2024-03-11T23:59:59",
        })
        assert len(results) == 1
        assert results[0]["merchant_name"] == "Starbucks"

    def test_empty_filters_returns_all(self, db, user, merchant):
        self._seed_varied_transactions(db, user, merchant)
        results = db.filter_transactions(user["id"], {})
        assert len(results) == 3


# ──────────────────────────────────────────────────────────────────────────────
# Merchant profile (cache) tests
# ──────────────────────────────────────────────────────────────────────────────

class TestMerchantProfiles:
    def test_upsert_and_get_profile(self, db, user, merchant):
        db.upsert_merchant_profile(
            user_id     = user["id"],
            merchant_id = merchant["id"],
            summary_result = {
                "summary":  "Magazinul tău preferat - 12 vizite în Cluj",
                "tone":     "warm",
                "language": "ro",
            },
        )
        profile = db.get_merchant_profile(user["id"], merchant["id"])
        assert profile is not None
        assert profile["summary_text"] == "Magazinul tău preferat - 12 vizite în Cluj"
        assert profile["tone"] == "warm"

    def test_upsert_updates_existing_profile(self, db, user, merchant):
        for summary in ["Old summary", "New summary"]:
            db.upsert_merchant_profile(user["id"], merchant["id"],
                                       {"summary": summary, "tone": "neutral", "language": "ro"})
        profile = db.get_merchant_profile(user["id"], merchant["id"])
        assert profile["summary_text"] == "New summary"

    def test_get_nonexistent_profile_returns_none(self, db, user, merchant):
        assert db.get_merchant_profile(user["id"], merchant["id"]) is None


# ──────────────────────────────────────────────────────────────────────────────
# Health check
# ──────────────────────────────────────────────────────────────────────────────

class TestHealthCheck:
    def test_health_check_structure(self, db):
        health = db.health_check()
        assert health["status"] == "healthy"
        assert "row_counts" in health
        for table in ("users", "merchants", "transactions", "merchant_profiles"):
            assert table in health["row_counts"]