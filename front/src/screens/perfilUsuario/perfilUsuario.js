import React, { useState, useEffect, useContext, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Modal,
  Pressable,
  Alert,
  Platform,
  Clipboard,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingsContext";
import { useFocusEffect } from "@react-navigation/native";

import Context from "../../context/Context";
import common from "../../styles/common";
import Nav from "../../components/Nav";

const BASE_URL = "http://192.168.1.44:8080";

export default function PerfilUsuario(props) {
  const { t, i18n } = useTranslation();

  const {
    C,
    isDarkMode,
    setIsDarkMode,
    faceId,
    setFaceId,
    language,
    setLanguage,
    currency,
    setCurrency,
    saveSettings,
  } = useSettings();

  const { userId, setUserId, logoutUser, user: userFromContext } = useContext(Context);
  const user = userFromContext ?? props?.route?.params?.user ?? null;

  const [dbUser, setDbUser] = useState(null);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const LANGUAGES = ["ES", "EN", "CA", "FR", "DE", "CH"];
  const CURRENCIES = ["EUR", "USD", "GBP", "JPY", "CHF", "CNY", "AUD", "CAD", "NZD", "MXN", "BRL", "ARS", "CLP", "COP", "INR", "KRW", "SGD", "HKD", "THB", "SEK", "NOK", "DKK", "PLN", "TRY", "RUB", "ZAR", "AED", "SAR"];

  const isWeb = Platform.OS === "web";

  const loadUser = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BASE_URL}/API/User/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
      }
    } catch (e) {
      console.log("LOAD USER ERROR", e);
    }
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const shownUser = dbUser ?? user ?? {};

  // ✅ Función para copiar sin alertas (Silent Copy)
  const copyToClipboard = (text) => {
    if (!text) return;
    Clipboard.setString(text);
    // Eliminados los Alert y alert() por petición
  };

  const resolveAvatarUri = () => {
    const raw = shownUser?.userImageUrl || shownUser?.userImage || "";
    if (!raw) return "https://randomuser.me/api/portraits/men/1.jpg";
    if (raw.startsWith("http") || raw.startsWith("data:") || raw.startsWith("file:")) return raw;
    return `data:image/jpeg;base64,${raw}`;
  };

  const handleDeleteAccount = async () => {
    const doDelete = async () => {
      try {
        const res = await fetch(`${BASE_URL}/API/DeleteUser/${userId}`, {
          method: "DELETE"
        });
        if (res.ok) {
          await logoutUser();
          setUserId(0);
          props.navigation.reset({
            index: 0,
            routes: [{ name: "InicioSesion" }]
          });
        }
      } catch (e) {
        Alert.alert(t("common.error"), t("profile.deleteAccount.alerts.connectionError"));
      }
    };
    if (isWeb) {
      if (window.confirm(t("profile.deleteAccount.confirmMessage"))) await doDelete();
    } else {
      Alert.alert(
        t("profile.deleteAccount.title"),
        t("profile.deleteAccount.confirmMessage"),
        [
          { text: t("profile.deleteAccount.actions.no") },
          { text: t("profile.deleteAccount.actions.yes"), onPress: doDelete }
        ]
      );
    }
  };

  const styles = useMemo(() => makeStyles(C), [C]);

  const renderModals = () => (
    <>
      {/* MODAL IDIOMA */}
      <Modal
        transparent
        visible={languageModalVisible}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.modalItem}
                  onPress={() => {
                    setLanguage(lang);
                    i18n.changeLanguage(lang.toLowerCase());
                    setLanguageModalVisible(false);
                    saveSettings({ language: lang });
                  }}
                >
                  <Text style={[styles.modalText, lang === language && { color: C.primary }]}>
                    {lang}
                  </Text>
                  {lang === language && <Icon name="check" size={20} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* MODAL DIVISA */}
      <Modal
        transparent
        visible={currencyModalVisible}
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((cur) => (
                <TouchableOpacity
                  key={cur}
                  style={styles.modalItem}
                  onPress={() => {
                    setCurrency(cur);
                    setCurrencyModalVisible(false);
                    saveSettings({ currency: cur });
                  }}
                >
                  <Text style={[styles.modalText, cur === currency && { color: C.primary }]}>
                    {cur}
                  </Text>
                  {cur === currency && <Icon name="check" size={20} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );

  const renderProfileContent = () => (
    <>
      <View style={styles.profileContainer}>
        <Image source={{ uri: resolveAvatarUri() }} style={styles.avatar} />
        <Text style={styles.name}>{shownUser?.firstName || t("profile.fallbackUser")}</Text>

        {/* ✅ Fila de la Private Key sin el punto rojo */}
        <TouchableOpacity
          style={styles.walletRow}
          onPress={() => copyToClipboard(shownUser?.privateKey)}
          activeOpacity={0.7}
        >
          <Text style={styles.walletText}>
            {shownUser?.privateKey
              ? `${t("profile.privateKey.prefix")} ${shownUser.privateKey.substring(0, 10)}...`
              : t("profile.privateKey.noKey")}
          </Text>
          <Icon name="content-copy" size={14} color={C.textMuted} style={styles.copyIcon} />
        </TouchableOpacity>
      </View>

      <Section title={t("profile.sections.account")} styles={styles}>
        <Item
          icon="person"
          label={t("profile.items.editProfile")}
          onPress={() => props.navigation.navigate("EditarPerfil", { user: shownUser })}
          C={C}
          styles={styles}
        />
        <Item icon="dark-mode" label={t("profile.items.lightDark")} C={C} styles={styles}>
          <Switch
            value={!!isDarkMode}
            onValueChange={(val) => { setIsDarkMode(val); saveSettings({ theme: val }); }}
            trackColor={{ false: "#cbd5e1", true: C.primary }}
            thumbColor="#fff"
          />
        </Item>
      </Section>

      <Section title={t("profile.sections.security")} styles={styles}>
        <Item icon="face" label={t("profile.items.faceId")} C={C} styles={styles}>
          <Switch
            value={!!faceId}
            onValueChange={(val) => { setFaceId(val); saveSettings({ faceId: val }); }}
            trackColor={{ false: "#cbd5e1", true: C.primary }}
            thumbColor="#fff"
          />
        </Item>
        <Item icon="shield" label={t("profile.items.twoFA")} rightText={t("profile.status.enabled")} C={C} styles={styles} />
      </Section>

      <Section title={t("profile.sections.preferences")} styles={styles}>
        <Item icon="currency-exchange" label={t("profile.items.localCurrency")} rightText={currency} onPress={() => setCurrencyModalVisible(true)} C={C} styles={styles} />
        <Item icon="language" label={t("profile.items.language")} rightText={language} onPress={() => setLanguageModalVisible(true)} C={C} styles={styles} />
      </Section>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => { await logoutUser(); props.navigation.replace("InicioSesion"); }}
      >
        <Icon name="logout" size={20} color={C.danger} />
        <Text style={styles.logoutText}>{t("profile.items.logout")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={handleDeleteAccount}
      >
        <Icon name="delete-forever" size={20} color={C.danger} />
        <Text style={styles.deleteText}>{t("profile.deleteAccount.button")}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[common.safe, { backgroundColor: C.bg }, isWeb && styles.safeWeb]}>
      <View style={styles.page}>
        {isWeb ? (
          <View style={styles.webScroll}>
            {renderProfileContent()}
          </View>
        ) : (
          <SafeAreaView style={styles.flex1}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollPadding}
            >
              {renderProfileContent()}
            </ScrollView>
            <Nav />
          </SafeAreaView>
        )}
        {renderModals()}
        {isWeb && (
          <View style={[styles.navWrap, styles.navWrapWeb]}>
            <Nav />
          </View>
        )}
      </View>
    </View>
  );
}

const Section = ({ title, children, styles }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.cardBox}>{children}</View>
  </View>
);

const Item = ({ icon, label, subLabel, rightText, children, onPress, C, styles }) => (
  <TouchableOpacity
    style={styles.item}
    disabled={!!children}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <View style={styles.row}>
      <Icon name={icon} size={22} color={C.textMain} />
      <View style={styles.marginLeft12}>
        <Text style={styles.itemText}>{label}</Text>
        {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
      </View>
    </View>
    {children || (
      <View style={styles.row}>
        {rightText ? <Text style={styles.rightText}>{rightText}</Text> : null}
        <Icon name="chevron-right" size={22} color={C.chevron} />
      </View>
    )}
  </TouchableOpacity>
);

const makeStyles = (C) =>
  StyleSheet.create({
    flex1: {
      flex: 1
    },
    scrollPadding: {
      paddingBottom: 100
    },
    safeWeb: {
      height: "100vh",
      overflow: "hidden"
    },
    page: {
      flex: 1,
      position: "relative"
    },
    webScroll: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 90,
      overflowY: "auto"
    },
    navWrap: {
      left: 0,
      right: 0,
      bottom: 0,
      height: 90,
      zIndex: 9999
    },
    navWrapWeb: {
      position: "fixed"
    },
    profileContainer: {
      alignItems: "center",
      paddingVertical: 20
    },
    avatar: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: C.primary
    },
    name: {
      fontSize: 22,
      fontWeight: "700",
      marginTop: 10,
      color: C.textMain
    },
    walletRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.pillBg,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      marginTop: 10,
      borderWidth: 1,
      borderColor: C.border
    },
    walletText: {
      color: C.textMain,
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
    },
    copyIcon: {
      marginLeft: 10
    },
    section: {
      paddingHorizontal: 16,
      marginTop: 14
    },
    sectionTitle: {
      fontSize: 12,
      color: C.textMuted,
      marginBottom: 8,
      textTransform: "uppercase",
      fontWeight: "700"
    },
    cardBox: {
      backgroundColor: C.cardBg,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: C.border
    },
    row: {
      flexDirection: "row",
      alignItems: "center"
    },
    marginLeft12: {
      marginLeft: 12
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
      borderColor: C.border
    },
    itemText: {
      fontSize: 16,
      color: C.textMain,
      fontWeight: "600"
    },
    subLabel: {
      fontSize: 12,
      color: C.primary,
      marginTop: 2,
      fontWeight: "700"
    },
    rightText: {
      color: C.textMuted,
      marginRight: 6,
      fontWeight: "600"
    },
    logoutBtn: {
      flexDirection: "row",
      justifyContent: "center",
      padding: 16,
      borderRadius: 16,
      margin: 20,
      backgroundColor: C.dangerSoft
    },
    logoutText: {
      color: C.danger,
      fontWeight: "700"
    },
    deleteBtn: {
      flexDirection: "row",
      justifyContent: "center",
      padding: 16,
      borderRadius: 16,
      marginHorizontal: 20,
      backgroundColor: "rgba(255, 70, 70, 0.10)"
    },
    deleteText: {
      color: C.danger,
      fontWeight: "800"
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      alignItems: "center"
    },
    modalContent: {
      backgroundColor: C.modalBg || C.cardBg,
      borderRadius: 16,
      width: 250,
      maxHeight: 400,
      padding: 10,
      borderWidth: 1,
      borderColor: C.border
    },
    modalItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 15,
      borderBottomWidth: 0.5,
      borderBottomColor: C.border
    },
    modalText: {
      color: C.textMain,
      fontSize: 16,
      fontWeight: "600"
    }
  });