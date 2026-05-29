import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (role !== "admin") {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "red" }}>
          Acesso restrito a Organizadores
        </Text>
      </View>
    );
  }

  return children;
}