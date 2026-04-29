package es.cryptobit.controller;

import es.cryptobit.model.Favorite;
import es.cryptobit.repository.FavoriteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/API")
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

    // http://localhost:8080/API/NewFavorite
    @PostMapping("/NewFavorite")
    public ResponseEntity<Object> newFavorite(@RequestBody Favorite newFavorite) {
        try {
            favoriteRepository.save(newFavorite);
            return ResponseEntity.status(HttpStatus.CREATED).body(newFavorite);
        } catch (Exception e) {
            System.out.println("ERROR AL GUARDAR FAVORITE: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al guardar favorito");
        }
    }

    // http://localhost:8080/API/SeeFavorites
    @GetMapping("/SeeFavorites")
    public ResponseEntity<List<Favorite>> seeFavorites() {
        try {
            return ResponseEntity.ok(favoriteRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // http://localhost:8080/API/EditFavorite/{id}
    @PutMapping("/EditFavorite/{id}")
    public ResponseEntity<Object> editFavorite(@PathVariable String id, @RequestBody Favorite updatedFavorite) {
        try {
            Optional<Favorite> optionalFavorite = favoriteRepository.findById(id);

            if (optionalFavorite.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Favorito no encontrado");
            }

            Favorite existingFavorite = optionalFavorite.get();

            existingFavorite.setClientId(updatedFavorite.getClientId());
            existingFavorite.setCrypto(updatedFavorite.getCrypto());

            favoriteRepository.save(existingFavorite);
            return ResponseEntity.ok(existingFavorite);

        } catch (Exception e) {
            System.out.println("ERROR AL ACTUALIZAR FAVORITE: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al actualizar favorito");
        }
    }

    // http://localhost:8080/API/DeleteFavorite/{id}
    @DeleteMapping("/DeleteFavorite/{id}")
    public ResponseEntity<Object> deleteFavorite(@PathVariable String id) {
        try {
            if (!favoriteRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Favorito no encontrado");
            }

            favoriteRepository.deleteById(id);
            return ResponseEntity.ok("Favorito eliminado correctamente");

        } catch (Exception e) {
            System.out.println("ERROR AL BORRAR FAVORITE: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al borrar favorito");
        }
    }

    //ENDPOINS UTILIZADOS
    // 1. Ver favoritos de UN usuario concreto
    @GetMapping("/SeeFavorites/{clientId}")
    public ResponseEntity<List<Favorite>> seeFavoritesByUser(@PathVariable String clientId) {
        try {
            // Asumiendo que añades este método al Repository
            return ResponseEntity.ok(favoriteRepository.findByClientId(clientId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // 2. Eliminar
    @DeleteMapping("/RemoveFavorite")
    public ResponseEntity<Object> removeFavorite(@RequestParam String clientId, @RequestParam String crypto) {
        try {
            Optional<Favorite> fav = favoriteRepository.findByClientIdAndCrypto(clientId, crypto);
            if (fav.isPresent()) {
                favoriteRepository.delete(fav.get());
                return ResponseEntity.ok("Eliminado");
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("No encontrado");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
