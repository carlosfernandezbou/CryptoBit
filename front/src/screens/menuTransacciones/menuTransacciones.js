import React, { useMemo, useState, useContext, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../context/SettingsContext";

import Nav from "../../components/Nav";
import common from "../../styles/common";
import Context from "../../context/Context";

const BASE_URL = "http://192.168.1.44:8080";

export default function MenuTransacciones({ navigation }) {
  const { t } = useTranslation();
  const { user, isLogged } = useContext(Context);
  const { C } = useSettings();

  const styles = useMemo(() => makeStyles(C), [C]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false); // Estado para la carga del envío
  const [transactions, setTransactions] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [walletAddress, setWalletAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [senderPrivKey, setSenderPrivKey] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (!user?.userId || !isLogged) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/blockchain/MyTransactions/${user.userId}`);
      if (response.ok) {
        const data = await response.json();
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => new Date(b.date) - new Date(a.date))
          : [];
        setTransactions(sorted);
      }
    } catch (error) {
      console.warn(t("transactions.errors.fetchTransactions"), error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId, isLogged, t]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter(tx =>
      tx.receiverId?.toLowerCase().includes(q) ||
      tx.senderId?.toLowerCase().includes(q)
    );
  }, [search, transactions]);

  const handleTransfer = async () => {
    if (!walletAddress || !amount || !senderPrivKey) {
      Alert.alert(t("common.error"), t("transactions.alerts.fillAllFields"));
      return;
    }

    setSending(true); // Iniciamos carga

    try {
      // Usamos la lógica directa que confirmaste que funciona
      const res = await fetch(`${BASE_URL}/api/blockchain/Transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: user.userId,
          receiverId: walletAddress,
          amount: parseFloat(amount),
          crypto: "ETH",
          type: "TRANSFER",
          privateKey: senderPrivKey,
        }),
      });

      if (res.ok) {
        Alert.alert(t("transactions.alerts.successTitle"), t("transactions.alerts.transferOk"));
        setModalVisible(false);
        setWalletAddress("");
        setAmount("");
        setSenderPrivKey("");
        fetchTransactions();
      } else {
        const msg = await res.text();
        Alert.alert(t("common.error"), msg || t("transactions.alerts.transactionError"));
      }
    } catch (e) {
      Alert.alert(t("common.error"), t("transactions.alerts.serverError"));
    } finally {
      setSending(false); // Finalizamos carga
    }
  };

  const renderContent = () => (
    <View style={styles.flex1}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={C.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("transactions.headerTitle")}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={C.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("transactions.searchPlaceholder")}
            placeholderTextColor={C.textMuted}
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionTitle}>{t("transactions.sections.quickActions")}</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.actionIcon}>
            <MaterialIcons name="send" size={20} color={C.primary} />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.actionTitle}>{t("transactions.sendFunds.title")}</Text>
            <Text style={styles.actionSub}>{t("transactions.sendFunds.subtitle")}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={C.textMuted} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t("transactions.sections.recentMovements")}</Text>
        <View style={styles.listCard}>
          {loading ? (
            <ActivityIndicator color={C.primary} style={styles.loader} />
          ) : filteredTransactions.length === 0 ? (
            <Text style={styles.emptyText}>{t("transactions.empty.noTransactions")}</Text>
          ) : (
            filteredTransactions.map((tx, idx) => {
              const isSend = tx.senderId === user?.userId;
              return (
                <View key={idx} style={[styles.txRow, idx !== 0 && styles.txBorder]}>
                  <View style={[styles.txIconCircle, { backgroundColor: isSend ? 'rgba(255,51,51,0.1)' : 'rgba(0,255,136,0.1)' }]}>
                    <MaterialIcons
                      name={isSend ? "north-east" : "south-west"}
                      size={20}
                      color={isSend ? C.danger : C.primary}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>
                      {isSend ? t("transactions.movement.sent") : t("transactions.movement.received")}
                    </Text>
                    <Text style={styles.txWallet} numberOfLines={1}>
                      {isSend
                        ? `${t("transactions.movement.to")}: ${tx.receiverId}`
                        : `${t("transactions.movement.from")}: ${tx.senderId}`}
                    </Text>
                    <Text style={styles.txDate}>
                      {tx.date ? new Date(tx.date).toLocaleDateString() : t("transactions.movement.recent")}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isSend ? C.danger : C.primary }]}>
                    {isSend ? "-" : "+"}{tx.amount} ETH
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("transactions.modal.title")}</Text>

            <Text style={styles.modalLabel}>{t("transactions.modal.destinationAddress")}</Text>
            <TextInput
              placeholder={t("transactions.modal.placeholders.destination")}
              style={styles.modalInput}
              value={walletAddress}
              onChangeText={setWalletAddress}
              placeholderTextColor={C.textMuted}
              autoCapitalize="none"
              editable={!sending}
            />

            <Text style={styles.modalLabel}>{t("transactions.modal.amount")}</Text>
            <TextInput
              placeholder={t("transactions.modal.placeholders.amount")}
              keyboardType="text"
              style={styles.modalInput}
              value={amount}
              onChangeText={setAmount}
              placeholderTextColor={C.textMuted}
              editable={!sending}
            />

            <Text style={styles.modalLabel}>{t("transactions.modal.privateKey")}</Text>
            <TextInput
              placeholder={t("transactions.modal.placeholders.privateKey")}
              secureTextEntry
              style={styles.modalInput}
              value={senderPrivKey}
              onChangeText={setSenderPrivKey}
              placeholderTextColor={C.textMuted}
              editable={!sending}
            />

            <TouchableOpacity
              style={[styles.confirmBtn, sending && styles.btnDisabled]}
              onPress={handleTransfer}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.confirmBtnText}>{t("transactions.modal.confirm")}</Text>
              )}
            </TouchableOpacity>

            {!sending && (
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>{t("transactions.modal.close")}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
      <View style={[styles.flex1, { backgroundColor: C.bg }]}>
          <SafeAreaView style={{ flex: 1 }}>
              {renderContent()}
          </SafeAreaView>
          <View style={styles.mobileNavFixed}>
              <Nav />
          </View>
      </View>
    );
  }

const makeStyles = (C) => StyleSheet.create({
  flex1: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
    justifyContent: 'space-between'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textMain
  },
  headerSpacer: {
    width: 44
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 120
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginTop: 10,
    borderWidth: 1,
    borderColor: C.border
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: C.textMain,
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.textMain,
    marginTop: 35,
    marginBottom: 15
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(43,238,121,0.1)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionTitle: {
    marginLeft: 15,
    fontWeight: '800',
    color: C.textMain,
    fontSize: 16
  },
  actionSub: {
    marginLeft: 15,
    color: C.textMuted,
    fontSize: 13,
    marginTop: 2
  },
  listCard: {
    backgroundColor: C.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden'
  },
  loader: {
    margin: 30
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18
  },
  txBorder: {
    borderTopWidth: 1,
    borderTopColor: C.border
  },
  txIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center'
  },
  txInfo: {
    flex: 1,
    marginLeft: 15
  },
  txTitle: {
    fontWeight: '800',
    color: C.textMain,
    fontSize: 15
  },
  txWallet: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  txDate: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2
  },
  txAmount: {
    fontWeight: '900',
    fontSize: 16
  },
  emptyText: {
    textAlign: 'center',
    padding: 50,
    color: C.textMuted,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: C.cardBg,
    borderRadius: 35,
    padding: 28,
    borderWidth: 1,
    borderColor: C.border
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: C.textMain,
    marginBottom: 30,
    textAlign: 'center'
  },
  modalLabel: {
    color: C.textMain,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '700',
    marginLeft: 4
  },
  modalInput: {
    backgroundColor: C.bg,
    borderRadius: 16,
    padding: 18,
    color: C.textMain,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border
  },
  confirmBtn: {
    backgroundColor: C.primary,
    padding: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: C.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 17
  },
  btnDisabled: {
    opacity: 0.6
  },
  cancelBtn: {
    marginTop: 20,
    padding: 10
  },
  cancelBtnText: {
    color: C.textMuted,
    textAlign: 'center',
    fontWeight: '700'
  }
});