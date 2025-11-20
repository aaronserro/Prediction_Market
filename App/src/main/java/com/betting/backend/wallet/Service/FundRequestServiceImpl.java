package com.betting.backend.wallet.Service;

import java.util.List;

import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;
import com.betting.backend.wallet.model.FundRequestStatus;

public class FundRequestServiceImpl implements FundRequestService{
    public FundRequestResponse createFundRequest(
        Long userId, FundRequestCreateRequest request){

    }
    public List<FundRequestResponse> listFundRequests(Long userId){}
    public List<FundRequestResponse> adminList(FundRequestStatus status){}
    public FundRequestResponse approveRequest(Long requestId, Long adminUserId){}





}
