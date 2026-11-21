package com.betting.backend.wallet;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.auth.ratelimit.RateLimitExceededException;
import com.betting.backend.audit.AuditService;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Controller.FundRequestAdminController;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.dto.FundRequestResponse;

class FundRequestAdminRateLimitTest {

    private FundRequestServiceImpl fundRequestService;
    private FinancialRateLimiter rateLimiter;
    private FundRequestAdminController controller;
    private AuditService auditService;
    private User admin;

    @BeforeEach
    void setUp() {
        fundRequestService = mock(FundRequestServiceImpl.class);
        rateLimiter = mock(FinancialRateLimiter.class);
        auditService = mock(AuditService.class);
        controller = new FundRequestAdminController(
            fundRequestService, mock(FundRequestRepository.class), rateLimiter,
            auditService);
        admin = new User();
        admin.setId(99L);
    }

    @Test
    void blockedApprovalDoesNotApproveRequest() {
        doThrow(exceeded()).when(rateLimiter).checkAdminFinancial(99L);

        assertThatThrownBy(() -> controller.approveRequest(7L, admin))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkAdminFinancial(99L);
        verifyNoInteractions(fundRequestService);
    }

    @Test
    void blockedRejectionDoesNotDenyRequest() {
        doThrow(exceeded()).when(rateLimiter).checkAdminFinancial(99L);

        assertThatThrownBy(() -> controller.rejectRequest(7L, admin))
                .isInstanceOf(RateLimitExceededException.class);

        verify(rateLimiter).checkAdminFinancial(99L);
        verifyNoInteractions(fundRequestService);
    }

    @Test
    void allowedApprovalChecksLimitBeforeMutation() {
        FundRequestResponse response = new FundRequestResponse();
        when(fundRequestService.approveRequest(7L, 99L)).thenReturn(response);

        controller.approveRequest(7L, admin);

        InOrder order = inOrder(rateLimiter, fundRequestService);
        order.verify(rateLimiter).checkAdminFinancial(99L);
        order.verify(fundRequestService).approveRequest(7L, 99L);
        verify(auditService).success(99L, "FUND_REQUEST_APPROVE", "FUND_REQUEST", "7");
    }

    @Test
    void allowedRejectionChecksLimitBeforeMutation() {
        FundRequestResponse response = new FundRequestResponse();
        when(fundRequestService.denyRequest(7L, 99L)).thenReturn(response);

        controller.rejectRequest(7L, admin);

        InOrder order = inOrder(rateLimiter, fundRequestService);
        order.verify(rateLimiter).checkAdminFinancial(99L);
        order.verify(fundRequestService).denyRequest(7L, 99L);
        verify(auditService).success(99L, "FUND_REQUEST_REJECT", "FUND_REQUEST", "7");
    }

    private static RateLimitExceededException exceeded() {
        return new RateLimitExceededException("admin-financial", 30L);
    }
}
