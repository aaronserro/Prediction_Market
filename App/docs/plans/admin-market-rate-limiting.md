## Purpose

Add Redis-backed per-administrator limits to market creation, updates, and resolution before those endpoints mutate market or settlement state. Market resolution receives a dedicated strict bucket because it can settle positions and affect balances, while create and update share a broader administrator market-write bucket; both fail closed when rate limiting is enabled and Redis is unavailable. This repository root is a Spring Boot web backend confirmed by `pom.xml`, with no mobile application present, and the existing `app.rate-limit.enabled=false` flag keeps the feature dormant until Redis is productionized.

## Files to Create in Webapp

### src/main/java/com/betting/backend/auth/ratelimit/AdminMarketRateLimiter.java

Central fail-closed facade for administrator market-write and market-resolution policies, following the existing `FinancialRateLimiter` pattern.

```java
package com.betting.backend.auth.ratelimit;

@Component
public class AdminMarketRateLimiter {
    constructor(RateLimitService rateLimits, RateLimitProperties properties, RateLimitKeyFactory keys)

    checkMarketWrite(Long adminUserId):
        check(
            "admin-market-write",
            keys.adminMarketWriteUser(adminUserId),
            properties.getAdminMarketWrite().toPolicy()
        )

    checkMarketResolve(Long adminUserId):
        check(
            "admin-market-resolve",
            keys.adminMarketResolveUser(adminUserId),
            properties.getAdminMarketResolve().toPolicy()
        )

    check(policyName, redisKey, policy):
        if !properties.isEnabled(): return
        try:
            decision = rateLimits.consume(redisKey, policy)
            if !decision.allowed():
                throw RateLimitExceededException(policyName, decision.retryAfterSeconds())
        catch DataAccessException ex:
            log error without administrator ID or Redis key
            throw RateLimitUnavailableException(
                "Administrator market operation is temporarily unavailable",
                ex
            )
}
```

### src/test/java/com/betting/backend/auth/ratelimit/AdminMarketRateLimiterTest.java

Unit coverage for policy mapping, shared create/update budgets, dedicated resolution budgets, disabled behavior, exhaustion, and Redis failure.

```java
package com.betting.backend.auth.ratelimit;

class AdminMarketRateLimiterTest {
    setUp():
        service = mock(RateLimitService.class)
        properties = new RateLimitProperties()
        keys = new RateLimitKeyFactory(properties)
        limiter = new AdminMarketRateLimiter(service, properties, keys)

    test checkMarketWrite consumes adminMarketWriteUser key with adminMarketWrite policy
    test checkMarketResolve consumes adminMarketResolveUser key with adminMarketResolve policy
    test exhausted decision preserves policy name and retryAfterSeconds
    test properties.enabled=false causes no RateLimitService interaction
    test RedisConnectionFailureException becomes RateLimitUnavailableException
    test different administrator IDs consume isolated hashed keys
}
```

### src/test/java/com/betting/backend/markets/MarketControllerRateLimitTest.java

Controller-level Mockito coverage proving blocked administrator mutations never reach `MarketService` and allowed calls enforce the limiter first.

```java
package com.betting.backend.markets;

class MarketControllerRateLimitTest {
    setUp():
        marketService = mock(MarketService.class)
        pricingService = mock(PricingService.class)
        rateLimiter = mock(AdminMarketRateLimiter.class)
        controller = new MarketController(marketService, pricingService, rateLimiter)
        admin = User with id 99

    blocked create/update:
        rateLimiter.checkMarketWrite(admin.id) throws RateLimitExceededException
        assert matching MarketService mutation is never called

    blocked resolve:
        rateLimiter.checkMarketResolve(admin.id) throws RateLimitExceededException
        assert marketService.resolveMarket(...) is never called

    allowed create/update/resolve:
        use Mockito InOrder to verify the matching limiter call precedes MarketService
}
```

## Files to Create in Mobile App

None.

## Files to Edit in Webapp

### src/main/java/com/betting/backend/auth/ratelimit/RateLimitProperties.java

Add typed defaults for shared administrator market writes and stricter market resolutions using the established nested `Policy` configuration style.

```diff
 class RateLimitProperties {
+    private Policy adminMarketWrite = new Policy(10, 10, Duration.ofMinutes(1));
+    private Policy adminMarketResolve = new Policy(3, 3, Duration.ofMinutes(1));
+
+    public Policy getAdminMarketWrite()
+    public void setAdminMarketWrite(Policy adminMarketWrite)
+    public Policy getAdminMarketResolve()
+    public void setAdminMarketResolve(Policy adminMarketResolve)
 }
```

### src/main/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactory.java

Add privacy-preserving per-administrator keys with separate namespaces for ordinary market writes and settlement-triggering resolution.

```diff
 class RateLimitKeyFactory {
+    public String adminMarketWriteUser(Long userId) {
+        return key("admin-market-write:user", requireUserId(userId));
+    }
+
+    public String adminMarketResolveUser(Long userId) {
+        return key("admin-market-resolve:user", requireUserId(userId));
+    }
 }
```

### src/main/resources/application.properties

Expose both administrator market policies through environment overrides while retaining the disabled global feature flag.

```diff
 app.rate-limit.enabled=false
+app.rate-limit.admin-market-write.capacity=${RATE_LIMIT_ADMIN_MARKET_WRITE_CAPACITY:10}
+app.rate-limit.admin-market-write.refill-tokens=${RATE_LIMIT_ADMIN_MARKET_WRITE_REFILL_TOKENS:10}
+app.rate-limit.admin-market-write.refill-period=${RATE_LIMIT_ADMIN_MARKET_WRITE_REFILL_PERIOD:1m}
+app.rate-limit.admin-market-resolve.capacity=${RATE_LIMIT_ADMIN_MARKET_RESOLVE_CAPACITY:3}
+app.rate-limit.admin-market-resolve.refill-tokens=${RATE_LIMIT_ADMIN_MARKET_RESOLVE_REFILL_TOKENS:3}
+app.rate-limit.admin-market-resolve.refill-period=${RATE_LIMIT_ADMIN_MARKET_RESOLVE_REFILL_PERIOD:1m}
```

### src/main/java/com/betting/backend/markets/MarketController.java

Inject the administrator market limiter, obtain the authenticated `User`, and enforce limits immediately before each administrator-only service mutation without changing public reads.

```diff
 class MarketController {
+    private final AdminMarketRateLimiter rateLimiter;

-    MarketController(MarketService marketService, PricingService pricingService)
+    MarketController(
+        MarketService marketService,
+        PricingService pricingService,
+        AdminMarketRateLimiter rateLimiter
+    )

-    createMarket(request):
+    createMarket(request, @AuthenticationPrincipal User admin):
+        rateLimiter.checkMarketWrite(admin.getId())
         marketService.createMarket(request)

-    updateMarket(marketId, request):
+    updateMarket(marketId, request, @AuthenticationPrincipal User admin):
+        rateLimiter.checkMarketWrite(admin.getId())
         marketService.updateMarket(marketId, request)

-    resolveMarket(marketId, winningOutcomeId):
+    resolveMarket(marketId, winningOutcomeId, @AuthenticationPrincipal User admin):
+        rateLimiter.checkMarketResolve(admin.getId())
         marketService.resolveMarket(marketId, winningOutcomeId)
 }
```

### src/test/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactoryTest.java

Extend existing key tests to verify administrator market keys are stable, isolated, correctly namespaced, and free of raw IDs.

```diff
 class RateLimitKeyFactoryTest {
+    test administrator market keys use expected write and resolve prefixes
+    test administrator market keys do not contain raw user ID
+    test same administrator and policy produce stable key
+    test write and resolve policies produce different keys for the same administrator
+    test different administrators produce different keys
+    test null administrator ID is rejected
 }
```

## Files to Edit in Mobile App

None.

## Implementation Sequence

### Administrator Market Rate-Limit Core

Add configurable, hashed, fail-closed administrator market policies while preserving the disabled rollout state.

1. Add `adminMarketWrite` and `adminMarketResolve` defaults, getters, and setters to `src/main/java/com/betting/backend/auth/ratelimit/RateLimitProperties.java`.
2. Add `adminMarketWriteUser()` and `adminMarketResolveUser()` to `src/main/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactory.java` using the existing `requireUserId()` and SHA-256 key construction.
3. Add environment-overridable write and resolution values to `src/main/resources/application.properties` without changing `app.rate-limit.enabled=false`.
4. Create `src/main/java/com/betting/backend/auth/ratelimit/AdminMarketRateLimiter.java` with disabled short-circuiting and the existing atomic `RateLimitService.consume()` flow.
5. Make `AdminMarketRateLimiter` throw `RateLimitExceededException` for exhaustion and convert `DataAccessException` into `RateLimitUnavailableException` without logging identifiers or keys.
6. Extend `src/test/java/com/betting/backend/auth/ratelimit/RateLimitKeyFactoryTest.java` with prefix, stability, policy isolation, user isolation, privacy, and null-ID assertions.
7. Create `src/test/java/com/betting/backend/auth/ratelimit/AdminMarketRateLimiterTest.java` covering both mappings, disabled mode, exhaustion, per-admin isolation, and fail-closed Redis errors.

### Administrator Market Controller Enforcement

Protect every administrator market mutation after role authorization and before market or settlement services execute.

1. Inject `AdminMarketRateLimiter` through the constructor of `src/main/java/com/betting/backend/markets/MarketController.java` while leaving all public GET handlers unchanged.
2. Add `@AuthenticationPrincipal User admin` to market creation and call `checkMarketWrite(admin.getId())` before `marketService.createMarket()`.
3. Add the authenticated administrator to market updates and call the same shared write bucket before `marketService.updateMarket()`.
4. Add the authenticated administrator to market resolution and call `checkMarketResolve(admin.getId())` before the settlement-triggering `marketService.resolveMarket()` call.
5. Create `src/test/java/com/betting/backend/markets/MarketControllerRateLimitTest.java` for blocked create, update, and resolution paths, asserting that no mutation service runs after rejection.
6. Add allowed-path ordering assertions to `MarketControllerRateLimitTest` proving each limiter check occurs before its corresponding `MarketService` mutation.
7. Run focused limiter, key-factory, and controller tests, then run the default Maven suite while keeping Docker/PostgreSQL-dependent `*IT` tests separate from normal verification.
