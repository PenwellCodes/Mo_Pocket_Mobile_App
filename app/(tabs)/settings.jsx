+import React from "react";
+import {
+  View,
+  Text,
+  StyleSheet,
+  TouchableOpacity,
+  ScrollView,
+  Alert,
+} from "react-native";
+import { useAuth } from "../../context/appstate/AuthContext";
+import { useTheme } from "react-native-paper";
+import { FontAwesome } from "@expo/vector-icons";
+
+export default function SettingsScreen() {
+  const { auth, resetCredentials } = useAuth();
+  const { colors } = useTheme();
+
+  const handleLogout = () => {
+    Alert.alert(
+      "Logout",
+      "Are you sure you want to logout?",
+      [
+        {
+          text: "Cancel",
+          style: "cancel",
+        },
+        {
+          text: "Logout",
+          style: "destructive",
+          onPress: resetCredentials,
+        },
+      ]
+    );
+  };
+
+  return (
+    <ScrollView style={styles.container}>
+      <View style={styles.header}>
+        <Text style={styles.title}>Settings</Text>
+      </View>
+
+      {/* User Info */}
+      <View style={styles.section}>
+        <Text style={styles.sectionTitle}>Account Information</Text>
+        <View style={styles.userInfo}>
+          <Text style={styles.userName}>{auth.user?.userName}</Text>
+          <Text style={styles.userEmail}>{auth.user?.userEmail}</Text>
+          <Text style={styles.userPhone}>{auth.user?.phoneNumber}</Text>
+          {auth.user?.role === 'admin' && (
+            <View style={styles.adminBadge}>
+              <Text style={styles.adminText}>Administrator</Text>
+            </View>
+          )}
+        </View>
+      </View>
+
+      {/* Settings Options */}
+      <View style={styles.section}>
+        <Text style={styles.sectionTitle}>App Settings</Text>
+        
+        <TouchableOpacity style={styles.settingItem}>
+          <FontAwesome name="bell" size={20} color={colors.primary} />
+          <Text style={styles.settingText}>Notifications</Text>
+          <FontAwesome name="chevron-right" size={16} color="#999" />
+        </TouchableOpacity>
+
+        <TouchableOpacity style={styles.settingItem}>
+          <FontAwesome name="shield" size={20} color={colors.primary} />
+          <Text style={styles.settingText}>Privacy & Security</Text>
+          <FontAwesome name="chevron-right" size={16} color="#999" />
+        </TouchableOpacity>
+
+        <TouchableOpacity style={styles.settingItem}>
+          <FontAwesome name="question-circle" size={20} color={colors.primary} />
+          <Text style={styles.settingText}>Help & Support</Text>
+          <FontAwesome name="chevron-right" size={16} color="#999" />
+        </TouchableOpacity>
+      </View>
+
+      {/* Logout */}
+      <View style={styles.section}>
+        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
+          <FontAwesome name="sign-out" size={20} color="white" />
+          <Text style={styles.logoutText}>Logout</Text>
+        </TouchableOpacity>
+      </View>
+    </ScrollView>
+  );
+}
+
+const styles = StyleSheet.create({
+  container: {
+    flex: 1,
+    backgroundColor: "#f5f5f5",
+  },
+  header: {
+    padding: 20,
+    backgroundColor: "white",
+    borderBottomWidth: 1,
+    borderBottomColor: "#e0e0e0",
+  },
+  title: {
+    fontSize: 24,
+    fontWeight: "bold",
+    color: "#333",
+  },
+  section: {
+    marginTop: 20,
+    backgroundColor: "white",
+    paddingHorizontal: 20,
+    paddingVertical: 15,
+  },
+  sectionTitle: {
+    fontSize: 16,
+    fontWeight: "600",
+    color: "#666",
+    marginBottom: 15,
+  },
+  userInfo: {
+    paddingVertical: 10,
+  },
+  userName: {
+    fontSize: 18,
+    fontWeight: "bold",
+    color: "#333",
+    marginBottom: 5,
+  },
+  userEmail: {
+    fontSize: 14,
+    color: "#666",
+    marginBottom: 5,
+  },
+  userPhone: {
+    fontSize: 14,
+    color: "#666",
+    marginBottom: 10,
+  },
+  adminBadge: {
+    backgroundColor: "#dc2626",
+    paddingHorizontal: 8,
+    paddingVertical: 4,
+    borderRadius: 12,
+    alignSelf: "flex-start",
+  },
+  adminText: {
+    color: "white",
+    fontSize: 12,
+    fontWeight: "600",
+  },
+  settingItem: {
+    flexDirection: "row",
+    alignItems: "center",
+    paddingVertical: 15,
+    borderBottomWidth: 1,
+    borderBottomColor: "#f0f0f0",
+  },
+  settingText: {
+    flex: 1,
+    marginLeft: 15,
+    fontSize: 16,
+    color: "#333",
+  },
+  logoutButton: {
+    flexDirection: "row",
+    alignItems: "center",
+    justifyContent: "center",
+    backgroundColor: "#dc2626",
+    paddingVertical: 15,
+    borderRadius: 8,
+    marginTop: 10,
+  },
+  logoutText: {
+    color: "white",
+    fontSize: 16,
+    fontWeight: "600",
+    marginLeft: 10,
+  },
+});
+