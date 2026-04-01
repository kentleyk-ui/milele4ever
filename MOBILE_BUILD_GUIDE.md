# Guide de Build Mobile - Milele

Ce guide explique comment construire les versions iOS et Android de Milele.

## Prerequis

### Pour Android
- [Android Studio](https://developer.android.com/studio) installe
- Java JDK 17+
- Compte Google Play Developer (25$ une fois) pour publier

### Pour iOS
- Mac avec macOS
- [Xcode](https://developer.apple.com/xcode/) installe (App Store)
- Compte Apple Developer (99$/an) pour publier

---

## Etape 1 : Cloner le projet

```bash
git clone https://github.com/kentleyk-ui/milele4ever.git
cd milele4ever
```

## Etape 2 : Installer les dependances

```bash
pnpm install
```

## Etape 3 : Ajouter les plateformes

### Android
```bash
npx cap add android
```

### iOS (Mac uniquement)
```bash
npx cap add ios
```

## Etape 4 : Configurer les variables d'environnement

Creez un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_supabase
GROQ_API_KEY=votre_cle_groq
```

## Etape 5 : Build et Sync

```bash
# Build Next.js + Sync avec Capacitor
pnpm mobile:build
```

## Etape 6 : Ouvrir dans l'IDE natif

### Android
```bash
pnpm cap:open:android
```
Android Studio s'ouvre. Cliquez sur "Run" pour tester sur emulateur/appareil.

### iOS
```bash
pnpm cap:open:ios
```
Xcode s'ouvre. Selectionnez un simulateur et cliquez sur "Run".

---

## Configuration des icones et splash screens

### Android
Les icones sont dans `android/app/src/main/res/`:
- `mipmap-mdpi/` - 48x48
- `mipmap-hdpi/` - 72x72
- `mipmap-xhdpi/` - 96x96
- `mipmap-xxhdpi/` - 144x144
- `mipmap-xxxhdpi/` - 192x192

### iOS
Les icones sont dans `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Vous pouvez utiliser un outil comme [App Icon Generator](https://www.appicon.co/) pour generer toutes les tailles.

---

## Publication sur les Stores

### Google Play Store

1. Dans Android Studio : Build > Generate Signed Bundle / APK
2. Creez une keystore (gardez-la en securite !)
3. Generez un AAB (Android App Bundle)
4. Uploadez sur [Google Play Console](https://play.google.com/console)

### Apple App Store

1. Dans Xcode : Product > Archive
2. Cliquez sur "Distribute App"
3. Suivez les etapes pour uploader sur App Store Connect
4. Soumettez pour review sur [App Store Connect](https://appstoreconnect.apple.com)

---

## Commandes utiles

| Commande | Description |
|----------|-------------|
| `pnpm mobile:build` | Build Next.js + sync Capacitor |
| `pnpm cap:sync` | Sync les fichiers web vers les apps natives |
| `pnpm cap:open:android` | Ouvre Android Studio |
| `pnpm cap:open:ios` | Ouvre Xcode |

---

## Depannage

### Erreur "capacitor.config.ts not found"
```bash
npx cap init Milele com.milele.app
```

### Erreur Android SDK
Assurez-vous que `ANDROID_HOME` est configure :
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### Erreur iOS "Code signing"
Dans Xcode, allez dans Signing & Capabilities et selectionnez votre Team.

---

## Support

Pour toute question, contactez l'equipe Milele.
