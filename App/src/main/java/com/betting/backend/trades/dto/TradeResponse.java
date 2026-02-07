package com.betting.backend.trades.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.betting.backend.trades.TradeSide;
import com.betting.backend.user.User;

public class TradeResponse {

    private Long id;

    private UUID marketId;
    private String marketTitle;

    private UUID outcomeId;
    private String outcomeName;
    private String user;
    private int quantity;
    private int pricePerShare; // whatever unit/value you're using
    private long totalAmount;
    private TradeSide side;


    private LocalDateTime createdAt;

    // optional: updated wallet balance after this trade
    private int walletBalanceAfterTrade;
    public TradeSide getSide(){
        return side;
    }
    public void setSide(TradeSide side){
        this.side = side;
    }
    public Long getId() {
        return id;
    }
    public void setUser(String user){
        this.user=user;
    }
    public String getUser(){
        return user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getMarketId() {
        return marketId;
    }

    public void setMarketId(UUID marketId) {
        this.marketId = marketId;
    }

    public String getMarketTitle() {
        return marketTitle;
    }

    public void setMarketTitle(String marketTitle) {
        this.marketTitle = marketTitle;
    }

    public UUID getOutcomeId() {
        return outcomeId;
    }

    public void setOutcomeId(UUID outcomeId) {
        this.outcomeId = outcomeId;
    }

    public String getOutcomeName() {
        return outcomeName;
    }

    public void setOutcomeName(String outcomeName) {
        this.outcomeName = outcomeName;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public int getPricePerShare() {
        return pricePerShare;
    }

    public void setPricePerShare(int pricePerShare) {
        this.pricePerShare = pricePerShare;
    }

    public long getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(long totalAmount) {
        this.totalAmount = totalAmount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public int getWalletBalanceAfterTrade() {
        return walletBalanceAfterTrade;
    }

    public void setWalletBalanceAfterTrade(int walletBalanceAfterTrade) {
        this.walletBalanceAfterTrade = walletBalanceAfterTrade;
    }
}
