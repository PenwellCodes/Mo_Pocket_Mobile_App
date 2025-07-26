"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import axiosInstance from "../../api/axiosInstance"

const { width } = Dimensions.get("window")

export default function WithdrawPage() {
  const [loading, setLoading] = useState(false)
  const [loadingVaultInfo, setLoadingVaultInfo] = useState(true)
  const [message, setMessage] = useState(null)
  const [vaultInfo, setVaultInfo] = useState(null)
  const [withdrawableDeposits, setWithdrawableDeposits] = useState([])
  const [selectedDeposits, setSelectedDeposits] = useState([])
  const [formData, setFormData] = useState({ phoneNumber: "" })

  useEffect(() => {
    fetchVaultInfo()
    fetchWithdrawableDeposits()
  }, [])

  const fetchVaultInfo = async () => {
    try {
      setLoadingVaultInfo(true)
      const response = await axiosInstance.get("/api/vault-info")
      setVaultInfo(response.data.data)
    } catch (error) {
      console.error("Failed to fetch vault info:", error)
      setMessage({
        type: "error",
        text: "Failed to load vault information. Please try again.",
      })
    } finally {
      setLoadingVaultInfo(false)
    }
  }

  const fetchWithdrawableDeposits = async () => {
    try {
      const response = await axiosInstance.get("/api/withdrawable-deposits")
      setWithdrawableDeposits(response.data.data || [])
    } catch (error) {
      console.error("Failed to fetch withdrawable deposits:", error)
      setMessage({
        type: "error",
        text: "Failed to load withdrawable deposits. Please try again.",
      })
    }
  }

  const handleInputChange = (text) => {
    setFormData({ phoneNumber: text })
    if (message) setMessage(null)
  }

  const handleDepositSelection = (depositId) => {
    setSelectedDeposits((prev) => {
      if (prev.includes(depositId)) {
        return prev.filter((id) => id !== depositId)
      } else {
        return [...prev, depositId]
      }
    })
    if (message) setMessage(null)
  }

  const selectAllDeposits = () => {
    const allDepositIds = withdrawableDeposits.filter((d) => d.canWithdraw).map((d) => d.depositId)
    setSelectedDeposits(allDepositIds)
  }

  const clearAllSelections = () => {
    setSelectedDeposits([])
  }

  const calculateTotals = () => {
    const selectedData = withdrawableDeposits.filter((d) => selectedDeposits.includes(d.depositId))
    const totalOriginal = selectedData.reduce((sum, d) => sum + d.amount, 0)
    const totalFees = selectedData.length * 5
    const totalPenalties = selectedData.reduce((sum, d) => sum + d.penalty, 0)
    const totalNet = selectedData.reduce((sum, d) => sum + d.netAmount, 0)

    return {
      totalOriginal,
      totalFees,
      totalPenalties,
      totalNet,
      depositsCount: selectedData.length,
    }
  }

  const validateForm = () => {
    if (!formData.phoneNumber.trim()) {
      setMessage({ type: "error", text: "Phone number is required." })
      return false
    }
    if (selectedDeposits.length === 0) {
      setMessage({ type: "error", text: "Select at least one deposit to withdraw." })
      return false
    }
    return true
  }

  const handleWithdraw = async () => {
    if (!validateForm()) return

    setLoading(true)
    setMessage(null)

    try {
      const response = await axiosInstance.post("/api/withdraw", {
        phoneNumber: formData.phoneNumber,
        depositIds: selectedDeposits,
      })

      if (response.data.success) {
        const data = response.data.data
        setMessage({
          type: "success",
          text:
            `Withdrawals processed successfully!\n` +
            `Total Withdrawn: E${data.totalWithdrawn}\n` +
            `Total Fees: E${data.totalFees}\n` +
            `Total Penalties: E${data.totalPenalties}\n` +
            `Deposits Processed: ${data.depositsProcessed}\n` +
            `Reference ID: ${data.referenceId}`,
        })

        setFormData({ phoneNumber: "" })
        setSelectedDeposits([])
        fetchVaultInfo()
        fetchWithdrawableDeposits()
      }
    } catch (error) {
      console.error("Withdrawal error:", error)
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || "Withdrawal failed. Please try again."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const totals = calculateTotals()

  if (loadingVaultInfo) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading vault information...</Text>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="arrow-down-circle" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <Text style={styles.headerSubtitle}>Select deposits to withdraw from your vault</Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Vault Summary */}
          {vaultInfo && (
            <View style={styles.vaultSummaryCard}>
              <LinearGradient colors={["#DBEAFE", "#BFDBFE"]} style={styles.vaultSummaryGradient}>
                <View style={styles.vaultSummaryHeader}>
                  <Ionicons name="information-circle" size={20} color="#2563EB" />
                  <Text style={styles.vaultSummaryTitle}>Vault Summary</Text>
                </View>
                <View style={styles.vaultSummaryGrid}>
                  <View style={styles.vaultSummaryItem}>
                    <Text style={styles.vaultSummaryLabel}>Total Locked</Text>
                    <Text style={styles.vaultSummaryValue}>
                      E{vaultInfo.depositSummary?.totalLockedAmount?.toFixed(2) || "0.00"}
                    </Text>
                  </View>
                  <View style={styles.vaultSummaryItem}>
                    <Text style={styles.vaultSummaryLabel}>Total Deposits</Text>
                    <Text style={styles.vaultSummaryValue}>{vaultInfo.depositSummary?.totalDeposits || 0}</Text>
                  </View>
                  <View style={styles.vaultSummaryItem}>
                    <Text style={styles.vaultSummaryLabel}>Withdrawable</Text>
                    <Text style={[styles.vaultSummaryValue, { color: "#059669" }]}>
                      {vaultInfo.depositSummary?.withdrawableDepositsCount || 0}
                    </Text>
                  </View>
                  <View style={styles.vaultSummaryItem}>
                    <Text style={styles.vaultSummaryLabel}>Vault Balance</Text>
                    <Text style={styles.vaultSummaryValue}>E{vaultInfo.vault?.balance?.toFixed(2) || "0.00"}</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Phone Number Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="phone-portrait" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="76123456 or 26876123456"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={formData.phoneNumber}
                onChangeText={handleInputChange}
                editable={!loading}
                maxLength={15}
              />
            </View>
            <Text style={styles.inputHint}>Enter Eswatini mobile number (76, 78, or 79 prefix)</Text>
          </View>

          {/* Deposit Selection */}
          <View style={styles.selectionSection}>
            <View style={styles.selectionHeader}>
              <Text style={styles.sectionTitle}>Select Deposits to Withdraw</Text>
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
                <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
                <Text style={styles.noDepositsTitle}>No withdrawable deposits</Text>
                <Text style={styles.noDepositsText}>Make a deposit first or wait for lock period to mature</Text>
              </View>
            ) : (
              <View style={styles.depositsList}>
                {withdrawableDeposits.map((deposit) => {
                  const isSelected = selectedDeposits.includes(deposit.depositId)
                  return (
                    <TouchableOpacity
                      key={deposit.depositId}
                      style={[
                        styles.depositCard,
                        isSelected && styles.depositCardSelected,
                        !deposit.canWithdraw && styles.depositCardDisabled,
                      ]}
                      onPress={() => deposit.canWithdraw && handleDepositSelection(deposit.depositId)}
                      disabled={!deposit.canWithdraw || loading}
                    >
                      <View style={styles.depositCardContent}>
                        <View style={styles.depositCardLeft}>
                          <View style={styles.depositCheckbox}>
                            {deposit.canWithdraw ? (
                              isSelected ? (
                                <Ionicons name="checkmark-circle" size={24} color="#667eea" />
                              ) : (
                                <Ionicons name="ellipse-outline" size={24} color="#9CA3AF" />
                              )
                            ) : (
                              <Ionicons name="time-outline" size={24} color="#9CA3AF" />
                            )}
                          </View>
                          <View style={styles.depositInfo}>
                            <View style={styles.depositAmountRow}>
                              <Ionicons name="cash" size={16} color="#059669" />
                              <Text style={styles.depositAmount}>E{deposit.amount.toFixed(2)}</Text>
                              <Text style={styles.depositLockPeriod}>
                                ({deposit.lockPeriodInDays} day{deposit.lockPeriodInDays !== 1 ? "s" : ""})
                              </Text>
                            </View>
                            <Text style={styles.depositDate}>
                              Deposited: {new Date(deposit.depositDate).toLocaleDateString()}
                            </Text>
                            {deposit.isEarlyWithdrawal && (
                              <View style={styles.earlyWithdrawalBadge}>
                                <Ionicons name="warning" size={12} color="#F59E0B" />
                                <Text style={styles.earlyWithdrawalText}>Early withdrawal</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.depositCardRight}>
                          <Text style={styles.netAmount}>E{deposit.netAmount.toFixed(2)}</Text>
                          <View style={styles.depositDetails}>
                            {deposit.penalty > 0 && (
                              <Text style={styles.penaltyText}>-E{deposit.penalty.toFixed(2)} penalty</Text>
                            )}
                            <Text style={styles.feeText}>-E{deposit.flatFee} fee</Text>
                            {deposit.hoursUntilMaturity > 0 && (
                              <Text style={styles.maturityText}>Matures in {deposit.hoursUntilMaturity}h</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )}
          </View>

          {/* Selection Summary */}
          {selectedDeposits.length > 0 && (
            <View style={styles.summaryCard}>
              <LinearGradient colors={["#ECFDF5", "#D1FAE5"]} style={styles.summaryGradient}>
                <View style={styles.summaryHeader}>
                  <Ionicons name="calculator" size={20} color="#059669" />
                  <Text style={styles.summaryTitle}>Withdrawal Summary</Text>
                </View>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Deposits Selected</Text>
                    <Text style={styles.summaryValue}>{totals.depositsCount}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Original</Text>
                    <Text style={styles.summaryValue}>E{totals.totalOriginal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Fees</Text>
                    <Text style={[styles.summaryValue, styles.negativeValue]}>-E{totals.totalFees.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Total Penalties</Text>
                    <Text style={[styles.summaryValue, styles.negativeValue]}>
                      -E{totals.totalPenalties.toFixed(2)}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryTotal}>
                  <Text style={styles.summaryTotalLabel}>You will receive:</Text>
                  <Text style={styles.summaryTotalValue}>E{totals.totalNet.toFixed(2)}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Message */}
          {message && (
            <View
              style={[styles.messageCard, message.type === "success" ? styles.messageSuccess : styles.messageError]}
            >
              <Ionicons
                name={message.type === "success" ? "checkmark-circle" : "alert-circle"}
                size={20}
                color={message.type === "success" ? "#059669" : "#DC2626"}
              />
              <Text
                style={[
                  styles.messageText,
                  message.type === "success" ? styles.messageTextSuccess : styles.messageTextError,
                ]}
              >
                {message.text}
              </Text>
            </View>
          )}

          {/* Withdraw Button */}
          <TouchableOpacity
            onPress={handleWithdraw}
            disabled={loading || selectedDeposits.length === 0}
            style={[styles.withdrawButton, (loading || selectedDeposits.length === 0) && styles.withdrawButtonDisabled]}
          >
            <LinearGradient
              colors={loading || selectedDeposits.length === 0 ? ["#9CA3AF", "#6B7280"] : ["#EF4444", "#DC2626"]}
              style={styles.withdrawButtonGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.withdrawButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="arrow-down-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.withdrawButtonText}>Withdraw Selected ({selectedDeposits.length})</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
              <Text style={styles.infoTitle}>Withdrawal Information</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons name="document-text" size={16} color="#6366F1" />
                <Text style={styles.infoText}>Each deposit processed individually with own fees</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="cash" size={16} color="#F59E0B" />
                <Text style={styles.infoText}>Flat fee: E5 per deposit withdrawal</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.infoText}>Early withdrawal penalty: 10% of deposit amount</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={16} color="#10B981" />
                <Text style={styles.infoText}>No waiting period - withdraw immediately after deposit</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.infoText}>Select specific deposits you want to withdraw from</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
  },
  scrollContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  vaultSummaryCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  vaultSummaryGradient: {
    padding: 16,
  },
  vaultSummaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vaultSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 8,
  },
  vaultSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vaultSummaryItem: {
    flexBasis: "48%",
    marginBottom: 8,
  },
  vaultSummaryLabel: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
  },
  vaultSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  inputHint: {
    fontSize: 12,
    color: "#6B7280",
  },
  selectionSection: {
    marginBottom: 24,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  selectionButtons: {
    flexDirection: "row",
    gap: 16,
  },
  selectionButtonText: {
    color: "#667eea",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledText: {
    color: "#9CA3AF",
  },
  noDepositsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noDepositsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  noDepositsText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  depositsList: {
    gap: 12,
  },
  depositCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  depositCardSelected: {
    borderColor: "#667eea",
    backgroundColor: "#F8FAFF",
    shadowColor: "#667eea",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  depositCardDisabled: {
    opacity: 0.5,
  },
  depositCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  depositCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  depositCheckbox: {
    marginRight: 12,
  },
  depositInfo: {
    flex: 1,
  },
  depositAmountRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  depositAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 6,
  },
  depositLockPeriod: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 8,
  },
  depositDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  earlyWithdrawalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  earlyWithdrawalText: {
    fontSize: 10,
    color: "#92400E",
    marginLeft: 4,
    fontWeight: "500",
  },
  depositCardRight: {
    alignItems: "flex-end",
  },
  netAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 4,
  },
  depositDetails: {
    alignItems: "flex-end",
  },
  penaltyText: {
    fontSize: 12,
    color: "#DC2626",
    marginBottom: 2,
  },
  feeText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  maturityText: {
    fontSize: 12,
    color: "#2563EB",
  },
  summaryCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  summaryGradient: {
    padding: 16,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryItem: {
    flexBasis: "48%",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  negativeValue: {
    color: "#DC2626",
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#A7F3D0",
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#059669",
  },
  messageCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  messageSuccess: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
  },
  messageError: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextSuccess: {
    color: "#065F46",
  },
  messageTextError: {
    color: "#991B1B",
  },
  withdrawButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  withdrawButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  withdrawButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  withdrawButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 8,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
    flex: 1,
  },
})
