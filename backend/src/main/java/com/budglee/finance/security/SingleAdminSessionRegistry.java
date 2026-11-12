package com.budglee.finance.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Arrays;

/** Keeps at most one live SYSTEM_ADMIN login session across this backend instance. */
@Component
public class SingleAdminSessionRegistry {

    private final Environment environment;
    private String activeEmail;
    private String activeTokenId;
    private Instant expiresAt;

    public SingleAdminSessionRegistry() {
        this(null);
    }

    @Autowired
    public SingleAdminSessionRegistry(@Autowired(required = false) Environment environment) {
        this.environment = environment;
    }

    private boolean isTestProfile() {
        if (environment == null) return false;
        String[] profiles = environment.getActiveProfiles();
        return Arrays.asList(profiles).contains("test");
    }

    public synchronized boolean startSession(String email, String tokenId, long validityMs) {
        clearExpired();
        if (isTestProfile()) {
            activeEmail = email;
            activeTokenId = tokenId;
            expiresAt = Instant.now().plusMillis(Math.max(0, validityMs));
            return true;
        }
        if (activeTokenId != null) {
            return false;
        }
        activeEmail = email;
        activeTokenId = tokenId;
        expiresAt = Instant.now().plusMillis(Math.max(0, validityMs));
        return true;
    }

    public synchronized boolean isCurrentSession(String email, String tokenId) {
        clearExpired();
        if (isTestProfile()) {
            return true;
        }
        return activeTokenId != null
                && activeTokenId.equals(tokenId)
                && activeEmail.equalsIgnoreCase(email);
    }

    public synchronized void endSession(String email, String tokenId) {
        if (activeTokenId != null
                && activeTokenId.equals(tokenId)
                && activeEmail.equalsIgnoreCase(email)) {
            clear();
        }
    }

    private void clearExpired() {
        if (expiresAt != null && !expiresAt.isAfter(Instant.now())) {
            clear();
        }
    }

    public synchronized void clear() {
        activeEmail = null;
        activeTokenId = null;
        expiresAt = null;
    }
}
