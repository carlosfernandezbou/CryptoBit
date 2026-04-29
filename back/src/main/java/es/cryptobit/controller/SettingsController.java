package es.cryptobit.controller;

import es.cryptobit.model.Settings;
import es.cryptobit.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/API")
public class SettingsController {

    @Autowired
    private SettingsRepository settingsRepository;

    // GET -> http://localhost:8080/API/Settings/{userId}
    @GetMapping("/Settings/{userId}")
    public ResponseEntity<?> getSettings(@PathVariable String userId) {
        try {
            Optional<Settings> settingsOpt = settingsRepository.findByUserId(userId);
            if (settingsOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Settings no encontrados");
            }
            return ResponseEntity.ok(settingsOpt.get());
        } catch (Exception e) {
            System.out.println("ERROR GET SETTINGS: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error obteniendo settings");
        }
    }

    // PUT (upsert) -> http://localhost:8080/API/EditSettings/{userId}
    @PutMapping("/EditSettings/{userId}")
    public ResponseEntity<?> editSettings(@PathVariable String userId, @RequestBody Settings newSettings) {
        try {
            Optional<Settings> existingOpt = settingsRepository.findByUserId(userId);

            Settings settings = existingOpt.orElseGet(() -> {
                Settings s = new Settings();
                s.setUserId(userId); // si userId es @Id, esto lo deja como _id
                return s;
            });

            settings.setTheme(newSettings.getTheme());
            settings.setLanguage(newSettings.getLanguage());
            settings.setCurrency(newSettings.getCurrency());
            settings.setFaceId(newSettings.getFaceId());

            Settings saved = settingsRepository.save(settings);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            System.out.println("ERROR PUT SETTINGS: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error actualizando settings");
        }
    }
}
