package com.betting.backend.wallet.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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

    @OneToMany(mappedBy = "wallet", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<WalletTransaction> transactions = new ArrayList<>();

    @OneToMany(mappedBy = "wallet", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<FundRequest> fundRequests = new ArrayList<>();

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

    public List<WalletTransaction> getTransactions() {
        return transactions;
    }

    public void setTransactions(List<WalletTransaction> transactions) {
        this.transactions = transactions;
    }

    public List<FundRequest> getFundRequests() {
        return fundRequests;
    }

    public void setFundRequests(List<FundRequest> fundRequests) {
        this.fundRequests = fundRequests;
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
