# 📱 Exemplos de Uso - Sistema Social

## 1. Tela Pública do Perfil

```javascript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getPublicProfile, getCreatorEvents, getCreatorMetrics } from "../services/profileService";
import { useAuth } from "../context/AuthContext";
import { FollowButton } from "../components/FollowButton";
import { VerifiedBadgeIcon } from "../components/VerifiedBadge";
import { CreatorStats } from "../components/CreatorStats";
import { Colors } from "../styles/Colors";

export default function PerfilPublico({ route, navigation }) {
  const { userId } = route.params;
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, eventsData] = await Promise.all([
          getPublicProfile(userId),
          getCreatorEvents(userId, 10),
        ]);

        setProfile(profileData);
        setEvents(eventsData);
      } catch (error) {
        console.log("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <Text style={{ color: Colors.textPrimary }}>Perfil não encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: Colors.background }}>
      {/* Header com Avatar */}
      <LinearGradient colors={[Colors.primary, Colors.background]} style={{ paddingVertical: 30, paddingHorizontal: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Image source={{ uri: profile.photoURL }} style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12 }} />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
              {profile.displayName}
            </Text>
            {profile.isVerified && <VerifiedBadgeIcon badgeType={profile.verifiedBadge} />}
          </View>
          {profile.bio && <Text style={{ color: "#ddd", fontSize: 13, marginTop: 4 }}>{profile.bio}</Text>}
        </View>

        {/* Stats */}
        <CreatorStats userId={userId} followers={profile.followers} following={profile.following} />

        {/* Action Buttons */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          {user?.uid !== userId ? (
            <>
              <View style={{ flex: 1 }}>
                <FollowButton targetUserId={userId} targetUserData={profile} />
              </View>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: Colors.primary,
                  borderRadius: 12,
                  paddingVertical: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
                onPress={() => {
                  // TODO: navegar para chat
                }}
              >
                <MaterialCommunityIcons name="message" size={16} color={Colors.primary} />
                <Text style={{ color: Colors.primary, fontWeight: "600", fontSize: 13 }}>
                  Mensagem
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: Colors.primary,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
              }}
              onPress={() => navigation.navigate("PerfilEditar")}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                Editar Perfil
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bio Links */}
        {profile.bio_links && profile.bio_links.length > 0 && (
          <View style={{ marginTop: 16, gap: 8 }}>
            {profile.bio_links.map((link, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <MaterialCommunityIcons name="link" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "500" }}>
                  {link.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </LinearGradient>

      {/* Eventos */}
      <View style={{ padding: 16 }}>
        <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "bold", marginBottom: 12 }}>
          Eventos ({events.length})
        </Text>

        {events.length === 0 ? (
          <Text style={{ color: Colors.textSecondary, textAlign: "center", paddingVertical: 20 }}>
            Nenhum evento ainda
          </Text>
        ) : (
          <FlatList
            data={events}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: Colors.surface,
                  borderRadius: 12,
                  marginBottom: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
                onPress={() => navigation.navigate("Detalhes", { evento: item })}
              >
                <Image
                  source={{ uri: item.imagemEvento }}
                  style={{ width: "100%", height: 140 }}
                />
                <View style={{ padding: 12 }}>
                  <Text style={{ color: Colors.textPrimary, fontWeight: "bold", fontSize: 13 }}>
                    {item.tituloEvento}
                  </Text>
                  <Text style={{ color: Colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                    📍 {item.localEvento}
                  </Text>
                  <Text style={{ color: Colors.primary, fontSize: 11, marginTop: 4 }}>
                    📅 {item.dataEvento}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}
```

---

## 2. Tela de Chat

```javascript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  getOrCreateChat,
  sendMessage,
  onChatMessages,
  getChatOtherUser,
  markMessagesAsRead,
} from "../services/chatService";
import { useAuth } from "../context/AuthContext";
import { Colors } from "../styles/Colors";

export default function TelaChat({ route, navigation }) {
  const { otherUserId, otherUserData } = route.params;
  const { user } = useAuth();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initChat = async () => {
      try {
        const cId = await getOrCreateChat(otherUserId, otherUserData);
        setChatId(cId);
        setLoading(false);
      } catch (error) {
        console.log("Erro ao iniciar chat:", error);
        setLoading(false);
      }
    };

    initChat();
  }, [otherUserId]);

  useEffect(() => {
    if (!chatId) return;

    // Marcar como lido
    markMessagesAsRead(chatId, user.uid);

    // Listener em tempo real
    const unsubscribe = onChatMessages(chatId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId, user.uid]);

  const handleSend = async () => {
    if (!messageText.trim() || !chatId) return;

    try {
      setSending(true);
      await sendMessage(chatId, messageText);
      setMessageText("");
    } catch (error) {
      console.log("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Image source={{ uri: otherUserData?.photoURL }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <Text style={{ color: Colors.textPrimary, fontWeight: "bold", fontSize: 14 }}>
            {otherUserData?.displayName}
          </Text>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons name="information-outline" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={({ item }) => {
          const isOwn = item.senderId === user.uid;
          return (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                flexDirection: isOwn ? "row-reverse" : "row",
                alignItems: "flex-end",
                marginBottom: 8,
              }}
            >
              <View
                style={{
                  maxWidth: "85%",
                  backgroundColor: isOwn ? Colors.primary : Colors.surface,
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderBottomLeftRadius: isOwn ? 16 : 0,
                  borderBottomRightRadius: isOwn ? 0 : 16,
                }}
              >
                <Text style={{ color: isOwn ? "#fff" : Colors.textPrimary, fontSize: 13 }}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 12 }}
      />

      {/* Input */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }}
      >
        <TextInput
          placeholder="Mensagem..."
          placeholderTextColor={Colors.textMuted}
          value={messageText}
          onChangeText={setMessageText}
          style={{
            flex: 1,
            backgroundColor: Colors.surface,
            color: Colors.textPrimary,
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: Colors.border,
            fontSize: 13,
          }}
          multiline
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !messageText.trim()}
          style={{
            backgroundColor: Colors.primary,
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: "center",
            alignItems: "center",
            opacity: sending || !messageText.trim() ? 0.5 : 1,
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
```

---

## 3. Tela de Seguidores

```javascript
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { getFollowers, getFollowing } from "../services/followService";
import { FollowButton } from "../components/FollowButton";
import { Colors } from "../styles/Colors";

export default function TelaSeguidores({ route, navigation }) {
  const { userId, tab } = route.params; // tab: "followers" ou "following"
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data =
          tab === "followers"
            ? await getFollowers(userId)
            : await getFollowing(userId);
        setUsers(data);
      } catch (error) {
        console.log("Erro ao carregar usuários:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userId, tab]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: "bold" }}>
            {tab === "followers" ? "Seguidores" : "Seguindo"}
          </Text>
        </View>
      </View>

      {/* Lista */}
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.5,
              borderBottomColor: Colors.border,
            }}
            onPress={() =>
              navigation.push("PerfilPublico", {
                userId: item.followerId || item.targetUserId,
              })
            }
          >
            <Image
              source={{
                uri: item.followerPhoto || item.targetPhoto,
              }}
              style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: Colors.textPrimary, fontWeight: "600", fontSize: 14 }}>
                {item.followerName || item.targetName}
              </Text>
            </View>
            {/* Botão de ação pode variar conforme lógica */}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.followerId || item.targetUserId}
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ color: Colors.textSecondary }}>
              Nenhum usuário
            </Text>
          </View>
        }
      />
    </View>
  );
}
```

---

## 4. Integração com TelaFeed (exibir feed de seguidos)

```javascript
import { getFollowingEvents } from "../services/followService";

// Na TelaFeed, adicionar aba "Seguidos"
const [tab, setTab] = useState("todos"); // "todos" ou "seguidos"

useEffect(() => {
  const loadEvents = async () => {
    try {
      let data;
      if (tab === "todos") {
        data = await getEventosApp();
      } else {
        data = await getFollowingEvents(user.uid);
      }
      setEventos(data);
    } catch (error) {
      console.log("Erro ao carregar eventos:", error);
    }
  };

  loadEvents();
}, [tab, user.uid]);

// Renderizar abas
<View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
  <TouchableOpacity
    onPress={() => setTab("todos")}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: tab === "todos" ? Colors.primary : Colors.surface,
    }}
  >
    <Text
      style={{
        color: tab === "todos" ? "#fff" : Colors.textSecondary,
        fontWeight: "600",
        fontSize: 13,
      }}
    >
      Todos
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={() => setTab("seguidos")}
    style={{
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: tab === "seguidos" ? Colors.primary : Colors.surface,
    }}
  >
    <Text
      style={{
        color: tab === "seguidos" ? "#fff" : Colors.textSecondary,
        fontWeight: "600",
        fontSize: 13,
      }}
    >
      Seguidos
    </Text>
  </TouchableOpacity>
</View>
```

---

## Próximas Implementações

1. **Search de Usuários** - Integrar com Algolia
2. **Notificações Push** - Usar expo-notifications
3. **Integração Spotify** - Mostrar agora tocando
4. **Admin Dashboard** - Verificar criadores
5. **Verificações Automáticas** - Badges por critérios
