package com.betting.backend.positions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.Principal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.PricingService;
import com.betting.backend.user.User;
import com.betting.backend.user.UserRepository;

class PositionControllerTest {

    private PositionRepository positionRepository;
    private UserRepository userRepository;
    private PositionController controller;

    @BeforeEach
    void setUp() {
        positionRepository = mock(PositionRepository.class);
        userRepository = mock(UserRepository.class);
        controller = new PositionController(positionRepository, userRepository,
                mock(PricingService.class), mock(MarketRepository.class));

        User user = new User();
        user.setId(42L);
        user.setUsername("trader");
        when(userRepository.findByUsername("trader")).thenReturn(Optional.of(user));
        when(positionRepository.findAllByUser_IdWithMarket(eq(42L), any(Pageable.class)))
                .thenReturn(Page.empty());
    }

    @Test
    void authenticatedPositionReadIsNoStoreAndUsesBoundedPagination() {
        Principal principal = () -> "trader";

        var response = controller.getMyPositions(principal, -4, 500);

        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().items()).isEmpty();

        ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
        verify(positionRepository).findAllByUser_IdWithMarket(eq(42L), pageable.capture());
        assertThat(pageable.getValue().getPageNumber()).isZero();
        assertThat(pageable.getValue().getPageSize()).isEqualTo(100);
        assertThat(pageable.getValue().getSort().getOrderFor("createdAt")).isNotNull();
    }
}
