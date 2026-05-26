import React from "react";
import { Text } from "react-native";
import {
  Typography,
} from "../styles/Colors";
import { useColors } from "../context/ThemeContext";

export default function AppText({
  children,
  style,
  weight = "regular",
  muted = false,
  secondary = false,
  ...rest
}) {
  const colors = useColors();
  let fontFamily = Typography.regular;

  if (weight === "medium") fontFamily = Typography.medium;
  if (weight === "semibold") fontFamily = Typography.semiBold;
  if (weight === "bold") fontFamily = Typography.bold;

  return (
    <Text
      style={[
        {
          fontFamily,
          color: muted
            ? colors.textMuted
            : secondary
            ? colors.textSecondary
            : colors.textPrimary,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
