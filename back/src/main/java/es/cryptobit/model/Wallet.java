package es.cryptobit.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "wallet")
public class Wallet {

    @Id
    private String id;
    private String clientId;
    private Double balance;
    private String accountNumber;
    private Double cryptoBalance;

    public Wallet() {
    }

    public Wallet(String clientId, Double balance, String accountNumber, Double cryptoBalance) {
        this.clientId = clientId;
        this.balance = balance;
        this.accountNumber = accountNumber;
        this.cryptoBalance = cryptoBalance;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public String getAccountNumber() {
        return accountNumber;
    }

    public void setAccountNumber(String accountNumber) {
        this.accountNumber = accountNumber;
    }

    public Double getCryptoBalance() {
        return cryptoBalance;
    }

    public void setCryptoBalance(Double cryptoBalance) {
        this.cryptoBalance = cryptoBalance;
    }
}