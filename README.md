# WebForge AI - Générateur de Sites Web par IA

WebForge AI est une plateforme SaaS Serverless permettant de générer, éditer et déployer des sites web grâce à l'intelligence artificielle. L'application repose entièrement sur l'écosystème **Supabase** pour le backend (Base de données, Authentification, Temps réel, Stockage), éliminant le besoin d'un serveur Node.js dédié.

## 🚀 Fonctionnalités

- **Authentification Complète** : Email/Mot de passe et OAuth (Google, GitHub, LinkedIn) via Supabase Auth.
- **Base de Données Sécurisée** : PostgreSQL avec Row Level Security (RLS) pour isoler les données utilisateurs.
- **Temps Réel** : Mises à jour instantanées du statut de génération des projets via Supabase Realtime.
- **Éditeur de Code** : Intégration de Monaco Editor (VS Code like) pour modifier les fichiers HTML/CSS/JS directement en base.
- **Wizard IA** : Formulaire multi-étapes pour la création de projets.
- **Architecture Static** : Frontend pur (HTML5, CSS3, ES6 Modules) hébergeable n'importe où.

## 🛠 Prérequis

- Un compte [Supabase](https://supabase.com) (Plan gratuit suffisant).
- Un serveur web local (VS Code Live Server, Python http.server, etc.) ou un hébergeur statique.

## 📦 Installation et Configuration

### 1. Configuration Supabase

1. Créez un nouveau projet sur [Supabase](https://supabase.com).
2. Allez dans l'onglet **SQL Editor**.
3. Ouvrez le fichier `schema.sql` fourni dans ce projet.
4. Copiez tout le contenu de `schema.sql` et exécutez-le dans l'éditeur SQL de Supabase.
   - *Cela créera les tables (profiles, projects, files, etc.), les triggers de sécurité et les politiques RLS.*

### 2. Configuration des Variables d'Environnement

1. Dans votre dashboard Supabase, allez dans **Project Settings > API**.
2. Copiez l'**URL** du projet et la clé **anon** (public).
3. Ouvrez le fichier `supabaseClient.js` à la racine du projet.
4. Remplacez les valeurs par défaut :

```javascript
const SUPABASE_URL = 'VOTRE_URL_SUPABASE_ICI'
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_ICI'
```

### 3. Configuration de l'Authentification

1. Allez dans **Authentication > Providers**.
2. Activez **Email**.
3. (Optionnel) Activez **Google**, **GitHub** ou **LinkedIn** en fournissant les Client ID/Secret.
4. Allez dans **Authentication > URL Configuration**.
5. Ajoutez l'URL de votre site (ex: `http://localhost:5500` ou `https://mon-site.vercel.app`) dans **Site URL**.
6. Ajoutez les URLs de redirection spécifiques dans **Redirect URLs** :
   - `http://localhost:5500/dashboard.html`
   - `http://localhost:5500/auth/callback` (si nécessaire)

### 4. Configuration du Stockage (Storage)

Le script SQL ne crée pas automatiquement les buckets de stockage pour des raisons de permissions.

1. Allez dans **Storage**.
2. Créez un nouveau bucket public nommé `avatars`.
3. Créez un nouveau bucket public nommé `project-assets`.
4. Ajoutez une politique (Policy) pour permettre l'upload aux utilisateurs authentifiés :
   - *SELECT, INSERT, UPDATE, DELETE* pour les utilisateurs authentifiés.

## 🖥️ Lancement Local

Puisque l'application utilise des modules ES6 (`type="module"`), vous ne pouvez pas ouvrir directement les fichiers HTML via le système de fichiers (`file://`). Vous devez utiliser un serveur HTTP local.

**Avec Python :**
```bash
python3 -m http.server 5500
```

**Avec VS Code :**
Installez l'extension "Live Server" et cliquez sur "Go Live".

Accédez ensuite à `http://localhost:5500`.

## 🚀 Déploiement

L'application étant statique, elle peut être déployée gratuitement sur :

- **Vercel** : Importez votre repo Git, aucune configuration de build n'est nécessaire.
- **Netlify** : Glissez-déposez le dossier du projet.
- **GitHub Pages** : Activez Pages dans les paramètres du repo.

**Important :** Après le déploiement, n'oubliez pas d'ajouter l'URL de production dans la configuration **Site URL** et **Redirect URLs** de votre projet Supabase.

## 📂 Structure du Projet

- `index.html` : Landing page publique.
- `dashboard.html` : Tableau de bord utilisateur (Privé).
- `editor.html` : IDE en ligne Monaco (Privé).
- `create-project.html` : Wizard de création (Privé).
- `auth-oauth.js` : Logique de connexion/inscription.
- `supabaseClient.js` : Initialisation du client Supabase.
- `schema.sql` : Structure de la base de données.
- `style.css` : Styles globaux.
- `script.js` : Scripts UI globaux.

## 🛡️ Sécurité

- **RLS (Row Level Security)** : Activé sur toutes les tables. Un utilisateur ne peut voir et modifier que ses propres données.
- **Client Side** : Les clés API exposées (`anon`) sont sécurisées par les politiques RLS côté serveur. Ne jamais exposer la clé `service_role` côté client.