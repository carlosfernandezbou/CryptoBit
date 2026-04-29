package es.cryptobit.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

//Le dice a Spring como conectarse a la Blockchain de pruebas
@Configuration
public class Web3jConfig {

    @Value("${blockchain.node.url}")
    private String nodeUrl;

    @Bean
    public Web3j web3j() {
        return Web3j.build(new HttpService(nodeUrl));
    }
}