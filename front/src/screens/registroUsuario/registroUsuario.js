import "react-native-get-random-values";
import "@ethersproject/shims";

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import CryptoJS from "crypto-js";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { ethers } from "ethers";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";

import common from "../../styles/common";
import theme from "../../styles/theme";

// ✅ AÑADIDO: importa tu modal (ajusta la ruta)
import LegalModal from "./LegalModal";

const COLORS = theme?.colors || theme?.COLORS || theme;
const isWeb = Platform.OS === "web";

const API_BASE = "http://192.168.1.44:8080";

const RegistroUsuario = (props) => {
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [webDateOpen, setWebDateOpen] = useState(false);

  const [mail, setMail] = useState("");
  const [psw, setPsw] = useState("");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [fNac, setFnac] = useState("");

  const [userImageBase64, setUserImageBase64] = useState("");
  const [userImagePreview, setUserImagePreview] = useState("");
  const webFileInputRef = useRef(null);

  // ✅ YA LOS TIENES: estado del modal
  const [legalOpen, setLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState(null);

  // ✅ AÑADIDO: textos del modal (puedes moverlos a i18n cuando quieras)
  const TERMS_TEXT = `
Última actualización: 20/02/2026

1. Uso del servicio
- Debes ser mayor de edad y facilitar información veraz.
- No uses el servicio para actividades ilícitas o dañinas.

2. Cuenta y seguridad
- Eres responsable de mantener la confidencialidad de tus credenciales.
- Podemos suspender cuentas por uso indebido.

3. Limitación de responsabilidad
- El servicio se ofrece "tal cual" y puede contener errores.
- En la medida permitida por la ley, no nos hacemos responsables de daños indirectos.

4. Contacto
- Para soporte o consultas: soporte@tuapp.com
`.trim();

  const PRIVACY_TEXT = `
Última actualización: 20/02/2026

1. Datos que recopilamos
- Identificación (nombre, apellidos, DNI) y contacto (email).
- Fecha de nacimiento (para verificación de edad).
- Imagen de perfil (si la aportas).
- Dirección de wallet (si aplica).

2. Finalidad
- Crear y gestionar tu cuenta.
- Prevenir fraude y mejorar seguridad.
- Comunicaciones esenciales del servicio.

3. Conservación
- Conservamos los datos el tiempo necesario para la prestación del servicio y obligaciones legales.

4. Tus derechos
- Acceso, rectificación, supresión, oposición y portabilidad, según normativa aplicable.

5. Contacto
- privacidad@tuapp.com
`.trim();

  // ✅ AÑADIDO: helpers abrir/cerrar
  const openLegal = (type) => {
    setLegalType(type);
    setLegalOpen(true);
  };

  const closeLegal = () => {
    setLegalOpen(false);
    setLegalType(null);
  };

  const pickImage = async () => {
    try {
      if (Platform.OS === "web") {
        if (webFileInputRef.current) webFileInputRef.current.click();
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("register.alerts.permissionDeniedTitle"),
          t("register.alerts.permissionDeniedMsg")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      setUserImagePreview(asset.uri || "");
      if (asset.base64) setUserImageBase64(asset.base64);
    } catch (e) {
      console.error(e);
      Alert.alert(t("register.alerts.errorTitle"), t("register.alerts.galleryError"));
    }
  };

  const isAdult = (birthStr) => {
    if (!birthStr) return false;
    const parts = birthStr.split("/");
    if (parts.length !== 3) return false;

    const [dd, mm, yyyy] = parts;
    const birthDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (Number.isNaN(birthDate.getTime())) return false;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

    return age >= 18;
  };

  const onWebFileChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setUserImagePreview(dataUrl);
      const base64 = String(dataUrl).split(",")[1] || "";
      setUserImageBase64(base64);
    };
    reader.readAsDataURL(file);

    e.target.value = "";
  };

  const setBirthDateFromDate = (selectedDate) => {
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const year = selectedDate.getFullYear();
    setFnac(`${day}/${month}/${year}`);
  };

  const onChangeNative = (event, selectedDate) => {
    setShowIOSPicker(false);
    if (!selectedDate) return;
    setDate(selectedDate);
    setBirthDateFromDate(selectedDate);
  };

  const handleRegister = async () => {
    if (!name || !lastName || !mail || !psw || !dni || !fNac) {
      Alert.alert(t("register.alerts.errorTitle"), t("register.alerts.fillAllFields"));
      return;
    }

    // ✅ Validación de mayoría de edad
    if (!isAdult(fNac)) {
      Alert.alert(
        t("register.alerts.errorTitle"),
        "Debes ser mayor de edad (18 años) para registrarte."
      );
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(t("register.alerts.errorTitle"), t("register.alerts.acceptTerms"));
      return;
    }

    try {
      const wallet = ethers.Wallet.createRandom();
      const privateKey = wallet.privateKey;
      const publicAddress = wallet.address;

      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("user_private_key", privateKey);
          window.localStorage.setItem("user_address", publicAddress);
        }
      } else {
        await SecureStore.setItemAsync("user_private_key", privateKey);
        await SecureStore.setItemAsync("user_address", publicAddress);
      }

      const hashedPassword = CryptoJS.SHA256(psw).toString();

      const response = await fetch(`${API_BASE}/API/NewUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name,
          lastName: lastName,
          email: mail,
          password: hashedPassword,
          dni: dni,
          birthDate: fNac,
          userImage: userImageBase64 ? userImageBase64 : "default-avatar.png",
          favoriteId: "null",
          walletAddress: publicAddress,
        }),
      });

      const text = await response.text();

      if (response.ok) {
        Alert.alert(t("register.alerts.successTitle"), t("register.alerts.registerOk"));
        props.navigation.navigate("InicioSesion");
      } else {
        Alert.alert(t("register.alerts.errorTitle"), text || t("register.alerts.registerFail"));
      }
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      Alert.alert(t("register.alerts.errorTitle"), t("register.alerts.serverError"));
    }
  };

  const openDatePicker = () => {
    if (Platform.OS === "web") {
      setWebDateOpen(true);
      return;
    }

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: date,
        mode: "date",
        display: "calendar",
        maximumDate: new Date(),
        onChange: onChangeNative,
      });
      return;
    }

    setShowIOSPicker(true);
  };

  return (
    <SafeAreaView style={[common.safe, styles.safe, isWeb && styles.safeWeb]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
  style={[styles.scroll, isWeb && styles.webScroll]}
  contentContainerStyle={styles.scrollContainer}
  bounces={false}
  showsVerticalScrollIndicator={!isWeb}
  showsHorizontalScrollIndicator={false}
  keyboardShouldPersistTaps="handled"
>
          <View style={styles.root}>
            <View style={[styles.blob, styles.blobTopRight]} />
            <View style={[styles.blob, styles.blobBottomLeft]} />

            <View style={styles.container}>
              <View style={styles.headLeft}>
                <Text style={styles.title}>{t("register.title")}</Text>
                <Text style={styles.subtitle}>{t("register.subtitle")}</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>{t("register.labels.profilePhotoOptional")}</Text>

                <TouchableOpacity style={styles.avatarRow} activeOpacity={0.85} onPress={pickImage}>
                  <View style={styles.avatarCircle}>
                    {userImagePreview ? (
                      <Image source={{ uri: userImagePreview }} style={styles.avatarImg} />
                    ) : (
                      <MaterialIcons name="person" size={28} color={COLORS.textMuted} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.avatarTitle}>{t("register.avatar.selectImage")}</Text>
                    <Text style={styles.avatarSub}>
                      {isWeb ? t("register.avatar.fromFiles") : t("register.avatar.fromGallery")}
                    </Text>
                  </View>

                  <MaterialIcons name="chevron-right" size={26} color={COLORS.textMuted} />
                </TouchableOpacity>

                {isWeb && (
                  <input
                    ref={webFileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={onWebFileChange}
                  />
                )}

                <Text style={styles.label}>{t("register.labels.name")}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t("register.placeholders.name")}
                    placeholderTextColor="rgba(157,185,168,0.55)"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <Text style={styles.label}>{t("register.labels.lastName")}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t("register.placeholders.lastName")}
                    placeholderTextColor="rgba(157,185,168,0.55)"
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>

                <Text style={styles.label}>{t("register.labels.email")}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t("register.placeholders.email")}
                    placeholderTextColor="rgba(157,185,168,0.55)"
                    style={styles.input}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={mail}
                    onChangeText={setMail}
                  />
                </View>

                <Text style={styles.label}>{t("register.labels.password")}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t("register.placeholders.password")}
                    placeholderTextColor="rgba(157,185,168,0.55)"
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    value={psw}
                    onChangeText={setPsw}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword((v) => !v)} activeOpacity={0.85}>
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={20}
                      color={COLORS.textMuted}
                    />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>{t("register.labels.dni")}</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="fingerprint" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    placeholder={t("register.placeholders.dni")}
                    placeholderTextColor="rgba(157,185,168,0.55)"
                    style={styles.input}
                    autoCapitalize="characters"
                    value={dni}
                    onChangeText={setDni}
                  />
                </View>

                <Text style={styles.label}>{t("register.labels.birthDate")}</Text>

                <View style={{ position: "relative" }}>
                  <TouchableOpacity style={styles.inputContainer} onPress={openDatePicker} activeOpacity={0.7}>
                    <MaterialIcons name="calendar-today" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <Text
                      style={[
                        styles.input,
                        !fNac && { color: "rgba(157,185,168,0.55)" },
                        { lineHeight: 56 },
                      ]}
                    >
                      {fNac ? fNac : t("register.placeholders.birthDate")}
                    </Text>
                  </TouchableOpacity>

                  {isWeb && webDateOpen && (
                    <input
                      type="date"
                      autoFocus
                      max={new Date().toISOString().split("T")[0]}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 60,
                        zIndex: 9999,
                      }}
                      onBlur={() => setWebDateOpen(false)}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) return;

                        const [yyyy, mm, dd] = value.split("-");
                        const selectedDate = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                        setDate(selectedDate);
                        setFnac(`${dd}/${mm}/${yyyy}`);
                        setWebDateOpen(false);
                      }}
                    />
                  )}
                </View>

                {!isWeb && showIOSPicker && Platform.OS === "ios" && (
                  <View style={styles.iosPickerWrap}>
                    <DateTimePicker
                      value={date}
                      mode="date"
                      display="inline"
                      onChange={onChangeNative}
                      maximumDate={new Date()}
                    />
                  </View>
                )}

                {/* ✅ MODIFICADO: solo la parte de términos para que los links abran el modal */}
                <View style={styles.termsRow}>
                  <Pressable onPress={() => setAcceptedTerms((v) => !v)} style={{ paddingTop: 2 }}>
                    <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                      {acceptedTerms && (
                        <MaterialIcons name="check" size={16} color={COLORS.bg || COLORS.backgroundDark} />
                      )}
                    </View>
                  </Pressable>

                  <Text style={styles.termsText}>
                    {t("register.terms.textPrefix")}{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() => openLegal("terms")}
                      suppressHighlighting
                    >
                      {t("register.terms.termsOfService")}
                    </Text>{" "}
                    {t("register.terms.and")}{" "}
                    <Text
                      style={styles.termsLink}
                      onPress={() => openLegal("privacy")}
                      suppressHighlighting
                    >
                      {t("register.terms.privacyPolicy")}
                    </Text>
                    {t("register.terms.textSuffix")}
                  </Text>
                </View>

                <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85} onPress={handleRegister}>
                  <Text style={styles.primaryBtnText}>{t("register.buttons.register")}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t("register.footer.haveAccount")} </Text>
                <Pressable onPress={() => props.navigation.navigate("InicioSesion")}>
                  <Text style={styles.footerLink}>{t("register.footer.login")}</Text>
                </Pressable>
              </View>
              <View style={{ height: 40 }} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LegalModal
        visible={legalOpen}
        onClose={closeLegal}
        title={
          legalType === "terms"
            ? t("register.terms.termsOfService")
            : legalType === "privacy"
              ? t("register.terms.privacyPolicy")
              : ""
        }
        content={
          legalType === "terms"
            ? TERMS_TEXT
            : legalType === "privacy"
              ? PRIVACY_TEXT
              : ""
        }
        colors={COLORS}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg || COLORS.backgroundDark },
  safeWeb: { height: "100vh", overflow: "hidden" },
  webScroll: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
},
  scroll: { flex: 1 },
  scrollContainer: { flexGrow: 1, paddingBottom: 120 },
  root: { alignItems: "center" },
  blob: { position: "absolute", backgroundColor: "rgba(43,238,121,0.08)", borderRadius: 999 },
  blobTopRight: { width: 400, height: 400, top: -110, right: -120 },
  blobBottomLeft: { width: 300, height: 300, bottom: -60, left: -120 },
  container: { width: "100%", maxWidth: 450, paddingHorizontal: 24 },
  headLeft: { marginTop: 4, marginBottom: 22 },
  title: { fontSize: 32, fontWeight: "800", color: COLORS.textMain || "#fff", marginBottom: 8 },
  subtitle: { fontSize: 16, color: COLORS.textMuted, lineHeight: 22 },
  form: { width: "100%", gap: 12 },
  label: {
    color: COLORS.textMain || "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
    marginTop: 6,
    marginBottom: -2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg || COLORS.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.textMain || "#fff", fontSize: 16 },
  eyeIcon: { padding: 4 },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.cardBg || COLORS.inputBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: { width: 52, height: 52 },
  avatarTitle: { color: COLORS.textMain || "#fff", fontWeight: "800" },
  avatarSub: { color: COLORS.textMuted, marginTop: 2, fontSize: 12 },

  // ✅ SIN CAMBIOS de estilo (solo quitamos el TouchableOpacity por View arriba)
  termsRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginTop: 32 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg || COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { flex: 1, color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  termsLink: { color: COLORS.primary, fontWeight: "700" },

  primaryBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: {
    color: COLORS.bg || COLORS.backgroundDark,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  footer: { marginTop: 24, alignItems: "center" },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontWeight: "800" },
  iosPickerWrap: {
    backgroundColor: COLORS.textMain || "#fff",
    borderRadius: 16,
    marginTop: 8,
    overflow: "hidden",
    padding: 6,
  },
});

export default RegistroUsuario;