package com.example.account_shield.alert;

public enum AlertStatus {
    OPEN,           // unreviewed
    INVESTIGATING,  // being looked at
    RESOLVED,       // reviewed, safe/handled
    BLOCKED,        // analyst permanently blocked the source
    DISMISSED       // analyst dismissed (account suspended)
}
