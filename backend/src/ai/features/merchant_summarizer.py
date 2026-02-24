"""
Merchant Summarizer with Romanian Language Support
Generates merchant summaries in Romanian or English
"""

import json
from dotenv import load_dotenv
from src.ai.prompts.prompts import PromptLibrary, PromptType

load_dotenv()

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Literal
from datetime import datetime
from openai import OpenAI

# Import language type
from src.ai.features.language_detector import Language

class TransactionStats(BaseModel):
    """Input data for summary generation"""
    merchant_name: str
    total_transactions: int
    first_transaction: datetime
    last_transaction: datetime
    common_locations: List[str]
    transaction_amounts: List[float]
    weekday_distribution: Dict[str, int]  # Mon: 5, Tue: 2, etc.


class MerchantSummary(BaseModel):
    """Output schema with strict validation"""
    summary: str = Field(..., max_length=220)
    tone: str = Field(..., description="neutral|warm|factual")
    contains_advice: bool = Field(..., description="Safety flag - must be False")
    language: Language = "en"  # NEW: Track summary language

    @field_validator('summary')
    def validate_no_advice(cls, v):
        """CRITICAL: Block any financial advice (in both languages)"""

        # English forbidden phrases
        forbidden_en = [
            'should', 'consider', 'recommend', 'suggest',
            'try to', 'could save', 'reduce', 'increase',
            'better to', 'avoid', 'limit'
        ]

        # Romanian forbidden phrases
        forbidden_ro = [
            'ar trebui', 'consideră', 'recomand', 'sugerez',
            'încearcă să', 'ai putea economisi', 'reduce', 'crește',
            'mai bine să', 'evită', 'limitează'
        ]

        v_lower = v.lower()

        # Check both languages
        all_forbidden = forbidden_en + forbidden_ro
        for phrase in all_forbidden:
            if phrase in v_lower:
                raise ValueError(f"Summary contains forbidden advice phrase: '{phrase}'")

        return v


class MerchantSummarizer:
    def __init__(self, client: OpenAI):
        self.client = client

    def generate_summary(self, stats: TransactionStats, language: Language = "en") -> MerchantSummary:
        """
        Generate factual, neutral summary in the specified language

        Args:
            stats: Transaction statistics
            language: "ro" for Romanian, "en" for English

        Returns:
            MerchantSummary in the requested language
        """

        # Build context from stats
        context = self._build_context(stats)

        # Create language-specific prompt
        if language == "ro":
            prompt = self._create_romanian_prompt(context)
        else:
            prompt = self._create_english_prompt(context)

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": self._get_system_prompt(language)},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Slightly creative but consistent
            max_tokens=150
        )

        result_json = json.loads(response.choices[0].message.content)
        result_json['language'] = language  # Add language to result
        summary = MerchantSummary(**result_json)

        # Double-check safety
        if summary.contains_advice:
            raise ValueError("AI generated advisory content - rejecting")

        return summary

    def _get_system_prompt(self, language: Language) -> str:
        """Get language-appropriate system prompt"""

        if language == "ro":
            return """Tu scrii rezumate pentru tranzacții.

REGULI CRITICE:
- Maximum 220 caractere
- FĂRĂ sfaturi financiare (nu spune niciodată "ar trebui", "consideră", "încearcă să")
- FĂRĂ limbaj de judecată
- Concentrează-te pe FAPTE: frecvență, locații, modele temporale

Bine: "Cafeneaua ta obișnuită - 12 vizite luna aceasta, de obicei dimineața în centrul Cluj-ului"
Rău: "Ar trebui să reduci cheltuielile cu cafeaua" (INTERZIS - aceasta este sfat)

Returnează doar rezumate factuale, neutre."""
        else:
            return PromptLibrary.get_prompt(PromptType.MERCHANT_SUMMARY)

    def _create_romanian_prompt(self, context: str) -> str:
        """Create Romanian summary generation prompt"""

        return f"""Generează un rezumat pentru comerciant bazat pe aceste date:

{context}

CERINȚE:
- Maximum 220 caractere (limită strictă)
- Ton neutru, factual
- FĂRĂ cuvinte de sfat: ar trebui, consideră, recomand, încearcă să, reduce, etc.
- Concentrează-te pe modele: frecvență, timing, locații

Exemple BUNE:
- "Cafeneaua ta preferată - 18 vizite luna aceasta, majoritatea dimineața în zilele săptămânii în centrul Cluj-ului"
- "Benzinărie aproape de muncă - alimentat de 6 ori, de obicei joia"
- "Plată abonament lunar - reînnoit automat pe 15 timp de 3 luni"

Exemple RELE (INTERZISE):
- "Ar trebui să reduci cheltuielile cu cafeaua" ❌ SFAT
- "Consideră să treci la o sală mai ieftină" ❌ SFAT
- "Încearcă să limitezi vizitele la restaurante" ❌ SFAT

Returnează JSON cu summary, tone și contains_advice flag."""

    def _create_english_prompt(self, context: str) -> str:
        """Create English summary generation prompt (original)"""

        return f"""Generate a merchant summary based on these facts:

{context}

REQUIREMENTS:
- Maximum 220 characters (strict limit)
- Neutral, factual tone only
- NO advice words: should, consider, recommend, try to, reduce, etc.
- Focus on patterns: frequency, timing, locations

GOOD examples:
- "Your go-to coffee shop - 18 visits this month, mostly weekday mornings in Cluj center"
- "Gas station near work - filled up 6 times, usually Thursdays"
- "Monthly subscription payment - auto-renewed on the 15th for 3 months"

BAD examples (FORBIDDEN):
- "You should reduce coffee spending" ❌ ADVICE
- "Consider switching to a cheaper gym" ❌ ADVICE
- "Try to limit restaurant visits" ❌ ADVICE

Return JSON with summary, tone, and contains_advice flag."""

    def _build_context(self, stats: TransactionStats) -> str:
        """Format stats into readable context (language-independent)"""

        # Calculate patterns
        avg_amount = sum(stats.transaction_amounts) / len(stats.transaction_amounts)
        most_common_day = max(stats.weekday_distribution, key=stats.weekday_distribution.get)

        context = f"""Merchant: {stats.merchant_name}
Total visits: {stats.total_transactions}
First visit: {stats.first_transaction.strftime('%B %Y')}
Last visit: {stats.last_transaction.strftime('%B %d')}
Common locations: {', '.join(stats.common_locations[:3])}
Average amount: {avg_amount:.2f} RON
Most common day: {most_common_day}"""

        return context