import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { initializeDatabase } from "../database/database";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      console.log("Starting database initialization...");

      initializeDatabase();

      console.log("Database initialization completed!");

      setIsReady(true);
    } catch (err) {
      console.error("Database initialization failed:", err);
      setError("Unable to initialize the database.");
    }
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text>Loading LifeVault...</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
