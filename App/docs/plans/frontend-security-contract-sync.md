## Purpose

Synchronize the Vite React frontend with the hardened Spring Boot contracts for cookie-based CSRF, administrator MFA, administrator-created roles, non-destructive user deactivation, trade bounds, and mutation idempotency. The web application is rooted at `App-frontend/betting-frontend`; the Expo application is rooted at `App-frontend/Pryzm-mobile-app`, but its real trading and authenticated backend flows are explicitly not configured, so this change leaves mobile untouched rather than duplicating web-only behavior. Backend database-role and retention-trigger controls require no browser API changes.

## Files to Create in Webapp

None.

## Files to Create in Mobile App

None.

## Files to Edit in Webapp

### App-frontend/betting-frontend/src/lib/api.js

Turn the existing cookie-aware API wrapper into the single security-aware request path for CSRF-protected mutations, structured errors, and retry-safe idempotency headers.

```js
const API_URL = existing Vite production/development URL selection
let csrfPromise

export async function csrfHeaders():
  csrfPromise ??= fetch(`${API_URL}/auth/csrf`, { credentials: "include" })
    -> require ok
    -> parse { headerName, token }
    -> return { [headerName]: token }
    -> clear cached promise on failure
  return csrfPromise

export async function request(path, { method = "GET", body, headers = {} } = {}):
  normalizedMethod = method.toUpperCase()
  mutationHeaders = normalizedMethod in POST/PUT/PATCH/DELETE
    ? await csrfHeaders()
    : {}
  response = fetch(API_URL + path, {
    method: normalizedMethod,
    credentials: "include",
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...mutationHeaders,
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  parse JSON-or-text once
  throw Error carrying status/code/message when !response.ok
  return null for 204, otherwise parsed response

export function newIdempotencyKey():
  return crypto.randomUUID()

export const api = {
  signup, login, logout, me,
}
```

### App-frontend/betting-frontend/src/auth/AuthContext.jsx

Pass the optional MFA code through the established auth context without changing ordinary-user login behavior.

```diff
 const value = {
-  login: async (username, password) => api.login({ username, password }),
+  login: async (username, password, mfaCode) =>
+    api.login({ username, password, ...(mfaCode ? { mfaCode } : {}) }),
   signup,
   logout,
 }
```

### App-frontend/betting-frontend/src/auth/Login.jsx

Collect an optional six-digit administrator TOTP and rely on the shared authenticated user refresh/redirect flow.

```diff
-const [form, setForm] = useState({ username: "", password: "" })
+const [form, setForm] = useState({ username: "", password: "", mfaCode: "" })

-await login(form.username.trim(), form.password)
+validate mfaCode is empty or exactly six digits
+await login(form.username.trim(), form.password, form.mfaCode.trim())

+<Field label="Administrator MFA code (if required)" htmlFor="login-mfa">
+  <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} ... />
+</Field>
```

### App-frontend/betting-frontend/src/dashboard/admin/AdminCreateUser.jsx

Align account provisioning and lifecycle copy with the backend DTO, MFA step-up rule, validation limits, and deactivation response fields.

```diff
-import direct API_BASE_URL fetch usage
+import { request } from "../../lib/api.js"

-const ROLES = ["USER", "ADMIN"]
-const EMPTY_FORM = { ..., role: "USER" }
+const ROLES = ["ROLE_USER", "ROLE_ADMIN"]
+const EMPTY_FORM = { ..., role: "ROLE_USER", mfaCode: "" }

-password length >= 6
+username matches /^[A-Za-z0-9_]{3,30}$/
+password length is 10..72
+email is nonblank and <= 254 characters
+ROLE_ADMIN requires /^[0-9]{6}$/ mfaCode

-fetch POST body { ..., role: form.role }
+request("/api/v1/users", {
+  method: "POST",
+  body: {
+    username, email, password,
+    roles: [form.role],
+    ...(form.role === "ROLE_ADMIN" ? { mfaCode: form.mfaCode } : {}),
+  },
+})

+show six-digit TOTP field only for ROLE_ADMIN

-Delete user / permanently delete / cannot be undone
+Deactivate user / revoke access / retain financial history

-fetch DELETE then remove row locally
+await request(`/api/v1/users/${id}`, { method: "DELETE" })
+await fetchUsers()
+render accountEnabled and deactivatedAt in list/detail state
```

### App-frontend/betting-frontend/src/auth/adminHelpers.js

Route administrator fund-request mutations through the centralized CSRF-aware client while preserving current status-specific behavior.

```diff
-import { errorFromResponse } from "../lib/markets.js"
-const API_BASE = ...
-async function http(path, opts) { direct fetch ... }
+import { request } from "../lib/api.js"
+async function http(path, opts) {
+  try { return await request(path, opts) }
+  catch (err) {
+    preserve err.status for 401, 403, and 409 handling
+    throw err
+  }
+}

 export const approveFundRequest = (id) => http(path, { method: "PUT" })
 export const rejectFundRequest = (id) => http(path, { method: "PUT" })
```

### App-frontend/betting-frontend/src/dashboard/Wallet.jsx

Keep the existing per-intent idempotency lifecycle but send fund requests through the CSRF-aware shared request function.

```diff
 import { fetchMarkets, getJSON } from "../lib/markets.js"
+import { request } from "../lib/api.js"

-await getJSON(fundRequestPath, {
+await request(fundRequestPath, {
   method: "POST",
   headers: { "Idempotency-Key": intentRef.current.key },
-  body: JSON.stringify({ amountCents, reason }),
+  body: { amountCents, reason },
 })

 retain key when submission fails so an exact retry reuses it
 clear key only after successful response
```

### App-frontend/betting-frontend/src/pages/MarketDetail.jsx

Enforce the 10,000-share UI boundary and give each exact trade intent a stable idempotency key across retries while using shared CSRF handling.

```diff
+import { newIdempotencyKey, request } from "../lib/api.js"
+const MAX_TRADE_QUANTITY = 10_000

-async function postTrade(side, body) { direct fetch ... }
+async function postTrade(side, body, idempotencyKey) {
+  return request(`/api/v1/trades/${side}`, {
+    method: "POST",
+    headers: { "Idempotency-Key": idempotencyKey },
+    body,
+  })
+}

+const tradeIntentRef = useRef(null)
+derive intent from side, marketId, outcomeId, and quantity
+generate a key when intent changes; reuse it for the same failed intent
+clear key after success or when the modal intent changes
+reject/disable quantity outside 1..MAX_TRADE_QUANTITY
+cap sell quantity to min(held, MAX_TRADE_QUANTITY)
+retain modal and retry context on 429/temporary failures rather than creating a duplicate order
```

### App-frontend/betting-frontend/src/dashboard/admin/MarketCreation.jsx

Use the centralized mutation client so administrator market creation includes the required CSRF header.

```diff
-import { errorFromResponse } from "../../lib/markets.js"
-const API_BASE_URL = ...
+import { request } from "../../lib/api.js"

-const res = await fetch(`${API_BASE_URL}/api/v1/admin/markets`, {
-  method: "POST", headers, credentials: "include", body: JSON.stringify(payload)
-})
-if (!res.ok) throw await errorFromResponse(res)
-const data = await res.json()
+const data = await request("/api/v1/admin/markets", {
+  method: "POST",
+  body: payload,
+})
```

### App-frontend/betting-frontend/src/dashboard/admin/AdminMarketEdit.jsx

Move market update and resolution writes to the shared CSRF-aware request path without changing existing conflict/retry semantics.

```diff
+import { request } from "../../lib/api.js"

-fetch PUT with JSON body
+const updatedMarket = await request(`/api/v1/admin/markets/${marketId}`, {
+  method: "PUT",
+  body: existing update payload,
+})

-fetch POST resolve URL
+await request(
+  `/api/v1/admin/markets/${marketId}/resolve?winningOutcomeId=${selectedWinningOutcome}`,
+  { method: "POST" }
+)

 preserve 409 partially-settled retry message
 preserve successful 204 local state transition
```

## Files to Edit in Mobile App

None.

## Implementation Sequence

### Webapp Security-Aware Transport

Centralize browser mutation security so all later feature changes inherit cookie credentials, CSRF headers, structured errors, and existing idempotency keys.

1. Export `API_URL`, `request()`, `csrfHeaders()`, and `newIdempotencyKey()` from `App-frontend/betting-frontend/src/lib/api.js` while preserving the current environment URL precedence.
2. Implement lazy `GET /auth/csrf` acquisition in `src/lib/api.js`, cache the in-flight/resulting token, and clear the cache after acquisition failure.
3. Make `request()` attach the server-provided CSRF header to every `POST`, `PUT`, `PATCH`, and `DELETE`, including login, signup, and logout.
4. Preserve `credentials: "include"`, parse response bodies once, return `null` for `204`, and attach `status` and backend `code` to thrown errors.
5. Replace the private direct-fetch wrapper in `src/auth/adminHelpers.js` with `request()` while retaining 401/403/409 status handling used by the fund-request screen.
6. Update `src/dashboard/Wallet.jsx` to use `request()` for fund-request creation and preserve its existing intent key until the exact request succeeds.
7. Run the Vite lint and production build scripts to catch import, request-body, and browser API regressions introduced by the shared transport.

### Webapp Authentication and User Administration

Match administrator login, account creation, and user deactivation UI behavior to the hardened backend contracts.

1. Extend `login()` in `App-frontend/betting-frontend/src/auth/AuthContext.jsx` to accept and conditionally include `mfaCode` while keeping signup, refresh, and logout behavior unchanged.
2. Add an optional six-digit one-time-code field to `src/auth/Login.jsx` and pass it through `useAuth().login()` for administrator authentication.
3. Change role option values in `src/dashboard/admin/AdminCreateUser.jsx` to `ROLE_USER` and `ROLE_ADMIN` and send them through the backend’s `roles` array field.
4. Add conditional `mfaCode` state, validation, input, and payload inclusion when `ROLE_ADMIN` is selected in `AdminCreateUser.jsx`.
5. Align the administrator creation form with backend username, password, and email bounds, including the 10-character password minimum.
6. Replace direct account-creation and deactivation fetches in `AdminCreateUser.jsx` with the shared `request()` function.
7. Rename destructive delete language and confirmation copy to deactivation, explain retained history, refetch after success, and display `accountEnabled`/`deactivatedAt` from the response model.
8. Exercise ordinary login, administrator MFA login, ordinary-user creation, administrator creation with TOTP, invalid-role rejection, and deactivation against the production-profile API.

### Webapp Market and Trade Mutations

Apply CSRF and idempotency guarantees to market administration and enforce the backend trade boundary in the trading UI.

1. Replace the market-creation direct `fetch()` in `App-frontend/betting-frontend/src/dashboard/admin/MarketCreation.jsx` with the shared `request()` call and unchanged payload.
2. Replace market update and resolution writes in `src/dashboard/admin/AdminMarketEdit.jsx` with `request()` while preserving its 409 settlement-retry behavior.
3. Import `request()` and `newIdempotencyKey()` into `src/pages/MarketDetail.jsx` and remove the direct mutation fetch from `postTrade()`.
4. Track one idempotency key per exact side/market/outcome/quantity intent in `MarketDetail.jsx`, reuse it for an exact retry, and clear it only after success or a deliberate intent change.
5. Enforce quantities from 1 through 10,000 in the trade modal and cap sell choices by both current holdings and the shared frontend maximum.
6. Keep retryable `429` and temporary-service failures visible without silently issuing a second trade under a new key; continue refreshing prices, positions, and wallet only after success.
7. Verify administrator market create/update/resolve, buy/sell boundaries, duplicate-click suppression, exact retries, and CSRF rejection behavior against the hardened backend.
8. Run the final frontend lint and production build, then verify the deployed `VITE_API_URL` and backend `APP_ALLOWED_ORIGINS` exactly match the production HTTPS origins.
