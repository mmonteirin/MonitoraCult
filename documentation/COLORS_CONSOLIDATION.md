# 🎨 CONSOLIDAÇÃO DE CORES - MonitoraCult

## API unificada (2026)

| Recurso | Onde | Uso |
|---------|------|-----|
| Paleta ativa | `useTheme().colors` ou `useColors()` | `backgroundColor: colors.background` |
| Gradientes | `useTheme().gradients` ou `useGradients()` | `LinearGradient colors={gradients.primary}` |
| Sombras | `useTheme().shadows` ou `useShadows()` | `...shadowFor(shadows.glow)` |
| React Navigation | `useTheme().navigationTheme` | Já aplicado em `App.js` |
| Estilos dinâmicos | `useThemedStyles((c) => ({ ... }))` | `hooks/useThemedStyles.js` |
| GlobalStyles tema | `useGlobalStyles()` | `hooks/useGlobalStyles.js` |
| Marca fixa | `Brand.primary` | Splash, notificações, loading |
| Import estático | `Colors` | **Sempre tema escuro** — migrar gradualmente |

```javascript
import { useTheme } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";

const { colors, gradients, isDark } = useTheme();
const styles = useThemedStyles((c) => ({
  screen: { flex: 1, backgroundColor: c.background },
}));
```

Substituir variantes de roxo (`#7C3AED`, `#8B5CF6`) por `colors.primary` / `primaryLight` / `primaryDark`.

---

## ✅ Sistema de Cores Consolidado

### 🌓 Dark Mode (Principal)
```javascript
const darkTheme = {
  // Backgrounds
  background: "#070B14",           // Fundo principal
  backgroundSecondary: "#10131F",  // Fundo secundário
  backgroundElevated: "#121826",   // Fundo elevado

  // Surfaces
  surface: "#171B26",              // Cards, containers
  surfaceLight: "#202635",         // Elementos mais suaves
  surfaceMuted: "#111827",         // Elementos em segundo plano

  // Glass
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.08)",
  glassStrong: "rgba(255,255,255,0.11)",

  // Cards
  card: "#1B2130",
  cardHover: "#252D3D",

  // Borders
  border: "#2A3142",
  borderLight: "rgba(255,255,255,0.08)",
  divider: "#242B3A",

  // Brand (Roxo)
  primary: "#6C5CE7",              // Roxo - ação principal
  primaryLight: "#8B7CFF",         // Roxo claro
  primaryDark: "#5746D6",          // Roxo escuro
  primarySoft: "rgba(108,92,231,0.16)",

  // Accents
  accentCyan: "#22D3EE",
  accentPink: "#F472B6",
  accentOrange: "#F97316",
  purpleGlow: "rgba(108,92,231,0.35)",

  // Text
  textPrimary: "#FFFFFF",         // Texto primário
  textSecondary: "#C4C8D4",        // Texto secundário
  textMuted: "#8B91A6",            // Texto terciário

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#38BDF8",

  // Overlays
  overlayDark: "rgba(0,0,0,0.55)",
  overlayStronger: "rgba(0,0,0,0.72)",
  overlayLight: "rgba(255,255,255,0.06)",

  // Shadows
  shadow: "#000000",

  // Map
  mapOverlay: "rgba(15,15,20,0.85)",
};
```

### 📱 Light Mode
```javascript
const lightTheme = {
  // Backgrounds
  background: "#FFFFFF",
  backgroundSecondary: "#F8F9FA",
  backgroundElevated: "#FFFFFF",

  // Surfaces
  surface: "#F1F3F5",
  surfaceLight: "#E9ECEF",
  surfaceMuted: "#DEE2E6",

  // Glass
  glass: "rgba(0,0,0,0.03)",
  glassBorder: "rgba(0,0,0,0.08)",
  glassStrong: "rgba(0,0,0,0.11)",

  // Cards
  card: "#FFFFFF",
  cardHover: "#F8F9FA",

  // Borders
  border: "#E9ECEF",
  borderLight: "rgba(0,0,0,0.08)",
  divider: "#DEE2E6",

  // Brand (Roxo - mantido consistente)
  primary: "#6C5CE7",
  primaryLight: "#8B7CFF",
  primaryDark: "#5746D6",
  primarySoft: "rgba(108,92,231,0.16)",

  // Accents
  accentCyan: "#22D3EE",
  accentPink: "#F472B6",
  accentOrange: "#F97316",
  purpleGlow: "rgba(108,92,231,0.35)",

  // Text
  textPrimary: "#1A1A1A",
  textSecondary: "#495057",
  textMuted: "#868E96",

  // Status
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#38BDF8",

  // Overlays
  overlayDark: "rgba(0,0,0,0.55)",
  overlayStronger: "rgba(0,0,0,0.72)",
  overlayLight: "rgba(255,255,255,0.06)",

  // Shadows
  shadow: "#000000",

  // Map
  mapOverlay: "rgba(255,255,255,0.85)",
};
```

---

## 🔄 Mapeamento de Cores Hardcoded

### Cores Primárias (Roxo)
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `#6C5CE7` | `Colors.primary` | Ação principal, botões |
| `#8B7CFF` | `Colors.primaryLight` | Gradientes, highlights |
| `#5746D6` | `Colors.primaryDark` | Gradientes, hover |
| `#7C3AED` | `Colors.primary` | Variação de roxo |
| `#8B5CF6` | `Colors.primaryLight` | Variação de roxo |
| `#5B21B6` | `Colors.primaryDark` | Variação de roxo |
| `rgba(108,92,231,0.16)` | `Colors.primarySoft` | Backgrounds suaves |
| `rgba(108,92,231,0.2)` | `Colors.primarySoft` | Backgrounds suaves |
| `rgba(108,92,231,0.25)` | `Colors.primarySoft` | Backgrounds suaves |
| `rgba(108,92,231,0.3)` | `Colors.primarySoft` | Backgrounds suaves |
| `rgba(108,92,231,0.35)` | `Colors.purpleGlow` | Glow effects |

### Backgrounds
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `#070B14` | `Colors.background` | Fundo principal |
| `#10131F` | `Colors.backgroundSecondary` | Fundo secundário |
| `#121826` | `Colors.backgroundElevated` | Fundo elevado |
| `#171B26` | `Colors.surface` | Cards, containers |
| `#202635` | `Colors.surfaceLight` | Elementos suaves |
| `#111827` | `Colors.surfaceMuted` | Segundo plano |
| `#1B2130` | `Colors.card` | Cards |
| `#252D3D` | `Colors.cardHover` | Cards hover |
| `#18122B` | `Colors.backgroundSecondary` | Variação |
| `#161B2E` | `Colors.surface` | Variação |
| `#0a0a14` | `Colors.background` | Variação |
| `#0F1221` | `Colors.background` | Variação |
| `#10131F` | `Colors.backgroundSecondary` | Variação |

### Texto
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `#FFFFFF` | `Colors.textPrimary` | Texto primário |
| `#C4C8D4` | `Colors.textSecondary` | Texto secundário |
| `#8B91A6` | `Colors.textMuted` | Texto terciário |
| `#64748B` | `Colors.textMuted` | Variação |
| `#94A3B8` | `Colors.textMuted` | Variação |
| `#1A1A1A` | `Colors.textPrimary` (light mode) | Texto primário light |

### Status
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `#22C55E` | `Colors.success` | Sucesso |
| `#10B981` | `Colors.success` | Variação verde |
| `#EF4444` | `Colors.error` | Erro, perigo |
| `#F59E0B` | `Colors.warning` | Aviso |
| `#38BDF8` | `Colors.info` | Informação |

### Accents
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `#22D3EE` | `Colors.accentCyan` | Cyan accent |
| `#F472B6` | `Colors.accentPink` | Pink accent |
| `#F97316` | `Colors.accentOrange` | Orange accent |
| `#C084FC` | `Colors.primaryLight` | Variação roxo |

### Borders & Dividers
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `#2A3142` | `Colors.border` | Border principal |
| `#242B3A` | `Colors.divider` | Divisor |
| `rgba(255,255,255,0.06)` | `Colors.glass` | Glass effect |
| `rgba(255,255,255,0.08)` | `Colors.glassBorder` | Glass border |
| `rgba(255,255,255,0.11)` | `Colors.glassStrong` | Glass strong |

### Overlays
| Cor Hardcoded | Variável Colors | Uso |
|---------------|-----------------|-----|
| `rgba(0,0,0,0.55)` | `Colors.overlayDark` | Overlay escuro |
| `rgba(0,0,0,0.72)` | `Colors.overlayStronger` | Overlay muito escuro |
| `rgba(15,15,20,0.85)` | `Colors.mapOverlay` | Overlay mapa |

### Cores Especiais (manter hardcoded)
| Cor | Uso |
|-----|-----|
| `#FFFFFF` | QR Code background |
| `#000000` | QR Code foreground |
| `#FFD700` | Estrela/destaque (gold) |
| Cores de categorias | Shows, teatro, gastronomia, etc. (são específicas por categoria) |

---

## 📝 Padrão de Uso

### Importando Colors
```javascript
// Opção 1: Import direto (recomendado para componentes)
import { Colors } from "../styles/Colors";

// Opção 2: Via GlobalStyles
import GlobalStyles from "../styles/GlobalStyles";
const { colors } = GlobalStyles;

// Opção 3: Via ThemeContext (para suporte a dark/light mode)
import { useColors } from "../context/ThemeContext";
const colors = useColors();
```

### Em StyleSheet
```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
  },
  card: {
    backgroundColor: Colors.card,
    borderColor: Colors.border,
  },
});
```

### Em Inline Styles
```javascript
<View style={{ backgroundColor: Colors.surface }}>
  <Text style={{ color: Colors.textPrimary }}>Texto</Text>
</View>
```

### Em Gradients
```javascript
<LinearGradient
  colors={[Colors.primary, Colors.primaryDark]}
  style={styles.gradient}
/>
```

---

## 🎯 Próximas Etapas

1. **Audit completo** - Verificar todas as cores hardcoded restantes
2. **Screens** - Atualizar todas as telas com cores hardcoded
3. **Components** - Atualizar componentes com cores hardcoded
4. **Navigation** - Verificar e atualizar navegação
5. **Categorias** - Avaliar se cores de categorias devem ser centralizadas

---

## 📊 Status de Migração

### Arquivos Principais
- [x] Colors.js - Sistema de cores consolidado
- [x] GlobalStyles.js - 100%
- [x] ThemeContext.js - 100%
- [x] ThemeToggle.js - 100%
- [x] COLORS_CONSOLIDATION.md - Documentação atualizada

### Navigation
- [x] CustomDrawerNavigator.js - Usa Colors
- [x] TabNavigator.js - Usa Colors
- [ ] AppNavigator.js - Verificar

### Screens (com muitas cores hardcoded)
- [ ] AdmEventoDashIndividual.js (30 matches)
- [ ] AdmCadastroEvento.js (29 matches)
- [ ] TelaComunidade.js (26 matches)
- [ ] EventoHome.js (17 matches)
- [ ] EventoPublico.js (17 matches)
- [ ] TelaPainelCidade.js (16 matches)
- [ ] EventoDetalhes.js (13 matches)
- [ ] AdmEventoMetrica.js (14 matches)
- [ ] AdmMenu.js (14 matches)
- [ ] EventoAvaliacao.js (12 matches)
- [ ] PerfilLogin.js (12 matches)
- [ ] PerfilMenu.js (12 matches)
- [ ] TelaCulturaViva.js (11 matches)
- [ ] TelaExploreCidade.js (11 matches)
- [ ] CriarPost.js (9 matches)
- [ ] TelaBusca.js (9 matches)
- [ ] TelaMapaVivo.js (9 matches)
- [ ] TelaNotificacoes.js (9 matches)
- [ ] EventoApp.js (8 matches)
- [ ] TelaInicio.js (8 matches)
- [ ] PerfilCadastroAdmin.js (6 matches)
- [ ] PerfilHistorico.js (6 matches)
- [ ] Outras telas...

### Components (com cores hardcoded)
- [ ] EventoShareCard.js (14 matches)
- [ ] CommunityCategorySection.js (11 matches)
- [ ] CommunityCategoryFilter.js (8 matches)
- [ ] StoryViewer.js (12 matches)
- [ ] TrendingCarousel.js (12 matches)
- [ ] RecommendationSection.js (10 matches)
- [ ] CulturalAISection.js (10 matches)
- [ ] Outros componentes...

### Total estimado
- **521 matches** de cores hexadecimais em 58 arquivos
- **1042 matches** de cores rgba em 80 arquivos
- **98 arquivos** importam de Colors.js

