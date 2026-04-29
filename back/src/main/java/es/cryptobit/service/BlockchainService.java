package es.cryptobit.service;

import es.cryptobit.model.PortfolioResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.utils.Convert;
import org.web3j.crypto.Credentials;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.tx.Transfer;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class BlockchainService {

    @Autowired
    private Web3j web3j;

    private final RestTemplate restTemplate = new RestTemplate();

    public PortfolioResponse getCompletePortfolio(String address) throws Exception {
        // 1. Consultar saldo real de ETH
        var ethBalanceWei = web3j.ethGetBalance(address, DefaultBlockParameterName.LATEST).send().getBalance();
        Double ethAmount = Convert.fromWei(ethBalanceWei.toString(), Convert.Unit.ETHER).doubleValue();

        // 2. Consultar precios en CoinGecko
        String url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=eur&include_24hr_change=true";

        // Usamos un bloque try-catch interno para la API externa
        Map<String, Map<String, Object>> prices;
        try {
            prices = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            System.err.println("CoinGecko API caída, usando precios por defecto.");
            prices = null;
        }

        List<PortfolioResponse.AssetDetail> assets = new ArrayList<>();

        // --- PROCESAR ETHEREUM ---
        Double ethPrice = getSafeDouble(prices, "ethereum", "eur", 2500.0);
        Double ethChange = getSafeDouble(prices, "ethereum", "eur_24h_change", 0.0);
        assets.add(new PortfolioResponse.AssetDetail("ETH", "Ethereum", ethAmount, ethAmount * ethPrice, formatChange(ethChange)));



        // 3. Sumar todo para el total
        Double totalEur = assets.stream().mapToDouble(PortfolioResponse.AssetDetail::getValueEur).sum();

        return new PortfolioResponse(totalEur, assets);
    }

    // MÉTODO MAGICO: Extrae el número sin que el programa explote por el tipo de dato
    private Double getSafeDouble(Map<String, Map<String, Object>> prices, String crypto, String field, Double defaultValue) {
        try {
            if (prices != null && prices.get(crypto) != null) {
                Object value = prices.get(crypto).get(field);
                if (value instanceof Number) {
                    return ((Number) value).doubleValue();
                }
            }
        } catch (Exception e) {
            return defaultValue;
        }
        return defaultValue;
    }

    private String formatChange(Double change) {
        return (change >= 0 ? "+" : "") + String.format("%.2f", change) + "%";
    }

    //PERMITE HACER TRANSFERENCIAS DE SALDO ENTRE BILLETERAS
    public boolean executeTransfer(String privateKey, String receiverAddress, Double amount) {
        try {
            // 1. Limpiar el prefijo 0x si existe
            String cleanPrivateKey = privateKey.startsWith("0x") ? privateKey.substring(2) : privateKey;
            Credentials credentials = Credentials.create(cleanPrivateKey);

            // LOG DE CONTROL: Verifica en la consola si esta dirección es 0x11a532...
            System.out.println("DEBUG: Back enviando desde -> " + credentials.getAddress());

            // 2. Ejecutar la transferencia
            // Usamos una versión un poco más robusta de sendFunds
            TransactionReceipt receipt = Transfer.sendFunds(
                    web3j,
                    credentials,
                    receiverAddress,
                    BigDecimal.valueOf(amount),
                    Convert.Unit.ETHER
            ).send();

            return receipt.isStatusOK();
        } catch (Exception e) {
            // Este print te dirá si el error es de "Nonce", "Gas" o "Balance"
            System.err.println("Error detallado en blockchain: " + e.getMessage());
            return false;
        }
    }
}