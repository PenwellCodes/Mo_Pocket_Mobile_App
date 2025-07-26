"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import axiosInstance from "../../api/axiosInstance"
import { getToken } from "../../utils/secureStore"

const { width } = Dimensions.get("window")

export default function DepositPage() {
  const [formData, setFormData] = useState({
    amount: "",
    lockDays: "",
    phoneNumber: "",
  })
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tokenLoading, setTokenLoading] = useState(true)
  const [momoToken, setMomoToken] = useState(null)
  const [vaultInfo, setVaultInfo] = useState(null)

  const lockPeriodOptions = [
    { days: 1, label: "1 Day", penalty: "10% penalty", color: ["#FEF3C7", "#FDE68A"], icon: "flash" },
    { days: 2, label: "2 Days", penalty: "10% penalty", color: ["#FEE2E2", "#FECACA"], icon: "time" },
    { days: 3, label: "3 Days", penalty: "10% penalty", color: ["#FECACA", "#FCA5A5"], icon: "calendar" },
    { days: 7, label: "1 Week", penalty: "No penalty", color: ["#D1FAE5", "#A7F3D0"], icon: "checkmark-circle" },
    { days: 30, label: "1 Month", penalty: "No penalty", color: ["#DBEAFE", "#BFDBFE"], icon: "trophy" },
  ]

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([fetchMomoToken(), fetchVaultInfo()])
    }
    initializePage()
  }, [])

  const fetchMomoToken = async () => {
    try {
      setTokenLoading(true)
      const res = await axiosInstance.post("/momo/token")
      const token = res.data?.data?.access_token
      if (token) {
        setMomoToken(token)
        console.log("MoMo token fetched successfully")
      } else {
        setMessage({
          type: "error",
          text: "Failed to initialize payment system. Please refresh the page.",
        })
      }
    } catch (error) {
      console.error("MoMo token fetch failed:", error)
      setMessage({
        type: "error",
        text: "Failed to connect to payment system. Please check your connection.",
      })
    } finally {
      setTokenLoading(false)
    }
  }

  const fetchVaultInfo = async () => {
    try {
      const response = await axiosInstance.get("/api/vault-info")
      setVaultInfo(response.data.data)
    } catch (error) {
      console.error("Failed to fetch vault info:", error)
    }
  }

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (message) {
      setMessage(null)
    }
  }

  const handleLockPeriodSelect = (days) => {
    setFormData((prev) => ({
      ...prev,
      lockDays: days.toString(),
    }))
    if (message) {
      setMessage(null)
    }
  }

  const validateForm = () => {
    const { amount, lockDays, phoneNumber } = formData
    if (!amount || Number.parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount greater than 0." })
      return false
    }
    if (Number.parseFloat(amount) < 10) {
      setMessage({ type: "error", text: "Minimum deposit amount is E10." })
      return false
    }
    if (!lockDays || Number.parseInt(lockDays) <= 0) {
      setMessage({ type: "error", text: "Please select a lock period." })
      return false
    }
    if (!phoneNumber.trim()) {
      setMessage({ type: "error", text: "Please enter your phone number." })
      return false
    }
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    if (cleanPhone.length < 8) {
      setMessage({ type: "error", text: "Please enter a valid phone number." })
      return false
    }
    return true
  }

  const handleDeposit = async () => {
    if (!validateForm()) return

    if (!momoToken) {
      setMessage({
        type: "error",
        text: "Payment system not ready. Please refresh the page and try again.",
      })
      return
    }

    try {
      setLoading(true)
      setMessage(null)

      const depositData = {
        userId: await getToken("userId"),
        amount: Number.parseFloat(formData.amount),
        lockPeriodInDays: Number.parseInt(formData.lockDays),
        phoneNumber: formData.phoneNumber.trim(),
        orderId: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }

      console.log("Sending deposit request:", depositData)

      const res = await axiosInstance.post("/momo/money-collect", depositData)

      console.log("Deposit response:", res.data)

      if (res.data.status === "SUCCESSFUL" || res.data.status === "PENDING" || res.data.message) {
        setMessage({
          type: "success",
          text: `Deposit initiated successfully!\nAmount: E${formData.amount}\nLock Period: ${formData.lockDays} days\nReference: ${res.data.referenceId || "N/A"}`,
        })

        setFormData({
          amount: "",
          lockDays: "",
          phoneNumber: "",
        })

        setTimeout(() => {
          fetchVaultInfo()
        }, 2000)
      } else {
        setMessage({
          type: "error",
          text: res.data.error || "Failed to process deposit. Please try again.",
        })
      }
    } catch (err) {
      console.error("Deposit error:", err)
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Deposit failed. Please check your details and try again."
      setMessage({ type: "error", text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  if (tokenLoading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Initializing payment system...</Text>
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
            <Ionicons name="wallet" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Make a Deposit</Text>
          <Text style={styles.headerSubtitle}>Secure your funds with our vault system</Text>
        </View>

        {/* Main Card */}
        <View style={styles.mainCard}>
          {/* Vault Info */}
          {vaultInfo && (
            <View style={styles.vaultInfoCard}>
              <LinearGradient colors={["#DBEAFE", "#BFDBFE"]} style={styles.vaultInfoGradient}>
                <View style={styles.vaultInfoHeader}>
                  <Ionicons name="information-circle" size={20} color="#2563EB" />
                  <Text style={styles.vaultInfoTitle}>Your Vault Summary</Text>
                </View>
                <View style={styles.vaultInfoContent}>
                  <View style={styles.vaultInfoItem}>
                    <Text style={styles.vaultInfoLabel}>Current Balance</Text>
                    <Text style={styles.vaultInfoValue}>E{vaultInfo.vault?.balance?.toFixed(2) || "0.00"}</Text>
                  </View>
                  <View style={styles.vaultInfoItem}>
                    <Text style={styles.vaultInfoLabel}>Active Deposits</Text>
                    <Text style={styles.vaultInfoValue}>{vaultInfo.lockedDeposits?.length || 0}</Text>
                  </View>
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

          {/* Amount Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Deposit Amount</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="cash" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter amount (min. E10)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.amount}
                  onChangeText={(text) => handleInputChange("amount", text)}
                  editable={!loading}
                  style={styles.textInput}
                />
                <Text style={styles.currencyLabel}>SZL</Text>
              </View>
            </View>
            <Text style={styles.inputHint}>Minimum deposit: E10</Text>
          </View>

          {/* Lock Period Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Choose Lock Period</Text>
            <View style={styles.lockPeriodGrid}>
              {lockPeriodOptions.map((option) => {
                const selected = formData.lockDays === option.days.toString()
                return (
                  <TouchableOpacity
                    key={option.days}
                    onPress={() => handleLockPeriodSelect(option.days)}
                    disabled={loading}
                    style={[
                      styles.lockPeriodCard,
                      selected && styles.lockPeriodSelected,
                      loading && styles.lockPeriodDisabled,
                    ]}
                  >
                    <LinearGradient
                      colors={selected ? ["#667eea", "#764ba2"] : option.color}
                      style={styles.lockPeriodGradient}
                    >
                      <Ionicons name={option.icon} size={24} color={selected ? "#FFFFFF" : "#374151"} />
                      <Text style={[styles.lockPeriodLabel, selected && styles.lockPeriodLabelSelected]}>
                        {option.label}
                      </Text>
                      <Text style={[styles.lockPeriodPenalty, selected && styles.lockPeriodPenaltySelected]}>
                        {option.penalty}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )
              })}
            </View>
            <Text style={styles.inputHint}>Early withdrawal from 1-3 day locks incurs a 10% penalty + E5 fee</Text>
          </View>

          {/* Custom Lock Days */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Or Enter Custom Days</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  keyboardType="numeric"
                  placeholder="Custom lock period (days)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.lockDays}
                  onChangeText={(text) => handleInputChange("lockDays", text)}
                  editable={!loading}
                  maxLength={3}
                  style={styles.textInput}
                />
              </View>
            </View>
          </View>

          {/* Phone Number */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="phone-portrait" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="76123456 or 26876123456"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phoneNumber}
                  onChangeText={(text) => handleInputChange("phoneNumber", text)}
                  editable={!loading}
                  maxLength={15}
                  style={styles.textInput}
                />
              </View>
            </View>
            <Text style={styles.inputHint}>Enter your Eswatini mobile number (76, 78, or 79)</Text>
          </View>

          {/* Deposit Button */}
          <TouchableOpacity
            onPress={handleDeposit}
            disabled={loading || !momoToken}
            style={[styles.depositButton, (loading || !momoToken) && styles.depositButtonDisabled]}
          >
            <LinearGradient
              colors={loading || !momoToken ? ["#9CA3AF", "#6B7280"] : ["#10B981", "#059669"]}
              style={styles.depositButtonGradient}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.depositButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.depositButtonText}>Deposit Funds</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
              <Text style={styles.infoTitle}>Important Information</Text>
            </View>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Ionicons name="checkmark" size={16} color="#10B981" />
                <Text style={styles.infoText}>Minimum deposit: E10</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="lock-closed" size={16} color="#F59E0B" />
                <Text style={styles.infoText}>Funds are locked for the selected period</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="warning" size={16} color="#EF4444" />
                <Text style={styles.infoText}>Early withdrawal: 10% penalty + E5 fee</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={16} color="#6366F1" />
                <Text style={styles.infoText}>Withdrawals available 24 hours after deposit</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.infoText}>All transactions secured by MoMo API</Text>
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
  vaultInfoCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  vaultInfoGradient: {
    padding: 16,
  },
  vaultInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  vaultInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563EB",
    marginLeft: 8,
  },
  vaultInfoContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vaultInfoItem: {
    flex: 1,
  },
  vaultInfoLabel: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
  },
  vaultInfoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
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
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 8,
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
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  inputHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  lockPeriodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  lockPeriodCard: {
    flexBasis: "48%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockPeriodSelected: {
    shadowColor: "#667eea",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lockPeriodDisabled: {
    opacity: 0.5,
  },
  lockPeriodGradient: {
    padding: 16,
    alignItems: "center",
    minHeight: 100,
    justifyContent: "center",
  },
  lockPeriodLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 8,
    textAlign: "center",
  },
  lockPeriodLabelSelected: {
    color: "#FFFFFF",
  },
  lockPeriodPenalty: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  lockPeriodPenaltySelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  depositButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  depositButtonDisabled: {
    shadowOpacity: 0.1,
    elevation: 2,
  },
  depositButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  depositButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
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
