from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel, Field
from typing import Optional
import json
from openai import OpenAI

from src.ai.prompts.prompts import PromptLibrary, PromptType


class NormalizedMerchant(BaseModel):
    """Strict schema for merchant normalization"""
    canonical_name: str = Field(..., description="Clean merchant name")
    brand: str = Field(..., description="Parent brand if applicable")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence 0-1")
    merchant_type: str = Field(..., description="Category: retail, food, gas, service, etc.")
    reasoning: str = Field(..., max_length=200, description="Why this normalization")

class MerchantNormalizer:
    def __init__(self, client: OpenAI):
        self.client = client
        self.cache = {}  # Cache normalized results

    def normalize(self, pos_string: str, fallback_rules: bool = True) -> NormalizedMerchant:
        """
        Two-stage approach:
        1. Try rule-based normalization first (fast, free)
        2. Fall back to AI if rules fail (slower, costs money)
        """

        # Stage 1: Rule-based (backend engineer handles this)
        if fallback_rules:
            rule_result = self._try_rule_based(pos_string)
            if rule_result and rule_result.confidence > 0.9:
                return rule_result

        # Stage 2: AI normalization
        return self._ai_normalize(pos_string)

    def _ai_normalize(self, pos_string: str) -> NormalizedMerchant:
        """Use LLM for complex cases"""

        # Check cache first
        if pos_string in self.cache:
            return self.cache[pos_string]

        prompt = f"""Normalize this POS transaction string to identify the real merchant:

POS String: "{pos_string}"

Common patterns to recognize:
- KAUFLAND*/KAUFL* → Kaufland (retail chain)
- ROMPETROL/PETROM/OMV → Keep separate (different gas brands)
- PAYPAL *MERCHANT → Extract MERCHANT name
- Restaurant names with locations

Return JSON with:
- canonical_name: The clean merchant name
- brand: Parent company if applicable
- confidence: 0-1 score
- merchant_type: retail|food|gas|service|entertainment|other
- reasoning: Brief explanation

JSON only, no other text."""

        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": PromptLibrary.get_prompt(PromptType.MERCHANT_NORMALIZATION)},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},  # Force JSON mode
            temperature=0.1,  # Low temperature for consistency
            max_tokens=200
        )

        result_json = json.loads(response.choices[0].message.content)
        result_json["brand"] = result_json.get("brand") or "Unknown"

        result = NormalizedMerchant(**result_json)

        # Cache the result
        self.cache[pos_string] = result

        return result

    def _try_rule_based(self, pos_string: str) -> Optional[NormalizedMerchant]:
        """Backend engineer implements this - you provide the schema"""
        # This is where backend engineer's logic goes
        pass