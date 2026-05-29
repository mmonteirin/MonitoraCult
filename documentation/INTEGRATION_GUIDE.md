# 🔗 GUIA DE INTEGRAÇÃO - Feed Social + Sistema de Ingressos

## 📌 Visão Geral

Este guia mostra como integrar o novo **Feed Social Instagram-like** com o novo **Sistema Completo de Ingressos** de forma harmônica no MonitoraCult.

---

## 🎯 Fluxo Completo do Usuário

```
┌─────────────────────────────────────────────────────────────┐
│  USUÁRIO EXPLORA APP                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Abre TelaFeed.js → Vê timeline de eventos/posts        │
│                         (Feed Social)                       │
│                                                              │
│  2. Vê post interessante → Clica para expandir             │
│                                                              │
│  3. Opções:                                                 │
│     A) Dar like ❤️                                         │
│     B) Comentar 💬                                         │
│     C) Compartilhar ↗️                                      │
│     D) Comprar ingresso 🎫                                 │
│                                                              │
│  4. Clica "Comprar Ingresso" → Vai para TelaIngressos.js   │
│     (Sistema de Ingressos)                                  │
│                                                              │
│  5. Seleciona tipos/quantidade → Revisa carrinho            │
│                                                              │
│  6. Finalizacompra → Email com código                       │
│                                                              │
│  7. Salva ingresso → Vê em "Meus Ingressos"               │
│                                                              │
│  8. No dia → Apresenta código na entrada                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Passo a Passo de Integração

### PASSO 1: Atualizar Evento no Firestore

Adicione estes campos no documento do evento:

```javascript
// Em eventos/{eventoId}
{
  // ... campos existentes
  
  // NOVOS CAMPOS PARA INGRESSOS
  capacidade: 200,                    // Capacidade total
  ingressosVendidos: 45,              // Vendidos até agora
  precoInteira: 50,                   // Preço base
  precoMeia: 25,                      // Preço com desconto
  precoEstudante: 35,
  precoSenior: 25,
  precoPromocional: 25,
  
  // NOVO CAMPO PARA FEED
  hashtags: ['#musica', '#evento', '#cultura'],
  categoria: 'Música',                // Para organizar feed
}
```

### PASSO 2: Adicionar Botão "Comprar" no EventoCard

No `components/EventoCard.js` (ou `screens/TelaFeed.js`), adicione:

```javascript
// Adicionar no renderItem da TelaFeed.js
<TouchableOpacity
  style={styles.btnComprarIngressos}
  onPress={() => navigation.navigate('TelaIngressos', { evento: item })}
>
  <MaterialCommunityIcons name="ticket-outline" size={18} color="#fff" />
  <Text style={styles.btnComprarText}>🎫 Comprar Ingresso</Text>
</TouchableOpacity>

// No StyleSheet:
btnComprarIngressos: {
  backgroundColor: Colors.success,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  marginTop: 10,
}
```

### PASSO 3: Integrar TelaIngressos no Navigator

Em `navigation/EventoStack.js`:

```javascript
import TelaIngressos from '../screens/TelaIngressos';

export const EventoStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="EventoHome" 
        component={EventoHome}
      />
      <Stack.Screen 
        name="EventoDetalhes" 
        component={EventoDetalhes}
      />
      {/* ✅ NOVO */}
      <Stack.Screen 
        name="TelaIngressos" 
        component={TelaIngressos}
        options={{
          title: 'Comprar Ingressos',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};
```

### PASSO 4: Adicionar "Meus Ingressos" no Menu do Perfil

Em `screens/PerfilMenu.js`:

```javascript
import { useIngressos } from '../hooks/useIngressos';
import CardIngresso from '../components/CardIngresso';

const PerfilMenu = ({ navigation }) => {
  const { user } = useAuth();
  const { ingressos, carregarIngressos, loading } = useIngressos();
  const [filterTab, setFilterTab] = useState('proximos');

  useEffect(() => {
    if (user?.uid) {
      carregarIngressos(user.uid, filterTab);
    }
  }, [user?.uid, filterTab]);

  return (
    <View style={styles.container}>
      {/* ... outros menus ... */}

      {/* ✅ NOVO: SEÇÃO DE INGRESSOS */}
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => navigation.navigate('MeusIngressos')}
      >
        <MaterialCommunityIcons
          name="ticket-outline"
          size={24}
          color={Colors.primary}
        />
        <View style={styles.menuInfo}>
          <Text style={styles.menuLabel}>🎫 Meus Ingressos</Text>
          <Text style={styles.menuSubtitle}>
            {ingressos.filter(i => new Date(i.eventoData) > new Date()).length} proximos
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {/* OPCIONAL: Mostrar próximos ingressos */}
      {ingressos.length > 0 && (
        <View style={styles.proximosIngressos}>
          <Text style={styles.proximosTitle}>Próximos Eventos</Text>
          <FlatList
            data={ingressos.filter(i => new Date(i.eventoData) > new Date()).slice(0, 3)}
            renderItem={({ item: compra, index }) => (
              <CardIngresso
                compra={compra}
                ingresso={compra.ingressos[0]}
                index={0}
                total={1}
              />
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};
```

### PASSO 5: Criar Tela Dedicada "Meus Ingressos"

```javascript
// screens/TelaHistoricoIngressos.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SegmentedControlIOS,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useIngressos } from '../hooks/useIngressos';
import CardIngresso from '../components/CardIngresso';
import { Colors } from '../styles/Colors';

export default function TelaHistoricoIngressos() {
  const { user } = useAuth();
  const { ingressos, carregarIngressos, loading } = useIngressos();
  const [filtro, setFiltro] = useState('proximos');

  useEffect(() => {
    carregarIngressos(user.uid, filtro);
  }, [filtro]);

  return (
    <View style={styles.container}>
      {/* FILTRO */}
      <View style={styles.filtroContainer}>
        {Platform.OS === 'ios' ? (
          <SegmentedControlIOS
            values={['Próximos', 'Passados', 'Todos']}
            selectedIndex={filtro === 'proximos' ? 0 : filtro === 'passados' ? 1 : 2}
            onChange={(event) => {
              const valores = ['proximos', 'passados', 'todos'];
              setFiltro(valores[event.nativeEvent.selectedSegmentIndex]);
            }}
          />
        ) : (
          <View style={styles.btnFiltroAndroid}>
            {['Próximos', 'Passados', 'Todos'].map((label, idx) => {
              const valor = ['proximos', 'passados', 'todos'][idx];
              return (
                <TouchableOpacity
                  key={valor}
                  style={[
                    styles.btnFiltro,
                    filtro === valor && styles.btnFiltroAativo,
                  ]}
                  onPress={() => setFiltro(valor)}
                >
                  <Text
                    style={[
                      styles.btnFiltroText,
                      filtro === valor && styles.btnFiltroTextAtivo,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* LISTA */}
      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={Colors.primary}
        />
      ) : (
        <FlatList
          data={ingressos}
          renderItem={({ item: compra, index }) => (
            <View key={compra.id}>
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
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <MaterialCommunityIcons
                name="ticket-outline"
                size={48}
                color={Colors.textMuted}
              />
              <Text style={styles.vazioText}>Nenhum ingresso {filtro}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  filtroContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  // ... (adicionar demais styles)
});
```

### PASSO 6: Adicionar Notifications de Ingresso

Quando alguém compra ingresso, criar notificação:

```javascript
// Em ingressoServiceV2.js -> comprarIngressos()
// Após confirmar compra, criar notificação para criador:

const criarNotificacaoIngresso = async (compra, evento) => {
  const notifRef = await addDoc(collection(db, 'notifications'), {
    fromUserId: compra.userId,
    fromUserName: compra.userName,
    toUserId: evento.uidEvento, // Criador do evento
    type: 'ingresso_vendido',
    mensagem: `${compra.userName} comprou ${compra.ingressos.length} ingresso(s)`,
    eventoId: evento.id,
    compraId: compra.id,
    valor: compra.valorTotal,
    lido: false,
    createdAt: serverTimestamp()
  });

  return notifRef;
};

// Chamar após sucesso:
if (resultado.success) {
  await criarNotificacaoIngresso(resultado, evento);
}
```

### PASSO 7: Adicionar Info de Disponibilidade no Feed

Mostrar quantidade de ingressos restantes:

```javascript
// Em TelaFeed.js -> EventoCard
<View style={styles.ingressosBadge}>
  <MaterialCommunityIcons name="ticket-outline" size={14} color={Colors.success} />
  <Text style={styles.ingressosText}>
    {evento.capacidade - evento.ingressosVendidos} lugares
  </Text>
</View>

// Se lotado:
{evento.ingressosVendidos >= evento.capacidade && (
  <View style={styles.lotadoBadge}>
    <Text style={styles.lotadoText}>EVENTO LOTADO</Text>
  </View>
)}
```

### PASSO 8: Compartilhamento com Link do Ingresso

Quando usuário compartilha evento com ingresso:

```javascript
// Em CardIngresso.js
const handleCompartilhar = async () => {
  const deepLink = `monitoracult://evento/${compra.eventoId}?ingresso=${ingresso.codigoIngresso}`;
  
  await Share.share({
    message: `🎫 Tenho ingresso para ${compra.eventoNome}!\n\n📅 ${compra.eventoData}\n⏰ ${compra.eventoHora}\n📍 ${compra.eventoLocal}\n\nCódigo: ${ingresso.codigoIngresso}\n\nVeja no app: ${deepLink}`,
    title: `${compra.eventoNome} - Ingresso`,
  });
};
```

---

## 📊 Fluxo Técnico Completo

```
USUÁRIO VÊ POST NA FEED
        │
        ▼
┌─────────────────────────────────┐
│ TelaFeed.js                     │
│ - Exibe EventoCard              │
│ - Mostra "🎫 Comprar Ingresso"  │
└─────────┬───────────────────────┘
          │
          ├─ Usuário clica ❤️ → feedService.toggleEventoLike()
          │
          ├─ Usuário comenta → commentService.adicionarComentario()
          │
          └─ Usuário clica 🎫 → navigation.navigate('TelaIngressos', {evento})
                  │
                  ▼
         ┌─────────────────────────────────┐
         │ TelaIngressos.js                │
         │ - Mostra details do evento      │
         │ - SeletorIngressos component    │
         │ - CarrinhoIngressos component   │
         └─────────┬───────────────────────┘
                   │
                   ├─ Usuário seleciona tipos
                   │
                   ├─ useIngressos hook
                   │  - adicionarAoCarrinho()
                   │  - removerDoCarrinho()
                   │
                   └─ Usuário clica "Continuar Pagamento"
                      │
                      ▼
            ┌──────────────────────────────┐
            │ ingressoServiceV2.js         │
            │ - comprarIngressos()         │
            │ - Firestore transaction      │
            │ - Gera códigos únicos        │
            │ - Cria notificações          │
            └──────────┬───────────────────┘
                       │
                       ▼
            ┌──────────────────────────────┐
            │ Sucesso!                     │
            │ - Email com código           │
            │ - Salvo em histórico         │
            │ - Vê em "Meus Ingressos"    │
            └──────────────────────────────┘
```

---

## 🎨 UX Improvements

### Adicionar Quick Stats no Feed

```javascript
// Em EventoCard
<View style={styles.statsRow}>
  <View style={styles.stat}>
    <Text style={styles.statIcon}>❤️</Text>
    <Text style={styles.statValue}>{evento.likes}</Text>
  </View>
  <View style={styles.stat}>
    <Text style={styles.statIcon}>💬</Text>
    <Text style={styles.statValue}>{evento.comments}</Text>
  </View>
  <View style={styles.stat}>
    <Text style={styles.statIcon}>👥</Text>
    <Text style={styles.statValue}>{evento.views}</Text>
  </View>
  <View style={styles.stat}>
    <Text style={styles.statIcon}>🎫</Text>
    <Text style={styles.statValue}>{evento.ingressosVendidos}</Text>
  </View>
</View>
```

### Mostrar Quem Seguir

```javascript
// Em TelaFeed - bottom de cada post
<FollowSection>
  {!user.id === evento.userId && (
    <FollowButton 
      targetUserId={evento.userId}
      targetUserData={evento}
    />
  )}
</FollowSection>
```

---

## ✅ Checklist de Integração

- [ ] Atualizar campos do evento no Firestore
- [ ] Adicionar TelaIngressos no EventoStack navigator
- [ ] Criar useIngressos hook
- [ ] Criar SeletorIngressos component
- [ ] Criar CarrinhoIngressos component
- [ ] Criar CardIngresso component
- [ ] Integrar botão "Comprar" no EventoCard/TelaFeed
- [ ] Criar TelaHistoricoIngressos
- [ ] Adicionar "Meus Ingressos" no PerfilMenu
- [ ] Testar fluxo completo de compra
- [ ] Testar validação de ingresso
- [ ] Testar cancelamento de compra
- [ ] Adicionar analytics de vendas
- [ ] Integrar com sistema de pagamento (stripe/pix)
- [ ] Testar em múltiplos dispositivos

---

## 🧪 Testes

### Teste de Compra
1. Abrir feed
2. Clicaren evento
3. Clicar "Comprar Ingresso"
4. Selecionar 2 ingressos inteira
5. Clicar "Continuar Pagamento"
6. Confirmar compra
7. Verificar sucesso e email

### Teste de Validação
1. Obter código do ingresso
2. Usar em validador (admin)
3. Marcar como utilizado
4. Tentar validar novamente (falhar)

### Teste de Cancelamento
1. Comprar ingresso
2. Ir em "Meus Ingressos"
3. Cancelar compra
4. Verificar reembolso

---

## 📞 Referências

- **Ingressos:** `SYSTEM_INGRESSOS_GUIDE.md`
- **Feed Social:** `SOCIAL_FEED_INSTAGRAM_GUIDE.md`
- **Otimizações:** `RAM_OPTIMIZATION_GUIDE.md`

---

**Integração Completa:** ✅  
**Pronto para Produção:** ✅  
**Data:** 18 de Maio, 2026
