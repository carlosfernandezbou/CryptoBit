import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from "react-native";
import { Search, ArrowRight, X, Star } from "lucide-react-native";

import Nav from "../../components/Nav";
import common from "../../styles/common";
import Context from '../../context/Context';
import { useSettings } from "../../context/SettingsContext";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const BASE_URL = "http://192.168.1.29:8080";
const isWeb = Platform.OS === 'web';
const NAV_HEIGHT = 90;

const CURRENCY_SYMBOLS = {
  EUR: "€", USD: "$", GBP: "£", JPY: "¥", CHF: "CHF", CNY: "¥", AUD: "$", CAD: "$", NZD: "$",
  MXN: "$", BRL: "R$", ARS: "$", CLP: "$", COP: "$", INR: "₹", KRW: "₩", SGD: "$", HKD: "$",
  THB: "฿", SEK: "kr", NOK: "kr", DKK: "kr", PLN: "zł", TRY: "₺", RUB: "₽", ZAR: "R",
  AED: "د.إ", SAR: "﷼",
};

export default function MenuPrincipal({ navigation }) {
  const { t } = useTranslation();
  const { user } = useContext(Context);
  const { C } = useSettings();
  const styles = useMemo(() => makeStyles(C), [C]);

  const [search, setSearch] = useState("");
  const [cryptos, setCryptos] = useState([]);
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [activeFilter, setActiveFilter] = useState("all");
  const [userCurrency, setUserCurrency] = useState("USD");

  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const isFetching = useRef(false);

  const openCryptoInfo = (crypto) => {
    setSelectedCrypto(crypto);
    setInfoVisible(true);
  };

  const closeCryptoInfo = () => {
    setInfoVisible(false);
    setSelectedCrypto(null);
  };

  const fetchUserSettings = async () => {
    if (!user?.userId) return null;
    try {
      const response = await fetch(`${BASE_URL}/API/Settings/${user.userId}`);
      if (response.ok) {
        const settings = await response.json();
        const cur = settings?.currency ? settings.currency.toUpperCase() : "EUR";
        setUserCurrency(cur);
        return cur;
      }
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const fetchFavorites = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const response = await fetch(`${BASE_URL}/API/SeeFavorites/${user.userId}`);
      if (response.ok) {
        const data = await response.json();
        setFavoritesIds(Array.isArray(data) ? data.map((f) => f.crypto) : []);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user]);

  const CMC_API_KEY = "82ecd83d0cd541108839042bd32f3a55";

  const fetchMarketData = async (currentLimit, currency) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (cryptos.length === 0) setLoading(true);

    const vsCurrency = (currency || "EUR").toUpperCase();

    const geckoUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency.toLowerCase()}&order=market_cap_desc&per_page=${currentLimit}&page=1&sparkline=true`;
    const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=${currentLimit}&convert=${vsCurrency}`;

    try {
      const response = await fetch(isWeb ? geckoUrl : cmcUrl, {
        headers: isWeb
          ? {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
          }
          : {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-CMC_PRO_API_KEY": CMC_API_KEY,
          },
      });

      const data = await response.json();

      if (isWeb && Array.isArray(data)) {
        const formatted = data.map((coin) => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          image: coin.image,
          current_price: coin.current_price,
          price_change_percentage_24h: coin.price_change_percentage_24h,
          market_cap: coin.market_cap,
          market_cap_rank: coin.market_cap_rank,
          total_volume: coin.total_volume,
          high_24h: coin.high_24h,
          low_24h: coin.low_24h,
          sparkline: coin.sparkline_in_7d?.price || [],
        }));
        setCryptos(formatted);
      } else if (!isWeb && data?.data && Array.isArray(data.data)) {
        const formatted = data.data.map((coin) => ({
          id: coin.slug,
          name: coin.name,
          symbol: (coin.symbol || "").toLowerCase(),
          image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`,
          current_price: coin.quote?.[vsCurrency]?.price,
          price_change_percentage_24h: coin.quote?.[vsCurrency]?.percent_change_24h,
          market_cap: coin.quote?.[vsCurrency]?.market_cap,
          market_cap_rank: coin.cmc_rank,
          total_volume: coin.quote?.[vsCurrency]?.volume_24h,
        }));
        setCryptos(formatted);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const refresh = async () => {
        const cur = (await fetchUserSettings()) || userCurrency;
        await fetchMarketData(limit, cur);
        await fetchFavorites();
      };
      refresh();
    }, [limit, userCurrency, fetchFavorites])
  );

  useEffect(() => {
    const init = async () => {
      await fetchUserSettings();
      fetchFavorites();
    };
    init();
  }, [user, fetchFavorites]);

  const handleLoadMore = () => {
    if (!loading) {
      const nextLimit = limit + 10;
      setLimit(nextLimit);
      fetchMarketData(nextLimit, userCurrency);
    }
  };

  const toggleFavorite = async (crypto) => {
    if (!user?.userId) return;
    const isFav = favoritesIds.includes(crypto.id);
    if (!isFav) {
      try {
        const res = await fetch(`${BASE_URL}/API/NewFavorite`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: user.userId, crypto: crypto.id }),
        });
        if (res.ok) setFavoritesIds((prev) => [...prev, crypto.id]);
      } catch (error) {
        Alert.alert(t("common.error"), t("home.alerts.couldNotSaveFavorite"));
      }
    } else {
      try {
        const res = await fetch(`${BASE_URL}/API/RemoveFavorite?clientId=${user.userId}&crypto=${crypto.id}`, { method: "DELETE" });
        if (res.ok) setFavoritesIds((prev) => prev.filter((id) => id !== crypto.id));
      } catch (error) {
        Alert.alert(t("common.error"), t("home.alerts.couldNotRemoveFavorite"));
      }
    }
  };

  const filteredCryptos = useMemo(() => {
    let result = Array.isArray(cryptos) ? [...cryptos] : [];
    if (search && search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((c) => c.name?.toLowerCase().includes(s) || c.symbol?.toLowerCase().includes(s));
    }
    if (activeFilter === "favorites") result = result.filter((c) => favoritesIds.includes(c.id));
    else if (activeFilter === "gainers") {
      result = result.filter((c) => (c.price_change_percentage_24h || 0) > 0).sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    } else if (activeFilter === "losers") {
      result = result.filter((c) => (c.price_change_percentage_24h || 0) < 0).sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h);
    }
    return result;
  }, [cryptos, search, activeFilter, favoritesIds]);

  const MainContent = () => (
    <View style={styles.flex1}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={20} color={C.textMuted} style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("home.searchPlaceholder")}
              placeholderTextColor={C.textMuted}
              style={styles.input}
            />
            {search !== "" && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={18} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {["all", "favorites", "gainers", "losers"].map((filterKey) => (
            <TouchableOpacity
              key={filterKey}
              onPress={() => setActiveFilter(filterKey)}
              style={[styles.chip, activeFilter === filterKey && styles.chipActive]}
            >
              <Text style={[styles.chipText, activeFilter === filterKey && styles.chipTextActive]}>
                {t(`home.filters.${filterKey}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.sections.trending")}</Text>
        </View>

        {loading && cryptos.length === 0 ? (
          <ActivityIndicator color={C.primary} style={styles.loadingMargin} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.75}
            decelerationRate="fast"
            contentContainerStyle={styles.trendingScroll}
          >
            {cryptos.slice(0, 5).map((item) => (
              <TrendingCard
                key={item.id}
                item={item}
                C={C}
                styles={styles}
                currencySymbol={CURRENCY_SYMBOLS[userCurrency] || userCurrency}
                onPress={() => openCryptoInfo(item)}
              />
            ))}
          </ScrollView>
        )}

        <View style={styles.marketSection}>
          <View style={styles.sectionHeaderList}>
            <Text style={styles.sectionTitle}>
              {activeFilter === "all"
                ? t("home.sections.cryptos")
                : t("home.sections.topFilter", { filter: t(`home.filters.${activeFilter}`) })}
            </Text>
          </View>

          <View style={styles.marketList}>
            {filteredCryptos.length > 0 ? (
              filteredCryptos.map((item) => (
                <MarketItem
                  key={item.id}
                  item={item}
                  isFav={favoritesIds.includes(item.id)}
                  onFavPress={() => toggleFavorite(item)}
                  onPress={() => openCryptoInfo(item)}
                  C={C}
                  styles={styles}
                  currencySymbol={CURRENCY_SYMBOLS[userCurrency] || userCurrency}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                {loading ? <ActivityIndicator color={C.primary} /> : <Text style={styles.emptyText}>{t("home.empty.noData")}</Text>}
              </View>
            )}
          </View>

          {activeFilter === "all" && filteredCryptos.length > 0 && (
            <TouchableOpacity
              style={[styles.seeMoreBottom, loading && styles.opacity05]}
              onPress={handleLoadMore}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color={C.primary} /> : (
                <>
                  <Text style={styles.seeMoreText}>{t("home.actions.loadMore")}</Text>
                  <ArrowRight size={16} color={C.primary} />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CryptoInfoModal
        visible={infoVisible}
        crypto={selectedCrypto}
        onClose={closeCryptoInfo}
        C={C}
        styles={styles}
        currencySymbol={CURRENCY_SYMBOLS[userCurrency] || userCurrency}
      />
    </View>
  );

  return (
    <View style={[styles.flex1, { backgroundColor: C.bg }]}>
      {isWeb ? (
        <SafeAreaView style={[common.safe, styles.safeWeb]}>
          <View style={styles.page}>
            <View style={[styles.webScroll, { height: "100vh", overflow: "auto" }]}>
              {MainContent()}
            </View>
            <View style={[styles.navWrap, styles.navWrapWeb]}>
              <Nav />
            </View>
          </View>
        </SafeAreaView>
      ) : (
        <>
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <View style={styles.flex1}>
              {MainContent()}
            </View>
          </SafeAreaView>
          <View style={styles.mobileNavFixed}>
            <Nav />
          </View>
        </>
      )}
    </View>
  );
}

const TrendingCard = ({ item, C, styles, currencySymbol, onPress }) => {
  const isPositive = (item.price_change_percentage_24h || 0) >= 0;
  return (
    <TouchableOpacity style={styles.trendingCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View style={styles.coinInfo}>
          <Image source={{ uri: item.image }} style={styles.coinLogo} />
          <View>
            <Text style={styles.coinName}>{item.name}</Text>
            <Text style={styles.coinSymbol}>{String(item.symbol || "").toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: isPositive ? "rgba(43,238,121,0.15)" : "rgba(255,92,92,0.15)" }]}>
          <Text style={[styles.badgeText, { color: isPositive ? C.primary : C.danger }]}>
            {isPositive ? "↑" : "↓"} {Number(item.price_change_percentage_24h || 0).toFixed(2)}%
          </Text>
        </View>
      </View>
      <Text style={styles.cardPrice}>
        {item.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
      </Text>
    </TouchableOpacity>
  );
};

const MarketItem = ({ item, isFav, onFavPress, onPress, C, styles, currencySymbol }) => {
  const isPositive = (item.price_change_percentage_24h || 0) >= 0;
  return (
    <TouchableOpacity style={styles.marketItem} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.marketInfo}>
        <Image source={{ uri: item.image }} style={styles.marketIcon} />
        <View>
          <Text style={styles.marketName}>{item.name}</Text>
          <Text style={styles.marketSymbol}>{String(item.symbol || "").toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.rightAction}>
        <View style={styles.marketValues}>
          <Text style={styles.marketPrice}>
            {item.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
          </Text>
          <Text style={[styles.marketChange, { color: isPositive ? C.primary : C.danger }]}>
            {isPositive ? "+" : ""}{Number(item.price_change_percentage_24h || 0).toFixed(2)}%
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            onFavPress();
          }}
          style={styles.starBtn}
        >
          <Star size={20} color={isFav ? "#FFD700" : C.textMuted} fill={isFav ? "#FFD700" : "transparent"} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const CryptoInfoModal = ({ visible, crypto, onClose, C, styles, currencySymbol }) => {
  if (!crypto) return null;

  const isPositive = (crypto.price_change_percentage_24h || 0) >= 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.cryptoModal}>
          <View style={styles.modalHeader}>
            <View style={styles.coinInfo}>
              <Image source={{ uri: crypto.image }} style={styles.marketIcon} />
              <View>
                <Text style={styles.modalTitle}>{crypto.name}</Text>
                <Text style={styles.coinSymbol}>{String(crypto.symbol || "").toUpperCase()}</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={22} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <MiniChart data={crypto.sparkline} C={C} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Precio actual</Text>
            <Text style={styles.infoValue}>
              {crypto.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cambio 24h</Text>
            <Text style={[styles.infoValue, { color: isPositive ? C.primary : C.danger }]}>
              {isPositive ? "+" : ""}{Number(crypto.price_change_percentage_24h || 0).toFixed(2)}%
            </Text>
          </View>

          {crypto.market_cap_rank && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ranking</Text>
              <Text style={styles.infoValue}>#{crypto.market_cap_rank}</Text>
            </View>
          )}

          {crypto.market_cap && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Capitalización</Text>
              <Text style={styles.infoValue}>
                {crypto.market_cap.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currencySymbol}
              </Text>
            </View>
          )}

          {crypto.total_volume && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Volumen 24h</Text>
              <Text style={styles.infoValue}>
                {crypto.total_volume.toLocaleString(undefined, { maximumFractionDigits: 0 })} {currencySymbol}
              </Text>
            </View>
          )}

          {crypto.high_24h && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Máximo 24h</Text>
              <Text style={styles.infoValue}>
                {crypto.high_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
              </Text>
            </View>
          )}

          {crypto.low_24h && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mínimo 24h</Text>
              <Text style={styles.infoValue}>
                {crypto.low_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const MiniChart = ({ data, C }) => {
  if (!data || data.length < 2) return null;

  const width = 300;
  const height = 90;
  const max = Math.max(...data);
  const min = Math.min(...data);

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={{ marginVertical: 16, alignItems: "center" }}>
      <svg width={width} height={height}>
        <polyline
          points={points}
          fill="none"
          stroke={C.primary}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 6 }}>
        Evolución últimos 7 días
      </Text>
    </View>
  );
};

const makeStyles = (C) => StyleSheet.create({
  flex1: {
    flex: 1,
  },
  page: {
    flex: 1,
    position: "relative",
    backgroundColor: C.bg,
  },
  safeWeb: {
    height: "100vh",
    overflow: "hidden",
  },

  webScroll: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: NAV_HEIGHT,
  },
  navWrap: {
    left: 0,
    right: 0,
    bottom: 0,
    height: NAV_HEIGHT,
    zIndex: 9999,
  },
  navWrapWeb: {
    position: "fixed",
  },
  mobileNavFixed: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.cardBg,
    zIndex: 10,
  },

  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: C.textMain,
    fontSize: 15,
    fontWeight: "500",
  },

  chipsScroll: {
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 12,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primarySoft || C.primary,
  },
  chipText: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#000000",
  },

  sectionHeader: {
    paddingHorizontal: 24,
    marginTop: 10,
  },
  sectionHeaderList: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: C.textMain,
  },

  trendingScroll: {
    paddingLeft: 24,
    paddingVertical: 15,
  },
  trendingCard: {
    width: 280,
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: C.textMain,
    marginTop: 15,
  },

  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  coinName: {
    color: C.textMain,
    fontSize: 16,
    fontWeight: "bold",
  },
  coinSymbol: {
    color: C.textMuted,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  marketSection: {
    marginTop: 10,
  },
  marketList: {
    paddingHorizontal: 24,
  },
  marketItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
  },
  marketInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  marketIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  marketName: {
    color: C.textMain,
    fontSize: 16,
    fontWeight: "bold",
  },
  marketSymbol: {
    color: C.textMuted,
    fontSize: 13,
  },
  rightAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  marketValues: {
    alignItems: "flex-end",
  },
  marketPrice: {
    color: C.textMain,
    fontSize: 16,
    fontWeight: "bold",
  },
  marketChange: {
    fontSize: 14,
    fontWeight: "600",
  },
  starBtn: {
    padding: 5,
  },

  seeMoreBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 15,
    backgroundColor: C.isDark ? "rgba(43,238,121,0.05)" : "rgba(43,238,121,0.1)",
    borderRadius: 16,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  seeMoreText: {
    color: C.primary,
    fontSize: 15,
    fontWeight: "700",
  },

  emptyContainer: {
    paddingVertical: 40,
  },
  emptyText: {
    color: C.textMuted,
    textAlign: "center",
    marginTop: 30,
    fontSize: 14,
  },
  loadingMargin: {
    marginTop: 30,
  },
  opacity05: {
    opacity: 0.5,
  },
  bottomSpacer: {
    height: 110,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  cryptoModal: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: C.cardBg,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  modalTitle: {
    color: C.textMain,
    fontSize: 20,
    fontWeight: "900",
  },
  modalCloseBtn: {
    padding: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 12,
  },
  infoLabel: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  infoValue: {
    color: C.textMain,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "right",
    flex: 1,
  },
  modalButton: {
    backgroundColor: C.primary,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  modalButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "900",
  },
});