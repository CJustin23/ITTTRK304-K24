package com.budglee.finance.security;

import com.budglee.finance.entity.Role;
import com.budglee.finance.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

@AllArgsConstructor
@Getter
public class UserPrincipal implements UserDetails {
    private Long id;
    private String fullName;
    private String email;
    private String password;
    private Role role;
    private String familyGroupId;
    private Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(User user) {
        GrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
        return new UserPrincipal(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getRole(),
                user.getFamilyGroupId(),
                Collections.singletonList(authority)
        );
    }

    /**
     * Vai trò luôn được đọc lại từ CSDL ở mỗi request, nên hạ cấp một tài khoản có hiệu lực ngay
     * mà không cần chờ token hết hạn.
     */
    public boolean hasRole(Role expected) {
        return expected != null && expected == role;
    }

    public boolean isInFamilyGroup() {
        return familyGroupId != null && !familyGroupId.isBlank();
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
