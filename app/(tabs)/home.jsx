// app/home/index.js
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axiosInstance from '../../api/axiosInstance'; // Adjust the path
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import * as SecureStore from 'expo-secure-store';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [vaultInfo, setVaultInfo] = useState(null);
  const [withdrawableDeposits, setWithdrawableDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const id = await SecureStore.getItemAsync("userId");
        if (!id) {
          setError("No user ID found. Please log in again.");
          router.push("/auth");
          return;
        }

        const [userRes, vaultRes, withdrawableRes] = await Promise.all([
          axiosInstance.get(`/api/user/${id}`),
          axiosInstance.get("/api/vault-info").catch((err) => {
            console.error("Vault info error:", err.response?.data || err.message);
            return { data: null };
          }),
          axiosInstance.get("/api/withdrawable-deposits").catch((err) => {
            console.error("Withdrawable error:", err.response?.data || err.message);
            return { data: [] };
          }),
        ]);

        if (userRes?.data?.data) setUser(userRes.data.data);
        if (vaultRes?.data) setVaultInfo(vaultRes.data);
        if (withdrawableRes?.data) setWithdrawableDeposits(withdrawableRes.data);

      } catch (err) {
        setError("Failed to load data.");
        console.error("Data loading error:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData(); // ✅ Call the function inside useEffect
  }, []);

  const goToDeposit = async () => {
    try {
      const res = await axiosInstance.post("/momo/token");
      if (res.data.data?.access_token) {
        await SecureStore.setItemAsync("momoToken", res.data.data.access_token);
        router.push("/deposit");
      }
    } catch (err) {
      setError("Failed to generate payment token.");
    }
  };

  const goToWithdraw = () => router.push("/withdraw");

  const formatCurrency = (amount) => `E${(amount || 0).toFixed(2)}`;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.text}>Loading your vault...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome, {user?.userName || 'User'}!</Text>
        <Text style={styles.subtitle}>Manage your vault and track your savings</Text>
        <Text style={styles.phone}>Phone: {user?.phoneNumber}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={goToDeposit} style={styles.depositButton}>
          <FontAwesome name="arrow-up" size={18} color="white" />
          <Text style={styles.buttonText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToWithdraw} style={styles.withdrawButton}>
          <FontAwesome name="arrow-down" size={18} color="white" />
          <Text style={styles.buttonText}>Withdraw</Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {!!error && (
        <View style={styles.errorBox}>
          <FontAwesome name="exclamation-circle" size={16} color="red" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Summary Stats */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total Deposited</Text>
        <Text style={[styles.amount, { color: colors.primary }]}>
          {formatCurrency(vaultInfo?.vault?.balance)}
        </Text>
        <Text style={styles.note}>
          {vaultInfo?.recentTransactions?.length || 0} transactions
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F7F8FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
  text: {
    marginTop: 8,
    color: '#555',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
  },
  phone: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  depositButton: {
    flex: 1,
    backgroundColor: '#FFC107',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    marginLeft: 8,
    color: '#B91C1C',
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#777',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#999',
  },
});
