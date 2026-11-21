package com.betting.backend.wallet;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;
import com.betting.backend.wallet.Repository.FundRequestRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
import com.betting.backend.wallet.Service.FundRequestService;
import com.betting.backend.wallet.model.FundRequest;
import com.betting.backend.wallet.model.FundRequestStatus;
import com.betting.backend.wallet.model.Wallet;

@SpringBootTest
@Transactional
class FundRequestFlowIT {

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private FundRequestRepository fundRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FundRequestService fundRequestService;

    @Test
    void approvingFundRequestShouldIncreaseUserWalletBalance() {
        User user = new User();
        user.setEmail("test@example.com");
        user.setPasswordHash("hashedPassword123");
        user.setUsername("testuser");
        user = userRepository.save(user);

        Wallet wallet = new Wallet(user);
        wallet.setUser(user);
        wallet.setBalanceCents(0);
        wallet = walletRepository.save(wallet);

        FundRequest request = new FundRequest(wallet, 5000L, "test reason");
        request.setStatus(FundRequestStatus.PENDING);
        request = fundRequestRepository.save(request);

        fundRequestService.approveRequest(request.getId(), 2L);

        Wallet updatedWallet = walletRepository.findByUser_Id(user.getId())
                .orElseThrow();
        assertThat(updatedWallet.getBalanceCents()).isEqualTo(5000);
    }
}
