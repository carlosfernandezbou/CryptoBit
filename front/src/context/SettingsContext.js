import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import theme from "../styles/theme";
import Context from "./Context";
import i18n from "../../assets/i18n";

const SettingsContext = createContext(null);

const BASE_URL = "http://192.168.1.44:8080";

function buildPalette(isDark) {
  if (isDark) {
    return {
      isDark: true,
      bg: theme.colors.backgroundDark,
      cardBg: theme.colors.cardBg,
      inputBg: theme.colors.inputBg,
      border: theme.colors.border,
      textMain: theme.colors.textMain,
      textMuted: theme.colors.textMuted,
      primary: theme.colors.primary,
      danger: theme.colors.danger,
      dangerSoft: theme.colors.dangerSoft,
      modalBg: theme.colors.cardBg,
      chevron: "rgba(255,255,255,0.20)",
      shadow: "#000",
      navBg: "rgba(13, 26, 18, 0.98)",
      navBorder: "rgba(255,255,255,0.05)",
    };
  }

  return {
    isDark: false,
    bg: theme.colors.backgroundLight,
    cardBg: theme.colors.cardBgLight,
    inputBg: theme.colors.inputBgLight,
    border: theme.colors.borderLight,
    textMain: theme.colors.textMainLight,
    textMuted: theme.colors.textMutedLight,
    primary: theme.colors.primary,
    danger: theme.colors.danger,
    dangerSoft: "rgba(255,92,92,0.10)",
    modalBg: "#ffffff",
    chevron: "rgba(15, 23, 42, 0.25)",
    shadow: "rgba(15,23,42,0.25)",
    navBg: "rgba(255,255,255,0.98)",
    navBorder: "rgba(15,23,42,0.10)",
  };
}

export function SettingsProvider({ children }) {
  const { userId } = useContext(Context);

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [currency, setCurrency] = useState("USD");
  const [faceId, setFaceId] = useState(true);

  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    if (!userId) return;

    const loadSettings = async () => {
      try {
        const res = await fetch(`${BASE_URL}/API/Settings/${userId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (typeof data.theme === "boolean") setIsDarkMode(data.theme);
        if (typeof data.faceId === "boolean") setFaceId(data.faceId);
        if (data.language) setLanguage(data.language);
        if (data.currency) setCurrency(data.currency);
      } catch (e) {
        console.log("LOAD SETTINGS EXCEPTION", e);
      }
    };

    loadSettings();
  }, [userId]);

  const saveSettings = async (partial) => {
    if (!userId) return;

    const payload = {
      userId,
      theme: isDarkMode,
      language,
      currency,
      faceId,
      ...partial,
    };

    try {
      await fetch(`${BASE_URL}/API/EditSettings/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.log("SAVE SETTINGS EXCEPTION", e);
    }
  };

  const palette = useMemo(() => buildPalette(isDarkMode), [isDarkMode]);

  const value = useMemo(
    () => ({
      isDarkMode,
      setIsDarkMode,
      language,
      setLanguage,
      currency,
      setCurrency,
      faceId,
      setFaceId,
      saveSettings,
      C: palette,
    }),
    [isDarkMode, language, currency, faceId, palette]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}
