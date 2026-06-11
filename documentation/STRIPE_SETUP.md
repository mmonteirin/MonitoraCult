# Configuração Stripe

Este projeto usa Stripe Checkout via Firebase Functions.

## Variáveis obrigatórias

Configure a chave secreta somente no ambiente das Functions:

```bash
firebase functions:config:set stripe.secret_key="sk_live_..."
```

Opcionalmente configure a chave pública no ambiente do Expo:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

## Webhook

No painel da Stripe, crie um endpoint apontando para:

```text
https://<REGIAO>-<PROJECT_ID>.cloudfunctions.net/stripeWebhook
```

Eventos recomendados:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`

Depois configure o segredo do webhook:

```bash
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

## URLs de retorno

Por padrão, o checkout retorna para:

```text
monitoracult://pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}
monitoracult://pagamento/cancelado
```

Se precisar usar URLs diferentes:

```bash
firebase functions:config:set \
  stripe.success_url="monitoracult://pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}" \
  stripe.cancel_url="monitoracult://pagamento/cancelado"
```

## Deploy

```bash
firebase deploy --only functions
```

Depois do deploy, faça uma compra de teste no Stripe antes de usar as chaves live em produção.
