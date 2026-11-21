package com.betting.backend.wallet.Controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.betting.backend.auth.ratelimit.FinancialRateLimiter;
import com.betting.backend.audit.AuditService;
import com.betting.backend.config.PageResponse;
import com.betting.backend.user.User;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.dto.*;
import com.betting.backend.wallet.model.FundRequestStatus;

@RestController
@RequestMapping("/api/v1")
@Validated
public class FundRequestAdminController{
    private final FundRequestServiceImpl fundrequestservice;
    private final FinancialRateLimiter rateLimiter;
    private final AuditService auditService;
    public FundRequestAdminController(FundRequestServiceImpl fundrequestservice,
                                      FundRequestRepository repo,
                                      FinancialRateLimiter rateLimiter,
                                      AuditService auditService)
    {
        this.fundrequestservice=fundrequestservice;
        this.rateLimiter=rateLimiter;
        this.auditService=auditService;

    }
@GetMapping("/admin/fund-requests")
public ResponseEntity<PageResponse<FundRequestResponse>> listFundRequests(
    @RequestParam(value = "status", required = false) FundRequestStatus status,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
){
    var response = fundrequestservice.adminList(status, pageRequest(page, size));
    return ResponseEntity.status(HttpStatus.ACCEPTED)
    .header("Cache-Control", "no-store").body(PageResponse.from(response));


}
@GetMapping("/admin/users/{userId}/fund-requests/")
public ResponseEntity<PageResponse<FundRequestResponse>> listFundRequestsByUser(
@PathVariable("userId") Long pathUserId,
@RequestParam(defaultValue = "0") int page,
@RequestParam(defaultValue = "20") int size

    ){
        var list = fundrequestservice.listFundRequests(pathUserId, pageRequest(page, size));
        return ResponseEntity
            .ok()
            .header("Cache-Control", "no-store")
            .body(PageResponse.from(list));

    }
/*
@GetMapping("admin/fund-requests/{requestId}")
public ResponseEntity<FundRequestResponse>findFundRequestsById(
@PathVariable("Id") Long requestId
    ){



    }

*/
@PutMapping("/admin/fund-requests/{requestId}/approve")
public ResponseEntity <FundRequestResponse> approveRequest(
    @PathVariable("requestId") Long requestId,
    @AuthenticationPrincipal User admin
){
    if (requestId==null){
        throw new IllegalArgumentException("requestId cannot be null");
    }
    Long adminUserId = admin.getId();
    rateLimiter.checkAdminFinancial(adminUserId);

    FundRequestResponse response = fundrequestservice.approveRequest(requestId, adminUserId);
    auditService.success(adminUserId, "FUND_REQUEST_APPROVE", "FUND_REQUEST", requestId.toString());
    return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(response);
}

@PutMapping("/admin/fund-requests/{requestId}/reject")
public ResponseEntity<FundRequestResponse> rejectRequest(
            @PathVariable("requestId") Long requestId,
            @AuthenticationPrincipal User admin
    ) {
        if (requestId == null) {
            throw new IllegalArgumentException("requestId cannot be null");
        }
        Long adminUserId = admin.getId();
        rateLimiter.checkAdminFinancial(adminUserId);

        FundRequestResponse response = fundrequestservice.denyRequest(requestId, adminUserId);
        auditService.success(adminUserId, "FUND_REQUEST_REJECT", "FUND_REQUEST", requestId.toString());
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(response);
    }

private PageRequest pageRequest(int page, int size) {
    return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
            Sort.by(Sort.Direction.DESC, "createdAt"));
}

}