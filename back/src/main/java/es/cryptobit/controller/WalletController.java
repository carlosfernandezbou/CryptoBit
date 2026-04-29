package es.cryptobit.controller;

import es.cryptobit.model.Wallet;
import es.cryptobit.repository.WalletRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/API")
public class WalletController {

    @Autowired
    private WalletRepository walletRepository;

    // http://localhost:8080/API/NewWallet
    @PostMapping("/NewWallet")
    public ResponseEntity<Object> newWallet(@RequestBody Wallet newWallet) {
        try {
            walletRepository.save(newWallet);
            return ResponseEntity.status(HttpStatus.CREATED).body(newWallet);
        } catch (Exception e) {
            System.out.println("ERROR AL GUARDAR WALLET: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al guardar wallet");
        }
    }

    // http://localhost:8080/API/SeeWallets
    @GetMapping("/SeeWallets")
    public ResponseEntity<List<Wallet>> seeWallets() {
        try {
            return ResponseEntity.ok(walletRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // http://localhost:8080/API/EditWallet/{id}
    @PutMapping("/EditWallet/{id}")
    public ResponseEntity<Object> editWallet(@PathVariable String id, @RequestBody Wallet updatedWallet) {
        try {
            Optional<Wallet> optionalWallet = walletRepository.findById(id);

            if (optionalWallet.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Wallet no encontrada");
            }

            Wallet existingWallet = optionalWallet.get();

            existingWallet.setClientId(updatedWallet.getClientId());
            existingWallet.setBalance(updatedWallet.getBalance());
            existingWallet.setAccountNumber(updatedWallet.getAccountNumber());
            existingWallet.setCryptoBalance(updatedWallet.getCryptoBalance());

            walletRepository.save(existingWallet);
            return ResponseEntity.ok(existingWallet);

        } catch (Exception e) {
            System.out.println("ERROR AL ACTUALIZAR WALLET: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar wallet");
        }
    }

    // http://localhost:8080/API/DeleteWallet/{id}
    @DeleteMapping("/DeleteWallet/{id}")
    public ResponseEntity<Object> deleteWallet(@PathVariable String id) {
        try {
            if (!walletRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Wallet no encontrada");
            }

            walletRepository.deleteById(id);
            return ResponseEntity.ok("Wallet eliminada correctamente");

        } catch (Exception e) {
            System.out.println("ERROR AL BORRAR WALLET: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al borrar wallet");
        }
    }
}
