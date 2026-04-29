package es.cryptobit.repository;

import es.cryptobit.model.Favorite; // Importante añadir el import
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends MongoRepository<Favorite, String> {
    List<Favorite> findByClientId(String clientId);
    Optional<Favorite> findByClientIdAndCrypto(String clientId, String crypto);
}