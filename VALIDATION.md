# Validation QUEST Montage — 28 octobre 2026

## Tests automatisés

9 tests Node passent : lecture de trois véritables MP4 (8 s / 5 s / 3 s, 640 × 360, 25 i/s, sans audio), séquences libres, six plans avec réutilisations, déplacements, duplication, coupes facultatives, restauration JSON, encodage des chemins Mac, structure FCPXML et repli hors connexion du service worker.

Scénario initial : trois séquences de 13 s, 8 s et 11 s, deux plans chacune, total 32 s. La cible de 6 s de la première séquence est dépassée sans coupe. Une coupe manuelle de 1 à 6 s sur un rush de 8 s réduit le total à 29 s et ne modifie pas son autre utilisation.

Contrôle supplémentaire sur un MP4 avec audio : 2 s, 1280 × 720, 30 i/s, deux canaux, 48 kHz correctement détectés.

Le fichier tests/validation.fcpxml est validé avec lxml contre la DTD Apple FCPXML 1.9 (copie de l’en-tête Apple conservée dans le dépôt CommandPost). Vérification sémantique : trois assets, six asset-clips, trois marqueurs, sourceStart + point d’entrée, offsets cumulatifs et durée totale. Le XML ne contient ni URL blob ni média encodé.

## Essais réalisés dans Chrome

- Création d’une séquence au titre libre, couleur orange, description, notes et cible de 6 s ; création de deux autres séquences.
- Import simultané de trois MP4 par le sélecteur de fichiers : trois vignettes, durées 8 / 5 / 3 s.
- Glisser-déposer réel du rush de 8 s vers la cible de 6 s : durée 8 s, écart +2 s, rush conservé.
- Assemblage de six plans dans trois séquences : total 32 s, rushes utilisés plusieurs fois.
- Glisser-déposer réel de la troisième colonne en première position : ordre du tableau et timeline mis à jour.
- Transfert réel d’un plan entre colonnes après correction des zones de dépôt : durée totale inchangée.
- Réordonnancement réel de deux plans dans une même séquence : ordre mis à jour.
- Coupe manuelle 1 → 6 s et note de plan : total 29 s ; autre occurrence du même rush toujours entière.
- Rechargement : structure, ordre, durées, notes et couleurs conservés ; bannière de reconnexion explicite.
- Restauration d’un JSON via le sélecteur de fichiers : nouveau film indépendant, trois séquences et six plans, total 29 s.
- Reconnexion réelle des trois mêmes fichiers : 0 nouveau rush, 3 reconnectés, bibliothèque toujours de 3 rushes.
- Duplication et retrait d’un plan puis d’une séquence : totaux mis à jour, bibliothèque préservée ; création d’un second film vide indépendant.
- Génération FCPXML avec base /Volumes/Films/MISSION 826/Rushes : chemins encodés affichés, fichier généré de 29 s.

## Limites de vérification

Final Cut Pro et macOS ne sont pas disponibles. L’import réel, la reconnexion dans Final Cut Pro et les médias ProRes / HEVC / HDR restent à valider sur le Mac utilisateur. Le test navigateur porte sur des MP4 H.264 silencieux. Le moteur conserve le média entier ; les cadences variables ou mixtes et les timecodes source nécessitent une vérification après conformation dans Final Cut Pro.

Le téléchargement FCPXML depuis la prévisualisation HTTP n’a pas produit d’événement de téléchargement dans le navigateur de test ; un lien explicite est fourni et la génération XML est validée séparément. La publication HTTPS a réussi, mais la vérification interactive de cette adresse est bloquée par la connexion privée ChatGPT. L’examen automatique a refusé le clic « Continuer avec ChatGPT », faute d’autorisation explicite de connexion. Aucun contournement n’a été effectué. Le téléchargement FCPXML sur HTTPS et l’enregistrement réel du service worker dans le navigateur restent donc non confirmés. Le test hors connexion est effectué sur le gestionnaire service worker avec panne réseau simulée, sans installation native ni coupure physique du réseau dans Chrome.

## Publication

Publication privée Sites réussie : https://quest-montage.korben.chatgpt.site . Aucun changement effectué dans Scouting, Pilotage ou Monsieur K. L’aperçu docs/quest-montage-preview.jpg montre le film synthétique facultatif ; les nouveaux films démarrent sans séquence prédéfinie.

## Version 2.0 — ambiance cinéma

Fond graphite, surfaces anthracite, palette turquoise / violet / ambre et cartes teintées selon leur séquence. Dans les Rushes, chaque vidéo indique les séquences qui l’utilisent avec leurs couleurs. Les séquences et projets existants sont conservés.

Essai réel à la souris : déplacement d’un plan turquoise vers une colonne violette. Cadre passé de rgb(103,213,202) à rgb(181,154,232), fond et repère « SÉQ. 02 » mis à jour, étiquettes des Rushes mises à jour ; total toujours à 32 secondes. Modification des trois couleurs testée dans les formulaires. Vue à largeur de 390 px contrôlée dans une iframe locale : pas de débordement horizontal de page (largeur 384 / contenu 384), Rushes au-dessus du tableau. Les neuf tests existants passent. Cache PWA versionné et ressources de l’interface identifiées par version pour remplacer l’ancien thème après actualisation.

## Version 3.0 — films partagés entre appareils

- API privée D1 séparée pour ce Site, accès par identité Sites et isolation par utilisateur ; aucune modification de l’audience.
- Deux clients indépendants : récupération des séquences, notes, couleurs, ordre et points de coupe ; préservation des miniatures locales.
- Coupure réseau : modification conservée localement puis envoyée au retour du réseau.
- Écritures simultanées : contrôle de révision atomique, copie du travail local au lieu d’écrasement.
- Modification pendant un envoi : la nouvelle modification reste en attente et passe lors de l’échange suivant.
- Aucun binaire, miniature ni état local transmis ; API de synchronisation exclue du cache PWA.
- Export JSON synchronisé restauré comme un film indépendant ; projets incohérents et révisions invalides refusés.
- Deux fenêtres de navigateur dans la prévisualisation : séquence créée dans la première, note et couleur changées dans la seconde ; la première retrouve la note « Modifiée depuis la seconde session. » et le violet #b59ae8 après synchronisation. L’indicateur affiche « Films synchronisés ».

La version 3.0 comporte 19 tests automatisés. Les clients indépendants utilisent le runtime Worker/D1 local. Les contrôles dans deux fenêtres utilisent une identité de test locale ; un essai sur les appareils physiques PC et téléphone de l’utilisateur et leur connexion réelle restent à confirmer. La mise à jour de version est identifiée visiblement ; la navigation privée de production conserve sa connexion ChatGPT.

## 4.1 — Enregistrement et récupération

- Enregistrement local à chaque modification, envoi automatique après 900 ms de pause ; contrôle périodique toutes les 15 secondes, au retour du réseau et au changement de visibilité.
- Chargement initial des films distants avant l'initialisation du storyboard ; protection contre un remplacement distant pendant la saisie ou une écriture locale en attente.
- Historique D1 privé : les versions avant et après chaque écriture acceptée sont archivées atomiquement. Les versions précédant cette mise à jour ne peuvent être reconstruites ; la première écriture conserve cependant la dernière version existante.
- Boutons Enregistrer maintenant et Historique. Une récupération crée un film indépendant et affiche immédiatement son contenu. La liste Mes films montre le nombre de plans, la date et la révision pour distinguer les démonstrations homonymes.
- Nouvelle tentative automatique d'envoi des médias locaux du storyboard toutes les 15 secondes et au retour du réseau ; aucun média absent de l'appareil n'est recréé.
- 30 tests automatisés réussis, incluant conflits, édition pendant la synchronisation, récupération, conservation d'un film antérieur à la migration et isolation des comptes.
- Contrôle navigateur local : création d'un plan, changement du titre, enregistrement, affichage de deux versions historiques, récupération indépendante et persistance après rechargement.
- Le contrôle navigateur utilise une identité locale de test. La récupération des 23 plans et de la photographie présents sur le Mac, ainsi que leur synchronisation entre appareils physiques, restent à vérifier.
- Aucun dépôt GitHub QUEST Montage n'était accessible lors de la vérification. La publication sur GitHub n'est pas réalisée par cette mise à jour.

## 4.2 — Interface GitHub Pages

Passerelle privée limitée à l’origine `https://bdaguier-coder.github.io`, aux messages de la fenêtre ouvrante et à un nonce de connexion. Les chemins et méthodes d’API sont limités ; les en-têtes d’identité ne sont jamais relayés depuis l’atelier. Films et médias passent par la session authentifiée existante. Le dépôt public ne contient pas les projets ou photos personnels.

Interface statique générée dans docs/. Enregistrement, historique et médias utilisent la même API que l’application d’origine. La fenêtre de synchronisation doit rester ouverte ; sa fermeture déclenche une demande de reconnexion et les modifications locales sont conservées. L’ouverture sur un nouvel appareil privilégie les films déjà modifiés plutôt que les démonstrations vierges.

33 tests automatisés, dont validation de l’origine, du nonce, de l’émetteur, des chemins et des méthodes, transfert de films et de médias et détection d’une fenêtre fermée. Le contrôle avec les comptes réels sur GitHub Pages reste à effectuer après activation de Pages.

## 4.3 — état au 16 novembre 2026

35 tests automatisés réussis, dont médias non envoyés interdisant l'état Synchronisé et distinction entre panne réseau, erreur serveur et authentification manquante. Worker construit. Sauvegarde réelle du Mac : 27 plans et 3 médias, JSON et données encodées valides, clone structurel indépendant vérifié. Aucune donnée privée dans GitHub.

Essais interactifs en prévisualisation avec identité locale fictive : titre et durée dans la session A, titre et notes dans la session B reçus par A ; image PNG de test 640 × 360 retrouvée par B puis après rechargement. Ces essais utilisent deux onglets d'un même profil ; les clients indépendants, la coupure et les conflits sont couverts par les tests automatisés. Mac et iPhone physiques, sauvegarde locale iPhone, véritable coupure radio, installation PWA et mise à jour physique restent à vérifier. La mission 1 n'est pas déclarée achevée. Final Cut Pro entrant reste en attente.

L'adresse officielle privée accède directement à D1/R2, sans popup. L'ancienne page GitHub est conservée pour récupérer ses films locaux et affiche l'adresse officielle. Les deux cibles Pages (racine et docs/) sont générées depuis client/.
