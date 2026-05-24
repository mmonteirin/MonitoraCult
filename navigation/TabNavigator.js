import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
	View,
	Text,
	StyleSheet,
	Platform,
	TouchableOpacity,
} from "react-native";

import Animated, {
	FadeIn,
	FadeInDown,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	interpolateColor,
	withTiming,
} from "react-native-reanimated";

import { BlurView } from "expo-blur";

import { LinearGradient } from "expo-linear-gradient";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeStack from "./HomeStack";
import BuscaStack from "./BuscaStack";
import FeedStack from "./FeedStack";
import EventoStack from "./EventoStack";
import PerfilStack from "./PerfilStack";
import ComunidadeStack from "./ComunidadeStack";

import {
	Colors,
	Radius,
	Shadows,
	Typography,
} from "../styles/Colors";

const Tab = createBottomTabNavigator();

const colors = Colors;
const shadowFor = (shadow) =>
	Platform.OS === "web"
		? shadow.web
		: shadow.default;

function CustomTabIcon({
	focused,
	icon,
	label,
	onPress,
}) {
	const progress = useSharedValue(
		focused ? 1 : 0
	);

	React.useEffect(() => {
		progress.value = withSpring(
			focused ? 1 : 0,
			{
				damping: 16,
				stiffness: 160,
				mass: 0.8,
			}
		);
	}, [focused]);

	const animatedContainer =
		useAnimatedStyle(() => {
			return {
				transform: [
					{
						scale:
							1 +
							progress.value *
								0.06,
					},
					{
						translateY:
							progress.value *
							-4,
					},
				],
			};
		});

	const animatedIcon =
		useAnimatedStyle(() => {
			return {
				backgroundColor:
					interpolateColor(
						progress.value,
						[0, 1],
						[
							"rgba(255,255,255,0)",
							colors.primary,
						]
					),

				borderColor:
					interpolateColor(
						progress.value,
						[0, 1],
						[
							"rgba(255,255,255,0.06)",
							"rgba(255,255,255,0.12)",
						]
					),

				...(Platform.OS === "web"
					? {
							boxShadow:
								focused
									? `0px 8px 18px ${colors.purpleGlow}`
									: "none",
					  }
					: {
							shadowOpacity:
								progress.value *
								0.35,
							shadowRadius:
								progress.value *
								18,
					  }),
			};
		});

	const animatedText =
		useAnimatedStyle(() => {
			return {
				opacity:
					0.65 +
					progress.value * 0.35,

				transform: [
					{
						translateY:
							progress.value *
							-1,
					},
				],
			};
		});

	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onPress={onPress}
			style={styles.touchable}
		>
			<Animated.View
				style={[
					styles.tabItem,
					animatedContainer,
				]}
			>
				{/* GLOW */}
				{focused && (
					<Animated.View
						entering={FadeIn.duration(
							300
						)}
						style={
							styles.glowContainer
						}
					>
						<LinearGradient
							colors={[
								colors.primary +
									"66",
								"transparent",
							]}
							start={{
								x: 0.5,
								y: 0,
							}}
							end={{
								x: 0.5,
								y: 1,
							}}
							style={
								styles.glow
							}
						/>
					</Animated.View>
				)}

				{/* ICON */}
				<Animated.View
					style={[
						styles.iconWrapper,
						animatedIcon,
					]}
				>
					<MaterialCommunityIcons
						name={icon}
						size={
							focused ? 24 : 22
						}
						color={
							focused
								? "#FFF"
								: "rgba(255,255,255,0.72)"
						}
					/>
				</Animated.View>

				{/* LABEL */}
				<Animated.Text
					style={[
						styles.label,
						animatedText,
						{
							color:
								focused
									? "#FFF"
									: "rgba(255,255,255,0.65)",
						},
					]}
				>
					{label}
				</Animated.Text>

				{/* ACTIVE DOT */}
				{focused && (
					<Animated.View
						entering={FadeInDown.duration(
							250
						)}
						style={styles.dot}
					/>
				)}
			</Animated.View>
		</TouchableOpacity>
	);
}

export default function TabNavigator() {
	const insets = useSafeAreaInsets();

	return (
		<Tab.Navigator
			screenOptions={({ route }) => ({
				headerShown: false,

				tabBarShowLabel: false,

				tabBarHideOnKeyboard: false,

				tabBarStyle: {
					position: "absolute",

					left: 16,
					right: 16,

					bottom:
						Platform.OS === "ios"
							? insets.bottom + 10
							: 14,

					height: 82,

					paddingTop: 6,

					borderRadius: 32,

					borderTopWidth: 0,

					backgroundColor:
						"transparent",

					elevation: 0,

					...shadowFor(Shadows.card),
				},

				/* GLASS */
				tabBarBackground: () => (
					<View
						style={
							StyleSheet.absoluteFill
						}
					>
						<BlurView
							intensity={100}
							tint="dark"
							style={
								styles.blurContainer
							}
						>
							{/* TOP LIGHT */}
							<LinearGradient
								colors={[
									"rgba(255,255,255,0.14)",
									"rgba(255,255,255,0.03)",
									"transparent",
								]}
								start={{
									x: 0,
									y: 0,
								}}
								end={{
									x: 0,
									y: 1,
								}}
								style={
									styles.topHighlight
								}
							/>

							{/* OVERLAY */}
							<View
								style={
									styles.overlay
								}
							/>
						</BlurView>
					</View>
				),

				tabBarButton: (
					props
				) => {
					const {
						accessibilityState,
						onPress,
					} = props;

					const focused =
						accessibilityState?.selected;

					let iconName;
					let label;

					switch (route.name) {
						case "Inicio":
							iconName =
								focused
									? "home-variant"
									: "home-variant-outline";

							label = "Início";
							break;

						case "Busca":
							iconName =
								focused
									? "magnify"
									: "magnify";

							label = "Buscar";
							break;

						case "Feed":
							iconName =
								focused
									? "compass"
									: "compass-outline";

							label = "Feed";
							break;

						case "Eventos":
							iconName =
								focused
									? "calendar-star"
									: "calendar-star-outline";

							label = "Eventos";
							break;

						case "Comunidade":
							iconName =
								focused
									? "account-group"
									: "account-group-outline";

							label =
								"Comunidade";
							break;

						case "Conta":
							iconName =
								focused
									? "account-circle"
									: "account-circle-outline";

							label = "Perfil";
							break;
					}

					return (
						<CustomTabIcon
							focused={focused}
							icon={iconName}
							label={label}
							onPress={onPress}
						/>
					);
				},
			})}
		>
			<Tab.Screen
				name="Inicio"
				component={HomeStack}
			/>

			<Tab.Screen
				name="Busca"
				component={BuscaStack}
			/>

			<Tab.Screen
				name="Feed"
				component={FeedStack}
			/>

			<Tab.Screen
				name="Eventos"
				component={EventoStack}
			/>

			<Tab.Screen
				name="Comunidade"
				component={
					ComunidadeStack
				}
			/>

			<Tab.Screen
				name="Mensagens"
				component={MessagingStack}
			/>

			<Tab.Screen
				name="Notificacoes"
				component={NotificationsStack}
			/>

			<Tab.Screen
				name="Conta"
				component={PerfilStack}
			/>
		</Tab.Navigator>
	);
}

const styles = StyleSheet.create({
	/* GLASS */
	blurContainer: {
		flex: 1,

		borderRadius: Radius.xxl,

		overflow: "hidden",

		borderWidth: 1,

		borderColor:
			Colors.glassBorder,

		backgroundColor:
			"rgba(7,11,20,0.82)",
	},

	topHighlight: {
		position: "absolute",

		top: 0,
		left: 0,
		right: 0,

		height: 1.2,
	},

	overlay: {
		flex: 1,

		backgroundColor:
			"rgba(18,18,28,0.42)",
	},

	/* TAB */
	touchable: {
		flex: 1,

		alignItems: "center",

		justifyContent: "center",
	},

	tabItem: {
		width: 70,

		alignItems: "center",

		justifyContent: "center",
	},

	/* GLOW */
	glowContainer: {
		position: "absolute",

		top: -10,
	},

	glow: {
		width: 76,
		height: 76,

		borderRadius: 999,
	},

	/* ICON */
	iconWrapper: {
		width: 52,
		height: 52,

		borderRadius: 18,

		alignItems: "center",

		justifyContent: "center",

		borderWidth: 1,

		borderColor:
			Colors.glassBorder,

		backgroundColor:
			Colors.glass,

		...(Platform.OS !== "web" && {
			shadowColor:
				colors.primary,
		}),
	},

	/* LABEL */
	label: {
		fontSize: 11,

		fontFamily: Typography.semiBold,

		marginTop: 6,
	},

	/* DOT */
	dot: {
		width: 5,
		height: 5,

		borderRadius: 999,

		backgroundColor:
			colors.primary,

		marginTop: 5,
	},
});
