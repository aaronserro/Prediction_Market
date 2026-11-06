package com.betting.backend.wallet.Service;

import java.util.UUID;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.betting.backend.wallet.dto.TransferResponse;
import com.betting.backend.wallet.dto.TransferResponse.PartyResponse;
import com.betting.backend.wallet.dto.WalletResponse;
import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.dto.TransactionResponse;
import com.betting.backend.wallet.Exceptions.AmountInvalidException;
import com.betting.backend.wallet.Exceptions.BusinessValidationException;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.Repository.WalletRepository;

@Service
public class WalletServiceImpl implements WalletService {
    private final WalletRepository walletRepository;
    private final WalletTransactionService walletTransactionService;
    private final WalletMutationExecutor walletMutationExecutor;
    private final UserRepository userRepository;

    public WalletServiceImpl(
            UserRepository userRepository,
            WalletRepository walletRepository,
            WalletTransactionService walletTransactionService,
            WalletMutationExecutor walletMutationExecutor) {
        this.walletRepository = walletRepository;
        this.walletTransactionService = walletTransactionService;
        this.walletMutationExecutor = walletMutationExecutor;
        this.userRepository = userRepository;
    }

@Override
@Transactional
public TransferResponse transfer(
        Long fromUserId,
        Long toUserId,
        Long amountCents,
        String refId,
        String idempotencyKey
) {
    // 1) Basic validation
    if (fromUserId == null || toUserId == null) {
        throw new IllegalArgumentException("fromUserId and toUserId are required");
    }
    if (fromUserId.equals(toUserId)) {
        throw new IllegalArgumentException("fromUserId must differ from toUserId");
    }
    if (amountCents == null || amountCents <= 0) {
        throw invalidAmount(amountCents);
    }
    if (idempotencyKey == null || idempotencyKey.isBlank()) {
        throw new BusinessValidationException("Idempotency-Key is required");
    }

    // 2) Namespace the idempotency key per leg to avoid DEBIT/CREDIT clashes
    final String debitKey  = idempotencyKey + ":DEBIT:"  + fromUserId + "->" + toUserId;
    final String creditKey = idempotencyKey + ":CREDIT:" + fromUserId + "->" + toUserId;

    // 3) Execute both legs atomically (single DB transaction via @Transactional)
    //    Your existing methods already enforce their own idempotency.
    //    Order: DEBIT sender first (will throw if insufficient funds), then CREDIT receiver.
    TransactionResponse debitTx  = this.debit(amountCents, fromUserId, debitKey,  refId);
    TransactionResponse creditTx = this.credit(amountCents, toUserId,    creditKey, refId);

    // 4) Build a shared transferId for audit / future lookup
    String transferId = "tr_" + UUID.randomUUID();

    // 5) Map to TransferResponse (sender = from, receiver = to)
    PartyResponse from = new PartyResponse(
            fromUserId,
            debitTx.getTransactionId().toString(),
            debitTx.getBalanceAfterCents()
    );

    PartyResponse to = new PartyResponse(
            toUserId,
            creditTx.getTransactionId().toString(),
            creditTx.getBalanceAfterCents()
    );

    TransferResponse resp = new TransferResponse(
            transferId,
            from,
            to,
            amountCents,
            idempotencyKey,   // echo the original key the client sent
            refId,
            Instant.now()
    );

    return resp;
}

    @Override
    public TransactionResponse credit(Long amountCents, Long userid, String IDEkey, String refid){
        return coordinateMutation(amountCents, userid, IDEkey, refid, true);
    }

    @Override
    public TransactionResponse debit(Long amountCents, Long userid, String IDEkey, String refid){
        return coordinateMutation(amountCents, userid, IDEkey, refid, false);
    }

    private TransactionResponse coordinateMutation(
            Long amountCents,
            Long userid,
            String idempotencyKey,
            String refId,
            boolean credit) {
        if (userid == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if(amountCents == null || amountCents <= 0){
            throw invalidAmount(amountCents);
        }
        if(idempotencyKey == null || idempotencyKey.isBlank()){
            throw new BusinessValidationException("Idempotency-Key is required");
        }

        String key = idempotencyKey.trim();
        long signedDelta = credit ? amountCents : -amountCents;
        Wallet wallet = walletRepository.findByUser_Id(userid)
                .orElseThrow(() -> new WalletNotFoundException(userid));

        TransactionResponse existing = walletTransactionService.findByIdempotencyKey(key)
                .orElse(null);
        if (existing != null) {
            return WalletMutationExecutor.requireMatchingIntent(
                    existing, wallet, signedDelta, key);
        }

        try {
            return walletMutationExecutor.mutate(userid, signedDelta, key, refId);
        } catch (DataIntegrityViolationException | OptimisticLockingFailureException conflict) {
            TransactionResponse winner = walletTransactionService.findByIdempotencyKey(key)
                    .orElseThrow(() -> new com.betting.backend.wallet.Exceptions.DuplicateOperationException(
                            key,
                            credit ? "CREDIT" : "DEBIT",
                            "Concurrent wallet mutation prevented this operation"));
            return WalletMutationExecutor.requireMatchingIntent(
                    winner, wallet, signedDelta, key);
        }
    }

    private static AmountInvalidException invalidAmount(Long amountCents) {
        return amountCents == null
                ? new AmountInvalidException(0L, "Amount is required")
                : new AmountInvalidException(amountCents);
    }


    @Override
    @Transactional(readOnly = false)
        public WalletResponse getbalance(Long userId) {
        Wallet wallet = walletRepository.findByUser_Id(userId)

            .orElseGet(() -> {
                // fetch the user entity (or create/validate it)
                User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

                Wallet w = new Wallet(user);
                w.setUser(user);
                w.setBalanceCents(0L);
                return walletRepository.save(w);
            });
        LocalDateTime ldt = wallet.getUpdatedAt(); // <-- LocalDateTime
        Instant updatedAt = (ldt != null)
        ? ldt.atOffset(ZoneOffset.UTC).toInstant()   // ✅ supply an offset/zone
        : Instant.now();

        return new WalletResponse(
            wallet.getId(),
            wallet.getBalanceCents(),
            updatedAt
        );
    }
}
