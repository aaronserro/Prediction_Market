package com.betting.backend.wallet;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Repository.WalletTransactionRepository;
import com.betting.backend.wallet.Service.WalletMutationExecutor;
import com.betting.backend.wallet.Service.WalletServiceImpl;
import com.betting.backend.wallet.Service.WalletTransactionService;
import com.betting.backend.wallet.Service.WalletTransactionServiceImpl;
import com.betting.backend.wallet.dto.TransactionResponse;
import com.betting.backend.wallet.dto.TransferResponse;
import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.wallet.model.WalletTransaction;

class WalletLedgerServiceTest {

    @Test
    void appendDebitMapsCompleteResponseAndPersistsNegativeDelta() {
        WalletTransactionRepository transactionRepository = mock(WalletTransactionRepository.class);
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletTransactionServiceImpl service =
                new WalletTransactionServiceImpl(transactionRepository, walletRepository);
        Wallet wallet = wallet(10L, 1L, 1_500L);

        when(transactionRepository.saveAndFlush(any(WalletTransaction.class)))
                .thenAnswer(invocation -> {
                    WalletTransaction transaction = invocation.getArgument(0);
                    ReflectionTestUtils.setField(transaction, "id", 99L);
                    transaction.onCreate();
                    return transaction;
                });

        TransactionResponse response = service.appendTransaction(
                wallet, -500L, 1_000L, " debit-key ", "ORDER:7");

        ArgumentCaptor<WalletTransaction> captor =
                ArgumentCaptor.forClass(WalletTransaction.class);
        verify(transactionRepository).saveAndFlush(captor.capture());
        WalletTransaction persisted = captor.getValue();
        assertThat(persisted.getDeltaCents()).isEqualTo(-500L);
        assertThat(persisted.getRefId()).isEqualTo("ORDER:7");
        assertThat(response.getTransactionId()).isEqualTo(99L);
        assertThat(response.getWalletId()).isEqualTo(10L);
        assertThat(response.getAmountCents()).isEqualTo(500L);
        assertThat(response.getType()).isEqualTo("DEBIT");
        assertThat(response.getStatus()).isEqualTo("SUCCEEDED");
        assertThat(response.getIdempotencyKey()).isEqualTo("debit-key");
        assertThat(response.getRefId()).isEqualTo("ORDER:7");
        assertThat(response.getBalanceAfterCents()).isEqualTo(1_000L);
        assertThat(response.getCreatedAt()).isNotNull();
    }

    @Test
    void dateRangeConvertsInclusiveInstantBoundsToUtcLocalDateTime() {
        WalletTransactionRepository transactionRepository = mock(WalletTransactionRepository.class);
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletTransactionServiceImpl service =
                new WalletTransactionServiceImpl(transactionRepository, walletRepository);
        Wallet wallet = wallet(10L, 1L, 0L);
        Instant from = Instant.parse("2026-10-01T04:05:06Z");
        Instant to = Instant.parse("2026-10-02T07:08:09Z");

        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(wallet));
        when(transactionRepository.findByWalletAndCreatedAtBetweenOrderByCreatedAtDesc(
                eq(wallet), any(LocalDateTime.class), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        service.getTransactionsByDateRange(1L, from, to, 0, 20);

        verify(transactionRepository).findByWalletAndCreatedAtBetweenOrderByCreatedAtDesc(
                eq(wallet),
                eq(LocalDateTime.ofInstant(from, ZoneOffset.UTC)),
                eq(LocalDateTime.ofInstant(to, ZoneOffset.UTC)),
                org.mockito.ArgumentMatchers.argThat(pageable ->
                        pageable.getPageNumber() == 0 && pageable.getPageSize() == 20));
    }

    @Test
    void debitExecutorWritesSignedDeltaAndAbsoluteResponse() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletTransactionService transactionService = mock(WalletTransactionService.class);
        WalletMutationExecutor executor =
                new WalletMutationExecutor(walletRepository, transactionService);
        Wallet wallet = wallet(10L, 1L, 2_000L);
        TransactionResponse expected = transaction(88L, 10L, "DEBIT", 500L, 1_500L, "key");

        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(wallet));
        when(transactionService.findByIdempotencyKey("key")).thenReturn(Optional.empty());
        when(transactionService.appendTransaction(wallet, -500L, 1_500L, "key", "ref"))
                .thenReturn(expected);

        TransactionResponse actual = executor.mutate(1L, -500L, "key", "ref");

        assertThat(actual).isSameAs(expected);
        assertThat(actual.getAmountCents()).isEqualTo(500L);
        assertThat(wallet.getBalanceCents()).isEqualTo(1_500L);
        verify(walletRepository).saveAndFlush(wallet);
        verify(transactionService).appendTransaction(wallet, -500L, 1_500L, "key", "ref");
    }

    @Test
    void exactRetryReturnsOriginalButConflictingDirectionIsRejected() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletTransactionService transactionService = mock(WalletTransactionService.class);
        WalletMutationExecutor executor = mock(WalletMutationExecutor.class);
        WalletServiceImpl service = service(walletRepository, transactionService, executor);
        Wallet wallet = wallet(10L, 1L, 1_000L);
        TransactionResponse original = transaction(77L, 10L, "CREDIT", 250L, 1_250L, "same-key");

        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(wallet));
        when(transactionService.findByIdempotencyKey("same-key"))
                .thenReturn(Optional.of(original));

        assertThat(service.credit(250L, 1L, "same-key", "ref")).isSameAs(original);
        assertThatThrownBy(() -> service.debit(250L, 1L, "same-key", "ref"))
                .isInstanceOf(DuplicateOperationException.class);
    }

    @Test
    void uniqueKeyRaceReturnsMatchingWinningTransaction() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletTransactionService transactionService = mock(WalletTransactionService.class);
        WalletMutationExecutor executor = mock(WalletMutationExecutor.class);
        WalletServiceImpl service = service(walletRepository, transactionService, executor);
        Wallet wallet = wallet(10L, 1L, 1_000L);
        TransactionResponse winner = transaction(77L, 10L, "CREDIT", 250L, 1_250L, "race-key");

        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(wallet));
        when(transactionService.findByIdempotencyKey("race-key"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(winner));
        when(executor.mutate(1L, 250L, "race-key", "ref"))
                .thenThrow(new DataIntegrityViolationException("unique key race"));

        assertThat(service.credit(250L, 1L, "race-key", "ref")).isSameAs(winner);
    }

    @Test
    void transferUsesDeterministicLegKeysAndBalanceSnapshots() {
        WalletRepository walletRepository = mock(WalletRepository.class);
        WalletTransactionService transactionService = mock(WalletTransactionService.class);
        WalletMutationExecutor executor = mock(WalletMutationExecutor.class);
        WalletServiceImpl service = service(walletRepository, transactionService, executor);
        Wallet sender = wallet(10L, 1L, 1_000L);
        Wallet receiver = wallet(20L, 2L, 100L);
        TransactionResponse debit = transaction(31L, 10L, "DEBIT", 300L, 700L, "transfer:DEBIT:1->2");
        TransactionResponse credit = transaction(32L, 20L, "CREDIT", 300L, 400L, "transfer:CREDIT:1->2");

        when(walletRepository.findByUser_Id(1L)).thenReturn(Optional.of(sender));
        when(walletRepository.findByUser_Id(2L)).thenReturn(Optional.of(receiver));
        when(transactionService.findByIdempotencyKey(any())).thenReturn(Optional.empty());
        when(executor.mutate(1L, -300L, "transfer:DEBIT:1->2", "ORDER:4"))
                .thenReturn(debit);
        when(executor.mutate(2L, 300L, "transfer:CREDIT:1->2", "ORDER:4"))
                .thenReturn(credit);

        TransferResponse response = service.transfer(1L, 2L, 300L, "ORDER:4", "transfer");

        assertThat(response.getFrom().getBalanceAfterCents()).isEqualTo(700L);
        assertThat(response.getTo().getBalanceAfterCents()).isEqualTo(400L);
        assertThat(debit.getAmountCents()).isEqualTo(300L);
        verify(executor).mutate(1L, -300L, "transfer:DEBIT:1->2", "ORDER:4");
        verify(executor).mutate(2L, 300L, "transfer:CREDIT:1->2", "ORDER:4");
    }

    private static WalletServiceImpl service(
            WalletRepository walletRepository,
            WalletTransactionService transactionService,
            WalletMutationExecutor executor) {
        return new WalletServiceImpl(
                mock(UserRepository.class), walletRepository, transactionService, executor);
    }

    private static Wallet wallet(Long walletId, Long userId, long balanceCents) {
        User user = new User();
        user.setId(userId);
        Wallet wallet = new Wallet(user);
        wallet.setBalanceCents(balanceCents);
        ReflectionTestUtils.setField(wallet, "id", walletId);
        return wallet;
    }

    private static TransactionResponse transaction(
            Long transactionId,
            Long walletId,
            String type,
            long amountCents,
            long balanceAfterCents,
            String key) {
        TransactionResponse response = new TransactionResponse();
        response.setTransactionId(transactionId);
        response.setWalletId(walletId);
        response.setType(type);
        response.setAmountCents(amountCents);
        response.setBalanceAfterCents(balanceAfterCents);
        response.setStatus("SUCCEEDED");
        response.setIdempotencyKey(key);
        return response;
    }
}