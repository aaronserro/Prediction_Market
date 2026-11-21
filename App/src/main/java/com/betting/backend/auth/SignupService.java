package com.betting.backend.auth;

import java.util.Locale;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.auth.dto.SignupRequest;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.Service.WalletService;

@Service
public class SignupService {

    private static final long SIGNUP_BONUS_CENTS = 10_000L;
    private static final String SIGNUP_BONUS_REFERENCE = "SIGNUP_BONUS";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final WalletService walletService;

    public SignupService(UserRepository users,
                         PasswordEncoder encoder,
                         WalletService walletService) {
        this.users = users;
        this.encoder = encoder;
        this.walletService = walletService;
    }

    @Transactional
    public User signup(SignupRequest request) {
        String username = normalize(request.username());
        String email = normalize(request.email());

        if (users.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(encoder.encode(request.password()));
        user.setEmail(email);
        user.setRoles(Set.of("ROLE_USER"));
        User saved = users.save(user);

        walletService.getbalance(saved.getId());
        walletService.credit(
                SIGNUP_BONUS_CENTS,
                saved.getId(),
                SIGNUP_BONUS_REFERENCE + ":" + saved.getId(),
                SIGNUP_BONUS_REFERENCE);
        return saved;
    }

    private String normalize(String value) {
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
