# 💳 Integração Mercado Pago - MonitoraCult

## 📋 Visão Geral

Este guia explica como configurar e usar a integração com Mercado Pago para processamento de pagamentos de ingressos no MonitoraCult.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React Native)                │
├─────────────────────────────────────────────────────┤
│  CheckoutScreen.js → Tela de seleção de pagamento  │
│  paymentService.js → Cliente API Mercado Pago      │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│         FIREBASE FUNCTIONS (Backend)                │
├─────────────────────────────────────────────────────┤
│  criarPreferenciaPagamento → Cria preferência MP   │
│  mercadoPagoWebhook → Recebe notificações MP       │
│  verificarStatusPagamento → Consulta status MP     │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│           MERCADO PAGO API                           │
├─────────────────────────────────────────────────────┤
│  Cria preferência → Gera QR Code (PIX)              │
│  Webhook → Notifica pagamentos aprovados            │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│           FIRESTORE (Dados)                          │
├─────────────────────────────────────────────────────┤
│  pagamentos/{pagamentoId} → Histórico de pagamentos │
│  usuarios/{userId}/compras → Compras confirmadas    │
└─────────────────────────────────────────────────────┘
```

## 🔧 Configuração Inicial

### 1. Criar Conta Mercado Pago

1. Acesse [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Faça login ou crie uma conta
3. Vá em "Suas integrações" → "Credenciais"
4. Copie o **Access Token** (Produção ou Teste)

### 2. Configurar Firebase Functions

Instale as dependências das Functions:

```bash
cd functions
npm install
```

### 3. Configurar Access Token

Configure o Access Token do Mercado Pago no Firebase:

**Para ambiente de teste:**
```bash
firebase functions:config:set mercadopago.access_token="APP_USR-6894035298561391-060307-0cab57d685bd378454c97500e30a18e0-3448092476"
```

**Para ambiente de produção:**
```bash
firebase functions:config:set mercadopago.access_token="SEU_ACCESS_TOKEN_PRODUCAO_AQUI"
```

Ou via console do Firebase:
1. Acesse o console do Firebase
2. Vá em Functions → Configuração
3. Adicione a variável `mercadopago.access_token`

### 4. Deploy das Functions

```bash
firebase deploy --only functions
```

## 🌐 Configurar Webhook Mercado Pago

### 1. Obter URL do Webhook

Após o deploy, você receberá a URL da função:
```
https://sua-regiao-project.cloudfunctions.net/mercadoPagoWebhook
```

### 2. Configurar no Mercado Pago

1. Acesse [https://www.mercadopago.com.br/developers](https://www.mercadopago.com.br/developers)
2. Vá em "Suas integrações" → "Webhooks"
3. Clique em "Configurar Webhook"
4. Cole a URL do webhook
5. Selecione os eventos:
   - `payment`
   - `payment.updated`
6. Salve a configuração

### 3. Configurar URL de Retorno

No Mercado Pago, configure as URLs de retorno (back_urls):

- **Success**: `https://monitoracult.app/pagamento/sucesso`
- **Failure**: `https://monitoracult.app/pagamento/falha`
- **Pending**: `https://monitoracult.app/pagamento/pendente`

## 📱 Uso no App

### Fluxo de Pagamento

1. **Usuário seleciona ingressos** → `EventoIngresso.js`
2. **Clica em "Comprar"** → Redirecionado para `CheckoutScreen.js`
3. **Escolhe método (PIX/Boleto)**
4. **Clica em "Pagar"** → Chama Firebase Function
5. **Firebase Function cria preferência** no Mercado Pago
6. **QR Code exibido** (PIX) ou **link do boleto** gerado
7. **Usuário faz o pagamento**
8. **Webhook Mercado Pago notifica** Firebase Function
9. **Firebase Function confirma compra** → `comprarIngressos()`
10. **Ingressos gerados** → Usuário recebe códigos

### Métodos Suportados

#### PIX
- Pagamento instantâneo via QR Code
- Taxa: 0,99% + R$ 0,30
- Confirmação em tempo real via webhook

#### Boleto
- Pagamento em até 3 dias úteis
- Taxa: R$ 2,90
- Confirmação pode levar até 24h após pagamento

## 🔒 Segurança

### Firestore Rules

As regras do Firestore foram atualizadas para proteger dados de pagamento:

```javascript
match /pagamentos/{pagamentoId} {
  // Usuário pode ler seus próprios pagamentos
  allow read: if isAuthenticated()
    && (resource.data.userId == request.auth.uid || isAdmin());

  // Apenas Firebase Functions podem criar/atualizar
  allow create: if false;
  allow update: if false;
  allow delete: if false;
}
```

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no `.env`:

```env
EXPO_PUBLIC_MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
```

## 🧪 Testes

### Modo Teste

O Mercado Pago oferece um modo de teste:
1. Use o Access Token de teste
2. Use cartões de teste fornecidos pelo Mercado Pago
3. Simule pagamentos aprovados e rejeitados

### Credenciais de Teste (Configuradas)

As seguintes credenciais de teste já estão configuradas no projeto:

- **Public Key**: `APP_USR-a64929c8-80c1-491d-a0e7-0bd0b2b5fcf0`
- **Access Token**: `APP_USR-6894035298561391-060307-0cab57d685bd378454c97500e30a18e0-3448092476`
- **Application ID**: `6894035298561391`
- **User ID**: `3448092476`

### Usuário de Teste

Para testar pagamentos no ambiente de sandbox:

- **Usuário**: `TESTUSER5727360468452804923`
- **Senha**: `Y4AlN9DBzz`
- **Código de Verificação**: `092476`

### Cartões de Teste

Cartões para testar pagamentos:
- **Aprovado**: `5031 4332 1540 6351`
- **Rejeitado**: `4111 1111 1111 1111`

## 📊 Monitoramento

### Logs das Functions

```bash
firebase functions:log
```

### Verificar Pagamentos

No console do Firebase:
1. Firestore → Coleção `pagamentos`
2. Ver status, método e metadados

## 🐛 Troubleshooting

### Erro: "Access token não configurado"

**Solução**: Configure o access token via:
```bash
firebase functions:config:set mercadopago.access_token="SEU_TOKEN"
```

### Webhook não recebendo notificações

**Solução**:
1. Verifique se a URL do webhook está correta
2. Verifique se os eventos estão selecionados no Mercado Pago
3. Verifique os logs das Functions

### Pagamento aprovado mas ingressos não gerados

**Solução**:
1. Verifique os logs da function `mercadoPagoWebhook`
2. Verifique se a função `comprarIngressos` está sendo chamada
3. Verifique se há erro na transação do Firestore

## 📈 Taxas Mercado Pago

- **PIX**: 0,99% + R$ 0,30 por transação
- **Boleto**: R$ 2,90 por boleto
- **Cartão de Crédito**: 2,99% + R$ 0,30 por transação

## 🔄 Atualizações

### Para adicionar novo método de pagamento

1. Adicione em `paymentService.js`:
```javascript
export const METODOS_PAGAMENTO = {
  PIX: 'pix',
  BOLETO: 'boleto',
  CARTAO: 'credit_card',
  NOVO_METODO: 'novo_metodo',
};
```

2. Adicione taxa em `calcularTaxas()`:
```javascript
case METODOS_PAGAMENTO.NOVO_METODO:
  return valor * 0.05; // 5%
```

3. Atualize `CheckoutScreen.js` para incluir o novo método

## 📞 Suporte

- **Documentação Mercado Pago**: [https://www.mercadopago.com.br/developers/pt/docs](https://www.mercadopago.com.br/developers/pt/docs)
- **Firebase Functions**: [https://firebase.google.com/docs/functions](https://firebase.google.com/docs/functions)
- **Firestore Rules**: [https://firebase.google.com/docs/firestore/security](https://firebase.google.com/docs/firestore/security)

## ✅ Checklist de Implementação

- [x] Criar conta Mercado Pago
- [x] Obter Access Token
- [x] Configurar Firebase Functions
- [x] Configurar Access Token no Firebase
- [ ] Deploy das Functions
- [ ] Configurar Webhook no Mercado Pago
- [ ] Configurar URLs de retorno
- [x] Atualizar Firestore Rules
- [ ] Testar pagamento PIX
- [ ] Testar pagamento Boleto
- [ ] Testar webhook
- [ ] Monitorar logs em produção

---

**Status**: ✅ Implementação Completa  
**Última Atualização**: 3 de Junho, 2026
