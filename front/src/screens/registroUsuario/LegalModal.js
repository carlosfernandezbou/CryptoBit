import React from "react";
import { Modal, View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export default function LegalModal({
  visible,
  onClose,
  title,
  content,
  colors,
}) {
  const COLORS = colors || {};
  const isWeb = Platform.OS === "web";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            {
              backgroundColor: COLORS.cardBg || COLORS.inputBg || "#111",
              borderColor: COLORS.border || "rgba(255,255,255,0.08)",
            },
            isWeb && { maxHeight: "80vh" },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: COLORS.textMain || "#fff" }]} numberOfLines={2}>
              {title}
            </Text>

            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={COLORS.textMuted || "rgba(255,255,255,0.7)"} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={!isWeb}
          >
            <Text style={[styles.content, { color: COLORS.textMuted || "rgba(255,255,255,0.75)" }]}>
              {content}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={[
                styles.primaryBtn,
                { backgroundColor: COLORS.primary || "#2BEE79" },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: COLORS.bg || COLORS.backgroundDark || "#000" }]}>
                Entendido
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    maxHeight: 560,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: { flex: 1, fontSize: 18, fontWeight: "900" },
  closeBtn: { padding: 6 },
  body: { paddingHorizontal: 16, paddingTop: 6 },
  content: { fontSize: 14, lineHeight: 20 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  primaryBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "900" },
});