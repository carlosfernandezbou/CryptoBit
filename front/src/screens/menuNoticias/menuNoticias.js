import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Nav from "../../components/Nav";

import common from "../../styles/common";
import theme from "../../styles/theme";
import getData from "../../services/services";
import { useSettings } from "../../context/SettingsContext";

const COLORS = theme?.colors || theme?.COLORS || theme;
const NAV_HEIGHT = 90;
const isWeb = Platform.OS === "web";

const API_KEY = "698b5155dbadb1.67947020";
const API_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=economy_macro,finance&limit=15&apikey=${API_KEY}`;

const menuNoticias = () => {
  const { t } = useTranslation();
  const { C } = useSettings();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    const data = await getData(API_URL, null);

    if (data && data.feed) {
      setNews(data.feed);
    } else {
      console.log("Error de la API:", data);
    }
    setLoading(false);
  };

  const getSentimentStyle = (score) => {
    if (score > 0.15) return { color: C.primary, label: t("news.sentiment.optimistic") };
    if (score < -0.15) return { color: C.danger, label: t("news.sentiment.bearish") };
    return { color: C.textMuted, label: t("news.sentiment.neutral") };
  };

  return (
    <View style={[common.safe, { backgroundColor: C.bg }, isWeb && styles.safeWeb]}>
      <View style={styles.page}>
        {isWeb ? (
          <View style={styles.webScroll}>
            <View style={[common.headerRow, { paddingTop: Platform.OS === "ios" ? 60 : 40 }]}>
              <Text style={[common.headerTitle, { color: C.textMain }]}>{t("news.headerTitle")}</Text>

              <TouchableOpacity onPress={fetchNews}>
                <MaterialIcons name="refresh" size={24} color={C.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={common.center}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={[common.loadingText, { color: C.textMuted }]}>{t("news.loading")}</Text>
              </View>
            ) : (
              <View style={common.scrollPadding}>
                {news.map((item, index) => {
                  const sentiment = getSentimentStyle(item.overall_sentiment_score);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        common.newsCard,
                        { backgroundColor: C.cardBg, borderColor: C.border },
                      ]}
                      onPress={() => Linking.openURL(item.url)}
                    >
                      {item.banner_image && (
                        <Image source={{ uri: item.banner_image }} style={common.newsImage} />
                      )}

                      <View style={common.newsCardContent}>
                        <View style={common.sentimentRow}>
                          <Text style={[common.sentimentLabel, { color: sentiment.color }]}>
                            {sentiment.label}
                          </Text>
                          <Text style={[common.newsSource, { color: C.textMuted }]}>
                            {item.source} • {item.time_published.slice(0, 8)}
                          </Text>
                        </View>

                        <Text style={[common.newsTitle, { color: C.textMain }]} numberOfLines={2}>
                          {item.title}
                        </Text>

                        <Text style={[common.newsSummary, { color: C.textMuted }]} numberOfLines={3}>
                          {item.summary}
                        </Text>

                        <View style={common.topicContainer}>
                          {item.topics.slice(0, 2).map((t, i) => (
                            <View
                              key={i}
                              style={[
                                common.topicTag,
                                { backgroundColor: C.pillBg, borderColor: C.border },
                              ]}
                            >
                              <Text style={[common.topicText, { color: C.textMain }]}>{t.topic}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 120 }} />
              </View>
            )}
          </View>
        ) : (
          <>
            <View style={[common.headerRow, { paddingTop: Platform.OS === "ios" ? 60 : 40 }]}>
              <Text style={[common.headerTitle, { color: C.textMain }]}>{t("news.headerTitle")}</Text>

              <TouchableOpacity onPress={fetchNews}>
                <MaterialIcons name="refresh" size={24} color={C.primary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={common.center}>
                <ActivityIndicator size="large" color={C.primary} />
                <Text style={[common.loadingText, { color: C.textMuted }]}>{t("news.loading")}</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={common.scrollPadding}>
                {news.map((item, index) => {
                  const sentiment = getSentimentStyle(item.overall_sentiment_score);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        common.newsCard,
                        { backgroundColor: C.cardBg, borderColor: C.border },
                      ]}
                      onPress={() => Linking.openURL(item.url)}
                    >
                      {item.banner_image && (
                        <Image source={{ uri: item.banner_image }} style={common.newsImage} />
                      )}

                      <View style={common.newsCardContent}>
                        <View style={common.sentimentRow}>
                          <Text style={[common.sentimentLabel, { color: sentiment.color }]}>
                            {sentiment.label}
                          </Text>
                          <Text style={[common.newsSource, { color: C.textMuted }]}>
                            {item.source} • {item.time_published.slice(0, 8)}
                          </Text>
                        </View>

                        <Text style={[common.newsTitle, { color: C.textMain }]} numberOfLines={2}>
                          {item.title}
                        </Text>

                        <Text style={[common.newsSummary, { color: C.textMuted }]} numberOfLines={3}>
                          {item.summary}
                        </Text>

                        <View style={common.topicContainer}>
                          {item.topics.slice(0, 2).map((t, i) => (
                            <View
                              key={i}
                              style={[
                                common.topicTag,
                                { backgroundColor: C.pillBg, borderColor: C.border },
                              ]}
                            >
                              <Text style={[common.topicText, { color: C.textMain }]}>{t.topic}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <View style={{ height: 120 }} />
              </ScrollView>
            )}

            <Nav />
          </>
        )}

        {isWeb && (
          <View style={[styles.navWrap, styles.navWrapWeb]}>
            <Nav />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    bottom: NAV_HEIGHT,
    overflowY: "auto",
    overflowX: "hidden",

    scrollbarWidth: "none",
    msOverflowStyle: "none",
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
});

export default menuNoticias;