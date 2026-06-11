/**
 * Firebase Functions - integração Stripe
 *
 * Fluxo:
 * 1. O app cria uma sessão Stripe Checkout autenticada.
 * 2. O Stripe confirma o pagamento via webhook.
 * 3. O backend gera os ingressos uma única vez no Firestore.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();

const db = admin.firestore();
const STRIPE_API_URL = "https://api.stripe.com/v1";

const STATUS_PAGAMENTO = {
  PENDENTE: "pending",
  APROVADO: "approved",
  REJEITADO: "rejected",
  CANCELADO: "cancelled",
  EM_PROCESSAMENTO: "in_process",
};

const getStripeSecretKey = () =>
  functions.config().stripe?.secret_key || process.env.STRIPE_SECRET_KEY;

const getStripeWebhookSecret = () =>
  functions.config().stripe?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET;

const getSuccessUrl = () =>
  functions.config().stripe?.success_url ||
  process.env.STRIPE_SUCCESS_URL ||
  "monitoracult://pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}";

const getCancelUrl = () =>
  functions.config().stripe?.cancel_url ||
  process.env.STRIPE_CANCEL_URL ||
  "monitoracult://pagamento/cancelado";

const encodeStripeParams = (params) => {
  const body = new URLSearchParams();

  const append = (key, value) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item, index) => append(`${key}[${index}]`, item));
      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => {
        append(`${key}[${childKey}]`, childValue);
      });
      return;
    }

    body.append(key, String(value));
  };

  Object.entries(params).forEach(([key, value]) => append(key, value));
  return body;
};

const stripeRequest = async (method, path, data) => {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Chave secreta do Stripe não configurada"
    );
  }

  const config = {
    method,
    url: `${STRIPE_API_URL}${path}`,
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  };

  if (data) {
    config.data = encodeStripeParams(data);
    config.headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  return axios(config);
};

const parseEventoData = (value) => {
  if (!value) return new Date();
  if (value.toDate) return value.toDate();
  if (value instanceof Date) return value;

  const brDate = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brDate) {
    const [, day, month, year] = brDate;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const gerarCodigoIngresso = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `INGR-${timestamp}-${random}`;
};

const mapStripeStatus = (session) => {
  if (session.payment_status === "paid") return STATUS_PAGAMENTO.APROVADO;
  if (session.status === "expired") return STATUS_PAGAMENTO.CANCELADO;
  if (session.payment_status === "unpaid") return STATUS_PAGAMENTO.PENDENTE;
  return STATUS_PAGAMENTO.EM_PROCESSAMENTO;
};

const confirmarCompraStripe = async ({ session, pagamentoId }) => {
  if (!pagamentoId) return null;

  const pagamentoRef = db.collection("pagamentos").doc(pagamentoId);
  let compraId = null;

  await db.runTransaction(async (transaction) => {
    const pagamentoSnap = await transaction.get(pagamentoRef);

    if (!pagamentoSnap.exists) {
      throw new Error("Pagamento não encontrado");
    }

    const pagamento = pagamentoSnap.data();

    if (pagamento.compraConfirmada && pagamento.compraId) {
      compraId = pagamento.compraId;
      return;
    }

    const eventoRef = db.collection("eventos").doc(pagamento.eventoId);
    const eventoSnap = await transaction.get(eventoRef);

    if (!eventoSnap.exists) {
      throw new Error("Evento não encontrado");
    }

    const eventoData = eventoSnap.data() || {};
    const ingressos = Array.isArray(pagamento.ingressos) ? pagamento.ingressos : [];
    const ingressosGerados = ingressos.flatMap((ingresso) =>
      Array.from({ length: Number(ingresso.quantidade || 1) }, () => ({
        tipo: ingresso.tipo,
        precoUnitario: Number(ingresso.precoUnitario || 0),
        desconto: Number(ingresso.desconto || 0),
        status: "confirmado",
        codigoIngresso: gerarCodigoIngresso(),
        usadoEm: null,
      }))
    );

    const totalSolicitado = ingressosGerados.length;
    const capacidade = Number(eventoData.capacidade || 0);
    const ingressosVendidos = Number(eventoData.ingressosVendidos || 0);

    if (capacidade > 0 && ingressosVendidos + totalSolicitado > capacidade) {
      throw new Error("Ingressos indisponíveis. Capacidade limite atingida.");
    }

    const compraRef = db
      .collection("usuarios")
      .doc(pagamento.userId)
      .collection("compras")
      .doc();
    const compraRaizRef = db.collection("comprasIngressos").doc();

    compraId = compraRef.id;

    const compraData = {
      eventoId: pagamento.eventoId,
      eventoNome: eventoData.tituloEvento || pagamento.eventoNome || "Evento",
      eventoDataStr: eventoData.dataEvento || "",
      eventoHora: eventoData.horaInicio || "",
      eventoLocal: eventoData.localEvento || "",
      eventoFoto: eventoData.imagemEvento || "",
      categoria: eventoData.categoria || eventoData.tipoEvento || null,
      userId: pagamento.userId,
      userName: pagamento.userName || "Usuário",
      userEmail: pagamento.userEmail || "",
      userPhoto: pagamento.userPhoto || "",
      ingressos: ingressosGerados,
      valorTotal: Number(pagamento.valorTotal || 0),
      metodoPagamento: "stripe",
      tipoCompra: "pago",
      metadadosPagamento: {
        provider: "stripe",
        sessionId: session.id,
        paymentIntentId: session.payment_intent || null,
        pagamentoId,
        timestamp: admin.firestore.Timestamp.now(),
      },
      status: "confirmado",
      dataCompra: admin.firestore.FieldValue.serverTimestamp(),
      dataValidade: admin.firestore.Timestamp.fromDate(parseEventoData(eventoData.dataEvento)),
    };

    transaction.set(compraRef, compraData);
    transaction.set(compraRaizRef, {
      ...compraData,
      usuarioId: pagamento.userId,
    });
    transaction.update(eventoRef, {
      ingressosVendidos: admin.firestore.FieldValue.increment(totalSolicitado),
    });
    transaction.update(pagamentoRef, {
      status: STATUS_PAGAMENTO.APROVADO,
      stripePaymentStatus: session.payment_status,
      stripeSessionStatus: session.status,
      stripePaymentIntentId: session.payment_intent || null,
      compraConfirmada: true,
      compraId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return compraId;
};

exports.criarPreferenciaPagamento = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const {
    eventoId,
    eventoNome,
    valorTotal,
    userId,
    userEmail,
    userName,
    userPhoto,
    ingressos,
  } = data;

  if (!eventoId || !valorTotal || !Array.isArray(ingressos) || ingressos.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Dados incompletos para criar pagamento"
    );
  }

  if (userId !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Usuário do pagamento não corresponde ao usuário autenticado"
    );
  }

  const valorEmCentavos = Math.round(Number(valorTotal) * 100);

  if (!Number.isFinite(valorEmCentavos) || valorEmCentavos <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Valor de pagamento inválido");
  }

  try {
    const pagamentoRef = db.collection("pagamentos").doc();
    const pagamentoId = pagamentoRef.id;
    const externalReference = `${eventoId}_${userId}_${Date.now()}`;

    await pagamentoRef.set({
      provider: "stripe",
      pagamentoId,
      eventoId,
      eventoNome: eventoNome || "Ingressos",
      userId,
      userEmail: userEmail || context.auth.token.email || "",
      userName: userName || context.auth.token.name || "Usuário",
      userPhoto: userPhoto || context.auth.token.picture || "",
      valorTotal: Number(valorTotal),
      moeda: "BRL",
      metodoPagamento: "stripe_checkout",
      status: STATUS_PAGAMENTO.PENDENTE,
      compraConfirmada: false,
      externalReference,
      ingressos,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const sessionResponse = await stripeRequest("post", "/checkout/sessions", {
      mode: "payment",
      success_url: getSuccessUrl(),
      cancel_url: getCancelUrl(),
      client_reference_id: externalReference,
      customer_email: userEmail || context.auth.token.email || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: valorEmCentavos,
            product_data: {
              name: `Ingressos - ${eventoNome || "Evento"}`,
              description: `${ingressos.reduce(
                (total, item) => total + Number(item.quantidade || 0),
                0
              )} ingresso(s)`,
            },
          },
        },
      ],
      metadata: {
        pagamentoId,
        eventoId,
        userId,
      },
      payment_intent_data: {
        metadata: {
          pagamentoId,
          eventoId,
          userId,
        },
      },
    });

    const session = sessionResponse.data;

    await pagamentoRef.update({
      stripeSessionId: session.id,
      checkoutUrl: session.url,
      stripePaymentStatus: session.payment_status,
      stripeSessionStatus: session.status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      sessionId: session.id,
      pagamentoId,
      checkoutUrl: session.url,
      status: STATUS_PAGAMENTO.PENDENTE,
    };
  } catch (error) {
    console.error("Erro ao criar sessão Stripe:", error.response?.data || error);
    throw new functions.https.HttpsError("internal", "Erro ao criar pagamento Stripe");
  }
});

exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const webhookSecret = getStripeWebhookSecret();
    const signature = req.headers["stripe-signature"];
    const rawBody = req.rawBody;

    if (webhookSecret) {
      if (!signature || !rawBody) {
        return res.status(400).json({ error: "Assinatura Stripe ausente" });
      }

      const parts = String(signature).split(",").reduce((acc, item) => {
        const [key, value] = item.split("=");
        acc[key] = value;
        return acc;
      }, {});
      const signedPayload = `${parts.t}.${rawBody.toString("utf8")}`;
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(signedPayload)
        .digest("hex");

      const expectedBuffer = Buffer.from(expected, "hex");
      const receivedBuffer = Buffer.from(parts.v1 || "", "hex");

      if (
        expectedBuffer.length !== receivedBuffer.length ||
        !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        return res.status(400).json({ error: "Assinatura Stripe inválida" });
      }
    }

    const event = req.body;
    const session = event.data?.object;

    if (!session?.id) {
      return res.status(200).json({ received: true });
    }

    const pagamentoId = session.metadata?.pagamentoId;

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      if (session.payment_status === "paid") {
        const compraId = await confirmarCompraStripe({ session, pagamentoId });
        return res.status(200).json({ received: true, compraId });
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "checkout.session.async_payment_failed"
    ) {
      if (pagamentoId) {
        await db.collection("pagamentos").doc(pagamentoId).update({
          status:
            event.type === "checkout.session.expired"
              ? STATUS_PAGAMENTO.CANCELADO
              : STATUS_PAGAMENTO.REJEITADO,
          stripePaymentStatus: session.payment_status || null,
          stripeSessionStatus: session.status || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Erro no webhook Stripe:", error.response?.data || error);
    return res.status(500).json({ error: "Erro ao processar webhook Stripe" });
  }
});

exports.verificarStatusPagamento = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Usuário não autenticado");
  }

  const { sessionId, pagamentoId } = data;

  if (!sessionId && !pagamentoId) {
    throw new functions.https.HttpsError("invalid-argument", "ID do pagamento não fornecido");
  }

  try {
    let pagamentoDocId = pagamentoId;
    let session = null;

    if (sessionId) {
      const sessionResponse = await stripeRequest("get", `/checkout/sessions/${sessionId}`);
      session = sessionResponse.data;
      pagamentoDocId = pagamentoDocId || session.metadata?.pagamentoId;
    }

    if (!pagamentoDocId) {
      throw new functions.https.HttpsError("not-found", "Pagamento não encontrado");
    }

    const pagamentoRef = db.collection("pagamentos").doc(pagamentoDocId);
    const pagamentoSnap = await pagamentoRef.get();

    if (!pagamentoSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Pagamento não encontrado");
    }

    const pagamento = pagamentoSnap.data();

    if (pagamento.userId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Acesso negado ao pagamento");
    }

    if (!session && pagamento.stripeSessionId) {
      const sessionResponse = await stripeRequest(
        "get",
        `/checkout/sessions/${pagamento.stripeSessionId}`
      );
      session = sessionResponse.data;
    }

    let status = pagamento.status || STATUS_PAGAMENTO.PENDENTE;
    let compraId = pagamento.compraId || null;

    if (session) {
      status = mapStripeStatus(session);

      await pagamentoRef.update({
        status,
        stripePaymentStatus: session.payment_status,
        stripeSessionStatus: session.status,
        stripePaymentIntentId: session.payment_intent || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (status === STATUS_PAGAMENTO.APROVADO && !pagamento.compraConfirmada) {
        compraId = await confirmarCompraStripe({ session, pagamentoId: pagamentoDocId });
      }
    }

    return {
      status,
      sessionId: session?.id || pagamento.stripeSessionId || null,
      pagamentoId: pagamentoDocId,
      compraId,
    };
  } catch (error) {
    console.error("Erro ao verificar status Stripe:", error.response?.data || error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError("internal", "Erro ao verificar status do pagamento");
  }
});
