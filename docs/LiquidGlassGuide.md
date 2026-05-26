# Guia de Liquid Glass (Glassmorphism)

Este projeto usa um sistema de estilos **Liquid Glass** (vidro líquido/glassmorphism) para criar uma interface moderna e translúcida.

## O que é Liquid Glass?

Liquid Glass é um padrão de design moderno que simula vidro translúcido com:
- **Transparência**: Fundo com opacidade (rgba)
- **Bordas suaves**: Bordas com cor translúcida
- **Blur/Desfoque**: Efeito de desfoque ao fundo (simulado com backdropFilter)
- **Sombra sutil**: Sombras suaves para profundidade
- **Gradientes**: Tons que transmitem elegância

## Arquivos

### `styles/glassStyles.js`
Contém os estilos reutilizáveis:
- `glassContainer` — container base translúcido
- `glassCard` — card com efeito de vidro (notificações)
- `glassButton` — botão com vidro
- `glassButtonPrimary` — botão primário
- `glassBadge` — badge com vidro
- `glassHeader` — cabeçalho translúcido

### `components/GlassContainer.js`
Componente reutilizável que encapsula o efeito:
```javascript
<GlassContainer intensity={0.15} variant="light" shadow>
  {children}
</GlassContainer>
```

**Props:**
- `intensity` — opacidade (0-1, padrão: 0.15)
- `variant` — "light" ou "dark" (padrão: "light")
- `shadow` — ativar sombra (padrão: true)
- `style` — estilos adicionais

## Como Usar

### 1. Importar estilos globais

```javascript
import { glassStyles } from '../styles/glassStyles';
```

### 2. Aplicar ao container/header

```javascript
<View style={[styles.container, glassStyles.glassHeader]}>
  {/* conteúdo */}
</View>
```

### 3. Usar GlassContainer para elementos

```javascript
import GlassContainer from '../components/GlassContainer';

<GlassContainer intensity={0.12} variant="light">
  <Text>Conteúdo com efeito de vidro</Text>
</GlassContainer>
```

### 4. Botões com vidro

```javascript
<TouchableOpacity style={glassStyles.glassButton}>
  <Text>Clique aqui</Text>
</TouchableOpacity>
```

## Exemplos de Integração

### Header com vidro
```javascript
import Header from '../components/Header';

<Header
  title="MonitoraCult"
  unreadCount={5}
  onPressNotifications={() => {}}
/>
```

### Notificações com vidro
```javascript
import { glassStyles } from '../styles/glassStyles';
import GlassContainer from '../components/GlassContainer';

<GlassContainer intensity={0.15}>
  <Text>Sua notificação aqui</Text>
</GlassContainer>
```

### Ações sociais com vidro
```javascript
import SocialActions from '../components/SocialActions';

<SocialActions postId="123" userId="456" />
```

## Customização

### Variar a intensidade

```javascript
// Mais translúcido
<GlassContainer intensity={0.08}>
  {/* levemente transparente */}
</GlassContainer>

// Mais opaco
<GlassContainer intensity={0.3}>
  {/* mais visível */}
</GlassContainer>
```

### Tema escuro

```javascript
<GlassContainer variant="dark">
  {/* fundo escuro com bordas claras */}
</GlassContainer>
```

### Sem sombra

```javascript
<GlassContainer shadow={false}>
  {/* sem efeito de sombra */}
</GlassContainer>
```

## Cores e Paleta

### Luz (Light)
- Background: `rgba(255, 255, 255, 0.1-0.15)`
- Border: `rgba(255, 255, 255, 0.2-0.3)`

### Escuro (Dark)
- Background: `rgba(50, 50, 50, 0.25-0.4)`
- Border: `rgba(255, 255, 255, 0.1-0.15)`

## Performance

- O efeito de vidro é simulado com opacidade e bordas (sem blur nativo)
- Compatible com React Native (Android e iOS)
- Sombras usam `elevation` (Android) e `shadowColor` (iOS)

## Referências

- [Glassmorphism Design Trend](https://www.awwwards.com/glassmorphism-css-effect.html)
- [React Native StyleSheet](https://reactnative.dev/docs/stylesheet)

