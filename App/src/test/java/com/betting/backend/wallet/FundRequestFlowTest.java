// src/test/java/com/betting/backend/wallet/FundRequestFlowTest.java

package com.betting.backend.wallet;

import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.transaction.annotation.Transactional;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Service.FundRequestService;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
import com.betting.backend.wallet.model.Wallet;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional // each test rolls back DB changes after completion
class FundRequestFlowTest {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private FundRequestRepository fundRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FundRequestService fundRequestService; // whatever service handles approval

    @Test
    void approvingFundRequest_shouldIncreaseUserWalletBalance() {
        // 1) Arrange: create user + wallet with 0 balance
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword123");  // Set required password
        user.setUsername("testuser");           // Set required username
        user = userRepository.save(user);

        Wallet wallet = new Wallet(user);
        wallet.setUser(user);
        wallet.setBalanceCents(0);
        wallet = walletRepository.save(wallet);

        // 2) Create a fund request for, say, 5000 cents
        FundRequest request = new FundRequest(wallet, 5000L,"test reason");
        request.setStatus(FundRequestStatus.PENDING);
        request = fundRequestRepository.save(request);

        // 3) Act: admin approves the request via your service
        fundRequestService.approveRequest(request.getId(), /*adminUser*/ 2L);

        // 4) Assert: wallet is updated
        Wallet updatedWallet = walletRepository.findByUser_Id(user.getId())
                .orElseThrow();

        assertThat(updatedWallet.getBalanceCents()).isEqualTo(5000);
    }
}
