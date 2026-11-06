package com.betting.backend.wallet.Service;

public record FundRequestCreatedEvent(
        Long userId,
        Long amountCents,
        String reason) {
}