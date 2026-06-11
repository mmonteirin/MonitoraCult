/**
 * Tela de checkout - Stripe
 * 
 * Abre o Stripe Checkout hospedado e acompanha o status do pagamento.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';

import {
  METODOS_PAGAMENTO,
  STATUS_PAGAMENTO,
  criarPreferenciaPagamento,
  verificarStatusPagamento,
  obterResumoPagamento,
} from '../services/paymentService';

export default function CheckoutScreen({ route, navigation }) {
  const { evento, carrinho, total, quantidadeTotal } = route.params;
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedScreenStyles);
  const insets = useSafeAreaInsets();

  const [metodoSelecionado] = useState(METODOS_PAGAMENTO.STRIPE_CHECKOUT);
  const [loading, setLoading] = useState(false);
  const [pagamentoCriado, setPagamentoCriado] = useState(false);
  const [preferenciaData, setPreferenciaData] = useState(null);
  const [statusPagamento, setStatusPagamento] = useState(STATUS_PAGAMENTO.PENDENTE);
  const [verificando, setVerificando] = useState(false);

  const resumo = obterResumoPagamento(total, metodoSelecionado);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!pagamentoCriado || !preferenciaData?.sessionId) return;

    const interval = setInterval(async () => {
      if (statusPagamento === STATUS_PAGAMENTO.APROVADO) {
        clearInterval(interval);
        return;
      }

      try {
        setVerificando(true);
        const result = await verificarStatusPagamento({
          sessionId: preferenciaData.sessionId,
          pagamentoId: preferenciaData.pagamentoId,
        });
        
        if (result.status === STATUS_PAGAMENTO.APROVADO) {
          setStatusPagamento(STATUS_PAGAMENTO.APROVADO);
          clearInterval(interval);
          
          setTimeout(() => {
            Alert.alert(
              'Pagamento confirmado',
              'Seus ingressos foram gerados com sucesso.',
              [
                {
                  text: 'Ver Meus Ingressos',
                  onPress: () => navigation.navigate('TelaIngressos'),
                },
              ]
            );
          }, 1000);
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      } finally {
        setVerificando(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [pagamentoCriado, preferenciaData, statusPagamento]);

  const handleCriarPagamento = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert('Erro', 'Você precisa estar logado para continuar.');
      return;
    }

    try {
      setLoading(true);

      // Preparar dados dos ingressos
      const ingressosFormatados = carrinho.map(item => ({
        tipo: item.tipo,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        desconto: item.desconto,
      }));

      const result = await criarPreferenciaPagamento({
        eventoId: evento.id || evento.eventoId,
        eventoNome: evento.tituloEvento,
        valorTotal: resumo.valorFinal,
        userId: user.uid,
        userEmail: profile?.email || user.email,
        userName: profile?.nome || user.displayName || user.email,
        userPhoto: profile?.foto || user.photoURL || '',
        metodoPagamento: metodoSelecionado,
        ingressos: ingressosFormatados,
      });

      setPreferenciaData(result);
      setPagamentoCriado(true);
      setStatusPagamento(STATUS_PAGAMENTO.PENDENTE);

      if (result.checkoutUrl) {
        await WebBrowser.openBrowserAsync(result.checkoutUrl);
      }

    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      Alert.alert(
        'Erro',
        'Não foi possível criar o pagamento. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, [user, profile, carrinho, evento, metodoSelecionado, resumo]);

  const handleAbrirCheckout = async () => {
    if (preferenciaData?.checkoutUrl) {
      try {
        const supported = await Linking.canOpenURL(preferenciaData.checkoutUrl);
        if (supported) {
          await WebBrowser.openBrowserAsync(preferenciaData.checkoutUrl);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o checkout');
        }
      } catch (error) {
        console.error('Erro ao abrir checkout:', error);
      }
    }
  };

  const renderCheckoutInfo = () => {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.checkoutContainer}
      >
        <MaterialCommunityIcons name="credit-card-check-outline" size={48} color={colors.primary} />

        <Text style={styles.checkoutTitle}>Checkout Stripe iniciado</Text>

        <Text style={styles.checkoutInstructions}>
          Conclua o pagamento na página segura do Stripe. Ao finalizar, voltaremos a verificar a confirmação automaticamente.
        </Text>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleAbrirCheckout}
        >
          <MaterialCommunityIcons name="open-in-new" size={20} color="#FFF" />
          <Text style={styles.checkoutButtonText}>Abrir checkout</Text>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blurButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </BlurView>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* RESUMO DO PEDIDO */}
        <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.card}>
          <Text style={styles.cardTitle}>Resumo do Pedido</Text>
          
          <View style={styles.eventoInfo}>
            <Text style={styles.eventoNome}>{evento.tituloEvento}</Text>
            <Text style={styles.eventoData}>{evento.dataEvento}</Text>
          </View>

          <View style={styles.ingressosInfo}>
            <Text style={styles.ingressosLabel}>
              {quantidadeTotal} ingresso(s)
            </Text>
            <Text style={styles.ingressosTipos}>
              {carrinho.map(item => `${item.quantidade}x ${item.tipo}`).join(', ')}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.valoresRow}>
            <Text style={styles.valorLabel}>Subtotal</Text>
            <Text style={styles.valorText}>R$ {resumo.subtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.valoresRow}>
            <Text style={styles.valorLabel}>Taxas</Text>
            <Text style={styles.valorText}>R$ {resumo.taxas.toFixed(2)}</Text>
          </View>

          <View style={[styles.valoresRow, styles.totalRow]}>
            <Text style={[styles.valorLabel, styles.totalLabel]}>Total</Text>
            <Text style={[styles.valorText, styles.totalText]}>
              R$ {resumo.valorFinal.toFixed(2)}
            </Text>
          </View>
        </BlurView>

        {/* MÉTODO DE PAGAMENTO */}
        {!pagamentoCriado && (
          <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.card}>
            <Text style={styles.cardTitle}>Método de Pagamento</Text>

            <View style={[styles.metodoCard, styles.metodoCardSelecionado]}>
              <View style={styles.metodoIcon}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={28}
                  color={colors.primary}
                />
              </View>
              
              <View style={styles.metodoInfo}>
                <Text style={[styles.metodoLabel, { color: colors.primary }]}>
                  Stripe Checkout
                </Text>
                <Text style={styles.metodoDescricao}>
                  Pagamento seguro com métodos disponíveis na sua conta Stripe
                </Text>
              </View>

              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={colors.primary}
              />
            </View>
          </BlurView>
        )}

        {/* CHECKOUT STRIPE */}
        {pagamentoCriado && renderCheckoutInfo()}

        {/* STATUS DO PAGAMENTO */}
        {pagamentoCriado && (
          <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.card}>
            <View style={styles.statusRow}>
              <MaterialCommunityIcons
                name={
                  statusPagamento === STATUS_PAGAMENTO.APROVADO
                    ? 'check-circle'
                    : 'clock-outline'
                }
                size={24}
                color={
                  statusPagamento === STATUS_PAGAMENTO.APROVADO
                    ? colors.success
                    : colors.warning
                }
              />
              
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {statusPagamento === STATUS_PAGAMENTO.APROVADO
                    ? 'Pagamento Confirmado'
                    : 'Aguardando Pagamento'}
                </Text>
                <Text style={styles.statusDescription}>
                  {statusPagamento === STATUS_PAGAMENTO.APROVADO
                    ? 'Seus ingressos foram gerados com sucesso'
                    : 'Estamos verificando o status do pagamento...'}
                </Text>
              </View>

              {verificando && (
                <ActivityIndicator size="small" color={colors.primary} />
              )}
            </View>
          </BlurView>
        )}

        {/* BOTÃO DE AÇÃO */}
        {!pagamentoCriado && (
          <TouchableOpacity
            style={styles.payButton}
            onPress={handleCriarPagamento}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.payButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="lock" size={20} color="#FFF" />
                  <Text style={styles.payButtonText}>
                    Pagar R$ {resumo.valorFinal.toFixed(2)}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* POLÍTICA */}
        <Text style={styles.politica}>
          Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          Pagamentos processados via Stripe.
        </Text>
      </ScrollView>
    </View>
  );
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: c.background,
      borderBottomWidth: 1,
      borderBottomColor: c.glassBorder,
    },
    backButton: {
      width: 44,
      height: 44,
    },
    blurButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.glassBorder,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginLeft: 12,
    },
    content: {
      padding: 16,
    },
    card: {
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.glassBorder,
      backgroundColor: c.glass,
      overflow: 'hidden',
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginBottom: 16,
    },
    eventoInfo: {
      marginBottom: 12,
    },
    eventoNome: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 4,
    },
    eventoData: {
      fontSize: 14,
      color: c.textMuted,
    },
    ingressosInfo: {
      marginBottom: 16,
    },
    ingressosLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 4,
    },
    ingressosTipos: {
      fontSize: 13,
      color: c.textMuted,
    },
    divider: {
      height: 1,
      backgroundColor: c.glassBorder,
      marginVertical: 12,
    },
    valoresRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    valorLabel: {
      fontSize: 14,
      color: c.textSecondary,
    },
    valorText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textPrimary,
    },
    totalRow: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: c.glassBorder,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.textPrimary,
    },
    totalText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.primary,
    },
    metodoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: c.glassBorder,
      backgroundColor: c.surface,
      marginBottom: 12,
    },
    metodoCardSelecionado: {
      borderColor: c.primary,
      backgroundColor: `${c.primary}15`,
    },
    metodoIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.glass,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    metodoInfo: {
      flex: 1,
    },
    metodoLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.textPrimary,
      marginBottom: 4,
    },
    metodoDescricao: {
      fontSize: 13,
      color: c.textMuted,
    },
    checkoutContainer: {
      alignItems: 'center',
      padding: 24,
    },
    checkoutTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginTop: 16,
      marginBottom: 16,
    },
    checkoutInstructions: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    checkoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: c.primary,
    },
    checkoutButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#FFF',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusInfo: {
      flex: 1,
      marginLeft: 12,
    },
    statusTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginBottom: 4,
    },
    statusDescription: {
      fontSize: 13,
      color: c.textMuted,
    },
    payButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
    },
    payButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      gap: 8,
    },
    payButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    politica: {
      fontSize: 11,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 16,
    },
  });
}
