package es.cryptobit.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

//NO SE UTILIZA, INTENTAR IMPLEMENTARLO MAS ADELANTE
@Document(collection = "transactions")
public class TransactionRecord {
    @Id
    private String id;
    private String userEmail;
    private String type;           // "SEND", "RECEIVE", "BUY", "SELL"
    private String status;         // "COMPLETED", "PENDING", "FAILED"

    // Datos de la Moneda
    private String symbol;         // "ETH", "USDT", "BTC"
    private String network;        // "Sepolia", "Mainnet"

    // Datos de la Operación (Crypto)
    private Double cryptoAmount;   // Cantidad de monedas (ej: 0.168)
    private String txHash;         // El ID único de la transacción en la Blockchain

    // Datos Financieros
    private Double fiatValueAtTime; // Precio de 1 ETH en ese momento (ej: 2500.50€)
    private Double totalFiatAmount; // cryptoAmount * fiatValueAtTime (ej: 420.08€)
    private String currency;       // "EUR", "USD"

    // Direcciones involucradas
    private String fromAddress;    // Quién envía
    private String toAddress;      // Quién recibe

    private LocalDateTime timestamp;

    public TransactionRecord() {}

    public TransactionRecord(String userEmail, String type, String status, String symbol,
                             String network, Double cryptoAmount, String txHash,
                             Double fiatValueAtTime, Double totalFiatAmount,
                             String currency, String fromAddress, String toAddress) {
        this.userEmail = userEmail;
        this.type = type;
        this.status = status;
        this.symbol = symbol;
        this.network = network;
        this.cryptoAmount = cryptoAmount;
        this.txHash = txHash;
        this.fiatValueAtTime = fiatValueAtTime;
        this.totalFiatAmount = totalFiatAmount;
        this.currency = currency;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.timestamp = LocalDateTime.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getNetwork() {
        return network;
    }

    public void setNetwork(String network) {
        this.network = network;
    }

    public Double getCryptoAmount() {
        return cryptoAmount;
    }

    public void setCryptoAmount(Double cryptoAmount) {
        this.cryptoAmount = cryptoAmount;
    }

    public String getTxHash() {
        return txHash;
    }

    public void setTxHash(String txHash) {
        this.txHash = txHash;
    }

    public Double getTotalFiatAmount() {
        return totalFiatAmount;
    }

    public void setTotalFiatAmount(Double totalFiatAmount) {
        this.totalFiatAmount = totalFiatAmount;
    }

    public Double getFiatValueAtTime() {
        return fiatValueAtTime;
    }

    public void setFiatValueAtTime(Double fiatValueAtTime) {
        this.fiatValueAtTime = fiatValueAtTime;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getToAddress() {
        return toAddress;
    }

    public void setToAddress(String toAddress) {
        this.toAddress = toAddress;
    }

    public String getFromAddress() {
        return fromAddress;
    }

    public void setFromAddress(String fromAddress) {
        this.fromAddress = fromAddress;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}