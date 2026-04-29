import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Nav from "../../components/Nav";

import common from "../../styles/common";
import Context from "../../context/Context";
import { useSettings } from "../../context/SettingsContext";
import { useTranslation } from "react-i18next";

const NAV_HEIGHT = 90;

const Billetera = (props) => {
  const { t } = useTranslation();
  const { C } = useSettings();
  const styles = useMemo(() => makeStyles(C), [C]);

  const { user, isLogged, isLoading } = useContext(Context);

  const [hideBalance, setHideBalance] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");
  const [loadingBalance, setLoadingBalance] = useState(true);

  const [portfolio, setPortfolio] = useState({
    totalBalanceEur: 0,
    assets: [],
  });

  const [trend, setTrend] = useState("neutral");
  const prevBalanceRef = useRef(0);

  const isWeb = Platform.OS === "web";
  const topInset = Platform.OS === "android" ? (StatusBar.currentHeight || 0) : 0;

  useEffect(() => {
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setScreenW(window.width);
    });
    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  const fetchPortfolio = async () => {
    if (!user?.walletAddress) return;

    try {
      const url = `http://192.168.1.44:8080/api/blockchain/portfolio/${user.walletAddress}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(t("wallet.errors.server"));
      const data = await response.json();

      const newTotal = Number(data.totalBalanceEur || 0);

      if (prevBalanceRef.current !== 0 && newTotal !== prevBalanceRef.current) {
        if (newTotal > prevBalanceRef.current) {
          setTrend("up");
        } else {
          setTrend("down");
        }
      }

      prevBalanceRef.current = newTotal;
      setPortfolio(data);

      const d = new Date();
      setLastUpdate(
        String(d.getHours()).padStart(2, "0") + ":" +
        String(d.getMinutes()).padStart(2, "0") + ":" +
        String(d.getSeconds()).padStart(2, "0")
      );
    } catch (error) {
      console.error(t("wallet.errors.fetchPortfolio"), error);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (isLogged) {
      setLoadingBalance(true);
      fetchPortfolio();

      const interval = setInterval(() => {
        fetchPortfolio();
      }, 5000);

      return () => clearInterval(interval);
    } else {
      setLoadingBalance(false);
    }
  }, [user?.walletAddress, isLogged, t]);

  const trendStyle = useMemo(() => {
    if (trend === "up") return { color: "#00ff88", icon: "trending-up" };
    if (trend === "down") return { color: "#ff3333", icon: "trending-down" };
    return { color: C.textMain, icon: null };
  }, [trend, C.textMain]);

  if (isLoading || loadingBalance) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const renderContent = () => (
    <>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.welcome}>
            {t("wallet.greeting", { name: user?.firstName || "" })}
          </Text>
          <Text style={styles.miniInfo}>{t("wallet.live")} • {lastUpdate}</Text>
        </View>

        <Pressable onPress={() => setHideBalance(!hideBalance)} style={styles.iconBtn}>
          <MaterialIcons
            name={hideBalance ? "visibility-off" : "visibility"}
            size={22}
            color={C.textMuted}
          />
        </Pressable>
      </View>

      <View style={styles.balanceCardMain}>
        <LinearGradient
          colors={[
            C.isDark ? "rgba(43,238,121,0.05)" : "rgba(43,238,121,0.10)",
            "transparent",
          ]}
          style={styles.balanceGlow}
        />

        <Text style={styles.balanceLabel}>{t("wallet.totalBalance")}</Text>

        <View style={styles.balanceRowTop}>
          <Text
            style={[
              styles.balanceValue,
              { color: (hideBalance || trend === "neutral") ? C.textMain : trendStyle.color }
            ]}
          >
            {hideBalance ? "•••• €" : `${Number(portfolio.totalBalanceEur || 0).toFixed(2)} €`}
          </Text>

          {trendStyle.icon && !hideBalance && (
            <MaterialIcons
              name={trendStyle.icon}
              size={26}
              color={trendStyle.color}
              style={{ marginLeft: 10 }}
            />
          )}
        </View>

        <Text style={styles.addressSub}>
          {user?.walletAddress ? user.walletAddress : t("wallet.noWallet")}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("wallet.yourAssets")}</Text>
          <View style={styles.liveIndicator} />
        </View>

        {(portfolio.assets || []).map((asset, index) => (
          <View key={`${asset.symbol}-${index}`}>
            <View style={styles.assetRow}>
              <View style={styles.assetLeft}>
                <View style={styles.coinBadge}>
                  <Text style={styles.coinBadgeText}>{asset.symbol}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetSub}>
                    {hideBalance
                      ? "••••"
                      : `${Number(asset.cryptoAmount || 0).toFixed(4)} ${asset.symbol}`}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.assetValueEur}>
                    {hideBalance ? "•••• €" : `${Number(asset.valueEur || 0).toFixed(2)} €`}
                  </Text>

                  <View style={styles.changeRow}>
                    <Text
                      style={[
                        styles.assetChange,
                        {
                          color: hideBalance
                            ? C.textMuted
                            : String(asset.change24h || "").includes("-")
                              ? "#ff3333"
                              : "#00ff88",
                        },
                      ]}
                    >
                      {hideBalance ? "••%" : asset.change24h}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {index !== (portfolio.assets || []).length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      <View style={{ height: isWeb ? 20 : NAV_HEIGHT + 20 }} />
    </>
  );

return (
    <View style={[styles.page, { backgroundColor: C.bg }]}>
      <SafeAreaView
        style={[
          common.safe,
          { backgroundColor: C.bg, paddingTop: topInset },
          isWeb && styles.safeWeb,
        ]}
      >
        <View style={styles.flex1}>
          {isWeb ? (
            <View style={styles.webScroll}>
              <View style={styles.scrollContainer}>{renderContent()}</View>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1, backgroundColor: C.bg }}
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>

      <View style={[styles.navWrap, isWeb ? styles.navWrapWeb : styles.navWrapNative]}>
        <Nav />
      </View>
    </View>
  );

};
const makeStyles = (C) =>
  StyleSheet.create({
    flex1: {
      flex: 1,
    },
    page: {
      flex: 1,
      position: "relative",
    },
    safeWeb: {
      height: "100vh",
      overflow: "hidden",
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },

    webScroll: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 90,
      overflowY: "auto",
      scrollbarWidth: "none",
    },
    navWrap: {
      left: 0,
      right: 0,
      bottom: 0,
      height: 90,
      zIndex: 9999,
    },
    navWrapWeb: {
      position: "fixed",
    },
    navWrapNative: {
      position: "absolute",
      backgroundColor: C.bg, 
    },
    scrollContainer: {
      padding: 20,
      paddingBottom: 110, 
    },

    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 25,
    },
    welcome: {
      color: C.textMain,
      fontSize: 28,
      fontWeight: "800",
    },
    miniInfo: {
      color: C.textMuted,
      fontSize: 12,
      fontWeight: "700",
    },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: C.cardBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },

    balanceCardMain: {
      backgroundColor: C.cardBg,
      borderRadius: 28,
      padding: 25,
      borderWidth: 1,
      borderColor: C.border,
      marginBottom: 25,
      overflow: "hidden",
    },
    balanceGlow: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 100,
    },
    balanceLabel: {
      color: C.textMuted,
      fontSize: 13,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    balanceRowTop: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
    },
    balanceValue: {
      fontSize: 34,
      fontWeight: "900",
    },
    addressSub: {
      color: C.isDark ? "rgba(157,185,168,0.3)" : "rgba(15,23,42,0.45)",
      fontSize: 10,
      marginTop: 15,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },

    // --- Lista de Activos ---
    card: {
      backgroundColor: C.cardBg,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: C.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    sectionTitle: {
      color: C.textMain,
      fontSize: 18,
      fontWeight: "800",
    },
    liveIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: C.primary,
      marginLeft: 10,
    },
    assetRow: {
      paddingVertical: 15,
    },
    assetLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    coinBadge: {
      width: 45,
      height: 45,
      borderRadius: 14,
      backgroundColor: C.isDark ? "rgba(43,238,121,0.10)" : "rgba(43,238,121,0.14)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 15,
      borderWidth: 1,
      borderColor: C.isDark ? "rgba(43,238,121,0.20)" : "rgba(43,238,121,0.28)",
    },
    coinBadgeText: {
      color: C.primary,
      fontWeight: "900",
      fontSize: 11,
    },
    assetName: {
      color: C.textMain,
      fontSize: 16,
      fontWeight: "800",
    },
    assetSub: {
      color: C.textMuted,
      fontSize: 13,
      marginTop: 2,
      fontWeight: "700",
    },
    assetValueEur: {
      color: C.textMain,
      fontWeight: "900",
      fontSize: 16,
    },
    changeRow: {
      marginTop: 4,
    },
    assetChange: {
      fontSize: 13,
      fontWeight: "900",
    },
    divider: {
      height: 1,
      backgroundColor: C.isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)",
    },
  });

export default Billetera;