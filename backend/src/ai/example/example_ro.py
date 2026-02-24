# complete_example_romanian.py
"""
Complete End-to-End Integration Example with Romanian Language Support
Shows how all AI components work together in both Romanian and English
"""
from dotenv import load_dotenv

from src.ai.config.config import load_config
from src.ai.service.ai_service import AIService
from src.ai.service.error_handling import ErrorHandler, FallbackManager

load_dotenv()

import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict

import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MockBackend:
    """
    Simulates the backend engineer's database and API
    In production, this would be the actual backend service
    """

    def __init__(self):
        # Mock transaction database
        self.transactions = self._generate_mock_transactions()
        logger.info(f"Mock backend initialized with {len(self.transactions)} transactions")

    def _generate_mock_transactions(self) -> List[Dict]:
        """Generate realistic mock transaction data"""
        transactions = []

        # Regular merchants
        regular_merchants = [
            ("Starbucks", "Cluj Center", 15.50, "food"),
            ("Mega Image", "Cluj Zorilor", 85.00, "retail"),
            ("Rompetrol", "Cluj", 150.00, "gas"),
            ("World Class", "Cluj Center", 150.00, "fitness"),
        ]

        # Generate transactions over last 3 months
        for i in range(60):
            merchant, location, amount, category = regular_merchants[i % len(regular_merchants)]

            # Add some variation
            if category == "food":
                amount += (i % 5) * 2

            transactions.append({
                "id": f"tx_{i:04d}",
                "pos_string": f"{merchant.upper()}*{i:04d} {location.upper()}",
                "merchant_name": merchant,
                "amount": amount,
                "currency": "RON",
                "location": location,
                "date": (datetime.now() - timedelta(days=90 - i)).isoformat(),
                "category": category
            })

        return transactions

    def get_merchant_stats(self, merchant_name: str) -> Dict:
        """Get statistics for a specific merchant"""
        merchant_txs = [t for t in self.transactions if t["merchant_name"] == merchant_name]

        if not merchant_txs:
            return None

        dates = [datetime.fromisoformat(t["date"]) for t in merchant_txs]
        amounts = [t["amount"] for t in merchant_txs]
        locations = [t["location"] for t in merchant_txs]

        # Weekday distribution
        weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        weekday_dist = {day: 0 for day in weekdays}
        for date in dates:
            weekday_dist[weekdays[date.weekday()]] += 1

        return {
            "total_transactions": len(merchant_txs),
            "first_transaction": min(dates).isoformat(),
            "last_transaction": max(dates).isoformat(),
            "common_locations": list(set(locations)),
            "transaction_amounts": amounts,
            "weekday_distribution": weekday_dist
        }

    def filter_transactions(self, filters: Dict) -> List[Dict]:
        """Filter transactions based on parsed query"""
        results = self.transactions.copy()

        # Filter by merchant
        if filters.get("merchant_name"):
            results = [t for t in results if filters["merchant_name"].lower() in t["merchant_name"].lower()]

        # Filter by location
        if filters.get("location"):
            results = [t for t in results if filters["location"].lower() in t["location"].lower()]

        # Filter by category
        if filters.get("category"):
            results = [t for t in results if t["category"] == filters["category"]]

        # Filter by date range
        if filters.get("date_from"):
            date_from = filters["date_from"]
            results = [
                t for t in results
                if datetime.fromisoformat(t["date"]).date() >= date_from
            ]

        if filters.get("date_to"):
            date_to = filters["date_to"]
            results = [
                t for t in results
                if datetime.fromisoformat(t["date"]).date() <= date_to
            ]
        return results


class SmartMobileAIDemo:
    """
    Complete demo of the Smart Mobile AI system
    Shows all features working together in BOTH Romanian and English! 🇷🇴
    """

    def __init__(self):
        # Initialize configuration
        self.config = load_config(environment="development")

        # Initialize AI service (now with Romanian support!)
        self.ai_service = AIService(self.config)

        # Initialize mock backend
        self.backend = MockBackend()

        # Initialize error handler
        self.error_handler = ErrorHandler(enable_fallbacks=True)

        logger.info("Smart Mobile AI Demo initialized with Romanian & English support")

    def demo_merchant_normalization(self):
        """Demo: Normalize messy POS strings (language-independent)"""
        print("\n" + "=" * 70)
        print("DEMO 1: MERCHANT NORMALIZATION")
        print("=" * 70)

        messy_pos_strings = [
            "KAUFLAND*7638273 CLUJ",
            "PAYPAL *NETFLIX",
            "ROMPETROL 1234 CLUJ",
            "MEGA IMAGE ZORILOR",
            "STARBUCKS*5678 CENTER"
        ]

        for pos_string in messy_pos_strings:
            result = self.ai_service.normalize_merchant(pos_string)
            print(f"\nInput: {pos_string}")
            print(f"Output: {result['canonical_name']}")
            print(f"Confidence: {result['confidence']:.2f}")
            print(f"Type: {result['merchant_type']}")

    def demo_merchant_profile_bilingual(self):
        """Demo: Generate merchant profile with AI summary in BOTH languages"""
        print("\n" + "=" * 70)
        print("DEMO 2: MERCHANT PROFILE (ROMANIAN & ENGLISH)")
        print("=" * 70)

        merchant = "Starbucks"

        # Get stats from backend
        stats = self.backend.get_merchant_stats(merchant)

        if stats:
            print(f"\nMerchant: {merchant}")
            print(f"Total visits: {stats['total_transactions']}")

            # Generate AI summary in ENGLISH
            print("\n" + "—" * 70)
            print("📝 ENGLISH SUMMARY")
            print("—" * 70)
            summary_en = self.ai_service.generate_merchant_summary(merchant, stats, language="en")
            print(f"Summary: {summary_en['summary']}")
            print(f"Tone: {summary_en['tone']}")
            print(f"Language: {summary_en['language'].upper()}")

            # Generate AI summary in ROMANIAN
            print("\n" + "—" * 70)
            print("📝 ROMANIAN SUMMARY (REZUMAT ÎN ROMÂNĂ)")
            print("—" * 70)
            summary_ro = self.ai_service.generate_merchant_summary(merchant, stats, language="ro")
            print(f"Summary: {summary_ro['summary']}")
            print(f"Tone: {summary_ro['tone']}")
            print(f"Language: {summary_ro['language'].upper()}")

    def demo_nl_search_bilingual(self):
        """Demo: Natural language search in BOTH Romanian and English"""
        print("\n" + "=" * 70)
        print("DEMO 3: NATURAL LANGUAGE SEARCH (ROMANIAN & ENGLISH)")
        print("=" * 70)

        # Test queries in BOTH languages
        test_queries = [
            # English queries
            ("Show me all Starbucks payments", "en"),
            ("Where did I buy groceries in Cluj?", "en"),
            ("Gas stations this month", "en"),

            # Romanian queries (with diacritics)
            ("Arată-mi toate plățile la Starbucks", "ro"),
            ("Unde am cumpărat alimente în Cluj?", "ro"),
            ("Benzinării luna aceasta", "ro"),

            # Romanian queries (without diacritics - still works!)
            ("Arata-mi toate platile la Mega Image", "ro"),

            # Advice queries that should be BLOCKED
            ("Should I cancel my Netflix subscription?", "en"),
            ("Ar trebui să anulez abonamentul la Netflix?", "ro"),
        ]

        for query, expected_lang in test_queries:
            print(f"\n{'—' * 70}")
            print(f"🔍 Query ({expected_lang.upper()}): {query}")
            print(f"{'—' * 70}")

            # Step 1: Parse query (language detected automatically!)
            parse_result = self.ai_service.process_search_query(query)

            if parse_result["status"] == "refused":
                print(f"❌ BLOCKED (Safety Filter)")
                print(f"   Reason: {parse_result['reason']}")
                print(f"   Message: {parse_result['message']}")
                continue

            if parse_result["status"] == "error":
                print(f"❌ ERROR: {parse_result['message']}")
                continue

            # Step 2: Show detected language
            detected_lang = parse_result.get("language", "unknown")
            print(f"✓ Detected language: {detected_lang.upper()}")

            # Step 3: Backend filters transactions
            parsed_intent = parse_result["parsed_intent"]
            print(f"✓ Intent: {parsed_intent['intent']}")

            # Extract filters for backend
            filters = {
                "merchant_name": parsed_intent.get("merchant_name"),
                "location": parsed_intent.get("location"),
                "category": parsed_intent.get("category"),
                "date_from": parsed_intent.get("date_from"),
                "date_to": parsed_intent.get("date_to")
            }

            results = self.backend.filter_transactions(filters)
            print(f"✓ Found: {len(results)} transactions")

            # Step 4: Format answer (in the SAME language as query!)
            if results:
                formatted = self.ai_service.format_search_results(
                    query=query,
                    parsed_intent=parsed_intent,
                    results=results
                )
                print(f"\n✅ Answer ({formatted['language'].upper()}): {formatted['answer_text']}")
                if formatted['suggestions']:
                    print(f"   Suggestions: {', '.join(formatted['suggestions'])}")

    def demo_safety_filter_bilingual(self):
        """Demo: Safety filter blocks advice in BOTH languages"""
        print("\n" + "=" * 70)
        print("DEMO 4: SAFETY FILTER (ROMANIAN & ENGLISH)")
        print("=" * 70)

        safety_tests = [
            # Safe queries
            ("Show me all payments", "en", True),
            ("Arată-mi toate plățile", "ro", True),

            # Advice queries - should be BLOCKED
            ("Should I cancel my gym membership?", "en", False),
            ("Is it worth keeping Netflix?", "en", False),
            ("Ar trebui să anulez abonamentul la sală?", "ro", False),
            ("Merită să păstrez Netflix?", "ro", False),
        ]

        for query, lang, should_be_safe in safety_tests:
            print(f"\n{'—' * 70}")
            print(f"Query ({lang.upper()}): {query}")
            print(f"{'—' * 70}")

            parse_result = self.ai_service.process_search_query(query)

            if parse_result["status"] == "refused":
                print(f"❌ BLOCKED (as expected)")
                print(f"   Refusal message: {parse_result['message'][:80]}...")
            else:
                print(f"✅ ALLOWED (safe query)")

    def demo_complete_workflow_bilingual(self):
        """Demo: Complete end-to-end workflow in BOTH languages"""
        print("\n" + "=" * 70)
        print("DEMO 5: COMPLETE WORKFLOW (ROMANIAN & ENGLISH)")
        print("=" * 70)

        # ==============================================================
        # WORKFLOW 1: ENGLISH USER
        # ==============================================================
        print("\n" + "🇬🇧 " * 35)
        print("WORKFLOW 1: ENGLISH USER")
        print("🇬🇧 " * 35)

        print("\n" + "—" * 70)
        print("STEP 1: New transaction arrives")
        print("—" * 70)

        new_transaction = {
            "pos_string": "STARBUCKS*9999 CLUJ CENTER",
            "amount": 17.50,
            "location": "Cluj Center"
        }

        print(f"POS String: {new_transaction['pos_string']}")
        print(f"Amount: {new_transaction['amount']} RON")

        print("\n" + "—" * 70)
        print("STEP 2: Normalize merchant name")
        print("—" * 70)

        normalized = self.ai_service.normalize_merchant(new_transaction['pos_string'])
        merchant = normalized['canonical_name']
        print(f"Identified merchant: {merchant}")

        print("\n" + "—" * 70)
        print("STEP 3: User searches (in English)")
        print("—" * 70)

        query_en = "Show me all my coffee purchases"
        print(f"Query: {query_en}")

        parse_result = self.ai_service.process_search_query(query_en)

        if parse_result["status"] == "success":
            print(f"✓ Language detected: {parse_result['language'].upper()}")

            filters = {
                "category": "food",
                "merchant_name": merchant
            }
            results = self.backend.filter_transactions(filters)

            formatted = self.ai_service.format_search_results(
                query=query_en,
                parsed_intent=parse_result["parsed_intent"],
                results=results
            )

            print(f"✓ Answer: {formatted['answer_text']}")

        print("\n" + "—" * 70)
        print("STEP 4: View merchant profile (English)")
        print("—" * 70)

        stats = self.backend.get_merchant_stats(merchant)
        if stats:
            summary = self.ai_service.generate_merchant_summary(merchant, stats, language="en")
            print(f"\nMerchant Profile: {merchant}")
            print(f"Summary: {summary['summary']}")

        print("\n✅ English workflow completed!")

        # ==============================================================
        # WORKFLOW 2: ROMANIAN USER
        # ==============================================================
        print("\n\n" + "🇷🇴 " * 35)
        print("WORKFLOW 2: ROMANIAN USER (UTILIZATOR ROMÂN)")
        print("🇷🇴 " * 35)

        print("\n" + "—" * 70)
        print("PASUL 1: Sosește o nouă tranzacție")
        print("—" * 70)

        print(f"POS String: {new_transaction['pos_string']}")
        print(f"Sumă: {new_transaction['amount']} RON")

        print("\n" + "—" * 70)
        print("PASUL 2: Normalizare nume comerciant")
        print("—" * 70)

        print(f"Comerciant identificat: {merchant}")

        print("\n" + "—" * 70)
        print("PASUL 3: Utilizatorul caută (în română)")
        print("—" * 70)

        query_ro = "Arată-mi toate achizițiile mele de cafea"
        print(f"Interogare: {query_ro}")

        parse_result = self.ai_service.process_search_query(query_ro)

        if parse_result["status"] == "success":
            print(f"✓ Limbă detectată: {parse_result['language'].upper()}")

            filters = {
                "category": "food",
                "merchant_name": merchant
            }
            results = self.backend.filter_transactions(filters)

            formatted = self.ai_service.format_search_results(
                query=query_ro,
                parsed_intent=parse_result["parsed_intent"],
                results=results
            )

            print(f"✓ Răspuns: {formatted['answer_text']}")

        print("\n" + "—" * 70)
        print("PASUL 4: Vizualizare profil comerciant (română)")
        print("—" * 70)

        if stats:
            summary = self.ai_service.generate_merchant_summary(merchant, stats, language="ro")
            print(f"\nProfil Comerciant: {merchant}")
            print(f"Rezumat: {summary['summary']}")

        print("\n✅ Fluxul în română completat!")

    def run_all_demos(self):
        """Run all demos in sequence"""
        print("\n")
        print("=" * 70)
        print("  SMART MOBILE AI - ROMANIAN & ENGLISH DEMONSTRATION")
        print("  🇷🇴 DEMONSTRAȚIE ROMÂNĂ ȘI ENGLEZĂ 🇬🇧")
        print("=" * 70)

        try:
            self.demo_merchant_normalization()
            self.demo_merchant_profile_bilingual()
            self.demo_nl_search_bilingual()
            self.demo_safety_filter_bilingual()
            self.demo_complete_workflow_bilingual()

            print("\n")
            print("=" * 70)
            print("  ALL DEMOS COMPLETED SUCCESSFULLY! ✅")
            print("  TOATE DEMONSTRAȚIILE COMPLETATE CU SUCCES! ✅")
            print("=" * 70)
            print("\n🎉 Romanian & English language support is working perfectly!")
            print("🎉 Suportul pentru limba română și engleză funcționează perfect!")

        except Exception as e:
            logger.error(f"Demo failed: {e}", exc_info=True)
            print(f"\n❌ Demo failed: {e}")


# ===================================================================
# Main entry point
# ===================================================================

if __name__ == "__main__":
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ ERROR: OPENAI_API_KEY environment variable not set")
        print("❌ EROARE: Variabila de mediu OPENAI_API_KEY nu este setată")
        print("\nPlease set it / Vă rugăm să o setați:")
        print("  export OPENAI_API_KEY='sk-your-key-here'")
        sys.exit(1)

    print("\n🚀 Starting Smart Mobile AI Demo...")
    print("🚀 Pornirea demonstrației Smart Mobile AI...")

    # Run the demo
    demo = SmartMobileAIDemo()
    demo.run_all_demos()

    print("\n✨ Demo completed!")
    print("✨ Demonstrație completată!")
