import "react-native-gesture-handler";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import "react-native-url-polyfill/auto";
import { SplashScreen, Stack } from "expo-router";
import GlobalContextProvider from "../context/appstate/GlobalContextProvider";
import { PaperProvider } from "react-native-paper";
import theme from "../theme/theme";
import Toast from "react-native-toast-message"; 
import { NotificationProvider } from "../context/NotificationContext";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/appstate/AuthContext";
import AdminProvider from "../context/appstate/AdminContext.js";



SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

try {
  TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error, executionInfo }) => {
    console.log("✅ Received a notification in the background!", {
      data,
      error,
      executionInfo,
    });
  });

  Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(error => {
    console.warn("Failed to register notification task:", error);
  });
} catch (error) {
  console.warn("Failed to setup background notification task:", error);
}

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <NotificationProvider>
  <PaperProvider theme={theme}>
    <AdminProvider>
      <AuthProvider>
        <GlobalContextProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(screens)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="dark" />
          <Toast position="bottom" bottomOffset={50} />
        </GlobalContextProvider>
      </AuthProvider>
    </AdminProvider>
  </PaperProvider>
</NotificationProvider>

  );
};

export default RootLayout;
