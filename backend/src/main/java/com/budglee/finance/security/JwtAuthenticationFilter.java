package com.budglee.finance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.budglee.finance.entity.Role;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService customUserDetailsService;
    private final TokenBlocklist tokenBlocklist;
    private final SingleAdminSessionRegistry adminSessionRegistry;

    @Autowired
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   CustomUserDetailsService customUserDetailsService,
                                   TokenBlocklist tokenBlocklist,
                                   SingleAdminSessionRegistry adminSessionRegistry) {
        this.tokenProvider = tokenProvider;
        this.customUserDetailsService = customUserDetailsService;
        this.tokenBlocklist = tokenBlocklist;
        this.adminSessionRegistry = adminSessionRegistry;
    }

    /** Backwards-compatible constructor for filter wiring that does not need shared session state. */
    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider,
                                   CustomUserDetailsService customUserDetailsService,
                                   TokenBlocklist tokenBlocklist) {
        this(tokenProvider, customUserDetailsService, tokenBlocklist, new SingleAdminSessionRegistry());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            // Token chữ ký hợp lệ chưa đủ: đăng xuất đã ghi nó vào blocklist và quản trị có thể
            // tắt tài khoản, nên mỗi request phải kiểm tra cả hai.
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt) && !tokenBlocklist.isBlocked(jwt)) {
                String email = tokenProvider.getEmailFromToken(jwt);
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(email);

                boolean singleAdminSessionValid = true;
                if (userDetails instanceof UserPrincipal principal && principal.getRole() == Role.SYSTEM_ADMIN) {
                    singleAdminSessionValid = adminSessionRegistry.isCurrentSession(
                            email, tokenProvider.getIdFromToken(jwt));
                }

                if (userDetails.isEnabled() && singleAdminSessionValid) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                } else {
                    log.warn("Từ chối token của tài khoản bị khoá hoặc phiên admin không còn hiện hành email={}", email);
                }
            }
        } catch (Exception ex) {
            log.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
