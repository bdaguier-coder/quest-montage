# QUEST Montage — 4.3.1

Studio de storyboard et de prémontage : plans, pistes narratives, bible visuelle, photos, prompts, historique, sauvegarde complète, PDF et export Final Cut Pro.

## Adresse officielle Mac et iPhone

Ouvrir **https://quest-montage.korben.chatgpt.site/** avec le même compte ChatGPT sur les deux appareils. Cette adresse accède directement au stockage privé ; aucune fenêtre de synchronisation supplémentaire n'est nécessaire.

L'adresse GitHub Pages https://bdaguier-coder.github.io/quest-montage/ reste accessible pour récupérer les films qui n'existeraient que dans son stockage local. Une bannière indique l'adresse officielle. Avant de changer d'adresse, exporter la **Sauvegarde complète** de chaque film modifié uniquement sur GitHub puis la réimporter dans l'atelier officiel. L'import crée un film indépendant ; il ne fusionne ni ne remplace silencieusement les films existants. La passerelle de compatibilité GitHub nécessite encore sa fenêtre de connexion ; ce n'est pas le fonctionnement de l'adresse officielle.

La 4.3.1 corrige l’ouverture sur un ancien brouillon vide : un film existant contenant du travail est privilégié, et un brouillon vide reçu du serveur ne bloque plus cette récupération. Les brouillons sont conservés. Si aucun film avec du contenu n’est retrouvé, l’interface l’indique clairement.

## Données et sauvegardes

Les films et leur historique sont conservés dans D1, les médias du storyboard dans R2, avec accès par identité Sites et isolation des comptes. Le dépôt public contient uniquement le code, la documentation et les médias synthétiques de démonstration. Aucun projet, photographie personnelle ou secret ne doit y entrer.

Les modifications sont enregistrées localement puis envoyées après une pause de 900 ms. La vérification distante s'effectue toutes les 15 secondes lorsque l'atelier est visible, au retour du réseau et lors des changements de visibilité. Les fichiers locaux du storyboard non envoyés sont retentés automatiquement. Le statut « Synchronisé » n'est affiché que si les films et leurs références de médias ne sont plus en attente. Les erreurs serveur et l'authentification manquante sont distinguées.

Les conflits créent une copie locale indépendante. Les versions acceptées sont archivées ; une restauration crée un autre film. Aucun cache de projets ou média local n'est effacé pour changer de version. Le service worker renouvelle seulement le cache des fichiers de l'interface. Une nouvelle version détectée propose d'actualiser l'atelier après sauvegarde locale.

Les médias du storyboard peuvent être conservés sur l'appareil après téléchargement. Les vidéos originales de l'espace Montage restent locales et doivent être reconnectées sur chaque appareil ; leurs miniatures ne sont actuellement pas partagées. Les navigateurs et systèmes mobiles peuvent suspendre une application fermée : la reprise intervient à sa réouverture ou au retour du réseau, sans fenêtre auxiliaire.

## Développement

- `npm ci`
- `npm run build` : construit le Worker et les ressources de l'application privée.
- `npm test` : vérifie les conflits, la reprise réseau, l'historique, les médias, l'isolation des comptes, le storyboard et FCPXML.
- `npm run build:pages` : copie l'interface à la racine et dans `docs/`, compatibles avec les deux réglages GitHub Pages.
- `npm run dev` : prévisualisation isolée avec identité de test et stockage local distinct de la production.

`client/` contient l'interface ; `server/worker.mjs` les API ; `db/` et `drizzle/` les schémas et migrations. `.openai/hosting.json` conserve l'identité et les liaisons du service existant. Ne pas modifier les migrations déjà appliquées.

## État de la mission 5.0

La 4.3 est une étape de sécurisation de la synchronisation. La validation sur les deux appareils physiques reste à effectuer ; la mission n'est pas déclarée terminée. Voir `MISSION-5-STATUS.md` et `VALIDATION.md`.

L'export FCPXML 1.9 existe déjà. L'intégration entrante Final Cut Pro (ordre, durées et vraies vignettes) n'est pas encore développée ; elle attend la validation de la mission 1.
