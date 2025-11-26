package com.betting.backend.auth;

import java.util.List;

public class MeResponse {
    private Long userId;
    private String username;
    private List<String> roles;

    public MeResponse(Long userId, String username, List<String> roles) {
        this.userId = userId;
        this.username = username;
        this.roles = roles;
    }

    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
    public List<String> getRoles() { return roles; }
}
