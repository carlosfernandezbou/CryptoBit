import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSettings } from "../context/SettingsContext";
import { useTranslation } from "react-i18next";

const BottomBar = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { C } = useSettings();
  const { t } = useTranslation();

  const isActive = (screenName) => route.name === screenName;

  return (
    <View style={[styles.bottomBar, { backgroundColor: C.navBg, borderTopColor: C.navBorder }]}>
      <TabItem icon="candlestick-chart" label={t("nav.home")} active={isActive("MenuPrincipal")} onPress={() => navigation.navigate("MenuPrincipal")} C={C} />
      <TabItem icon="account-balance-wallet" label={t("nav.wallet")} active={isActive("Billetera")} onPress={() => navigation.navigate("Billetera")} C={C} />

      <Pressable onPress={() => navigation.navigate("MenuTransacciones")}>
        <View style={[styles.centerButton, { backgroundColor: C.primary, shadowColor: C.primary }]}>
          <Icon name="swap-vert" size={28} color="#000" />
        </View>
      </Pressable>

      <TabItem icon="article" label={t("nav.news")} active={isActive("MenuNoticias")} onPress={() => navigation.navigate("MenuNoticias")} C={C} />
      <TabItem icon="account-circle" label={t("nav.profile")} active={isActive("PerfilUsuario")} onPress={() => navigation.navigate("PerfilUsuario")} C={C} />
    </View>
  );
};

const TabItem = ({ icon, label, active, onPress, C }) => (
  <Pressable onPress={onPress} style={styles.tabItem}>
    <Icon name={icon} size={24} color={active ? C.primary : (C.isDark ? "#888" : C.textMuted)} />
    <Text style={[styles.bottomText, { color: active ? C.primary : (C.isDark ? "#888" : C.textMuted) }]}>
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 75,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    paddingBottom: 10,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  bottomText: { fontSize: 10, marginTop: 4 },
  centerButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default BottomBar;
