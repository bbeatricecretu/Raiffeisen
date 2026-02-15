# query_types.py
from dotenv import load_dotenv
from src.ai.prompts.prompts import PromptLibrary, PromptType
load_dotenv()

from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import date
from openai import OpenAI
import json

class QueryIntent(Enum):
    SEARCH_BY_MERCHANT = "search_merchant"  # "Show me Starbucks payments"
    SEARCH_BY_LOCATION = "search_location"  # "Where did I eat in Cluj?"
    SEARCH_BY_DATE = "search_date"  # "Last month's gas stations"
    SEARCH_BY_CATEGORY = "search_category"  # "All entertainment spending"
    LAST_TRANSACTION = "last_transaction"  # "When did I last pay insurance?"
    FREQUENCY_QUERY = "frequency"  # "How often do I go to gym?"
    UNSUPPORTED = "unsupported"  # "Should I buy a car?" (financial advice)


class ParsedQuery(BaseModel):
    """Structured output from NL query"""
    intent: QueryIntent
    merchant_name: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    filters: Dict[str, Any] = {}
    confidence: float = Field(0.75, ge=0.0, le=1.0)
    original_query: str


class QueryParser:
    def __init__(self, client: OpenAI):
        self.client = client

    def parse(self, user_query: str) -> ParsedQuery:
        """Parse natural language into structured query"""

        # Safety check first
        if self._is_advice_seeking(user_query):
            return ParsedQuery(
                intent=QueryIntent.UNSUPPORTED,
                confidence=1.0,
                original_query=user_query
            )

        prompt = f"""Parse this natural language query into a structured database query:

User query: "{user_query}"

Supported intents:
- search_merchant: Finding transactions with specific merchant
- search_location: Finding transactions in a city/area
- search_date: Finding transactions in a time period
- search_category: Finding transactions by type (food, gas, entertainment, etc.)
- last_transaction: Finding when user last paid a merchant
- frequency: How often user visits a merchant
- unsupported: Requests for advice, predictions, or analysis

Examples:
"Show me Starbucks payments" → {{"intent": "search_merchant", "merchant_name": "Starbucks"}}
"Where did I eat in Cluj?" → {{"intent": "search_location", "location": "Cluj", "category": "food"}}
"Last month's gas stations" → {{"intent": "search_date", "date_from": "2025-01-01", "date_to": "2025-01-31", "category": "gas"}}

Return JSON with:
- intent (from list above)
- merchant_name (if mentioned)
- location (if mentioned)
- category (if mentioned)
- date_from/date_to (ISO format if mentioned)
- confidence (0-1)


JSON only, no other text."""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": PromptLibrary.get_prompt(PromptType.NL_QUERY_PARSER)},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,  # Deterministic parsing
            max_tokens=200
        )

        result_json = json.loads(response.choices[0].message.content)
        result_json['original_query'] = user_query

        if result_json.get("date_from") or result_json.get("date_to"):
            result_json["intent"] = QueryIntent.SEARCH_BY_DATE.value

        return ParsedQuery(**result_json)

    def _is_advice_seeking(self, query: str) -> bool:
        """Detect if user is asking for financial advice"""
        advice_keywords = [
            'should i', 'what should', 'recommend', 'advice',
            'is it worth', 'better to', 'help me decide',
            'which one', 'compare', 'pros and cons'
        ]
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in advice_keywords)
