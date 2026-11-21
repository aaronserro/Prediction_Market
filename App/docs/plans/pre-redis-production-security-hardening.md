## Purpose

Harden the Spring Boot API before Redis activation by closing the cookie/CSRF gap, narrowing cross-origin and authorization rules, making signup and financial retries safe, strengthening JWT lifecycle controls, adding auditability, and separating production configuration from development defaults. The workspace contains only the Maven backend confirmed by `pom.xml`; no package.json, Expo configuration, web frontend, or mobile root exists, so this plan defines the API contract but marks mobile work as absent and requires the separately maintained browser client to adopt the CSRF handshake and stop consuming JWT response bodies. Flyway and a TOTP library are not currently in the codebase and would need dependencies; administrator MFA is sequenced after the foundational controls so it can be omitted from the first deployment only if administrator access remains disabled.

## Files to Create in Webapp

### src/main/java/com/betting/backend/config/SecurityProperties.java

Typed production-safe settings for cookie attributes, CORS origins, JWT issuer/audience/lifetime, and security-header policy.

```java
package com.betting.backend.config;

@ConfigurationProperties("app.security")
@Component
class SecurityProperties {
    List<String> allowedOrigins
    String cookieName = "betauth"
    boolean cookieSecure
    String cookieSameSite = "Lax"
    Duration jwtLifetime = 15 minutes
    String jwtIssuer
    String jwtAudience
}
```

### src/main/java/com/betting/backend/auth/SignupService.java

Transactional account, wallet, and signup-bonus creation with normalized identity values and one all-or-nothing commit.

```java
package com.betting.backend.auth;

@Service
class SignupService {
    @Transactional
    User signup(SignupRequest request):
        username = normalize username
        email = normalize email
        reject duplicate normalized username/email
        save ROLE_USER account with encoded password
        walletService.getbalance(user.id)
        walletService.credit(10000, user.id, "SIGNUP_BONUS:" + user.id, "SIGNUP_BONUS")
        return user
}
```

### src/main/java/com/betting/backend/security/IdempotencyKeyFactory.java

Validate client keys and derive bounded SHA-256 keys scoped by actor and mutation type without exposing raw keys in storage or logs.

```java
package com.betting.backend.security;

@Component
class IdempotencyKeyFactory {
    String requireAndScope(String operation, Long actorId, String clientKey):
        reject null/blank or values longer than 128 characters
        return "idem:v1:" + operation + ":" + sha256(actorId + ":" + clientKey.trim())
}
```

### src/main/java/com/betting/backend/audit/AuditEvent.java

Append-only persistence model for security-sensitive actions and outcomes without request bodies, secrets, or raw idempotency keys.

```java
package com.betting.backend.audit;

@Entity
@Table(name = "audit_events")
class AuditEvent {
    UUID id
    Instant occurredAt
    Long actorUserId
    String action
    String targetType
    String targetId
    String outcome
    String correlationId
}
```

### src/main/java/com/betting/backend/audit/AuditEventRepository.java

Minimal append-only repository interface exposing inserts and reads but no application delete/update workflow.

```java
package com.betting.backend.audit;

interface AuditEventRepository extends Repository<AuditEvent, UUID> {
    AuditEvent save(AuditEvent event)
    Page<AuditEvent> findAll(Pageable pageable)
}
```

### src/main/java/com/betting/backend/audit/AuditService.java

Record successful and rejected privileged or financial operations with sanitized identifiers and request correlation IDs.

```java
package com.betting.backend.audit;

@Service
class AuditService {
    void success(actorId, action, targetType, targetId, correlationId)
    void rejected(actorId, action, targetType, targetId, correlationId)
}
```

### src/main/java/com/betting/backend/auth/mfa/AdminMfaCredential.java

Encrypted-at-rest TOTP enrollment state for administrators; dependency `dev.samstevens.totp:totp` is not currently in the codebase and must be added.

```java
package com.betting.backend.auth.mfa;

@Entity
class AdminMfaCredential {
    Long userId
    String encryptedSecret
    boolean enabled
    Instant verifiedAt
}
```

### src/main/java/com/betting/backend/auth/mfa/AdminMfaService.java

Enroll, verify, and require TOTP for administrator authentication without logging secrets or codes.

```java
package com.betting.backend.auth.mfa;

@Service
class AdminMfaService {
    Enrollment beginEnrollment(User admin)
    void confirmEnrollment(User admin, String code)
    boolean verify(User admin, String code)
    void requireEnabled(User admin)
}
```

### src/main/resources/application-prod.properties

Production-only fail-fast datasource, cookie, JWT, migration, error, proxy, and timeout settings sourced exclusively from environment variables.

```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
app.security.cookie-secure=true
app.security.cookie-same-site=Lax
app.security.allowed-origins=${APP_ALLOWED_ORIGINS}
app.security.jwt-issuer=${JWT_ISSUER}
app.security.jwt-audience=${JWT_AUDIENCE}
server.error.include-message=never
server.error.include-stacktrace=never
```

### src/main/resources/db/migration/V1__security_hardening.sql

Flyway migration that blocks deployment on normalized identity duplicates, adds unique indexes, token-version and trade-idempotency columns, and append-only audit storage.

```sql
assert no duplicate lower(trim(username)) or lower(trim(email)) values;
create unique index users_username_normalized_uq on users (lower(trim(username)));
create unique index users_email_normalized_uq on users (lower(trim(email))) where email is not null;
alter table users add column token_version bigint not null default 0;
alter table trades add column idempotency_key varchar(128);
create unique index trades_idempotency_key_uq on trades(idempotency_key) where idempotency_key is not null;
create table audit_events (...);
create trigger preventing update/delete on audit_events;
```

### src/test/java/com/betting/backend/config/SecurityConfigTest.java

MockMvc coverage for CSRF, explicit public routes, protected unknown auth routes, CORS, headers, and administrator authorization.

```java
class SecurityConfigTest {
    test state-changing cookie request without CSRF token returns 403
    test valid CSRF token permits authenticated request
    test only signup/login/logout/me/csrf auth routes are public
    test unapproved origin receives no credentialed CORS headers
    test CSP, HSTS, nosniff, and referrer headers are present
}
```

### src/test/java/com/betting/backend/auth/SignupServiceTest.java

Transactional signup tests for normalization, duplicate identities, bonus idempotency, and rollback after wallet failure.

```java
class SignupServiceTest {
    test normalized identity is saved with ROLE_USER
    test duplicate normalized username or email is rejected
    test wallet and bonus are created once
    test bonus failure rolls back user and wallet
}
```

### src/test/java/com/betting/backend/security/MutationIdempotencyTest.java

Controller/service tests proving missing keys fail, identical retries replay once, conflicting reuse fails, and concurrent retries create one mutation.

```java
class MutationIdempotencyTest {
    test wallet, transfer, fund-request, buy, and sell reject missing Idempotency-Key
    test same actor/operation/key replays original result
    test same key with different intent is rejected
    test concurrent duplicate trade creates one wallet mutation and one trade
}
```

### src/test/java/com/betting/backend/auth/JwtSecurityTest.java

JWT claim, expiry, token-version, disabled-user, and cookie-only response tests.

```java
class JwtSecurityTest {
    test issuer audience user-id token-version and expiry are validated
    test role or token-version change invalidates old token
    test disabled/deleted user cannot authenticate
    test login and signup response bodies never contain JWT
}
```

### src/test/java/com/betting/backend/audit/AuditServiceTest.java

Audit tests for required events, redaction, immutable records, and correlation IDs.

```java
class AuditServiceTest {
    test financial and administrator mutations append events
    test event excludes JWT email password request body and raw idempotency key
    test audit update and delete are rejected
}
```

## Files to Create in Mobile App

None.

## Files to Edit in Webapp

### pom.xml

Add Flyway PostgreSQL migrations and the TOTP implementation; both dependencies are not currently in the codebase.

```diff
 dependencies:
+    org.flywaydb:flyway-core
+    org.flywaydb:flyway-database-postgresql
+    dev.samstevens.totp:totp
```

### src/main/java/com/betting/backend/config/SecurityConfig.java

Enable cookie-compatible CSRF, remove broad auth wildcards, consume the single CORS bean, and add production response headers.

```diff
 filterChain(...):
-    csrf.disable()
-    duplicate inline corsConfig()
-    permitAll("/auth/**", "/api/v1/auth/**")
+    csrfTokenRepository = CookieCsrfTokenRepository.withHttpOnlyFalse()
+    require CSRF for POST/PUT/DELETE while exposing GET /auth/csrf
+    permit only POST signup/login/logout and GET me/csrf
+    use injected CorsConfigurationSource
+    add CSP, HSTS, nosniff, frame-deny, and strict referrer policy
     anyRequest().authenticated()
```

### src/main/java/com/betting/backend/config/CorsConfig.java

Become the only CORS source and bind exact origins from `SecurityProperties`, including CSRF and idempotency headers.

```diff
 corsConfigurationSource(properties):
-    hard-coded mixed origin list
+    allowedOrigins = properties.allowedOrigins
+    allowedHeaders += "X-XSRF-TOKEN", "Idempotency-Key", "X-Request-ID"
+    exposedHeaders += "X-XSRF-TOKEN", "Idempotency-Key", "X-Request-ID"
     allowCredentials = true
```

### src/main/java/com/betting/backend/news/NewsController.java

Remove controller-level wildcard CORS so the central allowlist applies.

```diff
-@CrossOrigin(origins = "*")
 class NewsController
```

### src/main/java/com/betting/backend/auth/AuthController.java

Delegate signup, expose the CSRF token handshake, use hardened cookie settings, require MFA on administrator login, and stop returning JWTs in JSON.

```diff
 signup(request):
     rateLimiter.checkSignup(clientIp)
-    create user/wallet/bonus inline
+    user = signupService.signup(request)
     set HttpOnly auth cookie
-    body includes token
+    body includes username only

 login(request, optional mfaCode):
     authenticate password
+    if administrator: verify TOTP code
     set HttpOnly auth cookie
-    body includes token
+    body includes username only

+GET /auth/csrf returns CsrfToken value for the separate browser origin
 cookie:
-    environment lookup and Domain=.pryzm.ca, SameSite=None
+    SecurityProperties; host-only, Secure, HttpOnly, SameSite=Lax in production
```

### src/main/java/com/betting/backend/auth/dto/AuthResponse.java

Remove the bearer token field from browser authentication responses.

```diff
-public record AuthResponse(String username, String token)
+public record AuthResponse(String username)
```

### src/main/java/com/betting/backend/auth/dto/LoginRequest.java

Accept a bounded optional administrator TOTP code while preserving username/password validation.

```diff
 record LoginRequest(
     username,
     password,
+    @Pattern(regexp="^[0-9]{6}$") String mfaCode
 )
```

### src/main/java/com/betting/backend/auth/JwtUtil.java

Issue short-lived tokens bound to immutable user ID, issuer, audience, unique ID, and account token version.

```diff
-generate(username)
+generate(User user): subject=user.id, username claim, tokenVersion claim, issuer, audience, jti
-validateAndGetSubject(token)
+parseAndValidate(token, expected issuer/audience): return validated claims
```

### src/main/java/com/betting/backend/user/User.java

Enforce non-null normalized identity fields and persist account-enabled and token-version state used for immediate invalidation.

```diff
 @Column(unique=true, nullable=false) username
-String email
+@Column(nullable=false) String email
+boolean accountEnabled = true
+long tokenVersion = 0
-isEnabled(): true
+isEnabled(): accountEnabled
```

### src/main/java/com/betting/backend/user/UserRepository.java

Add normalized identity lookups and ID-based loading for JWT validation.

```diff
+Optional<User> findByIdAndAccountEnabledTrue(Long id)
+boolean existsByUsernameIgnoreCase(String username)
+boolean existsByEmailIgnoreCase(String email)
```

### src/main/java/com/betting/backend/config/SecurityConfig.java

Update the nested JWT filter to load by user ID and reject issuer, audience, version, disabled-user, and deleted-user mismatches.

```diff
 JwtCookieFilter:
-    username = jwt.validateAndGetSubject(token)
-    user = uds.loadUserByUsername(username)
+    claims = jwt.parseAndValidate(token)
+    user = users.findByIdAndAccountEnabledTrue(claims.subject)
+    require claims.tokenVersion == user.tokenVersion
     authenticate with current database authorities
```

### src/main/java/com/betting/backend/wallet/Controller/WalletController.java

Require client idempotency keys and scope them before every withdrawal, transfer, and administrator deposit.

```diff
-@RequestHeader(required=false) idemKey
-random UUID when missing
+@RequestHeader("Idempotency-Key") clientKey
+key = idempotencyKeys.requireAndScope(operation, currentActor.id, clientKey)
 walletService mutation(..., key, ...)
+echo original clientKey, never scoped storage key
```

### src/main/java/com/betting/backend/wallet/Controller/FundRequestController.java

Require and scope the fund-request idempotency key rather than generating one server-side.

```diff
-random UUID when header missing
+scopedKey = idempotencyKeys.requireAndScope("fund-request", authUserId, clientKey)
 fundRequestService.createFundRequest(pathUserId, body, scopedKey)
```

### src/main/java/com/betting/backend/trades/TradeController.java

Require idempotency keys for buy/sell, pass scoped keys into the service, and remove request-detail console output.

```diff
 createBuyTrade/createSellTrade(..., @RequestHeader("Idempotency-Key") clientKey):
-    System.out.println(...)
     user = existing principal resolution
     rateLimiter.checkTrade(user.id)
-    tradeService.createBuyTrade(request, user)
+    key = idempotencyKeys.requireAndScope("trade-buy|trade-sell", user.id, clientKey)
+    tradeService.createBuyTrade/createSellTrade(request, user, key)
```

### src/main/java/com/betting/backend/trades/TradeService.java

Carry the validated idempotency key into both trade command methods.

```diff
-createBuyTrade(request, user)
-createSellTrade(request, user)
+createBuyTrade(request, user, idempotencyKey)
+createSellTrade(request, user, idempotencyKey)
```

### src/main/java/com/betting/backend/trades/Trade.java

Persist a unique nullable idempotency key so existing rows remain migratable and new commands can replay safely.

```diff
+@Column(name="idempotency_key", length=128, updatable=false)
+String idempotencyKey
```

### src/main/java/com/betting/backend/trades/TradeRepo.java

Add idempotency lookup for replay and intent comparison.

```diff
+Optional<Trade> findByIdempotencyKey(String idempotencyKey)
```

### src/main/java/com/betting/backend/trades/TradeServiceImpl.java

Replace random wallet keys with the supplied command key, replay matching trades, reject conflicting reuse, and remove sensitive debug output.

```diff
 createBuyTrade/createSellTrade(request, user, key):
+    existing = tradeRepo.findByIdempotencyKey(key)
+    if existing: require same user, side, market, outcome, quantity; return existing response
-    UUID random wallet idempotency key
+    wallet key = key + ":wallet"
     persist trade.idempotencyKey = key
-    System.out.println transaction details
```

### src/main/java/com/betting/backend/positions/PositionServiceImpl.java

Replace console output and stack traces with structured, redacted logging.

```diff
-System.out.println(...)
-e.printStackTrace()
+log.info("Position migration completed count={}", updated)
+log.error("Position migration failed", exception)
```

### src/main/java/com/betting/backend/user/UserController.java

Audit user creation/deletion and increment token version or disable accounts before destructive/role-sensitive changes.

```diff
 create/delete user:
     validate administrator from AuthenticationPrincipal
     perform mutation
+    auditService.success(admin.id, action, "USER", targetId, requestId)
```

### src/main/java/com/betting/backend/markets/MarketController.java

Audit successful market creation, update, and resolution after existing administrator rate-limit checks.

```diff
 rateLimiter.check...
 marketService mutation
+auditService.success(admin.id, action, "MARKET", marketId, requestId)
```

### src/main/java/com/betting/backend/wallet/Controller/FundRequestAdminController.java

Audit administrator approval and rejection without recording reasons, amounts, or credentials.

```diff
 rateLimiter.checkAdminFinancial(admin.id)
 fundrequestservice approve/deny
+auditService.success(admin.id, action, "FUND_REQUEST", requestId, correlationId)
```

### src/main/resources/application.properties

Keep local defaults explicitly development-only, bind security defaults, remove built-in Spring credentials, and leave Redis disabled.

```diff
-spring.security.user.name=test
-spring.security.user.password=testpass
+app.security.allowed-origins=http://localhost:5173
+app.security.cookie-secure=false
+app.security.cookie-same-site=Lax
+app.security.jwt-lifetime=15m
 app.rate-limit.enabled=false
```

### Dockerfile

Use a pinned JRE runtime, non-root account, read-only-friendly filesystem, and container health check.

```diff
-FROM eclipse-temurin:17-jdk
+FROM eclipse-temurin:17-jre
+RUN create non-root app user
+USER app
+HEALTHCHECK request /actuator/health/readiness
 ENTRYPOINT java with bounded memory and secure temporary directory
```

## Files to Edit in Mobile App

None.

## Implementation Sequence

### Browser Authentication Boundary

Close cross-site request forgery and cross-origin policy gaps before changing account or financial internals.

1. Create `src/main/java/com/betting/backend/config/SecurityProperties.java` and bind exact development defaults in `src/main/resources/application.properties`.
2. Consolidate `src/main/java/com/betting/backend/config/CorsConfig.java` as the only CORS bean and remove the duplicate inline configuration from `SecurityConfig.java`.
3. Remove wildcard `@CrossOrigin` from `src/main/java/com/betting/backend/news/NewsController.java`.
4. Replace broad `/auth/**` permit rules in `SecurityConfig.java` with explicit signup, login, logout, me, and CSRF routes.
5. Enable `CookieCsrfTokenRepository` in `SecurityConfig.java` and add the `GET /auth/csrf` handshake to `AuthController.java`.
6. Change authentication cookies in `AuthController.java` to configured host-only, `HttpOnly`, production-`Secure`, `SameSite=Lax` cookies.
7. Remove JWT values from `AuthResponse.java` and update login/signup responses in `AuthController.java`.
8. Add CSP, HSTS, frame denial, nosniff, and referrer policy in `SecurityConfig.java`.
9. Create `SecurityConfigTest.java` for CSRF, CORS, explicit authorization, and response-header behavior.

### Identity, Signup, and JWT Lifecycle

Make account creation atomic and bind short-lived sessions to current database account state.

1. Add normalized identity, enabled-state, and token-version fields to `User.java` and matching queries to `UserRepository.java`.
2. Create `SignupService.java` to normalize identity and transactionally create the user, wallet, and one signup bonus.
3. Replace inline signup persistence in `AuthController.java` with `SignupService.signup()`.
4. Update `JwtUtil.java` to issue 15-minute tokens containing immutable user ID, issuer, audience, JTI, username, and token version.
5. Update the JWT filter in `SecurityConfig.java` to load enabled users by ID and compare token version before authentication.
6. Increment token version on password, role, disable, or other security-state changes in `UserController.java` and future account-management paths.
7. Create `SignupServiceTest.java` for normalization, duplicate detection, one-time bonus behavior, and transaction rollback.
8. Create `JwtSecurityTest.java` for claims, expiry, token-version invalidation, disabled/deleted users, and cookie-only responses.

### Financial Idempotency

Require retry-safe client intent for every money-moving command and trade.

1. Create `IdempotencyKeyFactory.java` to validate, bound, hash, and scope client keys by actor and operation.
2. Update `WalletController.java` to require keys for withdrawal, transfer, and deposit rather than generating random UUIDs.
3. Update `FundRequestController.java` to require and scope the creation key before invoking `FundRequestServiceImpl`.
4. Update `TradeController.java` to require and scope buy/sell keys and pass them to `TradeService`.
5. Update `TradeService.java`, `Trade.java`, and `TradeRepo.java` to carry, persist, and look up trade idempotency keys.
6. Update `TradeServiceImpl.java` to replay matching commands, reject key reuse with changed intent, and derive the wallet leg key from the trade key.
7. Preserve existing transaction boundaries so duplicate/concurrent commands cannot create a wallet mutation without exactly one matching trade.
8. Create `MutationIdempotencyTest.java` for missing keys, exact retries, conflicting reuse, and concurrent duplicates.

### Audit, Logging, and Administrator MFA

Add accountability and step-up protection without leaking sensitive data.

1. Add the not-currently-present TOTP dependency to `pom.xml` and create `AdminMfaCredential.java` plus `AdminMfaService.java`.
2. Extend `LoginRequest.java` and `AuthController.java` so administrator login requires an enabled, valid TOTP credential.
3. Keep administrator access disabled until enrollment is completed through a separately maintained frontend flow not present in this workspace.
4. Create `AuditEvent.java`, `AuditEventRepository.java`, and `AuditService.java` with sanitized append-only events.
5. Record successful user, wallet, fund-request, trade, and market administrative actions in their existing controllers/services.
6. Remove sensitive `System.out` calls from `TradeController.java` and `TradeServiceImpl.java`.
7. Replace `PositionServiceImpl.java` console output and `printStackTrace()` with structured SLF4J logging.
8. Create `AuditServiceTest.java` for event coverage, redaction, correlation IDs, and database immutability.

### Database and Production Runtime

Move schema ownership and production secrets out of ad hoc Hibernate/development configuration.

1. Add the not-currently-present Flyway core and PostgreSQL dependencies to `pom.xml`.
2. Create `V1__security_hardening.sql` with duplicate preflight checks, normalized unique indexes, token/trade columns, and append-only audit storage.
3. Validate the migration against a sanitized Render database snapshot before touching production; resolve duplicate normalized identities rather than silently deleting data.
4. Create `application-prod.properties` with required environment variables, `ddl-auto=validate`, hidden error details, trusted proxy behavior, and bounded timeouts.
5. Remove built-in Spring credentials from `application.properties` and keep local values development-only.
6. Update `Dockerfile` to a pinned JRE image, non-root runtime, bounded JVM settings, and readiness health check; add Actuator only if the health endpoint is required because it is not currently in the codebase.
7. Generate an SBOM and run Maven/container vulnerability scans in CI before deployment; CI configuration is not present in this workspace and must be added in the hosting repository.
8. Rehearse backup, migration, rollback, JWT-key rotation, and incident-revocation procedures before enabling production traffic.

### Public Abuse Controls and Final Verification

Finish the pre-Redis code path while leaving distributed enforcement disabled until infrastructure is available.

1. Add IP policies for public market listing, price/quote, and news endpoints to the existing rate-limit properties and hashed key factory.
2. Enforce stricter quote/news limits and broader cached-listing limits using the trusted proxy-derived client address pattern already used by auth.
3. Paginate unbounded market, trade, user, fund-request, and audit list endpoints before opening them to production traffic.
4. Add safe caching for public market/news reads without caching authenticated wallet, position, or administrator responses.
5. Run focused CSRF, authorization, signup, JWT, idempotency, audit, and rate-limit tests with external-infrastructure `*IT` tests excluded.
6. Run the complete default Maven suite and verify no production profile starts with missing secrets or `ddl-auto=update`.
7. Provision private Redis only after these checks pass, then run `RedisRateLimitServiceIT` explicitly with `RUN_REDIS_INTEGRATION_TESTS=true`.
8. Enable rate limiting in staging, verify `429`, `Retry-After`, fail-open login, and fail-closed signup/financial/admin behavior, then progressively enable production traffic.
