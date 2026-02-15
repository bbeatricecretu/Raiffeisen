# complete_example.py
"""
Complete End-to-End Integration Example
Shows how all AI components work together in a realistic scenario
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

# Import all components

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
    Shows all features working together
    """

    def __init__(self):
        # Initialize configuration
        self.config = load_config(environment="development")

        # Initialize AI service
        self.ai_service = AIService(self.config)

        # Initialize mock backend
        self.backend = MockBackend()

        # Initialize error handler
        self.error_handler = ErrorHandler(enable_fallbacks=True)

        logger.info("Smart Mobile AI Demo initialized")

    def demo_merchant_normalization(self):
        """Demo: Normalize messy POS strings"""
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

    def demo_merchant_profile(self):
        """Demo: Generate merchant profile with AI summary"""
        print("\n" + "=" * 70)
        print("DEMO 2: MERCHANT PROFILE")
        print("=" * 70)

        merchant = "Starbucks"

        # Get stats from backend
        stats = self.backend.get_merchant_stats(merchant)

        if stats:
            print(f"\nMerchant: {merchant}")
            print(f"Total visits: {stats['total_transactions']}")
            print(
                f"This month: {len([t for t in self.backend.transactions if t['merchant_name'] == merchant and datetime.fromisoformat(t['date']) > datetime.now() - timedelta(days=30)])}")

            # Generate AI summary
            summary = self.ai_service.generate_merchant_summary(merchant, stats)
            print(f"\nAI Summary: {summary['summary']}")
            print(f"Tone: {summary['tone']}")

    def demo_nl_search(self):
        """Demo: Natural language search"""
        print("\n" + "=" * 70)
        print("DEMO 3: NATURAL LANGUAGE SEARCH")
        print("=" * 70)

        test_queries = [
            "Show me all Starbucks payments",
            "Where did I buy groceries in Cluj?",
            "Gas stations this month",
            "When did I last pay my gym membership?",
            # This one should be blocked
            "Should I cancel my Netflix subscription?"
        ]

        for query in test_queries:
            print(f"\n{'—' * 70}")
            print(f"Query: {query}")
            print(f"{'—' * 70}")

            # Step 1: Parse query
            parse_result = self.ai_service.process_search_query(query)

            if parse_result["status"] == "refused":
                print(f"❌ BLOCKED: {parse_result['message']}")
                continue

            if parse_result["status"] == "error":
                print(f"❌ ERROR: {parse_result['message']}")
                continue

            # Step 2: Backend filters transactions
            parsed_intent = parse_result["parsed_intent"]
            print(f"Intent: {parsed_intent['intent']}")

            # Extract filters for backend
            filters = {
                "merchant_name": parsed_intent.get("merchant_name"),
                "location": parsed_intent.get("location"),
                "category": parsed_intent.get("category"),
                "date_from": parsed_intent.get("date_from"),
                "date_to": parsed_intent.get("date_to")
            }

            results = self.backend.filter_transactions(filters)
            print(f"Found: {len(results)} transactions")

            # Step 3: Format answer
            if results:
                formatted = self.ai_service.format_search_results(
                    query=query,
                    parsed_intent=parsed_intent,
                    results=results
                )
                print(f"\n✅ Answer: {formatted['answer_text']}")
                if formatted['suggestions']:
                    print(f"Suggestions: {', '.join(formatted['suggestions'])}")


    def demo_error_handling(self):
        """Demo: Error handling and fallbacks"""
        print("\n" + "=" * 70)
        print("DEMO 5: ERROR HANDLING & FALLBACKS")
        print("=" * 70)

        print("\nSimulating AI service failure...")

        # Simulate a failed merchant normalization
        pos_string = "UNKNOWN*MERCHANT*12345"

        try:
            # This might fail, but we have fallback
            result = self.error_handler.call_with_retry(
                lambda: self.ai_service.normalize_merchant(pos_string),
                fallback=lambda: FallbackManager.merchant_normalization_fallback(pos_string)
            )

            print(f"\nInput: {pos_string}")
            print(f"Result: {result['canonical_name']}")
            print(f"Confidence: {result['confidence']} (low = fallback was used)")

        except Exception as e:
            print(f"Error: {e}")

    def demo_complete_workflow(self):
        """Demo: Complete end-to-end workflow"""
        print("\n" + "=" * 70)
        print("DEMO 6: COMPLETE WORKFLOW")
        print("=" * 70)
        print("\nSimulating a complete user journey...")

        # Step 1: User makes a new transaction
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

        # Step 2: Normalize merchant name
        print("\n" + "—" * 70)
        print("STEP 2: Normalize merchant name")
        print("—" * 70)

        normalized = self.ai_service.normalize_merchant(new_transaction['pos_string'])
        merchant = normalized['canonical_name']
        print(f"Identified merchant: {merchant}")

        # Step 3: User searches for past transactions
        print("\n" + "—" * 70)
        print("STEP 3: User searches for past coffee purchases")
        print("—" * 70)

        query = "Show me all my coffee purchases"
        parse_result = self.ai_service.process_search_query(query)

        if parse_result["status"] == "success":
            filters = {
                "category": "food",
                "merchant_name": merchant
            }
            results = self.backend.filter_transactions(filters)

            formatted = self.ai_service.format_search_results(
                query=query,
                parsed_intent=parse_result["parsed_intent"],
                results=results
            )

            print(f"\nAnswer: {formatted['answer_text']}")

        # Step 4: View merchant profile
        print("\n" + "—" * 70)
        print("STEP 4: User views merchant profile")
        print("—" * 70)

        stats = self.backend.get_merchant_stats(merchant)
        if stats:
            summary = self.ai_service.generate_merchant_summary(merchant, stats)
            print(f"\nMerchant Profile: {merchant}")
            print(f"Summary: {summary['summary']}")
            print(f"Total visits: {stats['total_transactions']}")
            print(f"Locations: {', '.join(stats['common_locations'])}")

        print("\n✅ Complete workflow finished!")

    def run_all_demos(self):
        """Run all demos in sequence"""
        print("\n")
        print("=" * 70)
        print("  SMART MOBILE AI - COMPLETE DEMONSTRATION")
        print("=" * 70)

        try:
            self.demo_merchant_normalization()
            self.demo_merchant_profile()
            self.demo_nl_search()
            self.demo_error_handling()
            self.demo_complete_workflow()

            print("\n")
            print("=" * 70)
            print("  ALL DEMOS COMPLETED SUCCESSFULLY! ✅")
            print("=" * 70)

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
        print("\nPlease set it:")
        print("  export OPENAI_API_KEY='sk-your-key-here'")
        sys.exit(1)

    # Run the demo
    demo = SmartMobileAIDemo()
    demo.run_all_demos()
