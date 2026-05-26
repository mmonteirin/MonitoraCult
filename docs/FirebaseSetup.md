# Configuração do Firebase Messaging (FCM)

Siga estes passos para configurar FCM no Android e iOS.

1) Dependências

Instale as bibliotecas:

```bash
yarn add @react-native-firebase/app @react-native-firebase/messaging @react-native-async-storage/async-storage
# ou
npm install @react-native-firebase/app @react-native-firebase/messaging @react-native-async-storage/async-storage
```

2) Android

- Coloque `google-services.json` em `android/app/`.
- No `android/build.gradle` (project), adicione no `buildscript`:

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15' // verifique a versão mais recente
  }
}
```

- No `android/app/build.gradle`, adicione no final:

```gradle
apply plugin: 'com.google.gms.google-services'
```

- Certifique-se de que `minSdkVersion` e outras configs atendem aos requisitos do Firebase.

3) iOS

- Coloque `GoogleService-Info.plist` em `ios/` e arraste para o Xcode project.
- No `ios/Podfile` execute:

```bash
cd ios && pod install
```

4) Background handler

No entrypoint do app (`index.js`), registre o background handler:

```javascript
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Aqui você pode persistir a notificação e/ou notificar o usuário localmente
  console.log('Message handled in the background!', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
```

5) Testar

- Rode no dispositivo físico (Android: dispositivo com Google Play Services). Envie mensagem pelo Firebase Console → Cloud Messaging.

6) Observações

- Para usar push em produção, gere credenciais APNs para iOS e configure o servidor para usar o token do dispositivo.
- Se não tiver backend pronto, a aplicação irá armazenar tokens localmente (mock) em `@registered_device_tokens`.
