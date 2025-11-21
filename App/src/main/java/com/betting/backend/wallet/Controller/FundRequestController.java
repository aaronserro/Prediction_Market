package com.betting.backend.wallet.Controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.betting.backend.wallet.Service.FundRequestServiceImpl;
import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
@Validated
public class FundRequestController {
    private final FundRequestServiceImpl fundRequestService;
    public FundRequestController(FundRequestServiceImpl fundRequestService){
        this.fundRequestService=fundRequestService;
    }
    @PostMapping("/users/{userId}/wallet/fund-requests")
    public ResponseEntity<FundRequestResponse> createFundRequest(
        @PathVariable("userId") Long pathUserid,
        @Valid @RequestBody FundRequestCreateRequest body,
        @AuthenticationPrincipal(expression= "id") Long authUserId
    ){
        if(authUserId==null||!authUserId.equals(pathUserid)){
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "you cannot create a fund request for another user");
        }
        FundRequestResponse dto = fundRequestService.createFundRequest(pathUserid, body);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .header("Cache-Control","no-store")
                .body(dto);


    }
    @GetMapping("/users/{userId}/wallet/fund-requests")
    public ResponseEntity<List<FundRequestResponse>> listFundRequests(
        @PathVariable("userId") Long pathUserId,
        @AuthenticationPrincipal(expression="id") Long authUserId
    ){
        if(authUserId==null||!authUserId.equals(pathUserId)){
            throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                "You cannot view fund requests for another user"

            );
        }
        List<FundRequestResponse> list = fundRequestService.listFundRequests(pathUserId);
        return ResponseEntity
            .ok()
            .header("Cache-Control", "no-store")
            .body(list);

    }




}
