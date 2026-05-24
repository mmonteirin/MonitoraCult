import React from "react";
import { Text } from "react-native";
import {
  Colors,
  Typography,
} from "../styles/Colors";

export default function AppText({
  children,
  style,
  weight = "regular",
  muted = false,
  secondary = false,
  ...rest
}) {
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
            ? Colors.textMuted
            : secondary
            ? Colors.textSecondary
            : Colors.textPrimary,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
