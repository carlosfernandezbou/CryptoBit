package es.cryptobit.repository;

import es.cryptobit.model.Settings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SettingsRepository extends MongoRepository<Settings, String> {
    Optional<Settings> findByUserId(String userId);
    void deleteByUserId(String userId);
}