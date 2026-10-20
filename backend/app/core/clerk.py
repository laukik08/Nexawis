"""
NEXAWIS Backend - Clerk JWT Verification and Token Handling.
Validates RS256 Bearer tokens issued by Clerk using JWKS key sets,
PEM public keys, or verified issuer claims.
Zero client-supplied identity claims are trusted without verification.
"""

from typing import Any, Dict, Optional
import jwt
from jwt import PyJWKClient, PyJWKClientError
from app.core.config import settings
from app.core.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    TokenExpiredError,
    ConfigurationError,
)
from app.core.logging import logger

# Lazy-loaded singleton JWKS client with internal caching
_jwks_client: Optional[PyJWKClient] = None

# Optional test public key override for isolated unit/integration tests
_test_public_key: Optional[str] = None
_test_algorithms: Optional[list[str]] = None


def set_test_verification_key(public_key: Optional[str], algorithms: Optional[list[str]] = None) -> None:
    """Configures an in-memory key override exclusively for automated testing."""
    global _test_public_key, _test_algorithms
    _test_public_key = public_key
    _test_algorithms = algorithms


def get_jwks_client() -> Optional[PyJWKClient]:
    """Returns or lazily initializes the cached PyJWKClient."""
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client

    jwks_url = settings.get_clerk_jwks_url()
    if not jwks_url:
        return None

    try:
        _jwks_client = PyJWKClient(
            uri=jwks_url,
            cache_keys=True,
            max_cached_keys=16,
            cache_jwk_set=True,
            lifespan=3600,  # Cache JWKS for 1 hour
        )
        return _jwks_client
    except Exception as exc:
        logger.error(f"Failed to initialize Clerk JWKS client: {exc}")
        return None


def verify_clerk_token(token: str) -> Dict[str, Any]:
    """
    Cryptographically verifies a Clerk Bearer JWT.
    
    Validates:
    - Token structure and formatting
    - Cryptographic signature (RS256 via JWKS or configured PEM key)
    - Expiration timestamp (exp)
    - Not-before timestamp (nbf)
    - Issuer (iss, if CLERK_ISSUER configured)
    - Authorized party / audience (azp/aud, if configured)
    - Presence of subject (sub)
    
    Raises:
    - TokenExpiredError if expired
    - InvalidTokenError if signature, structure, or claims fail
    - AuthenticationError if Clerk configuration is completely missing
    """
    if not token or not isinstance(token, str):
        raise InvalidTokenError("Missing or invalid token string.")

    token = token.strip()
    if not token:
        raise InvalidTokenError("Bearer token cannot be empty.")

    # 1. Test Key Override (for hermetic automated test suites)
    if _test_public_key is not None:
        algorithms = _test_algorithms or ["RS256", "HS256"]
        try:
            payload = jwt.decode(
                token,
                _test_public_key,
                algorithms=algorithms,
                options={"verify_exp": True, "verify_nbf": True},
            )
            if "sub" not in payload:
                raise InvalidTokenError("Token missing subject identifier (sub).")
            return payload
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired.")
        except jwt.InvalidTokenError as exc:
            raise InvalidTokenError(f"Token validation failed: {str(exc)}")

    # 2. Direct PEM Public Key verification
    if settings.CLERK_PEM_PUBLIC_KEY:
        try:
            options = {
                "verify_exp": True,
                "verify_nbf": True,
            }
            kwargs: Dict[str, Any] = {
                "algorithms": settings.CLERK_JWT_ALGORITHMS,
                "options": options,
            }
            if settings.CLERK_ISSUER:
                kwargs["issuer"] = settings.CLERK_ISSUER.strip().rstrip("/")
            if settings.CLERK_AUDIENCE:
                kwargs["audience"] = settings.CLERK_AUDIENCE

            payload = jwt.decode(token, settings.CLERK_PEM_PUBLIC_KEY, **kwargs)
            if "sub" not in payload:
                raise InvalidTokenError("Token missing subject identifier (sub).")

            # Validate azp (Authorized Party) if configured
            if settings.CLERK_AUTHORIZED_PARTIES:
                azp = payload.get("azp")
                allowed = settings.CLERK_AUTHORIZED_PARTIES
                if isinstance(allowed, str):
                    allowed = [p.strip() for p in allowed.split(",") if p.strip()]
                if azp not in allowed:
                    raise InvalidTokenError(f"Unauthorized token party (azp): {azp}")

            return payload
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired.")
        except jwt.InvalidTokenError as exc:
            raise InvalidTokenError(f"Token verification failed: {str(exc)}")

    # 3. JWKS Key Verification (Clerk standard)
    jwks_client = get_jwks_client()
    if not jwks_client:
        logger.warning("Clerk authentication verification failed: neither JWKS URL nor PEM key is configured.")
        raise AuthenticationError(
            message="Server authentication provider is not configured. Please contact the administrator.",
            code="AUTH_NOT_CONFIGURED",
        )

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
    except PyJWKClientError as exc:
        raise InvalidTokenError(f"Failed to obtain signing key from JWKS: {str(exc)}")
    except Exception as exc:
        raise InvalidTokenError("Malformed token header or missing signing key.")

    try:
        kwargs = {
            "algorithms": settings.CLERK_JWT_ALGORITHMS,
            "options": {
                "verify_exp": True,
                "verify_nbf": True,
            },
        }
        if settings.CLERK_ISSUER:
            kwargs["issuer"] = settings.CLERK_ISSUER.strip().rstrip("/")
        if settings.CLERK_AUDIENCE:
            kwargs["audience"] = settings.CLERK_AUDIENCE

        payload = jwt.decode(token, signing_key.key, **kwargs)
        if "sub" not in payload:
            raise InvalidTokenError("Token missing subject identifier (sub).")

        # Validate azp (Authorized Party) if configured
        if settings.CLERK_AUTHORIZED_PARTIES:
            azp = payload.get("azp")
            allowed = settings.CLERK_AUTHORIZED_PARTIES
            if isinstance(allowed, str):
                allowed = [p.strip() for p in allowed.split(",") if p.strip()]
            if azp not in allowed:
                raise InvalidTokenError(f"Unauthorized token party (azp): {azp}")

        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError("Token has expired.")
    except jwt.InvalidIssuerError:
        raise InvalidTokenError("Token issuer mismatch.")
    except jwt.InvalidAudienceError:
        raise InvalidTokenError("Token audience mismatch.")
    except jwt.InvalidTokenError as exc:
        raise InvalidTokenError(f"Token verification failed: {str(exc)}")
