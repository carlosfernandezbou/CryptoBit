import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import CryptoJS from "crypto-js";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingsContext";

const isWeb = Platform.OS === "web";


const API_BASE = "http://192.168.1.44:8080";

const pad2 = (n) => String(n).padStart(2, "0");

const isValidDateStr = (s) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return false;
  const [dd, mm, yyyy] = s.split("/").map((x) => parseInt(x, 10));
  if (yyyy < 1900 || yyyy > 2100) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;

  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
};

export default function EditarPerfil({ navigation, route }) {
  const { t } = useTranslation();
  const { C } = useSettings();
  const styles = useMemo(() => makeStyles(C), [C]);

  const user = route?.params?.user ?? null;
  const userId = user?.id ?? user?.userId ?? null;

  const initialImage =
    user?.userImageUrl || user?.userImage || "https://randomuser.me/api/portraits/men/1.jpg";

  const initialBirth = user?.birthDateFormatted || user?.birthDate || "";

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [birthDate, setBirthDate] = useState(initialBirth);
  const [userImage, setUserImage] = useState(initialImage);
  const [password, setPassword] = useState("");

  // Modal fecha (compañero)
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [dd, setDd] = useState("");
  const [mm, setMm] = useState("");
  const [yyyy, setYyyy] = useState("");

  const canSave = useMemo(() => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      birthDate.trim() &&
      isValidDateStr(birthDate.trim())
    );
  }, [firstName, lastName, birthDate]);

  const openDateModal = () => {
    const current = birthDate && /^\d{2}\/\d{2}\/\d{4}$/.test(birthDate) ? birthDate : "";
    if (current) {
      const [d1, m1, y1] = current.split("/");
      setDd(d1);
      setMm(m1);
      setYyyy(y1);
    } else {
      setDd("");
      setMm("");
      setYyyy("");
    }
    setDateModalVisible(true);
  };

  const applyDate = () => {
    const value = `${pad2(dd)}/${pad2(mm)}/${yyyy}`;
    if (!isValidDateStr(value)) {
      Alert.alert(
  t("editProfile.dateModal.alerts.invalidDateTitle"),
  t("editProfile.dateModal.alerts.invalidDateMessage")
);
      return;
    }
    setBirthDate(value);
    setDateModalVisible(false);
  };

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
  t("editProfile.alerts.permissionDeniedTitle"),
  t("editProfile.alerts.permissionDeniedMsg")
);
          return;
        }
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

      if (asset.base64) {
        const mime = asset.mimeType || "image/jpeg";
        setUserImage(`data:${mime};base64,${asset.base64}`);
      } else if (asset.uri) {
        setUserImage(asset.uri);
      }
    } catch (e) {
      console.log("PICK IMAGE ERROR", e);
      Alert.alert(t("common.error"), t("editProfile.alerts.imageLoadError"));
    }
  };

  const onSave = async () => {
    if (!userId) {
      Alert.alert(t("common.error"), t("editProfile.errors.missingUserId"));
      return;
    }
    if (!canSave) {
      Alert.alert(t("common.error"), t("editProfile.errors.fillAllRequired"));
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dni: user?.dni ?? "",
      email: user?.email ?? "",
      favoriteId: user?.favoriteId ?? "null",
      birthDateFormatted: birthDate.trim(),
      birthDate: birthDate.trim(),
      userImage: (userImage ?? "").trim(),
      password: user?.password ?? "",
    };

    if (password.trim().length > 0) {
      payload.password = CryptoJS.SHA256(password.trim()).toString();
    }

    try {
      const res = await fetch(`${API_BASE}/API/EditUser/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const txt = await res.text();

      if (!res.ok) {
        Alert.alert(t("common.error"), txt);
        return;
      }

      Alert.alert(t("common.ok"), t("editProfile.success.updated"));
      navigation.goBack();
    } catch (e) {
      Alert.alert(t("common.error"), t("editProfile.errors.serverConnection"));
    }
  };

  return (
    <View style={[styles.screen, isWeb && styles.safeWeb]}>
      <View style={styles.page}>
        {isWeb ? (
          <View style={styles.webScroll}>
            <View style={styles.content}>
              <Text style={styles.title}>{t("editProfile.title")}</Text>

              <View style={styles.avatarBox}>
                <Image source={{ uri: userImage }} style={styles.avatar} />
                <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.85}>
                  <Text style={styles.pickBtnText}>{t("editProfile.buttons.changePhoto")}</Text>
                </TouchableOpacity>
                <Text style={styles.help}>{t("editProfile.help.imageUrl")}</Text>
              </View>

              <Text style={styles.label}>{t("editProfile.labels.image")}</Text>
              <TextInput
                value={userImage}
                onChangeText={setUserImage}
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor={C.textMuted}
              />

              <Text style={styles.label}>{t("editProfile.labels.firstName")}</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
                placeholder={t("editProfile.placeholders.firstName")}
                placeholderTextColor={C.textMuted}
              />

              <Text style={styles.label}>{t("editProfile.labels.lastName")}</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
                placeholder={t("editProfile.placeholders.lastName")}
                placeholderTextColor={C.textMuted}
              />

              <View style={styles.rowBetween}>
                <Text style={styles.label}>{t("editProfile.labels.birthDate")}</Text>
                <TouchableOpacity onPress={openDateModal} activeOpacity={0.85}>
                  <Text style={styles.link}>{t("editProfile.actions.openDateModal")}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                style={styles.input}
                placeholder={t("editProfile.placeholders.birthDate")}
                placeholderTextColor={C.textMuted}
              />

              <Text style={styles.label}>{t("editProfile.labels.newPassword")}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder={t("editProfile.placeholders.newPassword")}
                placeholderTextColor={C.textMuted}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, { opacity: canSave ? 1 : 0.5 }]}
                onPress={onSave}
                disabled={!canSave}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>{t("editProfile.actions.save")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnGhost}
                onPress={() =>
                  navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate("HomeNav")
                }
                activeOpacity={0.85}
              >
                <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
              </TouchableOpacity>

              {/* MODAL FECHA (compañero) */}
              <Modal
                transparent
                visible={dateModalVisible}
                animationType="fade"
                onRequestClose={() => setDateModalVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setDateModalVisible(false)}>
                  <Pressable style={styles.modalCard} onPress={() => { }}>
                    <Text style={styles.modalTitle}>{t("editProfile.dateModal.title")}</Text>

                    <View style={styles.dateRow}>
                      <View style={styles.dateCol}>
                        <Text style={styles.modalLabel}>{t("editProfile.dateModal.labels.day")}</Text>
                        <TextInput
                          value={dd}
                          onChangeText={(v) => setDd(v.replace(/\D/g, "").slice(0, 2))}
                          style={styles.dateInput}
                          keyboardType="number-pad"
                          placeholder="dd"
                          placeholderTextColor={C.textMuted}
                        />
                      </View>

                      <View style={styles.dateCol}>
                        <Text style={styles.modalLabel}>{t("editProfile.dateModal.labels.month")}</Text>
                        <TextInput
                          value={mm}
                          onChangeText={(v) => setMm(v.replace(/\D/g, "").slice(0, 2))}
                          style={styles.dateInput}
                          keyboardType="number-pad"
                          placeholder="mm"
                          placeholderTextColor={C.textMuted}
                        />
                      </View>

                      <View style={styles.dateColWide}>
                        <Text style={styles.modalLabel}>{t("editProfile.dateModal.labels.year")}</Text>
                        <TextInput
                          value={yyyy}
                          onChangeText={(v) => setYyyy(v.replace(/\D/g, "").slice(0, 4))}
                          style={styles.dateInput}
                          keyboardType="number-pad"
                          placeholder="yyyy"
                          placeholderTextColor={C.textMuted}
                        />
                      </View>
                    </View>

                    <View style={styles.modalBtns}>
                      <TouchableOpacity
                        style={styles.modalBtnGhost}
                        onPress={() => setDateModalVisible(false)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.modalBtnGhostText}>{t("common.cancel")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.modalBtn} onPress={applyDate} activeOpacity={0.85}>
                        <Text style={styles.modalBtnText}>{t("editProfile.dateModal.actions.apply")}</Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>

              <View style={{ height: 40 }} />
            </View>
          </View>
        ) : (
          <ScrollView
            style={styles.screen}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{t("editProfile.title")}</Text>

            <View style={styles.avatarBox}>
              <Image source={{ uri: userImage }} style={styles.avatar} />
              <TouchableOpacity style={styles.pickBtn} onPress={pickImage} activeOpacity={0.85}>
                <Text style={styles.pickBtnText}>{t("editProfile.buttons.changePhoto")}</Text>
              </TouchableOpacity>
              <Text style={styles.help}>{t("editProfile.help.imageUrl")}</Text>
            </View>

            <Text style={styles.label}>{t("editProfile.labels.image")}</Text>
            <TextInput
              value={userImage}
              onChangeText={setUserImage}
              style={styles.input}
              placeholder="https://..."
              placeholderTextColor={C.textMuted}
            />

            <Text style={styles.label}>{t("editProfile.labels.firstName")}</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
              placeholder={t("editProfile.placeholders.firstName")}
              placeholderTextColor={C.textMuted}
            />

            <Text style={styles.label}>{t("editProfile.labels.lastName")}</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              style={styles.input}
              placeholder={t("editProfile.placeholders.lastName")}
              placeholderTextColor={C.textMuted}
            />

            <View style={styles.rowBetween}>
              <Text style={styles.label}>{t("editProfile.labels.birthDate")}</Text>
              <TouchableOpacity onPress={openDateModal} activeOpacity={0.85}>
                <Text style={styles.link}>{t("editProfile.actions.openDateModal")}</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              value={birthDate}
              onChangeText={setBirthDate}
              style={styles.input}
              placeholder={t("editProfile.placeholders.birthDate")}
              placeholderTextColor={C.textMuted}
            />

            <Text style={styles.label}>{t("editProfile.labels.newPassword")}</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder={t("editProfile.placeholders.newPassword")}
              placeholderTextColor={C.textMuted}
              secureTextEntry
            />

            <TouchableOpacity
              style={[styles.btn, { opacity: canSave ? 1 : 0.5 }]}
              onPress={onSave}
              disabled={!canSave}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>{t("editProfile.actions.save")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() =>
                navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate("HomeNav")
              }
              activeOpacity={0.85}
            >
              <Text style={styles.btnGhostText}>{t("common.cancel")}</Text>
            </TouchableOpacity>

            {/* MODAL FECHA (compañero) */}
            <Modal
              transparent
              visible={dateModalVisible}
              animationType="fade"
              onRequestClose={() => setDateModalVisible(false)}
            >
              <Pressable style={styles.modalOverlay} onPress={() => setDateModalVisible(false)}>
                <Pressable style={styles.modalCard} onPress={() => { }}>
                  <Text style={styles.modalTitle}>{t("editProfile.dateModal.title")}</Text>

                  <View style={styles.dateRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.modalLabel}>{t("editProfile.dateModal.labels.day")}</Text>
                      <TextInput
                        value={dd}
                        onChangeText={(v) => setDd(v.replace(/\D/g, "").slice(0, 2))}
                        style={styles.dateInput}
                        keyboardType="number-pad"
                        placeholder="dd"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>

                    <View style={styles.dateCol}>
                      <Text style={styles.modalLabel}>{t("editProfile.dateModal.labels.month")}</Text>
                      <TextInput
                        value={mm}
                        onChangeText={(v) => setMm(v.replace(/\D/g, "").slice(0, 2))}
                        style={styles.dateInput}
                        keyboardType="number-pad"
                        placeholder="mm"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>

                    <View style={styles.dateColWide}>
                      <Text style={styles.modalLabel}>{t("editProfile.dateModal.labels.year")}</Text>
                      <TextInput
                        value={yyyy}
                        onChangeText={(v) => setYyyy(v.replace(/\D/g, "").slice(0, 4))}
                        style={styles.dateInput}
                        keyboardType="number-pad"
                        placeholder="yyyy"
                        placeholderTextColor={C.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.modalBtns}>
                    <TouchableOpacity
                      style={styles.modalBtnGhost}
                      onPress={() => setDateModalVisible(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.modalBtnGhostText}>{t("common.cancel")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalBtn} onPress={applyDate} activeOpacity={0.85}>
                      <Text style={styles.modalBtnText}>{t("editProfile.dateModal.actions.apply")}</Text>
                    </TouchableOpacity>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const makeStyles = (C) =>
  StyleSheet.create({
    safeWeb: {
      height: "100vh",
      overflow: "hidden",
    },
    page: {
      flex: 1,
      position: "relative",
    },
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
      WebkitOverflowScrolling: "touch",
    },

    screen: { flex: 1, backgroundColor: C.bg },
    content: { padding: 16, paddingBottom: 40 },

    title: { color: C.textMain, fontSize: 22, fontWeight: "800", marginBottom: 16 },
    label: { color: C.textMuted, marginTop: 12, marginBottom: 6, fontSize: 12, fontWeight: "700" },

    rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    link: { color: C.primary, fontWeight: "800" },

    input: {
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: C.textMain,
    },

    btn: {
      backgroundColor: C.primary,
      padding: 14,
      borderRadius: 14,
      marginTop: 18,
      alignItems: "center",
    },
    btnText: { color: "#000", fontWeight: "900" },

    btnGhost: {
      padding: 14,
      borderRadius: 14,
      marginTop: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.cardBg,
    },
    btnGhostText: { color: C.textMain, fontWeight: "800" },

    avatarBox: { alignItems: "center", marginBottom: 8 },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: C.primary,
      marginBottom: 10,
    },
    pickBtn: {
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.cardBg,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
    },
    pickBtnText: { color: C.textMain, fontWeight: "800" },
    help: { color: C.textMuted, fontSize: 12, marginTop: 8, textAlign: "center" },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: 18,
    },
    modalCard: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: C.modalBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      padding: 16,
    },
    modalTitle: { color: C.textMain, fontWeight: "900", fontSize: 16, marginBottom: 12 },
    modalLabel: { color: C.textMuted, fontSize: 12, marginBottom: 6, fontWeight: "700" },

    dateRow: { flexDirection: "row", gap: 10 },
    dateCol: { flex: 1 },
    dateColWide: { flex: 1.4 },
    dateInput: {
      backgroundColor: C.inputBg,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: C.textMain,
    },

    modalBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
    modalBtn: { backgroundColor: C.primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14 },
    modalBtnText: { color: "#000", fontWeight: "900" },
    modalBtnGhost: {
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: C.cardBg,
    },
    modalBtnGhostText: { color: C.textMain, fontWeight: "800" },
  });