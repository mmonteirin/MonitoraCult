# 🎨 Expandable Pill Tab Bar - Guia de Integração MonitoraCult

## 📦 Pré-requisitos

Todas as dependências já estão no seu projeto:

```json
{
  "@react-navigation/bottom-tabs": "^6.x",
  "expo-blur": "^12.x",
  "expo-linear-gradient": "^12.x",
  "@expo/vector-icons": "^13.x",
  "react-native-safe-area-context": "^4.x",
  "expo-haptics": "^12.x",
  "moti": "^0.x"
}
```

✅ **Nenhuma instalação adicional necessária!**

---

## 🚀 Instalação (4 Passos Simples)

### 1️⃣ **Substituir o arquivo TabNavigator.js**

Substitua o arquivo `/navigation/TabNavigator.js` pelo código otimizado:

```bash
# Fazer backup do arquivo atual
cp navigation/TabNavigator.js navigation/TabNavigator.js.backup

# Copiar o novo arquivo
cp TabNavigator_OTIMIZADO.js navigation/TabNavigator.js
```

Ou manualmente:
- Abra `navigation/TabNavigator.js`
- Copie todo o conteúdo de `TabNavigator_OTIMIZADO.js`
- Cole e salve

### 2️⃣ **Verificar Importações**

O arquivo usa:
```javascript
import { useTheme } from "../context/ThemeContext";
```

**Verifique se seu `ThemeContext.js` exporta:**
```javascript
export { useTheme }; // ou similar
```

### 3️⃣ **Verificar Paleta de Cores**

O ThemeContext deve exportar um objeto `colors` com:
```javascript
{
  primary: "#6C5CE7",           // cor principal
  primaryLight: "#8B7FF0",      // variação clara
  primaryDark: "#4A3BA8",       // variação escura
  // ... outras cores
}
```

Se sua paleta for diferente, edite a função `getPillTokens()` na linha ~72.

### 4️⃣ **Testar**

```bash
npx expo start
# Pressione 'i' para iOS ou 'a' para Android
```

---

## 🎨 Customização

### 🌈 Mudar Cores

**Arquivo: `navigation/TabNavigator.js`**

Localize a função `getPillTokens()` (linha ~72) e edite a seção de cores:

```javascript
// LIGHT MODE (padrão)
return {
  // Mudando de Indigo para Emerald (luxo natural)
  pillBg: "rgba(16,185,129,0.10)",        // Verde
  pillBorder: "rgba(16,185,129,0.22)",    // Verde
  dotColor: primary,
  iconActive: primary,
  labelActive: primary,
  // ... resto do código
};
```

**Paletas sugeridas:**

| Paleta | Cores | Uso |
|--------|-------|-----|
| **Indigo** (padrão) | `#6366f1` → `#8b7ff0` | Tech, Moderno |
| **Emerald** | `#10b981` → `#059669` | Luxo, Natural |
| **Rose** | `#f43f5e` → `#be123c` | Feminino, Social |
| **Cyan** | `#06b6d4` → `#0891b2` | Inovador, Web3 |
| **Amber** | `#f59e0b` → `#d97706` | Quente, Invitante |

### 📱 Mudar Ícones

**Arquivo: `navigation/TabNavigator.js`**

Localize `TAB_META` (linha ~39) e altere os nomes dos ícones:

```javascript
const TAB_META = {
  Inicio: {
    iconFocused: "home",              // ← mude aqui
    iconDefault: "home-outline",      // ← ou aqui
    label: "Início",
  },
  // ... resto
};
```

**Ícones disponíveis:** [MaterialCommunityIcons](https://materialdesignicons.com/)

Exemplos:
- `home`, `home-outline`
- `magnify`, `magnify-close`
- `account-group`, `account-group-outline`
- `calendar`, `calendar-star`, `calendar-star-outline`
- `account-circle`, `account-circle-outline`
- `bell`, `bell-outline`
- `heart`, `heart-outline`
- `message`, `message-outline`

### ⏱️ Ajustar Velocidade das Animações

**Arquivo: `navigation/TabNavigator.js`**

Procure por `transition` e ajuste `stiffness` e `damping`:

```javascript
// Mais RÁPIDO (snappy)
transition={{
  type: "spring",
  stiffness: 400,  // ↑ aumentar
  damping: 20,     // ↓ diminuir
}}

// Mais LENTO (smooth)
transition={{
  type: "spring",
  stiffness: 200,  // ↓ diminuir
  damping: 40,     // ↑ aumentar
}}
```

| Efeito | Stiffness | Damping |
|--------|-----------|---------|
| Snappy/Rápido | 380+ | 15-20 |
| Smooth/Normal | 300-380 | 20-30 |
| Slow/Lento | 200-300 | 30-50 |

### 🔘 Botão Central

**Para DESATIVAR o botão central (Feed):**

```javascript
Feed: {
  iconFocused: "account-group",
  iconDefault: "account-group-outline",
  label: "Feed",
  // ❌ remova: isCenter: true,
},
```

**Para MOVER para outra aba:**

```javascript
Eventos: {
  iconFocused: "calendar-star",
  iconDefault: "calendar-star-outline",
  label: "Eventos",
  isCenter: true,  // ← moveu para aqui
},
```

---

## 🔧 Troubleshooting

### ❌ Erro: "useTheme não encontrado"

**Solução:** Verifique o caminho do import:
```javascript
// Seu caminho pode ser diferente:
import { useTheme } from "../context/ThemeContext";
// ou
import { useTheme } from "../contexts/ThemeContext";
// ou
import useTheme from "../hooks/useTheme";
```

### ❌ Animações não aparecem

**Solução:** Verifique se `moti` está instalado:
```bash
npm list moti
# ou
yarn list moti
```

Se não estiver:
```bash
npm install moti
# ou
expo install moti
```

### ❌ Cores não mudam

**Solução:** Certifique-se que `ThemeContext` está funcionando:
```javascript
// Em qualquer componente, teste:
const { colors, isDark } = useTheme();
console.log(colors.primary);  // deve mostrar a cor
```

### ❌ Dark mode não funciona

**Solução:** Verifique o ThemeContext:
```javascript
// ThemeContext.js deve ter:
const [isDark, setIsDark] = useState(false);
// e exportar useTheme
```

---

## 📊 Comparação: Antes vs Depois

### ❌ **Antes (TabNavigator original)**
- Tab bar fixo em baixo
- Apenas ícones
- Sem efeito pill
- Animações básicas
- Sem botão central elevado

### ✅ **Depois (Expandable Pill)**
- Tab bar flutuante com blur
- Ícones + labels dinâmicos
- Pills que se expandem/contraem
- Animações spring premium
- Botão central com glow pulsante
- Light/Dark mode adaptativo
- Haptic feedback integrado

---

## 🎯 Checklist de Implementação

- [ ] Arquivo `TabNavigator_OTIMIZADO.js` copiado
- [ ] Substituto original `TabNavigator.js` feito backup
- [ ] ThemeContext verificado
- [ ] Cores customizadas (opcional)
- [ ] Ícones customizados (opcional)
- [ ] App compilado sem erros
- [ ] Animações fluidas em dispositivo real
- [ ] Testar em Light e Dark mode
- [ ] Testar em iOS e Android

---

## 📚 Recursos

### Documentação
- [React Navigation Bottom Tabs](https://reactnavigation.org/docs/bottom-tab-navigator/)
- [Moti Documentation](https://moti.fyi/)
- [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur/)
- [MaterialCommunityIcons](https://materialdesignicons.com/)

### Arquivos Relacionados
- `navigation/TabNavigator.js` ← Seu arquivo principal
- `context/ThemeContext.js` ← Tema e cores
- `package.json` ← Dependências

---

## 🚀 Performance Tips

### Otimizações Implementadas ✅
- ✓ GPU-accelerated animations (Moti + Reanimated)
- ✓ Evita re-renders desnecessários
- ✓ BlurView otimizado para Expo
- ✓ Haptic feedback nativo
- ✓ Lazy screen loading suportado

### Se tiver lentidão:

1. **Reduzir intensidade do blur:**
```javascript
blurIntensity: 60,  // ← reduza de 85
```

2. **Simplificar animações:**
```javascript
// Ao invés de spring complexo:
transition={{ type: "timing", duration: 200 }}
```

3. **Lazy load screens:**
```javascript
<Tab.Screen 
  name="Feed" 
  component={FeedStack}
  options={{ lazy: true }}  // ← add isto
/>
```

---

## 🎓 Próximas Melhorias (Roadmap)

- [ ] Badges de notificação
- [ ] Reordenação de tabs (draggable)
- [ ] Atalhos de teclado (Arrow keys)
- [ ] Animações de página (page transitions)
- [ ] Theme transitions animadas
- [ ] Indicador visual de screen focus

---

## 💬 Suporte

Se encontrar problemas:

1. **Verifique o console** (`Metro Bundler`)
2. **Clear cache**: `npm start -- --reset-cache`
3. **Reinstale node_modules**: `rm -rf node_modules && npm install`
4. **Teste em outro dispositivo/emulador**

---

## 📝 Licença

Este componente é parte do projeto MonitoraCult. 
Sinta-se livre para customizar e usar em seu projeto!

---

**Versão:** 1.0.0  
**Última atualização:** 2024  
**Compatível com:** Expo SDK 48+, React Native 0.71+
