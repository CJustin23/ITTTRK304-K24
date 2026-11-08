package com.budglee.finance.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(userPrincipal.getEmail())
                // iat/exp chỉ nhẵn tới giây, nên hai lần đăng nhập trong cùng một giây cho ra
                // token giống hệt nhau từng byte. Không có jti thì đăng xuất xong đăng nhập lại
                // ngay sẽ nhận đúng token vừa bị thu hồi và bị chặn tới 24 giờ.
                .setId(UUID.randomUUID().toString())
                .claim("userId", userPrincipal.getId())
                .claim("fullName", userPrincipal.getFullName())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }

    /**
     * Thu hồi một token chỉ có nghĩa trong khoảng thời gian nó còn tự sống được; hết hạn rồi thì
     * không cần giữ bản ghi nào nữa.
     */
    public long getRemainingValidityMs(String token) {
        try {
            Date expiry = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
            return expiry == null ? 0L : Math.max(0L, expiry.getTime() - System.currentTimeMillis());
        } catch (JwtException | IllegalArgumentException exception) {
            return 0L;
        }
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException exception) {
            // JwtException là cha của mọi lỗi parse, gồm cả SignatureException. Bắt
            // "SecurityException" trần thì trúng java.lang.SecurityException chứ không phải
            // io.jsonwebtoken.security.SecurityException, nên token sai chữ ký lọt ra ngoài.
            log.error("JWT không hợp lệ: {}", exception.getMessage());
            return false;
        }
    }
}
