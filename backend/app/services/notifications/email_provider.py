"""
NEXAWIS Backend - Email Delivery Provider Abstraction.
Supports simulated delivery (development & testing) and secure SMTP delivery.
Protects sensitive information, prevents credential leaks, and labels simulated messages explicitly.
"""

import uuid
import smtplib
import asyncio
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from typing import List, Optional, Dict, Any

from app.core.config import settings
from app.core.logging import logger


@dataclass
class EmailAttachment:
    filename: str
    content: bytes
    content_type: str = "application/pdf"


@dataclass
class EmailMessage:
    to_email: str
    subject: str
    text_content: str
    html_content: Optional[str] = None
    attachments: List[EmailAttachment] = field(default_factory=list)
    headers: Dict[str, str] = field(default_factory=dict)


@dataclass
class EmailDeliveryResult:
    recipient: str
    success: bool
    is_simulated: bool
    message_id: Optional[str] = None
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "recipient": self.recipient,
            "success": self.success,
            "is_simulated": self.is_simulated,
            "message_id": self.message_id,
            "error_message": self.error_message,
            "timestamp": self.timestamp.isoformat(),
        }


class BaseEmailProvider(ABC):
    """Abstract interface for email delivery providers."""

    @abstractmethod
    async def send(self, message: EmailMessage) -> EmailDeliveryResult:
        """Sends a single email message asynchronously."""
        pass

    async def send_batch(self, messages: List[EmailMessage]) -> List[EmailDeliveryResult]:
        """Sends multiple email messages, gathering results."""
        results = []
        for msg in messages:
            res = await self.send(msg)
            results.append(res)
        return results


class SimulatedEmailProvider(BaseEmailProvider):
    """
    Simulated email provider for development and testing environments.
    Guarantees no external network transmission occurs and marks outcomes as simulated.
    Provides inspection storage for automated tests.
    """

    def __init__(self):
        self.sent_messages: List[EmailMessage] = []

    async def send(self, message: EmailMessage) -> EmailDeliveryResult:
        # Simulate minor async processing latency
        await asyncio.sleep(0.01)

        sim_id = f"sim-{uuid.uuid4().hex[:12]}"
        self.sent_messages.append(message)

        # Sanitize recipient for log privacy
        masked_recipient = (
            message.to_email[:3] + "***@" + message.to_email.split("@")[-1]
            if "@" in message.to_email
            else "***"
        )
        logger.info(
            f"[SIMULATED EMAIL] ID={sim_id} To={masked_recipient} "
            f"Subject='{message.subject}' Attachments={len(message.attachments)}"
        )

        return EmailDeliveryResult(
            recipient=message.to_email,
            success=True,
            is_simulated=True,
            message_id=sim_id,
            error_message=None,
        )

    def clear(self):
        """Clears test sent messages."""
        self.sent_messages.clear()


class SmtpEmailProvider(BaseEmailProvider):
    """
    Standard SMTP delivery provider with TLS encryption and timeout controls.
    Credentials and host settings are read exclusively from server-side environment.
    """

    def __init__(
        self,
        host: str,
        port: int = 587,
        user: Optional[str] = None,
        password: Optional[str] = None,
        use_tls: bool = True,
        sender: str = "notifications@nexawis.internal",
        timeout_seconds: int = 15,
    ):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
        self.use_tls = use_tls
        self.sender = sender
        self.timeout = timeout_seconds

    def _build_mime_message(self, message: EmailMessage) -> MIMEMultipart:
        mime_msg = MIMEMultipart("mixed")
        mime_msg["From"] = self.sender
        mime_msg["To"] = message.to_email
        mime_msg["Subject"] = message.subject
        mime_msg["Date"] = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
        msg_id = f"<{uuid.uuid4()}@{self.host}>"
        mime_msg["Message-ID"] = msg_id

        # Headers
        for k, v in message.headers.items():
            mime_msg[k] = v

        # Body parts
        alt_part = MIMEMultipart("alternative")
        alt_part.attach(MIMEText(message.text_content, "plain", "utf-8"))
        if message.html_content:
            alt_part.attach(MIMEText(message.html_content, "html", "utf-8"))
        mime_msg.attach(alt_part)

        # Attachments
        for att in message.attachments:
            part = MIMEApplication(att.content, Name=att.filename)
            part["Content-Disposition"] = f'attachment; filename="{att.filename}"'
            mime_msg.attach(part)

        return mime_msg

    def _sync_send(self, message: EmailMessage) -> EmailDeliveryResult:
        mime_msg = self._build_mime_message(message)
        msg_id = mime_msg["Message-ID"]

        try:
            with smtplib.SMTP(self.host, self.port, timeout=self.timeout) as server:
                server.ehlo()
                if self.use_tls:
                    server.starttls()
                    server.ehlo()
                if self.user and self.password:
                    server.login(self.user, self.password)
                server.send_message(mime_msg)

            return EmailDeliveryResult(
                recipient=message.to_email,
                success=True,
                is_simulated=False,
                message_id=msg_id,
            )
        except smtplib.SMTPException as exc:
            logger.error(f"SMTP error delivering to {message.to_email}: {type(exc).__name__}")
            return EmailDeliveryResult(
                recipient=message.to_email,
                success=False,
                is_simulated=False,
                error_message=f"SMTP Error: {type(exc).__name__}",
            )
        except Exception as exc:
            logger.error(f"Network error delivering email to {message.to_email}: {type(exc).__name__}")
            return EmailDeliveryResult(
                recipient=message.to_email,
                success=False,
                is_simulated=False,
                error_message=f"Network Error: {type(exc).__name__}",
            )

    async def send(self, message: EmailMessage) -> EmailDeliveryResult:
        # Offload blocking socket I/O to async worker thread pool
        return await asyncio.to_thread(self._sync_send, message)


_global_email_provider: Optional[BaseEmailProvider] = None


def get_email_provider() -> BaseEmailProvider:
    """Singleton factory for obtaining the configured email delivery provider."""
    global _global_email_provider
    if _global_email_provider is not None:
        return _global_email_provider

    if settings.EMAIL_PROVIDER == "smtp" and settings.SMTP_HOST:
        pwd = settings.SMTP_PASSWORD.get_secret_value() if settings.SMTP_PASSWORD else None
        _global_email_provider = SmtpEmailProvider(
            host=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            user=settings.SMTP_USER,
            password=pwd,
            use_tls=settings.SMTP_TLS,
            sender=settings.EMAIL_FROM,
            timeout_seconds=settings.EMAIL_TIMEOUT_SECONDS,
        )
    else:
        _global_email_provider = SimulatedEmailProvider()

    return _global_email_provider


def set_email_provider(provider: BaseEmailProvider) -> None:
    """Overrides provider instance for testing or dynamic mocking."""
    global _global_email_provider
    _global_email_provider = provider
