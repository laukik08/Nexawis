"""
NEXAWIS Backend - Secure Structured Logging.
Includes redaction filter to prevent accidental logging of credentials, keys, and tokens.
"""

import logging
import re
import sys
from typing import Set

# Patterns to scrub from log messages
SENSITIVE_PATTERNS = [
    re.compile(r"password['\"]?\s*[:=]\s*['\"]?([^'\"\s,]+)", re.IGNORECASE),
    re.compile(r"secret['\"]?\s*[:=]\s*['\"]?([^'\"\s,]+)", re.IGNORECASE),
    re.compile(r"token['\"]?\s*[:=]\s*['\"]?([^'\"\s,]+)", re.IGNORECASE),
    re.compile(r"Bearer\s+([A-Za-z0-9_\-\.]+)", re.IGNORECASE),
    re.compile(r":([^:@\s]+)@([a-zA-Z0-9\.\-]+):(\d+)", re.IGNORECASE),  # DB passwords in URIs
]


class SensitiveDataFilter(logging.Filter):
    """
    Log filter that redacts sensitive keys, tokens, and database credentials
    from all log records before they are emitted to handlers.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            for pattern in SENSITIVE_PATTERNS:
                record.msg = pattern.sub(self._replace_sensitive, record.msg)
        return True

    @staticmethod
    def _replace_sensitive(match: re.Match) -> str:
        # If the match has groups, mask the matched credential group
        full = match.group(0)
        for group in match.groups():
            if group:
                full = full.replace(group, "***REDACTED***")
        return full


def setup_logging(level: str = "INFO") -> None:
    """
    Configures root and application loggers with secure formatting and redaction.
    """
    numeric_level = getattr(logging, level.upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    handler.addFilter(SensitiveDataFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)

    # Avoid duplicate handlers if setup_logging is called multiple times
    if not root_logger.handlers:
        root_logger.addHandler(handler)
    else:
        root_logger.handlers = [handler]

    # Silence overly verbose third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


# Expose standard application logger
logger = logging.getLogger("nexawis.backend")
