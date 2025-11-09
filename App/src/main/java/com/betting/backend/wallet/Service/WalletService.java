package com.betting.backend.wallet.Service;
import org.springframework.stereotype.Service;

import com.betting.backend.wallet.dto.TransactionResponse;
import com.betting.backend.wallet.dto.TransferResponse;
import com.betting.backend.wallet.dto.WalletResponse;
@Service
public interface WalletService {
    public WalletResponse getbalance(Long userid);
    public TransactionResponse credit(Long amountCents, Long userid, String IDEkey, String refid);
    public TransactionResponse debit(Long amountCents, Long userid, String IDEkey, String refid);
}
