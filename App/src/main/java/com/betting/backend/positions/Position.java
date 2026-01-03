package com.betting.backend.positions;

import java.time.LocalDateTime;

import java.util.*;

import com.betting.backend.user.User;

import jakarta.persistence.Entity;
@Entity
public class Position {
    private Long id;
    private User user;
    private UUID outcomeId;
    private int quantity;
    private long CostBasisCents;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long realizedPnl;

    // Getters and Setters

    public User getUser() {
        return user;
    }
    public Long getId(){
        return id;
    }
    public void setId(Long id){
        this.id=id;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public UUID getOutcomeId() {
        return outcomeId;
    }

    public void setOutcomeId(UUID outcomeId) {
        this.outcomeId = outcomeId;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public Long getCostBasisCents() {
        return CostBasisCents;
    }

    public void setCostBasisCents(Long costBasisCents) {
        CostBasisCents = costBasisCents;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdateAt() {
        return updatedAt;
    }

    public void setUpdateAt(LocalDateTime updateAt) {
        this.updatedAt = updateAt;
    }

    public Long getRealizedPnl() {
        return realizedPnl;
    }

    public void setRealizedPnl(Long realizedPnl) {
        this.realizedPnl = realizedPnl;
    }
}
