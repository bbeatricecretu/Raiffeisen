"""
Answer Formatter with Romanian Language Support
Converts filtered transaction results into natural, conversational responses
in Romanian or English
"""

from dotenv import load_dotenv
load_dotenv()

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal
from datetime import datetime
from openai import OpenAI

# Import language detector
from src.ai.features.language_detector import Language

class Transaction(BaseModel):
    """Transaction data"""
    id: str
    merchant_name: str
    amount: float
    currency: str
    location: str
    date: datetime
    category: str


class QueryIntent:
    """Query intent types from parser"""
    SEARCH_BY_MERCHANT = "search_merchant"
    SEARCH_BY_LOCATION = "search_location"
    SEARCH_BY_DATE = "search_date"
    SEARCH_BY_CATEGORY = "search_category"
    LAST_TRANSACTION = "last_transaction"
    FREQUENCY_QUERY = "frequency"


class ParsedQuery(BaseModel):
    """Parsed query from NL parser"""
    intent: str
    merchant_name: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    original_query: str
    language: Language = "en"  # NEW: Language field


class FormattedAnswer(BaseModel):
    """Formatted answer to return to user"""
    answer_text: str = Field(..., max_length=300, description="Main answer")
    summary_stats: Dict = Field(default_factory=dict, description="Key numbers")
    suggestions: List[str] = Field(default_factory=list, description="Follow-up suggestions")
    language: Language = "en"  # NEW: Track response language


class AnswerFormatter:
    """Formats search results into natural language (Romanian or English)"""

    def __init__(self, client: OpenAI):
        self.client = client

    def format_answer(self,
                      query: str,
                      parsed_intent: ParsedQuery,
                      results: List[Transaction]) -> FormattedAnswer:
        """
        Main entry point - format results based on query and intent

        Args:
            query: Original user query
            parsed_intent: Parsed query structure (includes language)
            results: Filtered transactions from backend

        Returns:
            FormattedAnswer with natural language response in the same language
        """

        language = parsed_intent.language  # NEW: Get language from parsed query

        # Handle empty results
        if not results:
            return self._format_empty_result(query, parsed_intent, language)

        # Calculate summary statistics
        stats = self._calculate_summary_stats(results, parsed_intent)

        # Generate natural language answer using AI (language-aware)
        answer_text = self._generate_answer(query, parsed_intent, results, stats, language)

        # Generate follow-up suggestions (language-aware)
        suggestions = self._generate_suggestions(parsed_intent, results, language)

        return FormattedAnswer(
            answer_text=answer_text,
            summary_stats=stats,
            suggestions=suggestions,
            language=language  # NEW
        )

    def _calculate_summary_stats(self,
                                 results: List[Transaction],
                                 parsed_intent: ParsedQuery) -> Dict:
        """Calculate key statistics from results (language-independent)"""

        total_amount = sum(t.amount for t in results)

        # Group by merchant
        by_merchant = {}
        for t in results:
            if t.merchant_name not in by_merchant:
                by_merchant[t.merchant_name] = []
            by_merchant[t.merchant_name].append(t)

        # Group by location
        by_location = {}
        for t in results:
            if t.location not in by_location:
                by_location[t.location] = []
            by_location[t.location].append(t)

        # Date range
        dates = [t.date for t in results]
        date_range = {
            "earliest": min(dates),
            "latest": max(dates)
        }

        # Most common merchant
        most_common_merchant = max(by_merchant.items(), key=lambda x: len(x[1]))

        # Most common location
        most_common_location = max(by_location.items(), key=lambda x: len(x[1]))

        return {
            "total_transactions": len(results),
            "total_amount": total_amount,
            "average_amount": total_amount / len(results),
            "unique_merchants": len(by_merchant),
            "unique_locations": len(by_location),
            "most_common_merchant": {
                "name": most_common_merchant[0],
                "count": len(most_common_merchant[1])
            },
            "most_common_location": {
                "name": most_common_location[0],
                "count": len(most_common_location[1])
            },
            "date_range": date_range,
            "by_merchant": {k: len(v) for k, v in by_merchant.items()},
            "by_location": {k: len(v) for k, v in by_location.items()}
        }

    def _generate_answer(self,
                         query: str,
                         parsed_intent: ParsedQuery,
                         results: List[Transaction],
                         stats: Dict,
                         language: Language) -> str:
        """Use AI to generate natural language answer in the appropriate language"""

        # Build context for AI
        context = self._build_context_string(results, stats, parsed_intent)

        # MODIFIED: Create language-specific prompt
        if language == "ro":
            prompt = self._create_romanian_answer_prompt(query, context)
        else:
            prompt = self._create_english_answer_prompt(query, context)

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(language)
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=150,
                timeout=3.0
            )

            answer = response.choices[0].message.content.strip()

            # Enforce length limit
            if len(answer) > 300:
                answer = answer[:297] + "..."

            return answer

        except Exception as e:
            print(f"AI answer generation failed, using template: {e}")
            return self._template_answer(parsed_intent, stats, language)

    def _get_system_prompt(self, language: Language) -> str:
        """Get language-appropriate system prompt"""

        if language == "ro":
            return """Tu formatezi rezultatele căutării de tranzacții în răspunsuri naturale și utile. 
Fii conversațional și concis. Răspunde ÎNTOTDEAUNA în română."""
        else:
            return """You format transaction search results into natural, helpful answers. 
Be conversational and concise."""

    def _create_romanian_answer_prompt(self, query: str, context: str) -> str:
        """Create Romanian answer generation prompt"""

        return f"""Utilizatorul a întrebat: "{query}"

Iată rezultatele:
{context}

Generează un răspuns natural, conversațional care:
1. Răspunde direct la întrebare
2. Include numere cheie (număr, total, locații)
3. Are sub 250 caractere
4. Sună uman, nu robotic
5. FĂRĂ sfaturi financiare (nu spune "ar trebui", "consideră", etc.)

Exemple bune:
- "Ai mâncat la 3 locuri în Cluj săptămâna trecută: Trattoria Buona (3×), Pizza Hut și McDonald's. Total: 245 RON."
- "Ultima ta plată la sală a fost pe 15 ianuarie la World Class Cluj - 150 RON pentru abonament lunar."
- "Am găsit 8 vizite la benzinării în ianuarie, toate la Rompetrol. Total cheltuit: 1,200 RON."

Returnează DOAR textul răspunsului, fără JSON, fără formatare."""

    def _create_english_answer_prompt(self, query: str, context: str) -> str:
        """Create English answer generation prompt (original)"""

        return f"""The user asked: "{query}"

Here are the results:
{context}

Generate a natural, conversational answer that:
1. Directly answers their question
2. Includes key numbers (count, total, locations)
3. Is under 250 characters
4. Sounds human, not robotic
5. NO financial advice (don't say "you should", "consider", etc.)

Good examples:
- "You ate at 3 places in Cluj last week: Trattoria Buona (3×), Pizza Hut, and McDonald's. Total: 245 RON."
- "Your last gym payment was on January 15th at World Class Cluj - 150 RON for monthly membership."
- "Found 8 gas station visits in January, all at Rompetrol. Total spent: 1,200 RON."

Return ONLY the answer text, no JSON, no formatting."""

    def _build_context_string(self,
                              results: List[Transaction],
                              stats: Dict,
                              parsed_intent: ParsedQuery) -> str:
        """Build context string for AI prompt (language-independent)"""

        context_parts = [
            f"Total transactions: {stats['total_transactions']}",
            f"Total amount: {stats['total_amount']:.2f} RON",
            f"Date range: {stats['date_range']['earliest'].strftime('%b %d')} to {stats['date_range']['latest'].strftime('%b %d')}"
        ]

        # Add merchant breakdown
        if stats['unique_merchants'] <= 5:
            merchants = ", ".join([f"{k} ({v}×)" for k, v in stats['by_merchant'].items()])
            context_parts.append(f"Merchants: {merchants}")
        else:
            top_3 = sorted(stats['by_merchant'].items(), key=lambda x: x[1], reverse=True)[:3]
            merchants = ", ".join([f"{k} ({v}×)" for k, v in top_3])
            context_parts.append(f"Top merchants: {merchants} (and {stats['unique_merchants'] - 3} others)")

        # Add location breakdown if relevant
        if parsed_intent.location or stats['unique_locations'] <= 3:
            locations = ", ".join([f"{k} ({v}×)" for k, v in stats['by_location'].items()])
            context_parts.append(f"Locations: {locations}")

        return "\n".join(context_parts)

    def _template_answer(self, parsed_intent: ParsedQuery, stats: Dict, language: Language) -> str:
        """Fallback template-based answer if AI fails (language-aware)"""

        intent = parsed_intent.intent

        if language == "ro":
            # Romanian templates
            if intent == QueryIntent.LAST_TRANSACTION:
                latest = stats['date_range']['latest']
                merchant = stats['most_common_merchant']['name']
                return f"Ultima ta plată a fost pe {latest.strftime('%d %B')} la {merchant}."

            elif intent == QueryIntent.SEARCH_BY_MERCHANT:
                count = stats['total_transactions']
                total = stats['total_amount']
                merchant = parsed_intent.merchant_name
                return f"Am găsit {count} tranzacții la {merchant}, total {total:.0f} RON."

            elif intent == QueryIntent.SEARCH_BY_LOCATION:
                count = stats['total_transactions']
                location = parsed_intent.location
                merchants = stats['unique_merchants']
                return f"Am găsit {count} tranzacții în {location} la {merchants} comercianți."

            elif intent == QueryIntent.FREQUENCY_QUERY:
                count = stats['total_transactions']
                merchant = stats['most_common_merchant']['name']
                days = (stats['date_range']['latest'] - stats['date_range']['earliest']).days
                return f"Ai vizitat {merchant} de {count} ori în ultimele {days} zile."

            else:
                # Generic fallback Romanian
                count = stats['total_transactions']
                total = stats['total_amount']
                return f"Am găsit {count} tranzacții, total {total:.0f} RON."
        else:
            # English templates (original)
            if intent == QueryIntent.LAST_TRANSACTION:
                latest = stats['date_range']['latest']
                merchant = stats['most_common_merchant']['name']
                return f"Your last payment was on {latest.strftime('%B %d')} at {merchant}."

            elif intent == QueryIntent.SEARCH_BY_MERCHANT:
                count = stats['total_transactions']
                total = stats['total_amount']
                merchant = parsed_intent.merchant_name
                return f"Found {count} transactions at {merchant}, totaling {total:.0f} RON."

            elif intent == QueryIntent.SEARCH_BY_LOCATION:
                count = stats['total_transactions']
                location = parsed_intent.location
                merchants = stats['unique_merchants']
                return f"Found {count} transactions in {location} across {merchants} merchants."

            elif intent == QueryIntent.FREQUENCY_QUERY:
                count = stats['total_transactions']
                merchant = stats['most_common_merchant']['name']
                days = (stats['date_range']['latest'] - stats['date_range']['earliest']).days
                return f"You visited {merchant} {count} times in the last {days} days."

            else:
                # Generic fallback English
                count = stats['total_transactions']
                total = stats['total_amount']
                return f"Found {count} transactions totaling {total:.0f} RON."

    def _format_empty_result(self,
                             query: str,
                             parsed_intent: ParsedQuery,
                             language: Language) -> FormattedAnswer:
        """Handle cases with no results (language-aware)"""

        intent = parsed_intent.intent

        if language == "ro":
            # Romanian empty results
            if intent == QueryIntent.SEARCH_BY_MERCHANT:
                answer = f"Nu am găsit tranzacții pentru {parsed_intent.merchant_name}. Încearcă să verifici numele sau alte perioade de timp."
                suggestions = [
                    "Caută toate tranzacțiile",
                    "Încearcă alt nume",
                    "Extinde perioada"
                ]

            elif intent == QueryIntent.SEARCH_BY_LOCATION:
                answer = f"Nu am găsit tranzacții în {parsed_intent.location}. Încearcă orașe apropiate sau alte perioade."
                suggestions = [
                    "Caută toate locațiile",
                    "Încearcă zone apropiate",
                    "Extinde perioada"
                ]

            elif intent == QueryIntent.LAST_TRANSACTION:
                answer = f"Nu am găsit tranzacții pentru acel comerciant. Verifică numele?"
                suggestions = [
                    "Arată toți comercianții",
                    "Caută după categorie",
                    "Vezi tranzacții recente"
                ]

            else:
                answer = "Nicio tranzacție nu se potrivește căutării. Încearcă alte criterii sau perioade."
                suggestions = [
                    "Vezi toate tranzacțiile",
                    "Încearcă alte date",
                    "Caută după comerciant"
                ]
        else:
            # English empty results (original)
            if intent == QueryIntent.SEARCH_BY_MERCHANT:
                answer = f"No transactions found for {parsed_intent.merchant_name}. Try checking the merchant name or different time periods."
                suggestions = [
                    "Search all transactions",
                    "Try different merchant name",
                    "Expand date range"
                ]

            elif intent == QueryIntent.SEARCH_BY_LOCATION:
                answer = f"No transactions found in {parsed_intent.location}. Try nearby cities or different time periods."
                suggestions = [
                    "Search all locations",
                    "Try nearby areas",
                    "Expand date range"
                ]

            elif intent == QueryIntent.LAST_TRANSACTION:
                answer = f"Couldn't find any transactions for that merchant. Double-check the merchant name?"
                suggestions = [
                    "Show all merchants",
                    "Search by category",
                    "View recent transactions"
                ]

            else:
                answer = "No transactions matched your search. Try different criteria or time periods."
                suggestions = [
                    "View all transactions",
                    "Try different dates",
                    "Search by merchant"
                ]

        return FormattedAnswer(
            answer_text=answer,
            summary_stats={},
            suggestions=suggestions,
            language=language
        )

    def _generate_suggestions(self,
                              parsed_intent: ParsedQuery,
                              results: List[Transaction],
                              language: Language) -> List[str]:
        """Generate helpful follow-up suggestions (language-aware)"""

        suggestions = []
        stats = self._calculate_summary_stats(results, parsed_intent)

        if language == "ro":
            # Romanian suggestions
            if stats['unique_merchants'] == 1:
                merchant = stats['most_common_merchant']['name']
                suggestions.append(f"Vezi profilul {merchant}")

            if len(set(t.category for t in results)) > 1:
                suggestions.append("Filtrează după categorie")

            if stats['unique_locations'] > 1:
                suggestions.append("Filtrează după locație")

            days_span = (stats['date_range']['latest'] - stats['date_range']['earliest']).days
            if days_span > 30:
                suggestions.append("Filtrează după perioadă")
        else:
            # English suggestions (original)
            if stats['unique_merchants'] == 1:
                merchant = stats['most_common_merchant']['name']
                suggestions.append(f"View {merchant} profile")

            if len(set(t.category for t in results)) > 1:
                suggestions.append("Filter by category")

            if stats['unique_locations'] > 1:
                suggestions.append("Filter by location")

            days_span = (stats['date_range']['latest'] - stats['date_range']['earliest']).days
            if days_span > 30:
                suggestions.append("Filter by date range")

        return suggestions[:3]  # Max 3 suggestions
