package com.betting.backend.wallet.Service;
import com.betting.backend.wallet.dto.FundRequestCreateRequest;
import com.betting.backend.wallet.dto.FundRequestResponse;
import com.betting.backend.user.User;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
import com.betting.backend.wallet.model.Wallet;

import java.util.List;
/**
 * Service layer responsible for the Fund Request lifecycle:
 * - Users can create requests and view their own history
 * - Admins can list all requests, approve them, or reject them
 */
public interface FundRequestService {

    /**
     * Creates a new fund request on behalf of the user.
     * The request is initialized with:
     *  - status = PENDING
     *  - createdAt = now
     * An email notification will be sent to the administrator.
     *
     * @param userId  ID of the user making the request
     * @param request DTO containing amount + reason
     * @return created fund request as a response DTO
     */
    FundRequestResponse createFundRequest(Long userId, FundRequestCreateRequest request);

    /**
     * Returns all fund requests belonging to a specific user.
     * Typically sorted by createdAt descending (newest first).
     *
     * @param userId user whose request history is being fetched
     * @return list of fund request responses for that user
     */
    List<FundRequestResponse> listFundRequests(Long userId);

    /**
     * Returns a list of fund requests for administrators.
     * When status is provided, filters by status.
     *
     * @param status optional status filter (PENDING, APPROVED, REJECTED)
     * @return list of fund request responses, filtered if needed
     */
    List<FundRequestResponse> adminList(FundRequestStatus status);

    /**
     * Approves a pending fund request.
     * This will:
     *  - mark the request as APPROVED
     *  - set processedAt
     *  - credit the user's wallet balance
     *
     * @param requestId   ID of the request to approve
     * @param adminUserId ID of the admin performing the action
     * @return updated fund request DTO
     */
    FundRequestResponse approveRequest(Long requestId, Long adminUserId);

    /**
     * Rejects a pending fund request.
     * This will:
     *  - mark the request as REJECTED
     *  - set processedAt
     * No wallet balance is changed.
     *
     * @param requestId   ID of the request to reject
     * @param adminUserId ID of the admin performing the action
     * @return updated fund request DTO
     */
    FundRequestResponse denyRequest(Long requestId, Long adminUserId);






}
