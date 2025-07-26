"use client"

import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native"
import { useRouter } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import axiosInstance from "../../api/axiosInstance"
import * as SecureStore from "expo-secure-store"

const { width } = Dimensions.get("window")

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [vaultInfo, setVaultInfo] = useState(null)
  const [withdrawableDeposits, setWithdrawableDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const fetchUserData = async () => {
    try {
      const id = await SecureStore.getItemAsync("userId")
      if (!id) {
        setError("No user ID found. Please log in again.")
        router.push("/auth")
        return
      }

      const [userRes, vaultRes, withdrawableRes] = await Promise.all([
        axiosInstance.get(`/api/user/${id}`),
        axiosInstance.get("/api/vault-info").catch((err) => {
          console.error("Vault info error:", err.response?.data || err.message)
          return { data: { success: false, data: null } }
        }),
        axiosInstance.get("/api/withdrawable-deposits").catch((err) => {
          console.error("Withdrawable error:", err.response?.data || err.message)
          return { data: { success: false, data: [] } }
        }),
      ])

      setUser(userRes?.data?.data)
      setVaultInfo(vaultRes?.data?.data)
      setWithdrawableDeposits(withdrawableRes?.data?.data || [])
    } catch (err) {
      console.error(err)
      setError("Failed to load your data. Please try again.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    setError("")
    fetchUserData()
  }

  const goToDeposit = async () => {
    try {
      const res = await axiosInstance.post("/momo/token")
      if (res.data.data?.access_token) {
        await SecureStore.setItemAsync("momoToken", res.data.data.access_token)
      }
      router.push("/deposit")
    } catch {
      setError("Failed to generate payment token.")
    }
  }

  const goToWithdraw = () => router.push("/withdraw")

  const formatCurrency = (amount) => `E${(amount || 0).toFixed(2)}`

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading your vault...</Text>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.userName || "User"}!</Text>
              <Text style={styles.phoneNumber}>{user?.phoneNumber}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle" size={40} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient colors={["#FFFFFF", "#F8F9FA"]} style={styles.balanceGradient}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Ionicons name="eye" size={20} color="#6B7280" />
            </View>
            <Text style={styles.balanceAmount}>{formatCurrency(vaultInfo?.vault?.balance)}</Text>
            <Text style={styles.balanceSubtext}>
              {vaultInfo?.recentTransactions?.length || 0} transactions this month
            </Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={goToDeposit} style={styles.actionButton}>
            <LinearGradient colors={["#10B981", "#059669"]} style={styles.actionGradient}>
              <Ionicons name="add-circle" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Deposit</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={goToWithdraw} style={styles.actionButton}>
            <LinearGradient colors={["#EF4444", "#DC2626"]} style={styles.actionGradient}>
              <Ionicons name="remove-circle" size={24} color="#FFFFFF" />
              <Text style={styles.actionText}>Withdraw</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="lock-closed" size={20} color="#667eea" />
            </View>
            <Text style={styles.statValue}>{vaultInfo?.lockedDeposits?.length || 0}</Text>
            <Text style={styles.statLabel}>Active Vaults</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trending-up" size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{withdrawableDeposits.length || 0}</Text>
            <Text style={styles.statLabel}>Ready to Withdraw</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="time" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>Processing Time</Text>
          </View>
        </View>

        {/* Error Message */}
        {!!error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {vaultInfo?.recentTransactions?.length > 0 ? (
            vaultInfo.recentTransactions.slice(0, 3).map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons
                    name={transaction.type === "deposit" ? "add" : "remove"}
                    size={16}
                    color={transaction.type === "deposit" ? "#10B981" : "#EF4444"}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionType}>
                    {transaction.type === "deposit" ? "Deposit" : "Withdrawal"}
                  </Text>
                  <Text style={styles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</Text>
                </View>
                <Text
                  style={[styles.transactionAmount, { color: transaction.type === "deposit" ? "#10B981" : "#EF4444" }]}
                >
                  {transaction.type === "deposit" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.noActivity}>
              <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
              <Text style={styles.noActivityText}>No recent transactions</Text>
            </View>
          )}
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={styles.securityText}>Your funds are secured with bank-level encryption</Text>
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
    marginTop: 16,
    fontSize: 16,
  },
  scrollContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  userName: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginTop: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 2,
  },
  profileButton: {
    padding: 4,
  },
  balanceCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  errorCard: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    color: "#B91C1C",
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
  },
  activityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  viewAllText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  noActivity: {
    alignItems: "center",
    paddingVertical: 32,
  },
  noActivityText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 12,
  },
  securityText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "500",
  },
})
