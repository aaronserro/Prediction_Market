package com.betting.backend.wallet.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class FundRequestEmailListener {
    private static final Logger log =
            LoggerFactory.getLogger(FundRequestEmailListener.class);

    private final EmailService emailService;

    public FundRequestEmailListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendCreationEmail(FundRequestCreatedEvent event) {
        try {
            emailService.sendFundRequestEmail(
                    "userId=" + event.userId(), event.amountCents(), event.reason());
        } catch (RuntimeException exception) {
            log.error("Fund-request email failed after commit for userId={}",
                    event.userId(), exception);
        }
    }
}