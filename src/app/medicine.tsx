
import React from "react";

import {
  View,
  Text,
  StyleSheet
} from "react-native";

export default function MedicineScreen() {

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Medicine Manager
      </Text>

      <Text style={styles.subtitle}>
        Manage your medicine schedules.
      </Text>

    </View>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },

  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#6C63FF"
  },

  subtitle: {
    fontSize: 15,
    color: "#777777",
    marginTop: 10
  }

});
