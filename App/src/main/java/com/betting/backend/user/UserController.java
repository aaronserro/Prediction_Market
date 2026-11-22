package com.betting.backend.user;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

import com.betting.backend.config.PageResponse;
import com.betting.backend.user.dto.UserCreateRequest;
import com.betting.backend.user.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final AdminUserCreationService creationService;
    private final UserLifecycleService lifecycleService;

    public UserController(UserRepository userRepository,
                          AdminUserCreationService creationService,
                          UserLifecycleService lifecycleService) {
        this.userRepository = userRepository;
        this.creationService = creationService;
        this.lifecycleService = lifecycleService;
    }

    @PostMapping
        public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody UserCreateRequest request,
            @AuthenticationPrincipal User admin) {
        User saved = creationService.create(request, admin);
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
            lifecycleService.deactivateAndAnonymize(userId, admin);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles(),
                user.isAccountEnabled(),
                user.getDeactivatedAt()
        );
    }
}
