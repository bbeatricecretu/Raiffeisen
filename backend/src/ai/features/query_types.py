# query_types.py
"""
Query Parser with Romanian Language Support
Parses natural language queries in both Romanian and English
"""

from dotenv import load_dotenv
from src.ai.prompts.prompts import PromptLibrary, PromptType

load_dotenv()

from enum import Enum
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from datetime import date
from openai import OpenAI
import json

# Import language detector
from src.ai.features.language_detector import LanguageDetector, Language


class QueryIntent(Enum):
    SEARCH_BY_MERCHANT = "search_merchant"  # "Show me Starbucks payments" / "Arată-mi plățile la Starbucks"
    SEARCH_BY_LOCATION = "search_location"  # "Where did I eat in Cluj?" / "Unde am mâncat în Cluj?"
    SEARCH_BY_DATE = "search_date"  # "Last month's gas stations" / "Benzinăriile luna trecută"
    SEARCH_BY_CATEGORY = "search_category"  # "All entertainment spending" / "Toate cheltuielile de divertisment"
    LAST_TRANSACTION = "last_transaction"  # "When did I last pay insurance?" / "Când am plătit ultima dată asigurarea?"
    FREQUENCY_QUERY = "frequency"  # "How often do I go to gym?" / "Cât de des merg la sală?"
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
    language: Language = "en"  # NEW: Track detected language


class QueryParser:
    def __init__(self, client: OpenAI):
        self.client = client
        self.language_detector = LanguageDetector(client)  # NEW: Add language detector

    def parse(self, user_query: str) -> ParsedQuery:
        """Parse natural language into structured query (supports Romanian and English)"""

        # NEW: Detect language first
        language = self.language_detector.detect(user_query)

        # Safety check first (now language-aware)
        if self._is_advice_seeking(user_query, language):
            return ParsedQuery(
                intent=QueryIntent.UNSUPPORTED,
                confidence=1.0,
                original_query=user_query,
                language=language  # NEW
            )

        # MODIFIED: Create language-aware prompt
        prompt = self._create_parsing_prompt(user_query, language)

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self._get_system_prompt(language)},  # MODIFIED
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,  # Deterministic parsing
            max_tokens=200
        )

        result_json = json.loads(response.choices[0].message.content)
        result_json['original_query'] = user_query
        result_json['language'] = language  # NEW: Add language to result

        if result_json.get("date_from") or result_json.get("date_to"):
            result_json["intent"] = QueryIntent.SEARCH_BY_DATE.value

        return ParsedQuery(**result_json)

    def _get_system_prompt(self, language: Language) -> str:
        """Get language-appropriate system prompt"""

        if language == "ro":
            # Romanian system prompt
            return """Tu ești un parser de interogări în limbaj natural pentru tranzacții bancare.

Sarcina ta: Convertește interogarea utilizatorului în JSON structurat.

Returnează DOAR JSON valid cu:
- intent: unul din ["search_merchant", "search_location", "search_date", "search_category", "last_transaction", "frequency", "unsupported"]
- merchant_name: string | null (numele magazinului/comerciantului)
- location: string | null (orașul/zona)
- category: string | null (retail, food, gas, service, entertainment, other)
- date_from: data în format ISO | null
- date_to: data în format ISO | null
- confidence: număr între 0 și 1

Reguli:
- Doar JSON.
- Dacă informația lipsește, folosește null.
- Nu inventa date."""
        else:
            # English system prompt (original)
            return PromptLibrary.get_prompt(PromptType.NL_QUERY_PARSER)

    def _create_parsing_prompt(self, user_query: str, language: Language) -> str:
        """Create language-specific parsing prompt"""

        if language == "ro":
            # Romanian prompt with Romanian examples
            return f"""Parsează această interogare în limbaj natural într-o interogare structurată:

Interogare utilizator: "{user_query}"

Intenții suportate:
- search_merchant: Căutare tranzacții cu un anumit comerciant
- search_location: Căutare tranzacții într-un oraș/zonă
- search_date: Căutare tranzacții într-o perioadă de timp
- search_category: Căutare tranzacții după tip (mâncare, benzină, divertisment, etc.)
- last_transaction: Găsirea ultimei plăți la un comerciant
- frequency: Cât de des vizitează utilizatorul un comerciant
- unsupported: Cereri de sfaturi, predicții sau analiză

Exemple:
"Arată-mi plățile la Starbucks" → {{"intent": "search_merchant", "merchant_name": "Starbucks"}}
"Unde am mâncat în Cluj?" → {{"intent": "search_location", "location": "Cluj", "category": "food"}}
"Benzinăriile luna trecută" → {{"intent": "search_date", "date_from": "2025-01-01", "date_to": "2025-01-31", "category": "gas"}}
"Cât am cheltuit la sală?" → {{"intent": "frequency", "category": "fitness"}}

Returnează JSON cu:
- intent (din lista de mai sus)
- merchant_name (dacă este menționat)
- location (dacă este menționat)
- category (dacă este menționat)
- date_from/date_to (format ISO dacă este menționat)
- confidence (0-1)

Doar JSON, fără alt text."""
        else:
            # English prompt (original)
            return f"""Parse this natural language query into a structured database query:

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

    def _is_advice_seeking(self, query: str, language: Language) -> bool:
        """Detect if user is asking for financial advice (language-aware)"""

        query_lower = query.lower()

        if language == "ro":
            # Romanian advice keywords
            advice_keywords = [
                'ar trebui să', 'ce ar trebui', 'recomandă', 'sfat',
                'merită', 'mai bine să', 'ajută-mă să decid',
                'care', 'compară', 'pro și contra', 'avantaje și dezavantaje'
            ]
        else:
            # English advice keywords (original)
            advice_keywords = [
                'should i', 'what should', 'recommend', 'advice',
                'is it worth', 'better to', 'help me decide',
                'which one', 'compare', 'pros and cons'
            ]

        return any(keyword in query_lower for keyword in advice_keywords)
