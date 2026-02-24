"""
database_client.py
==================
Core database layer for the Raiffeisen Smart AI backend.
Written by Person 3 (Database).

This is the only file Person 2 (Connector) and Person 4 (AI) need to import.
It provides clean methods for every database operation, returning plain Python
dicts so that ai_service.py can consume them without any knowledge of SQL.

HOW TO USE
----------
    from src.database.database_client import DatabaseClient

    db = DatabaseClient()               # uses raiffeisen.db at project root
    db = DatabaseClient(":memory:")     # in-memory database (useful for tests)

AVAILABLE METHODS
-----------------
Users:
    create_user(name, email, city, university, study_year)
    get_user(user_id)
    get_user_by_email(email)
    update_user(user_id, **fields)

Income sources (full history, never overwritten):
    add_income_source(user_id, source_type, amount_monthly, started_at, ...)
    end_income_source(source_id, ended_at)
    get_active_income_sources(user_id, at_date=None)
    get_all_income_sources(user_id)

Financial snapshots (monthly income vs spending):
    upsert_financial_snapshot(user_id, month)
    get_financial_snapshot(user_id, month)
    get_financial_snapshots_range(user_id, from_month, to_month)

Merchants:
    upsert_merchant(normalized_dict)
    get_merchant_by_name(name)
    get_merchant_by_id(merchant_id)

Transactions:
    insert_transaction(user_id, merchant_name, amount, date, raw_pos_string, ...)
    get_transaction(tx_id)
    get_user_transactions(user_id, limit, offset)

AI integration (key methods for ai_service.py):
    get_merchant_stats(user_id, merchant_name)
        Returns the transaction_stats dict that AIService.generate_merchant_summary() expects.
    get_financial_context(user_id, at_date=None)
        Returns full financial context (active income, monthly total, snapshot)
        for the AI to use when generating summaries.
    filter_transactions(user_id, filters, limit)
        Applies filters from AIService.process_search_query() and returns
        matching transactions for AIService.format_search_results().

Merchant profile cache:
    upsert_merchant_profile(user_id, merchant_id, summary_result)
    get_merchant_profile(user_id, merchant_id)

Utility:
    get_all_merchants_for_user(user_id)
    health_check()

INCOME SOURCE TYPES
-------------------
    bursa_merit, bursa_sociala, job_part_time,
    internship, ajutor_parinti, freelance, other

FULL FLOW EXAMPLE (Person 2 usage)
-----------------------------------
    # 1. New transaction arrives from the bank
    normalized = ai_service.normalize_merchant("KAUFLAND*7638273 CLUJ")
    merchant   = db.upsert_merchant(normalized)
    db.insert_transaction(user_id, normalized["canonical_name"], 134.50, ...)

    # 2. Get merchant stats and generate AI summary
    stats   = db.get_merchant_stats(user_id, "Kaufland")
    summary = ai_service.generate_merchant_summary("Kaufland", stats, language="ro")
    db.upsert_merchant_profile(user_id, merchant["id"], summary)

    # 3. Natural language search
    parsed  = ai_service.process_search_query("arata-mi platile la benzinarii din Cluj")
    results = db.filter_transactions(user_id, parsed["parsed_intent"]["filters"])
    answer  = ai_service.format_search_results(query, parsed["parsed_intent"], results)
"""

import sqlite3
import uuid
import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

logger = logging.getLogger(__name__)

_SCHEMA_PATH  = Path(__file__).parent / "schema.sql"
_DEFAULT_DB   = Path(__file__).parent.parent.parent / "raiffeisen.db"


def _new_id() -> str:
    return str(uuid.uuid4())


class DatabaseClient:
    """
    Single entry point for all database operations.

    Sections:
      1. Internal helpers
      2. Users
      3. Income sources       ← new
      4. Financial snapshots  ← new
      5. Merchants
      6. Transactions
      7. AI integration
      8. Merchant profile cache
      9. Utility
    """

    def __init__(self, db_path: Optional[str] = None) -> None:
        self.db_path = Path(db_path) if db_path else _DEFAULT_DB
        self._memory_conn = None
        self._initialize_database()
        logger.info(f"DatabaseClient ready → {self.db_path}")

    # ──────────────────────────────────────────────────────────────────────
    # 1. INTERNAL HELPERS
    # ──────────────────────────────────────────────────────────────────────

    def _initialize_database(self) -> None:
        schema = _SCHEMA_PATH.read_text(encoding="utf-8")
        if str(self.db_path) == ":memory:":
            self._memory_conn = sqlite3.connect(":memory:")
            self._memory_conn.row_factory = sqlite3.Row
            self._memory_conn.execute("PRAGMA foreign_keys = ON")
            self._memory_conn.executescript(schema)
            self._memory_conn.commit()
        else:
            conn = sqlite3.connect(self.db_path)
            conn.executescript(schema)
            conn.commit()
            conn.close()
        logger.info("Schema verified / created")

    @contextmanager
    def _get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        if self._memory_conn is not None:
            try:
                yield self._memory_conn
                self._memory_conn.commit()
            except Exception:
                self._memory_conn.rollback()
                raise
            return

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        conn.execute("PRAGMA journal_mode = WAL")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    # ──────────────────────────────────────────────────────────────────────
    # 2. USERS
    # ──────────────────────────────────────────────────────────────────────

    def create_user(self, name: str, email: str,
                    city: str = "Cluj-Napoca",
                    university: str = "",
                    study_year: int = 1) -> Dict[str, Any]:
        """Create a new user account."""
        uid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO users (id, name, email, city, university, study_year) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (uid, name, email, city, university, study_year),
            )
        return self.get_user(uid)

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        return dict(row) if row else None

    def update_user(self, user_id: str, **fields) -> Optional[Dict[str, Any]]:
        """
        Update any user fields (name, city, university, study_year).

        Example:
            db.update_user(uid, study_year=3, city="București")
        """
        allowed = {"name", "city", "university", "study_year"}
        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return self.get_user(user_id)
        cols = ", ".join(f"{k} = ?" for k in updates)
        with self._get_connection() as conn:
            conn.execute(f"UPDATE users SET {cols} WHERE id = ?",
                         (*updates.values(), user_id))
        return self.get_user(user_id)

    # ──────────────────────────────────────────────────────────────────────
    # 3. INCOME SOURCES
    #
    # The golden rule: never delete or overwrite — only add and end.
    # This keeps a full history of the user's financial situation.
    # ──────────────────────────────────────────────────────────────────────

    def add_income_source(self, user_id: str, source_type: str,
                          amount_monthly: float, started_at: str,
                          employer: str = "", notes: str = "") -> Dict[str, Any]:
        """
        Add a new income source for a user.

        Args:
            user_id:        Target user.
            source_type:    One of: 'bursa_merit', 'bursa_sociala', 'job_part_time',
                            'internship', 'ajutor_parinti', 'freelance', 'other'
            amount_monthly: Amount in RON per month.
            started_at:     ISO date string when this source started, e.g. "2024-01-01"
            employer:       Name of employer / institution (optional).
            notes:          Any extra context.

        Returns:
            The inserted income source row.

        Example:
            # Student gets a part-time job in March 2024
            db.add_income_source(
                user_id       = uid,
                source_type   = "job_part_time",
                amount_monthly = 1200,
                started_at    = "2024-03-01",
                employer      = "Starbucks Cluj",
            )
        """
        sid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO income_sources "
                "(id, user_id, source_type, employer, amount_monthly, started_at, notes) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (sid, user_id, source_type, employer, amount_monthly, started_at, notes),
            )
        logger.info(f"Added income source: {source_type} {amount_monthly} RON/mo for {user_id}")
        return self._get_income_source(sid)

    def end_income_source(self, source_id: str, ended_at: str) -> Optional[Dict[str, Any]]:
        """
        Mark an income source as ended.

        Call this when a student loses their scholarship, quits a job, etc.
        The row stays in the database — we never delete history.

        Args:
            source_id: ID of the income source to end.
            ended_at:  ISO date string when this source ended, e.g. "2025-03-31"

        Example:
            # Student loses scholarship after semester ends
            db.end_income_source(source_id=bursa_id, ended_at="2024-06-30")
        """
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE income_sources SET ended_at = ? WHERE id = ?",
                (ended_at, source_id),
            )
        return self._get_income_source(source_id)

    def get_active_income_sources(self, user_id: str,
                                  at_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Return income sources that were active at a given date.

        Args:
            user_id:  Target user.
            at_date:  ISO date string (default: today). Pass "2024-06-01" to
                      see what was active back in June 2024.

        Returns:
            List of active income source rows at that date.

        Example:
            # What income did the student have in summer 2024?
            sources = db.get_active_income_sources(uid, at_date="2024-07-01")
        """
        if at_date is None:
            at_date = "9999-12-31"   # effectively "now"

        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT * FROM income_sources
                   WHERE user_id = ?
                     AND started_at <= ?
                     AND (ended_at IS NULL OR ended_at >= ?)
                   ORDER BY started_at""",
                (user_id, at_date, at_date),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_all_income_sources(self, user_id: str) -> List[Dict[str, Any]]:
        """Return full income history for a user (all past + present sources)."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM income_sources WHERE user_id = ? ORDER BY started_at",
                (user_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def _get_income_source(self, source_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM income_sources WHERE id = ?", (source_id,)
            ).fetchone()
        return dict(row) if row else None

    # ──────────────────────────────────────────────────────────────────────
    # 4. FINANCIAL SNAPSHOTS
    # ──────────────────────────────────────────────────────────────────────

    def upsert_financial_snapshot(self, user_id: str, month: str) -> Dict[str, Any]:
        """
        Calculate and save (or refresh) the financial snapshot for a month.

        A snapshot = total income from active sources + total spent from
        transactions that month. Saved so AI can reference it quickly.

        Args:
            user_id: Target user.
            month:   "YYYY-MM" string, e.g. "2024-03"

        Returns:
            The snapshot dict: {month, total_income, total_spent, saved}

        Example:
            db.upsert_financial_snapshot(uid, "2024-03")
        """
        # Sum all transactions in this month
        month_start = f"{month}-01"
        month_end   = f"{month}-31"  # SQLite string comparison works fine

        with self._get_connection() as conn:
            spent_row = conn.execute(
                """SELECT COALESCE(SUM(amount), 0) as total
                   FROM transactions
                   WHERE user_id = ? AND date >= ? AND date <= ?""",
                (user_id, f"{month_start}T00:00:00", f"{month_end}T23:59:59"),
            ).fetchone()
            total_spent = spent_row["total"]

        # Sum all active income sources for mid-month date
        mid_month = f"{month}-15"
        active_sources = self.get_active_income_sources(user_id, at_date=mid_month)
        total_income = sum(s["amount_monthly"] for s in active_sources)
        saved = total_income - total_spent

        snap_id = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                """INSERT INTO financial_snapshots
                       (id, user_id, month, total_income, total_spent, saved)
                   VALUES (?, ?, ?, ?, ?, ?)
                   ON CONFLICT(user_id, month) DO UPDATE SET
                       total_income = excluded.total_income,
                       total_spent  = excluded.total_spent,
                       saved        = excluded.saved""",
                (snap_id, user_id, month, total_income, total_spent, saved),
            )

        return {
            "month": month, "total_income": total_income,
            "total_spent": total_spent, "saved": saved,
        }

    def get_financial_snapshot(self, user_id: str, month: str) -> Optional[Dict[str, Any]]:
        """Get the saved snapshot for a specific month."""
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM financial_snapshots WHERE user_id = ? AND month = ?",
                (user_id, month),
            ).fetchone()
        return dict(row) if row else None

    def get_financial_snapshots_range(self, user_id: str,
                                       from_month: str, to_month: str) -> List[Dict[str, Any]]:
        """
        Get snapshots for a range of months.

        Example:
            snaps = db.get_financial_snapshots_range(uid, "2024-01", "2024-12")
        """
        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT * FROM financial_snapshots
                   WHERE user_id = ? AND month >= ? AND month <= ?
                   ORDER BY month""",
                (user_id, from_month, to_month),
            ).fetchall()
        return [dict(r) for r in rows]

    # ──────────────────────────────────────────────────────────────────────
    # 5. MERCHANTS
    # ──────────────────────────────────────────────────────────────────────

    def upsert_merchant(self, normalized: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert or update a merchant from AIService.normalize_merchant() output.

        Args:
            normalized: {"canonical_name": "Kaufland", "merchant_type": "retail",
                         "confidence": 0.97, "brand": "Kaufland"}
        """
        canonical = normalized["canonical_name"]
        with self._get_connection() as conn:
            existing = conn.execute(
                "SELECT id FROM merchants WHERE canonical_name = ?", (canonical,)
            ).fetchone()

            if existing:
                conn.execute(
                    "UPDATE merchants SET brand=?, merchant_type=?, confidence=? WHERE id=?",
                    (normalized.get("brand", canonical),
                     normalized.get("merchant_type", "unknown"),
                     normalized.get("confidence", 0.0),
                     existing["id"]),
                )
            else:
                conn.execute(
                    "INSERT INTO merchants (id, canonical_name, brand, merchant_type, confidence) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (_new_id(), canonical,
                     normalized.get("brand", canonical),
                     normalized.get("merchant_type", "unknown"),
                     normalized.get("confidence", 0.0)),
                )
        return self.get_merchant_by_name(canonical)

    def get_merchant_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM merchants WHERE canonical_name = ?", (name,)
            ).fetchone()
        return dict(row) if row else None

    def get_merchant_by_id(self, merchant_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM merchants WHERE id = ?", (merchant_id,)
            ).fetchone()
        return dict(row) if row else None

    # ──────────────────────────────────────────────────────────────────────
    # 6. TRANSACTIONS
    # ──────────────────────────────────────────────────────────────────────

    def insert_transaction(self, user_id: str, merchant_name: str,
                           amount: float, date: str, raw_pos_string: str,
                           currency: str = "RON", location: str = "",
                           category: str = "",
                           merchant_id: Optional[str] = None) -> Dict[str, Any]:
        """Save a new bank transaction."""
        tx_id = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO transactions "
                "(id, user_id, merchant_id, merchant_name, amount, currency, "
                "location, date, category, raw_pos_string) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (tx_id, user_id, merchant_id, merchant_name, amount,
                 currency, location, date, category, raw_pos_string),
            )
        return self.get_transaction(tx_id)

    def get_transaction(self, tx_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM transactions WHERE id = ?", (tx_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_user_transactions(self, user_id: str,
                               limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Return most recent transactions for a user."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM transactions WHERE user_id = ? "
                "ORDER BY date DESC LIMIT ? OFFSET ?",
                (user_id, limit, offset),
            ).fetchall()
        return [dict(r) for r in rows]

    # ──────────────────────────────────────────────────────────────────────
    # 7. AI INTEGRATION
    # ──────────────────────────────────────────────────────────────────────

    def get_merchant_stats(self, user_id: str, merchant_name: str) -> Dict[str, Any]:
        """
        Build the transaction_stats dict that AIService.generate_merchant_summary()
        expects as its second argument.

        Returns:
            {
                "total_transactions": 12,
                "first_transaction":  "2024-01-03T18:00:00",
                "last_transaction":   "2025-11-14T09:30:00",
                "common_locations":   ["Cluj-Napoca", "București"],
                "transaction_amounts": [43.2, 51.3, ...],
                "weekday_distribution": {"Monday": 4, "Friday": 6, ...}
            }
        """
        _DAY_MAP = {"0": "Sunday", "1": "Monday", "2": "Tuesday",
                    "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday"}

        with self._get_connection() as conn:
            agg = conn.execute(
                "SELECT COUNT(*) AS total, MIN(date) AS first, MAX(date) AS last "
                "FROM transactions WHERE user_id = ? AND merchant_name = ?",
                (user_id, merchant_name),
            ).fetchone()

            amounts = conn.execute(
                "SELECT amount FROM transactions WHERE user_id = ? AND merchant_name = ? "
                "ORDER BY date DESC",
                (user_id, merchant_name),
            ).fetchall()

            locations = conn.execute(
                "SELECT location, COUNT(*) AS cnt FROM transactions "
                "WHERE user_id = ? AND merchant_name = ? "
                "AND location IS NOT NULL AND location != '' "
                "GROUP BY location ORDER BY cnt DESC LIMIT 5",
                (user_id, merchant_name),
            ).fetchall()

            weekdays = conn.execute(
                "SELECT strftime('%w', date) AS dow, COUNT(*) AS cnt "
                "FROM transactions WHERE user_id = ? AND merchant_name = ? "
                "GROUP BY dow",
                (user_id, merchant_name),
            ).fetchall()

        return {
            "total_transactions":   agg["total"] or 0,
            "first_transaction":    agg["first"],
            "last_transaction":     agg["last"],
            "common_locations":     [r["location"] for r in locations],
            "transaction_amounts":  [r["amount"] for r in amounts],
            "weekday_distribution": {_DAY_MAP.get(r["dow"], r["dow"]): r["cnt"]
                                     for r in weekdays},
        }

    def get_financial_context(self, user_id: str,
                               at_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Return a complete financial context dict for the AI to use when
        generating summaries or answering questions.

        This is the main bridge between the financial profile and the AI.

        Args:
            user_id: Target user.
            at_date: ISO date string (default: today). Use this to get the
                     context as it was at a specific point in the past.

        Returns:
            {
                "user": {...},
                "active_income_sources": [...],
                "total_monthly_income": 1800.0,
                "recent_snapshot": {"month": "2025-01", "total_spent": 1340, "saved": 460},
                "income_history": [...]   # all past and present sources
            }

        Example — AI can use this to say "given your 1800 RON/month budget...":
            context = db.get_financial_context(uid)
            summary = ai_service.generate_merchant_summary("Glovo", stats,
                          language="ro")  # pass context separately if AI supports it
        """
        if at_date is None:
            from datetime import date
            at_date = date.today().isoformat()

        user    = self.get_user(user_id)
        active  = self.get_active_income_sources(user_id, at_date=at_date)
        history = self.get_all_income_sources(user_id)

        # Find most recent snapshot at or before at_date
        month = at_date[:7]  # "YYYY-MM"
        with self._get_connection() as conn:
            snap_row = conn.execute(
                "SELECT * FROM financial_snapshots "
                "WHERE user_id = ? AND month <= ? "
                "ORDER BY month DESC LIMIT 1",
                (user_id, month),
            ).fetchone()
        recent_snapshot = dict(snap_row) if snap_row else None

        return {
            "user":                  user,
            "active_income_sources": active,
            "total_monthly_income":  sum(s["amount_monthly"] for s in active),
            "recent_snapshot":       recent_snapshot,
            "income_history":        history,
        }

    def filter_transactions(self, user_id: str, filters: Dict[str, Any],
                             limit: int = 50) -> List[Dict[str, Any]]:
        """
        Apply structured filters from AIService.process_search_query() and
        return matching transactions.

        Accepted filter keys:
            merchant      — partial name match
            merchant_type — exact type match (joins merchants table)
            city          — partial location match
            date_from     — ISO datetime lower bound
            date_to       — ISO datetime upper bound

        Full flow for Person 2:
            1. parsed  = ai_service.process_search_query(query)
            2. results = db.filter_transactions(uid, parsed["parsed_intent"]["filters"])
            3. answer  = ai_service.format_search_results(query, parsed["parsed_intent"], results)
        """
        clauses: list = ["t.user_id = ?"]
        params:  list = [user_id]

        if filters.get("merchant"):
            clauses.append("t.merchant_name LIKE ?")
            params.append(f"%{filters['merchant']}%")

        if filters.get("merchant_type"):
            clauses.append("m.merchant_type = ?")
            params.append(filters["merchant_type"])

        if filters.get("city"):
            clauses.append("t.location LIKE ?")
            params.append(f"%{filters['city']}%")

        if filters.get("date_from"):
            clauses.append("t.date >= ?")
            params.append(filters["date_from"])

        if filters.get("date_to"):
            clauses.append("t.date <= ?")
            params.append(filters["date_to"])

        sql = f"""
            SELECT t.id, t.merchant_name, t.amount, t.currency,
                   t.location, t.date, t.category, t.raw_pos_string,
                   m.merchant_type, m.confidence
            FROM transactions t
            LEFT JOIN merchants m ON t.merchant_id = m.id
            WHERE {' AND '.join(clauses)}
            ORDER BY t.date DESC
            LIMIT ?
        """
        params.append(limit)

        with self._get_connection() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]

    # ──────────────────────────────────────────────────────────────────────
    # 8. MERCHANT PROFILE CACHE
    # ──────────────────────────────────────────────────────────────────────

    def upsert_merchant_profile(self, user_id: str, merchant_id: str,
                                 summary_result: Dict[str, Any]) -> None:
        """Cache an AI-generated merchant summary."""
        with self._get_connection() as conn:
            conn.execute(
                """INSERT INTO merchant_profiles
                       (id, user_id, merchant_id, summary_text, tone, language, last_updated)
                   VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
                   ON CONFLICT(user_id, merchant_id) DO UPDATE SET
                       summary_text = excluded.summary_text,
                       tone         = excluded.tone,
                       language     = excluded.language,
                       last_updated = excluded.last_updated""",
                (_new_id(), user_id, merchant_id,
                 summary_result.get("summary", ""),
                 summary_result.get("tone", "neutral"),
                 summary_result.get("language", "ro")),
            )

    def get_merchant_profile(self, user_id: str, merchant_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT mp.*, m.canonical_name, m.merchant_type "
                "FROM merchant_profiles mp "
                "JOIN merchants m ON mp.merchant_id = m.id "
                "WHERE mp.user_id = ? AND mp.merchant_id = ?",
                (user_id, merchant_id),
            ).fetchone()
        return dict(row) if row else None

    # ──────────────────────────────────────────────────────────────────────
    # 9. UTILITY
    # ──────────────────────────────────────────────────────────────────────

    def get_all_merchants_for_user(self, user_id: str) -> List[Dict[str, Any]]:
        """All merchants a user has transacted with, ordered by frequency."""
        with self._get_connection() as conn:
            rows = conn.execute(
                """SELECT m.id, m.canonical_name, m.merchant_type,
                          COUNT(t.id) AS transaction_count,
                          MAX(t.date) AS last_transaction,
                          SUM(t.amount) AS total_spent
                   FROM transactions t JOIN merchants m ON t.merchant_id = m.id
                   WHERE t.user_id = ?
                   GROUP BY m.id ORDER BY transaction_count DESC""",
                (user_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def health_check(self) -> Dict[str, Any]:
        with self._get_connection() as conn:
            counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                      for t in ("users", "merchants", "transactions",
                                "merchant_profiles", "income_sources",
                                "financial_snapshots")}
        return {"status": "healthy", "row_counts": counts, "db_path": str(self.db_path)}