package com.betting.backend.wallet.Controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.Service.WalletTransactionService;
import com.betting.backend.wallet.dto.*;

@RestController
@RequestMapping("/api/v1")
@Validated
public class WalletController {
    private static final int MAX_PAGE_SIZE = 100;

    private final WalletService walletService;
    private final WalletTransactionService walletTransactionService;

    public WalletController(WalletService walletService, WalletTransactionService walletTransactionService) {
        this.walletService = walletService;
        this.walletTransactionService = walletTransactionService;
    }

    public record TransactionPage(List<TransactionResponse> items, int page, int size,
                                  long totalElements, boolean hasNext) {}
    // Callers may only act on their own wallet; admins may read any wallet.
    private static void requireOwner(User currentUser, Long pathUserId) {
        if (currentUser == null || !currentUser.getId().equals(pathUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "You cannot access another user's wallet");
        }
    }

    private static void requireOwnerOrAdmin(User currentUser, Long pathUserId) {
        boolean isAdmin = currentUser != null && currentUser.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        if (!isAdmin) {
            requireOwner(currentUser, pathUserId);
        }
    }

    @GetMapping("/users/{userId}/wallet")
    public ResponseEntity<WalletResponse> getWallet(
            @PathVariable("userId") Long userId,
            @AuthenticationPrincipal User currentUser) {

        requireOwnerOrAdmin(currentUser, userId);
        WalletResponse wallet = walletService.getbalance(userId);

        return ResponseEntity.ok()
                .header("Cache-Control", "no-store")
                .body(wallet);
    }

    // Ledger history, newest first.
    @GetMapping("/users/{userId}/wallet/transactions")
    public ResponseEntity<TransactionPage> getTransactions(
            @PathVariable("userId") Long userId,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {

        requireOwnerOrAdmin(currentUser, userId);
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        Page<TransactionResponse> result =
                walletTransactionService.getRecentTransactions(userId, Math.max(page, 0), safeSize);

        return ResponseEntity.ok()
                .header("Cache-Control", "no-store")
                .body(new TransactionPage(result.getContent(), result.getNumber(), result.getSize(),
                        result.getTotalElements(), result.hasNext()));
    }
    @PostMapping(value = "/users/{userId}/wallet/withdraw",
                    consumes = "application/json",
                    produces = "application/json")
    public ResponseEntity<TransactionResponse>withdraw(@PathVariable("userId") Long userId,
            @Valid @RequestBody WithdrawRequest body,                         // { amountCents, refId? }
            @RequestHeader(value = "Idempotency-Key", required = false) String idemKey,
            @AuthenticationPrincipal User currentUser
    ){
        requireOwner(currentUser, userId);
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
        // Admin-only (enforced in SecurityConfig): users get funds via fund requests.
        String key = (idemKey == null || idemKey.isBlank()) ? UUID.randomUUID().toString() : idemKey;
        TransactionResponse tx = walletService.credit(body.getAmountCents(), userId, key, body.getRefId());
        return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .body(tx);
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
        @RequestHeader(value = "Idempotency-Key", required = false) String idemKey,
        @AuthenticationPrincipal User currentUser
) {
    // Only the sender can move money out of their own wallet
    requireOwner(currentUser, fromUserId);

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
