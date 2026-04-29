package es.cryptobit.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortfolioResponse {
    private Double totalBalanceEur;
    private List<AssetDetail> assets;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AssetDetail {
        private String symbol;
        private String name;
        private Double cryptoAmount;
        private Double valueEur;
        private String change24h;
    }
}