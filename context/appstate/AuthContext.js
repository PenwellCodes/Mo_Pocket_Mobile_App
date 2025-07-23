import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import axiosInstance from "../../api/axiosInstance"; // Adjust path as needed
import Toast from "react-native-toast-message";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const router = useRouter();

  const [signInFormData, setSignInFormData] = useState({
    userEmail: "",
    password: "",
  });

  const [signUpFormData, setSignUpFormData] = useState({
    userName: "",
    userEmail: "",
    phoneNumber: "",
    password: "",
  });

  const [auth, setAuth] = useState({
    authenticate: false,
    user: null,
  });

  const [loading, setLoading] = useState(true);

  // Register User
  async function handleRegisterUser() {
    try {
      const response = await axiosInstance.post("/auth/register", {
        ...signUpFormData,
        role: "user",
      });

      if (response.data.success) {
        Toast.show({
          type: "success",
          text1: "Registration successful!",
        });
        router.push("/sign-in"); // Go to sign-in screen after signup
      } else {
        Toast.show({
          type: "error",
          text1: response.data.message || "Registration failed.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1:
          error.response?.data?.message || "Registration failed. Try again.",
      });
    }
  }

  // Login User
  async function handleLoginUser() {
    try {
      setLoading(true);
      const response = await axiosInstance.post("/auth/login", signInFormData);
      const data = response.data;

      if (data.success) {
        await SecureStore.setItemAsync("accessToken", data.data.accessToken);
        await SecureStore.setItemAsync("userId", data.data.user._id);

        setAuth({
          authenticate: true,
          user: data.data.user,
        });

        Toast.show({
          type: "success",
          text1: "You have successfully logged in!",
        });

        if (data.data.user.role === "admin") {
          router.push("/(tabs)/admin");
        } else {
          router.push("/(tabs)/home");
        }
      } else {
        setAuth({ authenticate: false, user: null });
        Toast.show({
          type: "error",
          text1:
            data?.message === "Invalid credentials"
              ? "Incorrect email or password"
              : data?.message || "Login failed. Please try again.",
        });
      }
    } catch (error) {
      setAuth({ authenticate: false, user: null });
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Check Auth on app load
  async function checkAuthUser() {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        setAuth({ authenticate: false, user: null });
        setLoading(false);
        return;
      }

      const response = await axiosInstance.get("/auth/check-auth", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      if (data.success) {
        setAuth({
          authenticate: true,
          user: data.data.user,
        // Clear the signup form
        setSignUpFormData({
          userName: "",
          userEmail: "",
          phoneNumber: "",
          password: "",
        });
      } else {
        setAuth({ authenticate: false, user: null });
      }
    } catch (error) {
      setAuth({ authenticate: false, user: null });
    } finally {
      setLoading(false);
    }
  }
    } finally {
      setLoading(false);

  // Logout
  async function resetCredentials() {
    setAuth({ authenticate: false, user: null });
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("userId");
    router.push("/(auth)/AuthScreen");
  }

  useEffect(() => {
    checkAuthUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signInFormData,
        setSignInFormData,
        signUpFormData,
        setSignUpFormData,
        handleRegisterUser,
        handleLoginUser,
        auth,
        resetCredentials,
        loading,
        isAuthenticated: auth.authenticate,
        currentUser: auth.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
