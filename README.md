# QUEST Montage — 4.2

Studio de storyboard cinématographique et de prémontage : plans, pistes narratives, bible visuelle, photos, prompts Grok, historique, sauvegarde complète, PDF et export Final Cut Pro.

## Adresse GitHub

L’interface est prête pour GitHub Pages à l’adresse https://bdaguier-coder.github.io/quest-montage/.

GitHub Pages accepte désormais les deux réglages **main → /(root)** et **main → /docs**. La racine et `docs/` contiennent la même interface et son service worker. Les changements publiés sur `main` sont ensuite pris en charge par GitHub Pages.

## Films et photos privés

Le dépôt contient le code et des médias synthétiques de démonstration. Les films personnels, sauvegardes et photographies ne sont pas inclus.

Les données existantes restent dans le stockage privé de l’application d’origine : https://quest-montage.korben.chatgpt.site. Depuis l’interface GitHub, cliquer sur **Connecter mes films**. Une fenêtre privée permet la connexion au même compte ChatGPT ; la garder ouverte pendant le travail. L’atelier GitHub effectue ses échanges par cette fenêtre avec une origine autorisée, un nonce par connexion, une vérification de l’émetteur et une liste stricte des API disponibles. Aucun mot de passe ni clé n’est enregistré dans le code GitHub.

Chaque modification est enregistrée localement ; l’envoi suit une pause de 900 ms. Les autres appareils sont vérifiés toutes les 15 secondes quand l’atelier est visible, ainsi qu’au retour du réseau et dans l’application. Les médias locaux non envoyés sont retentés automatiquement. Si la fenêtre privée est fermée, l’atelier conserve le travail localement et demande une reconnexion avant de reprendre les échanges.

L’historique archive les versions acceptées. Une récupération crée un film séparé. Les conflits conservent une copie de chaque travail au lieu de remplacer silencieusement une version. Les projets homonymes se distinguent par le nombre de plans, la date et la révision dans **Mes films**.

Les photos et vidéos importées dans le storyboard sont conservées en ligne et peuvent être incluses dans la sauvegarde complète. Les fichiers vidéo originaux de l’espace Montage restent locaux et se reconnectent sur chaque appareil.

## Développement

- `npm ci`
- `npm run build` : construit le Worker de l’application d’origine et ses ressources.
- `npm test` : vérifie le prémontage, FCPXML, le storyboard, le stockage, les conflits, l’historique et la passerelle privée.
- `npm run build:pages` : copie l’interface publique à la racine et dans `docs/` après toute modification de `client/`.
- `npm run dev` : prévisualisation locale avec une identité de test et un stockage distinct de la production.

`client/` contient l’interface ; `server/worker.mjs` les API ; `db/` et `drizzle/` le schéma et les migrations D1 ; R2 utilise la liaison `MEDIA`. Le manifeste `.openai/hosting.json` conserve l’identité de l’application existante. Aucune clé ou donnée d’authentification n’y figure.

Ne pas modifier les migrations déjà appliquées. Les migrations nouvelles sont générées avec `npm run db:generate`, vérifiées puis publiées avec le Worker.

## Final Cut Pro

Export FCPXML 1.9 ; les fichiers vidéo ne sont ni réencodés ni modifiés. Configurer les chemins Mac et, si nécessaire, utiliser « Relier les fichiers » dans Final Cut Pro. L’import sur un Mac physique reste à vérifier.
