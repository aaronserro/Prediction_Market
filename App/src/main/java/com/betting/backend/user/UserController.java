package com.betting.backend.user;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.audit.AuditService;
import com.betting.backend.config.PageResponse;
import com.betting.backend.user.dto.UserCreateRequest;
import com.betting.backend.user.dto.UserResponse;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @PostMapping
        public ResponseEntity<UserResponse> createUser(
            @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal User admin) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }

        String username = request.getUsername().trim().toLowerCase(Locale.ROOT);
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(email);

        Set<String> roles = request.getRoles();
        if (roles == null || roles.isEmpty()) {
            roles = Set.of("ROLE_USER");
        }
        user.setRoles(roles);

        User saved = userRepository.save(user);
        auditService.success(admin.getId(), "USER_CREATE", "USER", saved.getId().toString());
        return ResponseEntity.status(HttpStatus.CREATED)
            .cacheControl(CacheControl.noStore()).body(toResponse(saved));
    }

    @GetMapping
        public ResponseEntity<PageResponse<UserResponse>> listUsers(
            @RequestParam(value = "marketId", required = false) UUID marketId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
            Sort.by(Sort.Direction.ASC, "id"));
        var users = marketId == null
            ? userRepository.findAll(pageable)
            : userRepository.findDistinctByTradedMarket(marketId, pageable);
        return ResponseEntity.ok().header("Cache-Control", "no-store")
            .body(PageResponse.from(users.map(this::toResponse)));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUser(@PathVariable("userId") Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(toResponse(user));
    }

    @DeleteMapping("/{userId}")
        public ResponseEntity<Void> deleteUser(
            @PathVariable("userId") Long userId,
            @AuthenticationPrincipal User admin) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        userRepository.delete(user);
        auditService.success(admin.getId(), "USER_DELETE", "USER", userId.toString());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles()
        );
    }
}
