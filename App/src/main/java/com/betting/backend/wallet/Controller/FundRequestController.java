package com.betting.backend.wallet.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.audit.AuditService;
import com.betting.backend.config.PageResponse;
import com.betting.backend.security.IdempotencyKeyFactory;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
@Validated
public class FundRequestController {
    private final FundRequestServiceImpl fundRequestService;
    private final FinancialRateLimiter rateLimiter;
    private final IdempotencyKeyFactory idempotencyKeys;
    private final AuditService auditService;
    public FundRequestController(FundRequestServiceImpl fundRequestService,
                                 FinancialRateLimiter rateLimiter,
                                 IdempotencyKeyFactory idempotencyKeys,
                                 AuditService auditService){
        this.fundRequestService=fundRequestService;
        this.rateLimiter=rateLimiter;
        this.idempotencyKeys=idempotencyKeys;
        this.auditService=auditService;
    }
    @PostMapping("/users/{userId}/wallet/fund-requests")
    public ResponseEntity<FundRequestResponse> createFundRequest(
        @PathVariable("userId") Long pathUserid,
        @Valid @RequestBody FundRequestCreateRequest body,
        @RequestHeader("Idempotency-Key") String clientKey,
        @AuthenticationPrincipal(expression= "id") Long authUserId
    ){
        if(authUserId==null||!authUserId.equals(pathUserid)){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "you cannot create a fund request for another user");
        }
        rateLimiter.checkFundRequest(authUserId);
        String key = idempotencyKeys.requireAndScope("fund-request", authUserId, clientKey);
        FundRequestResponse dto = fundRequestService.createFundRequest(pathUserid, body, key);
        auditService.success(authUserId, "FUND_REQUEST_CREATE", "FUND_REQUEST",
            dto.getId() != null ? dto.getId().toString() : null);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header("Cache-Control","no-store")
                .header("Idempotency-Key", clientKey.trim())
                .body(dto);


    }
    @GetMapping("/users/{userId}/wallet/fund-requests")
    public ResponseEntity<PageResponse<FundRequestResponse>> listFundRequests(
        @PathVariable("userId") Long pathUserId,
        @AuthenticationPrincipal(expression="id") Long authUserId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ){
        if(authUserId==null||!authUserId.equals(pathUserId)){
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You cannot view fund requests for another user"

            );
        }
        var list = fundRequestService.listFundRequests(pathUserId,
            PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity
            .ok()
            .header("Cache-Control", "no-store")
            .body(PageResponse.from(list));

    }




}
