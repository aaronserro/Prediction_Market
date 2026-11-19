// com.betting.backend.auth.dto.SignupRequest.java
package com.betting.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SignupRequest(
	@NotBlank
	@Size(min = 3, max = 30)
	@Pattern(regexp = "^[A-Za-z0-9_]+$", message = "must contain only letters, numbers, and underscores")
	String username,
	@NotBlank @Size(min = 10, max = 72) String password,
	@NotBlank @Email @Size(max = 254) String email
) {}
