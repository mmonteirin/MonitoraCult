/**
 * Serviço de pagamento - Stripe
 *
 * O app nunca deve chamar a API Stripe com chave secreta. As operações de
 * cobrança passam pelas Firebase Functions autenticadas.
 */

import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebaseConfig";

const functionsInstance = getFunctions(app);

export const STRIPE_PUBLIC_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export const METODOS_PAGAMENTO = {
  STRIPE_CHECKOUT: "stripe_checkout",
};

export const STATUS_PAGAMENTO = {
  PENDENTE: "pending",
  APROVADO: "approved",
  REJEITADO: "rejected",
  CANCELADO: "cancelled",
  EM_PROCESSAMENTO: "in_process",
};

export const criarPreferenciaPagamento = async ({
  eventoId,
  eventoNome,
  valorTotal,
  userId,
  userEmail,
  userName,
  userPhoto,
  metodoPagamento = METODOS_PAGAMENTO.STRIPE_CHECKOUT,
  ingressos,
}) => {
  try {
    const criarCheckout = httpsCallable(functionsInstance, "criarPreferenciaPagamento");
    const result = await criarCheckout({
      eventoId,
      eventoNome,
      valorTotal,
      userId,
      userEmail,
      userName,
      userPhoto,
      metodoPagamento,
      ingressos,
    });

    return {
      success: true,
      sessionId: result.data.sessionId,
      pagamentoId: result.data.pagamentoId,
      checkoutUrl: result.data.checkoutUrl,
      status: result.data.status || STATUS_PAGAMENTO.PENDENTE,
    };
  } catch (error) {
    console.error("Erro ao criar checkout Stripe:", error);
    throw new Error("Não foi possível iniciar o pagamento");
  }
};

export const verificarStatusPagamento = async ({ sessionId, pagamentoId }) => {
  try {
    const verificarStatus = httpsCallable(functionsInstance, "verificarStatusPagamento");
    const result = await verificarStatus({ sessionId, pagamentoId });

    return {
      success: true,
      status: result.data.status,
      sessionId: result.data.sessionId,
      pagamentoId: result.data.pagamentoId,
      compraId: result.data.compraId,
    };
  } catch (error) {
    console.error("Erro ao verificar status do pagamento:", error);
    throw new Error("Não foi possível verificar o status do pagamento");
  }
};

export const obterPagamento = verificarStatusPagamento;

export const calcularTaxas = () => 0;

export const formatarValorStripe = (valor) => Math.round(Number(valor || 0) * 100);

export const validarMetodoPagamento = (metodo) => {
  return Object.values(METODOS_PAGAMENTO).includes(metodo);
};

export const obterResumoPagamento = (valorTotal, metodo = METODOS_PAGAMENTO.STRIPE_CHECKOUT) => {
  const subtotal = Number(valorTotal || 0);
  const taxas = calcularTaxas(subtotal, metodo);

  return {
    subtotal,
    taxas,
    valorFinal: subtotal + taxas,
    metodo,
    metodoLabel: "Stripe Checkout",
  };
};

export default {
  STRIPE_PUBLIC_KEY,
  METODOS_PAGAMENTO,
  STATUS_PAGAMENTO,
  criarPreferenciaPagamento,
  verificarStatusPagamento,
  obterPagamento,
  calcularTaxas,
  formatarValorStripe,
  validarMetodoPagamento,
  obterResumoPagamento,
};
