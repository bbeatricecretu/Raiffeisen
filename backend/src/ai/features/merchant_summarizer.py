import json
from dotenv import load_dotenv

from src.ai.prompts.prompts import PromptLibrary, PromptType

load_dotenv()

from pydantic import BaseModel, Field, field_validator
from typing import List, Dict
from datetime import datetime
from openai import OpenAI


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

    @field_validator('summary')
    def validate_no_advice(cls, v):
        """CRITICAL: Block any financial advice"""
        forbidden_phrases = [
            'should', 'consider', 'recommend', 'suggest',
            'try to', 'could save', 'reduce', 'increase',
            'better to', 'avoid', 'limit'
        ]
        v_lower = v.lower()
        for phrase in forbidden_phrases:
            if phrase in v_lower:
                raise ValueError(f"Summary contains forbidden advice phrase: '{phrase}'")
        return v


class MerchantSummarizer:
    def __init__(self, client: OpenAI):
        self.client = client

    def generate_summary(self, stats: TransactionStats) -> MerchantSummary:
        """Generate factual, neutral summary"""

        # Build context from stats
        context = self._build_context(stats)

        prompt = f"""Generate a merchant summary based on these facts:

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

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": PromptLibrary.get_prompt(PromptType.MERCHANT_SUMMARY)},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,  # Slightly creative but consistent
            max_tokens=150
        )

        result_json = json.loads(response.choices[0].message.content)
        summary = MerchantSummary(**result_json)

        # Double-check safety
        if summary.contains_advice:
            raise ValueError("AI generated advisory content - rejecting")

        return summary

    def _build_context(self, stats: TransactionStats) -> str:
        """Format stats into readable context"""

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