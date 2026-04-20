import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import TelaInicio from "../screens/TelaInicio";
import TelaBusca from "../screens/TelaBusca";
import TelaFeed from "../screens/TelaFeed";
import PerfilGeral from "../screens/PerfilGeral";

import AnimatedTabIcon from "./AnimatedTabIcon";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,

				tabBarIcon: ({ color, size, focused }) => {
					let iconName;

					if (route.name === "Inicio") {
						iconName = focused ? "home" : "home-outline";
					} else if (route.name === "Busca") {
						iconName = "magnify";
					} else if (route.name === "Feed") {
						iconName = focused ? "view-grid" : "view-grid-outline";
					} else if (route.name === "Perfil") {
						iconName = focused ? "account" : "account-outline";
					}

					return (
						<AnimatedTabIcon
							name={iconName}
							size={size}
							color={color}
							focused={focused}
						/>
					);
				},

				tabBarActiveTintColor: "#4CAF50",
				tabBarInactiveTintColor: "gray",

				tabBarStyle: {
					backgroundColor: "#111",
					borderTopWidth: 0,
					height: 60,
				},

				tabBarShowLabel: false, // opcional estilo moderno
			})}
		>
			<Tab.Screen name="Inicio" component={TelaInicio} />
			<Tab.Screen name="Busca" component={TelaBusca} />
			<Tab.Screen name="Feed" component={TelaFeed} />
			<Tab.Screen name="Perfil" component={PerfilGeral} />
		</Tab.Navigator>
	);
}
