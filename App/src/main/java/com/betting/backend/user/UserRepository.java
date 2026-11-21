// com.betting.backend.user.UserRepository.java
package com.betting.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);
  Optional<User> findByUsernameIgnoreCase(String username);
  boolean existsByUsername(String username);
  Optional<User> findByIdAndAccountEnabledTrue(Long id);
  boolean existsByUsernameIgnoreCase(String username);
  boolean existsByEmailIgnoreCase(String email);
  @Query("select distinct trade.user from Trade trade where trade.marketId = :marketId")
  Page<User> findDistinctByTradedMarket(@Param("marketId") UUID marketId, Pageable pageable);
}
