package com.betting.backend.user;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.trades.Trade;
import com.betting.backend.trades.TradeRepo;
import com.betting.backend.user.dto.UserCreateRequest;
import com.betting.backend.user.dto.UserResponse;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;
    private final TradeRepo tradeRepo;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository,
                          TradeRepo tradeRepo,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tradeRepo = tradeRepo;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody UserCreateRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request body is required");
        }
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());

        Set<String> roles = request.getRoles();
        if (roles == null || roles.isEmpty()) {
            roles = Set.of("ROLE_USER");
        }
        user.setRoles(roles);

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    @GetMapping
    public List<UserResponse> listUsers(@RequestParam(value = "marketId", required = false) UUID marketId) {
        if (marketId != null) {
            return findUsersByMarketId(marketId);
        }

        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @GetMapping("/{userId}")
    public UserResponse getUser(@PathVariable("userId") Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return toResponse(user);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable("userId") Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }

    private List<UserResponse> findUsersByMarketId(UUID marketId) {
        List<Trade> trades = tradeRepo.findByMarketId(marketId);
        Map<Long, User> uniqueUsers = new LinkedHashMap<>();

        for (Trade trade : trades) {
            User user = trade.getUser();
            if (user != null && user.getId() != null) {
                uniqueUsers.putIfAbsent(user.getId(), user);
            }
        }

        return uniqueUsers.values()
                .stream()
                .map(this::toResponse)
                .toList();
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
