package es.cryptobit.controller;

import es.cryptobit.model.User;
import es.cryptobit.repository.SettingsRepository;
import es.cryptobit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SettingsRepository settingsRepository;


    // http://localhost:8080/API/NewUser
    @PostMapping("/API/NewUser")
    public ResponseEntity<Object> registrarUsuario(@RequestBody User newUser) {
        try {
            if (userRepository.findByEmail(newUser.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("El email ya existe");
            }

            if (newUser.getUserImage() == null || newUser.getUserImage().isBlank()) {
                newUser.setUserImage("default-avatar.png");
            }

            User savedUser = userRepository.save(newUser);
            System.out.println("EXITO: Usuario con wallet " + savedUser.getWalletAddress() + " guardado.");
            return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);

        } catch (Exception e) {
            System.out.println("ERROR NewUser: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // http://localhost:8080/API/SeeUsers
    @GetMapping("/API/SeeUsers")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // http://localhost:8080/API/User/{id}
    @GetMapping("/API/User/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }
            return ResponseEntity.ok(userOpt.get());
        } catch (Exception e) {
            System.out.println("ERROR GET USER: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error obteniendo usuario");
        }
    }

    // http://localhost:8080/API/UserIdByEmail?email=...
    @GetMapping("/API/UserIdByEmail")
    public ResponseEntity<?> getUserIdByEmail(@RequestParam String email) {
        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }
            return ResponseEntity.ok(Map.of("id", userOpt.get().getId()));
        } catch (Exception e) {
            System.out.println("ERROR UserIdByEmail: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error obteniendo ID");
        }
    }

    //http://localhost:8080/API/Login
    @PostMapping("/API/Login")
    public ResponseEntity<String> login(@RequestBody User loginUser) {
        try {
            if (loginUser.getEmail() == null || loginUser.getPassword() == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Faltan campos (email/password)");
            }

            Optional<User> userOpt = userRepository.findByEmail(loginUser.getEmail());

            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("usuario/contraseña no encontrados");
            }

            User userDB = userOpt.get();

            String incomingHash = loginUser.getPassword().trim();
            String dbHash = userDB.getPassword().trim();

            if (!incomingHash.equalsIgnoreCase(dbHash)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("usuario/contraseña no encontrados");
            }

            System.out.println("Login correcto: " + loginUser.getEmail());
            return ResponseEntity.ok("Login correcto");

        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Error en login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error en login");
        }
    }

    // compatibilidad: /EditUser/{id} (tuyo) y /API/EditUser/{id}
    @PutMapping({"/EditUser/{id}", "/API/EditUser/{id}"})
    public ResponseEntity<Object> updateUser(@PathVariable String id, @RequestBody User updatedUser) {
        try {
            Optional<User> optionalUser = userRepository.findById(id);
            if (optionalUser.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }

            User existingUser = optionalUser.get();

            existingUser.setFirstName(updatedUser.getFirstName());
            existingUser.setLastName(updatedUser.getLastName());
            existingUser.setDni(updatedUser.getDni());
            existingUser.setEmail(updatedUser.getEmail());
            existingUser.setPassword(updatedUser.getPassword());
            existingUser.setBirthDateFormatted(updatedUser.getBirthDateFormatted());

            if (updatedUser.getUserImage() != null && !updatedUser.getUserImage().isBlank()) {
                existingUser.setUserImage(updatedUser.getUserImage());
            }

            existingUser.setFavoriteId(updatedUser.getFavoriteId());
            userRepository.save(existingUser);

            return ResponseEntity.ok(existingUser);

        } catch (Exception e) {
            System.out.println("ERROR AL ACTUALIZAR: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al actualizar usuario");
        }
    }

    // DELETE -> compatibilidad: /DeleteUser/{id} (tu front) y /API/DeleteUser/{id}
    @DeleteMapping({"/DeleteUser/{id}", "/API/DeleteUser/{id}"})
    public ResponseEntity<Object> deleteUser(@PathVariable String id) {
        try {
            String cleanId = (id == null) ? null : id.trim();
            if (cleanId == null || cleanId.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("ID inválido");
            }

            if (!userRepository.existsById(cleanId)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
            }

            // ✅ borrar settings asociados (si existen)
            // si tienes findByUserId, normalmente también tendrás deleteByUserId
            // si NO existe, te digo abajo cómo añadirlo
            settingsRepository.deleteByUserId(cleanId);

            // ✅ borrar usuario
            userRepository.deleteById(cleanId);

            return ResponseEntity.ok("Usuario eliminado correctamente");

        } catch (Exception e) {
            System.out.println("ERROR AL BORRAR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al borrar usuario");
        }
    }

}
