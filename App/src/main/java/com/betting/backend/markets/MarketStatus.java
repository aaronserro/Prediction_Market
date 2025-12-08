package com.betting.backend.markets;

public enum MarketStatus {
    UPCOMING,   // startDate > now
    ACTIVE,     // startDate <= now <= endDate
    CLOSED,     // endDate < now, awaiting resolution
    RESOLVED    // final outcome has been declared
}

