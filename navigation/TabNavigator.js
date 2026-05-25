import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import {
    View,
    Platform,
    TouchableOpacity,
    StyleSheet,
} from "react-native";

import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolateColor,
} from "react-native-reanimated";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// STACKS
import HomeStack from "./HomeStack";
import BuscaStack from "./BuscaStack";
import FeedStack from "./FeedStack";
import EventoStack from "./EventoStack";
import PerfilStack from "./PerfilStack";

// STYLES
import {
    Colors,
    Radius,
    Shadows,
    Typography,
} from "../styles/Colors";

const Tab = createBottomTabNavigator();

const shadowFor = (shadow) =>
    Platform.OS === "web" ? shadow.web : shadow.default;

// ─────────────────────────────────────────────
// TAB ICON
// ─────────────────────────────────────────────
function CustomTabIcon({
    focused,
    icon,
    label,
    onPress,
}) {
    const progress = useSharedValue(focused ? 1 : 0);

    const isSocial = label === "Social";

    React.useEffect(() => {
        progress.value = withSpring(focused ? 1 : 0, {
            damping: 16,
            stiffness: 180,
            mass: 0.8,
        });
    }, [focused]);

    // FLOATING EFFECT
    const animatedContainer = useAnimatedStyle(() => ({
        transform: [
            {
                scale: 1 + progress.value * 0.06,
            },
            {
                translateY:
                    isSocial
                        ? -10 - progress.value * 4
                        : progress.value * -4,
            },
        ],
    }));

    // ICON BACKGROUND
    const animatedIcon = useAnimatedStyle(() => ({
        transform: [
            {
                scale: 1 + progress.value * 0.08,
            },
        ],

        backgroundColor: interpolateColor(
            progress.value,
            [0, 1],
            [
                "rgba(108,92,231,0.16)",
                "rgba(108,92,231,0.98)",
            ]
        ),

        borderColor: interpolateColor(
            progress.value,
            [0, 1],
            [
                "rgba(139,124,255,0.25)",
                "rgba(167,139,250,1)",
            ]
        ),

        ...(Platform.OS === "web"
            ? {
                  boxShadow:
                      progress.value > 0
                          ? `0px 12px 34px ${Colors.purpleGlow}`
                          : `0px 4px 18px rgba(0,0,0,0.22)`,
              }
            : {
                  shadowOpacity: 0.18 + progress.value * 0.32,
                  shadowRadius: 10 + progress.value * 18,
              }),
    }));

    // LABEL
    const animatedText = useAnimatedStyle(() => ({
        opacity: 0.65 + progress.value * 0.35,
        transform: [
            {
                translateY: progress.value * -1,
            },
        ],
    }));

    // ACTIVE INDICATOR
    const slidingIndicator = useAnimatedStyle(() => ({
        opacity: progress.value,
        transform: [
            {
                scaleX: progress.value,
            },
        ],
    }));

    return (
        <TouchableOpacity
            activeOpacity={0.92}
            onPress={onPress}
            style={styles.touchable}
        >
            <Animated.View
                style={[
                    styles.tabItem,
                    animatedContainer,
                ]}
            >
                {/* ACTIVE BACKGROUND */}
                {focused && (
                    <Animated.View
                        entering={FadeIn.duration(220)}
                        style={styles.activePill}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(139,124,255,0.22)",
                                "rgba(108,92,231,0.10)",
                                "transparent",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activePillGradient}
                        />
                    </Animated.View>
                )}

                {/* GLOW */}
                {focused && (
                    <Animated.View
                        entering={FadeIn.duration(300)}
                        style={styles.glowContainer}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(139,124,255,0.55)",
                                "transparent",
                            ]}
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.glow}
                        />
                    </Animated.View>
                )}

                {/* ICON */}
                <Animated.View
                    style={[
                        styles.iconWrapper,
                        isSocial && styles.socialButton,
                        animatedIcon,
                    ]}
                >
                    <MaterialCommunityIcons
                        name={icon}
                        size={isSocial ? 30 : focused ? 25 : 23}
                        color="#FFF"
                    />
                </Animated.View>

                {/* LABEL */}
                <Animated.Text
                    style={[
                        styles.label,
                        animatedText,
                        {
                            color: focused
                                ? "#FFF"
                                : "rgba(255,255,255,0.68)",
                        },
                    ]}
                >
                    {label}
                </Animated.Text>

                {/* SLIDER */}
                {focused && (
                    <Animated.View
                        entering={FadeInDown.duration(250)}
                        style={[
                            styles.bottomIndicator,
                            slidingIndicator,
                        ]}
                    />
                )}
            </Animated.View>
        </TouchableOpacity>
    );
}

// ─────────────────────────────────────────────
// MAIN TAB
// ─────────────────────────────────────────────
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
                            ? insets.bottom + 8
                            : 12,

                    height: 92,

                    paddingTop: 10,

                    borderTopWidth: 0,

                    backgroundColor: "transparent",

                    elevation: 0,

                    ...shadowFor(Shadows.glow),
                },

                // GLASS BACKGROUND
                tabBarBackground: () => (
                    <View style={StyleSheet.absoluteFill}>
                        <BlurView
                            intensity={120}
                            tint="dark"
                            style={styles.blurContainer}
                        >
                            {/* TOP LIGHT */}
                            <LinearGradient
                                colors={[
                                    "rgba(167,139,250,0.45)",
                                    "rgba(108,92,231,0.10)",
                                    "transparent",
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.topHighlight}
                            />

                            {/* OVERLAY */}
                            <LinearGradient
                                colors={[
                                    "rgba(12,14,22,0.94)",
                                    "rgba(16,19,31,0.90)",
                                    "rgba(7,11,20,0.92)",
                                ]}
                                style={styles.overlay}
                            />
                        </BlurView>
                    </View>
                ),

                // CUSTOM BUTTON
                tabBarButton: (props) => {
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
                            iconName = focused
                                ? "home-variant"
                                : "home-variant-outline";
                            label = "Início";
                            break;

                        case "Busca":
                            iconName = focused
                                ? "magnify"
                                : "magnify";
                            label = "Buscar";
                            break;

                        case "Feed":
                            iconName = focused
                                ? "account-group"
                                : "account-group-outline";
                            label = "Social";
                            break;

                        case "Eventos":
                            iconName = focused
                                ? "calendar-star"
                                : "calendar-star-outline";
                            label = "Eventos";
                            break;

                        case "Conta":
                            iconName = focused
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
                name="Conta"
                component={PerfilStack}
            />
        </Tab.Navigator>
    );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    // BACKGROUND
    blurContainer: {
        flex: 1,

        borderRadius: 34,

        overflow: "hidden",

        borderWidth: 1,

        borderColor: "rgba(139,124,255,0.18)",

        backgroundColor: "rgba(7,11,20,0.88)",
    },

    topHighlight: {
        position: "absolute",

        top: 0,
        left: 0,
        right: 0,

        height: 1.4,
    },

    overlay: {
        flex: 1,
    },

    // BUTTON AREA
    touchable: {
        flex: 1,

        alignItems: "center",
        justifyContent: "center",
    },

    tabItem: {
        width: 78,
        height: 82,

        alignItems: "center",
        justifyContent: "center",
    },

    // ACTIVE BACKGROUND
    activePill: {
        position: "absolute",

        top: 4,

        width: 72,
        height: 72,

        borderRadius: 28,

        overflow: "hidden",

        borderWidth: 1,

        borderColor: "rgba(139,124,255,0.20)",
    },

    activePillGradient: {
        flex: 1,
    },

    // GLOW
    glowContainer: {
        position: "absolute",

        top: -12,
    },

    glow: {
        width: 90,
        height: 90,

        borderRadius: 999,
    },

    // ICON
    iconWrapper: {
        width: 58,
        height: 58,

        borderRadius: 22,

        alignItems: "center",
        justifyContent: "center",

        borderWidth: 1.4,

        borderColor: "rgba(139,124,255,0.30)",

        backgroundColor: "rgba(108,92,231,0.16)",

        shadowColor: Colors.primary,

        shadowOpacity: 0.35,

        shadowRadius: 18,

        shadowOffset: {
            width: 0,
            height: 8,
        },

        elevation: 10,

        ...(Platform.OS === "web" && {
            boxShadow: `0px 10px 28px ${Colors.purpleGlow}`,
            backdropFilter: "blur(14px)",
        }),
    },

    // SOCIAL CENTER BUTTON
    socialButton: {
        width: 74,
        height: 74,

        borderRadius: 28,

        marginTop: -26,

        backgroundColor: Colors.primary,

        borderColor: "rgba(255,255,255,0.18)",

        borderWidth: 1.8,

        shadowColor: Colors.primary,

        shadowOpacity: 0.55,

        shadowRadius: 24,

        shadowOffset: {
            width: 0,
            height: 10,
        },

        elevation: 20,

        ...(Platform.OS === "web" && {
            boxShadow: `0px 18px 42px ${Colors.purpleGlow}`,
        }),
    },

    // LABEL
    label: {
        fontSize: 11,

        fontFamily: Typography.semiBold,

        marginTop: 7,

        letterSpacing: 0.2,
    },

    // INDICATOR
    bottomIndicator: {
        width: 18,
        height: 4,

        borderRadius: 999,

        backgroundColor: Colors.primaryLight,

        marginTop: 6,

        shadowColor: Colors.primaryLight,

        shadowOpacity: 0.7,

        shadowRadius: 10,

        shadowOffset: {
            width: 0,
            height: 0,
        },
    },
});