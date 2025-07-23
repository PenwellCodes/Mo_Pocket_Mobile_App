import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import axiosInstance from "@/api/axiosInstance";

export default function WithdrawPage() {
  const [loading, setLoading] = useState(false);
  const [loadingVaultInfo, setLoadingVaultInfo] = useState(true);
  const [message, setMessage] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [withdrawableDeposits, setWithdrawableDeposits] = useState([]);
  const [selectedDeposits, setSelectedDeposits] = useState([]);
  const [formData, setFormData] = useState({ phoneNumber: "" });

  useEffect(() => {
    fetchVaultInfo();
    fetchWithdrawableDeposits();
  }, []);

  const fetchVaultInfo = async () => {
    try {
      setLoadingVaultInfo(true);
      const response = await axiosInstance.get("/api/vault-info");
      setVaultInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vault info:", error);
      setMessage({
        type: "error",
        text: "Failed to load vault information. Please try again.",
      });
    } finally {
      setLoadingVaultInfo(false);
    }
  };

  const fetchWithdrawableDeposits = async () => {
    try {
      const response = await axiosInstance.get("/api/withdrawable-deposits");
      setWithdrawableDeposits(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch withdrawable deposits:", error);
      setMessage({
        type: "error",
        text: "Failed to load withdrawable deposits. Please try again.",
      });
    }
  };

  const handleInputChange = (text) => {
    setFormData({ phoneNumber: text });
    if (message) setMessage(null);
  };

  const handleDepositSelection = (depositId) => {
    setSelectedDeposits((prev) => {
      if (prev.includes(depositId)) {
        return prev.filter((id) => id !== depositId);
      } else {
        return [...prev, depositId];
      }
    });
    if (message) setMessage(null);
  };

  const selectAllDeposits = () => {
    const allDepositIds = withdrawableDeposits
      .filter((d) => d.canWithdraw)
      .map((d) => d.depositId);
    setSelectedDeposits(allDepositIds);
  };

  const clearAllSelections = () => {
    setSelectedDeposits([]);
  };

  const calculateTotals = () => {
    const selectedData = withdrawableDeposits.filter((d) =>
      selectedDeposits.includes(d.depositId)
    );
    const totalOriginal = selectedData.reduce((sum, d) => sum + d.amount, 0);
    const totalFees = selectedData.length * 5; // E5 per deposit
    const totalPenalties = selectedData.reduce((sum, d) => sum + d.penalty, 0);
    const totalNet = selectedData.reduce((sum, d) => sum + d.netAmount, 0);

    return {
      totalOriginal,
      totalFees,
      totalPenalties,
      totalNet,
      depositsCount: selectedData.length,
    };
  };

  const validateForm = () => {
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: "error", text: "Phone number is required." });
      return false;
    }
    if (selectedDeposits.length === 0) {
      setMessage({ type: "error", text: "Select at least one deposit to withdraw." });
      return false;
    }
    return true;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await axiosInstance.post("/api/withdraw", {
        phoneNumber: formData.phoneNumber,
        depositIds: selectedDeposits,
      });

      if (response.data.success) {
        const data = response.data.data;
        setMessage({
          type: "success",
          text:
            `Withdrawals processed successfully!\n` +
            `Total Withdrawn: E${data.totalWithdrawn}\n` +
            `Total Fees: E${data.totalFees}\n` +
            `Total Penalties: E${data.totalPenalties}\n` +
            `Deposits Processed: ${data.depositsProcessed}\n` +
            `Reference ID: ${data.referenceId}`,
        });

        setFormData({ phoneNumber: "" });
        setSelectedDeposits([]);
        fetchVaultInfo();
        fetchWithdrawableDeposits();
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Withdrawal failed. Please try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (loadingVaultInfo) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading vault information...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Individual Deposit Withdrawal</Text>

        {/* Vault Info */}
        {vaultInfo && (
          <View style={styles.vaultInfo}>
            <View style={styles.vaultHeader}>
              <FontAwesome name="info-circle" size={18} color="#2563EB" />
              <Text style={styles.vaultHeaderText}>Vault Summary</Text>
            </View>
            <View style={styles.vaultDetails}>
              <View style={styles.vaultDetailItem}>
                <Text style={styles.vaultLabel}>Total Locked:</Text>
                <Text style={styles.vaultValue}>
                  E{vaultInfo.depositSummary?.totalLockedAmount?.toFixed(2) || "0.00"}
                </Text>
              </View>
              <View style={styles.vaultDetailItem}>
                <Text style={styles.vaultLabel}>Total Deposits:</Text>
                <Text style={styles.vaultValue}>
                  {vaultInfo.depositSummary?.totalDeposits || 0}
                </Text>
              </View>
              <View style={styles.vaultDetailItem}>
                <Text style={styles.vaultLabel}>Withdrawable:</Text>
                <Text style={[styles.vaultValue, { color: "#16A34A" }]}>
                  {vaultInfo.depositSummary?.withdrawableDepositsCount || 0}
                </Text>
              </View>
              <View style={styles.vaultDetailItem}>
                <Text style={styles.vaultLabel}>Vault Balance:</Text>
                <Text style={styles.vaultValue}>
                  E{vaultInfo.vault?.balance?.toFixed(2) || "0.00"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Phone Number Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="76123456 or 26876123456"
            keyboardType="phone-pad"
            value={formData.phoneNumber}
            onChangeText={handleInputChange}
            editable={!loading}
            maxLength={15}
          />
          <Text style={styles.hintText}>Enter Eswatini mobile number (76, 78, or 79 prefix)</Text>
        </View>

        {/* Deposit Selection Header */}
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Select Deposits to Withdraw</Text>
          <View style={styles.selectionButtons}>
            <TouchableOpacity onPress={selectAllDeposits} disabled={loading}>
              <Text style={[styles.selectionButtonText, loading && styles.disabledText]}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearAllSelections} disabled={loading}>
              <Text style={[styles.selectionButtonText, loading && styles.disabledText]}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deposits List */}
        {withdrawableDeposits.length === 0 ? (
          <View style={styles.noDepositsContainer}>
            <FontAwesome name="exclamation-triangle" size={48} color="#9CA3AF" />
            <Text style={styles.noDepositsText}>No withdrawable deposits found</Text>
            <Text style={styles.noDepositsSubtext}>Make a deposit first or wait for lock period to mature</Text>
          </View>
        ) : (
          <View style={styles.depositsList}>
            {withdrawableDeposits.map((deposit) => {
              const isSelected = selectedDeposits.includes(deposit.depositId);
              return (
                <TouchableOpacity
                  key={deposit.depositId}
                  style={[
                    styles.depositItem,
                    isSelected && styles.depositItemSelected,
                    !deposit.canWithdraw && styles.depositItemDisabled,
                  ]}
                  onPress={() => deposit.canWithdraw && handleDepositSelection(deposit.depositId)}
                  disabled={!deposit.canWithdraw || loading}
                >
                  <View style={styles.depositInfo}>
                    {deposit.canWithdraw ? (
                      isSelected ? (
                        <FontAwesome name="check-square" size={24} color="#2563EB" />
                      ) : (
                        <FontAwesome name="square" size={24} color="#9CA3AF" />
                      )
                    ) : (
                      <FontAwesome name="clock-o" size={24} color="#9CA3AF" />
                    )}
                    <View style={styles.depositTextContainer}>
                      <View style={styles.depositAmountRow}>
                        <FontAwesome name="money" size={18} color="#16A34A" />
                        <Text style={styles.depositAmount}>E{deposit.amount.toFixed(2)}</Text>
                        <Text style={styles.depositLockPeriod}>
                          ({deposit.lockPeriodInDays} day{deposit.lockPeriodInDays !== 1 ? "s" : ""})
                        </Text>
                      </View>
                      <Text style={styles.depositDate}>
                        Deposited: {new Date(deposit.depositDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.depositSummary}>
                    <Text style={styles.netAmount}>E{deposit.netAmount.toFixed(2)}</Text>
                    <View style={styles.depositDetails}>
                      {deposit.penalty > 0 && (
                        <Text style={styles.penalty}>Penalty: E{deposit.penalty.toFixed(2)}</Text>
                      )}
                      <Text>Fee: E{deposit.flatFee}</Text>
                      {deposit.isEarlyWithdrawal && <Text style={styles.earlyWithdrawal}>Early withdrawal</Text>}
                      {deposit.hoursUntilMaturity > 0 && (
                        <Text>Matures in: {deposit.hoursUntilMaturity}h</Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selection Summary */}
        {selectedDeposits.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Withdrawal Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Deposits Selected:</Text>
                <Text style={styles.summaryValue}>{totals.depositsCount}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Original:</Text>
                <Text style={styles.summaryValue}>E{totals.totalOriginal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Fees:</Text>
                <Text style={[styles.summaryValue, styles.negativeValue]}>-E{totals.totalFees.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Penalties:</Text>
                <Text style={[styles.summaryValue, styles.negativeValue]}>-E{totals.totalPenalties.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>You will receive:</Text>
              <Text style={styles.summaryTotalValue}>E{totals.totalNet.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Message */}
        {message && (
          <View
            style={[
              styles.messageBox,
              message.type === "success" ? styles.messageSuccess : styles.messageError,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        )}

        {/* Withdraw Button */}
        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={loading || selectedDeposits.length === 0}
          style={[
            styles.withdrawButton,
            (loading || selectedDeposits.length === 0) ? styles.buttonDisabled : styles.buttonEnabled,
          ]}
        >
          {loading ? (
            <>
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.withdrawButtonText}>Processing Withdrawals...</Text>
            </>
          ) : (
            <>
              <FontAwesome name="arrow-circle-down" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.withdrawButtonText}>
                Withdraw Selected Deposits ({selectedDeposits.length})
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Individual Deposit Withdrawal System:</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Each deposit is processed individually with its own fees</Text>
            <Text style={styles.infoItem}>• Flat fee: E5 per deposit withdrawal</Text>
            <Text style={styles.infoItem}>• Early withdrawal penalty: 10% of deposit amount (all lock periods)</Text>
            <Text style={styles.infoItem}>• No waiting period - withdraw immediately after deposit</Text>
            <Text style={styles.infoItem}>• Select specific deposits you want to withdraw from</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#2563EB",
    fontSize: 16,
  },
  container: {
    padding: 16,
    backgroundColor: "#F9FAFB",
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 16,
  },
  vaultInfo: {
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  vaultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  vaultHeaderText: {
    color: "#2563EB",
    fontWeight: "600",
    marginLeft: 6,
  },
  vaultDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  vaultDetailItem: {
    flexBasis: "48%",
    marginBottom: 8,
  },
  vaultLabel: {
    color: "#4B5563",
    fontSize: 14,
  },
  vaultValue: {
    fontWeight: "700",
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#111827",
  },
  hintText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#1F2937",
  },
  selectionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  selectionButtonText: {
    color: "#2563EB",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledText: {
    color: "#9CA3AF",
  },
  noDepositsContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noDepositsText: {
    fontSize: 18,
    color: "#9CA3AF",
    marginTop: 8,
  },
  noDepositsSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  depositsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  depositItem: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  depositItemSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  depositItemDisabled: {
    opacity: 0.5,
  },
  depositInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  depositTextContainer: {
    marginLeft: 12,
  },
  depositAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  depositAmount: {
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 4,
  },
  depositLockPeriod: {
    marginLeft: 8,
    fontSize: 12,
    color: "#6B7280",
  },
  depositDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  depositSummary: {
    alignItems: "flex-end",
  },
  netAmount: {
    fontWeight: "700",
    fontSize: 16,
    color: "#16A34A",
  },
  depositDetails: {
    marginTop: 4,
    alignItems: "flex-end",
  },
  penalty: {
    color: "#DC2626",
    fontSize: 12,
  },
  earlyWithdrawal: {
    color: "#EA580C",
    fontSize: 12,
  },
  summaryBox: {
    backgroundColor: "#DCFCE7",
    borderRadius: 10,
    padding: 12,
    borderColor: "#BBF7D0",
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#15803D",
    marginBottom: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryItem: {
    flexBasis: "48%",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#4B5563",
  },
  summaryValue: {
    fontWeight: "700",
    fontSize: 14,
  },
  negativeValue: {
    color: "#DC2626",
  },
  summaryTotal: {
    borderTopColor: "#BBF7D0",
    borderTopWidth: 1,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryTotalLabel: {
    fontWeight: "700",
    color: "#15803D",
    fontSize: 16,
  },
  summaryTotalValue: {
    fontWeight: "900",
    color: "#22C55E",
    fontSize: 18,
  },
  messageBox: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  messageSuccess: {
    backgroundColor: "#DCFCE7",
    borderColor: "#BBF7D0",
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FECACA",
    borderWidth: 1,
  },
  messageText: {
    color: "#991B1B",
  },
  withdrawButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  buttonEnabled: {
    backgroundColor: "#2563EB",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  withdrawButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
  },
  infoTitle: {
    fontWeight: "700",
    marginBottom: 6,
  },
  infoList: {
    marginLeft: 12,
  },
  infoItem: {
    fontSize: 12,
    marginBottom: 4,
  },
});
