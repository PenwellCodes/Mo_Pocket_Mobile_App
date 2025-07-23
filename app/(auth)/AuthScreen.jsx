import React, { useState, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import CommonForm from "../../components/CommonForm"; // your RN form from earlier
import { signInFormControls, signUpFormControls } from "../../constants/index";
 // Adjust path as needed

import { useAuth } from "../../context/appstate/AuthContext";

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState("signin");

  const {
    signInFormData,
    setSignInFormData,
    signUpFormData,
    setSignUpFormData,
    handleRegisterUser,
    handleLoginUser,
    loading,
  } = useAuth();

  function checkIfSignInFormIsValid() {
    return signInFormData.userEmail !== "" && signInFormData.password !== "";
  }

  function checkIfSignUpFormIsValid() {
    return (
      signUpFormData.userName !== "" &&
      signUpFormData.userEmail !== "" &&
      signUpFormData.phoneNumber !== "" &&
      signUpFormData.password !== ""
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0070C0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("signin")}
          style={[styles.tab, activeTab === "signin" && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === "signin" && styles.activeTabText]}>
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("signup")}
          style={[styles.tab, activeTab === "signup" && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === "signup" && styles.activeTabText]}>
            Signup
          </Text>
        </TouchableOpacity>
      </View>

      {/* Forms */}
      {activeTab === "signin" ? (
        <CommonForm
          formControls={signInFormControls}
          formData={signInFormData}
          setFormData={setSignInFormData}
          handleSubmit={handleLoginUser}
          buttonText="Login"
          isButtonDisabled={!checkIfSignInFormIsValid()}
        />
      ) : (
        <CommonForm
          formControls={signUpFormControls}
          formData={signUpFormData}
          setFormData={setSignUpFormData}
          handleSubmit={handleRegisterUser}
          buttonText="Signup"
          isButtonDisabled={!checkIfSignUpFormIsValid()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fdf6e3",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: "#0070C0",
  },
  tabText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#555",
  },
  activeTabText: {
    color: "white",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
