package es.cryptobit.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;
import java.text.SimpleDateFormat;
import java.text.ParseException;
import java.util.Base64;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;

@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String dni;
    private String email;
    private String password;
    @JsonIgnore
    private Date birthDate;
    private String userImage;
    private String favoriteId;
    private String walletAddress;
    private String privateKey;

    public User() {}

    public User(String firstName, String lastName, String dni, String email,
                String password, Date birthDate, String userImage,
                String favoriteId, String walletAddress,  String privateKey) {

        this.firstName = firstName;
        this.lastName = lastName;
        this.dni = dni;
        this.email = email;
        this.password = password;
        this.birthDate = birthDate;
        this.userImage = userImage;
        this.favoriteId = favoriteId;
        this.walletAddress = walletAddress;
        this.privateKey = privateKey;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getDni() { return dni; }
    public void setDni(String dni) { this.dni = dni; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPrivateKey() { return privateKey; }
    public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }

    @JsonProperty("userImage")
    public String getUserImage() {
        return userImage;
    }
    @JsonProperty("userImage")
    public void setUserImage(String base64Image) {

        try {

            if (base64Image == null || base64Image.isEmpty()) {
                this.userImage = null;
                return;
            }

            // eliminar prefijo si existe (data:image/png;base64,...)
            if (base64Image.contains(",")) {
                base64Image = base64Image.split(",")[1];
            }

            // decode Base64
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            BufferedImage originalImage =
                    ImageIO.read(new ByteArrayInputStream(imageBytes));

            // escalar a altura 400px manteniendo proporción
            int newHeight = 400;
            int newWidth = (originalImage.getWidth() * newHeight) / originalImage.getHeight();

            Image scaledImage =
                    originalImage.getScaledInstance(newWidth, newHeight, Image.SCALE_SMOOTH);

            BufferedImage bufferedScaled =
                    new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);

            bufferedScaled.getGraphics().drawImage(scaledImage, 0, 0, null);

            // convertir a Base64 otra vez
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(bufferedScaled, "jpg", baos);

            byte[] scaledBytes = baos.toByteArray();

            this.userImage = Base64.getEncoder().encodeToString(scaledBytes);

        } catch (Exception e) {
            e.printStackTrace();
            this.userImage = base64Image; // fallback
        }
    }


    public String getFavoriteId() { return favoriteId; }
    public void setFavoriteId(String favoriteId) { this.favoriteId = favoriteId; }

    public String getWalletAddress() { return walletAddress; }
    public void setWalletAddress(String walletAddress) { this.walletAddress = walletAddress; }

    // devuelve fecha en formato dd/MM/yyyy al frontend
    @JsonProperty("birthDate")
    public String getBirthDateFormatted() {
        if (birthDate == null) return null;
        SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
        return sdf.format(birthDate);
    }
    // recibe dd/MM/yyyy del frontend y lo convierte a Date
    @JsonProperty("birthDate")
    public void setBirthDateFormatted(String birthDateStr) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy");
            this.birthDate = sdf.parse(birthDateStr);
        } catch (ParseException e) {
            e.printStackTrace();
        }
    }

    public Date getBirthDateRaw() {
        return birthDate;
    }

    public void setBirthDateRaw(Date birthDate) {
        this.birthDate = birthDate;
    }
}
