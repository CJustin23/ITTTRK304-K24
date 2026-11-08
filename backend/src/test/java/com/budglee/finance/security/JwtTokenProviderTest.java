package com.budglee.finance.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private static final String SECRET = Base64.getEncoder().encodeToString(
            "BudgleeFinanceTestSecretKeyMustBeAtLeast32Bytes".getBytes(StandardCharsets.UTF_8)
    );

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();

        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", 3600000L);
    }

    @Test
    void shouldGenerateValidToken() {
        UserPrincipal principal = mock(UserPrincipal.class);

        when(principal.getEmail()).thenReturn("user@test.com");
        when(principal.getId()).thenReturn(1L);
        when(principal.getFullName()).thenReturn("Test User");

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, null);

        String token = jwtTokenProvider.generateToken(authentication);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals("user@test.com", jwtTokenProvider.getEmailFromToken(token));
    }

    @Test
    void shouldExtractEmailFromToken() {
        String token = createToken(
                SECRET,
                "user@test.com",
                new Date(System.currentTimeMillis() + 3600000)
        );

        assertEquals("user@test.com", jwtTokenProvider.getEmailFromToken(token));
    }

    @Test
    void shouldRejectExpiredToken() {
        String token = createToken(
                SECRET,
                "user@test.com",
                new Date(System.currentTimeMillis() - 1000)
        );

        assertFalse(jwtTokenProvider.validateToken(token));
    }

    @Test
    void shouldRejectInvalidSignature() {
        String otherSecret = Base64.getEncoder().encodeToString(
                "AnotherSecretKeyMustAlsoBeAtLeast32Bytes".getBytes(StandardCharsets.UTF_8)
        );

        String token = createToken(
                otherSecret,
                "user@test.com",
                new Date(System.currentTimeMillis() + 3600000)
        );

        assertFalse(jwtTokenProvider.validateToken(token));
    }

    @Test
    void shouldRejectMalformedToken() {
        assertFalse(jwtTokenProvider.validateToken("this-is-not-a-jwt"));
    }

    private String createToken(String secret, String email, Date expiration) {
        byte[] keyBytes = Base64.getDecoder().decode(secret);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(expiration)
                .signWith(
                        Keys.hmacShaKeyFor(keyBytes),
                        SignatureAlgorithm.HS256
                )
                .compact();
    }
}