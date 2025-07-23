import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  StyleSheet,
  Alert
} from "react-native";
import axiosInstance from "../../api/axiosInstance";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { getToken } from '../../utils/secureStore';

export default function DepositPage() {
  const [formData, setFormData] = useState({
    amount: "",
    lockDays: "",
    phoneNumber: ""
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [momoToken, setMomoToken] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);

  // Lock period options
  const lockPeriodOptions = [
    { days: 1, label: "1 Day", penalty: "10% if withdrawn early", color: "#FEF3C7" }, // yellow
    { days: 2, label: "2 Days", penalty: "10% if withdrawn early", color: "#FEE2E2" }, // red-ish
    { days: 3, label: "3 Days", penalty: "10% if withdrawn early", color: "#FECACA" },
    { days: 7, label: "1 Week", penalty: "No penalty", color: "#D1FAE5" }, // green
    { days: 30, label: "1 Month", penalty: "No penalty", color: "#DBEAFE" }, // blue
  ];

  useEffect(() => {
    const initializePage = async () => {
      await Promise.all([
        fetchMomoToken(),
        fetchVaultInfo()
      ]);
    };
    initializePage();
  }, []);

  const fetchMomoToken = async () => {
    try {
      setTokenLoading(true);
      const res = await axiosInstance.post("/momo/token");
      const token = res.data?.data?.access_token;
      if (token) {
        setMomoToken(token);
        console.log("MoMo token fetched successfully");
      } else {
        setMessage({
          type: "error",
          text: "Failed to initialize payment system. Please refresh the page."
        });
      }
    } catch (error) {
      console.error("MoMo token fetch failed:", error);
      setMessage({
        type: "error",
        text: "Failed to connect to payment system. Please check your connection."
      });
    } finally {
      setTokenLoading(false);
    }
  };

  const fetchVaultInfo = async () => {
    try {
      const response = await axiosInstance.get("/api/vault-info");
      setVaultInfo(response.data.data);
    } catch (error) {
      console.error("Failed to fetch vault info:", error);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (message) {
      setMessage(null);
    }
  };

  const handleLockPeriodSelect = (days) => {
    setFormData(prev => ({
      ...prev,
      lockDays: days.toString()
    }));
    if (message) {
      setMessage(null);
    }
  };

  const validateForm = () => {
    const { amount, lockDays, phoneNumber } = formData;
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount greater than 0." });
      return false;
    }
    if (parseFloat(amount) < 10) {
      setMessage({ type: "error", text: "Minimum deposit amount is E10." });
      return false;
    }
    if (!lockDays || parseInt(lockDays) <= 0) {
      setMessage({ type: "error", text: "Please select a lock period." });
      return false;
    }
    if (!phoneNumber.trim()) {
      setMessage({ type: "error", text: "Please enter your phone number." });
      return false;
    }
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      setMessage({ type: "error", text: "Please enter a valid phone number." });
      return false;
    }
    return true;
  };

  const handleDeposit = async () => {
    if (!validateForm()) return;

    if (!momoToken) {
      setMessage({
        type: "error",
        text: "Payment system not ready. Please refresh the page and try again."
      });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const depositData = {
        userId: await getToken("userId"),  // or however you store userId in RN
        amount: parseFloat(formData.amount),
        lockPeriodInDays: parseInt(formData.lockDays),
        phoneNumber: formData.phoneNumber.trim(),
        orderId: `DEP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      console.log("Sending deposit request:", depositData);

      const res = await axiosInstance.post("/momo/money-collect", depositData);

      console.log("Deposit response:", res.data);

      if (res.data.status === "SUCCESSFUL" || res.data.status === "PENDING" || res.data.message) {
        setMessage({
          type: "success",
          text: `Deposit initiated successfully!\nAmount: E${formData.amount}\nLock Period: ${formData.lockDays} days\nReference: ${res.data.referenceId || 'N/A'}`
        });

        setFormData({
          amount: "",
          lockDays: "",
          phoneNumber: ""
        });

        setTimeout(() => {
          fetchVaultInfo();
        }, 2000);
      } else {
        setMessage({
          type: "error",
          text: res.data.error || "Failed to process deposit. Please try again."
        });
      }
    } catch (err) {
      console.error("Deposit error:", err);
      const errorMessage = err.response?.data?.error ||
        err.response?.data?.message ||
        "Deposit failed. Please check your details and try again.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (tokenLoading) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome name="spinner" size={48} color="#2563EB" style={{ transform: [{ rotate: '360deg' }] }} />
        <Text style={styles.loadingText}>Initializing payment system...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <FontAwesome name="money" size={40} color="#2563EB" />
          <Text style={styles.title}>Make a Deposit</Text>
          <Text style={styles.subtitle}>Secure your funds with our vault system</Text>
        </View>

        {/* Vault Info */}
        {vaultInfo && (
          <View style={styles.vaultInfo}>
            <View style={styles.vaultHeader}>
              <FontAwesome name="info-circle" size={18} color="#2563EB" />
              <Text style={styles.vaultHeaderText}>Your Vault</Text>
            </View>
            <View style={styles.vaultDetails}>
              <View style={styles.vaultDetailItem}>
                <Text style={styles.vaultLabel}>Current Balance:</Text>
                <Text style={[styles.vaultValue, { color: "#2563EB" }]}>
                  E{vaultInfo.vault?.balance?.toFixed(2) || '0.00'}
                </Text>
              </View>
              <View style={styles.vaultDetailItem}>
                <Text style={styles.vaultLabel}>Active Deposits:</Text>
                <Text style={[styles.vaultValue, { color: "#16A34A" }]}>
                  {vaultInfo.lockedDeposits?.length || 0}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Message */}
        {message && (
          <View
            style={[
              styles.message,
              message.type === "success" ? styles.messageSuccess : styles.messageError,
            ]}
          >
            <FontAwesome
              name={message.type === "success" ? "check-circle" : "exclamation-triangle"}
              size={18}
              color={message.type === "success" ? "#15803D" : "#B91C1C"}
              style={{ marginRight: 8 }}
            />
            <Text style={message.type === "success" ? styles.messageTextSuccess : styles.messageTextError}>
              {message.text}
            </Text>
          </View>
        )}

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Deposit Amount (E)</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="money" size={18} color="#9CA3AF" style={styles.iconLeft} />
            <TextInput
              keyboardType="numeric"
              placeholder="Enter amount (min. E10)"
              value={formData.amount}
              onChangeText={text => handleInputChange("amount", text)}
              editable={!loading}
              style={styles.input}
            />
          </View>
          <Text style={styles.hintText}>Minimum deposit: E10</Text>
        </View>

        {/* Lock Period Buttons */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lock Period</Text>
          <View style={styles.lockPeriodContainer}>
            {lockPeriodOptions.map((option) => {
              const selected = formData.lockDays === option.days.toString();
              return (
                <TouchableOpacity
                  key={option.days}
                  onPress={() => handleLockPeriodSelect(option.days)}
                  disabled={loading}
                  style={[
                    styles.lockPeriodButton,
                    { backgroundColor: option.color },
                    selected && styles.lockPeriodSelected,
                    loading && { opacity: 0.5 }
                  ]}
                >
                  <View style={styles.lockPeriodContent}>
                    <View>
                      <Text style={styles.lockPeriodLabel}>{option.label}</Text>
                      <Text style={styles.lockPeriodPenalty}>{option.penalty}</Text>
                    </View>
                    <FontAwesome name="lock" size={20} color="#6B7280" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.hintText}>
            Early withdrawal from 1-3 day locks incurs a 10% penalty + E5 fee
          </Text>
        </View>

        {/* Custom Lock Days */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Or Enter Custom Days</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="lock" size={18} color="#9CA3AF" style={styles.iconLeft} />
            <TextInput
              keyboardType="numeric"
              placeholder="Custom lock period (days)"
              value={formData.lockDays}
              onChangeText={text => handleInputChange("lockDays", text)}
              editable={!loading}
              maxLength={3}
              style={styles.input}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome name="credit-card" size={18} color="#9CA3AF" style={styles.iconLeft} />
            <TextInput
              keyboardType="phone-pad"
              placeholder="76123456 or 26876123456"
              value={formData.phoneNumber}
              onChangeText={text => handleInputChange("phoneNumber", text)}
              editable={!loading}
              maxLength={15}
              style={styles.input}
            />
          </View>
          <Text style={styles.hintText}>Enter your Eswatini mobile number (76, 78, or 79)</Text>
        </View>

        {/* Deposit Button */}
        <TouchableOpacity
          onPress={handleDeposit}
          disabled={loading || !momoToken}
          style={[
            styles.depositButton,
            (loading || !momoToken) ? styles.buttonDisabled : styles.buttonEnabled
          ]}
        >
          {loading ? (
            <>
              <FontAwesome name="spinner" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.depositButtonText}>Processing Deposit...</Text>
            </>
          ) : (
            <>
              <FontAwesome name="money" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.depositButtonText}>Deposit Funds</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Important Information */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <FontAwesome name="info-circle" size={18} color="#2563EB" />
            <Text style={styles.infoHeaderText}>Important Information</Text>
          </View>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Minimum deposit: E10</Text>
            <Text style={styles.infoItem}>• Funds are locked for the selected period</Text>
            <Text style={styles.infoItem}>• Early withdrawal from 1-3 day locks: 10% penalty + E5 fee</Text>
            <Text style={styles.infoItem}>• Withdrawals available 24 hours after deposit</Text>
            <Text style={styles.infoItem}>• All transactions are secured by MoMo API</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#2563EB",
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 8,
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 14,
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
  },
  vaultDetailItem: {
    flex: 1,
  },
  vaultLabel: {
    color: "#4B5563",
    fontSize: 12,
  },
  vaultValue: {
    fontWeight: "700",
    fontSize: 16,
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
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
  messageTextSuccess: {
    color: "#15803D",
    flex: 1,
  },
  messageTextError: {
    color: "#B91C1C",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    color: "#374151",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    color: "#111827",
  },
  iconLeft: {
    marginRight: 10,
  },
  hintText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  lockPeriodContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  lockPeriodButton: {
    flexBasis: "48%",
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  lockPeriodSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#DBEAFE",
  },
  lockPeriodContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockPeriodLabel: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 16,
  },
  lockPeriodPenalty: {
    fontSize: 12,
    color: "#4B5563",
  },
  depositButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonEnabled: {
    backgroundColor: "#FBBF24",
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  depositButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoHeaderText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#2563EB",
  },
  infoList: {
    marginLeft: 6,
  },
  infoItem: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    color: "#4B5563",
    fontSize: 16,
  }
});
