// com.betting.backend.auth.dto.AuthResponse.java
package com.betting.backend.auth.dto;
// minimal payload; cookie carries the token
public record AuthResponse(String username) {}