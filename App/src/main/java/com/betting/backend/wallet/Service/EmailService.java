package com.betting.backend.wallet.Service;

import org.springframework.stereotype.Service;

@Service
public interface EmailService {
    void sendFundRequestEmail(String userIdentifier, Long amountCents, String reason);
}
