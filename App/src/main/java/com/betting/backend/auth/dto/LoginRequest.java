// com.betting.backend.auth.dto.LoginRequest.java
package com.betting.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
	@NotBlank @Size(max = 64) String username,
	@NotBlank @Size(max = 128) String password,
	@Pattern(regexp = "^[0-9]{6}$", message = "must be a six-digit code") String mfaCode
) {
	public LoginRequest(String username, String password) {
		this(username, password, null);
	}
}