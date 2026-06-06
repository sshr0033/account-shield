package com.example.account_shield.alert;

public enum AlertType {
    BRUTE_FORCE,        // many failed attempts on one account
    CREDENTIAL_STUFFING // one IP failing across many accounts
}
