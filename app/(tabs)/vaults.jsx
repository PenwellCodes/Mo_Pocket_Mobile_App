// app/(screens)/vaults.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axiosInstance from "../../api/axiosInstance"; // replace with your instance
import * as SecureStore from "expo-secure-store";

export default function VaultsScreen() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const userId = await SecureStore.getItemAsync("userId");
        const response = await axiosInstance.get(`/api/user/${userId}`);
        setDeposits(response.data.data.lockedDeposits || []);
      } catch (error) {
        console.error("Failed to fetch vaults:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVaults();
  }, []);

  const calculateProgress = (start, end) => {
    const now = new Date();
    const total = new Date(end) - new Date(start);
    const elapsed = now - new Date(start);
    return Math.min(100, Math.round((elapsed / total) * 100));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Vaults</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#4caf50" />
      ) : deposits.length === 0 ? (
        <Text style={styles.noVaults}>No deposits yet.</Text>
      ) : (
        deposits.map((vault, index) => {
          const progress = calculateProgress(vault.startDate, vault.endDate);
          return (
            <View key={index} style={styles.vaultBox}>
              <Text><Text style={styles.label}>Amount:</Text> E{vault.amount}</Text>
              <Text><Text style={styles.label}>Status:</Text> {vault.status}</Text>
              <Text><Text style={styles.label}>Locked For:</Text> {vault.lockPeriodInDays} days</Text>
              <Text><Text style={styles.label}>Start:</Text> {new Date(vault.startDate).toLocaleDateString()}</Text>
              <Text><Text style={styles.label}>End:</Text> {new Date(vault.endDate).toLocaleDateString()}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noVaults: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  vaultBox: {
    marginBottom: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
  },
  label: {
    fontWeight: "600",
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginTop: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
});
