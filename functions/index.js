/**
 * 🔧 FIREBASE FUNCTIONS - MERCADO PAGO INTEGRAÇÃO
 * 
 * Funções para:
 * 1. Criar preferência de pagamento (PIX/Boleto)
 * 2. Webhook para receber notificações do Mercado Pago
 * 3. Verificar status de pagamento
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

const db = admin.firestore();
const MERCADO_PAGO_API_URL = 'https://api.mercadopago.com';

/**
 * 📱 CRIAR PREFERÊNCIA DE PAGAMENTO
 * Cria uma preferência no Mercado Pago para PIX ou Boleto
 */
exports.criarPreferenciaPagamento = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  const {
    eventoId,
    eventoNome,
    valorTotal,
    userId,
    userEmail,
    metodoPagamento,
    ingressos,
  } = data;

  // Validar dados
  if (!eventoId || !valorTotal || !metodoPagamento) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Dados incompletos para criar preferência'
    );
  }

  try {
    // Obter access token do Mercado Pago das variáveis de ambiente
    const accessToken = functions.config().mercadopago?.access_token;
    
    if (!accessToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Access token do Mercado Pago não configurado'
      );
    }

    // Criar preferência no Mercado Pago
    const preferenciaData = {
      items: [
        {
          title: `Ingressos - ${eventoNome}`,
          description: `Compra de ${ingressos.length} ingresso(s)`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: parseFloat(valorTotal),
        },
      ],
      payer: {
        email: userEmail || 'usuario@email.com',
        name: context.auth.token.name || 'Usuário',
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 1,
        default_payment_method_id: metodoPagamento === 'pix' ? 'pix' : 
                                   metodoPagamento === 'boleto' ? 'bolbradesco' : 
                                   'master',
      },
      back_urls: {
        success: `https://monitoracult.app/pagamento/sucesso`,
        failure: `https://monitoracult.app/pagamento/falha`,
        pending: `https://monitoracult.app/pagamento/pendente`,
      },
      auto_return: 'approved',
      external_reference: `${eventoId}_${userId}_${Date.now()}`,
      metadata: {
        eventoId,
        userId,
        ingressos: JSON.stringify(ingressos),
      },
    };

    // Se for PIX, adicionar configurações específicas
    if (metodoPagamento === 'pix') {
      preferenciaData.payment_methods.default_payment_method_id = 'pix';
    }

    // Se for boleto, adicionar data de vencimento
    if (metodoPagamento === 'boleto') {
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 3); // 3 dias
      
      preferenciaData.dates_of_expiration = [
        dataVencimento.toISOString().split('T')[0],
      ];
    }

    // Chamar API do Mercado Pago
    const response = await axios.post(
      `${MERCADO_PAGO_API_URL}/checkout/preferences`,
      preferenciaData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const preferencia = response.data;

    // Se for PIX, obter QR Code
    let qrCode = null;
    let qrCodeBase64 = null;

    if (metodoPagamento === 'pix' && preferencia.id) {
      try {
        // Criar pagamento PIX
        const pixData = {
          transaction_amount: parseFloat(valorTotal),
          description: `Ingressos - ${eventoNome}`,
          payment_method_id: 'pix',
          payer: {
            email: userEmail || 'usuario@email.com',
          },
          external_reference: preferencia.external_reference,
          metadata: preferencia.metadata,
        };

        const pixResponse = await axios.post(
          `${MERCADO_PAGO_API_URL}/v1/payments`,
          pixData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const pixPagamento = pixResponse.data;
        
        qrCode = pixPagamento.point_of_interaction?.transaction_data?.qr_code;
        qrCodeBase64 = pixPagamento.point_of_interaction?.transaction_data?.qr_code_base64;

        // Salvar referência do pagamento no Firestore
        await db.collection('pagamentos').doc(pixPagamento.id.toString()).set({
          preferenciaId: preferencia.id,
          pagamentoId: pixPagamento.id,
          eventoId,
          userId,
          valorTotal,
          metodoPagamento,
          status: pixPagamento.status,
          externalReference: preferencia.external_reference,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          ingressos,
        });

      } catch (pixError) {
        console.error('Erro ao criar pagamento PIX:', pixError);
        // Continuar mesmo sem QR Code
      }
    }

    return {
      id: preferencia.id,
      init_point: preferencia.init_point,
      sandbox_init_point: preferencia.sandbox_init_point,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      external_reference: preferencia.external_reference,
    };

  } catch (error) {
    console.error('Erro ao criar preferência:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao criar preferência de pagamento'
    );
  }
});

/**
 * 🔔 WEBHOOK DO MERCADO PAGO
 * Recebe notificações de pagamento e atualiza o Firestore
 */
exports.mercadoPagoWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verificar se é uma notificação do Mercado Pago
    const topic = req.query.topic || req.query.type;
    const resourceId = req.query.id || req.query['data.id'];

    if (!topic || !resourceId) {
      return res.status(400).json({ error: 'Parâmetros inválidos' });
    }

    // Obter access token
    const accessToken = functions.config().mercadopago?.access_token;
    
    if (!accessToken) {
      return res.status(500).json({ error: 'Access token não configurado' });
    }

    // Se for notificação de pagamento
    if (topic === 'payment') {
      // Obter detalhes do pagamento
      const paymentResponse = await axios.get(
        `${MERCADO_PAGO_API_URL}/v1/payments/${resourceId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const pagamento = paymentResponse.data;
      const externalReference = pagamento.external_reference;

      if (!externalReference) {
        return res.status(200).json({ message: 'Pagamento sem referência externa' });
      }

      // Extrair eventoId e userId da referência externa
      const [eventoId, userId] = externalReference.split('_');

      // Buscar pagamento no Firestore
      const pagamentoDoc = await db
        .collection('pagamentos')
        .where('pagamentoId', '==', resourceId.toString())
        .limit(1)
        .get();

      if (pagamentoDoc.empty) {
        // Criar documento se não existir
        await db.collection('pagamentos').doc(resourceId.toString()).set({
          pagamentoId: resourceId.toString(),
          eventoId,
          userId,
          valorTotal: pagamento.transaction_amount,
          metodoPagamento: pagamento.payment_method_id,
          status: pagamento.status,
          externalReference,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Atualizar documento existente
        await pagamentoDoc.docs[0].ref.update({
          status: pagamento.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Se pagamento aprovado, confirmar compra de ingressos
      if (pagamento.status === 'approved') {
        // Buscar dados da preferência
        const preferenciaResponse = await axios.get(
          `${MERCADO_PAGO_API_URL}/checkout/preferences/${pagamento.preference_id}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        const preferencia = preferenciaResponse.data;
        const ingressos = JSON.parse(preferencia.metadata?.ingressos || '[]');

        // Confirmar compra de ingressos
        const { comprarIngressos } = require('./ingressoService');
        
        await comprarIngressos({
          eventoId,
          userId,
          userName: pagamento.payer?.first_name || 'Usuário',
          userEmail: pagamento.payer?.email || '',
          userPhoto: '',
          ingressos,
          valorTotal: pagamento.transaction_amount,
          metodoPagamento: pagamento.payment_method_id,
          metadadosPagamento: {
            pagamentoId: resourceId,
            preferenciaId: pagamento.preference_id,
            status: pagamento.status,
          },
        });
      }

      return res.status(200).json({ message: 'Webhook processado com sucesso' });
    }

    return res.status(200).json({ message: 'Notificação recebida' });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * 🔍 VERIFICAR STATUS DO PAGAMENTO
 * Verifica o status atual de um pagamento
 */
exports.verificarStatusPagamento = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Usuário não autenticado'
    );
  }

  const { pagamentoId } = data;

  if (!pagamentoId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ID do pagamento não fornecido'
    );
  }

  try {
    const accessToken = functions.config().mercadopago?.access_token;
    
    if (!accessToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Access token não configurado'
      );
    }

    const response = await axios.get(
      `${MERCADO_PAGO_API_URL}/v1/payments/${pagamentoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    return {
      status: response.data.status,
      status_detail: response.data.status_detail,
      transaction_amount: response.data.transaction_amount,
      payment_method_id: response.data.payment_method_id,
    };

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erro ao verificar status do pagamento'
    );
  }
});
