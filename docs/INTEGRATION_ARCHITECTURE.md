# INTEGRATION ARCHITECTURE — MODULAR ADAPTERS & GATEWAYS

> **Status:** Canonical Third-Party Integration Specification  
> **Rule:** Never hardcode third-party API logic into domain controllers. All integrations must implement pluggable Adapter Contracts.  

---

## 1. Pluggable Integration Contract Pattern

Every external service implements a standard PHP interface allowing hot-swapping between providers without altering core business workflows:

```
                  ┌─────────────────────────────────────┐
                  │       CourierAdapterInterface       │
                  └──────────────────┬──────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│ SteadfastAdapter │        │  PathaoAdapter   │        │   RedxAdapter    │
└──────────────────┘        └──────────────────┘        └──────────────────┘
```

### Methods on `CourierAdapterInterface`:
1. `createConsignment(DeliveryOrder $order): CourierConsignmentResult`
2. `cancelConsignment(string $consignmentId): bool`
3. `trackShipment(string $trackingCode): CourierTrackingStatus`
4. `parseWebhookPayload(array $payload): CourierWebhookEvent`

---

## 2. Integrated Ecosystem Services

| Service Type | Integrated Providers | Fallback Strategy |
|---|---|---|
| **3PL Courier** | Steadfast, Pathao, REDX | Self-Delivery / Manual Fleet |
| **SMS Gateway** | Greenweb BD, Twilio, BulkSMS BD, Infobip | Log to Database & In-App Notification |
| **Payment Gateway** | bKash, Nagad, SSLCommerz, Stripe | Cash on Delivery (COD) / Bank Transfer |
| **Social Commerce** | WhatsApp Business API / Click-to-Chat | Manual Sales Order Entry |

---

## 3. Secure Credential Vault

- Third-party API keys, secrets, client tokens, and webhook secrets are stored in `tenant_settings` with AES-256 encryption.
- **Never expose raw secrets to the frontend.** Frontend settings masks secrets as `sk_live_••••••••39a1`.
- Connection test button (`POST /api/v1/settings/{group}/test-connection`) pings the third-party endpoint with stored credentials and reports latency and authentication status.
