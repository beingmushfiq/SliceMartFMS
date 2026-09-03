# ERROR HANDLING & MONITORING ARCHITECTURE

> **Status:** Canonical Error Handling Specification  
> **Rule:** Never expose unhandled React errors, stack traces, raw JSON payloads, or empty screens to users. Every async interface must support loading, error, empty, and offline states.  

---

## 1. The 4-Tier Error Boundary Architecture

```
[Tier 1: Global App Error Boundary] (App.tsx / main.tsx)
Catches catastrophic rendering crashes; renders full-page recovery screen.
          │
          ▼
[Tier 2: Route Error Boundary] (RouteErrorBoundary.tsx)
Catches navigation, data loader, or routing exceptions; preserves AppShell.
          │
          ▼
[Tier 3: Module Error Boundary] (Workspace Root)
Isolates crashes within a single module (e.g. Sales); other modules continue working.
          │
          ▼
[Tier 4: Component Error Boundary] (Charts, Data Tables, Widgets)
Isolates crashes in an individual widget; replaces widget with an inline error card.
```

---

## 2. Standard User-Friendly Error Representation

When an API error occurs, technical codes are translated into actionable human-readable messages:

| Backend Error Code | User-Facing Message | Action Recovery Trigger |
|---|---|---|
| `INSUFFICIENT_STOCK` | "There is not enough stock in the warehouse to complete this action." | "View Stock Balance" / "Adjust Quantity" |
| `PERIOD_CLOSED` | "This financial period is closed and cannot be modified." | "Contact Financial Controller" |
| `CREDIT_LIMIT_EXCEEDED` | "Customer balance exceeds approved credit limit." | "Request Manager PIN Override" |
| `VALIDATION_FAILED` | "Please review highlighted fields and correct the errors." | Highlights inputs in red |
| `NETWORK_ERROR` | "Unable to connect to the server. Checking connection..." | "Retry Connection" button |
| `SERVER_ERROR` | "An unexpected server error occurred. Our team has been notified." | "Try Again" / "Copy Error ID" |

---

## 3. Offline & Connectivity Degradation

1. **Network Listener (`navigator.onLine`):**
   - When connection is lost, an animated yellow sticky banner docks to the top of the viewport: *"You are currently offline. Actions requiring server confirmation are temporarily paused."*
2. **Safe Action Queuing (POS & Stock Count):**
   - High-priority operational views (such as POS cashier barcode scanning and Warehouse physical inventory counting) cache pending actions in IndexedDB and synchronize them when connection is restored.
3. **Automatic Retry with Exponential Backoff:**
   - React Query queries automatically retry failed idempotent GET requests up to 3 times with exponential backoff (1s, 2s, 4s).
