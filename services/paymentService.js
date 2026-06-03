/**
 * 💳 SERVIÇO DE PAGAMENTO - MERCADO PAGO
 * 
 * Gerencia integração com Mercado Pago para PIX, Boleto e Cartão
 */

import axios from 'axios';

/**
 * CONFIGURAÇÃO MERCADO PAGO
 * As credenciais estão nas variáveis de ambiente do Expo
 */
const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';
const MERCADO_PAGO_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN || '';
const MERCADO_PAGO_PUBLIC_KEY = process.env.EXPO_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || '';

/**
 * MÉTODOS DE PAGAMENTO
 */
export const METODOS_PAGAMENTO = {
  PIX: 'pix',
  BOLETO: 'boleto',
  CARTAO: 'credit_card',
};

/**
 * STATUS DO PAGAMENTO
 */
export const STATUS_PAGAMENTO = {
  PENDENTE: 'pending',
  APROVADO: 'approved',
  REJEITADO: 'rejected',
  CANCELADO: 'cancelled',
  EM_PROCESSAMENTO: 'in_process',
};

/**
 * 📱 CRIAR PREFERÊNCIA DE PAGAMENTO (FRONTEND)
 * Chama Firebase Function para criar preferência no Mercado Pago
 */
export const criarPreferenciaPagamento = async ({
  eventoId,
  eventoNome,
  valorTotal,
  userId,
  userEmail,
  metodoPagamento,
  ingressos,
}) => {
  try {
    // Chamar Firebase Function para criar preferência
    const response = await axios.post(
      'https://sua-regiao-project.cloudfunctions.net/criarPreferenciaPagamento',
      {
        eventoId,
        eventoNome,
        valorTotal,
        userId,
        userEmail,
        metodoPagamento,
        ingressos,
      }
    );

    return {
      success: true,
      preferenciaId: response.data.id,
      qrCode: response.data.qr_code,
      qrCodeBase64: response.data.qr_code_base64,
      ticketUrl: response.data.ticket_url,
      pontoVenda: response.data.point_of_interaction,
      status: STATUS_PAGAMENTO.PENDENTE,
    };
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    throw new Error('Não foi possível criar a preferência de pagamento');
  }
};

/**
 * 🔍 VERIFICAR STATUS DO PAGAMENTO
 * Consulta o status do pagamento no Mercado Pago
 */
export const verificarStatusPagamento = async (preferenciaId) => {
  try {
    const response = await axios.get(
      `${MERCADO_PAGO_API_URL}/checkout/preferences/${preferenciaId}`,
      {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      }
    );

    return {
      success: true,
      status: response.data.status,
      pagamentoId: response.data.id,
    };
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    throw new Error('Não foi possível verificar o status do pagamento');
  }
};

/**
 * 📋 OBTER PAGAMENTO POR ID
 * Busca detalhes completos de um pagamento
 */
export const obterPagamento = async (pagamentoId) => {
  try {
    const response = await axios.get(
      `${MERCADO_PAGO_API_URL}/v1/payments/${pagamentoId}`,
      {
        headers: {
          'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      }
    );

    return {
      success: true,
      pagamento: response.data,
    };
  } catch (error) {
    console.error('Erro ao obter pagamento:', error);
    throw new Error('Não foi possível obter detalhes do pagamento');
  }
};

/**
 * 💰 CALCULAR TAXAS DO MERCADO PAGO
 * PIX: 0,99% + R$ 0,30
 * Boleto: R$ 2,90
 * Cartão: 2,99% + R$ 0,30
 */
export const calcularTaxas = (valor, metodo) => {
  switch (metodo) {
    case METODOS_PAGAMENTO.PIX:
      return valor * 0.0099 + 0.30;
    case METODOS_PAGAMENTO.BOLETO:
      return 2.90;
    case METODOS_PAGAMENTO.CARTAO:
      return valor * 0.0299 + 0.30;
    default:
      return 0;
  }
};

/**
 * 📝 FORMATAR VALOR PARA MERCADO PAGO
 * Mercado Pago espera valores em centavos (inteiros)
 */
export const formatarValorMercadoPago = (valor) => {
  return Math.round(valor * 100);
};

/**
 * 🔄 FORMATAR DATA EXPIRAÇÃO
 * Retorna data de expiração no formato esperado pelo Mercado Pago
 */
export const calcularDataExpiracao = (horas = 24) => {
  const data = new Date();
  data.setHours(data.getHours() + horas);
  return data.toISOString().slice(0, 19) + '.000-03:00';
};

/**
 * 🎯 VALIDAR MÉTODO DE PAGAMENTO
 * Verifica se o método é suportado
 */
export const validarMetodoPagamento = (metodo) => {
  return Object.values(METODOS_PAGAMENTO).includes(metodo);
};

/**
 * 📊 OBTER RESUMO DO PAGAMENTO
 * Formata dados para exibição no checkout
 */
export const obterResumoPagamento = (valorTotal, metodo) => {
  const taxas = calcularTaxas(valorTotal, metodo);
  const valorFinal = valorTotal + taxas;

  return {
    subtotal: valorTotal,
    taxas,
    valorFinal,
    metodo,
    metodoLabel: metodo === METODOS_PAGAMENTO.PIX ? 'PIX' :
                  metodo === METODOS_PAGAMENTO.BOLETO ? 'Boleto' :
                  metodo === METODOS_PAGAMENTO.CARTAO ? 'Cartão de Crédito' :
                  'Desconhecido',
  };
};

export default {
  METODOS_PAGAMENTO,
  STATUS_PAGAMENTO,
  criarPreferenciaPagamento,
  verificarStatusPagamento,
  obterPagamento,
  calcularTaxas,
  formatarValorMercadoPago,
  calcularDataExpiracao,
  validarMetodoPagamento,
  obterResumoPagamento,
};
