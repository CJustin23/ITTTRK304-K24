package com.budglee.finance.security;

import org.springframework.stereotype.Component;

import java.time.Instant;

/** Keeps at most one live SYSTEM_ADMIN login session across this backend instance. */
@Component
public class SingleAdminSessionRegistry {

    private String activeEmail;
    private String activeTokenId;
    private Instant expiresAt;

    public synchronized boolean startSession(String email, String tokenId, long validityMs) {
        clearExpired();
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

    private void clear() {
        activeEmail = null;
        activeTokenId = null;
        expiresAt = null;
    }
}
