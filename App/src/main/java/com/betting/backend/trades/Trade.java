package com.betting.backend.trades;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.betting.backend.markets.Market;
import com.betting.backend.markets.Outcome;
import com.betting.backend.user.User;

@Entity
@Table(name = "trades")
public class Trade {
    @Column(name = "side", nullable = false, updatable = false)
    @Enumerated(EnumType.STRING)
    private TradeSide side;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "amount", nullable = false, updatable = false)
    private long totalAmount;

    @Column(name = "quantity", nullable = false, updatable = false)
    private int quantity;

    @Column(name = "price_per_share", nullable = false, updatable = false)
    private int pricePerShare;

    @ManyToOne
    @JoinColumn(name="market_id", nullable = false)
    private Market market;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "outcome_id", nullable = false)
    private Outcome outcome;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }
    public TradeSide getside(){
        return side;
    }
    public void setside(TradeSide side){
        this.side=side;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public long getTotalAmount() {
        return totalAmount;
    }

    public int getQuantity() {
        return quantity;
    }

    public int getPricePerShare() {
        return pricePerShare;
    }

    public Market getMarket() {
        return market;
    }

    public User getUser() {
        return user;
    }

    public Outcome getOutcome() {
        return outcome;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setTotalAmount(long totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public void setPricePerShare(int pricePerShare) {
        this.pricePerShare = pricePerShare;
    }

    public void setMarket(Market market) {
        this.market = market;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public void setOutcome(Outcome outcome) {
        this.outcome = outcome;
    }
}
