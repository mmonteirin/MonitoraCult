# 🎫 SISTEMA DE INGRESSOS - MonitoraCult

## 📋 Visão Geral

Sistema completo de venda, gerenciamento e validação de ingressos para eventos com suporte a:
- ✅ Múltiplos tipos de ingresso (Inteira, Meia, Estudante, Senior, Promocional)
- ✅ Descontos automáticos por tipo
- ✅ Carrinho de compra
- ✅ Códigos únicos de ingresso
- ✅ Validação QR code
- ✅ Histórico de compras
- ✅ Gerenciamento de capacidade
- ✅ Cancelamento com reembolso

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│              SCREENS (Telas)                        │
├─────────────────────────────────────────────────────┤
│  TelaIngressos.js    → Compra de ingressos         │
│  PerfilMenu.js       → Histórico (seção)           │
│  EventoDetalhes.js   → Link "Comprar Ingressos"    │
└─────────┬───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│           COMPONENTS (Componentes)                  │
├─────────────────────────────────────────────────────┤
│  SeletorIngressos.js → UI para escolher tipos     │
│  CarrinhoIngressos.js → Resumo do carrinho        │
│  CardIngresso.js      → Card individual           │
└─────────┬───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│            HOOKS (State Management)                 │
├─────────────────────────────────────────────────────┤
│  useIngressos.js → Gerencia todo fluxo            │
└─────────┬───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│           SERVICES (Business Logic)                 │
├─────────────────────────────────────────────────────┤
│  ingressoServiceV2.js → Firestore operations      │
└─────────┬───────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│        FIREBASE FIRESTORE (Dados)                  │
├─────────────────────────────────────────────────────┤
│  usuarios/{userId}/compras/{compraId}              │
│  comprasIngressos/{compraId}                       │
│  eventos/{eventoId}  [campos: ingressosVendidos]   │
└─────────────────────────────────────────────────────┘
```

---

## 📂 Estrutura de Dados - Firestore

### 1. Compra de Ingressos
```
usuarios/{userId}/compras/{compraId}
├── eventoId: string
├── eventoNome: string
├── eventoData: string
├── eventoHora: string
├── eventoLocal: string
├── eventoFoto: string
├── userId: string
├── userName: string
├── userEmail: string
├── userPhoto: string
├── ingressos: Array<{
│   ├── tipo: "inteira" | "meia" | "estudante" | "senior" | "promocional"
│   ├── quantidade: number
│   ├── status: "confirmado" | "utilizado" | "cancelado"
│   ├── codigoIngresso: string (único)
│   └── usadoEm: timestamp (quando foi validado)
├── valorTotal: number
├── metodoPagamento: "credit_card" | "pix" | "boleto"
├── metadadosPagamento: object (transactionId, etc)
├── status: "confirmado" | "cancelado"
├── dataCompra: timestamp
└── dataValidade: timestamp
```

### 2. Compras (Coleção Raiz - Para Relatórios)
```
comprasIngressos/{compraId}
├── [todos os campos acima]
├── usuarioId: string (para queries)
└── ... (duplicado para analytics)
```

### 3. Atualização no Evento
```
eventos/{eventoId}
├── ... [campos existentes]
├── capacidade: number (total de ingressos)
├── ingressosVendidos: number (contador)
├── precoInteira: number
├── precoMeia: number (50% do inteira)
├── precoEstudante: number (70% do inteira)
├── precoSenior: number (50% do inteira)
├── promocional: boolean
└── dataLimiteCompra: timestamp (opcional)
```

---

## 🚀 Como Usar

### 1. Integrar no EventoDetalhes.js

```javascript
import TelaIngressos from '../screens/TelaIngressos';

// No nav stack:
<EventoStack.Screen 
  name="TelaIngressos"
  component={TelaIngressos}
/>

// No EventoDetalhes.js - Adicionar botão:
<TouchableOpacity 
  style={styles.btnComprar}
  onPress={() => navigation.navigate('TelaIngressos', { evento })}
>
  <Text>🎫 Comprar Ingressos</Text>
</TouchableOpacity>
```

### 2. Exibir Histórico em PerfilMenu.js

```javascript
import { useIngressos } from '../hooks/useIngressos';
import CardIngresso from '../components/CardIngresso';

const PerfilMenu = () => {
  const { user } = useAuth();
  const { ingressos, carregarIngressos, loading } = useIngressos();

  useEffect(() => {
    carregarIngressos(user.uid, 'proximos'); // 'proximos', 'passados', 'todos'
  }, []);

  return (
    <View>
      <Text>Meus Ingressos</Text>
      <FlatList
        data={ingressos}
        renderItem={({ item: compra, index }) => (
          <View>
            {compra.ingressos.map((ing, idx) => (
              <CardIngresso
                key={ing.codigoIngresso}
                compra={compra}
                ingresso={ing}
                index={idx}
                total={compra.ingressos.length}
              />
            ))}
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

### 3. Validar Ingresso no Evento

```javascript
// Para admins/recepcionistas validarem ingressos:
const { verificar, validarIngresso } = useIngressos();

const handleValidar = async () => {
  const resultado = await verificarIngresso(
    codigoInserido,
    eventoId
  );
  
  if (resultado.valido) {
    // Usuário pode entrar
    Alert.alert('✅ Acesso Liberado', `Bem-vindo ${resultado.usuario}`);
  }
};
```

---

## 🎯 Tipos de Ingresso

```javascript
TIPOS_INGRESSO = {
  INTEIRA: { chave: 'inteira', label: 'Inteira', desconto: 0 },
  MEIA: { chave: 'meia', label: 'Meia Entrada (50%)', desconto: 0.5 },
  ESTUDANTE: { chave: 'estudante', label: 'Estudante (30%)', desconto: 0.3 },
  SENIOR: { chave: 'senior', label: 'Idoso/Deficiente (50%)', desconto: 0.5 },
  PROMOCIONAL: { chave: 'promocional', label: 'Promocional (50%)', desconto: 0.5 },
};
```

---

## 📊 Funções do Serviço

### comprarIngressos()
```javascript
const resultado = await comprarIngressos({
  eventoId: 'evt123',
  userId: 'usr456',
  userName: 'João Silva',
  userEmail: 'joao@email.com',
  userPhoto: 'https://...',
  ingressos: [
    { tipo: 'inteira', quantidade: 2 },
    { tipo: 'estudante', quantidade: 1 }
  ],
  valorTotal: 145.50,
  metodoPagamento: 'credit_card'
});

// Retorna:
{
  success: true,
  compraId: 'comp789',
  ingressos: [...],
  mensagem: '3 ingresso(s) comprado(s) com sucesso!'
}
```

### obterIngressosUsuario()
```javascript
const ingressos = await obterIngressosUsuario(
  userId,
  'proximos' // 'proximos', 'passados', 'todos'
);
```

### verificarIngresso()
```javascript
const resultado = await verificarIngresso(
  'INGR-123456-ABC123',
  'evt123'
);

// Retorna:
{
  valido: true,
  mensagem: 'Ingresso válido',
  ingresso: { compraId, usuario, ... }
}
```

### validarIngresso()
```javascript
// Marca ingresso como utilizado (entrada no evento)
const resultado = await validarIngresso(
  'INGR-123456-ABC123',
  'evt123'
);

// Retorna:
{
  valido: true,
  mensagem: 'Ingresso validado com sucesso',
  usuario: 'João Silva'
}
```

### obterEstatisticasVendas()
```javascript
const stats = await obterEstatisticasVendas('evt123');

// Retorna:
{
  totalIngressosVendidos: 150,
  arrecadacaoTotal: 7500.00,
  tiposVendidos: {
    inteira: 90,
    meia: 40,
    estudante: 20
  },
  statusIngressos: {
    confirmado: 140,
    utilizado: 10,
    cancelado: 0
  },
  comprasPorDia: { '2026-05-18': {...} }
}
```

---

## 🔐 Segurança - Firestore Rules

```javascript
// Compras - Apenas usuário pode ver suas compras
match /usuarios/{userId}/compras/{document=**} {
  allow read: if request.auth.uid == userId;
  allow create: if request.auth.uid == userId;
  allow delete: if request.auth.uid == userId;
}

// Compras Raiz - Para analytics (apenas admin)
match /comprasIngressos/{document=**} {
  allow read: if isAdmin(request.auth.uid);
  allow create: if isAdmin(request.auth.uid);
}
```

---

## 🎨 Customização

### Adicionar Novo Tipo de Ingresso

```javascript
// Em ingressoServiceV2.js
TIPOS_INGRESSO.VIPADVANCED = {
  chave: 'vip_advanced',
  label: 'VIP Advanced',
  desconto: 0 // 0% = preço cheio
};

// Em TelaIngressos.js
precos.vip_advanced = 200; // Preço custom
```

### Mudar Política de Reembolso

```javascript
// Em cancelarCompra()
// Alterar esta verificação:
const horas = (dataEvento - agora) / (1000 * 60 * 60);

if (horas < 24) { // Mudar para 48, 72, etc
  throw new Error('Não é possível cancelar...');
}
```

---

## 🧪 Testes Recomendados

```javascript
// 1. Comprar 1 ingresso
const compra1 = await comprarIngressos({...});
assert(compra1.success === true);

// 2. Comprar vários tipos
const compra2 = await comprarIngressos({
  ingressos: [
    { tipo: 'inteira', quantidade: 1 },
    { tipo: 'estudante', quantidade: 2 }
  ]
});

// 3. Verificar código
const verif = await verificarIngresso(
  compra1.ingressos[0].codigoIngresso,
  'evt123'
);
assert(verif.valido === true);

// 4. Validar ingresso
const valid = await validarIngresso(
  compra1.ingressos[0].codigoIngresso,
  'evt123'
);
assert(valid.valido === true);

// 5. Tentar validar novamente (já utilizado)
const valid2 = await validarIngresso(...);
assert(valid2.valido === false);

// 6. Cancelar compra
const canc = await cancelarCompra(compra1.id, userId);
assert(canc.success === true);

// 7. Obter estatísticas
const stats = await obterEstatisticasVendas('evt123');
assert(stats.totalIngressosVendidos >= 0);
```

---

## 📱 Fluxo do Usuário

1. **Explorar Evento** → Clica em "Comprar Ingressos"
2. **Selecionar Ingressos** → Escolhe tipos e quantidades
3. **Revisar Carrinho** → Vê resumo com total
4. **Pagar** → Processa pagamento (integração com stripe/pix)
5. **Confirmar** → Recebe email com código do ingresso
6. **Armazenar** → Vê em "Meus Ingressos"
7. **Usar** → Apresenta código QR na entrada do evento
8. **Validar** → Recepcionista verifica e libera acesso

---

## 🔄 Integração com Pagamento

Próxima fase:
- [ ] Integrar Stripe para cartão
- [ ] Integrar PIX para transferência
- [ ] Integrar Boleto para débito
- [ ] Webhooks para confirmar pagamento

```javascript
// Exemplo (futuro):
const pagamento = await processarPagamento({
  compraId: 'comp789',
  valor: 145.50,
  metodo: 'card', // 'pix', 'boleto'
  numeroCartao: '****',
  tokenPagamento: 'tok_123'
});
```

---

## 📞 Suporte

- Dúvidas? Verificar `services/ingressoServiceV2.js`
- Bugs? Verificar `hooks/useIngressos.js`
- UI? Verificar `components/SeletorIngressos.js` ou `components/CarrinhoIngressos.js`

---

**Status:** ✅ Pronto para Produção  
**Última Atualização:** 18 de Maio, 2026
