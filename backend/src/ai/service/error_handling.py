# error_handling.py
"""
Error Handling & Retry Logic
Production-grade error handling for AI operations
"""
from dotenv import load_dotenv
load_dotenv()

from typing import Callable, Any, Optional, Dict
from functools import wraps
import logging
import time
import json
from enum import Enum
import openai
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log
)

logger = logging.getLogger(__name__)


class ErrorSeverity(Enum):
    """Error severity levels"""
    LOW = "low"  # Recoverable, use fallback
    MEDIUM = "medium"  # Retry possible
    HIGH = "high"  # Critical, alert needed
    CRITICAL = "critical"  # Service down


class AIError(Exception):
    """Base exception for AI service errors"""

    def __init__(self, message: str, severity: ErrorSeverity, original_error: Optional[Exception] = None):
        self.message = message
        self.severity = severity
        self.original_error = original_error
        super().__init__(self.message)


class RateLimitError(AIError):
    """Raised when API rate limit is hit"""

    def __init__(self, message: str = "API rate limit exceeded", original_error: Optional[Exception] = None):
        super().__init__(message, ErrorSeverity.MEDIUM, original_error)


class ValidationError(AIError):
    """Raised when AI output fails validation"""

    def __init__(self, message: str = "AI output validation failed", original_error: Optional[Exception] = None):
        super().__init__(message, ErrorSeverity.LOW, original_error)


class TimeoutError(AIError):
    """Raised when AI request times out"""

    def __init__(self, message: str = "AI request timed out", original_error: Optional[Exception] = None):
        super().__init__(message, ErrorSeverity.MEDIUM, original_error)


class ModelError(AIError):
    """Raised when AI model fails"""

    def __init__(self, message: str = "AI model error", original_error: Optional[Exception] = None):
        super().__init__(message, ErrorSeverity.HIGH, original_error)


class ErrorHandler:
    """Centralized error handling for AI operations"""

    def __init__(self, enable_fallbacks: bool = True):
        self.enable_fallbacks = enable_fallbacks
        self.error_counts = {}
        self.last_errors = {}

    @retry(
        retry=retry_if_exception_type((openai.RateLimitError, openai.APITimeoutError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        before_sleep=before_sleep_log(logger, logging.WARNING)
    )
    def call_with_retry(self,
                        func: Callable,
                        *args,
                        fallback: Optional[Callable] = None,
                        **kwargs) -> Any:
        """
        Call a function with automatic retry logic

        Args:
            func: Function to call
            *args: Positional arguments for func
            fallback: Optional fallback function if all retries fail
            **kwargs: Keyword arguments for func

        Returns:
            Result from func or fallback

        Raises:
            AIError: If all retries fail and no fallback provided
        """
        try:
            return func(*args, **kwargs)

        except openai.RateLimitError as e:
            logger.error(f"Rate limit hit: {e}")
            self._record_error("rate_limit", e)

            if fallback and self.enable_fallbacks:
                logger.info("Using fallback due to rate limit")
                return fallback(*args, **kwargs)

            raise RateLimitError(original_error=e)

        except openai.APITimeoutError as e:
            logger.error(f"Timeout error: {e}")
            self._record_error("timeout", e)

            if fallback and self.enable_fallbacks:
                logger.info("Using fallback due to timeout")
                return fallback(*args, **kwargs)

            raise TimeoutError(original_error=e)

        except openai.APIError as e:
            logger.error(f"API error: {e}")
            self._record_error("api_error", e)

            if fallback and self.enable_fallbacks:
                logger.info("Using fallback due to API error")
                return fallback(*args, **kwargs)

            raise ModelError(original_error=e)

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON from AI: {e}")
            self._record_error("json_decode", e)

            if fallback and self.enable_fallbacks:
                logger.info("Using fallback due to invalid JSON")
                return fallback(*args, **kwargs)

            raise ValidationError("AI returned invalid JSON", original_error=e)

        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            self._record_error("unexpected", e)

            if fallback and self.enable_fallbacks:
                logger.info("Using fallback due to unexpected error")
                return fallback(*args, **kwargs)

            raise AIError(f"Unexpected error: {str(e)}", ErrorSeverity.HIGH, original_error=e)

    def _record_error(self, error_type: str, error: Exception):
        """Record error for monitoring"""
        if error_type not in self.error_counts:
            self.error_counts[error_type] = 0

        self.error_counts[error_type] += 1
        self.last_errors[error_type] = {
            "timestamp": time.time(),
            "message": str(error)
        }

    def get_error_stats(self) -> Dict[str, Any]:
        """Get error statistics for monitoring"""
        return {
            "counts": self.error_counts,
            "last_errors": self.last_errors
        }

    def reset_stats(self):
        """Reset error statistics"""
        self.error_counts = {}
        self.last_errors = {}


class CircuitBreaker:
    """
    Circuit breaker pattern to prevent cascading failures

    If too many errors occur, "opens" the circuit and fails fast
    instead of continuing to call a failing service
    """

    def __init__(self,
                 failure_threshold: int = 5,
                 timeout_seconds: int = 60,
                 expected_exception: type = AIError):
        """
        Args:
            failure_threshold: Number of failures before opening circuit
            timeout_seconds: How long to wait before trying again
            expected_exception: Exception type to count as failure
        """
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.expected_exception = expected_exception

        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half_open

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Call function through circuit breaker

        Args:
            func: Function to call
            *args, **kwargs: Arguments to pass to func

        Returns:
            Result from func

        Raises:
            AIError: If circuit is open
        """
        # Check if circuit should be closed
        if self.state == "open":
            if time.time() - self.last_failure_time > self.timeout_seconds:
                logger.info("Circuit breaker: Attempting half-open state")
                self.state = "half_open"
            else:
                raise AIError(
                    f"Circuit breaker is open. Too many failures. Try again in {self.timeout_seconds}s",
                    ErrorSeverity.HIGH
                )

        try:
            result = func(*args, **kwargs)

            # Success - reset if in half-open
            if self.state == "half_open":
                logger.info("Circuit breaker: Closing after successful call")
                self.state = "closed"
                self.failure_count = 0

            return result

        except self.expected_exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()

            if self.failure_count >= self.failure_threshold:
                logger.error(f"Circuit breaker: Opening after {self.failure_count} failures")
                self.state = "open"

            raise

    def reset(self):
        """Manually reset circuit breaker"""
        self.state = "closed"
        self.failure_count = 0
        self.last_failure_time = None


class FallbackManager:
    """
    Manages fallback strategies when AI fails
    """

    @staticmethod
    def merchant_normalization_fallback(pos_string: str) -> Dict[str, Any]:
        """Fallback when merchant normalization fails"""
        # Simple rule-based fallback
        # Remove common prefixes and numbers
        import re

        cleaned = re.sub(r'\d+', '', pos_string)  # Remove numbers
        cleaned = re.sub(r'[*#]', '', cleaned)  # Remove special chars
        cleaned = cleaned.strip()

        return {
            "canonical_name": cleaned,
            "brand": cleaned,
            "confidence": 0.3,  # Low confidence
            "merchant_type": "unknown",
            "reasoning": "Fallback: AI normalization unavailable"
        }

    @staticmethod
    def summary_fallback(merchant_name: str, stats: Dict) -> Dict[str, Any]:
        """Fallback when summary generation fails"""
        total = stats.get("total_transactions", 0)
        return {
            "summary": f"{total} transactions at {merchant_name}",
            "tone": "neutral",
            "contains_advice": False
        }

    @staticmethod
    def answer_fallback(results_count: int) -> Dict[str, Any]:
        """Fallback when answer formatting fails"""
        return {
            "answer_text": f"Found {results_count} transactions matching your search.",
            "summary_stats": {"total_transactions": results_count},
            "suggestions": []
        }

    @staticmethod
    def auth_context_fallback(merchant: str, amount: float, currency: str) -> Dict[str, Any]:
        """Fallback when auth context generation fails"""
        return {
            "merchant_display_name": merchant,
            "relationship_summary": "Processing transaction...",
            "location_context": "Verifying location...",
            "amount_context": f"{amount} {currency}",
            "risk_flags": [],
            "total_spent_this_month": 0,
            "visit_count_this_month": 0,
            "is_first_transaction": True
        }


# Decorator for easy retry functionality
def with_retry(fallback: Optional[Callable] = None, max_attempts: int = 3):
    """
    Decorator to add retry logic to any function

    Usage:
        @with_retry(fallback=my_fallback_function, max_attempts=3)
        def my_ai_function(arg1, arg2):
            # ... AI logic ...
            pass
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            handler = ErrorHandler()
            return handler.call_with_retry(
                func,
                *args,
                fallback=fallback,
                **kwargs
            )

        return wrapper

    return decorator


