# test_ai_components.py
import pytest
from datetime import datetime, timedelta
from dotenv import load_dotenv

from src.ai.features.merchant_normalizer import MerchantNormalizer
from src.ai.features.query_types import QueryParser, QueryIntent
from src.ai.features.safety_filter import RefusalReason, SafetyFilter

load_dotenv()


from openai import OpenAI
client = OpenAI()

class TestMerchantNormalization:
    """Test suite for merchant normalization"""

    def test_simple_normalization(self):
        """Test basic merchant name extraction"""
        normalizer = MerchantNormalizer(client)

        result = normalizer.normalize("KAUFLAND*7638273 CLUJ")
        assert result.canonical_name == "Kaufland"
        assert result.confidence > 0.8

    def test_paypal_extraction(self):
        """Test extracting merchant from PayPal"""
        normalizer = MerchantNormalizer(client)

        result = normalizer.normalize("PAYPAL *NETFLIX")
        assert result.canonical_name == "Netflix"
        assert "paypal" not in result.canonical_name.lower()

    def test_different_brands_not_merged(self):
        """Ensure different brands stay separate"""
        normalizer = MerchantNormalizer(client)

        petrom = normalizer.normalize("PETROM CLUJ")
        rompetrol = normalizer.normalize("ROMPETROL CLUJ")

        assert petrom.canonical_name != rompetrol.canonical_name


class TestSafetyFilter:
    """Test suite for safety filtering"""

    def test_blocks_advice_queries(self):
        """Ensure advice queries are blocked"""
        safety = SafetyFilter(client)

        blocked_queries = [
            "Should I cancel Netflix?",
            "Is this gym membership worth it?",
            "Help me decide between two phones"
        ]

        for query in blocked_queries:
            reason, message = safety.check_query(query)
            assert reason != RefusalReason.SAFE
            assert message is not None

    def test_allows_info_queries(self):
        """Ensure informational queries pass"""
        safety = SafetyFilter(client)

        safe_queries = [
            "Show me Starbucks payments",
            "Where did I eat last week?",
            "When did I last pay my gym?"
        ]

        for query in safe_queries:
            reason, message = safety.check_query(query)
            assert reason == RefusalReason.SAFE
            assert message is None


class TestQueryParser:
    """Test suite for NL query parsing"""

    def test_merchant_search(self):
        """Test parsing merchant search queries"""
        parser = QueryParser(client)

        result = parser.parse("Show me all Starbucks payments")
        assert result.intent == QueryIntent.SEARCH_BY_MERCHANT
        assert result.merchant_name == "Starbucks"

    def test_date_parsing(self):
        """Test parsing date-based queries"""
        parser = QueryParser(client)

        result = parser.parse("Gas stations in January")
        assert result.intent == QueryIntent.SEARCH_BY_DATE
        assert result.date_from.month == 1
        assert result.category == "gas"