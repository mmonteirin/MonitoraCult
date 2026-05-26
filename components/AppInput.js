import React from "react";
import { StyleSheet, View, Text, TextInput } from "react-native";
import { Controller } from "react-hook-form";
import {
  Colors,
  Radius,
  Typography,
} from "../styles/Colors";

export default function AppInput({
  control,
  name,
  label,
  rules,
  ...props
}) {
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
            placeholderTextColor={Colors.textMuted}
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Typography.medium,
    marginBottom: 7,
  },
  input: {
    minHeight: 52,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    fontFamily: Typography.regular,
    fontSize: 14,
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    color: Colors.error,
    fontSize: 11,
    marginTop: 6,
    fontFamily: Typography.medium,
  },
});
