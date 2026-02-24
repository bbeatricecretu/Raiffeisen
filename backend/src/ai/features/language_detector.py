"""
Language Detection for Smart Mobile AI
Automatically detects Romanian or English and maintains language consistency
"""
from dotenv import load_dotenv
load_dotenv()

from typing import Literal
from openai import OpenAI
import re

Language = Literal["ro", "en"]


class LanguageDetector:
    """
    Detects whether user input is in Romanian or English
    Uses multiple detection methods for high accuracy
    """

    # Common Romanian words (including diacritics)
    ROMANIAN_MARKERS = [
        # Romanian specific words
        'și', 'la', 'pe', 'cu', 'în', 'de', 'pentru', 'acest', 'acesta',
        'unde', 'când', 'cât', 'care', 'cum', 'ce', 'într',
        # Romanian verbs
        'vreau', 'sunt', 'fac', 'văd', 'arată', 'găsesc', 'am',
        # Questions in Romanian
        'unde', 'când', 'cât', 'cum', 'care',
        # Transaction related Romanian
        'plată', 'plăți', 'tranzacție', 'tranzacții', 'magazin',
        'ultimul', 'ultima', 'ultimele', 'arată-mi', 'arata-mi',
        'cheltuieli', 'cheltuit', 'benzinărie', 'benzinarii',
        'toate', 'mâncat', 'mancat', 'sală', 'sala'
    ]

    # Common English words
    ENGLISH_MARKERS = [
        'show', 'find', 'search', 'when', 'where', 'what', 'how',
        'last', 'all', 'my', 'payment', 'transaction', 'the', 'a', 'an',
        'spent', 'gas', 'station', 'restaurant', 'gym'
    ]

    # Romanian diacritics - most reliable indicator
    ROMANIAN_CHARS = set('ăâîșțĂÂÎȘŢ')

    def __init__(self, client: OpenAI = None):
        """
        Initialize language detector

        Args:
            client: Optional OpenAI client for AI-based detection fallback
        """
        self.client = client

    def detect(self, text: str) -> Language:
        """
        Detect language from text using multiple methods

        Args:
            text: User input text

        Returns:
            "ro" for Romanian, "en" for English
        """
        if not text or len(text.strip()) == 0:
            return "en"  # Default to English for empty input

        text_lower = text.lower()

        # Method 1: Check for Romanian diacritics (most reliable)
        if any(char in self.ROMANIAN_CHARS for char in text):
            return "ro"

        # Method 2: Count Romanian vs English markers
        ro_score = sum(1 for word in self.ROMANIAN_MARKERS if word in text_lower)
        en_score = sum(1 for word in self.ENGLISH_MARKERS if word in text_lower)

        if ro_score > en_score:
            return "ro"
        elif en_score > ro_score:
            return "en"

        # Method 3: Check for Romanian-specific patterns
        if self._has_romanian_patterns(text_lower):
            return "ro"

        # Method 4: Use AI for ambiguous cases (only if client available)
        if self.client and ro_score == en_score:
            return self._ai_detect(text)

        # Default to English if can't determine
        return "en"

    def _has_romanian_patterns(self, text: str) -> bool:
        """
        Check for Romanian-specific grammatical patterns

        Args:
            text: Lowercase text

        Returns:
            True if Romanian patterns detected
        """
        romanian_patterns = [
            r'\b(arata|aratami|aratați)\b',  # Romanian "show"
            r'\b(unde|cand|cat|cum)\b',  # Romanian question words
            r'\b(toate|toata|toti)\b',  # Romanian "all"
            r'\b(ultima|ultimul|ultimele)\b',  # Romanian "last"
            r'\b(cheltuit|cheltuieli)\b',  # Romanian "spent/expenses"
        ]

        return any(re.search(pattern, text) for pattern in romanian_patterns)

    def _ai_detect(self, text: str) -> Language:
        """
        Use AI to detect language for ambiguous cases

        Args:
            text: User input text

        Returns:
            "ro" or "en"
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a language detector. Reply with ONLY 'ro' for Romanian or 'en' for English. No other text."
                    },
                    {
                        "role": "user",
                        "content": f"What language is this text in? Text: {text}"
                    }
                ],
                temperature=0.0,
                max_tokens=5
            )

            result = response.choices[0].message.content.strip().lower()

            if 'ro' in result:
                return "ro"
            elif 'en' in result:
                return "en"

        except Exception as e:
            print(f"AI language detection failed: {e}")

        # Default to English on error
        return "en"

    def get_language_name(self, lang_code: Language) -> str:
        """Get full language name from code"""
        return "Romanian" if lang_code == "ro" else "English"


# Romanian translations for common UI elements
TRANSLATIONS = {
    "ro": {
        # Time expressions
        "today": "astăzi",
        "yesterday": "ieri",
        "this_week": "săptămâna aceasta",
        "last_week": "săptămâna trecută",
        "this_month": "luna aceasta",
        "last_month": "luna trecută",

        # Common phrases
        "found": "Am găsit",
        "total": "Total",
        "transactions": "tranzacții",
        "at": "la",
        "in": "în",
        "visits": "vizite",
        "spent": "cheltuit",

        # Suggestions
        "view_profile": "Vezi profilul",
        "filter_by_category": "Filtrează după categorie",
        "filter_by_location": "Filtrează după locație",
        "filter_by_date": "Filtrează după dată",

        # Empty results
        "no_transactions": "Nu am găsit tranzacții",
        "try_different": "Încearcă criterii diferite",
    },
    "en": {
        # Time expressions
        "today": "today",
        "yesterday": "yesterday",
        "this_week": "this week",
        "last_week": "last week",
        "this_month": "this month",
        "last_month": "last month",

        # Common phrases
        "found": "Found",
        "total": "Total",
        "transactions": "transactions",
        "at": "at",
        "in": "in",
        "visits": "visits",
        "spent": "spent",

        # Suggestions
        "view_profile": "View profile",
        "filter_by_category": "Filter by category",
        "filter_by_location": "Filter by location",
        "filter_by_date": "Filter by date",

        # Empty results
        "no_transactions": "No transactions found",
        "try_different": "Try different criteria",
    }
}


def translate(key: str, language: Language) -> str:
    """
    Get translation for a key in the specified language

    Args:
        key: Translation key
        language: "ro" or "en"

    Returns:
        Translated string
    """
    return TRANSLATIONS.get(language, TRANSLATIONS["en"]).get(key, key)


