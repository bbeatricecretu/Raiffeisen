from dotenv import load_dotenv
load_dotenv()

from typing import Tuple, Optional
from enum import Enum
from openai import OpenAI
import json

class RefusalReason(Enum):
    FINANCIAL_ADVICE = "financial_advice"
    INVESTMENT_QUERY = "investment"
    LOAN_ADVICE = "loan_advice"
    PURCHASE_RECOMMENDATION = "purchase_rec"
    BUDGET_INSTRUCTION = "budget_instruction"
    SAFE = "safe"


class SafetyFilter:
    """Multi-layer safety system"""

    # Layer 1: Keyword blocklist (fast, deterministic)
    FORBIDDEN_KEYWORDS = [
        'should i buy', 'should i invest', 'recommend',
        'advice on', 'help me decide', 'which is better',
        'worth it', 'good deal', 'bad deal',
        'should i spend', 'should i save', 'budget advice'
    ]

    # Layer 2: Intent patterns
    FORBIDDEN_PATTERNS = [
        r'should\s+i\s+\w+',  # "should I ..."
        r'is\s+it\s+worth',  # "is it worth ..."
        r'help\s+me\s+(decide|choose)',  # "help me decide/choose ..."
    ]

    def __init__(self, client: OpenAI):
        self.client = client

    def check_query(self, query: str) -> Tuple[RefusalReason, Optional[str]]:
        """
        Returns: (reason, refusal_message)
        If reason is SAFE, refusal_message is None
        """

        # Layer 1: Fast keyword check
        query_lower = query.lower()
        for keyword in self.FORBIDDEN_KEYWORDS:
            if keyword in query_lower:
                return (
                    RefusalReason.FINANCIAL_ADVICE,
                    self._generate_refusal(query, RefusalReason.FINANCIAL_ADVICE)
                )

        # Layer 2: Pattern matching
        import re
        for pattern in self.FORBIDDEN_PATTERNS:
            if re.search(pattern, query_lower):
                return (
                    RefusalReason.FINANCIAL_ADVICE,
                    self._generate_refusal(query, RefusalReason.FINANCIAL_ADVICE)
                )

        # Layer 3: LLM-based intent classification (slower but catches edge cases)
        llm_result = self._llm_safety_check(query)
        if llm_result != RefusalReason.SAFE:
            return (
                llm_result,
                self._generate_refusal(query, llm_result)
            )

        return (RefusalReason.SAFE, None)

    def _llm_safety_check(self, query: str) -> RefusalReason:
        """Use LLM to classify intent"""

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
                {"role": "system", "content": "You are a safety classifier for a banking app."},
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

    def _generate_refusal(self, query: str, reason: RefusalReason) -> str:
        """Generate helpful refusal message"""

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

