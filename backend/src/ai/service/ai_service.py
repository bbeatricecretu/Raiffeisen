# ai_service.py
"""
AI Service - Main Integration Layer
This is the single entry point for all AI functionality
Backend engineer calls this, not individual AI components
"""
import os

from dotenv import load_dotenv

from src.ai.features.answer_formatter import AnswerFormatter, ParsedQuery, Transaction
from src.ai.features.merchant_normalizer import MerchantNormalizer
from src.ai.features.merchant_summarizer import MerchantSummarizer, TransactionStats
from src.ai.features.query_types import QueryParser
from src.ai.features.safety_filter import SafetyFilter, RefusalReason

load_dotenv()

from typing import Dict, List, Optional, Any
from openai import OpenAI
from pydantic import BaseModel
import logging
from datetime import datetime


# Import all AI components
# (In production, these would be from separate modules)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIServiceConfig(BaseModel):
    """Configuration for AI service"""
    openai_api_key: str
    default_model: str = "gpt-4o-mini"
    enable_cache: bool = True
    enable_safety_filter: bool = True
    max_retries: int = 3
    timeout_seconds: float = 5.0


class AIService:
    """
    Main AI Service - Single entry point for all AI functionality

    This class orchestrates all AI components and provides clean APIs
    for the backend engineer to use.
    """

    def __init__(self, config: Optional[AIServiceConfig] = None):
        """
        Initialize AI service with all components

        Args:
            config: Optional configuration. If not provided, reads from environment
        """
        # Setup config
        if config is None:
            config = AIServiceConfig(
                openai_api_key=os.getenv("OPENAI_API_KEY", ""),
                default_model=os.getenv("AI_MODEL", "gpt-4o-mini"),
                enable_cache=os.getenv("AI_ENABLE_CACHE", "true").lower() == "true",
                enable_safety_filter=os.getenv("AI_ENABLE_SAFETY", "true").lower() == "true"
            )

        self.config = config

        # Initialize OpenAI client
        self.client = OpenAI(
            api_key=config.openai_api_key,
            timeout=config.timeout_seconds
        )

        # Initialize all AI components
        logger.info("Initializing AI components...")
        self.normalizer = MerchantNormalizer(self.client)
        self.summarizer = MerchantSummarizer(self.client)
        self.parser = QueryParser(self.client)
        self.safety = SafetyFilter(self.client)
        self.formatter = AnswerFormatter(self.client)

        logger.info("AI Service initialized successfully")

    # ===================================================================
    # PUBLIC API ENDPOINTS - Backend calls these
    # ===================================================================

    def normalize_merchant(self, pos_string: str) -> Dict[str, Any]:
        """
        API Endpoint: POST /api/ai/normalize-merchant

        Normalize a messy POS transaction string to identify the real merchant

        Args:
            pos_string: Raw POS string (e.g., "KAUFLAND*7638273 CLUJ")

        Returns:
            {
                "canonical_name": "Kaufland",
                "brand": "Kaufland",
                "confidence": 0.95,
                "merchant_type": "retail",
                "reasoning": "Recognized Kaufland retailer pattern"
            }

        Example:
            result = ai_service.normalize_merchant("PAYPAL *NETFLIX")
            # Returns: {"canonical_name": "Netflix", ...}
        """
        try:
            logger.info(f"Normalizing merchant: {pos_string}")

            result = self.normalizer.normalize(pos_string)

            logger.info(f"Normalized to: {result.canonical_name} (confidence: {result.confidence})")

            return result.model_dump()

        except Exception as e:
            logger.error(f"Merchant normalization failed: {e}")
            # Return low-confidence result rather than failing completely
            return {
                "canonical_name": pos_string,
                "brand": pos_string,
                "confidence": 0.0,
                "merchant_type": "unknown",
                "reasoning": f"Normalization failed: {str(e)}"
            }

    def generate_merchant_summary(self,
                                  merchant_name: str,
                                  transaction_stats: Dict[str, Any]) -> Dict[str, Any]:
        """
        API Endpoint: POST /api/ai/merchant-summary

        Generate a 220-character summary for merchant profile page

        Args:
            merchant_name: Normalized merchant name
            transaction_stats: Dictionary with keys:
                - total_transactions: int
                - first_transaction: datetime or ISO string
                - last_transaction: datetime or ISO string
                - common_locations: List[str]
                - transaction_amounts: List[float]
                - weekday_distribution: Dict[str, int]

        Returns:
            {
                "summary": "Your go-to coffee shop - 18 visits this month...",
                "tone": "warm",
                "contains_advice": false
            }

        Example:
            result = ai_service.generate_merchant_summary(
                merchant_name="Starbucks",
                transaction_stats={...}
            )
        """
        try:
            logger.info(f"Generating summary for: {merchant_name}")

            # Convert dict to TransactionStats model
            stats = self._dict_to_transaction_stats(merchant_name, transaction_stats)

            result = self.summarizer.generate_summary(stats)

            logger.info(f"Generated summary: {result.summary[:50]}...")

            return result.model_dump()

        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            # Return safe fallback
            return {
                "summary": f"Transaction history with {merchant_name}",
                "tone": "neutral",
                "contains_advice": False
            }

    def process_search_query(self, query: str) -> Dict[str, Any]:
        """
        API Endpoint: POST /api/ai/search

        Process a natural language search query

        This is a multi-step process:
        1. Safety check (block financial advice)
        2. Parse query to structured filters
        3. Backend applies filters and returns results
        4. Format results into natural language answer

        Args:
            query: Natural language query from user

        Returns:
            {
                "status": "success" | "refused" | "error",
                "parsed_intent": {...},  # Structured query for backend
                "refusal_message": "...",  # If refused
                "error": "..."  # If error
            }

        Example:
            result = ai_service.process_search_query("Show me gas stations in Cluj")
            # Backend then uses result["parsed_intent"] to filter transactions
        """
        try:
            logger.info(f"Processing search query: {query}")

            # Step 1: Safety check
            if self.config.enable_safety_filter:
                safety_result, refusal_msg = self.safety.check_query(query)

                if safety_result != RefusalReason.SAFE:
                    logger.warning(f"Query blocked: {safety_result.value}")
                    return {
                        "status": "refused",
                        "reason": safety_result.value,
                        "message": refusal_msg
                    }

            # Step 2: Parse query into structured filters
            parsed = self.parser.parse(query)

            logger.info(f"Parsed intent: {parsed.intent}")

            # Return parsed query for backend to use
            return {
                "status": "success",
                "parsed_intent": parsed.model_dump(),
                "message": "Query parsed successfully. Backend should now filter transactions."
            }

        except Exception as e:
            logger.error(f"Search query processing failed: {e}")
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to process your search. Please try again."
            }

    def format_search_results(self,
                              query: str,
                              parsed_intent: Dict[str, Any],
                              results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        API Endpoint: POST /api/ai/format-results

        Format search results into natural language answer

        This is Step 4 of the search process (after backend filters transactions)

        Args:
            query: Original natural language query
            parsed_intent: The parsed query from process_search_query
            results: List of transaction dicts from backend

        Returns:
            {
                "answer_text": "You ate at 3 places in Cluj...",
                "summary_stats": {...},
                "suggestions": ["View merchant profile", ...]
            }

        Example:
            formatted = ai_service.format_search_results(
                query="Where did I eat in Cluj?",
                parsed_intent={...},
                results=[...]
            )
        """
        try:
            logger.info(f"Formatting {len(results)} results for query: {query}")

            # Convert dicts to models
            parsed = ParsedQuery(**parsed_intent)
            transactions = [self._dict_to_transaction(t) for t in results]

            # Format answer
            answer = self.formatter.format_answer(query, parsed, transactions)

            logger.info(f"Answer: {answer.answer_text[:50]}...")

            return answer.model_dump()

        except Exception as e:
            logger.error(f"Result formatting failed: {e}")
            return {
                "answer_text": f"Found {len(results)} transactions.",
                "summary_stats": {"total_transactions": len(results)},
                "suggestions": []
            }

    # ===================================================================
    # HELPER METHODS - Internal use only
    # ===================================================================

    def _dict_to_transaction_stats(self,
                                   merchant_name: str,
                                   stats_dict: Dict[str, Any]) -> TransactionStats:
        """Convert dict to TransactionStats model"""

        # Handle datetime conversion
        first_transaction = stats_dict.get("first_transaction")
        if isinstance(first_transaction, str):
            first_transaction = datetime.fromisoformat(first_transaction)

        last_transaction = stats_dict.get("last_transaction")
        if isinstance(last_transaction, str):
            last_transaction = datetime.fromisoformat(last_transaction)

        return TransactionStats(
            merchant_name=merchant_name,
            total_transactions=stats_dict.get("total_transactions", 0),
            first_transaction=first_transaction,
            last_transaction=last_transaction,
            common_locations=stats_dict.get("common_locations", []),
            transaction_amounts=stats_dict.get("transaction_amounts", []),
            weekday_distribution=stats_dict.get("weekday_distribution", {})
        )

    def _dict_to_transaction(self, trans_dict: Dict[str, Any]) -> Transaction:
        """Convert dict to Transaction model"""

        # Handle datetime conversion
        date = trans_dict.get("date")
        if isinstance(date, str):
            date = datetime.fromisoformat(date)

        return Transaction(
            id=trans_dict.get("id", ""),
            merchant_name=trans_dict.get("merchant_name", ""),
            amount=trans_dict.get("amount", 0.0),
            currency=trans_dict.get("currency", "RON"),
            location=trans_dict.get("location", ""),
            date=date,
            category=trans_dict.get("category", "")
        )

    def health_check(self) -> Dict[str, Any]:
        """
        API Endpoint: GET /api/ai/health

        Check if AI service is healthy and responding

        Returns:
            {
                "status": "healthy" | "unhealthy",
                "components": {
                    "openai": true,
                    "normalizer": true,
                    ...
                }
            }
        """
        try:
            # Test OpenAI connection with minimal call
            test_response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=5,
                timeout=2.0
            )

            openai_healthy = bool(test_response)

            return {
                "status": "healthy" if openai_healthy else "unhealthy",
                "components": {
                    "openai": openai_healthy,
                    "normalizer": True,
                    "summarizer": True,
                    "parser": True,
                    "safety": True,
                    "formatter": True,
                    "auth_context": True
                },
                "config": {
                    "model": self.config.default_model,
                    "cache_enabled": self.config.enable_cache,
                    "safety_enabled": self.config.enable_safety_filter
                }
            }

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }

