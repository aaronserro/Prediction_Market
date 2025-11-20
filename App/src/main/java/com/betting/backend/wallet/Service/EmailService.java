package com.betting.backend.wallet.Service;

public interface EmailService {
    void sendFundRequestEmail(String userIdentifier, Long amountCents, String reason);
}
