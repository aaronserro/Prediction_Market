package com.betting.backend.wallet.Controller;

import java.net.URI;
import java.security.Principal;
import java.util.List;
import java.util.UUID;

import org.apache.catalina.connector.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.Service.WalletService;
import com.betting.backend.wallet.Service.WalletServiceImpl;
import com.betting.backend.wallet.dto.*;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;

@RestController
@RequestMapping("/api/v1")
@Validated
public class FundRequestAdminController{
    private final FundRequestServiceImpl fundrequestservice;
    public FundRequestAdminController(FundRequestServiceImpl fundrequestservice, FundRequestRepository repo)
    {
        this.fundrequestservice=fundrequestservice;

    }
@GetMapping("admin/fund-requests")
public ResponseEntity<List<FundRequestResponse>> listFundRequests(
    @PathVariable("status") FundRequestStatus status
){
    List<FundRequestResponse> response = fundrequestservice.adminList(status);
    return ResponseEntity.status(HttpStatus.ACCEPTED)
    .header("Cache-Control", "no-store").body(response);


}
@GetMapping("admin/users/{userId}/fund-requests/")
public ResponseEntity<List<FundRequestResponse>> listFundRequestsByUser(
@PathVariable("userId") Long pathUserId

    ){
        List<FundRequestResponse> list = fundrequestservice.listFundRequests(pathUserId);
        return ResponseEntity
            .ok()
            .header("Cache-Control", "no-store")
            .body(list);

    }
/*
@GetMapping("admin/fund-requests/{requestId}")
public ResponseEntity<FundRequestResponse>findFundRequestsById(
@PathVariable("Id") Long requestId
    ){



    }

*/
@PostMapping("admin/find-requests/{requestId}/approve")
public ResponseEntity <FundRequestResponse> approveRequest(
    @PathVariable("requestId") Long requestId, Principal principal
){
    if (requestId==null){
        throw new IllegalArgumentException("requestId cannot be null");
    }
     Long adminUserId = null; // If you have admin id in Principal, derive it here.

    FundRequestResponse response = fundrequestservice.approveRequest(requestId, adminUserId);
    return ResponseEntity.ok(response);
}

@PostMapping("/fund-requests/{requestid}/deny")
public ResponseEntity<FundRequestResponse> denyRequest(
            @PathVariable("requestid") Long requestId,
            Principal principal
    ) {
        if (requestId == null) {
            throw new IllegalArgumentException("requestId cannot be null");
        }
        Long adminUserId = null; // derive from principal if needed

        FundRequestResponse response = fundrequestservice.denyRequest(requestId, adminUserId);
        return ResponseEntity.ok(response);
    }

}