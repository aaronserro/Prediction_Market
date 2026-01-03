package com.betting.backend.positions;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import com.betting.backend.user.User;
import com.betting.backend.markets.Outcome;

@Entity
@Table(name = "positions")
public class Position {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "outcome_id", nullable = false)
    private Outcome outcome;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    @Column(name = "cost_basis_cents", nullable = false)
    private long costBasisCents;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "realized_pnl")
    private Long realizedPnl;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Outcome getOutcome() {
        return outcome;
    }

    public void setOutcome(Outcome outcome) {
        this.outcome = outcome;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public long getCostBasisCents() {
        return costBasisCents;
    }

    public void setCostBasisCents(long costBasisCents) {
        this.costBasisCents = costBasisCents;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getRealizedPnl() {
        return realizedPnl;
    }

    public void setRealizedPnl(Long realizedPnl) {
        this.realizedPnl = realizedPnl;
    }
}
