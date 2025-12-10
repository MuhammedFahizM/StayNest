# # accounts/tasks.py

# from celery import shared_task
# from django.core.mail import send_mail
# from django.conf import settings

# @shared_task
# def send_verification_email(email, verify_url):
#     send_mail(
#         "Verify your StayNest account",
#         f"Click to verify your email: {verify_url}",
#         settings.DEFAULT_FROM_EMAIL,
#         [email],
#         fail_silently=False,
#     )


# @shared_task
# def send_password_reset_email(email, reset_url):
#     send_mail(
#         "Reset your StayNest password",
#         f"Click to reset your password: {reset_url}",
#         settings.DEFAULT_FROM_EMAIL,
#         [email],
#         fail_silently=False,
#     )


from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings


@shared_task
def send_verification_email(email, verify_url):
    subject = "Verify your StayNest account"
    from_email = settings.DEFAULT_FROM_EMAIL

    html_content = render_to_string("verify_email.html", {"verify_url": verify_url})
    text_content = f"Verify your email: {verify_url}"

    msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()


@shared_task
def send_password_reset_email(email, reset_url):
    subject = "Reset your StayNest password"
    from_email = settings.DEFAULT_FROM_EMAIL

    html_content = render_to_string("reset_password.html", {"reset_url": reset_url})
    text_content = f"Reset your password: {reset_url}"

    msg = EmailMultiAlternatives(subject, text_content, from_email, [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()
