package es.cryptobit.controller;

import es.cryptobit.model.PortfolioResponse;
import es.cryptobit.model.Transaction;
import es.cryptobit.repository.TransactionRepository;
import es.cryptobit.service.BlockchainService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*")
public class BlockchainController {

    @Autowired
    private BlockchainService blockchainService;

    @Autowired
    private TransactionRepository transactionRepository;

    //Cargar cryptos del usuario, muestra en el front las cryptos de cada uno
    @GetMapping("/portfolio/{address}")
    public ResponseEntity<PortfolioResponse> getPortfolio(@PathVariable String address) {
        try {
            PortfolioResponse response = blockchainService.getCompletePortfolio(address);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    //Realizar una nueva transferencia
    @PostMapping("/Transfer")
    public ResponseEntity<Object> makeTransfer(@RequestBody Transaction transaction) {
        try {
            // Ejecutamos la transferencia REAL en la blockchain usando la clave enviada
            boolean success = blockchainService.executeTransfer(
                    transaction.getPrivateKey(),
                    transaction.getReceiverId(),
                    transaction.getAmount()
            );

            if (success) {
                transaction.setType("TRANSFER");
                // Guardamos el registro en MongoDB
                transaction.setPrivateKey(null);
                Transaction savedTx = transactionRepository.save(transaction);
                return ResponseEntity.status(HttpStatus.CREATED).body(savedTx);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: Fondos insuficientes o clave incorrecta");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error técnico");
        }
    }

    //Ver historial de un usuario (Enviados y Recibidos)
    @GetMapping("/MyTransactions/{userId}")
    public ResponseEntity<List<Transaction>> getMyTransactions(@PathVariable String userId) {
        try {
            List<Transaction> sent = transactionRepository.findBySenderId(userId);
            List<Transaction> received = transactionRepository.findByReceiverId(userId);

            List<Transaction> all = new ArrayList<>();
            all.addAll(sent);
            all.addAll(received);

            // Ordenar por fecha (opcional aquí o en el front)
            return ResponseEntity.ok(all);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}