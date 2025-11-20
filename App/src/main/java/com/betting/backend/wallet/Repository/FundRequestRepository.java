package com.betting.backend.wallet.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
@Repository
public interface FundRequestRepository extends JpaRepository<FundRequest, Long> {

    /**
     * Returns all fund requests belonging to the wallet of a specific user,
     * ordered by creation time (newest first).
     */
    List<FundRequest> findByWallet_User_IdOrderByCreatedAtDesc(Long userId);

    /**
     * Returns all fund requests that match the given status (PENDING, APPROVED, REJECTED),
     * ordered by creation time (newest first). Useful for admin review screens.
     */
    List<FundRequest> findByStatusOrderByCreatedAtDesc(FundRequestStatus status);

    /**
     * OPTIONAL — Only add if you want user-level filtering + status.
     * Returns fund requests for a specific user with a particular status.
     */
        List<FundRequest> findByWallet_User_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            FundRequestStatus status
        );
}