package es.cryptobit.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "settings")
public class Settings {

    @Id
    private String userId;
    private String language;
    private boolean theme;
    private String currency;
    private boolean faceId;

    public Settings() {
    }

    public Settings(String userId, String language, boolean theme, String currency, boolean faceId) {
        this.userId = userId;
        this.language = language;
        this.theme = theme;
        this.currency = currency;
        this.faceId = faceId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public boolean getTheme() {
        return theme;
    }

    public void setTheme(boolean theme) {
        this.theme = theme;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public boolean getFaceId() {
        return faceId;
    }

    public void setFaceId(boolean faceId) {
        this.faceId = faceId;
    }
}