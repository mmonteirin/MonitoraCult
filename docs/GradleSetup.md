# Snippets para configuração Android (Gradle)

Edite os arquivos abaixo conforme os trechos.

1) `android/build.gradle` (project-level)

Adicione em `buildscript.dependencies`:

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath('com.android.tools.build:gradle:7.4.2')
        classpath('com.google.gms:google-services:4.3.15') // adicione esta linha
    }
}
```

2) `android/app/build.gradle` (app-level)

No final do arquivo, aplique o plugin do Google Services:

```gradle
apply plugin: 'com.google.gms.google-services'
```

3) `AndroidManifest.xml`

Se você usar notificações locais, verifique permissões e serviços necessários. Normalmente não é necessário mexer aqui apenas para FCM.

4) Observações

- Verifique a versão do `gradle` e do plugin Android compatíveis com sua base.
- Após editar, rode `./gradlew clean` e reconstrua.
