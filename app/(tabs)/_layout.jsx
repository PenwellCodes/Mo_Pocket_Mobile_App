import React from "react";
import { StatusBar } from "expo-status-bar";
import { Tabs, usePathname, useRouter } from "expo-router";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";
import { useTheme } from "react-native-paper";
import Feather from "@expo/vector-icons/Feather";
import { useAuth } from "../../context/appstate/AuthContext"; // Import AuthContext

const TabIcon = ({ icon, color, label, isActive }) => (
  <View style={{ alignItems: "center", width: 70 }}>
    {icon({ color })}
    {isActive && (
      <Text
        style={{ color, fontSize: 12, textAlign: "center", flexWrap: "wrap" }}
      >
        {label}
      </Text>
    )}
  </View>
);

const TabLayout = () => {
  const { colors, dark } = useTheme();
  const pathname = usePathname(); // Get current active route
  const { auth } = useAuth(); // Get user state from AuthContext
  const router = useRouter();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.tertiary,
          tabBarShowLabel: false,
          tabBarStyle: {
            height: 60,
            borderTopWidth: 0,
            backgroundColor: colors.background,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabIcon
                icon={() => <AntDesign name="home" size={24} color={color} />}
                color={color}
                label="Home"
                isActive={pathname === "/home"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="deposit"
          options={{
            title: "Deposit",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabIcon
                icon={() => <AntDesign name="plus" size={24} color={color} />}
                color={color}
                label="Deposit"
                isActive={pathname === "/deposit"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="withdraw"
          options={{
            title: "Withdraw",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabIcon
                icon={() => <AntDesign name="minus" size={24} color={color} />}
                color={color}
                label="Withdraw"
                isActive={pathname === "/withdraw"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="vaults"
          options={{
            title: "Vaults",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabIcon
                icon={() => <AntDesign name="bank" size={24} color={color} />}
                color={color}
                label="Vaults"
                isActive={pathname === "/vaults"}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabIcon
                icon={() => (
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={color}
                  />
                )}
                color={color}
                label="Settings"
                isActive={pathname === "/settings"}
              />
            ),
          }}
        />
        {/* Admin tab - only show if user is admin */}
        {auth.user?.role === 'admin' && (
          <Tabs.Screen
            name="admin"
            options={{
              title: "Admin",
              headerShown: false,
              tabBarIcon: ({ color }) => (
                <TabIcon
                  icon={() => <Ionicons name="shield" size={24} color={color} />}
                  color={color}
                  label="Admin"
                  isActive={pathname === "/admin"}
                />
              ),
            }}
          />
        )}
        <Tabs.Screen
          name="location"
          options={{
            title: "Location",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <TabIcon
                icon={() => <Feather name="map-pin" size={24} color={color} />}
                color={color}
                label="Locations"
                isActive={pathname === "/location"}
              />
            ),
          }}
        />
      </Tabs>
      <StatusBar backgroundColor={colors.background} style="standard" />
    </>
  );
};

export default TabLayout;
