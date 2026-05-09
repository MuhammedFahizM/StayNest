from datetime import date
import json
import hmac
import hashlib
import re
import logging
import traceback

import razorpay
import requests as http_requests
from requests.auth import HTTPBasicAuth
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from datetime import date
from django.utils import timezone
from .models import MonthlyLedger


from .models import (
    Booking, Payment, OwnerPaymentProfile,
    MonthlyLedger, OfflineTransaction, DepositRecord, Notification,
    FoodSubscriptionRequest,OfflineRegister,
)
from .razorpay_client import client
from .ledger_utils import create_month1_ledger, auto_create_deposit_record, _notify

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
# Owner payment setup (unchanged logic)
# ─────────────────────────────────────────────

class OwnerActivatePayments(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        owner = request.user

        if not all([
            owner.owner.bank_account_number,
            owner.owner.bank_ifsc_code,
            owner.owner.bank_beneficiary_name
        ]):
            return Response(
                {"error": "Please complete your bank details before activating payments"},
                status=400
            )

        existing = OwnerPaymentProfile.objects.filter(owner=owner).first()
        auth = HTTPBasicAuth(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)

        if existing:
            account_id = existing.razorpay_account_id

            # Verify the account actually exists on Razorpay
            verify_res = http_requests.get(
            f"https://api.razorpay.com/v2/accounts/{account_id}",
            auth=auth
            )
            if verify_res.status_code == 404:
            # Account is broken/deleted on Razorpay side — wipe DB row and recreate
                logger.warning(f"Razorpay account {account_id} not found on Razorpay. Recreating.")
                existing.delete()
                existing = None  # falls through to the creation block below

        if not existing:
            phone = owner.owner.phone
            if not phone.startswith("+"):
                phone = "+91" + phone

            try:
                account = client.account.create({
                    "type": "route",
                    "email": owner.email,
                    "phone": phone,
                    "legal_business_name": owner.get_full_name() or owner.username,
                    "business_type": "individual",
                    "profile": {
                        "category": "others",
                        "subcategory": "others",
                        "addresses": {
                            "registered": {
                                "street1": owner.owner.address,
                                "street2": "N/A",
                                "city": owner.owner.city,
                                "state": owner.owner.state,
                                "postal_code": int(owner.owner.postal_code) if owner.owner.postal_code else 0,
                                "country": "IN"
                            }
                        }
                    }
                })
                account_id = account["id"]

            except razorpay.errors.BadRequestError as e:
                msg = str(e)
                logger.error(f"Razorpay BadRequestError: {msg}")
                if "already exists" in msg:
                    # Don't rely on regex — fetch by email directly
                    try:
                        accounts_res = http_requests.get(
                            "https://api.razorpay.com/v2/accounts",
                            auth=auth,
                            params={"email": owner.email}
                        )
                        items = accounts_res.json().get("items", [])
                        if not items:
                            return Response({"error": "Account exists but could not be fetched"}, status=500)
                        account_id = items[0]["id"]
                    except Exception as fetch_err:
                        logger.error(f"Could not fetch existing account: {fetch_err}")
                        return Response({"error": "Account exists but could not be fetched"}, status=500)
                else:
                    return Response({"error": "Could not create payment account"}, status=500)

            OwnerPaymentProfile.objects.create(
                owner=owner,
                razorpay_account_id=account_id,
                payments_enabled=False
            )


        try:
            print(f"Starting onboarding for account_id: {account_id}")
            full_name = owner.get_full_name().strip() or owner.owner.bank_beneficiary_name or owner.username
            print(f"Stakeholder name being sent: {full_name}")
            stakeholder_payload = {
                "name": full_name,
                "email": owner.email,
                "phone": {"primary": owner.owner.phone, "secondary": ""},
                "addresses": {
                    "residential": {
                        "street": owner.owner.address,
                        "city": owner.owner.city,
                        "state": owner.owner.state,
                        "postal_code": str(owner.owner.postal_code) if owner.owner.postal_code else "0",
                        "country": "IN"
                    }
                }
            }
            # Fetch existing stakeholders first
            stakeholder_res = http_requests.get(
                f"https://api.razorpay.com/v2/accounts/{account_id}/stakeholders",
                auth=auth
            )
            stakeholder_data = stakeholder_res.json()
            print(f"Existing stakeholders: {stakeholder_data}")

            existing_stakeholders = stakeholder_data.get("items", [])

            if existing_stakeholders:
                # PATCH the existing stakeholder instead of creating new
                stakeholder_id = existing_stakeholders[0]["id"]
                patch_res = http_requests.patch(
                    f"https://api.razorpay.com/v2/accounts/{account_id}/stakeholders/{stakeholder_id}",
                        auth=auth,
                        json=stakeholder_payload
                    )
                print(f"Stakeholder PATCH response: {patch_res.json()}")
            else:
                # No stakeholder yet — create new
                post_res = http_requests.post(
                    f"https://api.razorpay.com/v2/accounts/{account_id}/stakeholders",
                        auth=auth,
                        json=stakeholder_payload
                    )
                print(f"Stakeholder POST response: {post_res.json()}")

            product_res = http_requests.post(
                f"https://api.razorpay.com/v2/accounts/{account_id}/products",
                auth=auth, json={"product_name": "route"}
            )
            product_data = product_res.json()
            product_id = product_data.get("id")

            if not product_id:
                fetch_res = http_requests.get(
                    f"https://api.razorpay.com/v2/accounts/{account_id}/products",
                    auth=auth
                )
                items = fetch_res.json().get("items", [])
                route_product = next((p for p in items if p.get("product_name") == "route"), None)
                if not route_product:
                    return Response({"error": "Could not create payment product"}, status=500)
                product_id = route_product["id"]

            onboarding_res = http_requests.patch(
                f"https://api.razorpay.com/v2/accounts/{account_id}/products/{product_id}",
                auth=auth,
                json={
                    "tnc_accepted": True,
                    "settlements": {
                        "account_number": owner.owner.bank_account_number,
                        "ifsc_code": owner.owner.bank_ifsc_code,
                        "beneficiary_name": owner.owner.bank_beneficiary_name,
                    }
                }
            )
            onboarding_data = onboarding_res.json()
            print(f"PATCH onboarding response: {onboarding_data}")  # ← ADD THIS
            onboarding_url = onboarding_data.get("onboarding_url", {}).get("signup_url")

            if not onboarding_url:
                get_res = http_requests.get(
                    f"https://api.razorpay.com/v2/accounts/{account_id}/products/{product_id}",
                    auth=auth
                )
                get_data = get_res.json()
                print(f"GET product response: {get_data}") # ← ADD THIS
                onboarding_url = get_data.get("onboarding_url", {}).get("signup_url")

            if not onboarding_url:
                activation_status = get_data.get("activation_status")
                if activation_status == "under_review":
                    return Response({
                        "status": "under_review",
                        "message": "Your account is under review by Razorpay. You will be notified once approved.",
                    }, status=200)
                return Response({
                    "error": "Your account requires clarification from Razorpay.",
                }, status=400)

        except Exception as e:
            print(f"Onboarding failed: {e}")
            print(traceback.format_exc())
            return Response({"error": "Could not generate onboarding link"}, status=500)

        return Response({"onboarding_url": onboarding_url})


class OwnerPaymentStatus(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = OwnerPaymentProfile.objects.get(owner=request.user)
            return Response({
                "payments_enabled": profile.payments_enabled,
                "account_id": profile.razorpay_account_id,
                "rent_due_day": profile.rent_due_day,
            })
        except OwnerPaymentProfile.DoesNotExist:
            return Response({"payments_enabled": False})


class OwnerUpdateRentDueDay(APIView):
    """Owner sets which day of the month rent is due (1–28)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        due_day = request.data.get("rent_due_day")
        if not due_day or not str(due_day).isdigit():
            return Response({"error": "Invalid due day"}, status=400)
        due_day = int(due_day)
        if not 1 <= due_day <= 28:
            return Response({"error": "Due day must be between 1 and 28"}, status=400)

        profile, _ = OwnerPaymentProfile.objects.get_or_create(owner=request.user)
        profile.rent_due_day = due_day
        profile.save(update_fields=["rent_due_day"])
        return Response({"rent_due_day": due_day})


# ─────────────────────────────────────────────
# Online payment orders
# ─────────────────────────────────────────────

class CreatePaymentOrder(APIView):
    """Advance payment for a new booking."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(
                id=booking_id, user=request.user
            ).first()

            if not booking:
                return Response({"error": "Booking not found"}, status=404)

            if booking.status != Booking.Status.APPROVED_AWAITING_PAYMENT:
                return Response({"error": "Booking not eligible for payment"}, status=400)

            if booking.payment_deadline and booking.payment_deadline < timezone.now():
                return Response({"error": "Payment window expired"}, status=400)

            existing = Payment.objects.filter(
                booking=booking,
                payment_type=Payment.PaymentType.ADVANCE,
                status=Payment.Status.SUCCESS,
            ).exists()
            if existing:
                return Response({"error": "Advance already paid"}, status=400)

            pending = Payment.objects.filter(
                booking=booking,
                payment_type=Payment.PaymentType.ADVANCE,
                status=Payment.Status.CREATED,
            ).first()
            if pending:
                return Response({
                    "order_id": pending.razorpay_order_id,
                    "amount": pending.amount,
                    "razorpay_key": settings.RAZORPAY_KEY_ID,
                })

        try:
            owner_profile = OwnerPaymentProfile.objects.get(owner=booking.property.owner)
        except OwnerPaymentProfile.DoesNotExist:
            return Response({"error": "Owner payments not enabled"}, status=400)

        amount = booking.sharing_option.advance_amount
        order = client.order.create({
            "amount": int(amount * 100),
            "currency": "INR",
            "transfers": [{
                "account": owner_profile.razorpay_account_id,
                "amount": int(amount * 100),
                "currency": "INR",
                "notes": {"booking_id": booking.id},
            }]
        })

        payment = Payment.objects.create(
            booking=booking,
            user=request.user,
            payment_type=Payment.PaymentType.ADVANCE,
            amount=amount,
            razorpay_order_id=order["id"],
        )
        logger.info(f"Advance order created | trace={payment.trace_id} | booking={booking.id}")

        return Response({
            "order_id": order["id"],
            "amount": amount,
            "razorpay_key": settings.RAZORPAY_KEY_ID,
        })


class CreateRentPaymentOrder(APIView):
    """
    Balance rent (first month, status=CONFIRMED) or
    monthly rent (status=ACTIVE, must reference an open ledger).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        ledger_id = request.data.get("ledger_id")  # required for ACTIVE monthly rent

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(
                id=booking_id, user=request.user
            ).first()

            if not booking:
                return Response({"error": "Booking not found"}, status=404)

            if booking.status not in [Booking.Status.CONFIRMED, Booking.Status.ACTIVE]:
                return Response({"error": "Booking not eligible for payment"}, status=400)

            sharing = booking.sharing_option

            if booking.status == Booking.Status.CONFIRMED:
                # Balance rent — first month
                existing_balance = Payment.objects.filter(
                    booking=booking,
                    payment_type=Payment.PaymentType.BALANCE,
                    status=Payment.Status.SUCCESS,
                ).exists()
                if existing_balance:
                    return Response({"error": "Balance already paid"}, status=400)

                pending = Payment.objects.filter(
                    booking=booking,
                    payment_type=Payment.PaymentType.BALANCE,
                    status=Payment.Status.CREATED,
                ).first()
                if pending:
                    return Response({
                        "order_id": pending.razorpay_order_id,
                        "amount": pending.amount,
                        "razorpay_key": settings.RAZORPAY_KEY_ID,
                    })

                amount = sharing.rent_amount - sharing.advance_amount
                payment_type = Payment.PaymentType.BALANCE
                ledger_obj = None

            else:
                # Monthly rent — must have a ledger_id
                if not ledger_id:
                    return Response({"error": "ledger_id required for monthly rent"}, status=400)

                ledger_obj = MonthlyLedger.objects.filter(
                    id=ledger_id, booking=booking
                ).first()
                if not ledger_obj:
                    return Response({"error": "Ledger entry not found"}, status=404)

                if ledger_obj.rent_is_paid:
                    return Response({"error": "Rent already paid for this month"}, status=400)
                
                if ledger_obj.rent_status == MonthlyLedger.RentStatus.PAID_ONLINE:
                    return Response({"error": "Already paid"}, status=400)

                # Return existing pending order if any
                pending = Payment.objects.filter(
                    ledger=ledger_obj,
                    payment_type=Payment.PaymentType.RENT,
                    status=Payment.Status.CREATED,
                ).first()
                if pending:
                    return Response({
                        "order_id": pending.razorpay_order_id,
                        "amount": pending.amount,
                        "razorpay_key": settings.RAZORPAY_KEY_ID,
                    })

                amount = ledger_obj.rent_amount
                payment_type = Payment.PaymentType.RENT

            owner = booking.property.owner

        owner_profile = OwnerPaymentProfile.objects.get(owner=owner)
        amount_paise = int(amount * 100)

        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "transfers": [{
                "account": owner_profile.razorpay_account_id,
                "amount": amount_paise,
                "currency": "INR",
                "notes": {"booking_id": booking.id},
            }]
        })

        payment = Payment.objects.create(
            booking=booking,
            user=request.user,
            payment_type=payment_type,
            amount=amount,
            razorpay_order_id=order["id"],
            ledger=ledger_obj,
        )
        logger.info(f"Rent/balance order created | trace={payment.trace_id} | booking={booking.id}")

        return Response({
            "order_id": order["id"],
            "amount": amount,
            "razorpay_key": settings.RAZORPAY_KEY_ID,
        })


class CreateFoodPaymentOrder(APIView):
    """Monthly food payment — requires a ledger_id."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        ledger_id = request.data.get("ledger_id")

        with transaction.atomic():
            booking = Booking.objects.select_for_update().filter(
                id=booking_id, user=request.user
            ).first()

            if not booking:
                return Response({"error": "Booking not found"}, status=404)

            if booking.status != Booking.Status.ACTIVE:
                return Response({"error": "Food payment only for active stays"}, status=400)

            if not booking.food_opted_in:
                return Response({"error": "You have not opted into food"}, status=400)

            if not booking.property.food_provided:
                return Response({"error": "Food not available at this property"}, status=400)

            ledger_obj = MonthlyLedger.objects.filter(
                id=ledger_id, booking=booking
            ).first()
            if not ledger_obj:
                return Response({"error": "Ledger entry not found"}, status=404)

            if ledger_obj.food_is_paid:
                return Response({"error": "Food already paid for this month"}, status=400)

            if ledger_obj.food_status == MonthlyLedger.FoodStatus.NOT_APPLICABLE:
                return Response({"error": "Food not applicable for this month"}, status=400)

            pending = Payment.objects.filter(
                ledger=ledger_obj,
                payment_type=Payment.PaymentType.FOOD,
                status=Payment.Status.CREATED,
            ).first()
            if pending:
                return Response({
                    "order_id": pending.razorpay_order_id,
                    "amount": pending.amount,
                    "razorpay_key": settings.RAZORPAY_KEY_ID,
                })

            amount = ledger_obj.food_amount or booking.property.food_price
            if not amount or amount <= 0:
                return Response({"error": "Invalid food price"}, status=400)

        owner_profile = OwnerPaymentProfile.objects.get(owner=booking.property.owner)

        order = client.order.create({
            "amount": int(amount * 100),
            "currency": "INR",
            "transfers": [{
                "account": owner_profile.razorpay_account_id,
                "amount": int(amount * 100),
                "currency": "INR",
                "notes": {"booking_id": booking.id},
            }]
        })

        payment = Payment.objects.create(
            booking=booking,
            user=request.user,
            payment_type=Payment.PaymentType.FOOD,
            amount=amount,
            razorpay_order_id=order["id"],
            ledger=ledger_obj,
        )

        return Response({
            "order_id": order["id"],
            "amount": amount,
            "razorpay_key": settings.RAZORPAY_KEY_ID,
        })


# ─────────────────────────────────────────────
# Offline payment marking
# ─────────────────────────────────────────────

class MarkOfflinePayment(APIView):
    """
    Owner or user marks a rent/food payment as paid via cash.
    The other side must confirm to close the ledger entry.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ledger_id = request.data.get("ledger_id")
        payment_field = request.data.get("payment_type")  # "RENT" or "FOOD"
        amount = request.data.get("amount")
        note = request.data.get("note", "")

        if payment_field not in ["RENT", "FOOD"]:
            return Response({"error": "payment_type must be RENT or FOOD"}, status=400)

        ledger = MonthlyLedger.objects.select_related(
            "booking__property__owner", "booking__user"
        ).filter(id=ledger_id).first()

        if not ledger:
            return Response({"error": "Ledger not found"}, status=404)

        booking = ledger.booking
        user = request.user
        is_owner = (user == booking.property.owner)
        is_tenant = (user == booking.user)

        if not is_owner and not is_tenant:
            return Response({"error": "Not authorised"}, status=403)

        txn_type = (
            OfflineTransaction.TransactionType.RENT
            if payment_field == "RENT"
            else OfflineTransaction.TransactionType.FOOD
        )

        # Check if already paid
        if payment_field == "RENT" and ledger.rent_is_paid:
            return Response({"error": "Rent already paid this month"}, status=400)
        if payment_field == "FOOD" and ledger.food_is_paid:
            return Response({"error": "Food already paid this month"}, status=400)

        with transaction.atomic():
            txn = OfflineTransaction.objects.create(
                booking=booking,
                ledger=ledger,
                initiated_by=user,
                transaction_type=txn_type,
                amount= (
                    ledger.rent_amount if payment_field == "RENT" else ledger.food_amount
                ),
                note=note,
                status=OfflineTransaction.Status.PENDING_CONFIRMATION,
            )

            # Mark the initiator's side immediately
            if payment_field == "RENT":
                if is_owner:
                    ledger.rent_offline_confirmed_by_owner = True
                else:
                    ledger.rent_offline_confirmed_by_user = True
            else:
                if is_owner:
                    ledger.food_offline_confirmed_by_owner = True
                else:
                    ledger.food_offline_confirmed_by_user = True

            ledger.save()

            # Check if both sides confirmed → close the ledger entry
            _try_close_offline(ledger, payment_field)

        # Notify the other side
        other = booking.user if is_owner else booking.property.owner
        who = "Owner" if is_owner else booking.user.get_full_name() or booking.user.username

        _notify(
            recipient=other,
            notif_type=Notification.NotifType.OFFLINE_MARK,
            title=f"Offline {payment_field.lower()} payment marked",
            message=(
                f"{who} has marked the {payment_field.lower()} for "
                f"{ledger.month_label} as paid via cash. "
                "Please confirm on your end."
            ),
            booking=booking,
            ledger=ledger,
        )

        return Response({"status": "marked", "txn_id": txn.id})


class ConfirmOfflinePayment(APIView):
    """
    The other side confirms a cash payment.
    When both sides have confirmed, the ledger entry is closed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ledger_id = request.data.get("ledger_id")
        payment_field = request.data.get("payment_type")  # "RENT" or "FOOD"

        if payment_field not in ["RENT", "FOOD"]:
            return Response({"error": "payment_type must be RENT or FOOD"}, status=400)

        ledger = MonthlyLedger.objects.select_related(
            "booking__property__owner", "booking__user"
        ).filter(id=ledger_id).first()

        if not ledger:
            return Response({"error": "Ledger not found"}, status=404)

        booking = ledger.booking
        user = request.user
        is_owner = (user == booking.property.owner)
        is_tenant = (user == booking.user)

        if not is_owner and not is_tenant:
            return Response({"error": "Not authorised"}, status=403)

        with transaction.atomic():
            if payment_field == "RENT":
                if is_owner:
                    ledger.rent_offline_confirmed_by_owner = True
                else:
                    ledger.rent_offline_confirmed_by_user = True
            else:
                if is_owner:
                    ledger.food_offline_confirmed_by_owner = True
                else:
                    ledger.food_offline_confirmed_by_user = True

            ledger.save()
            _try_close_offline(ledger, payment_field)

        # Notify the other side
        other = booking.user if is_owner else booking.property.owner
        _notify(
            recipient=other,
            notif_type=Notification.NotifType.OFFLINE_CONFIRMED,
            title=f"Offline {payment_field.lower()} payment confirmed",
            message=(
                f"Cash payment confirmed for {ledger.month_label}. "
                f"Ledger is now updated."
            ),
            booking=booking,
            ledger=ledger,
        )

        return Response({"status": "confirmed"})


def _try_close_offline(ledger: MonthlyLedger, payment_field: str):
    """Close a ledger entry once both sides have confirmed the cash payment."""
    if payment_field == "RENT":
        if ledger.rent_offline_confirmed_by_owner and ledger.rent_offline_confirmed_by_user:
            ledger.rent_status = MonthlyLedger.RentStatus.PAID_OFFLINE
            ledger.rent_paid_at = timezone.now()
            ledger.save(update_fields=["rent_status", "rent_paid_at"])
            # Close any pending offline txn
            OfflineTransaction.objects.filter(
                ledger=ledger,
                transaction_type=OfflineTransaction.TransactionType.RENT,
                status=OfflineTransaction.Status.PENDING_CONFIRMATION,
            ).update(
                status=OfflineTransaction.Status.SUCCESS,
                confirmed_at=timezone.now(),
            )
    else:
        if ledger.food_offline_confirmed_by_owner and ledger.food_offline_confirmed_by_user:
            ledger.food_status = MonthlyLedger.FoodStatus.PAID_OFFLINE
            ledger.food_paid_at = timezone.now()
            ledger.save(update_fields=["food_status", "food_paid_at"])
            OfflineTransaction.objects.filter(
                ledger=ledger,
                transaction_type=OfflineTransaction.TransactionType.FOOD,
                status=OfflineTransaction.Status.PENDING_CONFIRMATION,
            ).update(
                status=OfflineTransaction.Status.SUCCESS,
                confirmed_at=timezone.now(),
            )


# ─────────────────────────────────────────────
# Ledger views
# ─────────────────────────────────────────────

class UserLedgerView(APIView):
    """User's full payment history for a booking."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        booking_id = request.query_params.get("booking_id")
        booking = Booking.objects.filter(
            id=booking_id, user=request.user
        ).first()
        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        entries = MonthlyLedger.objects.filter(booking=booking).order_by("-month")
        data = [_serialize_ledger(e, is_owner=False) for e in entries]
        return Response(data)


class OwnerPropertyLedgerView(APIView):
    """Owner sees all ledger entries for a property, grouped by booking."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        property_id = request.query_params.get("property_id")
        booking_id = request.query_params.get("booking_id")

        qs = MonthlyLedger.objects.filter(
            booking__property__owner=request.user
        ).select_related("booking__user", "booking__property")

        if property_id:
            qs = qs.filter(booking__property_id=property_id)
        if booking_id:
            qs = qs.filter(booking_id=booking_id)

        qs = qs.order_by("-month")
        data = [_serialize_ledger(e, is_owner=True) for e in qs]

        # Sort: ACTIVE bookings first, then others
        status_priority = {"ACTIVE": 0, "CONFIRMED": 1, "VACATED": 2, "CANCELLED": 3}
        data.sort(key=lambda x: status_priority.get(x["booking_status"], 9))

        return Response(data)

class OwnerTenantLedgerView(APIView):
    """
    Owner views full ledger + deposit for a specific booking.
    Reuses _serialize_ledger for consistency.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        booking_id = request.query_params.get("booking_id")

        booking = Booking.objects.filter(
            id=booking_id,
            property__owner=request.user,
        ).select_related(
            "user", "property", "sharing_option", "deposit"
        ).first()

        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        entries = MonthlyLedger.objects.filter(
            booking=booking
        ).order_by("-month")

        ledger_data = [_serialize_ledger(e, is_owner=True) for e in entries]

        # Deposit info
        deposit_data = None
        try:
            dep = booking.deposit
            deposit_data = {
                "deposit_amount": str(dep.original_amount) if dep.original_amount else None,
                "returned_amount": str(dep.returned_amount),
                "deposit_status": dep.status,
                "marked_by_owner": dep.marked_by_owner,
                "marked_by_user": dep.marked_by_user,
                "paid_online": dep.paid_online,
                "paid_at": dep.paid_at.isoformat() if dep.paid_at else None,
            }
        except Exception:
            pass

        return Response({
            "booking_id": booking.id,
            "user_name": booking.user.get_full_name() or booking.user.username if booking.user else "N/A",
            "property_name": booking.property.property_name,
            "sharing_label": f"{booking.sharing_option.sharing_type}-Sharing",
            "booking_status": booking.status,
            "food_opted_in": booking.food_opted_in,
            "food_opt_in_date": booking.food_opt_in_date.isoformat() if booking.food_opt_in_date else None,
            "ledger": ledger_data,
            "deposit": deposit_data,
        })
    
class OwnerTenantListView(APIView):
    """
    Owner gets list of all tenants grouped by active/vacated,
    optionally filtered by property.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        property_id = request.query_params.get("property_id")

        bookings = Booking.objects.filter(
            property__owner=request.user,
            status__in=[
                Booking.Status.ACTIVE,
                Booking.Status.VACATED,
                Booking.Status.CONFIRMED,
            ]
        ).select_related("user", "property", "sharing_option", "deposit")

        if property_id:
            bookings = bookings.filter(property_id=property_id)

        def serialize_tenant(b):
            deposit_status = None
            deposit_amount = None
            try:
                deposit_status = b.deposit.status
                deposit_amount = str(b.deposit.original_amount)
            except Exception:
                pass

            return {
                "booking_id": b.id,
                "user_name": b.user.get_full_name() or b.user.username if b.user else "N/A",
                "property_name": b.property.property_name,
                "sharing_label": f"{b.sharing_option.sharing_type}-Sharing",
                "booking_status": b.status,
                "deposit_status": deposit_status,
                "deposit_amount": deposit_amount,
            }

        active = [b for b in bookings if b.status in [
            Booking.Status.ACTIVE, Booking.Status.CONFIRMED
        ]]
        vacated = [b for b in bookings if b.status == Booking.Status.VACATED]

        # Sort active: deposit pending first
        def deposit_priority(b):
            try:
                s = b.deposit.status
                if s == "PENDING_RECEIPT": return 0
                if s == "PENDING_CONFIRMATION": return 1
                return 2
            except Exception:
                return 0

        active.sort(key=deposit_priority)

        return Response({
            "active": [serialize_tenant(b) for b in active],
            "vacated": [serialize_tenant(b) for b in vacated],
        })
        

def _serialize_ledger(entry: MonthlyLedger, is_owner: bool) -> dict:
    booking = entry.booking

    # Food upcoming info
    food_opt_in_date = booking.food_opt_in_date
    food_request_pending = booking.food_requests.filter(
        status=FoodSubscriptionRequest.Status.PENDING
    ).first()

    food_upcoming_month = None
    if entry.food_status == MonthlyLedger.FoodStatus.NOT_APPLICABLE:
        if food_opt_in_date:
            food_upcoming_month = food_opt_in_date.isoformat()
        elif food_request_pending and food_request_pending.effective_from_month:
            food_upcoming_month = food_request_pending.effective_from_month.isoformat()

    d = {
        "id": entry.id,
        "month": entry.month.isoformat(),
        "month_label": entry.month_label,
        "booking_id": booking.id,
        "property_name": booking.property.property_name,
        "sharing_label": f"{booking.sharing_option.sharing_type}-Sharing",
        # Rent
        "rent_amount": str(entry.rent_amount),
        "rent_due_date": entry.rent_due_date.isoformat(),
        "rent_status": entry.rent_status,
        "rent_paid_at": entry.rent_paid_at.isoformat() if entry.rent_paid_at else None,
        # Offline flags
        "rent_offline_confirmed_by_owner": entry.rent_offline_confirmed_by_owner,
        "rent_offline_confirmed_by_user": entry.rent_offline_confirmed_by_user,
        # Food
        "food_amount": str(entry.food_amount) if entry.food_amount else None,
        "food_status": entry.food_status,
        "food_paid_at": entry.food_paid_at.isoformat() if entry.food_paid_at else None,
        "food_offline_confirmed_by_owner": entry.food_offline_confirmed_by_owner,
        "food_offline_confirmed_by_user": entry.food_offline_confirmed_by_user,
        "food_upcoming_month": food_upcoming_month,
        "overall_status": entry.overall_status,
        "booking_status": booking.status,
    }
    if is_owner:
        d["user_name"] = booking.user.get_full_name() or booking.user.username if booking.user else "N/A"
    return d

class CurrentLedgerView(APIView):
    """
    Returns current month's ledger + what user should do next.
    This becomes the single source for frontend decisions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        booking_id = request.query_params.get("booking_id")

        booking = Booking.objects.filter(
            id=booking_id,
            user=request.user
        ).first()

        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        today = timezone.now().date()
        current_month = date(today.year, today.month, 1)

        ledger = MonthlyLedger.objects.filter(
            booking=booking,
            month=current_month
        ).first()

        from .ledger_utils import create_next_month_ledger

        if not ledger:
            create_next_month_ledger(booking, current_month)
            ledger = MonthlyLedger.objects.filter(
                booking=booking,
                month=current_month
            ).first()

        # 🔥 CORE LOGIC (THIS FIXES YOUR SYSTEM)
        rent_due = not ledger.rent_is_paid
        food_due = (
            ledger.food_status == MonthlyLedger.FoodStatus.PENDING
            and not ledger.food_is_paid
        )

        if not rent_due and not food_due:
            action = "NONE"
        elif rent_due and food_due:
            action = "PAY_BOTH"
        elif rent_due:
            action = "PAY_RENT"
        else:
            action = "PAY_FOOD"

        return Response({
            "ledger_id": ledger.id,
            "month": ledger.month_label,
            "rent_amount": ledger.rent_amount,
            "food_amount": ledger.food_amount,
            "rent_status": ledger.rent_status,
            "food_status": ledger.food_status,
            "rent_due_date": ledger.rent_due_date,
            "action": action,   # 🔥 frontend will use this
        })


# ─────────────────────────────────────────────
# Food subscription
# ─────────────────────────────────────────────

class UserFoodSubscriptionView(APIView):
    """User opts in or cancels food subscription."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        action = request.data.get("action")  # "opt_in" or "opt_out"

        if action not in ["opt_in", "opt_out"]:
            return Response({"error": "action must be opt_in or opt_out"}, status=400)

        booking = Booking.objects.filter(
            id=booking_id, user=request.user, status=Booking.Status.ACTIVE
        ).first()
        if not booking:
            return Response({"error": "Active booking not found"}, status=404)

        if not booking.property.food_provided:
            return Response({"error": "Food not available at this property"}, status=400)

        if action == "opt_in" and booking.food_opted_in:
            return Response({"error": "Already opted into food"}, status=400)

        if action == "opt_out":
            has_future_subscription = booking.food_opt_in_date is not None

            if not booking.food_opted_in and not has_future_subscription:
                return Response({"error": "No active or scheduled food subscription"}, status=400)
        
        

        start_from = request.data.get("start_from", "next")  # "current" or "next"

        today = timezone.now().date()
        current_month = date(today.year, today.month, 1)

        if start_from == "current":
            effective_month = current_month
        else:
            # next month
            if today.month == 12:
                effective_month = date(today.year + 1, 1, 1)
            else:
                effective_month = date(today.year, today.month + 1, 1)

        req_type = (
            FoodSubscriptionRequest.RequestType.OPT_IN
            if action == "opt_in"
            else FoodSubscriptionRequest.RequestType.OPT_OUT
        )

        food_req = FoodSubscriptionRequest.objects.create(
            booking=booking,
            request_type=req_type,
            effective_from_month=effective_month,
        )

        # Notify owner
        _notify(
            recipient=booking.property.owner,
            notif_type=(
                Notification.NotifType.FOOD_REQUEST
                if action == "opt_in"
                else Notification.NotifType.FOOD_CANCELLED
            ),
            title=(
                "Food subscription request"
                if action == "opt_in"
                else "Food cancellation request"
            ),
            message=(
                f"{request.user.get_full_name() or request.user.username} has requested to "
                f"{'start' if action == 'opt_in' else 'cancel'} food at "
                f"{booking.property.property_name}."
            ),
            booking=booking,
        )

        return Response({"status": "requested", "request_id": food_req.id})


class OwnerFoodSubscriptionResponseView(APIView):
    """Owner accepts or rejects a food subscription request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        food_req_id = request.data.get("food_request_id")
        action = request.data.get("action")  # "accept" or "reject"

        if action not in ["accept", "reject"]:
            return Response({"error": "action must be accept or reject"}, status=400)

        food_req = FoodSubscriptionRequest.objects.select_related(
            "booking__property__owner", "booking__user", "booking__property"
        ).filter(
            id=food_req_id,
            booking__property__owner=request.user,
            status=FoodSubscriptionRequest.Status.PENDING,
        ).first()

        if not food_req:
            return Response({"error": "Request not found"}, status=404)

        booking = food_req.booking

        with transaction.atomic():
            food_req.status = (
                FoodSubscriptionRequest.Status.ACCEPTED
                if action == "accept"
                else FoodSubscriptionRequest.Status.REJECTED
            )
            food_req.responded_at = timezone.now()
            food_req.save()


            if action == "accept":
                # today = timezone.now().date()
                # next_month = date(today.year, today.month, 1)

                # # move to next month start
                # if today.day > 1:
                #     if today.month == 12:
                #         next_month = date(today.year + 1, 1, 1)
                #     else:
                #         next_month = date(today.year, today.month + 1, 1)

                effective_month = food_req.effective_from_month

                if food_req.request_type == FoodSubscriptionRequest.RequestType.OPT_IN:
                    booking.food_opted_in = True
                    booking.food_opt_in_date = effective_month
                    booking.save(update_fields=["food_opted_in", "food_opt_in_date"])

                else:
                    booking.food_opted_in = False
                    booking.food_opt_out_date = effective_month
                    booking.save(update_fields=["food_opted_in", "food_opt_out_date"])

                current_ledger = MonthlyLedger.objects.filter(
                    booking=booking,
                    month=effective_month
                ).first()

                if current_ledger:
                    if food_req.request_type == FoodSubscriptionRequest.RequestType.OPT_IN:
                        food_price = booking.property.food_price
                        current_ledger.food_status = MonthlyLedger.FoodStatus.PENDING
                        current_ledger.food_amount = food_price if food_price else None

                    elif food_req.request_type == FoodSubscriptionRequest.RequestType.OPT_OUT:
                        current_ledger.food_status = MonthlyLedger.FoodStatus.NOT_APPLICABLE
                        current_ledger.food_amount = None

                    current_ledger.save(update_fields=["food_status", "food_amount"])


        verb = (
            "started" if (
                action == "accept"
                and food_req.request_type == FoodSubscriptionRequest.RequestType.OPT_IN
            )
            else "cancelled" if (
                action == "accept"
                and food_req.request_type == FoodSubscriptionRequest.RequestType.OPT_OUT
            )
            else "not changed (request rejected)"
        )

        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.FOOD_REQUEST,
            title="Food subscription update",
            message=(
                f"Your food subscription at {booking.property.property_name} "
                f"has been {verb} by the owner."
            ),
            booking=booking,
        )

        return Response({"status": action + "ed"})


class OwnerFoodRequestsView(APIView):
    """Owner lists all pending food subscription requests."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reqs = FoodSubscriptionRequest.objects.filter(
            booking__property__owner=request.user,
            status=FoodSubscriptionRequest.Status.PENDING,
        ).select_related("booking__user", "booking__property").order_by("-requested_at")

        data = [
            {
                "id": r.id,
                "booking_id": r.booking_id,
                "user_name": r.booking.user.get_full_name() or r.booking.user.username,
                "property_name": r.booking.property.property_name,
                "request_type": r.request_type,
                "requested_at": r.requested_at.isoformat(),
                "effective_from_month": r.effective_from_month.isoformat() if r.effective_from_month else None,
            }
            for r in reqs
        ]
        return Response(data)


# ─────────────────────────────────────────────
# Deposit — online payment order
# ─────────────────────────────────────────────

class CreateDepositPaymentOrder(APIView):
    """
    User pays deposit online via Razorpay. No forced timing —
    they can do this anytime after booking is CONFIRMED or ACTIVE.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        booking = Booking.objects.filter(
            id=booking_id,
            user=request.user,
            status__in=[Booking.Status.CONFIRMED, Booking.Status.ACTIVE],
        ).first()
        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        deposit = DepositRecord.objects.filter(booking=booking).first()
        if deposit and deposit.status == DepositRecord.Status.HELD_BY_OWNER:
            return Response({"error": "Deposit already confirmed"}, status=400)

        if not deposit or not deposit.original_amount:
            return Response({"error": "No deposit amount set. Contact your owner."}, status=400)

        # Check for existing pending online order
        pending = Payment.objects.filter(
            booking=booking,
            payment_type=Payment.PaymentType.DEPOSIT,
            status=Payment.Status.CREATED,
        ).first()
        if pending:
            return Response({
                "order_id": pending.razorpay_order_id,
                "amount": pending.amount,
                "razorpay_key": settings.RAZORPAY_KEY_ID,
            })

        try:
            owner_profile = OwnerPaymentProfile.objects.get(owner=booking.property.owner)
        except OwnerPaymentProfile.DoesNotExist:
            return Response({"error": "Owner payments not enabled"}, status=400)

        amount = deposit.original_amount
        order = client.order.create({
            "amount": int(amount * 100),
            "currency": "INR",
            "transfers": [{
                "account": owner_profile.razorpay_account_id,
                "amount": int(amount * 100),
                "currency": "INR",
                "notes": {"booking_id": booking.id, "type": "deposit"},
            }]
        })

        payment = Payment.objects.create(
            booking=booking,
            user=request.user,
            payment_type=Payment.PaymentType.DEPOSIT,
            amount=amount,
            razorpay_order_id=order["id"],
        )
        logger.info(f"Deposit order created | trace={payment.trace_id} | booking={booking.id}")

        return Response({
            "order_id": order["id"],
            "amount": amount,
            "razorpay_key": settings.RAZORPAY_KEY_ID,
        })


# ─────────────────────────────────────────────
# Deposit — offline dual-confirm (move-in)
# Either side can mark; the other confirms → HELD_BY_OWNER
# ─────────────────────────────────────────────

class MarkDepositPaidOffline(APIView):
    """
    Owner or user marks the deposit as paid via cash/transfer.
    The other side must confirm. Once both confirm → HELD_BY_OWNER.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        amount = request.data.get("amount")
        note = request.data.get("note", "")

        booking = Booking.objects.select_related(
            "property__owner", "user"
        ).filter(
            id=booking_id,
            status__in=[Booking.Status.CONFIRMED, Booking.Status.ACTIVE],
        ).first()
        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        user = request.user
        is_owner = (user == booking.property.owner)
        is_tenant = (user == booking.user)
        if not is_owner and not is_tenant:
            return Response({"error": "Not authorised"}, status=403)

        deposit, _ = DepositRecord.objects.get_or_create(
            booking=booking,
            defaults={"original_amount": amount or 0},
        )

        if deposit.status == DepositRecord.Status.HELD_BY_OWNER:
            return Response({"error": "Deposit already confirmed as held"}, status=400)

        if not deposit.original_amount and amount:
            deposit.original_amount = amount
        deposit.note = note

        if is_owner:
            deposit.marked_by_owner = True
        else:
            deposit.marked_by_user = True

        deposit.status = DepositRecord.Status.PENDING_CONFIRMATION
        deposit.save()

        _try_close_deposit(deposit)

        # Notify the other side
        other = booking.user if is_owner else booking.property.owner
        who = "Owner" if is_owner else (booking.user.get_full_name() or booking.user.username)
        _notify(
            recipient=other,
            notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
            title="Deposit payment marked",
            message=(
                f"{who} has marked the deposit of ₹{deposit.original_amount} "
                f"as paid via cash for {booking.property.property_name}. "
                "Please confirm on your end."
            ),
            booking=booking,
        )

        return Response({"status": "marked"})


class ConfirmDepositPaid(APIView):
    """
    The other side confirms the cash deposit.
    Once both sides confirm → HELD_BY_OWNER.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        booking = Booking.objects.select_related(
            "property__owner", "user"
        ).filter(
            id=booking_id,
            status__in=[Booking.Status.CONFIRMED, Booking.Status.ACTIVE],
        ).first()
        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        user = request.user
        is_owner = (user == booking.property.owner)
        is_tenant = (user == booking.user)
        if not is_owner and not is_tenant:
            return Response({"error": "Not authorised"}, status=403)

        deposit = DepositRecord.objects.filter(booking=booking).first()
        if not deposit or deposit.status not in [
            DepositRecord.Status.PENDING_CONFIRMATION,
            DepositRecord.Status.PENDING_RECEIPT,
        ]:
            return Response({"error": "Nothing to confirm"}, status=404)

        if is_owner:
            deposit.marked_by_owner = True
        else:
            deposit.marked_by_user = True
        deposit.save()

        _try_close_deposit(deposit)

        other = booking.user if is_owner else booking.property.owner
        _notify(
            recipient=other,
            notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
            title="Deposit confirmed",
            message=(
                f"Both sides have confirmed the deposit of ₹{deposit.original_amount} "
                f"for {booking.property.property_name}."
            ),
            booking=booking,
        )

        return Response({"status": "confirmed"})


def _try_close_deposit(deposit: DepositRecord):
    """Close deposit as HELD once both sides have confirmed."""
    if deposit.marked_by_owner and deposit.marked_by_user:
        deposit.status = DepositRecord.Status.HELD_BY_OWNER
        deposit.paid_at = timezone.now()
        deposit.save(update_fields=["status", "paid_at"])


class OwnerConfirmDepositPaid(APIView):
    """Owner confirms tenant's cash deposit payment."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        booking = Booking.objects.select_related(
            "property__owner", "user"
        ).filter(
            id=booking_id,
            property__owner=request.user,
        ).first()

        if not booking:
            return Response({"error": "Booking not found"}, status=404)

        deposit = DepositRecord.objects.filter(booking=booking).first()
        if not deposit or deposit.status not in [
            DepositRecord.Status.PENDING_CONFIRMATION,
            DepositRecord.Status.PENDING_RECEIPT,
        ]:
            return Response({"error": "Nothing to confirm"}, status=400)

        if not deposit.marked_by_user:
            return Response({"error": "Tenant has not marked this as paid yet"}, status=400)

        deposit.marked_by_owner = True
        deposit.save()
        _try_close_deposit(deposit)

        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
            title="Deposit confirmed by owner",
            message=(
                f"Your deposit of ₹{deposit.original_amount} for "
                f"{booking.property.property_name} has been confirmed by the owner."
            ),
            booking=booking,
        )

        return Response({"status": "confirmed"})


class OwnerDepositListView(APIView):
    """Owner sees deposit status for all bookings across their properties."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        property_id = request.query_params.get("property_id")

        bookings = Booking.objects.filter(
            property__owner=request.user
        ).select_related("user", "property", "deposit")

        if property_id:
            bookings = bookings.filter(property_id=property_id)

        data = []
        for b in bookings:
            try:
                deposit = b.deposit
            except Exception:
                continue  # skip bookings with no deposit record

            data.append({
                "booking_id": b.id,
                "user_name": b.user.get_full_name() or b.user.username if b.user else "N/A",
                "property_name": b.property.property_name,
                "booking_status": b.status,
                "deposit_amount": str(deposit.original_amount) if deposit.original_amount else None,
                "returned_amount": str(deposit.returned_amount),
                "deposit_status": deposit.status,
                "marked_by_owner": deposit.marked_by_owner,
                "marked_by_user": deposit.marked_by_user,
                "paid_online": deposit.paid_online,
                "paid_at": deposit.paid_at.isoformat() if deposit.paid_at else None,
                "owner_return_note": deposit.owner_return_note,
            })

        return Response(data)


# ─────────────────────────────────────────────
# Deposit — return on vacate (unchanged logic)
# ─────────────────────────────────────────────

class OwnerMarkDepositReturned(APIView):
    """Owner marks deposit as returned after vacate."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        returned_amount = request.data.get("returned_amount")
        note = request.data.get("note", "")

        booking = Booking.objects.filter(
            id=booking_id,
            property__owner=request.user,
            status=Booking.Status.VACATED,
        ).first()
        if not booking:
            return Response({"error": "Vacated booking not found"}, status=404)

        deposit = DepositRecord.objects.filter(booking=booking).first()
        if not deposit:
            return Response({"error": "No deposit record found"}, status=404)

        if deposit.status in [DepositRecord.Status.RETURNED, DepositRecord.Status.PARTIAL_RETURNED]:
            return Response({"error": "Deposit already marked as returned"}, status=400)

        deposit.returned_amount = returned_amount or deposit.original_amount
        deposit.owner_return_note = note
        deposit.status = DepositRecord.Status.RETURN_MARKED
        deposit.save()

        _notify(
            recipient=booking.user,
            notif_type=Notification.NotifType.DEPOSIT_RETURNED,
            title="Deposit return marked",
            message=(
                f"Your owner has marked ₹{deposit.returned_amount} as returned "
                f"for {booking.property.property_name}. Please confirm once received."
            ),
            booking=booking,
        )
        return Response({"status": "marked"})


class UserConfirmDepositReturned(APIView):
    """User confirms they received the deposit back."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")

        booking = Booking.objects.filter(
            id=booking_id,
            user=request.user,
            status=Booking.Status.VACATED,
        ).first()
        if not booking:
            return Response({"error": "Vacated booking not found"}, status=404)

        deposit = DepositRecord.objects.filter(
            booking=booking,
            status=DepositRecord.Status.RETURN_MARKED,
        ).first()
        if not deposit:
            return Response({"error": "No pending deposit return to confirm"}, status=404)

        full = deposit.returned_amount >= deposit.original_amount
        deposit.status = (
            DepositRecord.Status.RETURNED if full else DepositRecord.Status.PARTIAL_RETURNED
        )
        deposit.save()

        _notify(
            recipient=booking.property.owner,
            notif_type=Notification.NotifType.DEPOSIT_RETURNED,
            title="Deposit return confirmed",
            message=(
                f"{request.user.get_full_name() or request.user.username} confirmed "
                f"receiving ₹{deposit.returned_amount} deposit for "
                f"{booking.property.property_name}."
            ),
            booking=booking,
        )
        return Response({"status": "confirmed"})


# ─────────────────────────────────────────────
# Notifications
# ─────────────────────────────────────────────

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifs = Notification.objects.filter(
            recipient=request.user
        ).order_by("-created_at")[:50]

        data = [
            {
                "id": n.id,
                "type": n.notif_type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "booking_id": n.booking_id,
                "ledger_id": n.ledger_id,
                "property_id_ref": n.property_id_ref,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifs
        ]
        return Response(data)

    def patch(self, request):
        """Mark all notifications as read."""
        Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({"status": "ok"})


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        Notification.objects.filter(
            id=pk, recipient=request.user
        ).update(is_read=True)
        return Response({"status": "ok"})


# ─────────────────────────────────────────────
# Razorpay Webhook
# ─────────────────────────────────────────────

class RazorpayWebhook(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        secret = settings.RAZORPAY_WEBHOOK_SECRET
        body = request.body
        signature = request.headers.get("X-Razorpay-Signature")

        generated = hmac.new(
            key=secret.encode("utf-8"),
            msg=body,
            digestmod=hashlib.sha256
        ).hexdigest()

        if generated != signature:
            return Response(status=400)

        payload = json.loads(body)

        if payload["event"] == "payment.captured":
            entity = payload["payload"]["payment"]["entity"]
            order_id = entity["order_id"]
            payment_id = entity["id"]

            with transaction.atomic():
                payment = Payment.objects.select_for_update().filter(
                    razorpay_order_id=order_id
                ).first()

                if not payment:
                    return Response(status=200)

                if entity["amount"] != int(payment.amount * 100):
                    logger.warning(f"Amount mismatch | trace={payment.trace_id}")
                    return Response({"error": "Amount mismatch"}, status=400)

                if payment.status == Payment.Status.SUCCESS:
                    return Response(status=200)

                payment.status = Payment.Status.SUCCESS
                payment.razorpay_payment_id = payment_id
                payment.paid_at = timezone.now()
                payment.razorpay_signature = signature
                payment.save()

                booking = payment.booking

                if payment.payment_type == Payment.PaymentType.ADVANCE:
                    booking.status = Booking.Status.CONFIRMED
                    booking.save()
                    # Notify owner
                    _notify(
                        recipient=booking.property.owner,
                        notif_type=Notification.NotifType.PAYMENT_RECEIVED,
                        title="Advance payment received",
                        message=(
                            f"{payment.user.get_full_name() or payment.user.username} "
                            f"has paid the advance of ₹{payment.amount} for "
                            f"{booking.property.property_name}."
                        ),
                        booking=booking,
                    )

                    # Notify user
                    _notify(
                        recipient=booking.user,
                        notif_type=Notification.NotifType.PAYMENT_RECEIVED,
                        title="Advance paid — now pay balance rent",
                        message=(
                            f"Your advance of ₹{payment.amount} for "
                            f"{booking.property.property_name} is confirmed. "
                            f"Please pay the balance rent of "
                            f"₹{booking.sharing_option.rent_amount - booking.sharing_option.advance_amount} "
                            "to activate your stay."
                        ),
                        booking=booking,
                    )

                elif payment.payment_type == Payment.PaymentType.BALANCE:
                    booking.status = Booking.Status.ACTIVE
                    booking.save()
                    # Month 1 ledger — rent is PAID
                    create_month1_ledger(booking)
                    # Auto-create deposit record from sharing option
                    auto_create_deposit_record(booking)

                    # Notify user — stay is now active
                    _notify(
                        recipient=booking.user,
                        notif_type=Notification.NotifType.BOOKING_ACTIVE,
                        title="You're all set! Stay is now active",
                        message=(
                            f"Your stay at {booking.property.property_name} is now active. "
                            "Welcome! You can manage your payments, food subscription, "
                            "and deposit from the Payments section."
                        ),
                        booking=booking,
                    )
                    # Notify owner
                    _notify(
                        recipient=booking.property.owner,
                        notif_type=Notification.NotifType.BOOKING_ACTIVE,
                        title="New active tenant",
                        message=(
                            f"{payment.user.get_full_name() or payment.user.username} "
                            f"has completed payment and is now an active tenant at "
                            f"{booking.property.property_name}."
                        ),
                        booking=booking,
                    )

                elif payment.payment_type == Payment.PaymentType.RENT:
                    # Monthly rent — update ledger
                    if payment.ledger:
                        payment.ledger.rent_status = MonthlyLedger.RentStatus.PAID_ONLINE
                        payment.ledger.rent_paid_at = timezone.now()
                        payment.ledger.save(update_fields=["rent_status", "rent_paid_at"])
                        _notify(
                            recipient=booking.property.owner,
                            notif_type=Notification.NotifType.PAYMENT_RECEIVED,
                            title="Monthly rent received",
                            message=(
                                f"{payment.user.get_full_name() or payment.user.username} "
                                f"paid rent of ₹{payment.amount} for "
                                f"{payment.ledger.month_label} at "
                                f"{booking.property.property_name}."
                            ),
                            booking=booking,
                            ledger=payment.ledger,
                        )

                elif payment.payment_type == Payment.PaymentType.DEPOSIT:
                    # Online deposit paid — mark as confirmed on both sides automatically
                    deposit, _ = DepositRecord.objects.get_or_create(
                        booking=booking,
                        defaults={"original_amount": payment.amount},
                    )
                    deposit.paid_online = True
                    deposit.paid_at = timezone.now()
                    deposit.marked_by_owner = True
                    deposit.marked_by_user = True
                    deposit.status = DepositRecord.Status.HELD_BY_OWNER
                    deposit.save()
                    _notify(
                        recipient=booking.property.owner,
                        notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
                        title="Deposit received online",
                        message=(
                            f"{payment.user.get_full_name() or payment.user.username} "
                            f"has paid the deposit of ₹{payment.amount} online for "
                            f"{booking.property.property_name}."
                        ),
                        booking=booking,
                    )
                    _notify(
                        recipient=booking.user,
                        notif_type=Notification.NotifType.DEPOSIT_RECEIVED,
                        title="Deposit paid successfully",
                        message=(
                            f"Your deposit of ₹{payment.amount} for "
                            f"{booking.property.property_name} has been paid online."
                        ),
                        booking=booking,
                    )
                elif payment.payment_type == Payment.PaymentType.FOOD:
                    if payment.ledger:
                        payment.ledger.food_status = MonthlyLedger.FoodStatus.PAID_ONLINE
                        payment.ledger.food_paid_at = timezone.now()
                        payment.ledger.save(update_fields=["food_status", "food_paid_at"])
                        _notify(
                            recipient=booking.property.owner,
                            notif_type=Notification.NotifType.PAYMENT_RECEIVED,
                            title="Food payment received",
                            message=(
                                f"{payment.user.get_full_name() or payment.user.username} "
                                f"paid food charges of ₹{payment.amount} for "
                                f"{payment.ledger.month_label}."
                            ),
                            booking=booking,
                            ledger=payment.ledger,
                        )

                logger.info(f"Payment success | trace={payment.trace_id} | booking={booking.id}")

            return Response(status=200)

        elif payload["event"] in ["account.activated", "account.instantly_activated"]:
            account_id = payload["payload"]["account"]["entity"]["id"]
            OwnerPaymentProfile.objects.filter(
                razorpay_account_id=account_id
            ).update(payments_enabled=True)
            return Response(status=200)

        return Response(status=200)


# ─────────────────────────────────────────────
# Upcoming month payments
# ─────────────────────────────────────────────

class UserUpcomingPaymentView(APIView):
    """
    Returns next month's expected payment for a booking.
    Uses existing ledger if already created, otherwise calculates from booking data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        booking_id = request.query_params.get("booking_id")

        booking = Booking.objects.filter(
            id=booking_id,
            user=request.user,
            status=Booking.Status.ACTIVE,
        ).select_related(
            "property__owner__ownerpaymentprofile",
            "sharing_option",
        ).first()

        if not booking:
            return Response({"error": "Active booking not found"}, status=404)

        today = timezone.now().date()
        if today.month == 12:
            next_month = date(today.year + 1, 1, 1)
        else:
            next_month = date(today.year, today.month + 1, 1)

        # Check if ledger already exists for next month
        ledger = MonthlyLedger.objects.filter(
            booking=booking,
            month=next_month,
        ).first()

        if ledger:
            rent_val = float(ledger.rent_amount)
            food_val = float(ledger.food_amount) if ledger.food_amount else 0
            return Response({
        "month": next_month.isoformat(),
        "month_label": ledger.month_label,
        "rent_amount": str(ledger.rent_amount),
        "rent_due_date": ledger.rent_due_date.isoformat(),
        "rent_status": ledger.rent_status,
        "food_amount": str(ledger.food_amount) if ledger.food_amount else None,
        "food_status": ledger.food_status,
        "total": str(rent_val + food_val),
        "source": "ledger",
    })

        # Calculate from booking data
        from .ledger_utils import get_due_date
        rent = booking.frozen_rent_amount or booking.sharing_option.rent_amount

        due_day = 5
        try:
            due_day = booking.property.owner.ownerpaymentprofile.rent_due_day
        except Exception:
            pass

        due_date = get_due_date(next_month.year, next_month.month, due_day)

        food_amount = None
        food_applicable = False
        if booking.food_opted_in and booking.property.food_provided:
            if booking.food_opt_in_date:
                food_applicable = booking.food_opt_in_date <= next_month
            else:
                food_applicable = True

        if food_applicable:
            food_amount = booking.property.food_price

        total = float(rent) + (float(food_amount) if food_amount else 0)

        return Response({
            "month": next_month.isoformat(),
            "month_label": next_month.strftime("%B %Y"),
            "rent_amount": str(rent),
            "rent_due_date": due_date.isoformat(),
            "rent_status": "UPCOMING",
            "food_amount": str(food_amount) if food_amount else None,
            "food_status": "UPCOMING" if food_applicable else "NA",
            "total": str(total),
            "source": "calculated",
        })


class OwnerUpcomingPaymentView(APIView):
    """
    Returns next month's expected collections for all active tenants.
    Per tenant breakdown + total.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        property_id = request.query_params.get("property_id")

        from .ledger_utils import get_due_date

        today = timezone.now().date()
        if today.month == 12:
            next_month = date(today.year + 1, 1, 1)
        else:
            next_month = date(today.year, today.month + 1, 1)

        bookings = Booking.objects.filter(
            property__owner=request.user,
            status=Booking.Status.ACTIVE,
        ).select_related(
            "user", "property", "sharing_option",
            "property__owner__ownerpaymentprofile",
        )

        if property_id:
            bookings = bookings.filter(property_id=property_id)

        results = []
        total_rent = 0
        total_food = 0

        for booking in bookings:
            # Check if ledger already exists
            ledger = MonthlyLedger.objects.filter(
                booking=booking,
                month=next_month,
            ).first()

            due_day = 5
            try:
                due_day = booking.property.owner.ownerpaymentprofile.rent_due_day
            except Exception:
                pass

            due_date = get_due_date(next_month.year, next_month.month, due_day)

            if ledger:
                rent = float(ledger.rent_amount)
                food = float(ledger.food_amount) if ledger.food_amount else 0
                food_applicable = ledger.food_status != MonthlyLedger.FoodStatus.NOT_APPLICABLE
                rent_status = ledger.rent_status
                food_status = ledger.food_status
            else:
                rent = float(booking.frozen_rent_amount or booking.sharing_option.rent_amount)
                food = 0
                food_applicable = False
                rent_status = "UPCOMING"
                food_status = "NA"

                if booking.food_opted_in and booking.property.food_provided:
                    if booking.food_opt_in_date:
                        food_applicable = booking.food_opt_in_date <= next_month
                    else:
                        food_applicable = True

                if food_applicable and booking.property.food_price:
                    food = float(booking.property.food_price)
                    food_status = "UPCOMING"

            total_rent += rent
            total_food += food

            results.append({
                "booking_id": booking.id,
                "user_name": booking.user.get_full_name() or booking.user.username if booking.user else "N/A",
                "property_name": booking.property.property_name,
                "sharing_label": f"{booking.sharing_option.sharing_type}-Sharing",
                "rent_amount": str(rent),
                "rent_due_date": due_date.isoformat(),
                "rent_status": rent_status,
                "food_amount": str(food) if food else None,
                "food_status": food_status,
                "food_applicable": food_applicable,
                "total": str(rent + food),
                "source": "ledger" if ledger else "calculated",
            })

        # Sort: food applicable first, then by name
        results.sort(key=lambda x: (
            0 if x["food_applicable"] else 1,
            x["user_name"]
        ))

        return Response({
            "month": next_month.isoformat(),
            "month_label": next_month.strftime("%B %Y"),
            "tenants": results,
            "summary": {
                "total_tenants": len(results),
                "total_rent": str(total_rent),
                "total_food": str(total_food),
                "grand_total": str(total_rent + total_food),
            }
        })


# ─────────────────────────────────────────────
# Offline Register Book (non-converted TenantSlots)
# ─────────────────────────────────────────────

class OfflineRegisterListView(APIView):
    """
    Owner lists all register entries for their slots.
    Optionally filtered by property and/or month.
    Also auto-creates current month entry if missing.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import TenantSlot
        property_id = request.query_params.get("property_id")
        month_str = request.query_params.get("month")  # format: "2026-04"

        # Determine month to show
        today = timezone.now().date()
        if month_str:
            try:
                year, month = map(int, month_str.split("-"))
                current_month = date(year, month, 1)
            except Exception:
                current_month = date(today.year, today.month, 1)
        else:
            current_month = date(today.year, today.month, 1)

        # Get slots owned by this owner, not yet converted
        slots = TenantSlot.objects.filter(
            property__owner=request.user,
            is_converted=False,
        ).select_related("sharing_option", "property")

        if property_id:
            slots = slots.filter(property_id=property_id)

        results = []
        for slot in slots:
            # Auto-create entry for requested month if missing
            prev_entry = OfflineRegister.objects.filter(
                slot=slot
            ).order_by("-month").first()

            food_opted = prev_entry.food_opted if prev_entry else False
            food_amount = prev_entry.food_amount if (prev_entry and food_opted) else None
            food_status = (
                OfflineRegister.FoodStatus.PENDING
                if food_opted
                else OfflineRegister.FoodStatus.NOT_APPLICABLE
            )
            deposit_amount = prev_entry.deposit_amount if prev_entry else slot.property.security_deposit
            deposit_status = prev_entry.deposit_status if prev_entry else OfflineRegister.DepositStatus.PENDING

            entry, _ = OfflineRegister.objects.get_or_create(
                slot=slot,
                month=current_month,
                defaults={
                    "rent_amount": slot.sharing_option.rent_amount,
                    "rent_status": OfflineRegister.RentStatus.PENDING,
                    "food_opted": food_opted,
                    "food_amount": food_amount,
                    "food_status": food_status,
                    "deposit_amount": deposit_amount,
                    "deposit_status": deposit_status,
                },
            )

            results.append(_serialize_register(entry))

        # Sort: rent pending first
        results.sort(key=lambda x: (
            0 if x["rent_status"] == "PENDING" else 1
        ))

        return Response(results)


class OfflineRegisterUpdateView(APIView):
    """
    Owner updates a register entry —
    mark rent paid/waived, toggle food, update deposit.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        entry_id = request.data.get("entry_id")
        action = request.data.get("action")

        entry = OfflineRegister.objects.select_related(
            "slot__property__owner"
        ).filter(id=entry_id).first()

        if not entry:
            return Response({"error": "Entry not found"}, status=404)

        if entry.slot.property.owner != request.user:
            return Response({"error": "Not authorised"}, status=403)

        if action == "mark_rent_paid":
            entry.rent_status = OfflineRegister.RentStatus.PAID_CASH
            entry.rent_paid_date = timezone.now().date()

        elif action == "mark_rent_pending":
            entry.rent_status = OfflineRegister.RentStatus.PENDING
            entry.rent_paid_date = None

        elif action == "waive_rent":
            entry.rent_status = OfflineRegister.RentStatus.WAIVED
            entry.rent_paid_date = timezone.now().date()

        elif action == "toggle_food":
            food_opted = not entry.food_opted
            entry.food_opted = food_opted
            if food_opted:
                food_amount = request.data.get("food_amount")
                property_food_price = entry.slot.property.food_price
                resolved_amount = food_amount or property_food_price

                if not resolved_amount:
                    return Response(
                        {
                            "error": (
                                "This property has no food price set. "
                                "Please update the property's food price before enabling food for offline tenants."
                            )
                        },
                        status=400,
                    )

                entry.food_amount = resolved_amount
                entry.food_status = OfflineRegister.FoodStatus.PENDING
            else:
                entry.food_status = OfflineRegister.FoodStatus.NOT_APPLICABLE
                entry.food_amount = None
                entry.food_paid_date = None

        elif action == "mark_food_paid":
            entry.food_status = OfflineRegister.FoodStatus.PAID_CASH
            entry.food_paid_date = timezone.now().date()

        elif action == "mark_food_pending":
            entry.food_status = OfflineRegister.FoodStatus.PENDING
            entry.food_paid_date = None

        elif action == "waive_food":
            entry.food_status = OfflineRegister.FoodStatus.WAIVED
            entry.food_paid_date = timezone.now().date()

        elif action == "mark_deposit_held":
            amount = request.data.get("deposit_amount")
            if amount:
                entry.deposit_amount = amount
            entry.deposit_status = OfflineRegister.DepositStatus.HELD

        elif action == "mark_deposit_returned":
            returned = request.data.get("returned_amount")
            entry.deposit_returned_amount = returned or entry.deposit_amount or 0
            full = float(entry.deposit_returned_amount) >= float(entry.deposit_amount or 0)
            entry.deposit_status = (
                OfflineRegister.DepositStatus.RETURNED
                if full
                else OfflineRegister.DepositStatus.PARTIAL_RETURNED
            )

        elif action == "update_notes":
            entry.notes = request.data.get("notes", "")

        else:
            return Response({"error": "Invalid action"}, status=400)

        entry.save()
        return Response(_serialize_register(entry))


class OfflineRegisterHistoryView(APIView):
    """Full payment history for a specific slot across all months."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        slot_id = request.query_params.get("slot_id")

        from .models import TenantSlot
        slot = TenantSlot.objects.filter(
            id=slot_id,
            property__owner=request.user,
            is_converted=False,
        ).first()

        if not slot:
            return Response({"error": "Slot not found"}, status=404)

        entries = OfflineRegister.objects.filter(slot=slot).order_by("-month")
        return Response([_serialize_register(e) for e in entries])


def _serialize_register(entry: OfflineRegister) -> dict:
    return {
        "id": entry.id,
        "slot_id": entry.slot_id,
        "tenant_name": entry.slot.tenant_name,
        "property_name": entry.slot.property.property_name,
        "food_price": str(entry.slot.property.food_price) if entry.slot.property.food_price else None,
        "sharing_label": f"{entry.slot.sharing_option.sharing_type}-Sharing",
        "month": entry.month.isoformat(),
        "month_label": entry.month_label,
        # Rent
        "rent_amount": str(entry.rent_amount),
        "rent_status": entry.rent_status,
        "rent_paid_date": entry.rent_paid_date.isoformat() if entry.rent_paid_date else None,
        # Food
        "food_opted": entry.food_opted,
        "food_amount": str(entry.food_amount) if entry.food_amount else None,
        "food_status": entry.food_status,
        "food_paid_date": entry.food_paid_date.isoformat() if entry.food_paid_date else None,
        # Deposit
        "deposit_amount": str(entry.deposit_amount) if entry.deposit_amount else None,
        "deposit_status": entry.deposit_status,
        "deposit_returned_amount": str(entry.deposit_returned_amount),
        # Meta
        "notes": entry.notes,
        "created_at": entry.created_at.isoformat(),
    }
