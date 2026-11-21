package com.betting.backend.wallet.Controller;

import java.net.URI;
import java.util.List;
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
import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.audit.AuditService;
import com.betting.backend.security.IdempotencyKeyFactory;
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
    private final FinancialRateLimiter rateLimiter;
    private final IdempotencyKeyFactory idempotencyKeys;
    private final AuditService auditService;

    public WalletController(WalletService walletService,
                            WalletTransactionService walletTransactionService,
                            FinancialRateLimiter rateLimiter,
                            IdempotencyKeyFactory idempotencyKeys,
                            AuditService auditService) {
        this.walletService = walletService;
        this.walletTransactionService = walletTransactionService;
        this.rateLimiter = rateLimiter;
        this.idempotencyKeys = idempotencyKeys;
        this.auditService = auditService;
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
            @RequestHeader("Idempotency-Key") String clientKey,
            @AuthenticationPrincipal User currentUser
    ){
        requireOwner(currentUser, userId);
        rateLimiter.checkWithdraw(currentUser.getId());
        String key = idempotencyKeys.requireAndScope(
            "wallet-withdraw", currentUser.getId(), clientKey);
        TransactionResponse tx = walletService.debit( body.getAmountCents(), userId,  key, body.getRefId());
        auditService.success(currentUser.getId(), "WALLET_WITHDRAW", "USER", userId.toString());
        tx.setIdempotencyKey(clientKey.trim());
        return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .header("Idempotency-Key", clientKey.trim())
        .body(tx);
    }
    @PostMapping(value = "/users/{userId}/wallet/deposit",
        consumes = "application/json",
        produces = "application/json")
    public ResponseEntity<TransactionResponse> deposit(
            @PathVariable("userId") Long userId,
            @Valid @RequestBody DepositRequest body,                         // { amountCents, refId? }
            @RequestHeader("Idempotency-Key") String clientKey,
            @AuthenticationPrincipal User admin
    ) {
        // Admin-only (enforced in SecurityConfig): users get funds via fund requests.
        rateLimiter.checkAdminFinancial(admin.getId());
        String key = idempotencyKeys.requireAndScope(
            "wallet-deposit", admin.getId(), clientKey);
        TransactionResponse tx = walletService.credit(body.getAmountCents(), userId, key, body.getRefId());
        auditService.success(admin.getId(), "WALLET_DEPOSIT", "USER", userId.toString());
        tx.setIdempotencyKey(clientKey.trim());
        return ResponseEntity.ok()
        .header("Cache-Control", "no-store")
        .header("Idempotency-Key", clientKey.trim())
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
        @RequestHeader("Idempotency-Key") String clientKey,
        @AuthenticationPrincipal User currentUser
) {
    // Only the sender can move money out of their own wallet
    requireOwner(currentUser, fromUserId);
    rateLimiter.checkTransfer(currentUser.getId());

        String key = idempotencyKeys.requireAndScope(
            "wallet-transfer", currentUser.getId(), clientKey);

    // Delegate to atomic service method
    TransferResponse resp = walletService.transfer(
            fromUserId,
            toUserId,       // <-- make sure TransferRequest has toUserId (not toWalletId)
            body.getAmountCents(),
            body.getRefId(),
            key
    );
    auditService.success(currentUser.getId(), "WALLET_TRANSFER", "USER", toUserId.toString());
    resp.setIdempotencyKey(clientKey.trim());

    // Expose a canonical URL for the created transfer (optional but nice)
    URI location = URI.create(String.format("/api/v1/transfers/%s", resp.getTransferId()));

    return ResponseEntity.created(location)
            .header("Cache-Control", "no-store")
            .header("Idempotency-Key", clientKey.trim())
            .body(resp);
}





}
