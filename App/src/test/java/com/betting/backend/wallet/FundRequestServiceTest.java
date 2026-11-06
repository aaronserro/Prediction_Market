package com.betting.backend.wallet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.time.Instant;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.betting.backend.user.User;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Service.EmailService;
import com.betting.backend.wallet.Service.FundRequestCreatedEvent;
import com.betting.backend.wallet.Service.FundRequestCreationExecutor;
import com.betting.backend.wallet.Service.FundRequestEmailListener;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
import com.betting.backend.wallet.model.Wallet;

import jakarta.persistence.LockModeType;

class FundRequestServiceTest {

    @Test
    void exactCreationRetryReturnsOriginalWithoutCreatingAgain() {
        Fixture fixture = new Fixture();
        FundRequest existing = request(41L, fixture.wallet, 500L, "reason", "create-key");
        when(fixture.fundRequests.findByIdempotencyKey("create-key"))
                .thenReturn(Optional.of(existing));

        FundRequestResponse response = fixture.service.createFundRequest(
                1L, creation(500L, "reason"), " create-key ");

        assertThat(response.getId()).isEqualTo(41L);
        verify(fixture.creationExecutor, never()).create(any(), any(), any(), any());
    }

    @Test
    void reusedCreationKeyWithDifferentIntentIsRejected() {
        Fixture fixture = new Fixture();
        FundRequest existing = request(41L, fixture.wallet, 500L, "reason", "create-key");
        when(fixture.fundRequests.findByIdempotencyKey("create-key"))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> fixture.service.createFundRequest(
                1L, creation(700L, "different"), "create-key"))
                .isInstanceOf(DuplicateOperationException.class)
                .hasMessageContaining("different fund request");
    }

    @Test
    void uniqueKeyRaceReturnsMatchingWinningRequest() {
        Fixture fixture = new Fixture();
        FundRequest winner = request(42L, fixture.wallet, 500L, "reason", "race-key");
        when(fixture.fundRequests.findByIdempotencyKey("race-key"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winner));
        when(fixture.creationExecutor.create(1L, 500L, "reason", "race-key"))
                .thenThrow(new DataIntegrityViolationException("unique-key race"));

        FundRequestResponse response = fixture.service.createFundRequest(
                1L, creation(500L, "reason"), "race-key");

        assertThat(response.getId()).isEqualTo(42L);
    }

    @Test
    void creationExecutorPublishesEventOnlyForNewRequest() {
        FundRequestRepository fundRequests = mock(FundRequestRepository.class);
        WalletRepository wallets = mock(WalletRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        FundRequestCreationExecutor executor =
                new FundRequestCreationExecutor(fundRequests, wallets, events);
        Wallet wallet = wallet(10L, 1L, 0L);
        when(fundRequests.findByIdempotencyKey("new-key")).thenReturn(Optional.empty());
        when(wallets.findByUser_Id(1L)).thenReturn(Optional.of(wallet));
        when(fundRequests.saveAndFlush(any(FundRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FundRequest created = executor.create(1L, 500L, "reason", "new-key");

        assertThat(created.getIdempotencyKey()).isEqualTo("new-key");
        verify(events).publishEvent(new FundRequestCreatedEvent(1L, 500L, "reason"));
    }

    @Test
    void emailListenerIsAfterCommitAndDoesNotFailCommittedRequest() throws Exception {
        EmailService emailService = mock(EmailService.class);
        FundRequestEmailListener listener = new FundRequestEmailListener(emailService);
        FundRequestCreatedEvent event = new FundRequestCreatedEvent(1L, 500L, "reason");
        org.mockito.Mockito.doThrow(new RuntimeException("smtp unavailable"))
                .when(emailService).sendFundRequestEmail("userId=1", 500L, "reason");

        assertThatCode(() -> listener.sendCreationEmail(event)).doesNotThrowAnyException();
        Method method = FundRequestEmailListener.class.getMethod(
                "sendCreationEmail", FundRequestCreatedEvent.class);
        TransactionalEventListener annotation =
                method.getAnnotation(TransactionalEventListener.class);
        assertThat(annotation.phase()).isEqualTo(TransactionPhase.AFTER_COMMIT);
    }

    @Test
    void approvalUsesLockedRequestAndDeterministicCreditKey() {
        Fixture fixture = new Fixture();
        FundRequest pending = request(51L, fixture.wallet, 900L, "reason", "create-key");
        when(fixture.fundRequests.findByIdForUpdate(51L)).thenReturn(Optional.of(pending));
        when(fixture.wallets.findById(10L)).thenReturn(Optional.of(fixture.wallet));
        when(fixture.fundRequests.save(pending)).thenReturn(pending);

        FundRequestResponse response = fixture.service.approveRequest(51L, 99L);

        assertThat(response.getStatus()).isEqualTo(FundRequestStatus.APPROVED);
        verify(fixture.walletService).credit(
                900L, 1L, "FUND_REQUEST:51", "FUND_REQUEST:51");
        verify(fixture.fundRequests).findByIdForUpdate(51L);
    }

    @Test
    void approvalRetryReturnsApprovedResultWithoutCreditingAgain() {
        Fixture fixture = new Fixture();
        FundRequest approved = request(53L, fixture.wallet, 900L, "reason", "create-key");
        approved.setStatus(FundRequestStatus.APPROVED);
        when(fixture.fundRequests.findByIdForUpdate(53L)).thenReturn(Optional.of(approved));

        FundRequestResponse response = fixture.service.approveRequest(53L, 99L);

        assertThat(response.getStatus()).isEqualTo(FundRequestStatus.APPROVED);
        verify(fixture.walletService, never()).credit(any(), any(), any(), any());
    }

    @Test
    void rejectionUsesLockedRequestWithoutCreditingWallet() {
        Fixture fixture = new Fixture();
        FundRequest pending = request(52L, fixture.wallet, 900L, "reason", "create-key");
        when(fixture.fundRequests.findByIdForUpdate(52L)).thenReturn(Optional.of(pending));
        when(fixture.fundRequests.save(pending)).thenReturn(pending);

        FundRequestResponse response = fixture.service.denyRequest(52L, 99L);

        assertThat(response.getStatus()).isEqualTo(FundRequestStatus.REJECTED);
        verify(fixture.walletService, never()).credit(any(), any(), any(), any());
        verify(fixture.fundRequests).findByIdForUpdate(52L);
    }

    @Test
    void processingRepositoryMethodUsesPessimisticWriteLock() throws Exception {
        Method method = FundRequestRepository.class.getMethod("findByIdForUpdate", Long.class);
        assertThat(method.getAnnotation(Lock.class).value())
                .isEqualTo(LockModeType.PESSIMISTIC_WRITE);
    }

    private static FundRequestCreateRequest creation(Long amountCents, String reason) {
        FundRequestCreateRequest request = new FundRequestCreateRequest();
        request.setAmountCents(amountCents);
        request.setReason(reason);
        return request;
    }

    private static FundRequest request(
            Long id,
            Wallet wallet,
            Long amountCents,
            String reason,
            String idempotencyKey) {
        FundRequest request = new FundRequest(wallet, amountCents, reason, idempotencyKey);
        ReflectionTestUtils.setField(request, "id", id);
        ReflectionTestUtils.setField(request, "createdAt", Instant.now());
        return request;
    }

    private static Wallet wallet(Long walletId, Long userId, Long balanceCents) {
        User user = new User();
        user.setId(userId);
        Wallet wallet = new Wallet(user);
        wallet.setBalanceCents(balanceCents);
        ReflectionTestUtils.setField(wallet, "id", walletId);
        return wallet;
    }

    private static final class Fixture {
        private final FundRequestRepository fundRequests = mock(FundRequestRepository.class);
        private final WalletRepository wallets = mock(WalletRepository.class);
        private final FundRequestCreationExecutor creationExecutor =
                mock(FundRequestCreationExecutor.class);
        private final WalletService walletService = mock(WalletService.class);
        private final Wallet wallet = wallet(10L, 1L, 0L);
        private final FundRequestServiceImpl service = new FundRequestServiceImpl(
                fundRequests, wallets, creationExecutor, walletService);
    }
}
