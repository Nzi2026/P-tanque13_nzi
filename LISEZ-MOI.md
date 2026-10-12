# Pétanque 13 : application installable (PWA) + Android / iOS

## Contenu du dossier
| Fichier | Rôle |
|---|---|
| `index.html` | Le jeu (votre fichier d'origine + balises PWA + bouton « Installer ») |
| `manifest.json` | Nom, couleurs et icônes de l'appli sur l'écran d'accueil |
| `sw.js` | Service Worker : chargement instantané et jeu **sans connexion** |
| `icons/` | Icônes 192, 512, maskable 512, iOS 180, favicon, et 1024 px pour les stores |
| `capacitor.config.json`, `package.json`, `scripts/` | Pour fabriquer les applications Play Store / App Store |

## 1. Mettre en ligne sur GitHub Pages (gratuit)
1. Créez un dépôt GitHub public et envoyez-y **tout le contenu de ce dossier** (`index.html` à la racine du dépôt).
2. Dépôt → **Settings → Pages** → *Deploy from a branch* → branche `main`, dossier `/ (root)` → **Save**.
3. Après une ou deux minutes, le jeu est disponible sur `https://VOTRE-NOM.github.io/NOM-DU-DEPOT/`.

Le Service Worker exige **HTTPS** (GitHub Pages le fournit) ou `localhost`. Pour tester chez vous : `npx serve .` puis ouvrez `http://localhost:3000`.

## 2. Installer le jeu sur un téléphone
- **Android (Chrome)** : ouvrez le lien, puis touchez **Installer l'application** dans le menu du jeu (ou menu ⋮ → *Installer l'application*).
- **iPhone (Safari uniquement)** : touchez **Partager** → **Sur l'écran d'accueil**. Apple ne permet pas de bouton automatique ; le jeu affiche l'indication.
- **PC (Chrome / Edge)** : icône d'installation dans la barre d'adresse.

Pour vérifier le mode hors ligne : ouvrez le jeu une fois en ligne, passez en mode avion, relancez-le.

## 3. Publier sur Play Store et App Store

### Option A : Capacitor (recommandée : les fichiers sont embarqués dans l'appli)
```
npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm run build:www
npx cap add android
npx cap add ios
npm run sync
npx cap open android   # Android Studio → Build → Generate Signed Bundle (.aab)
npx cap open ios       # Xcode (Mac) → Product → Archive
```
Changez l'identifiant `com.votrenom.petanque13` dans `capacitor.config.json` **avant** `cap add`, il ne pourra plus être modifié une fois l'appli publiée. L'icône à fournir aux stores est `icons/icon-1024-store.png` (Apple n'accepte pas de transparence : elle n'en a pas).

### Option B : PWABuilder (sans code)
Sur pwabuilder.com, entrez l'adresse GitHub Pages du jeu : il génère un paquet Android (.aab) et un projet Xcode.

Comptes nécessaires : Google Play Console (paiement unique) et Apple Developer (abonnement annuel). Vérifiez les tarifs en vigueur sur leurs sites.

## 4. Mettre à jour le jeu
Modifiez `index.html`, puis **changez `CACHE_VERSION` dans `sw.js`** (`'v1'` → `'v2'`). Sans cela, les joueurs peuvent garder l'ancienne version en cache. La nouvelle version s'active au lancement suivant.

## 5. Publicités
Le bloc `ADS` en haut du script du jeu est inchangé (voir l'ancien mode d'emploi : AdSense pour le web, AdMob via `window.NativeAds` pour Android/iOS). Le Service Worker ne met jamais les publicités en cache.
- AdSense ne doit pas être utilisé dans les applications des stores : utilisez AdMob.
- Dans l'appli native, le Service Worker est désactivé automatiquement (les fichiers sont déjà dans l'appli).

## Limites à connaître
- **Polices** : « Alfa Slab One » et « Barlow Semi Condensed » viennent de Google Fonts. Elles sont mises en cache après la première visite en ligne. Si l'appli est lancée hors ligne dès la toute première fois, des polices de secours (Georgia, Arial Narrow) s'affichent. Pour un rendu identique partout, téléchargez les deux polices (fichiers .woff2) dans un dossier `fonts/`, déclarez-les avec `@font-face` dans `index.html`, et ajoutez-les à `CORE_ASSETS` dans `sw.js`.
- **App Store** : Apple peut refuser une appli jugée trop proche d'un simple site web. Un jeu complet embarqué avec Capacitor (option A) passe généralement mieux qu'un simple emballage de lien.
- Je n'ai pas pu tester le rendu sur un vrai téléphone ni dans un navigateur. J'ai vérifié la syntaxe, les fichiers référencés, et simulé le comportement hors ligne du Service Worker. Testez d'abord sur votre téléphone avant de soumettre aux stores.
