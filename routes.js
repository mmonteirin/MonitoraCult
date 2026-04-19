import React, { useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TelaInicio from "./screens/TelaInicio";
import TelaBusca from "./screens/TelaBusca";
import TelaFeed from "./screens/TelaFeed";
import perfilEventos from "./screens/perfilEventos";
import perfilGeral from "./screens/perfilGeral";
import perfilLogin from "./screens/perfilLogin";

import { Entypo, Feather } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

export default function Routes() {
const [isLogged, setIsLogged] = useState(false);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#fff",
          elevation: 5,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={TelaInicio}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Entypo name="home" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Busca"
        component={TelaBusca}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Feed"
        component={TelaFeed}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Entypo name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Eventos"
        component={perfilEventos}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Entypo name="calendar" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={isLogged ? perfilGeral : perfilLogin}
        options={{
          tabBarIcon: ({ size, color }) => (
            <Entypo name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
