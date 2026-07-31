from django.conf import settings
from django.core.mail import send_mail


def send_verification_email(user):
    """
    Sends an email containing a verification link. In development,
    this email is printed to the console (see EMAIL_BACKEND in settings).
    In production, this would go through a real email provider.
    """
    verification_link = (
        f"{settings.FRONTEND_URL}/verify-email"
        f"?token={user.email_verification_token}"
    )

    subject = "Verify your WishJourney account"
    message = (
        f"Hi {user.username},\n\n"
        f"Thanks for signing up for WishJourney! Please verify your "
        f"email address by clicking the link below:\n\n"
        f"{verification_link}\n\n"
        f"If you didn't create this account, you can safely ignore this email."
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def send_password_reset_email(user):
    """
    Sends an email containing a password reset link. The link includes
    a one-time token that expires after 1 hour (checked in the view).
    """
    reset_link = (
        f"{settings.FRONTEND_URL}/reset-password"
        f"?token={user.password_reset_token}"
    )

    subject = "Reset your WishJourney password"
    message = (
        f"Hi {user.username},\n\n"
        f"We received a request to reset your password. Click the link "
        f"below to set a new one. This link expires in 1 hour.\n\n"
        f"{reset_link}\n\n"
        f"If you didn't request this, you can safely ignore this email."
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )