import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ES from "./ES/ES.json";
import EN from "./EN/EN.json";
import CA from "./CA/CA.json";
import FR from "./FR/FR.json";
import DE from "./DE/DE.json";
import CH from "./CH/CH.json";


i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources: {
    ES: { translation: ES },
    EN: { translation: EN },
    CA: { translation: CA },
    FR: { translation: FR },
    DE: { translation: DE },
    CH: { translation: CH }
  },
  lng: "EN",
  fallbackLng: "EN",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
