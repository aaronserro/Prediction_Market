package com.betting.backend.wallet.dto;
import java.time.Instant;
public class Walletdto {
    private long amountCents;
    private Instant lastUpdated;

    public Walletdto() {

    }

    public Walletdto(long amountCents) {
        this.amountCents = amountCents;
    }

    public long getAmountCents() {
        return amountCents;
    }

    public void setAmountCents(long amountCents) {
        this.amountCents = amountCents;
    }
    public String getFormattedAmount(){
        return String.format("$%.2f",amountCents/100);
    }

}
