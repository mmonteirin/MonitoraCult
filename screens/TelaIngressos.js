/**
 * 🎫 TELA DE COMPRA DE INGRESSOS
 * Interface completa para comprar ingressos de um evento
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { useIngressos } from "../hooks/useIngressos";
import { Colors } from "../styles/Colors";

import SeletorIngressos from "../components/SeletorIngressos";
import CarrinhoIngressos from "../components/CarrinhoIngressos";

const getPrecoBase = (evento) =>
  Number(
    evento?.precoIngresso ??  // campo canônico (AdmCadastroEvento)
    evento?.precoInteira  ??  // alias alternativo
    evento?.preco         ??  // legado
    evento?.valor         ??  // legado
    0
  ) || 0;

const isEventoGratuito = (evento) =>
  evento?.gratuito === true ||
  evento?.tipoEvento === "gratuito" ||
  getPrecoBase(evento) === 0;

export default function TelaIngressos({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  // Evento vem de params
  const evento = route.params?.evento;

  // Hook de ingressos
  const {
    carrinho,
    loading,
    adicionarAoCarrinho,
    removerDoCarrinho,
    atualizarQuantidade,
    limparCarrinho,
    comprar,
    total,
    quantidadeTotal,
  } = useIngressos();

  const [etapa, setEtapa] = useState("selecao"); // selecao, confirmacao, processando, sucesso

  const gratuito = useMemo(
    () => isEventoGratuito(evento),
    [evento]
  );

  const precoBase = useMemo(
    () => getPrecoBase(evento),
    [evento]
  );

  const precos = useMemo(() => {
    if (gratuito) return { inteira: 0, meia: 0, estudante: 0, senior: 0, promocional: 0 };
    return {
      inteira:    Number(evento?.precoIngresso ?? evento?.precoInteira ?? precoBase),
      meia:       Number(evento?.precoMeia        || precoBase * 0.5),
      estudante:  Number(evento?.precoEstudante   || precoBase * 0.7),
      senior:     Number(evento?.precoSenior      || precoBase * 0.5),
      promocional:Number(evento?.precoPromocional || precoBase * 0.5),
    };
  }, [gratuito, precoBase, evento]);

  // Verificar disponibilidade
  const capacidadeRestante = useMemo(() => {
    const capacidade = Number(evento?.capacidade || 0);
    const vendidos = evento?.ingressosVendidos || 0;

    if (capacidade <= 0) return null;

    return Math.max(0, capacidade - vendidos);
  }, [evento]);

  const temIngressos =
    capacidadeRestante === null ||
    capacidadeRestante >= quantidadeTotal;

  if (!evento) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Evento não encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVoltar}>
          <Text style={styles.btnVoltarText}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Processar compra
  const handleComprar = async () => {
    if (!user?.uid) {
      Alert.alert("Erro", "Você precisa estar logado para comprar ingressos");
      navigation.navigate("PerfilLogin");
      return;
    }

    if (!temIngressos) {
      Alert.alert("Aviso", "Não há ingressos suficientes");
      return;
    }

    setEtapa("processando");

    try {
      const resultado = await comprar(
        evento.id,
        user.uid,
        profile?.nome || user.email,
        user.email,
        profile?.foto || "",
        gratuito ? "gratuito" : "credit_card"
      );

      setEtapa("sucesso");

      // Mostrar resultado
      setTimeout(() => {
        Alert.alert(
          "✅ Sucesso!",
          resultado.mensagem,
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 500);
    } catch (erro) {
      setEtapa("selecao");
      Alert.alert("Erro", erro.message || "Erro ao processar compra");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.background}
      />

      {/* HEADER */}
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.btnVoltarHeader}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {gratuito ? "Reservar Ingressos" : "Comprar Ingressos"}
        </Text>

        <View style={{ width: 44 }} />
      </LinearGradient>

      {/* CONTEÚDO */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INFO DO EVENTO */}
        <View style={styles.eventoCard}>
          <Image
            source={{ uri: evento.imagemEvento || "https://placehold.co/400" }}
            style={styles.eventoImage}
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.eventoOverlay}
          >
            <Text style={styles.eventoTitulo}>{evento.tituloEvento}</Text>

            <View style={styles.eventoMeta}>
              <MaterialCommunityIcons
                name="calendar"
                size={14}
                color="#fff"
              />
              <Text style={styles.eventoMetaText}>
                {evento.dataEvento} às {evento.horaInicio}
              </Text>
            </View>

            <View style={styles.eventoMeta}>
              <MaterialCommunityIcons
                name="map-marker"
                size={14}
                color="#fff"
              />
              <Text style={styles.eventoMetaText}>
                {evento.localEvento}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* DISPONIBILIDADE */}
        {capacidadeRestante === null || capacidadeRestante > 0 ? (
          <View style={styles.disponibilidade}>
            <MaterialCommunityIcons
              name="check-circle"
              size={18}
              color={Colors.success}
            />
            <Text style={styles.disponibilidadeText}>
              {capacidadeRestante === null
                ? "Ingressos disponíveis"
                : `${capacidadeRestante} ingresso(s) disponível(is)`}
            </Text>
          </View>
        ) : (
          <View style={styles.indisponibilidade}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={Colors.error}
            />
            <Text style={styles.indisponibilidadeText}>
              Evento lotado - Sem ingressos disponíveis
            </Text>
          </View>
        )}

        {/* SELETOR DE INGRESSOS */}
        {etapa === "selecao" &&
          (capacidadeRestante === null || capacidadeRestante > 0) && (
          <SeletorIngressos
            precos={precos}
            carrinho={carrinho}
            onAdionar={adicionarAoCarrinho}
            onRemover={removerDoCarrinho}
            gratuito={gratuito}
          />
        )}

        {/* MENSAGEM DE SUCESSO */}
        {etapa === "sucesso" && (
          <View style={styles.sucesso}>
            <MaterialCommunityIcons
              name="check-circle"
              size={64}
              color={Colors.success}
            />
            <Text style={styles.sucessoTitle}>Compra Confirmada!</Text>
            <Text style={styles.sucessoText}>
              Seus ingressos foram enviados para o seu email
            </Text>
          </View>
        )}

        {/* PROCESSANDO */}
        {etapa === "processando" && (
          <View style={styles.processando}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.processandoText}>Processando compra...</Text>
          </View>
        )}
      </ScrollView>

      {/* CARRINHO FLUTUANTE */}
      {etapa === "selecao" &&
        (capacidadeRestante === null || capacidadeRestante > 0) && (
        <View style={styles.carrinhoContainer}>
          <CarrinhoIngressos
            carrinho={carrinho}
            total={total}
            quantidadeTotal={quantidadeTotal}
            loading={loading}
            nomeEvento={evento.tituloEvento}
            dataEvento={`${evento.dataEvento} às ${evento.horaInicio}`}
            onRemover={removerDoCarrinho}
            onComprar={handleComprar}
            gratuito={gratuito}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  btnVoltarHeader: {
    padding: 8,
    marginLeft: -8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  eventoCard: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    marginVertical: 16,
    height: 280,
  },

  eventoImage: {
    width: "100%",
    height: "100%",
  },

  eventoOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  eventoTitulo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },

  eventoMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },

  eventoMetaText: {
    fontSize: 12,
    color: "#fff",
  },

  disponibilidade: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.success + "20",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },

  disponibilidadeText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: "600",
    flex: 1,
  },

  indisponibilidade: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.error + "20",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },

  indisponibilidadeText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: "600",
    flex: 1,
  },

  sucesso: {
    alignItems: "center",
    paddingVertical: 60,
  },

  sucessoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 16,
  },

  sucessoText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  processando: {
    alignItems: "center",
    paddingVertical: 60,
  },

  processandoText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 16,
  },

  carrinhoContainer: {
    backgroundColor: Colors.surface,
  },

  btnVoltar: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },

  btnVoltarText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },

  errorText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginTop: 16,
    fontWeight: "600",
  },
});