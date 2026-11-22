package com.betting.backend.user.dto;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserCreateRequest {
    @NotBlank
    @Size(min = 3, max = 30)
    @Pattern(regexp = "^[A-Za-z0-9_]+$",
        message = "must contain only letters, numbers, and underscores")
    private String username;

    @NotBlank
    @Size(min = 10, max = 72)
    private String password;

    @NotBlank
    @Email
    @Size(max = 254)
    private String email;

    @Size(max = 2)
    private Set<@Pattern(regexp = "^(ROLE_USER|ROLE_ADMIN)$",
        message = "must be ROLE_USER or ROLE_ADMIN") String> roles;

    @Pattern(regexp = "^[0-9]{6}$", message = "must be a six-digit code")
    private String mfaCode;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public void setRoles(Set<String> roles) {
        this.roles = roles;
    }

    public String getMfaCode() {
        return mfaCode;
    }

    public void setMfaCode(String mfaCode) {
        this.mfaCode = mfaCode;
    }
}
