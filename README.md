# Klar

Application React/Vite de planification de repas et de liste de courses.

## Développement local

```bash
npm install
npm run dev
```

## Build de production

```bash
npm run build
```

Le build est généré dans `dist/`.

## Déploiement Vercel

1. Envoyer tous les fichiers de ce dossier à la racine du dépôt GitHub.
2. Importer le dépôt dans Vercel.
3. Framework Preset : Vite.
4. Build Command : `npm run build`.
5. Output Directory : `dist`.

`src/App.jsx` contient l'application principale. `src/main.jsx` est le point d'entrée React.
