# 🎨 GlobalStyles - Guia de Uso

## 📋 Visão Geral

Todos os estilos da aplicação foram consolidados em um **único arquivo**: `GlobalStyles.js`

Isso facilita:
- ✅ Manutenção centralizada
- ✅ Consistência visual em toda a app
- ✅ Reutilização de componentes
- ✅ Mudanças globais de tema rápidas

---

## 🚀 Como Usar

### Importar em qualquer tela/componente:

```javascript
import GlobalStyles from "../styles/GlobalStyles";

const styles = GlobalStyles;
```

### Usar nos componentes:

```javascript
<View style={styles.profileContainer}>
  <Text style={styles.profileName}>Meu Perfil</Text>
</View>
```

---

## 📚 Estilos Disponíveis

### 🔐 Autenticação
- `authContainer` - Container do login/cadastro
- `authTitle` - Título da página
- `authLabel` - Label do campo
- `authInput` - Campo de entrada
- `authButton` - Botão de envio
- `authError` - Mensagem de erro
- `authLink` - Links (esqueci senha, etc)

### 👤 Perfil
- `profileContainer` - Container principal
- `profileHeader` - Header com avatar
- `profileAvatar` - Avatar do usuário
- `profileName` - Nome do usuário
- `profileEmail` - Email
- `profileLink` - Links
- `profileMenu` - Menu de opções
- `profileMenuItem` - Item do menu
- `profileMenuText` - Texto do menu

### 🚪 Logout
- `logoutButton` - Botão logout
- `logoutButtonLoading` - Estilo durante carregamento
- `logoutText` - Texto do botão

### 🔍 Busca
- `searchContainer` - Container da busca
- `searchInput` - Input da busca
- `sectionTitle` - Título de seção

### 🧩 Cards e Grid
- `grid` - Grid layout
- `cardCategory` - Card de categoria
- `cardCategoryActive` - Card ativo
- `cardCategoryText` - Texto do card
- `cardCategoryTextActive` - Texto ativo

### 📍 Locais/Eventos
- `localCard` - Card de local
- `localImage` - Imagem
- `localTitle` - Título
- `localRating` - Rating
- `localDescription` - Descrição
- `eventCard` - Card de evento
- `eventImage` - Imagem do evento
- `eventContent` - Conteúdo
- `eventTitle` - Título do evento
- `eventInfoRow` - Linha de info
- `eventInfoText` - Texto de info

### 📋 Feed
- `feedContainer` - Container do feed
- `feedCard` - Card do feed
- `feedCardContent` - Conteúdo
- `feedCardTitle` - Título
- `feedCardDescription` - Descrição

### 👨‍💼 Admin
- `admContainer` - Container admin
- `admHeaderMenu` - Header do menu
- `admAvatar` - Avatar
- `admName` - Nome
- `admSubtitle` - Subtítulo
- `admMenuOptions` - Opções do menu
- `admMenuItem` - Item do menu
- `admMenuIcon` - Ícone
- `admMenuText` - Texto

### 🎯 Drawer
- `drawerHeader` - Header do drawer
- `drawerAvatar` - Avatar
- `drawerUser` - Usuário
- `drawerLegend` - Legenda
- `drawerFooter` - Footer
- `drawerFooterText` - Texto footer

### 📝 Formulários
- `formContainer` - Container
- `formInput` - Input
- `formButton` - Botão
- `formButtonText` - Texto botão
- `formLabel` - Label

### 🎨 Utilidades
- `container` - Container genérico
- `centerContent` - Conteúdo centralizado
- `row` - Linha (flexDirection)
- `text` - Texto genérico
- `icon` - Ícone genérico
- `button` - Botão genérico
- `buttonText` - Texto botão
- `link` - Link
- `error` - Erro
- `badge` - Badge
- `badgeText` - Texto badge
- `emptyState` - Estado vazio
- `divider` - Divisor
- `loadingSpinner` - Loading spinner

---

## 🎯 Exemplo Prático

### Antes (múltiplos arquivos):
```javascript
// screens/TelaPerfil.js
import styles from "../styles/Styles_Perfil";

// components/SearchBar.js
import styles from "../styles/Styles_Busca";

// screens/ResetPassword.js
import styles from "../styles/Styles_Authenticate";
```

### Depois (arquivo único):
```javascript
// Qualquer arquivo
import GlobalStyles from "../styles/GlobalStyles";
const styles = GlobalStyles;
```

---

## 🔄 Migração de Arquivos Antigos

Se ainda houver arquivo antigo usando `Styles_XYZ`, basta:

1. Remover import antigo: `import styles from "../styles/Styles_XYZ"`
2. Adicionar novo: `import GlobalStyles from "../styles/GlobalStyles"`
3. Adicionar: `const styles = GlobalStyles`
4. Usar: `styles.nomeDoEstilo`

---

## 🎨 Customização

Para adicionar novo estilo ou modificar cores:

1. Abrir `GlobalStyles.js`
2. Adicionar/modificar em `GlobalStyles.create({})`
3. Usar em qualquer lugar sem adicionar import novo

---

## 📊 Arquivos Atualizados

✅ TelaPerfil.js
✅ SearchBar.js
✅ CategoryCard.js
✅ LocalCard.js
✅ TelaBusca.js
✅ ResetPassword.js
✅ PerfilHistorico.js
✅ AdmMenu.js

---

## 🚀 Benefícios

1. **Manutenção**: Todos os estilos em um único lugar
2. **Consistência**: Design system unificado
3. **Performance**: Menos imports e processamento
4. **Tema**: Fácil mudar tema global
5. **Reutilização**: Componentes podem usar qualquer estilo

---

**Status**: ✅ Implementado em 100%
