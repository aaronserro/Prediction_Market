package com.betting.backend.wallet.Service;

import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Exceptions.InsufficientFundsException;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.dto.TransactionResponse;
import com.betting.backend.wallet.model.Wallet;

@Service
public class WalletMutationExecutor {
    private final WalletRepository walletRepository;
    private final WalletTransactionService walletTransactionService;

    public WalletMutationExecutor(
            WalletRepository walletRepository,
            WalletTransactionService walletTransactionService) {
        this.walletRepository = walletRepository;
        this.walletTransactionService = walletTransactionService;
    }

    @Transactional
    public TransactionResponse mutate(
            Long userId,
            long signedDeltaCents,
            String idempotencyKey,
            String refId) {
        Wallet wallet = walletRepository.findByUser_Id(userId)
                .orElseThrow(() -> new WalletNotFoundException(userId));

        Optional<TransactionResponse> existing =
                walletTransactionService.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return requireMatchingIntent(
                    existing.get(), wallet, signedDeltaCents, idempotencyKey);
        }

        long oldBalance = wallet.getBalanceCents();
        long newBalance = Math.addExact(oldBalance, signedDeltaCents);
        if (newBalance < 0) {
            throw new InsufficientFundsException(
                    userId, wallet.getId(), Math.abs(signedDeltaCents), oldBalance);
        }

        wallet.setBalanceCents(newBalance);
        walletRepository.saveAndFlush(wallet);

        return walletTransactionService.appendTransaction(
                wallet, signedDeltaCents, newBalance, idempotencyKey, refId);
    }

    static TransactionResponse requireMatchingIntent(
            TransactionResponse transaction,
            Wallet wallet,
            long signedDeltaCents,
            String idempotencyKey) {
        String expectedType = signedDeltaCents > 0 ? "CREDIT" : "DEBIT";
        boolean matches = transaction.getWalletId() != null
                && transaction.getWalletId().equals(wallet.getId())
                && transaction.getAmountCents() == Math.abs(signedDeltaCents)
                && expectedType.equals(transaction.getType())
                && "SUCCEEDED".equals(transaction.getStatus());

        if (matches) {
            return transaction;
        }

        throw new DuplicateOperationException(
                idempotencyKey,
                expectedType,
                "Idempotency key already used for a different wallet operation");
    }
}