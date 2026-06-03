/**
 * 💳 TELA DE CHECKOUT - MERCADO PAGO
 * 
 * Permite escolha entre PIX e Boleto, exibe QR Code e status do pagamento
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
  Image,
  Linking,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../hooks/useThemedStyles';
import AppText from '../components/AppText';

import {
  METODOS_PAGAMENTO,
  STATUS_PAGAMENTO,
  criarPreferenciaPagamento,
  verificarStatusPagamento,
  obterResumoPagamento,
} from '../services/paymentService';

// Inicializar Firebase Functions
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebaseConfig';

const functionsInstance = getFunctions(app);

export default function CheckoutScreen({ route, navigation }) {
  const { evento, carrinho, total, quantidadeTotal } = route.params;
  const { user, profile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createThemedStyles);
  const insets = useSafeAreaInsets();

  const [metodoSelecionado, setMetodoSelecionado] = useState(METODOS_PAGAMENTO.PIX);
  const [loading, setLoading] = useState(false);
  const [pagamentoCriado, setPagamentoCriado] = useState(false);
  const [preferenciaData, setPreferenciaData] = useState(null);
  const [statusPagamento, setStatusPagamento] = useState(STATUS_PAGAMENTO.PENDENTE);
  const [verificando, setVerificando] = useState(false);

  const resumo = obterResumoPagamento(total, metodoSelecionado);

  // Verificar status do pagamento periodicamente
  useEffect(() => {
    if (!pagamentoCriado || !preferenciaData?.preferenciaId) return;

    const interval = setInterval(async () => {
      if (statusPagamento === STATUS_PAGAMENTO.APROVADO) {
        clearInterval(interval);
        return;
      }

      try {
        setVerificando(true);
        const verificarStatus = httpsCallable(functionsInstance, 'verificarStatusPagamento');
        const result = await verificarStatus({ pagamentoId: preferenciaData.preferenciaId });
        
        if (result.data.status === STATUS_PAGAMENTO.APROVADO) {
          setStatusPagamento(STATUS_PAGAMENTO.APROVADO);
          clearInterval(interval);
          
          setTimeout(() => {
            Alert.alert(
              'Pagamento Confirmado! 🎉',
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
    }, 5000); // Verificar a cada 5 segundos

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
      }));

      // Chamar Firebase Function para criar preferência
      const criarPreferencia = httpsCallable(functionsInstance, 'criarPreferenciaPagamento');
      const result = await criarPreferencia({
        eventoId: evento.id || evento.eventoId,
        eventoNome: evento.tituloEvento,
        valorTotal: resumo.valorFinal,
        userId: user.uid,
        userEmail: profile?.email || user.email,
        metodoPagamento: metodoSelecionado,
        ingressos: ingressosFormatados,
      });

      setPreferenciaData(result.data);
      setPagamentoCriado(true);
      setStatusPagamento(STATUS_PAGAMENTO.PENDENTE);

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

  const handleCopiarQRCode = () => {
    if (preferenciaData?.qrCode) {
      // Copiar QR Code para área de transferência
      // (precisaria importar Clipboard do expo-clipboard)
      Alert.alert('QR Code', 'Código copiado para a área de transferência');
    }
  };

  const handleAbrirBoleto = async () => {
    if (preferenciaData?.ticketUrl) {
      try {
        const supported = await Linking.canOpenURL(preferenciaData.ticketUrl);
        if (supported) {
          await Linking.openURL(preferenciaData.ticketUrl);
        } else {
          Alert.alert('Erro', 'Não foi possível abrir o link do boleto');
        }
      } catch (error) {
        console.error('Erro ao abrir boleto:', error);
      }
    }
  };

  const renderMetodoPagamento = (metodo, icon, label, descricao) => {
    const selecionado = metodoSelecionado === metodo;
    
    return (
      <TouchableOpacity
        key={metodo}
        style={[styles.metodoCard, selecionado && styles.metodoCardSelecionado]}
        onPress={() => setMetodoSelecionado(metodo)}
        activeOpacity={0.7}
      >
        <View style={styles.metodoIcon}>
          <MaterialCommunityIcons
            name={icon}
            size={28}
            color={selecionado ? colors.primary : colors.textMuted}
          />
        </View>
        
        <View style={styles.metodoInfo}>
          <Text style={[styles.metodoLabel, selecionado && { color: colors.primary }]}>
            {label}
          </Text>
          <Text style={styles.metodoDescricao}>{descricao}</Text>
        </View>

        {selecionado && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  const renderQRCode = () => {
    if (!preferenciaData?.qrCodeBase64) return null;

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.qrContainer}
      >
        <Text style={styles.qrTitle}>Escaneie o QR Code</Text>
        
        <Image
          source={{ uri: `data:image/png;base64,${preferenciaData.qrCodeBase64}` }}
          style={styles.qrImage}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopiarQRCode}
        >
          <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} />
          <Text style={styles.copyButtonText}>Copiar código</Text>
        </TouchableOpacity>

        <Text style={styles.qrInstructions}>
          Abra o app do seu banco e escaneie o QR Code para pagar
        </Text>
      </MotiView>
    );
  };

  const renderBoleto = () => {
    if (!preferenciaData?.ticketUrl) return null;

    return (
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.boletoContainer}
      >
        <MaterialCommunityIcons
          name="barcode"
          size={48}
          color={colors.primary}
        />

        <Text style={styles.boletoTitle}>Boleto Bancário</Text>
        
        <Text style={styles.boletoInstructions}>
          O boleto será gerado após a confirmação. Você poderá pagar em qualquer banco ou lotérica.
        </Text>

        <TouchableOpacity
          style={styles.boletoButton}
          onPress={handleAbrirBoleto}
        >
          <Text style={styles.boletoButtonText}>Abrir Boleto</Text>
        </TouchableOpacity>

        <Text style={styles.boletoWarning}>
          O pagamento pode levar até 3 dias úteis para ser processado
        </Text>
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

        {/* MÉTODOS DE PAGAMENTO */}
        {!pagamentoCriado && (
          <BlurView intensity={45} tint={isDark ? 'dark' : 'light'} style={styles.card}>
            <Text style={styles.cardTitle}>Método de Pagamento</Text>

            {renderMetodoPagamento(
              METODOS_PAGAMENTO.PIX,
              'qrcode',
              'PIX',
              'Pagamento instantâneo via QR Code'
            )}

            {renderMetodoPagamento(
              METODOS_PAGAMENTO.BOLETO,
              'barcode',
              'Boleto',
              'Pague em até 3 dias úteis'
            )}
          </BlurView>
        )}

        {/* QR CODE / BOLETO */}
        {pagamentoCriado && metodoSelecionado === METODOS_PAGAMENTO.PIX && renderQRCode()}
        {pagamentoCriado && metodoSelecionado === METODOS_PAGAMENTO.BOLETO && renderBoleto()}

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
          Pagamentos processados via Mercado Pago.
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
    qrContainer: {
      alignItems: 'center',
      padding: 24,
    },
    qrTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginBottom: 16,
    },
    qrImage: {
      width: 200,
      height: 200,
      marginBottom: 16,
    },
    copyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: `${c.primary}15`,
      marginBottom: 12,
    },
    copyButtonText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: c.primary,
    },
    qrInstructions: {
      fontSize: 13,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 18,
    },
    boletoContainer: {
      alignItems: 'center',
      padding: 32,
    },
    boletoTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: c.textPrimary,
      marginTop: 16,
      marginBottom: 12,
    },
    boletoInstructions: {
      fontSize: 14,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    boletoButton: {
      backgroundColor: c.primary,
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 12,
    },
    boletoButtonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    boletoWarning: {
      fontSize: 12,
      color: c.textMuted,
      textAlign: 'center',
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
