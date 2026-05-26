// components/DrawerAvatar.js

import React from "react";

import {
	Image,
	TouchableOpacity,
} from "react-native";

import { useAuth } from "../context/AuthContext";

import { Colors } from "../styles/Colors";

export default function DrawerAvatar({
	navigation,
}) {
	const { foto, user } = useAuth();

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() =>
				navigation.openDrawer()
			}
		>
			<Image
				source={{
					uri:
						foto ||
						user?.photoURL ||
						"https://i.pravatar.cc/100",
				}}
				style={{
					width: 38,
					height: 38,
					borderRadius: 22,
					marginLeft: 15,
					borderWidth: 2,
					borderColor:
						Colors.primary,
				}}
			/>
		</TouchableOpacity>
	);
}