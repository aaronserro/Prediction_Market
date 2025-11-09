package com.betting.backend.wallet.Repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.betting.backend.wallet.model.Wallet;
import com.betting.backend.user.User;
@Repository
public interface WalletRepository extends JpaRepository<Wallet, Long>{
    Optional<Wallet> findByUser(User user);
    Optional<Wallet> findByUser_Id(Long userId);
    boolean existsByUser_Id(Long userId);








}
