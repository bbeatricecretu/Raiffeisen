"""
Configuration Management
Centralized configuration for AI service
"""
from dotenv import load_dotenv
load_dotenv()

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, Literal
import os
from pathlib import Path
from pydantic_settings import SettingsConfigDict


class AIConfig(BaseSettings):
    """
    AI Service Configuration

    Loads from environment variables or .env file
    """

    # ===================================================================
    # API Keys
    # ===================================================================
    openai_api_key: str = Field(
        ...,
        description="OpenAI API key (required)"
    )

    anthropic_api_key: Optional[str] = Field(
        default=None,
        description="Anthropic API key (optional, for Claude models)"
    )

    # ===================================================================
    # Model Selection
    # ===================================================================
    default_model: str = Field(
        default="gpt-4o-mini",
        description="Default LLM model to use"
    )

    fallback_model: str = Field(
        default="gpt-4o",
        description="Fallback model for complex tasks"
    )

    use_claude_for_safety: bool = Field(
        default=False,
        description="Use Claude for safety filtering (more conservative)"
    )

    # ===================================================================
    # Performance & Reliability
    # ===================================================================
    request_timeout: float = Field(
        default=5.0,
        ge=1.0,
        le=30.0,
        description="Request timeout in seconds"
    )

    max_retries: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Maximum retry attempts for failed requests"
    )

    retry_delay_min: float = Field(
        default=1.0,
        description="Minimum retry delay in seconds"
    )

    retry_delay_max: float = Field(
        default=10.0,
        description="Maximum retry delay in seconds"
    )

    # ===================================================================
    # Caching
    # ===================================================================
    enable_cache: bool = Field(
        default=True,
        description="Enable response caching"
    )

    cache_max_size: int = Field(
        default=1000,
        ge=100,
        le=10000,
        description="Maximum number of cached items"
    )

    cache_ttl_seconds: int = Field(
        default=3600,
        description="Cache time-to-live in seconds (default: 1 hour)"
    )

    # ===================================================================
    # Safety Settings
    # ===================================================================
    enable_safety_filter: bool = Field(
        default=True,
        description="Enable safety filtering for financial advice"
    )

    safety_strictness: Literal["low", "medium", "high"] = Field(
        default="high",
        description="Safety filter strictness level"
    )

    block_advice_keywords: bool = Field(
        default=True,
        description="Block queries with financial advice keywords"
    )

    # ===================================================================
    # Cost Controls
    # ===================================================================
    monthly_budget_usd: float = Field(
        default=100.0,
        ge=0.0,
        description="Monthly budget limit in USD"
    )

    alert_threshold_usd: float = Field(
        default=80.0,
        ge=0.0,
        description="Alert when spending reaches this amount"
    )

    enable_cost_tracking: bool = Field(
        default=True,
        description="Track API costs"
    )

    # ===================================================================
    # Feature Flags
    # ===================================================================
    enable_merchant_normalization: bool = Field(
        default=True,
        description="Enable AI merchant normalization"
    )

    enable_merchant_summaries: bool = Field(
        default=True,
        description="Enable AI merchant summaries"
    )

    enable_nl_search: bool = Field(
        default=True,
        description="Enable natural language search"
    )

    enable_auth_context: bool = Field(
        default=True,
        description="Enable authorization context generation"
    )

    # ===================================================================
    # Logging & Monitoring
    # ===================================================================
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Logging level"
    )

    log_to_file: bool = Field(
        default=False,
        description="Log to file in addition to console"
    )

    log_file_path: Optional[Path] = Field(
        default=None,
        description="Path to log file"
    )

    enable_metrics: bool = Field(
        default=True,
        description="Enable performance metrics collection"
    )

    # ===================================================================
    # Circuit Breaker
    # ===================================================================
    enable_circuit_breaker: bool = Field(
        default=True,
        description="Enable circuit breaker pattern"
    )

    circuit_breaker_threshold: int = Field(
        default=5,
        ge=1,
        description="Number of failures before opening circuit"
    )

    circuit_breaker_timeout: int = Field(
        default=60,
        ge=10,
        description="Seconds to wait before closing circuit"
    )

    # ===================================================================
    # Development Settings
    # ===================================================================
    debug_mode: bool = Field(
        default=False,
        description="Enable debug mode (verbose logging, no caching)"
    )

    mock_ai_responses: bool = Field(
        default=False,
        description="Use mock responses instead of real AI calls (for testing)"
    )

    # ===================================================================
    # Validators
    # ===================================================================
    @field_validator('alert_threshold_usd')
    def validate_alert_threshold(cls, v, info):
        """Ensure alert threshold is less than budget"""
        if 'monthly_budget_usd' in info.data and v > info.data['monthly_budget_usd']:
            raise ValueError("Alert threshold must be less than monthly budget")
        return v

    @field_validator('openai_api_key')
    def validate_openai_key(cls, v):
        """Ensure OpenAI key is not empty"""
        if not v or v == "":
            raise ValueError("OpenAI API key is required")
        return v

    # ===================================================================
    # Config Loading
    # ===================================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"  # <-- CHEIA
    )

    # ===================================================================
    # Helper Methods
    # ===================================================================
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return not self.debug_mode and not self.mock_ai_responses

    def get_model_for_task(self, task: str) -> str:
        """
        Get the appropriate model for a specific task

        Args:
            task: Task name (normalization, summary, etc.)

        Returns:
            Model name to use
        """
        # Use faster mini model for simple tasks
        simple_tasks = ["normalization", "parsing", "formatting"]
        if task in simple_tasks:
            return self.default_model

        # Use more powerful model for complex tasks
        complex_tasks = ["summary", "auth_context"]
        if task in complex_tasks:
            return self.fallback_model

        return self.default_model

    def to_dict(self) -> dict:
        """Convert config to dictionary (excluding sensitive keys)"""
        data = self.model_dump()

        # Mask sensitive keys
        if 'openai_api_key' in data:
            data['openai_api_key'] = data['openai_api_key'][:8] + "..."
        if 'anthropic_api_key' in data and data['anthropic_api_key']:
            data['anthropic_api_key'] = data['anthropic_api_key'][:8] + "..."

        return data


class EnvironmentConfig:
    """
    Environment-specific configurations
    """

    @staticmethod
    def development() -> AIConfig:
        """Development environment config"""
        return AIConfig(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            default_model="gpt-4o-mini",
            request_timeout=10.0,
            max_retries=2,
            enable_cache=False,  # No caching in dev for fresh results
            debug_mode=True,
            log_level="DEBUG",
            monthly_budget_usd=10.0,  # Low budget for testing
            alert_threshold_usd=8.0,
            enable_metrics=True
        )

    @staticmethod
    def staging() -> AIConfig:
        """Staging environment config"""
        return AIConfig(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            default_model="gpt-4o-mini",
            request_timeout=5.0,
            max_retries=3,
            enable_cache=True,
            cache_ttl_seconds=1800,  # 30 minutes
            debug_mode=False,
            log_level="INFO",
            monthly_budget_usd=50.0,
            alert_threshold_usd=40.0,
            enable_metrics=True,
            enable_circuit_breaker=True
        )

    @staticmethod
    def production() -> AIConfig:
        """Production environment config"""
        return AIConfig(
            openai_api_key=os.getenv("OPENAI_API_KEY", ""),
            default_model="gpt-4o-mini",
            fallback_model="gpt-4o",
            request_timeout=3.0,  # Faster timeout for production
            max_retries=3,
            enable_cache=True,
            cache_max_size=5000,
            cache_ttl_seconds=3600,  # 1 hour
            debug_mode=False,
            log_level="WARNING",
            log_to_file=True,
            log_file_path=Path("/var/log/ai-service/ai.log"),
            monthly_budget_usd=500.0,
            alert_threshold_usd=400.0,
            enable_metrics=True,
            enable_circuit_breaker=True,
            circuit_breaker_threshold=5,
            enable_safety_filter=True,
            safety_strictness="high"
        )


# ===================================================================
# Configuration Factory
# ===================================================================

def load_config(environment: Optional[str] = None) -> AIConfig:
    """
    Load configuration based on environment

    Args:
        environment: Environment name (dev, staging, prod)
                    If None, reads from ENV environment variable

    Returns:
        AIConfig instance
    """
    if environment is None:
        environment = os.getenv("ENV", "development").lower()

    env_map = {
        "dev": EnvironmentConfig.development,
        "development": EnvironmentConfig.development,
        "staging": EnvironmentConfig.staging,
        "prod": EnvironmentConfig.production,
        "production": EnvironmentConfig.production
    }

    config_func = env_map.get(environment)

    if config_func:
        return config_func()
    else:
        # Default to loading from .env file
        return AIConfig()


# ===================================================================
# Example .env file template
# ===================================================================

ENV_FILE_TEMPLATE = """# AI Service Configuration
# Copy this to .env and fill in your values

# Required
OPENAI_API_KEY=sk-...

# Optional
ANTHROPIC_API_KEY=sk-ant-...

# Environment
ENV=development  # development, staging, production

# Model Selection
DEFAULT_MODEL=gpt-4o-mini
FALLBACK_MODEL=gpt-4o
USE_CLAUDE_FOR_SAFETY=false

# Performance
REQUEST_TIMEOUT=5.0
MAX_RETRIES=3
RETRY_DELAY_MIN=1.0
RETRY_DELAY_MAX=10.0

# Caching
ENABLE_CACHE=true
CACHE_MAX_SIZE=1000
CACHE_TTL_SECONDS=3600

# Safety
ENABLE_SAFETY_FILTER=true
SAFETY_STRICTNESS=high
BLOCK_ADVICE_KEYWORDS=true

# Cost Controls
MONTHLY_BUDGET_USD=100.0
ALERT_THRESHOLD_USD=80.0
ENABLE_COST_TRACKING=true

# Feature Flags
ENABLE_MERCHANT_NORMALIZATION=true
ENABLE_MERCHANT_SUMMARIES=true
ENABLE_NL_SEARCH=true
ENABLE_AUTH_CONTEXT=true

# Logging
LOG_LEVEL=INFO
LOG_TO_FILE=false
LOG_FILE_PATH=/var/log/ai-service/ai.log

# Monitoring
ENABLE_METRICS=true

# Circuit Breaker
ENABLE_CIRCUIT_BREAKER=true
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60

# Development
DEBUG_MODE=false
MOCK_AI_RESPONSES=false
"""

# ===================================================================
# Example usage
# ===================================================================

if __name__ == "__main__":
    import json

    print("=" * 70)
    print("CONFIGURATION EXAMPLES")
    print("=" * 70)

    # Example 1: Load from environment
    print("\n" + "=" * 70)
    print("EXAMPLE 1: Load from Environment")
    print("=" * 70)

    # Set environment variable
    os.environ["ENV"] = "development"
    os.environ["OPENAI_API_KEY"] = "sk-test-key-12345"

    config = load_config()
    print(f"\nEnvironment: {os.getenv('ENV')}")
    print(f"Model: {config.default_model}")
    print(f"Debug mode: {config.debug_mode}")
    print(f"Cache enabled: {config.enable_cache}")
    print(f"Monthly budget: ${config.monthly_budget_usd}")

    # Example 2: Different environments
    print("\n" + "=" * 70)
    print("EXAMPLE 2: Different Environments")
    print("=" * 70)

    for env in ["development", "staging", "production"]:
        config = load_config(env)
        print(f"\n{env.upper()}:")
        print(f"  Model: {config.default_model}")
        print(f"  Timeout: {config.request_timeout}s")
        print(f"  Cache: {config.enable_cache}")
        print(f"  Debug: {config.debug_mode}")
        print(f"  Budget: ${config.monthly_budget_usd}")

    # Example 3: Config to dict (for logging)
    print("\n" + "=" * 70)
    print("EXAMPLE 3: Config as Dictionary")
    print("=" * 70)

    config = load_config("production")
    config_dict = config.to_dict()

    print("\nProduction config (JSON):")
    print(json.dumps(config_dict, indent=2, default=str))

    # Example 4: Model selection by task
    print("\n" + "=" * 70)
    print("EXAMPLE 4: Model Selection by Task")
    print("=" * 70)

    config = load_config("production")

    tasks = ["normalization", "summary", "parsing", "auth_context", "formatting"]
    for task in tasks:
        model = config.get_model_for_task(task)
        print(f"\n{task}: {model}")

    # Example 5: Generate .env template
    print("\n" + "=" * 70)
    print("EXAMPLE 5: .env File Template")
    print("=" * 70)

    print("\nSave this to .env file:")
    print(ENV_FILE_TEMPLATE)

    # Example 6: Validation
    print("\n" + "=" * 70)
    print("EXAMPLE 6: Configuration Validation")
    print("=" * 70)

    try:
        # This should fail - alert threshold higher than budget
        bad_config = AIConfig(
            openai_api_key="sk-test",
            monthly_budget_usd=50.0,
            alert_threshold_usd=100.0  # Higher than budget!
        )
    except ValueError as e:
        print(f"\nValidation error (expected): {e}")

    try:
        # This should fail - no API key
        bad_config = AIConfig(
            openai_api_key=""
        )
    except ValueError as e:
        print(f"Validation error (expected): {e}")

    print("\n" + "=" * 70)
    print("All examples completed!")
    print("=" * 70)
