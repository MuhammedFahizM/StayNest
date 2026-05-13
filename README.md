# StayNest

A full-stack hostel and PG booking platform built with Django REST Framework and React. StayNest connects property owners with tenants, handling the complete lifecycle from property listing to monthly rent collection.

---

## Tech Stack

**Backend**
- Python 3.14.0
- Django 5.2.8 + Django REST Framework
- PostgreSQL
- Celery + RabbitMQ (async tasks, email, monthly ledger jobs)
- Razorpay (online payments + route transfers to owner accounts)
- JWT Authentication (SimpleJWT)

**Frontend**
- React 18 (Vite)
- Bootstrap 5 + Tailwind CSS
- Leaflet + OpenStreetMap (property location maps)
- Axios + React Router v6
- React Hot Toast

---

## Features

### Authentication & Accounts
- Combined registration for users and owners (with ID proof upload)
- Email verification via token link (Celery + HTML email templates)
- JWT login with automatic token refresh and session expiry handling
- Forgot password / reset password flow
- Role-based access: `user`, `owner`, `admin`
- Admin approval required for owner accounts before they can list properties

### Property Management (Owner)
- Multi-step property creation wizard: Basic Info → Capacity & Pricing → Amenities → Location → Images → Review & Submit
- Leaflet map integration with Nominatim geocoding, draggable marker, current location detection
- Multiple sharing options per property (1/2/3/4 sharing) with individual rent, advance, and bed counts
- Image upload with minimum 3 images required before submission
- Admin review workflow: Draft → Submitted → Approved → Active/Inactive
- Audit log for sensitive field changes
- Property status toggle (Active / Inactive) by owner

### Browse & Search (Public)
- Browse all active properties without login
- Filter sidebar: city, area, stay type, preferred occupants, sharing type, rent range, amenities
- Nearby stays using geolocation (5km radius, Haversine distance)
- Active filter chips with individual remove

### Booking Flow
- User requests booking for a specific sharing option
- Owner approves → 24-hour payment window opens
- User pays advance via Razorpay → booking status: `CONFIRMED`
- User pays balance rent → booking status: `ACTIVE`
- Celery task auto-cancels booking if advance not paid within deadline
- Vacate request flow: user requests → owner approves → status: `VACATED`
- Offline-converted bookings via invitation token (no payment required)

### Payment System
- **Advance & Balance Rent** — Razorpay orders with direct route transfer to owner's linked account
- **Monthly Ledger** — Auto-created on the 1st of each month via Celery Beat for all active bookings
- **Monthly Rent Payment** — Online via Razorpay, linked to ledger entry
- **Food Payment** — Separate monthly food charge, paid online per ledger entry
- **Offline (Cash) Payments** — Dual-confirm system: either owner or tenant marks cash paid, other side confirms; ledger closes when both confirm
- **Security Deposit** — Online via Razorpay or offline dual-confirm; return tracked on vacate
- **Overdue tracking** — PENDING ledger entries past due date auto-marked OVERDUE by Celery

### Food Subscription
- Owner enables food with monthly price on property
- Tenant requests food opt-in (current month or next month)
- Owner accepts or rejects; ledger updated accordingly
- Tenant can cancel food subscription; owner acknowledges

### Offline Register Book
- Owner adds offline (cash) tenants as `TenantSlot` without requiring them to register on the platform
- Monthly register entries auto-created on the 1st for all active slots
- Owner marks rent paid/waived, toggles food, tracks deposit — all cash-based
- Full payment history per slot across all months
- Invitation token system to convert offline tenant to a registered platform user

### Owner Payment Onboarding (Razorpay)
- Owner completes KYC via Razorpay route account onboarding
- Bank account details stored; stakeholder created on Razorpay
- Onboarding URL generated for KYC completion
- `payments_enabled` flag set via Razorpay webhook on account activation
- Rent due day configurable per owner (1–28)

### Profiles
- Owner profile: full details, bank info, profile photo, ID proof
- User profile: basic details, profile photo, ID proof
- Public profile access controlled by booking relationship (only allowed in active/confirmed states)

### Notifications (In-App)
- Notifications for booking events, payment events, food requests, deposit updates, vacate, account approval/rejection, property approval/rejection
- Mark all read / mark individual read
- Notification bell with unread count in navbar

### Admin Panel
- Django admin with custom read-only configurations
- Owner account approval/rejection with notification
- Property review (approve/reject with reason)
- Full ledger, payment, booking visibility

---

## Planned (Not Yet Implemented)
- Real-time chat between owner and tenant
- Real-time notifications (WebSocket)
- Mess reduction / leave-based food deduction policy
- Deployment

---

## Project Structure

```
StayNest/
├── backend/
│   └── staynest_backend/
│       ├── accounts/        # Auth, profiles, owner management
│       ├── properties/      # Property CRUD, location, images
│       ├── bookings/        # Bookings, payments, ledger, food, deposits
│       └── staynest_backend/ # Settings, URLs, Celery config
└── frontend/
    └── staynest_frontend/
        ├── src/
        │   ├── components/  # Reusable UI components
        │   ├── pages/       # Route-level page components
        │   ├── services/    # API service layer (axios)
        │   ├── context/     # AuthContext
        │   └── routes/      # Protected and role-based routes
        └── index.html
```

---

## Local Setup

### Backend

```bash
cd backend/staynest_backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Environment variables — create .env file
SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=your_postgres_url
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:5173
DEFAULT_FROM_EMAIL=your_email

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### Celery (requires RabbitMQ running)

```bash
celery -A staynest_backend worker --loglevel=info
celery -A staynest_backend beat --loglevel=info
```

### Frontend

```bash
cd frontend/staynest_frontend
npm install
npm run dev
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | True for development |
| `DATABASE_URL` | PostgreSQL connection string |
| `RAZORPAY_KEY_ID` | Razorpay API key |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook verification secret |
| `FRONTEND_URL` | Frontend base URL for email links |
| `DEFAULT_FROM_EMAIL` | Sender email address |

---

## Razorpay Webhook Setup

StayNest uses Razorpay webhooks to confirm payments and activate owner accounts automatically.

### Events handled

| Event | Action |
|---|---|
| `payment.captured` | Confirms advance, balance, rent, food, or deposit payment; updates booking status and ledger |
| `account.activated` | Sets `payments_enabled = True` for the owner's payment profile |
| `account.instantly_activated` | Same as above |

### Setup (local development)

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 8000
```

Then in your Razorpay Dashboard → Webhooks → Add webhook:
- URL: `https://your-ngrok-url/api/payments/webhook/`
- Secret: same value as `RAZORPAY_WEBHOOK_SECRET` in your `.env`
- Events to enable: `payment.captured`, `account.activated`, `account.instantly_activated`

### How it works

When a payment is captured, Razorpay sends a signed POST request to the webhook endpoint. The backend verifies the HMAC-SHA256 signature before processing. Payments are only confirmed through this webhook — not from the frontend directly — ensuring no client-side tampering.

---

## Author

**Muhammed Fahiz M**
Email: muhammedfahiz777145@gmail.com

---

## License

This project is for educational and portfolio purposes.