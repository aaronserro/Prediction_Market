package com.betting.backend.wallet.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.betting.backend.user.User;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One wallet per user
    @OneToOne
    @JoinColumn(name = "UserId", nullable = false, unique = true)
    private User user;

    // Store balance in cents as long (avoids float/double issues)
    @Column(name = "balance_cents", nullable = false)
    private Long balanceCents = 0L;

    // Concurrency control
    @Version
    private int version;

    // Timestamps for auditing
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Constructors ---
    protected Wallet() {
        // JPA requires no-arg constructor
    }

    public Wallet(User user) {
        this.user = user;
        this.balanceCents = 0L;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // --- Getters & Setters ---

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }
    public Long getUserId(){
        return user.getId();
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Long getBalanceCents() {
        return balanceCents;
    }

    public void setBalanceCents(long balanceCents) {
        this.balanceCents = balanceCents;
    }

    public int getVersion() {
        return version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
