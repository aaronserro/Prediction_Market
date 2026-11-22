package com.betting.backend.user.dto;

import java.time.Instant;
import java.util.Set;

public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private Set<String> roles;
    private boolean accountEnabled;
    private Instant deactivatedAt;

    public UserResponse() {
    }

    public UserResponse(Long id, String username, String email, Set<String> roles,
                        boolean accountEnabled, Instant deactivatedAt) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.roles = roles;
        this.accountEnabled = accountEnabled;
        this.deactivatedAt = deactivatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
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

    public boolean isAccountEnabled() {
        return accountEnabled;
    }

    public void setAccountEnabled(boolean accountEnabled) {
        this.accountEnabled = accountEnabled;
    }

    public Instant getDeactivatedAt() {
        return deactivatedAt;
    }

    public void setDeactivatedAt(Instant deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }
}
