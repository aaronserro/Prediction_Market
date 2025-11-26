package com.betting.backend.wallet.Service;

import java.util.Optional;
import java.util.UUID;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import org.springframework.boot.autoconfigure.pulsar.PulsarProperties.Transaction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.betting.backend.wallet.dto.TransferResponse;
import com.betting.backend.wallet.dto.TransferResponse.PartyResponse;
import com.betting.backend.wallet.dto.WalletResponse;
import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.dto.TransactionResponse;
import com.betting.backend.wallet.dto.TransferResponse;
import com.betting.backend.wallet.Exceptions.AmountInvalidException;
import com.betting.backend.wallet.Exceptions.BusinessValidationException;
import com.betting.backend.wallet.Exceptions.DuplicateOperationException;
import com.betting.backend.wallet.Exceptions.InsufficientFundsException;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Repository.WalletTransactionRepository;
import com.betting.backend.wallet.dto.WalletResponse;
import com.betting.backend.wallet.Exceptions.WalletNotFoundException;
import com.betting.backend.wallet.dto.TransactionResponse;

@Service
public class WalletServiceImpl implements WalletService {
    private WalletRepository walletRepository;
    private WalletTransactionService walletTransactionService;
     private final UserRepository userRepository;
    public WalletServiceImpl(UserRepository repo2, WalletRepository repo, WalletTransactionService transactionService){
        this.walletRepository=repo;
        this.walletTransactionService=transactionService;
        this.userRepository=repo2;


    }

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
        throw new AmountInvalidException(amountCents);
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
    TransactionResponse creditTx = this.credit(toUserId,   amountCents, creditKey, refId);

    // 4) Build a shared transferId for audit / future lookup
    String transferId = "tr_" + UUID.randomUUID();

    // 5) Map to TransferResponse (sender = from, receiver = to)
    PartyResponse from = new PartyResponse(
            fromUserId,
            debitTx.getTransactionId().toString(),
            debitTx.getAmountCents()
    );

    PartyResponse to = new PartyResponse(
            toUserId,
            creditTx.getTransactionId().toString(),
            creditTx.getAmountCents()
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
    @Transactional
    public TransactionResponse credit(Long amountCents, Long userid, String IDEkey, String refid){

        Wallet wallet_added;
        if (userid == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if(amountCents<=0){
            throw new AmountInvalidException(amountCents);
        }
        if(IDEkey==null||IDEkey.isBlank()){
            throw new BusinessValidationException(IDEkey);
        }
        // Check idempotency first before loading wallet
        Optional<TransactionResponse> responce = walletTransactionService.findByIdempotencyKey(IDEkey);
        if(responce.isPresent()){
            TransactionResponse tx = responce.get();
            Wallet callerWallet = walletRepository.findByUser_Id(userid)
            .orElseThrow(()-> new WalletNotFoundException(userid));
            boolean sameWallet = tx.getWalletId() != null && tx.getWalletId().equals(callerWallet.getId());
            boolean sameAmount = tx.getAmountCents() == amountCents;
            boolean isCredit   = tx.getType() != null && tx.getType().equalsIgnoreCase("CREDIT");
            boolean succeeded  = tx.getStatus() == null || tx.getStatus().equalsIgnoreCase("SUCCEEDED");

            if (sameWallet && sameAmount && isCredit && succeeded) {
                return tx; // idempotent repeat of the exact same request
            }

            // same key but different intent → reject
            throw new DuplicateOperationException(
                "Idempotency key already used for a different operation (wallet=" +
                tx.getWalletId() + ", type=" + tx.getType() + ", amountCents=" + tx.getAmountCents() + ")"
            );
        }

        // Load wallet for new transaction
        Optional<Wallet> wallet = walletRepository.findByUser_Id(userid);
        if(wallet.isEmpty()){
            throw new WalletNotFoundException(userid);
        }

        wallet_added = wallet.get();
        Long oldBalance = wallet_added.getBalanceCents();
        Long newBalance = oldBalance + amountCents;
        wallet_added.setBalanceCents(newBalance);
        walletRepository.saveAndFlush(wallet_added);

        return walletTransactionService.appendTransaction(wallet_added, amountCents.longValue(), newBalance, IDEkey, refid);
    }

    @Override
    @Transactional
    public TransactionResponse debit(Long amountCents, Long userid, String IDEkey, String refid){
        Wallet wallet_added;
        if (userid == null) {
            throw new IllegalArgumentException("userId is required");
        }
        if(amountCents<=0){
            throw new AmountInvalidException(amountCents);
        }
        if(IDEkey==null||IDEkey.isBlank()){
            throw new BusinessValidationException(IDEkey);
        }
        // Check idempotency first
        Optional<TransactionResponse> responce = walletTransactionService.findByIdempotencyKey(IDEkey);
        if(responce.isPresent()){
            TransactionResponse tx = responce.get();
            Wallet callerWallet = walletRepository.findByUser_Id(userid)
            .orElseThrow(()-> new WalletNotFoundException(userid));
            boolean sameWallet = tx.getWalletId() != null && tx.getWalletId().equals(callerWallet.getId());
            boolean sameAmount = tx.getAmountCents() == amountCents;
            boolean isDebit    = tx.getType() != null && tx.getType().equalsIgnoreCase("DEBIT");
            boolean succeeded  = tx.getStatus() == null || tx.getStatus().equalsIgnoreCase("SUCCEEDED");

            if (sameWallet && sameAmount && isDebit && succeeded) {
                return tx; // idempotent repeat of the exact same request
            }

            // same key but different intent → reject
            throw new DuplicateOperationException(
                "Idempotency key already used for a different operation (wallet=" +
                tx.getWalletId() + ", type=" + tx.getType() + ", amountCents=" + tx.getAmountCents() + ")"
            );
        }

        // Load wallet for new transaction
        Optional<Wallet> wallet = walletRepository.findByUser_Id(userid);
        if(wallet.isEmpty()){
            throw new WalletNotFoundException(userid);
        }

        wallet_added = wallet.get();
        Long oldBalance = wallet_added.getBalanceCents();
        if (oldBalance < amountCents.longValue()) {
            throw new InsufficientFundsException(userid, amountCents, oldBalance);
        }
        Long newBalance = oldBalance - amountCents;
        wallet_added.setBalanceCents(newBalance);
        walletRepository.saveAndFlush(wallet_added);

        return walletTransactionService.appendTransaction(wallet_added, amountCents.longValue(), newBalance, IDEkey, refid);
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
    // --- helpers ---
    private WalletResponse mapToResponse(Wallet wallet) {
        // adjust fields to your DTO
        WalletResponse dto = new WalletResponse();
        dto.setWalletId(wallet.getId());
        dto.setBalanceCents(wallet.getBalanceCents());
        // dto.setUpdatedAt(wallet.getUpdatedAt());   // if present
        // dto.setCurrency("CAD");                    // if you want a default
        return dto;
    }


}
