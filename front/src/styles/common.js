import { StyleSheet } from "react-native";
import theme from "./theme";

const common = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.backgroundDark },
  container: { padding: 20, paddingBottom: 40 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: theme.colors.textMuted, marginTop: 10 },
  scrollPadding: { padding: 16 },

  headerRow: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: theme.colors.textMain },

  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  sectionTitle: {
    color: theme.colors.textMain,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },

  newsCard: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(59,84,69,0.5)",
  },
  newsImage: { width: "100%", height: 180, resizeMode: "cover" },
  newsCardContent: { padding: 16 },

  sentimentRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  sentimentLabel: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase" },
  newsSource: { color: theme.colors.textMuted, fontSize: 12 },

  newsTitle: { color: theme.colors.textMain, fontSize: 17, fontWeight: "700", marginBottom: 8 },
  newsSummary: { color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 },

  topicContainer: { flexDirection: "row", marginTop: 12, gap: 8 },
  topicTag: {
    backgroundColor: "rgba(43,238,121,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topicText: { color: theme.colors.primary, fontSize: 10, fontWeight: "bold" },
});

export default common;
