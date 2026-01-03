package com.betting.backend.trades;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.betting.backend.markets.MarketRepository;
import com.betting.backend.markets.OutcomeRepository;
import com.betting.backend.wallet.Repository.WalletRepository;
@ExtendWith(MockitoExtension.class)
public class TradeServiceTest {
    @Mock WalletRepository walletRepository;
    @Mock TradeRepo tradeRepository;
    //@Mock PositionRepository positionRepository;
    @Mock OutcomeRepository outcomeRepository;
    @Mock MarketRepository marketRepository;
    //@Mock PricingService pricingService;


}
