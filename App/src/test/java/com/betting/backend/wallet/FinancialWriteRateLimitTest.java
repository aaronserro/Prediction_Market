package com.betting.backend.wallet;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.auth.ratelimit.RateLimitExceededException;
import com.betting.backend.audit.AuditService;
import com.betting.backend.security.IdempotencyKeyFactory;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Controller.FundRequestController;
import com.betting.backend.wallet.Controller.WalletController;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.Service.WalletTransactionService;
import com.betting.backend.wallet.dto.DepositRequest;
import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.TransferRequest;
import com.betting.backend.wallet.dto.WithdrawRequest;

class FinancialWriteRateLimitTest {

    private WalletService walletService;
    private FundRequestServiceImpl fundRequestService;
    private FinancialRateLimiter rateLimiter;
    private WalletController walletController;
    private FundRequestController fundRequestController;

    @BeforeEach
    void setUp() {
        walletService = mock(WalletService.class);
        fundRequestService = mock(FundRequestServiceImpl.class);
        rateLimiter = mock(FinancialRateLimiter.class);
        walletController = new WalletController(
            walletService, mock(WalletTransactionService.class), rateLimiter,
            new IdempotencyKeyFactory(), mock(AuditService.class));
        fundRequestController = new FundRequestController(
            fundRequestService, rateLimiter, new IdempotencyKeyFactory(),
            mock(AuditService.class));
    }

    @Test
    void blockedWithdrawalDoesNotDebitWallet() {
        User user = user(10L);
        doThrow(exceeded("withdraw")).when(rateLimiter).checkWithdraw(10L);

        assertThatThrownBy(() -> walletController.withdraw(
                10L, new WithdrawRequest(500L, "withdrawal"), "withdraw-key", user))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkWithdraw(10L);
        verifyNoInteractions(walletService);
    }

    @Test
    void blockedTransferDoesNotMoveFunds() {
        User user = user(10L);
        TransferRequest request = new TransferRequest(1L, 2L, 500L, "transfer");
        doThrow(exceeded("transfer")).when(rateLimiter).checkTransfer(10L);

        assertThatThrownBy(() -> walletController.transfer(
                10L, 20L, request, "transfer-key", user))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkTransfer(10L);
        verifyNoInteractions(walletService);
    }

    @Test
    void blockedAdminDepositDoesNotCreditWallet() {
        User admin = user(99L);
        doThrow(exceeded("admin-financial"))
                .when(rateLimiter).checkAdminFinancial(99L);

        assertThatThrownBy(() -> walletController.deposit(
                10L, new DepositRequest(500L, "deposit"), "deposit-key", admin))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkAdminFinancial(99L);
        verifyNoInteractions(walletService);
    }

    @Test
    void blockedFundRequestDoesNotCreateRequest() {
        FundRequestCreateRequest request = new FundRequestCreateRequest();
        request.setAmountCents(500L);
        request.setReason("test");
        doThrow(exceeded("fund-request")).when(rateLimiter).checkFundRequest(10L);

        assertThatThrownBy(() -> fundRequestController.createFundRequest(
                10L, request, "fund-request-key", 10L))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkFundRequest(10L);
        verifyNoInteractions(fundRequestService);
    }

    private static User user(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private static RateLimitExceededException exceeded(String policy) {
        return new RateLimitExceededException(policy, 30L);
    }
}
