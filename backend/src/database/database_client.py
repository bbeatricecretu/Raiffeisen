"""
METHODS BY SECTION
Users           : create, get, get_by_email, get_by_phone, update
Merchants       : upsert, get_by_name, get_by_id
Transactions    : insert, get, get_by_user, get_by_county, get_merchant_stats, filter
Teams           : create, get, get_by_code, get_user_teams, join, get_members, remove_member
Posts           : create, get, get_by_team, delete
Comments        : create, get_by_post, get_reactions, delete
Conversations   : get_or_create, get_by_user
Messages        : send, get_by_conversation
Utility         : health_check
"""

import sqlite3
import uuid
import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

logger = logging.getLogger(__name__)

_SCHEMA_PATH = Path(__file__).parent / "schema.sql"
_DEFAULT_DB  = Path(__file__).parent.parent.parent / "raiffeisen.db"


def _new_id() -> str:
    return str(uuid.uuid4())


class DatabaseClient:

    def __init__(self, db_path: Optional[str] = None) -> None:
        self.db_path = Path(db_path) if db_path else _DEFAULT_DB
        self._memory_conn = None
        self._initialize_database()

    def _initialize_database(self) -> None:
        schema = _SCHEMA_PATH.read_text(encoding="utf-8")
        if str(self.db_path) == ":memory:":
            self._memory_conn = sqlite3.connect(":memory:")
            self._memory_conn.row_factory = sqlite3.Row
            self._memory_conn.execute("PRAGMA foreign_keys = ON")
            self._memory_conn.executescript(schema)
            # Add columns if they do not exist
            try:
                self._memory_conn.execute("ALTER TABLE users ADD COLUMN career TEXT")
            except Exception: pass
            try:
                self._memory_conn.execute("ALTER TABLE users ADD COLUMN location TEXT")
            except Exception: pass
            try:
                self._memory_conn.execute("ALTER TABLE users ADD COLUMN balance_savings REAL DEFAULT 15420.50")
            except Exception:
                pass
            self._memory_conn.commit()
        else:
            conn = sqlite3.connect(self.db_path)
            conn.executescript(schema)
            # Add columns if they do not exist
            try:
                conn.execute("ALTER TABLE users ADD COLUMN career TEXT")
            except Exception: pass
            try:
                conn.execute("ALTER TABLE users ADD COLUMN location TEXT")
            except Exception: pass
            try:
                conn.execute("ALTER TABLE users ADD COLUMN balance_savings REAL DEFAULT 15420.50")
            except Exception:
                pass
            conn.commit()
            conn.close()

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

    # USERS

    def create_user(self, name: str, password: str,
                    email: str = "", phone: str = "",
                    iban: str = "", balance: float = 2500.00, agreed: bool = False) -> Dict[str, Any]:
        uid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO users (id, name, email, phone, password, iban, balance, agreed) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (uid, name, email or None, phone or None,
                 password, iban or None, balance, int(agreed)),
            )
        return self.get_user(uid)

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE id = ?", (user_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ?", (email,)
            ).fetchone()
        return dict(row) if row else None

    # Removed old get_user_by_phone to avoid duplicates (moved below)


    def get_user_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE name = ?", (name,)
            ).fetchone()
        return dict(row) if row else None

    def get_user_by_iban(self, iban: str) -> Optional[Dict[str, Any]]:
        # Normalize: Remove spaces, uppercase
        clean_iban = iban.replace(" ", "").upper()
        # Some DB entries might have spaces, so we should check both
        with self._get_connection() as conn:
            # Check exact match
            row = conn.execute("SELECT * FROM users WHERE iban = ?", (iban,)).fetchone()
            if not row:
                # Check normalized match against normalized DB content (if DB supports REPLACE)
                # Or simply iterate if needed, but REPLACE is standard enough for SQLite
                try:
                    row = conn.execute(
                        "SELECT * FROM users WHERE REPLACE(REPLACE(UPPER(iban), ' ', ''), '-', '') = ?", 
                        (clean_iban,)
                    ).fetchone()
                except Exception:
                    pass
        return dict(row) if row else None
        
    def get_user_by_phone(self, phone: str) -> Optional[Dict[str, Any]]:
        # Normalize: Remove spaces, dashes, parens
        clean_phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        with self._get_connection() as conn:
            # Check exact match
            row = conn.execute("SELECT * FROM users WHERE phone = ?", (phone,)).fetchone()
            if not row:
                try:
                    row = conn.execute(
                        "SELECT * FROM users WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') = ?", 
                        (clean_phone,)
                    ).fetchone()
                except Exception:
                    pass
        return dict(row) if row else None

    def search_users(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT id, name, email, phone, career, location FROM users "
                "WHERE name LIKE ? OR email LIKE ? LIMIT ?",
                (f"%{query}%", f"%{query}%", limit)
            ).fetchall()
        return [dict(r) for r in rows]

    def update_user(self, user_id: str, **fields) -> Optional[Dict[str, Any]]:
        allowed = {"name", "email", "phone", "iban", "agreed", "balance", "career", "location", "password",
                   "balance_savings", "balance_eur", "balance_usd", "balance_gbp", "balance_chf", "balance_huf"}
        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return self.get_user(user_id)
        cols = ", ".join(f"{k} = ?" for k in updates)
        with self._get_connection() as conn:
            conn.execute(f"UPDATE users SET {cols} WHERE id = ?",
                         (*updates.values(), user_id))
        return self.get_user(user_id)

    def get_all_users(self) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute("SELECT * FROM users").fetchall()
        return [dict(r) for r in rows]

    def get_user_preferences(self, user_id: str) -> Dict[str, Any]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT user_id, email_alerts, push_alerts, hide_small_amounts "
                "FROM user_preferences WHERE user_id = ?",
                (user_id,),
            ).fetchone()

            if not row:
                conn.execute(
                    "INSERT INTO user_preferences (user_id, email_alerts, push_alerts, hide_small_amounts) "
                    "VALUES (?, 1, 1, 0)",
                    (user_id,),
                )
                row = conn.execute(
                    "SELECT user_id, email_alerts, push_alerts, hide_small_amounts "
                    "FROM user_preferences WHERE user_id = ?",
                    (user_id,),
                ).fetchone()

        assert row is not None
        return {
            "user_id": row["user_id"],
            "email_alerts": bool(row["email_alerts"]),
            "push_alerts": bool(row["push_alerts"]),
            "hide_small_amounts": bool(row["hide_small_amounts"]),
        }

    def upsert_user_preferences(self, user_id: str,
                                email_alerts: bool,
                                push_alerts: bool,
                                hide_small_amounts: bool) -> Dict[str, Any]:
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO user_preferences (user_id, email_alerts, push_alerts, hide_small_amounts, updated_at) "
                "VALUES (?, ?, ?, ?, datetime('now')) "
                "ON CONFLICT(user_id) DO UPDATE SET "
                "email_alerts = excluded.email_alerts, "
                "push_alerts = excluded.push_alerts, "
                "hide_small_amounts = excluded.hide_small_amounts, "
                "updated_at = datetime('now')",
                (user_id, int(email_alerts), int(push_alerts), int(hide_small_amounts)),
            )

        return self.get_user_preferences(user_id)

    # MERCHANTS

    def upsert_merchant(self, data: Dict[str, Any]) -> Dict[str, Any]:
        canonical = data["canonical_name"]
        with self._get_connection() as conn:
            existing = conn.execute(
                "SELECT id FROM merchants WHERE canonical_name = ?", (canonical,)
            ).fetchone()
            if existing:
                conn.execute(
                    "UPDATE merchants SET category=?, city=?, county=?, "
                    "merchant_type=?, confidence=? WHERE id=?",
                    (data.get("category"), data.get("city"), data.get("county"),
                     data.get("merchant_type", "unknown"),
                     data.get("confidence", 0.0), existing["id"]),
                )
            else:
                conn.execute(
                    "INSERT INTO merchants "
                    "(id, canonical_name, category, phone, city, county, merchant_type, confidence) "
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (_new_id(), canonical, data.get("category"), data.get("phone"),
                     data.get("city"), data.get("county"),
                     data.get("merchant_type", "unknown"), data.get("confidence", 0.0)),
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

    # TRANSACTIONS

    def insert_transaction(self, user_id: str, merchant_name: str,
                           amount: float, date: str,
                           raw_pos_string: str = "", currency: str = "RON",
                           city: str = "", county: str = "",
                           category: str = "",
                           merchant_id: Optional[str] = None,
                           source_balance_key: str = "balance") -> Dict[str, Any]:
        tx_id = _new_id()
        allowed_balance_keys = {"balance", "balance_savings", "balance_eur", "balance_usd", "balance_gbp", "balance_chf", "balance_huf"}
        balance_key = source_balance_key if source_balance_key in allowed_balance_keys else "balance"
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO transactions "
                "(id, user_id, merchant_id, merchant_name, amount, currency, "
                "city, county, date, category, raw_pos_string) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (tx_id, user_id, merchant_id, merchant_name, amount, currency,
                 city or None, county or None, date, category or None, raw_pos_string or None),
            )
            # Update user balance
            conn.execute(
                f"UPDATE users SET {balance_key} = {balance_key} - ? WHERE id = ?",
                (amount, user_id)
            )
        return self.get_transaction(tx_id)

    def get_transaction(self, tx_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM transactions WHERE id = ?", (tx_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_user_transactions(self, user_id: str,
                               limit: int = 100, offset: int = 0,
                               start_date: Optional[str] = None, 
                               end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM transactions WHERE user_id = ?"
        params = [user_id]
        
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
            
        if end_date:
            # End of day inclusive
            if len(end_date) == 10: # YYYY-MM-DD
                query += " AND date <= ?"
                params.append(end_date + " 23:59:59")
            else:
                query += " AND date <= ?"
                params.append(end_date)
        
        query += " ORDER BY date DESC LIMIT ? OFFSET ?"
        params.append(limit)
        params.append(offset)

        with self._get_connection() as conn:
            rows = conn.execute(query, tuple(params)).fetchall()
        return [dict(r) for r in rows]

    def get_spending_by_county(self, user_id: str,
                                from_date: str, to_date: str) -> List[Dict[str, Any]]:
        """
        Total amount spent per county in a date range.
        Used for the dynamic map feature (Bank feature #3).

        Example:
            db.get_spending_by_county(uid, "2024-01-01", "2024-12-31")
            → [{"county": "Cluj", "total": 1234.56}, {"county": "Ilfov", "total": 890.0}]
        """
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT county, SUM(amount) as total FROM transactions "
                "WHERE user_id = ? AND date >= ? AND date <= ? "
                "AND county IS NOT NULL "
                "GROUP BY county ORDER BY total DESC",
                (user_id, from_date, to_date),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_merchant_stats(self, user_id: str, merchant_name: str) -> Dict[str, Any]:
        """
        Aggregated stats for one merchant — used by AIService.generate_merchant_summary().

        Returns:
            {
                total_transactions, first_transaction, last_transaction,
                common_locations, transaction_amounts, weekday_distribution
            }
        """
        _DAYS = {"0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday",
                 "4": "Thursday", "5": "Friday", "6": "Saturday"}
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
            cities = conn.execute(
                "SELECT city, COUNT(*) AS cnt FROM transactions "
                "WHERE user_id = ? AND merchant_name = ? AND city IS NOT NULL "
                "GROUP BY city ORDER BY cnt DESC LIMIT 5",
                (user_id, merchant_name),
            ).fetchall()
            weekdays = conn.execute(
                "SELECT strftime('%w', date) AS dow, COUNT(*) AS cnt "
                "FROM transactions WHERE user_id = ? AND merchant_name = ? GROUP BY dow",
                (user_id, merchant_name),
            ).fetchall()
        return {
            "total_transactions":   agg["total"] or 0,
            "first_transaction":    agg["first"],
            "last_transaction":     agg["last"],
            "common_locations":     [r["city"] for r in cities],
            "transaction_amounts":  [r["amount"] for r in amounts],
            "weekday_distribution": {_DAYS.get(r["dow"], r["dow"]): r["cnt"]
                                     for r in weekdays},
        }

    def filter_transactions(self, user_id: str, filters: Dict[str, Any],
                             limit: int = 50) -> List[Dict[str, Any]]:
        """
        Filters from AIService.process_search_query() applied to transactions.

        Accepted filter keys: merchant, merchant_type, city, county, date_from, date_to
        """
        clauses = ["t.user_id = ?"]
        params  = [user_id]
        if filters.get("merchant"):
            clauses.append("t.merchant_name LIKE ?")
            params.append(f"%{filters['merchant']}%")
        if filters.get("merchant_type"):
            clauses.append("m.merchant_type = ?")
            params.append(filters["merchant_type"])
        if filters.get("city"):
            clauses.append("t.city LIKE ?")
            params.append(f"%{filters['city']}%")
        if filters.get("county"):
            clauses.append("t.county LIKE ?")
            params.append(f"%{filters['county']}%")
        if filters.get("date_from"):
            clauses.append("t.date >= ?")
            params.append(filters["date_from"])
        if filters.get("date_to"):
            clauses.append("t.date <= ?")
            params.append(filters["date_to"])
        sql = (
            "SELECT t.*, m.merchant_type, m.confidence "
            "FROM transactions t LEFT JOIN merchants m ON t.merchant_id = m.id "
            f"WHERE {' AND '.join(clauses)} ORDER BY t.date DESC LIMIT ?"
        )
        params.append(limit)
        with self._get_connection() as conn:
            rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]

    # TEAMS

    def create_team(self, name: str, created_by: str,
                    image_url: str = "", code: Optional[str] = None) -> Dict[str, Any]:
        normalized_code = (code or "").strip().upper()

        if normalized_code:
            existing = self.get_team_by_code(normalized_code)
            if existing:
                with self._get_connection() as conn:
                    conn.execute(
                        "INSERT OR IGNORE INTO team_members (user_id, team_id, role) VALUES (?, ?, 'member')",
                        (created_by, existing["id"]),
                    )
                return existing

        team_id = _new_id()
        invite_code = normalized_code if normalized_code else team_id[:8].upper()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO teams (id, name, code, image_url, created_by) "
                "VALUES (?, ?, ?, ?, ?)",
                (team_id, name, invite_code, image_url or None, created_by),
            )
            conn.execute(
                "INSERT INTO team_members (user_id, team_id, role) VALUES (?, ?, 'admin')",
                (created_by, team_id),
            )
        return self.get_team(team_id)

    def get_team(self, team_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM teams WHERE id = ?", (team_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_team_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM teams WHERE code = ?", (code.upper(),)
            ).fetchone()
        return dict(row) if row else None

    def get_user_teams(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT t.*, tm.role FROM teams t "
                "JOIN team_members tm ON t.id = tm.team_id "
                "WHERE tm.user_id = ? ORDER BY t.created_at DESC",
                (user_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def join_team(self, user_id: str, code: str) -> Optional[Dict[str, Any]]:
        """Join a team by invite code. Returns the team or None if code is invalid."""
        team = self.get_team_by_code(code)
        if not team:
            return None
        with self._get_connection() as conn:
            conn.execute(
                "INSERT OR IGNORE INTO team_members (user_id, team_id, role) "
                "VALUES (?, ?, 'member')",
                (user_id, team["id"]),
            )
        return team

    def get_team_members(self, team_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT u.id, u.name, u.email, u.phone, tm.role, tm.joined_at "
                "FROM users u JOIN team_members tm ON u.id = tm.user_id "
                "WHERE tm.team_id = ? ORDER BY tm.joined_at",
                (team_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def is_team_member(self, user_id: str, team_id: str) -> bool:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT 1 FROM team_members WHERE user_id = ? AND team_id = ? LIMIT 1",
                (user_id, team_id),
            ).fetchone()
        return row is not None

    def remove_member(self, user_id: str, team_id: str) -> None:
        with self._get_connection() as conn:
            conn.execute(
                "DELETE FROM team_members WHERE user_id = ? AND team_id = ?",
                (user_id, team_id),
            )

    # POSTS

    def create_post(self, team_id: str, user_id: str,
                    text: str = "", title: str = "",
                    image_url: str = "") -> Dict[str, Any]:
        post_id = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO posts (id, team_id, user_id, title, text, image_url) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (post_id, team_id, user_id,
                 title or None, text or None, image_url or None),
            )
        return self.get_post(post_id)

    def get_post(self, post_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM posts WHERE id = ?", (post_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_team_posts(self, team_id: str,
                       limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT p.*, u.name as author_name FROM posts p "
                "JOIN users u ON p.user_id = u.id "
                "WHERE p.team_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?",
                (team_id, limit, offset),
            ).fetchall()
        return [dict(r) for r in rows]

    def delete_post(self, post_id: str) -> None:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM posts WHERE id = ?", (post_id,))

    # COMMENTS  (text, emoji reaction, or both)

    def create_comment(self, post_id: str, user_id: str,
                        text: str = "", emoji: str = "") -> Dict[str, Any]:
        """
        Add a comment, a reaction, or both to a post.
        At least one of text or emoji must be provided.

        Examples:
            db.create_comment(post_id, user_id, emoji="heart")
            db.create_comment(post_id, user_id, text="AA", emoji="fire")
        """
        if not text and not emoji:
            raise ValueError("At least one of text or emoji must be provided.")
        cid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO comments (id, post_id, user_id, text, emoji) "
                "VALUES (?, ?, ?, ?, ?)",
                (cid, post_id, user_id, text or None, emoji or None),
            )
            row = conn.execute(
                "SELECT c.*, u.name as author_name FROM comments c "
                "JOIN users u ON c.user_id = u.id WHERE c.id = ?", (cid,)
            ).fetchone()
        return dict(row)

    def get_post_comments(self, post_id: str) -> List[Dict[str, Any]]:
        """Returns all comments and reactions for a post, ordered oldest first."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT c.*, u.name as author_name FROM comments c "
                "JOIN users u ON c.user_id = u.id "
                "WHERE c.post_id = ? ORDER BY c.created_at ASC",
                (post_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_post_reactions(self, post_id: str) -> List[Dict[str, Any]]:
        """Returns only emoji reactions grouped by emoji with count."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT emoji, COUNT(*) as count FROM comments "
                "WHERE post_id = ? AND emoji IS NOT NULL "
                "GROUP BY emoji ORDER BY count DESC",
                (post_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def delete_comment(self, comment_id: str) -> None:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM comments WHERE id = ?", (comment_id,))

    # CONVERSATIONS

    def get_or_create_conversation(self, user1_id: str,
                                    user2_id: str) -> Dict[str, Any]:
        """Get existing conversation or create a new one. IDs are sorted to avoid duplicates."""
        u1, u2 = sorted([user1_id, user2_id])
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?",
                (u1, u2),
            ).fetchone()
            if row:
                return dict(row)
            cid = _new_id()
            conn.execute(
                "INSERT INTO conversations (id, user1_id, user2_id) VALUES (?, ?, ?)",
                (cid, u1, u2),
            )
            row = conn.execute(
                "SELECT * FROM conversations WHERE id = ?", (cid,)
            ).fetchone()
        return dict(row)

    def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT c.*, u1.name as user1_name, u2.name as user2_name "
                "FROM conversations c "
                "JOIN users u1 ON c.user1_id = u1.id "
                "JOIN users u2 ON c.user2_id = u2.id "
                "WHERE c.user1_id = ? OR c.user2_id = ? "
                "ORDER BY c.created_at DESC",
                (user_id, user_id),
            ).fetchall()
        return [dict(r) for r in rows]

    # MESSAGES

    def send_message(self, conversation_id: str, sender_id: str,
                     text: str) -> Dict[str, Any]:
        mid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO messages (id, conversation_id, sender_id, text) "
                "VALUES (?, ?, ?, ?)",
                (mid, conversation_id, sender_id, text),
            )
            row = conn.execute(
                "SELECT m.*, u.name as sender_name FROM messages m "
                "JOIN users u ON m.sender_id = u.id WHERE m.id = ?", (mid,)
            ).fetchone()
        return dict(row)

    def get_conversation_messages(self, conversation_id: str,
                                   limit: int = 100) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT m.*, u.name as sender_name FROM messages m "
                "JOIN users u ON m.sender_id = u.id "
                "WHERE m.conversation_id = ? ORDER BY m.created_at ASC LIMIT ?",
                (conversation_id, limit),
            ).fetchall()
        return [dict(r) for r in rows]

    # CONTACTS

    def create_contact(self, user_id: str, name: str,
                       iban: str = "", phone: str = "") -> Dict[str, Any]:
        cid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO contacts (id, user_id, name, iban, phone) "
                "VALUES (?, ?, ?, ?, ?)",
                (cid, user_id, name, iban or None, phone or None),
            )
        return self.get_contact(cid)

    def get_contact(self, contact_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM contacts WHERE id = ?", (contact_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_user_contacts(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM contacts WHERE user_id = ? ORDER BY name ASC",
                (user_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def get_suggested_connections(self, user_id: str, limit: int = 24) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            me = conn.execute(
                "SELECT id, career, location FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
            if not me:
                return []

            rows = conn.execute(
                "SELECT u.id, u.name, u.email, u.phone, u.career, u.location "
                "FROM users u "
                "LEFT JOIN contacts c "
                "ON c.user_id = ? AND LOWER(COALESCE(c.name, '')) = LOWER(COALESCE(u.name, '')) "
                "WHERE u.id <> ? AND c.id IS NULL "
                "ORDER BY "
                "CASE WHEN LOWER(COALESCE(u.career, '')) = LOWER(COALESCE(?, '')) THEN 0 ELSE 1 END, "
                "CASE WHEN LOWER(COALESCE(u.location, '')) = LOWER(COALESCE(?, '')) THEN 0 ELSE 1 END, "
                "u.name ASC "
                "LIMIT ?",
                (user_id, user_id, me["career"], me["location"], limit),
            ).fetchall()
        return [dict(r) for r in rows]

    def _resolve_user_id_from_contact(self, conn: sqlite3.Connection, name: str = "", iban: str = "", phone: str = "") -> Optional[str]:
        if iban:
            normalized_iban = iban.replace(" ", "").replace("-", "").upper()
            row = conn.execute(
                "SELECT id FROM users "
                "WHERE REPLACE(REPLACE(UPPER(COALESCE(iban, '')), ' ', ''), '-', '') = ? "
                "LIMIT 1",
                (normalized_iban,),
            ).fetchone()
            if row:
                return row["id"]

        if phone:
            normalized_phone = phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            row = conn.execute(
                "SELECT id FROM users "
                "WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(phone, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ? "
                "LIMIT 1",
                (normalized_phone,),
            ).fetchone()
            if row:
                return row["id"]

        if name:
            row = conn.execute(
                "SELECT id FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1",
                (name,),
            ).fetchone()
            if row:
                return row["id"]

        return None

    def get_contact_network_user_ids(self, user_id: str) -> List[str]:
        with self._get_connection() as conn:
            viewer = conn.execute("SELECT id, name, iban, phone FROM users WHERE id = ?", (user_id,)).fetchone()
            if not viewer:
                return [user_id]

            connected_ids = {user_id}

            # Direct contacts that current user added.
            owned_contacts = conn.execute(
                "SELECT name, iban, phone FROM contacts WHERE user_id = ?",
                (user_id,),
            ).fetchall()
            for c in owned_contacts:
                target_id = self._resolve_user_id_from_contact(
                    conn,
                    name=c["name"] or "",
                    iban=c["iban"] or "",
                    phone=c["phone"] or "",
                )
                if target_id and target_id != user_id:
                    connected_ids.add(target_id)

            # Reverse contacts: people who have current user saved as a contact.
            normalized_iban = (viewer["iban"] or "").replace(" ", "").replace("-", "").upper()
            normalized_phone = (viewer["phone"] or "").replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            reverse_rows = conn.execute(
                "SELECT DISTINCT user_id FROM contacts WHERE "
                "(LOWER(COALESCE(name, '')) = LOWER(?)) OR "
                "(? <> '' AND REPLACE(REPLACE(UPPER(COALESCE(iban, '')), ' ', ''), '-', '') = ?) OR "
                "(? <> '' AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(phone, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ?)",
                (
                    viewer["name"] or "",
                    normalized_iban,
                    normalized_iban,
                    normalized_phone,
                    normalized_phone,
                ),
            ).fetchall()
            for row in reverse_rows:
                if row["user_id"] and row["user_id"] != user_id:
                    connected_ids.add(row["user_id"])

        return list(connected_ids)

    def get_contact_network_posts(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        user_ids = self.get_contact_network_user_ids(user_id)
        if not user_ids:
            return []

        placeholders = ",".join(["?"] * len(user_ids))
        query = (
            "SELECT p.*, u.name AS author_name, t.name AS team_name "
            "FROM posts p "
            "JOIN users u ON p.user_id = u.id "
            "LEFT JOIN teams t ON p.team_id = t.id "
            f"WHERE p.user_id IN ({placeholders}) "
            "ORDER BY p.created_at DESC "
            "LIMIT ?"
        )

        with self._get_connection() as conn:
            rows = conn.execute(query, (*user_ids, limit)).fetchall()

        return [dict(r) for r in rows]

    def update_contact(self, contact_id: str, **fields) -> Optional[Dict[str, Any]]:
        allowed = {"name", "iban", "phone"}
        updates = {k: v for k, v in fields.items() if k in allowed}
        if not updates:
            return self.get_contact(contact_id)
        cols = ", ".join(f"{k} = ?" for k in updates)
        with self._get_connection() as conn:
            conn.execute(f"UPDATE contacts SET {cols} WHERE id = ?",
                         (*updates.values(), contact_id))
        return self.get_contact(contact_id)

    def delete_contact(self, contact_id: str) -> None:
        with self._get_connection() as conn:
            conn.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))

    # CONNECTION INVITES

    def create_referral_invite(self, inviter_id: str, channel: str = "link", invitee_email: Optional[str] = None) -> Dict[str, Any]:
        if channel not in {"link", "email"}:
            raise ValueError("Invalid channel")
        rid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO referral_invites (id, inviter_id, invitee_email, channel, status) "
                "VALUES (?, ?, ?, ?, 'pending')",
                (rid, inviter_id, (invitee_email or None), channel),
            )
            row = conn.execute("SELECT * FROM referral_invites WHERE id = ?", (rid,)).fetchone()
        return dict(row)

    def mark_referral_joined(self, invite_id: str, joined_user_id: str, joined_email: str = "") -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            invite = conn.execute(
                "SELECT * FROM referral_invites WHERE id = ?",
                (invite_id,),
            ).fetchone()
            if not invite:
                return None
            if invite["status"] == "joined":
                return dict(invite)

            # If email was specified on invite, only accept matching signup email.
            invited_email = (invite["invitee_email"] or "").strip().lower()
            signup_email = (joined_email or "").strip().lower()
            if invited_email and signup_email and invited_email != signup_email:
                raise ValueError("Referral invite email mismatch")

            conn.execute(
                "UPDATE referral_invites SET status = 'joined', joined_user_id = ?, joined_at = datetime('now') WHERE id = ?",
                (joined_user_id, invite_id),
            )
            row = conn.execute("SELECT * FROM referral_invites WHERE id = ?", (invite_id,)).fetchone()
        return dict(row) if row else None

    def get_referral_stats(self, inviter_id: str) -> Dict[str, Any]:
        with self._get_connection() as conn:
            total_row = conn.execute(
                "SELECT COUNT(*) AS c FROM referral_invites WHERE inviter_id = ?",
                (inviter_id,),
            ).fetchone()
            joined_row = conn.execute(
                "SELECT COUNT(*) AS c FROM referral_invites WHERE inviter_id = ? AND status = 'joined'",
                (inviter_id,),
            ).fetchone()

        invites_sent = int(total_row["c"] if total_row else 0)
        joined = int(joined_row["c"] if joined_row else 0)
        pending = max(0, invites_sent - joined)
        return {
            "invites_sent": invites_sent,
            "joined": joined,
            "pending": pending,
        }

    def create_connection_invite(self, sender_id: str, recipient_id: str) -> Dict[str, Any]:
        if sender_id == recipient_id:
            raise ValueError("Cannot send invite to yourself")

        iid = _new_id()
        with self._get_connection() as conn:
            already_connected = conn.execute(
                "SELECT 1 FROM connection_invites "
                "WHERE status = 'accepted' AND ((sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)) "
                "LIMIT 1",
                (sender_id, recipient_id, recipient_id, sender_id),
            ).fetchone()
            if already_connected:
                raise ValueError("Users are already connected")

            existing = conn.execute(
                "SELECT id FROM connection_invites "
                "WHERE sender_id = ? AND recipient_id = ? AND status = 'pending'",
                (sender_id, recipient_id),
            ).fetchone()
            if existing:
                row = conn.execute(
                    "SELECT * FROM connection_invites WHERE id = ?",
                    (existing["id"],),
                ).fetchone()
                return dict(row)

            conn.execute(
                "INSERT INTO connection_invites (id, sender_id, recipient_id, status) "
                "VALUES (?, ?, ?, 'pending')",
                (iid, sender_id, recipient_id),
            )
            row = conn.execute(
                "SELECT * FROM connection_invites WHERE id = ?",
                (iid,),
            ).fetchone()
        return dict(row)

    def get_user_connection_invites(self, user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = (
            "SELECT ci.*, su.name AS sender_name, su.email AS sender_email, su.career AS sender_career "
            "FROM connection_invites ci "
            "JOIN users su ON ci.sender_id = su.id "
            "WHERE ci.recipient_id = ?"
        )
        params: List[Any] = [user_id]
        if status:
            query += " AND ci.status = ?"
            params.append(status)
        query += " ORDER BY ci.created_at DESC"

        with self._get_connection() as conn:
            rows = conn.execute(query, tuple(params)).fetchall()
        return [dict(r) for r in rows]

    def get_connection_invite(self, invite_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM connection_invites WHERE id = ?",
                (invite_id,),
            ).fetchone()
        return dict(row) if row else None

    def get_user_mutual_connections(self, user_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT "
                "CASE WHEN ci.sender_id = ? THEN u_rec.id ELSE u_send.id END AS id, "
                "CASE WHEN ci.sender_id = ? THEN u_rec.name ELSE u_send.name END AS name, "
                "CASE WHEN ci.sender_id = ? THEN u_rec.email ELSE u_send.email END AS email, "
                "CASE WHEN ci.sender_id = ? THEN u_rec.phone ELSE u_send.phone END AS phone, "
                "CASE WHEN ci.sender_id = ? THEN u_rec.career ELSE u_send.career END AS career, "
                "CASE WHEN ci.sender_id = ? THEN u_rec.location ELSE u_send.location END AS location, "
                "ci.responded_at AS connected_at "
                "FROM connection_invites ci "
                "JOIN users u_send ON u_send.id = ci.sender_id "
                "JOIN users u_rec ON u_rec.id = ci.recipient_id "
                "WHERE ci.status = 'accepted' AND (ci.sender_id = ? OR ci.recipient_id = ?) "
                "ORDER BY ci.responded_at DESC, ci.created_at DESC",
                (user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id),
            ).fetchall()
        return [dict(r) for r in rows]

    def _contact_exists(self, conn: sqlite3.Connection, user_id: str, target_name: str, target_iban: str = "", target_phone: str = "") -> bool:
        row = conn.execute(
            "SELECT 1 FROM contacts WHERE user_id = ? AND LOWER(name) = LOWER(?) LIMIT 1",
            (user_id, target_name),
        ).fetchone()
        if row:
            return True

        if target_iban:
            normalized_iban = target_iban.replace(" ", "").replace("-", "").upper()
            row = conn.execute(
                "SELECT 1 FROM contacts WHERE user_id = ? AND REPLACE(REPLACE(UPPER(COALESCE(iban, '')), ' ', ''), '-', '') = ? LIMIT 1",
                (user_id, normalized_iban),
            ).fetchone()
            if row:
                return True

        if target_phone:
            normalized_phone = target_phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            row = conn.execute(
                "SELECT 1 FROM contacts WHERE user_id = ? AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(phone, ''), ' ', ''), '-', ''), '(', ''), ')', '') = ? LIMIT 1",
                (user_id, normalized_phone),
            ).fetchone()
            if row:
                return True

        return False

    def respond_connection_invite(self, invite_id: str, recipient_id: str, status: str) -> Optional[Dict[str, Any]]:
        if status not in {"accepted", "rejected"}:
            raise ValueError("Invalid invite status")

        with self._get_connection() as conn:
            invite = conn.execute(
                "SELECT * FROM connection_invites WHERE id = ?",
                (invite_id,),
            ).fetchone()
            if not invite:
                return None
            if invite["recipient_id"] != recipient_id:
                raise PermissionError("Not allowed to respond to this invite")
            if invite["status"] != "pending":
                return dict(invite)

            conn.execute(
                "UPDATE connection_invites SET status = ?, responded_at = datetime('now') WHERE id = ?",
                (status, invite_id),
            )

            if status == "accepted":
                sender = conn.execute("SELECT id, name, iban, phone FROM users WHERE id = ?", (invite["sender_id"],)).fetchone()
                recipient = conn.execute("SELECT id, name, iban, phone FROM users WHERE id = ?", (invite["recipient_id"],)).fetchone()

                if sender and recipient:
                    if not self._contact_exists(conn, recipient["id"], sender["name"], sender["iban"] or "", sender["phone"] or ""):
                        conn.execute(
                            "INSERT INTO contacts (id, user_id, name, iban, phone) VALUES (?, ?, ?, ?, ?)",
                            (_new_id(), recipient["id"], sender["name"], sender["iban"] or None, sender["phone"] or None),
                        )

                    if not self._contact_exists(conn, sender["id"], recipient["name"], recipient["iban"] or "", recipient["phone"] or ""):
                        conn.execute(
                            "INSERT INTO contacts (id, user_id, name, iban, phone) VALUES (?, ?, ?, ?, ?)",
                            (_new_id(), sender["id"], recipient["name"], recipient["iban"] or None, recipient["phone"] or None),
                        )

            row = conn.execute(
                "SELECT * FROM connection_invites WHERE id = ?",
                (invite_id,),
            ).fetchone()

        return dict(row) if row else None

    # TRANSACTION DELETE

    def delete_transaction(self, tx_id: str) -> bool:
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM transactions WHERE id = ?", (tx_id,)).fetchone()
            if not row:
                return False
            conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
        return True

    # PENDING CONFIRMATIONS

    def create_pending_confirmation(self, user_id: str, merchant: str, amount: float,
                                     currency: str = "RON", category: str = "",
                                     city: str = "", county: str = "") -> Dict[str, Any]:
        cid = _new_id()
        with self._get_connection() as conn:
            conn.execute(
                "INSERT INTO pending_confirmations "
                "(id, user_id, merchant, amount, currency, category, city, county) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (cid, user_id, merchant, amount, currency,
                 category or None, city or None, county or None),
            )
        return self.get_pending_confirmation(cid)

    def get_pending_confirmation(self, conf_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM pending_confirmations WHERE id = ?", (conf_id,)
            ).fetchone()
        return dict(row) if row else None

    def get_user_pending_confirmations(self, user_id: str,
                                        status: Optional[str] = None) -> List[Dict[str, Any]]:
        query = "SELECT * FROM pending_confirmations WHERE user_id = ?"
        params: list = [user_id]
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY created_at DESC"
        with self._get_connection() as conn:
            rows = conn.execute(query, tuple(params)).fetchall()
        return [dict(r) for r in rows]

    def update_pending_confirmation_status(self, conf_id: str, status: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE pending_confirmations SET status = ? WHERE id = ?",
                (status, conf_id),
            )
        return self.get_pending_confirmation(conf_id)

    def delete_pending_confirmation(self, conf_id: str) -> bool:
        with self._get_connection() as conn:
            row = conn.execute(
                "SELECT * FROM pending_confirmations WHERE id = ?", (conf_id,)
            ).fetchone()
            if not row:
                return False
            conn.execute("DELETE FROM pending_confirmations WHERE id = ?", (conf_id,))
        return True

    # UTILITY

    def health_check(self) -> Dict[str, Any]:
        tables = ["users", "merchants", "transactions", "teams", "team_members",
                  "posts", "comments", "conversations", "messages", "user_preferences", "connection_invites", "referral_invites"]
        with self._get_connection() as conn:
            counts = {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                      for t in tables}
        return {"status": "healthy", "row_counts": counts, "db_path": str(self.db_path)}