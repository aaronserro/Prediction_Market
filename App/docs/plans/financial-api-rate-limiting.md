## Purpose

Extend the existing Redis-backed authentication limiter to financial write APIs so withdrawals, transfers, fund requests, trades, and privileged funding actions are constrained per authenticated user before state-changing services execute. This repository contains only the Spring Boot web backend confirmed by `pom.xml`; no web frontend or mobile app root is present, so “Webapp” below refers to backend API work and all mobile sections are intentionally empty. The feature remains dormant under the existing `app.rate-limit.enabled=false` setting until Redis is provisioned, and enabled financial operations fail closed if Redis becomes unavailable.

## Files to Create in Webapp

### src/main/java/com/betting/backend/auth/ratelimit/FinancialRateLimiter.java

Central policy-aware facade that hashes authenticated user IDs, consumes the existing atomic Redis token buckets, and rejects financial writes when Redis is unavailable.

```java
package com.betting.backend.auth.ratelimit;

@Component
class FinancialRateLimiter {
    constructor(RateLimitService rateLimits, RateLimitProperties properties, RateLimitKeyFactory keys)

    checkTrade(Long userId):
        check("trade", keys.tradeUser(userId), properties.getTrade().toPolicy())

    checkWithdraw(Long userId):
        check("withdraw", keys.withdrawUser(userId), properties.getWithdraw().toPolicy())

    checkTransfer(Long userId):
        check("transfer", keys.transferUser(userId), properties.getTransfer().toPolicy())

    checkFundRequest(Long userId):
        check("fund-request", keys.fundRequestUser(userId), properties.getFundRequest().toPolicy())

    checkAdminFinancial(Long adminUserId):
        check("admin-financial", keys.adminFinancialUser(adminUserId), properties.getAdminFinancial().toPolicy())

    check(policyName, redisKey, policy):
        if !properties.isEnabled(): return
        try:
            decision = rateLimits.consume(redisKey, policy)
            if !decision.allowed(): throw RateLimitExceededException(policyName, decision.retryAfterSeconds())
        catch DataAccessException ex:
            log error without user ID or Redis key
            throw RateLimitUnavailableException("Financial operation is temporarily unavailable", ex)
}
```

### src/test/java/com/betting/backend/auth/ratelimit/FinancialRateLimiterTest.java

Unit coverage for policy selection, disabled behavior, exhausted buckets, hashed per-user isolation, and fail-closed Redis errors.

```java
package com.betting.backend.auth.ratelimit;

class FinancialRateLimiterTest {
    setUp():
        service = mock(RateLimitService.class)
        properties = new RateLimitProperties()
        keys = new RateLimitKeyFactory(properties)
        limiter = new FinancialRateLimiter(service, properties, keys)

    test each check method consumes its matching key and policy
    test exhausted decision throws RateLimitExceededException with retryAfterSeconds
    test RedisConnectionFailureException becomes RateLimitUnavailableException
    test properties.enabled=false causes no RateLimitService interaction
    test different user IDs create different keys that do not expose raw IDs
}
```

### src/test/java/com/betting/backend/wallet/FinancialWriteRateLimitTest.java

Controller-level Mockito tests proving wallet and user fund-request services are never called after a limit rejection.

```java
package com.betting.backend.wallet;

class FinancialWriteRateLimitTest {
    construct WalletController and FundRequestController with mocked services and FinancialRateLimiter

    blocked withdrawal:
        authenticate matching User
        limiter.checkWithdraw(user.id) throws RateLimitExceededException
        assert walletService.debit(...) was never called

    blocked transfer:
        authenticate matching sender
        limiter.checkTransfer(sender.id) throws
        assert walletService.transfer(...) was never called

    blocked admin deposit:
        authenticate admin
        limiter.checkAdminFinancial(admin.id) throws
        assert walletService.credit(...) was never called

    blocked fund request:
        authenticate matching user ID
        limiter.checkFundRequest(userId) throws
        assert fundRequestService.createFundRequest(...) was never called
}
```

### src/test/java/com/betting/backend/trades/TradeControllerRateLimitTest.java

Controller-level tests proving buy and sell calls use the authenticated user ID and do not reach `TradeService` when blocked.

```java
package com.betting.backend.trades;

class TradeControllerRateLimitTest {
    construct TradeController with mocked TradeService, UserRepository, and FinancialRateLimiter

    for buy and sell:
        repository resolves Principal name to User
        limiter.checkTrade(user.id) throws RateLimitExceededException
        assert tradeService.createBuyTrade/createSellTrade was never called

    allowed request:
        verify limiter.checkTrade(user.id) occurs before matching TradeService call
}
```

### src/test/java/com/betting/backend/wallet/FundRequestAdminRateLimitTest.java

Controller-level tests for rate-limited fund-request approval and rejection by authenticated administrator ID.

```java
package com.betting.backend.wallet;

class FundRequestAdminRateLimitTest {
    construct FundRequestAdminController with mocked FundRequestServiceImpl and FinancialRateLimiter

    blocked approval/rejection:
        limiter.checkAdminFinancial(admin.id) throws RateLimitExceededException
        assert approveRequest/denyRequest was never called

    allowed approval/rejection:
        verify limiter receives admin.id before service mutation
}
```

## Files to Create in Mobile App

None.

## Files to Edit in Webapp

### src/main/java/com/betting/backend/auth/ratelimit/RateLimitProperties.java

Add typed policies for trade, withdrawal, transfer, fund-request, and administrator financial limits while retaining the existing configuration binding style.

```diff
 class RateLimitProperties {
+    private Policy trade = new Policy(30, 30, Duration.ofMinutes(1));
+    private Policy withdraw = new Policy(3, 3, Duration.ofMinutes(1));
+    private Policy transfer = new Policy(10, 10, Duration.ofMinutes(1));
+    private Policy fundRequest = new Policy(3, 3, Duration.ofHours(1));
+    private Policy adminFinancial = new Policy(20, 20, Duration.ofMinutes(1));
+
+    add matching getters and setters used by Spring configuration binding
 }
```

### src/main/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactory.java

Generate namespaced SHA-256 keys for financial policies using authenticated user IDs without exposing identifiers in Redis.

```diff
 class RateLimitKeyFactory {
+    String tradeUser(Long userId) = key("trade:user", requireUserId(userId));
+    String withdrawUser(Long userId) = key("withdraw:user", requireUserId(userId));
+    String transferUser(Long userId) = key("transfer:user", requireUserId(userId));
+    String fundRequestUser(Long userId) = key("fund-request:user", requireUserId(userId));
+    String adminFinancialUser(Long userId) = key("admin-financial:user", requireUserId(userId));
+
+    requireUserId(Long userId):
+        reject null IDs before constructing a bucket key
+        return userId.toString()
 }
```

### src/main/java/com/betting/backend/auth/ratelimit/RateLimitUnavailableException.java

Generalize the exception message so it can represent unavailable signup or financial abuse protection without leaking infrastructure details.

```diff
 class RateLimitUnavailableException extends RuntimeException {
-    RateLimitUnavailableException(Throwable cause)
+    RateLimitUnavailableException(String message, Throwable cause)
+    RateLimitUnavailableException(Throwable cause): delegate with existing signup message
 }
```

### src/main/java/com/betting/backend/config/GlobalExceptionHandler.java

Return a generic service-unavailable response applicable to both signup and financial operations while preserving no-store and retry headers.

```diff
 rateLimitUnavailable(RateLimitUnavailableException ex):
     return HTTP 503
         Retry-After: 30
         Cache-Control: no-store
-        message = "Signup is temporarily unavailable; try again later"
+        message = "This operation is temporarily unavailable; try again later"
         code = "RATE_LIMIT_UNAVAILABLE"
```

### src/main/resources/application.properties

Add environment-overridable financial policies while keeping `app.rate-limit.enabled=false` until Redis is configured.

```diff
 app.rate-limit.enabled=false
+app.rate-limit.trade.capacity=${RATE_LIMIT_TRADE_CAPACITY:30}
+app.rate-limit.trade.refill-tokens=${RATE_LIMIT_TRADE_REFILL_TOKENS:30}
+app.rate-limit.trade.refill-period=${RATE_LIMIT_TRADE_REFILL_PERIOD:1m}
+app.rate-limit.withdraw.capacity=${RATE_LIMIT_WITHDRAW_CAPACITY:3}
+app.rate-limit.withdraw.refill-tokens=${RATE_LIMIT_WITHDRAW_REFILL_TOKENS:3}
+app.rate-limit.withdraw.refill-period=${RATE_LIMIT_WITHDRAW_REFILL_PERIOD:1m}
+app.rate-limit.transfer.capacity=${RATE_LIMIT_TRANSFER_CAPACITY:10}
+app.rate-limit.transfer.refill-tokens=${RATE_LIMIT_TRANSFER_REFILL_TOKENS:10}
+app.rate-limit.transfer.refill-period=${RATE_LIMIT_TRANSFER_REFILL_PERIOD:1m}
+app.rate-limit.fund-request.capacity=${RATE_LIMIT_FUND_REQUEST_CAPACITY:3}
+app.rate-limit.fund-request.refill-tokens=${RATE_LIMIT_FUND_REQUEST_REFILL_TOKENS:3}
+app.rate-limit.fund-request.refill-period=${RATE_LIMIT_FUND_REQUEST_REFILL_PERIOD:1h}
+app.rate-limit.admin-financial.capacity=${RATE_LIMIT_ADMIN_FINANCIAL_CAPACITY:20}
+app.rate-limit.admin-financial.refill-tokens=${RATE_LIMIT_ADMIN_FINANCIAL_REFILL_TOKENS:20}
+app.rate-limit.admin-financial.refill-period=${RATE_LIMIT_ADMIN_FINANCIAL_REFILL_PERIOD:1m}
```

### src/main/java/com/betting/backend/wallet/Controller/WalletController.java

Inject `FinancialRateLimiter` and enforce per-user limits after ownership/admin identity checks but before debit, transfer, or credit service calls.

```diff
 class WalletController {
+    private final FinancialRateLimiter rateLimiter;

     withdraw(..., @AuthenticationPrincipal User currentUser):
         requireOwner(currentUser, userId)
+        rateLimiter.checkWithdraw(currentUser.getId())
         walletService.debit(...)

     transfer(..., @AuthenticationPrincipal User currentUser):
         requireOwner(currentUser, fromUserId)
+        rateLimiter.checkTransfer(currentUser.getId())
         walletService.transfer(...)

-    deposit(...):
+    deposit(..., @AuthenticationPrincipal User admin):
+        rateLimiter.checkAdminFinancial(admin.getId())
         walletService.credit(...)
 }
```

### src/main/java/com/betting/backend/wallet/Controller/FundRequestController.java

Inject the financial limiter and consume the authenticated user’s fund-request bucket after ownership validation and before request creation.

```diff
 class FundRequestController {
+    private final FinancialRateLimiter rateLimiter;

     createFundRequest(..., @AuthenticationPrincipal(expression="id") Long authUserId):
         reject when authUserId does not equal pathUserid
+        rateLimiter.checkFundRequest(authUserId)
         fundRequestService.createFundRequest(...)
 }
```

### src/main/java/com/betting/backend/wallet/Controller/FundRequestAdminController.java

Inject the limiter and rate-limit approvals and rejections by the authenticated administrator’s ID before service mutation.

```diff
 class FundRequestAdminController {
+    private final FinancialRateLimiter rateLimiter;

     approveRequest(..., @AuthenticationPrincipal User admin):
         validate requestId and admin
+        rateLimiter.checkAdminFinancial(admin.getId())
         fundrequestservice.approveRequest(requestId, admin.getId())

     rejectRequest(..., @AuthenticationPrincipal User admin):
         validate requestId and admin
+        rateLimiter.checkAdminFinancial(admin.getId())
         fundrequestservice.denyRequest(requestId, admin.getId())
 }
```

### src/main/java/com/betting/backend/trades/TradeController.java

Inject the limiter, resolve the authenticated `User` using the existing repository pattern, and consume the shared trade bucket before buy or sell service calls.

```diff
 class TradeController {
+    private final FinancialRateLimiter rateLimiter;

     createSellTrade(request, Principal principal):
         user = userRepository.findByUsername(principal.getName()).orElseThrow(...)
+        rateLimiter.checkTrade(user.getId())
         tradeService.createSellTrade(request, user)

     createBuyTrade(request, Principal principal):
         user = userRepository.findByUsername(principal.getName()).orElseThrow(...)
+        rateLimiter.checkTrade(user.getId())
         tradeService.createBuyTrade(request, user)
 }
```

### src/test/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactoryTest.java

Extend the existing key privacy tests to cover every financial user-key method.

```diff
 class RateLimitKeyFactoryTest {
+    test financial keys use expected policy prefixes
+    test financial keys never contain raw user ID
+    test same user and policy produce stable key
+    test different users and policies produce different keys
+    test null user ID is rejected
 }
```

## Files to Edit in Mobile App

None.

## Implementation Sequence

### Financial Rate-Limit Core

Extend the existing Redis rate-limit domain with configurable, privacy-preserving, fail-closed financial policies while leaving the feature flag disabled.

1. Add the five financial `Policy` fields, defaults, getters, and setters to `src/main/java/com/betting/backend/auth/ratelimit/RateLimitProperties.java`.
2. Add hashed per-user financial key builders and null-ID validation to `src/main/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactory.java`.
3. Generalize `src/main/java/com/betting/backend/auth/ratelimit/RateLimitUnavailableException.java` so callers can provide an operation-neutral message.
4. Create `src/main/java/com/betting/backend/auth/ratelimit/FinancialRateLimiter.java` using the existing `RateLimitService.consume()` and `RateLimitExceededException` patterns.
5. Make `FinancialRateLimiter` bypass Redis only when `RateLimitProperties.isEnabled()` is false and fail closed on `DataAccessException` when enabled.
6. Add all environment-overridable policy values to `src/main/resources/application.properties` without changing `app.rate-limit.enabled=false`.
7. Update `src/main/java/com/betting/backend/config/GlobalExceptionHandler.java` to return a generic 503 response for unavailable rate-limit storage.
8. Extend `src/test/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactoryTest.java` with financial key stability, isolation, privacy, and null-input cases.
9. Create `src/test/java/com/betting/backend/auth/ratelimit/FinancialRateLimiterTest.java` covering every policy, disabled mode, exhaustion, and Redis failure.

### Wallet and Fund-Request Enforcement

Protect wallet mutations and user/admin fund-request mutations after authorization checks and before business services execute.

1. Inject `FinancialRateLimiter` through the constructor of `src/main/java/com/betting/backend/wallet/Controller/WalletController.java`.
2. Add `checkWithdraw(currentUser.getId())` after `requireOwner()` and before `walletService.debit()`.
3. Add `checkTransfer(currentUser.getId())` after sender ownership validation and before `walletService.transfer()`.
4. Add `@AuthenticationPrincipal User admin` to the admin-only deposit handler and call `checkAdminFinancial(admin.getId())` before `walletService.credit()`.
5. Inject `FinancialRateLimiter` into `src/main/java/com/betting/backend/wallet/Controller/FundRequestController.java` and call `checkFundRequest(authUserId)` after path ownership validation.
6. Inject `FinancialRateLimiter` into `src/main/java/com/betting/backend/wallet/Controller/FundRequestAdminController.java` and check the admin bucket before approval and rejection service calls.
7. Create `src/test/java/com/betting/backend/wallet/FinancialWriteRateLimitTest.java` to prove rejected wallet and user fund-request requests never invoke mutation services.
8. Create `src/test/java/com/betting/backend/wallet/FundRequestAdminRateLimitTest.java` to prove rejected admin approval/rejection requests never invoke mutation services.

### Trade Enforcement and Verification

Protect buy and sell mutations with one per-user trade bucket and validate the complete dormant implementation before Redis activation.

1. Inject `FinancialRateLimiter` into `src/main/java/com/betting/backend/trades/TradeController.java` while preserving the existing `UserRepository` principal-resolution pattern.
2. Call `checkTrade(user.getId())` before `tradeService.createSellTrade()`.
3. Call `checkTrade(user.getId())` before `tradeService.createBuyTrade()` so buy and sell share one 30-per-minute budget.
4. Create `src/test/java/com/betting/backend/trades/TradeControllerRateLimitTest.java` for blocked and allowed buy/sell ordering.
5. Run the rate-limit unit and controller tests with `app.rate-limit.enabled` both false and explicitly true in test configuration.
6. Run the existing real-Redis concurrency integration test to confirm the shared Lua token bucket remains atomic for the new policies.
7. Run the complete Maven test suite and verify no constructor changes break Spring context creation.
8. Confirm normal financial operations remain unchanged while `app.rate-limit.enabled=false`, then defer `REDIS_URL` and `APP_RATE_LIMIT_ENABLED=true` to the final infrastructure rollout.
