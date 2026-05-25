import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../styles/Colors";
import { useFollow } from "../hooks/useFollow";

/**
 * Botão para seguir/deixar de seguir usuário
 */
export const FollowButton = ({ targetUserId, targetUserData, onFollowChange }) => {
  const { isFollowing, loading, toggleFollow } = useFollow(
    targetUserId,
    targetUserData
  );

  const handlePress = async () => {
    const nextState = await toggleFollow();
    if (onFollowChange) {
      onFollowChange(nextState);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isFollowing ? Colors.surface : Colors.primary,
          borderColor: isFollowing ? Colors.primary : "transparent",
        },
      ]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.textPrimary} />
      ) : (
        <>
          <MaterialCommunityIcons
            name={isFollowing ? "check" : "plus"}
            size={16}
            color={isFollowing ? Colors.primary : "#fff"}
          />
          <Text
            style={[
              styles.text,
              { color: isFollowing ? Colors.primary : "#fff" },
            ]}
          >
            {isFollowing ? "Seguindo" : "Seguir"}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
    minWidth: 110,
  },
  text: {
    fontWeight: "600",
    fontSize: 13,
  },
};
