import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../context/appstate/AuthContext";
import { View, ActivityIndicator } from "react-native";

const AuthLayout = () => {
  const { loading, auth } = useAuth();

  if (loading) {
    // Show loading spinner while checking auth
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0070C0" />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (auth.authenticate) {
    // If authenticated, redirect to home (or main app)
    return <Redirect href="/(tabs)/home" />;
  } else {
    // If NOT authenticated, show auth stack (login/signup/etc)
    return (
      <>
        <Stack>
          <Stack.Screen
            name="welcome"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AuthScreen"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </>
    );
  }
};

export default AuthLayout;
