"""
Safety Filter with Romanian Language Support
Blocks financial advice queries in both Romanian and English
"""

from dotenv import load_dotenv

load_dotenv()

from typing import Tuple, Optional
from enum import Enum
from openai import OpenAI
import json
import re

# Import language detector
from src.ai.features.language_detector import LanguageDetector, Language


class RefusalReason(Enum):
    FINANCIAL_ADVICE = "financial_advice"
    INVESTMENT_QUERY = "investment"
    LOAN_ADVICE = "loan_advice"
    PURCHASE_RECOMMENDATION = "purchase_rec"
    BUDGET_INSTRUCTION = "budget_instruction"
    SAFE = "safe"


class SafetyFilter:
    """Multi-layer safety system (supports Romanian and English)"""

    # Layer 1: Keyword blocklist (English)
    FORBIDDEN_KEYWORDS_EN = [
        'should i buy', 'should i invest', 'recommend',
        'advice on', 'help me decide', 'which is better',
        'worth it', 'good deal', 'bad deal',
        'should i spend', 'should i save', 'budget advice'
    ]

    # Layer 1: Keyword blocklist (Romanian)
    FORBIDDEN_KEYWORDS_RO = [
        'ar trebui să cumpăr', 'ar trebui să investesc', 'recomandă',
        'sfat despre', 'ajută-mă să decid', 'care este mai bun',
        'merită', 'ofertă bună', 'ofertă proastă',
        'ar trebui să cheltuiesc', 'ar trebui să economisesc', 'sfat bugetar'
    ]

    # Layer 2: Intent patterns (English)
    FORBIDDEN_PATTERNS_EN = [
        r'should\s+i\s+\w+',  # "should I ..."
        r'is\s+it\s+worth',  # "is it worth ..."
        r'help\s+me\s+(decide|choose)',  # "help me decide/choose ..."
    ]

    # Layer 2: Intent patterns (Romanian)
    FORBIDDEN_PATTERNS_RO = [
        r'ar\s+trebui\s+să\s+\w+',  # "ar trebui să ..."
        r'merită\s+(să|)',  # "merită (să) ..."
        r'ajută-mă\s+să\s+(decid|aleg)',  # "ajută-mă să decid/aleg ..."
    ]

    def __init__(self, client: OpenAI):
        self.client = client
        self.language_detector = LanguageDetector(client)  # NEW: Add language detector

    def check_query(self, query: str) -> Tuple[RefusalReason, Optional[str]]:
        """
        Check if query is asking for financial advice (language-aware)

        Returns: (reason, refusal_message)
        If reason is SAFE, refusal_message is None
        """

        # NEW: Detect language first
        language = self.language_detector.detect(query)

        query_lower = query.lower()

        # Layer 1: Fast keyword check (check both languages for safety)
        all_keywords = self.FORBIDDEN_KEYWORDS_EN + self.FORBIDDEN_KEYWORDS_RO
        for keyword in all_keywords:
            if keyword in query_lower:
                return (
                    RefusalReason.FINANCIAL_ADVICE,
                    self._generate_refusal(query, RefusalReason.FINANCIAL_ADVICE, language)
                )

        # Layer 2: Pattern matching (check both languages)
        all_patterns = self.FORBIDDEN_PATTERNS_EN + self.FORBIDDEN_PATTERNS_RO
        for pattern in all_patterns:
            if re.search(pattern, query_lower):
                return (
                    RefusalReason.FINANCIAL_ADVICE,
                    self._generate_refusal(query, RefusalReason.FINANCIAL_ADVICE, language)
                )

        # Layer 3: LLM-based intent classification (language-aware)
        llm_result = self._llm_safety_check(query, language)
        if llm_result != RefusalReason.SAFE:
            return (
                llm_result,
                self._generate_refusal(query, llm_result, language)
            )

        return (RefusalReason.SAFE, None)

    def _llm_safety_check(self, query: str, language: Language) -> RefusalReason:
        """Use LLM to classify intent (language-aware)"""

        if language == "ro":
            # Romanian safety check prompt
            prompt = f"""Clasifică intenția acestei interogări:

Interogare: "{query}"

Întreabă despre:
- financial_advice: "Ar trebui să cumpăr X?", "Este o ofertă bună?"
- investment: "Ar trebui să investesc în Y?"
- loan_advice: "Ar trebui să iau un împrumut pentru Z?"
- purchase_rec: "Ce produs ar trebui să cumpăr?"
- budget_instruction: "Ajută-mă să reduc cheltuielile pentru X"
- safe: Doar întreabă despre tranzacții anterioare

Returnează JSON: {{"intent": "una_din_cele_de_mai_sus", "reasoning": "de_ce"}}"""
        else:
            # English safety check prompt (original)
            prompt = f"""Classify this query's intent:

Query: "{query}"

Is this asking for:
- financial_advice: "Should I buy X?", "Is this a good deal?"
- investment: "Should I invest in Y?"
- loan_advice: "Should I take a loan for Z?"
- purchase_rec: "Which product should I buy?"
- budget_instruction: "Help me reduce spending on X"
- safe: Just asking about past transactions

Return JSON: {{"intent": "one_of_above", "reasoning": "why"}}"""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self._get_safety_system_prompt(language)},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
            max_tokens=100
        )

        result = json.loads(response.choices[0].message.content)
        intent_str = result.get("intent", "safe")

        # Map to enum
        intent_map = {
            "financial_advice": RefusalReason.FINANCIAL_ADVICE,
            "investment": RefusalReason.INVESTMENT_QUERY,
            "loan_advice": RefusalReason.LOAN_ADVICE,
            "purchase_rec": RefusalReason.PURCHASE_RECOMMENDATION,
            "budget_instruction": RefusalReason.BUDGET_INSTRUCTION,
            "safe": RefusalReason.SAFE
        }

        return intent_map.get(intent_str, RefusalReason.SAFE)

    def _get_safety_system_prompt(self, language: Language) -> str:
        """Get language-appropriate safety system prompt"""

        if language == "ro":
            return "Ești un clasificator de siguranță pentru o aplicație bancară. Detectează cereri de sfaturi financiare."
        else:
            return "You are a safety classifier for a banking app."

    def _generate_refusal(self, query: str, reason: RefusalReason, language: Language) -> str:
        """Generate helpful refusal message (language-aware)"""

        if language == "ro":
            # Romanian refusal templates
            templates = {
                RefusalReason.FINANCIAL_ADVICE:
                    "Pot să-ți arăt tranzacțiile anterioare, dar nu pot oferi sfaturi financiare. "
                    "Te pot ajuta să găsești plăți specifice sau să vezi modele de cheltuieli - doar întreabă!",

                RefusalReason.INVESTMENT_QUERY:
                    "Nu pot oferi sfaturi de investiții. Pot să-ți arăt istoricul tranzacțiilor "
                    "sau să te ajut să cauți plăți specifice. Ce ai dori să vezi?",

                RefusalReason.PURCHASE_RECOMMENDATION:
                    "Nu pot recomanda ce să cumperi, dar pot să-ți arăt unde ai cumpărat înainte "
                    "sau modelele tale de cheltuieli în diferite categorii. Te-ar ajuta?",

                RefusalReason.BUDGET_INSTRUCTION:
                    "Nu pot să-ți spun cum să-ți gestionezi bugetul, dar pot să-ți arăt modelele de cheltuieli "
                    "și istoricul tranzacțiilor. Încearcă să întrebi despre comercianți sau perioade specifice!"
            }
        else:
            # English refusal templates (original)
            templates = {
                RefusalReason.FINANCIAL_ADVICE:
                    "I can show you your past transactions, but I can't provide financial advice. "
                    "I can help you find specific payments or see your spending patterns - just ask!",

                RefusalReason.INVESTMENT_QUERY:
                    "I can't provide investment advice. I can show you your transaction history "
                    "or help you search for specific payments. What would you like to see?",

                RefusalReason.PURCHASE_RECOMMENDATION:
                    "I can't recommend what to buy, but I can show you where you've shopped before "
                    "or your spending patterns in different categories. Would that help?",

                RefusalReason.BUDGET_INSTRUCTION:
                    "I can't tell you how to manage your budget, but I can show you your spending "
                    "patterns and transaction history. Try asking about specific merchants or time periods!"
            }

        return templates.get(reason, templates[RefusalReason.FINANCIAL_ADVICE])
