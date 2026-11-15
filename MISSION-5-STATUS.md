# QUEST Montage 5.0 — point de reprise du 15 novembre 2026

Mission 1 non terminée. Mission 2 non commencée.

## Diagnostic vérifié

GitHub main au début de l'examen : 355224507d48382bd5677816479b38244ec5fe41.
Source privée récupérée séparément : ec77d0e4ce0954516f8070c04300a1ceec39e041.
L'interface GitHub dépend explicitement d'une popup vers l'origine privée. La fermeture de cette popup interrompt les échanges. Chaque origine conserve ses propres projets locaux.
Le stockage central existant utilise D1 (films et versions) et R2 (médias storyboard), avec contrôle d'identité et révision atomique.

## Corrections préparées, sans déploiement

- L'état synchronisé exige aussi que les médias du storyboard, de la bible et de la corbeille aient été envoyés.
- Une réponse serveur en échec est distinguée d'une panne réseau et d'une authentification manquante.
- Les médias distants peuvent être conservés dans IndexedDB sur l'origine privée, pas seulement depuis la passerelle GitHub.
- Les lectures de médias et leur envoi disposent de délais maximums ; la copie locale est conservée.

Ces modifications ne suppriment PAS la dépendance à la popup GitHub. Elles sont une préparation partielle et ne constituent pas une version 5.0 fonctionnelle.

## Vérification

35 tests Node réussis, dont 2 nouveaux tests sur les médias en attente et les états d'erreur. Tests D1/R2 exécutés en environnement local Miniflare, avec identités de test. Construction Worker et vérifications de syntaxe réussies après modification. Aucun test physique Mac↔iPhone effectué.
Aucun changement serveur, migration, effacement de cache ou de données. Aucune correction publiée en production.

## Blocage et prochaine étape

Le téléchargement de sauvegarde complète a été demandé dans le navigateur, mais aucun fichier n'a été confirmé. Le contrôle du navigateur a ensuite expiré. L'accès technique en lecture à l'API privée répond 401 sans session utilisateur ; ne pas contourner l'identité.
Obtenir et vérifier les sauvegardes des deux appareils et des deux origines, puis tester la restauration dans un environnement isolé avant migration ou déploiement.
Converger vers une origine officielle avec accès direct au stockage privé : conserver l'origine privée actuelle est l'option la plus limitée techniquement ; conserver GitHub comme origine d'application nécessiterait un backend et une authentification compatibles sans popup. Aucun choix irréversible n'a été appliqué.
Valider ensuite les modifications bidirectionnelles, les photos, la fermeture/réouverture, les conflits, la reconnexion et les versions sur les appareils réels. Final Cut Pro vient après.
