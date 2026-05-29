# MonitoraCult

Aplicativo mobile/web desenvolvido com Expo e React Native para descoberta, divulgação e gestão de experiências culturais. O projeto reúne autenticação, perfis, feed social, comunidade, eventos, mapa vivo, ingressos e área administrativa em uma única experiência.

## Visão geral

O MonitoraCult conecta usuários, criadores culturais e administradores por meio de:

- Login, cadastro, recuperação de senha e persistência de sessão com Firebase Auth.
- Navegação principal com drawer, abas inferiores e stacks por domínio.
- Feed social com posts, curtidas, comentários, stories e mensagens diretas.
- Comunidade com grupos, fóruns, notícias e criadores em destaque.
- Eventos culturais com detalhes, avaliações, métricas, mapa e check-in.
- Sistema de ingressos com seleção, carrinho, histórico e validação.
- Área administrativa para cadastro e acompanhamento de eventos.
- Suporte a Android, iOS e web via Expo.

## Tecnologias

- Expo `~54.0.0`
- React `19.1.0`
- React Native `0.81.5`
- React Navigation `7`
- Firebase Auth e Firestore
- AsyncStorage para cache local
- Expo Location, Image Picker, Font, Blur, Haptics e File System
- React Native Paper, Reanimated, Moti e SVG
- React Hook Form e Yup

## Requisitos

Antes de executar o projeto, instale:

- Node.js em versão compatível com Expo 54
- npm
- Expo CLI, opcionalmente via `npx expo`
- Android Studio, Xcode ou Expo Go, conforme a plataforma de teste

## Instalação

Clone o projeto e instale as dependências:

```bash
npm install
```

## Execução

Use os scripts definidos no `package.json`:

```bash
npm start
```

Abre o servidor do Expo para escolher a plataforma.

```bash
npm run android
```

Executa no Android.

```bash
npm run ios
```

Executa no iOS.

```bash
npm run web
```

Executa a versão web.

## Configuração do Firebase

A configuração principal fica em `firebaseConfig.js`. O arquivo já lê variáveis públicas do Expo e possui valores de fallback para desenvolvimento:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

Recomenda-se mover as credenciais para um arquivo `.env` local e manter as regras do Firestore configuradas no console do Firebase. Há exemplos de regras em:

- `documentation/FIRESTORE_SECURITY_RULES.txt`
- `documentation/COMMUNITY_FIRESTORE_RULES.txt`

Observação: o projeto indica que o Firebase Storage foi removido intencionalmente para compatibilidade com o plano Spark, e uploads de imagem devem usar o fluxo de `services/uploadService.js`.

## Estrutura de pastas

```text
.
├── App.js                    # Entrada visual do app, providers e navegação
├── index.js                  # Registro da aplicação Expo/React Native
├── app.json                  # Configuração do Expo
├── firebaseConfig.js         # Inicialização do Firebase
├── assets/                   # Ícones, imagens e fontes Poppins
├── components/               # Componentes reutilizáveis
├── constants/                # Constantes do app
├── context/                  # Contextos globais, como autenticação e cadastro
├── documentation/            # Guias técnicos e regras de integração
├── hooks/                    # Hooks de domínio e integração com serviços
├── navigation/               # Navigators, stacks, drawer e tabs
├── screens/                  # Telas da aplicação
├── services/                 # Serviços de dados e regras de negócio
├── styles/                   # Cores e estilos globais
└── utils/                    # Funções utilitárias
```

## Módulos principais

### Autenticação

O fluxo de autenticação é controlado por `context/AuthContext.js`, `navigation/AppNavigator.js` e `navigation/AuthNavigator.js`. O app decide automaticamente entre rotas autenticadas e não autenticadas com base no usuário atual do Firebase.

### Navegação

A navegação principal usa:

- `navigation/AppNavigator.js` para alternar entre autenticação e app principal.
- `navigation/MainNavigator.js` para encapsular o drawer.
- `navigation/DrawerNavigator.js` e `navigation/TabNavigator.js` para navegação global.
- Stacks específicos como `HomeStack`, `FeedStack`, `EventoStack`, `ComunidadeStack`, `PerfilStack`, `BuscaStack`, `MapaStack` e `AdmStack`.

### Feed social

O feed social combina telas, hooks e serviços para posts, curtidas, comentários, seguidores, stories e mensagens:

- `screens/TelaFeed.js`
- `screens/CriarPost.js`
- `hooks/useLike.js`
- `hooks/useComments.js`
- `hooks/useStories.js`
- `hooks/useDirectMessages.js`
- `services/feedService.js`
- `services/postService.js`
- `services/commentService.js`
- `services/storiesService.js`
- `services/dmService.js`

### Comunidade

A área de comunidade inclui grupos culturais, fóruns, criadores e notícias:

- `screens/TelaComunidade.js`
- `screens/ComunidadeGrupoDetalhes.js`
- `screens/ComunidadeForumDetalhes.js`
- `screens/ComunidadeCriadorDetalhes.js`
- `screens/ComunidadeNoticiaDetalhes.js`
- `hooks/useCommunity.js`
- `services/communityService.js`

### Eventos e ingressos

O módulo de eventos centraliza cadastro, detalhes, avaliações, ingressos e métricas:

- `screens/EventoHome.js`
- `screens/EventoDetalhes.js`
- `screens/EventoIngresso.js`
- `screens/TelaIngressos.js`
- `screens/AdmCadastroEvento.js`
- `screens/AdmEventoMetrica.js`
- `hooks/useEventos.js`
- `hooks/useIngressos.js`
- `services/eventosAppService.js`
- `services/ingressoService.js`
- `services/ingressoServiceV2.js`

### Mapa vivo

O app possui recursos de localização, mapa cultural, eventos próximos e check-in:

- `screens/TelaMapaVivo.js`
- `screens/MapaVivoCheckIn.js`
- `screens/MapaVivoEventoDetalhes.js`
- `screens/MapComponents.native.js`
- `screens/MapComponents.web.js`
- `hooks/useMap.js`
- `hooks/useMapaVivo.js`
- `services/locationService.js`
- `services/mapService.js`
- `services/mapaVivoService.js`
- `services/mapaCulturalService.js`

## Design system

O projeto usa a família Poppins carregada em `App.js` via `expo-font`. Cores, tokens e estilos globais ficam em:

- `styles/Colors.js`
- `styles/GlobalStyles.js`
- `styles/README.md`

## Documentação complementar

A pasta `documentation/` contém guias mais detalhados para partes específicas do sistema:

- `documentation/SOCIAL_SYSTEM_GUIDE.md`
- `documentation/SOCIAL_FEED_INSTAGRAM_GUIDE.md`
- `documentation/STORIES_DM_DOCUMENTATION.md`
- `documentation/COMMUNITY_README.md`
- `documentation/COMMUNITY_INTEGRATION_GUIDE.md`
- `documentation/SYSTEM_INGRESSOS_GUIDE.md`
- `documentation/RAM_OPTIMIZATION_GUIDE.md`
- `documentation/COLORS_CONSOLIDATION.md`
- `documentation/STYLES_CONSOLIDATION.md`

## Boas práticas para desenvolvimento

- Configure as variáveis `EXPO_PUBLIC_FIREBASE_*` localmente antes de publicar builds.
- Revise as regras do Firestore antes de usar dados reais.
- Teste fluxos autenticados e não autenticados ao alterar navegação.
- Valide Android, iOS e web quando mexer em mapas, imagens, permissões ou componentes específicos de plataforma.
- Consulte a documentação em `documentation/` antes de alterar módulos maiores como social, comunidade ou ingressos.

## Scripts disponíveis

```bash
npm start
npm run android
npm run ios
npm run web
```

## Status

Projeto privado em versão `1.0.0`, estruturado como aplicação Expo/React Native.
