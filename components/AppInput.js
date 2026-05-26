import React from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import { Controller } from "react-hook-form";
import {
  Radius,
  Typography,
} from "../styles/Colors";
import { useColors } from "../context/ThemeContext";

export default function AppInput({
  control,
  name,
  label,
  rules,
  ...props
}) {
  const colors = useColors();
  const styles = createStyles(colors);
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>

          <TextInput
            value={value}
            onChangeText={onChange}
            {...props}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              error && styles.inputError,
              props.style,
            ]}
          />

          {error && (
            <Text style={styles.error}>
              {error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: Typography.medium,
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 11,
    marginTop: 6,
    fontFamily: Typography.medium,
  },
});
