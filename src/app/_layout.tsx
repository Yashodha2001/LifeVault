import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { initializeDatabase } from "../database/database";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function setupDatabase() {
      try {
        console.log("Starting database initialization...");

        await initializeDatabase();

        console.log("Database initialization completed!");

        if (isMounted) {
          setIsReady(true);
        }
      } catch (err) {
        console.error("Database initialization failed:", err);
        if (isMounted) {
          setError("Unable to initialize the database.");
        }
      }
    }

    void setupDatabase();

    return () => {
      isMounted = false;
    };
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
