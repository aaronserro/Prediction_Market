package com.betting.backend.trades;

public final class TradeLimits {

    public static final int MAX_QUANTITY = 10_000;

    private TradeLimits() {
    }

    public static int requireValidQuantity(int quantity) {
        if (quantity < 1 || quantity > MAX_QUANTITY) {
            throw new IllegalArgumentException(
                    "Quantity must be between 1 and " + MAX_QUANTITY);
        }
        return quantity;
    }
}