"use client"

import { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import CommonForm from "../../components/CommonForm"
import { signInFormControls, signUpFormControls } from "../../constants/index"
import { useAuth } from "../../context/appstate/AuthContext"

const { width, height } = Dimensions.get("window")

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState("signin")

  const {
    signInFormData,
    setSignInFormData,
    signUpFormData,
    setSignUpFormData,
    handleRegisterUser,
    handleLoginUser,
    loading,
  } = useAuth()

  function checkIfSignInFormIsValid() {
    return signInFormData.userEmail !== "" && signInFormData.password !== ""
  }

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.phoneNumber !== "" &&
      signUpFormData.password !== ""
    )
  }

  if (loading) {
    return (
      <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="wallet" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>SWAZISAVE</Text>
          <Text style={styles.appSubtitle}>Your Digital Vault</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.authCard}>
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab("signin")}
              style={[styles.tab, activeTab === "signin" ? styles.activeTab : styles.inactiveTab]}
            >
              <Text style={[styles.tabText, activeTab === "signin" ? styles.activeTabText : styles.inactiveTabText]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("signup")}
              style={[styles.tab, activeTab === "signup" ? styles.activeTab : styles.inactiveTab]}
            >
              <Text style={[styles.tabText, activeTab === "signup" ? styles.activeTabText : styles.inactiveTabText]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <View style={styles.formContainer}>
            {activeTab === "signin" ? (
              <CommonForm
                formControls={signInFormControls}
                formData={signInFormData}
                setFormData={setSignInFormData}
                handleSubmit={handleLoginUser}
                buttonText="Sign In"
                isButtonDisabled={!checkIfSignInFormIsValid()}
              />
            ) : (
              <CommonForm
                formControls={signUpFormControls}
                formData={signUpFormData}
                setFormData={setSignUpFormData}
                handleSubmit={handleRegisterUser}
                buttonText="Create Account"
                isButtonDisabled={!checkIfSignUpFormIsValid()}
              />
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {activeTab === "signin" ? "Don't have an account? " : "Already have an account? "}
              <Text
                style={styles.footerLink}
                onPress={() => setActiveTab(activeTab === "signin" ? "signup" : "signin")}
              >
                {activeTab === "signin" ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </View>
        </View>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          <Text style={styles.securityText}>Secured with bank-level encryption</Text>
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
  loadingContent: {
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 16,
    fontWeight: "500",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "300",
  },
  authCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#667eea",
    shadowColor: "#667eea",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  inactiveTabText: {
    color: "#6B7280",
  },
  formContainer: {
    marginBottom: 20,
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
  },
  footerLink: {
    color: "#667eea",
    fontWeight: "600",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "center",
  },
  securityText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
})
