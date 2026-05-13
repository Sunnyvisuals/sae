<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b03d6a97-5ea6-4697-bd9e-bd7d20d01398

## Run Locally

**Prerequisites:** Node.js **22** (voir `engines` dans `package.json`).

1. Install dependencies :
   `npm install`
2. Run the app :
   `npm run dev`

## Deploy (Vercel + Git)

Le fichier [`vercel.json`](./vercel.json) reprend l’équivalent de [`netlify.toml`](./netlify.toml) (`dist`, install avec `--legacy-peer-deps`, redirections `/act3` → `/`, repli SPA vers `index.html`).

1. Pousser le dépôt sur GitHub/GitLab/Bitbucket.
2. Sur [vercel.com](https://vercel.com) → **Add New Project** → importer ce repo.
3. Laisser Vercel détecter **Vite** : les champs sont déjà forcés dans `vercel.json` (**Build** `npm run build`, **Output** `dist`).
4. Premier déploiement : après la connexion Git, chaque push sur la branche de production redeploie automatiquement.

Sans Git : `npm i -g vercel`, puis depuis la racine du projet  
`npm run build && npx vercel deploy --prod` (ou `npm run deploy:vercel` après `npm i -g vercel` pour que la commande `vercel` soit dans le PATH).