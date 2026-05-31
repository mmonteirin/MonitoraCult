// components/DrawerAvatar.js

import React from "react";

import {
	View,
	TouchableOpacity,
} from "react-native";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useColors } from "../context/ThemeContext";

export default function DrawerAvatar({
	navigation,
}) {
	const colors = useColors();

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() =>
				navigation.openDrawer()
			}
			style={{
				marginLeft: 15,
				width: 42,
				height: 42,
				borderRadius: 12,
				backgroundColor: colors.primary + "15",
				justifyContent: "center",
				alignItems: "center",
				borderWidth: 1.5,
				borderColor: colors.primary + "30",
			}}
		>
			<MaterialCommunityIcons
				name="menu"
				size={24}
				color={colors.primary}
			/>
		</TouchableOpacity>
	);
}
