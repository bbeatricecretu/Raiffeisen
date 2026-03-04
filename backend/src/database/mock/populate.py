
import os
import sys
import logging
import argparse
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from src.database.database_client import DatabaseClient
from src.database.mock.users import get_users
from src.database.mock.merchants import get_merchants
from src.database.mock.transactions import get_transactions
from src.database.mock.teams import get_teams
from src.database.mock.posts import get_posts
from src.database.mock.conversations import get_conversations

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)


class MockDataPopulator:
    def __init__(self, db_path: str = "raiffeisen.db", force_reset: bool = True):
        self.db_path = db_path
        self.force_reset = force_reset
        self.user_ids = []
        self.user_ids_by_name = {}
        self.merchant_names = []
        self.team_ids = []

    def _reset_database(self):
        if self.db_path != ":memory:" and os.path.exists(self.db_path):
            logger.info(f"Removing existing database: {self.db_path}")
            os.remove(self.db_path)

    def populate_all(self):
        if self.force_reset and self.db_path != ":memory:":
            self._reset_database()

        logger.info("Starting database population...")
        logger.info(".." * 50)

        self.db = DatabaseClient(self.db_path)

        self._populate_users()
        self._populate_merchants()
        self._populate_transactions()
        self._populate_teams()
        self._populate_posts()
        self._populate_conversations()

        logger.info("=" * 50)
        logger.info("Database population complete!")
        self._show_stats()

    def _populate_users(self):
        logger.info("Creating users...")
        users = get_users()

        for user_data in users:
            try:
                user = self.db.create_user(**user_data)
                self.user_ids.append(user["id"])
                self.user_ids_by_name[user["name"]] = user["id"]
            except Exception as e:
                logger.error(f"  Failed to create user {user_data['name']}: {e}")

        logger.info(f"  Created {len(self.user_ids)} users")

    def _populate_merchants(self):
        logger.info("Creating merchants...")
        merchants = get_merchants()

        for merchant_data in merchants:
            try:
                merchant = self.db.upsert_merchant(merchant_data)
                self.merchant_names.append(merchant["canonical_name"])
            except Exception as e:
                logger.error(f"  Failed to create merchant {merchant_data['canonical_name']}: {e}")

        logger.info(f"  Created {len(self.merchant_names)} merchants")

    def _populate_transactions(self):
        logger.info("Creating transactions...")

        if not self.user_ids or not self.merchant_names:
            logger.error("  Missing users or merchants for transactions")
            return

        transactions = get_transactions(self.user_ids, self.merchant_names)

        count = 0
        for tx_data in transactions:
            try:
                merchant = self.db.get_merchant_by_name(tx_data["merchant_name"])
                merchant_id = merchant["id"] if merchant else None

                self.db.insert_transaction(
                    user_id=tx_data["user_id"],
                    merchant_name=tx_data["merchant_name"],
                    amount=tx_data["amount"],
                    date=tx_data["date"],
                    currency=tx_data.get("currency", "RON"),
                    city=tx_data.get("city", ""),
                    county=tx_data.get("county", ""),
                    category=tx_data.get("category", ""),
                    raw_pos_string=tx_data.get("raw_pos_string", ""),
                    merchant_id=merchant_id
                )
                count += 1
            except Exception as e:
                logger.error(f"  Failed to create transaction: {e}")

        logger.info(f"  Created {count} transactions")

    def _populate_teams(self):
        logger.info("Creating teams...")

        if len(self.user_ids_by_name) < 5:
            logger.error("  Not enough users to create teams")
            return

        teams, team_members = get_teams(self.user_ids_by_name)

        # Map fictive team ID ("team_1") → real UUID from DB
        fake_id_to_real_id = {}

        team_count = 0
        for team_data in teams:
            try:
                team = self.db.create_team(
                    name=team_data["name"],
                    created_by=team_data["created_by"],
                    image_url=team_data["image_url"]
                )
                real_id = team["id"]
                fake_id_to_real_id[team_data["id"]] = real_id
                self.team_ids.append(real_id)
                team_count += 1
            except Exception as e:
                logger.error(f"  Failed to create team {team_data['name']}: {e}")

        # Add members using the real team IDs
        member_count = 0
        for member_data in team_members:
            try:
                real_team_id = fake_id_to_real_id.get(member_data["team_id"])
                if not real_team_id:
                    continue

                team = self.db.get_team(real_team_id)
                if not team:
                    continue

                existing = [m["id"] for m in self.db.get_team_members(real_team_id)]
                if member_data["user_id"] not in existing:
                    self.db.join_team(member_data["user_id"], team["code"])
                    member_count += 1
            except Exception:
                pass

        logger.info(f"  Created {team_count} teams with {member_count} additional members")

    def _populate_posts(self):
        logger.info("Creating posts and comments...")

        if not self.team_ids:
            logger.error("  No teams available for posts")
            return

        posts, comments, reactions = get_posts(self.team_ids, self.user_ids_by_name)

        post_count = 0
        created_posts = []

        for post_data in posts:
            try:
                post = self.db.create_post(
                    team_id=post_data["team_id"],
                    user_id=post_data["user_id"],
                    title=post_data["title"],
                    text=post_data["text"],
                    image_url=post_data.get("image_url")
                )
                post_count += 1
                created_posts.append(post["id"])
            except Exception as e:
                logger.error(f"  Failed to create post: {e}")

        logger.info(f"  Created {post_count} posts")

        if created_posts and comments:
            comment_count = 0
            for i, comment_data in enumerate(comments):
                try:
                    comment_data["post_id"] = created_posts[i % len(created_posts)]
                    self.db.create_comment(
                        post_id=comment_data["post_id"],
                        user_id=comment_data["user_id"],
                        text=comment_data.get("text") or None,
                        emoji=comment_data.get("emoji") or None
                    )
                    comment_count += 1
                except Exception as e:
                    logger.debug(f"  Comment error: {e}")
            logger.info(f"  Created {comment_count} comments")

        if created_posts and reactions:
            reaction_count = 0
            for i, reaction_data in enumerate(reactions):
                try:
                    reaction_data["post_id"] = created_posts[i % len(created_posts)]
                    self.db.create_comment(
                        post_id=reaction_data["post_id"],
                        user_id=reaction_data["user_id"],
                        text=None,
                        emoji=reaction_data.get("emoji", "👍")
                    )
                    reaction_count += 1
                except Exception as e:
                    logger.debug(f"  Reaction error: {e}")
            logger.info(f"  Created {reaction_count} reactions")

    def _populate_conversations(self):
        logger.info("Creating conversations and messages...")

        if len(self.user_ids_by_name) < 4:
            logger.error("  Not enough users for conversations")
            return

        conversations, messages = get_conversations(self.user_ids_by_name)

        # Build conv_map: (sorted_user1, sorted_user2) → real conv ID
        conv_count = 0
        conv_map = {}

        for conv_data in conversations[:10]:
            try:
                conv = self.db.get_or_create_conversation(
                    user1_id=conv_data["user1_id"],
                    user2_id=conv_data["user2_id"]
                )
                u1, u2 = sorted([conv_data["user1_id"], conv_data["user2_id"]])
                conv_map[(u1, u2)] = conv["id"]
                conv_count += 1
            except Exception as e:
                logger.error(f"  Failed to create conversation: {e}")

        # Match each message to its conversation by sender
        msg_count = 0
        for msg_data in messages[:100]:
            try:
                conv_id = None
                for conv_data in conversations:
                    if msg_data["sender_id"] in (conv_data["user1_id"], conv_data["user2_id"]):
                        u1, u2 = sorted([conv_data["user1_id"], conv_data["user2_id"]])
                        conv_id = conv_map.get((u1, u2))
                        if conv_id:
                            break

                if conv_id:
                    self.db.send_message(
                        conversation_id=conv_id,
                        sender_id=msg_data["sender_id"],
                        text=msg_data["text"]
                    )
                    msg_count += 1
            except Exception as e:
                logger.error(f"  Failed to send message: {e}")

        logger.info(f"  Created {conv_count} conversations with {msg_count} messages")

    def _show_stats(self):
        logger.info("\nDATABASE STATISTICS:")
        health = self.db.health_check()
        for table, count in health["row_counts"].items():
            logger.info(f"  {table:20}: {count:5d} rows")
        logger.info(f"\nDatabase path: {health['db_path']}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Populate database with mock data")
    parser.add_argument("--memory", action="store_true",
                        help="Use in-memory database (for testing)")
    parser.add_argument("--no-reset", action="store_true",
                        help="Don't reset database (append data)")

    args = parser.parse_args()

    db_path = ":memory:" if args.memory else "raiffeisen.db"
    force_reset = not args.no_reset

    populator = MockDataPopulator(db_path, force_reset)
    populator.populate_all()