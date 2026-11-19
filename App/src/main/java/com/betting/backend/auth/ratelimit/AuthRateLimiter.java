package com.betting.backend.auth.ratelimit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

@Component
public class AuthRateLimiter {

    private static final Logger log = LoggerFactory.getLogger(AuthRateLimiter.class);

    private final RateLimitService rateLimits;
    private final RateLimitProperties properties;
    private final RateLimitKeyFactory keys;

    public AuthRateLimiter(RateLimitService rateLimits,
                           RateLimitProperties properties,
                           RateLimitKeyFactory keys) {
        this.rateLimits = rateLimits;
        this.properties = properties;
        this.keys = keys;
    }

    public void checkLogin(String clientIp, String username) {
        if (!properties.isEnabled()) {
            return;
        }

        try {
            requireAllowed("login-ip", rateLimits.consume(
                    keys.loginIp(clientIp), properties.getLoginIp().toPolicy()));
            requireAllowed("login-account", rateLimits.inspect(
                    keys.loginAccount(username), properties.getLoginAccount().toPolicy()));
        } catch (DataAccessException ex) {
            // Existing users must not be globally locked out during a Redis outage.
            log.error("Login rate limiting is unavailable; allowing the request", ex);
        }
    }

    public void recordLoginFailure(String username) {
        if (!properties.isEnabled()) {
            return;
        }

        try {
            rateLimits.consume(keys.loginAccount(username), properties.getLoginAccount().toPolicy());
        } catch (DataAccessException ex) {
            log.error("Could not record a failed login in Redis", ex);
        }
    }

    public void clearLoginFailures(String username) {
        if (!properties.isEnabled()) {
            return;
        }

        try {
            rateLimits.clear(keys.loginAccount(username));
        } catch (DataAccessException ex) {
            log.error("Could not clear failed logins in Redis", ex);
        }
    }

    public void checkSignup(String clientIp) {
        if (!properties.isEnabled()) {
            return;
        }

        try {
            requireAllowed("signup-hour", rateLimits.consume(
                    keys.signupHour(clientIp), properties.getSignupHour().toPolicy()));
            requireAllowed("signup-day", rateLimits.consume(
                    keys.signupDay(clientIp), properties.getSignupDay().toPolicy()));
        } catch (DataAccessException ex) {
            // Signup grants wallet credit, so do not proceed without abuse protection.
            log.error("Signup rate limiting is unavailable; rejecting the request", ex);
            throw new RateLimitUnavailableException(ex);
        }
    }

    private static void requireAllowed(String policy, RateLimitDecision decision) {
        if (!decision.allowed()) {
            throw new RateLimitExceededException(policy, decision.retryAfterSeconds());
        }
    }
}
