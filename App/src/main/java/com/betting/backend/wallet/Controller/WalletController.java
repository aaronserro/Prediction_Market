package com.betting.backend.wallet.Controller;

import java.net.URI;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.Service.WalletServiceImpl;
import com.betting.backend.wallet.dto.*;

@RestController
@RequestMapping("/api/v1")
@Validated
public class WalletController {
    private final WalletServiceImpl walletService;
    public WalletController(WalletServiceImpl walletService) {
        this.walletService = walletService;
    }
    @GetMapping("/users/{userId}/wallet")
    public ResponseEntity<WalletResponse> getWallet(
            @PathVariable("userId") Long userId,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "Accept", required = false) String acceptHeader) {

        WalletResponse wallet = walletService.getbalance(userId);

        return ResponseEntity.ok()
                .header("Cache-Control", "no-store")
                .body(wallet);
    }
    @PostMapping(value = "/users/{userId}/wallet/withdraw",
                    consumes = "application/json",
                    produces = "application/json")
    public ResponseEntity<TransactionResponse>withdraw(@PathVariable("userId") Long userId,
            @Valid @RequestBody WithdrawRequest body,                         // { amountCents, refId? }
            @RequestHeader(value = "Idempotency-Key", required = false) String idemKey
    ){
         String key = (idemKey == null || idemKey.isBlank()) ? UUID.randomUUID().toString() : idemKey;
        TransactionResponse tx = walletService.debit( body.getAmountCents(), userId,  key, body.getRefId());
        return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .body(tx);
    }
    @PostMapping(value = "/users/{userId}/wallet/deposit",
        consumes = "application/json",
        produces = "application/json")
    public ResponseEntity<TransactionResponse> deposit(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody DepositRequest body,                         // { amountCents, refId? }
            @RequestHeader(value = "Idempotency-Key", required = false) String idemKey
    ) {
        String key = (idemKey == null || idemKey.isBlank()) ? UUID.randomUUID().toString() : idemKey;
        TransactionResponse tx = walletService.credit(userId, body.getAmountCents(),  key, body.getRefId());
        return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .body(tx);
    }
    public ResponseEntity<TransactionResponse[]>Transfer(
        @Valid @RequestBody TransferRequest body,
        @RequestHeader(value = "Idempotency-Key", required = false) String idemKey

    ){
        String key = (idemKey == null || idemKey.isBlank()) ? UUID.randomUUID().toString() : idemKey;
        TransactionResponse tx1 = walletService.credit(body.getToWalletId(),body.getAmountCents(),idemKey,body.getRefId());
        TransactionResponse tx2 = walletService.debit(body.getAmountCents(),body.getToWalletId(),idemKey,body.getRefId());
        TransactionResponse[] arr = {tx1,tx2};
        return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .body(arr);

    }
    @PostMapping(
    value = "/users/{fromUserId}/wallet/transfer/{toUserId}",
    consumes = "application/json",
    produces = "application/json"
)
public ResponseEntity<TransferResponse> transfer(
        @PathVariable("fromUserId") Long fromUserId,
        @PathVariable("toUserId") Long toUserId,
        @Valid @RequestBody TransferRequest body,        // expects: toUserId, amountCents>=1, refId?
        @RequestHeader(value = "Idempotency-Key", required = false) String idemKey
) {
    // Normalize/generate idempotency key (or 400 if your policy requires it)
    String key = (idemKey == null || idemKey.isBlank()) ? UUID.randomUUID().toString() : idemKey;

    // Delegate to atomic service method
    TransferResponse resp = walletService.transfer(
            fromUserId,
            toUserId,       // <-- make sure TransferRequest has toUserId (not toWalletId)
            body.getAmountCents(),
            body.getRefId(),
            key
    );

    // Expose a canonical URL for the created transfer (optional but nice)
    URI location = URI.create(String.format("/api/v1/transfers/%s", resp.getTransferId()));

    return ResponseEntity.created(location)
            .header("Cache-Control", "no-store")
            .header("Idempotency-Key", key)
            .body(resp);
}





}
