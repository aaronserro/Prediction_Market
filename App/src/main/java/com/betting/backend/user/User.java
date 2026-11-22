package com.betting.backend.user;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import com.betting.backend.positions.Position;
import com.betting.backend.trades.Trade;
import com.betting.backend.wallet.model.Wallet;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(name = "password_hash",nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String email;

    @Column(name = "account_enabled", nullable = false)
    private boolean accountEnabled = true;

    @Column(name = "token_version", nullable = false)
    private long tokenVersion;

    @Column(name = "deactivated_at")
    private Instant deactivatedAt;

    @Column(name = "deactivated_by_user_id")
    private Long deactivatedByUserId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<String> roles;

    @OneToMany(mappedBy = "user")
    private List<Position> positions = new ArrayList<>();

    @OneToMany(mappedBy = "user")
    private List<Trade> trades = new ArrayList<>();

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Wallet wallet;

    // --- Getters ---
    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getEmail() {
        return email;
    }

    public Set<String> getRoles() {
        return roles;
    }

    public long getTokenVersion() {
        return tokenVersion;
    }

    public boolean isAccountEnabled() {
        return accountEnabled;
    }

    public Instant getDeactivatedAt() {
        return deactivatedAt;
    }

    public Long getDeactivatedByUserId() {
        return deactivatedByUserId;
    }

    public List<Position> getPositions() {
        return positions;
    }

    public List<Trade> getTrades() {
        return trades;
    }

    public Wallet getWallet() {
        return wallet;
    }

    // --- Setters ---
    public void setId(Long id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPasswordHash(String passwordHash) {
        invalidateTokensWhenPersistedValueChanges(this.passwordHash, passwordHash);
        this.passwordHash = passwordHash;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setRoles(Set<String> roles) {
        invalidateTokensWhenPersistedValueChanges(this.roles, roles);
        this.roles = roles;
    }

    public void setAccountEnabled(boolean accountEnabled) {
        if (this.id != null && this.accountEnabled != accountEnabled) {
            tokenVersion++;
        }
        this.accountEnabled = accountEnabled;
    }

    public void setTokenVersion(long tokenVersion) {
        this.tokenVersion = tokenVersion;
    }

    public void markDeactivated(Instant occurredAt, Long administratorId) {
        if (accountEnabled) {
            throw new IllegalStateException("Account must be disabled before deactivation is recorded");
        }
        deactivatedAt = Objects.requireNonNull(occurredAt, "Deactivation time is required");
        deactivatedByUserId = Objects.requireNonNull(
                administratorId, "Deactivating administrator ID is required");
    }

    public void setPositions(List<Position> positions) {
        this.positions = positions;
    }

    public void setTrades(List<Trade> trades) {
        this.trades = trades;
    }

    public void setWallet(Wallet wallet) {
        this.wallet = wallet;
    }

    // --- UserDetails implementation ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null || roles.isEmpty()) {
            return Set.of();
        }
        return roles.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return accountEnabled;
    }

    private void invalidateTokensWhenPersistedValueChanges(Object currentValue, Object newValue) {
        if (id != null && !Objects.equals(currentValue, newValue)) {
            tokenVersion++;
        }
    }
}
