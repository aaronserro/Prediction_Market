// com.betting.backend.auth.dto.AuthResponse.java
package com.betting.backend.auth.dto;

// Cookie carries the token for web; mobile can use the token in the body.
public record AuthResponse(String username, String token) {}