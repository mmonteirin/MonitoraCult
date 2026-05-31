# MonitoraCult

Mobile/web application developed with Expo and React Native for the discovery, promotion, and management of cultural experiences. The project brings together authentication, user profiles, a social feed, a community hub, events, a live map, ticketing, and an administrative area into a single, cohesive experience.

## Overview

MonitoraCult connects users, cultural creators, and administrators through:

* **Authentication:** Login, registration, password recovery, and session persistence using Firebase Auth.
* **Navigation:** Main navigation featuring a drawer, bottom tabs, and domain-specific stacks.
* **Social Feed:** Posts, likes, comments, stories, and direct messaging.
* **Community:** Groups, forums, news, and featured creators.
* **Cultural Events:** Details, ratings, metrics, maps, and check-in functionality.
* **Ticketing System:** Selection, shopping cart, history, and validation.
* **Admin Area:** Event creation and performance tracking.
* **Cross-platform:** Support for Android, iOS, and Web via Expo.

## Technologies

* **Expo:** ~54.0.0
* **React:** 19.1.0
* **React Native:** 0.81.5
* **Navigation:** React Navigation 7
* **Backend:** Firebase Auth & Firestore
* **Storage:** AsyncStorage for local caching
* **Expo Modules:** Location, Image Picker, Font, Blur, Haptics, and File System
* **UI/Animation:** React Native Paper, Reanimated, Moti, and SVG
* **Forms:** React Hook Form and Yup

## Requirements

Before running the project, install:

* Node.js (compatible with Expo 54)
* npm
* Expo CLI (optionally via `npx expo`)
* Android Studio, Xcode, or Expo Go (depending on the testing platform)

## Installation

Clone the project and install dependencies:
`npm install`

## Execution

Use the scripts defined in `package.json`:

* `npm start`: Opens the Expo server to choose the platform.
* `npm run android`: Runs on Android.
* `npm run ios`: Runs on iOS.
* `npm run web`: Runs the web version.

## Firebase Configuration

The primary configuration is located in `firebaseConfig.js`. The file automatically reads public Expo variables and includes fallback values for development:

`EXPO_PUBLIC_FIREBASE_API_KEY=`
`EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=`
`EXPO_PUBLIC_FIREBASE_PROJECT_ID=`
`EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=`
`EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=`
`EXPO_PUBLIC_FIREBASE_APP_ID=`

> **Note:** It is recommended to move credentials to a local `.env` file and keep Firestore rules configured in the Firebase console. Examples of rules can be found in `documentation/FIRESTORE_SECURITY_RULES.txt` and `documentation/COMMUNITY_FIRESTORE_RULES.txt`. Note that Firebase Storage was intentionally removed for compatibility with the Spark plan; image uploads should use the flow in `services/uploadService.js`.

## Folder Structure

```text
.
├── App.js                    # Visual app entry, providers, and navigation
├── index.js                  # Expo/React Native app registration
├── app.json                  # Expo configuration
├── firebaseConfig.js         # Firebase initialization
├── assets/                   # Icons, images, and Poppins fonts
├── components/               # Reusable components
├── constants/                # App constants
├── context/                  # Global contexts (Auth, User data, etc.)
├── documentation/            # Technical guides and integration rules
├── hooks/                    # Domain hooks and service integration
├── navigation/               # Navigators, stacks, drawer, and tabs
├── screens/                  # Application screens
├── services/                 # Data services and business logic
├── styles/                   # Global colors and styles
└── utils/                    # Utility functions

```

## Main Modules

### Authentication

Flow is controlled by `context/AuthContext.js`, `navigation/AppNavigator.js`, and `navigation/AuthNavigator.js`. The app automatically switches between authenticated and non-authenticated routes based on the current Firebase user.

### Navigation

The app utilizes a hierarchical structure:

* `AppNavigator.js` switches between Auth and the Main App.
* `MainNavigator.js` encapsulates the drawer.
* `DrawerNavigator.js` and `TabNavigator.js` handle global navigation.
* Specific stacks include: `HomeStack`, `FeedStack`, `EventoStack`, `ComunidadeStack`, `PerfilStack`, `BuscaStack`, `MapaStack`, and `AdmStack`.

### Social Feed

Combines screens, hooks, and services for posts, likes, comments, followers, stories, and messages:

* `screens/TelaFeed.js`, `screens/CriarPost.js`
* `hooks/useLike.js`, `hooks/useComments.js`, `hooks/useStories.js`, `hooks/useDirectMessages.js`
* `services/feedService.js`, `services/postService.js`, `services/commentService.js`, `services/storiesService.js`, `services/dmService.js`

### Community

Includes cultural groups, forums, creators, and news:

* `screens/TelaComunidade.js` (and detail screens)
* `hooks/useCommunity.js`
* `services/communityService.js`

### Events and Ticketing

Centralizes registration, details, ratings, tickets, and metrics:

* `screens/EventoHome.js`, `screens/EventoDetalhes.js`, `screens/EventoIngresso.js`, `screens/TelaIngressos.js`, `screens/AdmCadastroEvento.js`, `screens/AdmEventoMetrica.js`
* `hooks/useEventos.js`, `hooks/useIngressos.js`
* `services/eventosAppService.js`, `services/ingressoService.js`

### Live Map

Features location tracking, a cultural map, nearby events, and check-in:

* `screens/TelaMapaVivo.js`, `screens/MapaVivoCheckIn.js`
* `MapComponents.native.js` / `MapComponents.web.js`
* `hooks/useMap.js`, `hooks/useMapaVivo.js`
* `services/locationService.js`, `services/mapService.js`, `services/mapaVivoService.js`

## Design System

Uses the **Poppins** font family, loaded in `App.js` via `expo-font`. Global colors, tokens, and styles are located in the `styles/` folder.

## Supplementary Documentation

Found in the `documentation/` folder:

* Social system and integration guides
* Stories and DM documentation
* Community and Ticketing system guides
* RAM optimization and style consolidation guides

## Development Best Practices

* Configure `EXPO_PUBLIC_FIREBASE_*` variables locally before publishing builds.
* Review Firestore rules before working with live production data.
* Test both authenticated and unauthenticated flows when modifying navigation.
* Validate across Android, iOS, and Web when updating maps, images, permissions, or platform-specific components.
* Consult the `documentation/` folder before altering major modules.

## Status

Private project in version 1.0.1, structured as an Expo/React Native application.
