# Twilio Notification System Setup & Roadmap

## 1. Overview
This document outlines the architecture, existing foundations, pending requirements, and implementation roadmap for integrating Twilio SMS & WhatsApp notifications across Vamika Jewels for both customer and administrator workflows.

---

## 2. Why is this in "Future Implementation" State?
While the Twilio adapter and messaging architecture foundations are already designed in the codebase, live deployment is deferred due to the following external prerequisites:

1. **Twilio Sender Phone Number (`TWILIO_FROM_NUMBER`) Required**:
   - Twilio requires a dedicated, SMS-enabled phone number purchased via the Twilio Console (in E.164 format, e.g., `+1xxxxxxxxxx` or a country-specific local sender ID).
   - Without a provisioned sender phone number or messaging service SID, Twilio API requests will fail with HTTP 400 (`From number is required`).

2. **Admin Notification Phone Number (`ADMIN_NOTIFICATION_PHONE`) Needed**:
   - The verified mobile number of the store owner / administrator is needed so system alerts (new orders, new registrations, governance verifications) can be routed correctly.

3. **Twilio Trial Account Verification Constraints**:
   - If using a Twilio Trial account, SMS messages can **only** be dispatched to phone numbers that have been explicitly pre-verified under Twilio Console (*Verified Caller IDs*).
   - Sending OTPs and order updates to arbitrary customer numbers requires upgrading to a production Twilio plan or pre-verifying test recipient numbers.

4. **Carrier Regulatory Compliance (India DLT / US A2P 10DLC)**:
   - For high-volume transactional SMS in India (`+91`), Telecom Regulatory Authority of India (TRAI) mandates DLT (Distributed Ledger Technology) template registration.
   - For US destinations, A2P 10DLC registration is required to prevent carrier filtering.

---

## 3. What Has Already Been Done

1. **Pluggable Hexagonal Architecture**:
   - Implemented `smsService` ([`src/modules/notifications/application/sms.service.ts`](file:///Users/yavnesh/Workplace/jewellery/src/modules/notifications/application/sms.service.ts)) using the Ports & Adapters pattern.
   - Added support for multiple SMS providers (`MOCK`, `TWILIO`, `GUPSHUP`, `MSG91`), enabling hot-swapping via the `SMS_PROVIDER` environment variable.

2. **Base Twilio SMS Adapter**:
   - Created `TwilioSmsAdapter` ([`src/modules/notifications/infrastructure/sms-adapters.ts`](file:///Users/yavnesh/Workplace/jewellery/src/modules/notifications/infrastructure/sms-adapters.ts)).
   - Implemented Basic Auth encoding and REST dispatch against the Twilio Messages API: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`.

3. **Secure OTP Generation & Rate Limiting**:
   - Built `sendOtpAction` and `verifyOtpAction` in [`app/actions/otp.actions.ts`](file:///Users/yavnesh/Workplace/jewellery/app/actions/otp.actions.ts).
   - Enforces SHA-256 HMAC code hashing, a 10-minute validity window, and a rate limit of max 3 requests per 5 minutes per phone number.
   - Includes local development fallback (`devOtp`) so authentication flows can be tested without burning SMS balance.

4. **In-App Notification System**:
   - Created database models and helper functions ([`lib/notification-helpers.ts`](file:///Users/yavnesh/Workplace/jewellery/lib/notification-helpers.ts)) for tracking in-app order updates, status changes, and user notifications.

---

## 4. What Needs to Be Done (Next Steps)

### A. Environment Configuration
Add the following variables to `.env` once Twilio provisioning is complete:
```env
# Notification Provider Selection
SMS_PROVIDER="TWILIO"

# Twilio Credentials
TWILIO_ACCOUNT_SID="AC_YOUR_TWILIO_ACCOUNT_SID_HERE"
TWILIO_AUTH_TOKEN="your_twilio_auth_token_here"
TWILIO_FROM_NUMBER="+1xxxxxxxxxx" # Purchased Twilio Phone Number

# Administrator Alert Destination
ADMIN_NOTIFICATION_PHONE="+91xxxxxxxxxx" # Admin Phone Number
```

### B. Customer Event Notifications
| Event | Trigger Location | Target Message |
| :--- | :--- | :--- |
| **Registration / Login OTP** | [`app/actions/otp.actions.ts`](file:///Users/yavnesh/Workplace/jewellery/app/actions/otp.actions.ts) | *"Your Vamika Jewels verification code is {OTP}. Valid for 10 minutes."* |
| **Account Created (Welcome)** | [`app/api/register/route.ts`](file:///Users/yavnesh/Workplace/jewellery/app/api/register/route.ts) | *"Welcome to Vamika Jewels, {Name}! Your account has been created."* |
| **Order Placed & Payment Confirmed** | Checkout / Order Route | *"Thank you for your order #{OrderId}! We have received your payment of ₹{Amount}. Your fine jewelry is being prepared."* |
| **Order Shipped / Delivered** | [`lib/notification-helpers.ts`](file:///Users/yavnesh/Workplace/jewellery/lib/notification-helpers.ts) | *"Your Vamika Jewels order #{OrderId} has been shipped via {Courier} (AWB: {TrackingNumber})."* |

### C. Admin Real-Time Notifications
| Event | Trigger Location | Target Message |
| :--- | :--- | :--- |
| **New Customer Registration** | Post-registration verification | *"Vamika Admin Alert: New customer registered - {Name} ({Phone}, {Email})."* |
| **New Order Placed** | Order creation callback | *"Vamika Admin Alert: New Order #{OrderId} placed by {CustomerName}! Total: ₹{Amount} ({ItemsCount} items)."* |
| **Product Governance Proposal** | Product Verification Queue | *"Vamika Admin Alert: New product proposal submitted by {MerchantName} requires review in Database Governance."* |

### D. Enhancements to `TwilioSmsAdapter`
- Add dedicated methods: `sendCustomerSms(to, message)` and `sendAdminAlert(message)`.
- Implement phone number normalization (strict E.164 format validator).
- Implement non-blocking background queueing or `Promise.allSettled` to prevent network latency from affecting user checkout response times.
