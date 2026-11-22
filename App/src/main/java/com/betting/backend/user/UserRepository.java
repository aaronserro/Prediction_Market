// com.betting.backend.user.UserRepository.java
package com.betting.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByUsername(String username);
  Optional<User> findByUsernameIgnoreCase(String username);
  boolean existsByUsername(String username);
  Optional<User> findByIdAndAccountEnabledTrue(Long id);
  boolean existsByUsernameIgnoreCase(String username);
  boolean existsByEmailIgnoreCase(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select user from User user where user.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select user
            from User user join user.roles role
            where user.accountEnabled = true and role = 'ROLE_ADMIN'
            order by user.id
            """)
    List<User> findEnabledAdministratorsForUpdate();

  @Query(
      value = """
          select distinct trade.user
          from Trade trade
          where trade.market.id = :marketId
          """,
      countQuery = """
          select count(distinct trade.user.id)
          from Trade trade
          where trade.market.id = :marketId
          """
  )
  Page<User> findDistinctByTradedMarket(
      @Param("marketId") UUID marketId,
      Pageable pageable
  );
}
