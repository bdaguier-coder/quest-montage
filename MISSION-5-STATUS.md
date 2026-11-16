# QUEST Montage 5.0 — état au 16 novembre 2026

Mission 1 en cours, mission 2 non commencée. La version de correction est la 4.3.1.

## Faits vérifiés

L'ancienne page GitHub dépend d'une popup vers l'origine privée : sa fermeture interrompt les échanges. Les deux origines ont des stockages locaux distincts. L'adresse officielle retenue est https://quest-montage.korben.chatgpt.site/ ; elle accède directement aux API privées sans popup.

Une sauvegarde du Mac a été retrouvée et conservée séparément du dépôt public : 27 plans, 3 médias, aucun média référencé manquant. Le JSON, les contenus base64 et la restauration structurelle en clone indépendant ont été vérifiés. La bibliothèque de fichiers ChatGPT conserve la sauvegarde ; aucune copie de données privées n'entre dans le dépôt. La sauvegarde et les données exclusivement locales de l'iPhone ne sont pas encore vérifiées.

## Corrections publiées dans la 4.3

- Statut Synchronisé conditionné à l'envoi des références de médias, y compris bible et corbeille.
- Distinction erreurs serveur, panne de transport et authentification.
- Conservation locale possible des médias téléchargés aussi sur l'origine officielle.
- Délais maximums sur les échanges de médias ; copie locale conservée.
- Bannière de transition GitHub vers l'adresse officielle, sans redirection forcée ni effacement.

Le service existant conserve ses données D1/R2, ses contrôles de révision et son historique. Aucune migration de données ou modification d'audience n'a été réalisée.

## Validation effectuée

35 tests automatisés passent : clients indépendants, conflits, reprise après coupure simulée, historique, isolation des comptes et stockage de médias. Construction Worker réussie.

Le 16 novembre, essais interactifs dans deux onglets du navigateur de test, avec compte local fictif : titre et durée enregistrés, titre et notes reçus en retour, image PNG de test de 640 × 360 retrouvée dans le second onglet et après rechargement. Les deux onglets partagent le même profil ; ils ne constituent pas deux appareils physiques. Le contrôle entre clients indépendants est automatisé.

## Validation encore nécessaire

Sur les appareils réels : vérifier leurs sauvegardes et leurs éventuels films locaux uniques ; utiliser la même adresse officielle et le même compte ; confirmer une modification Mac → iPhone puis iPhone → Mac et le transfert d'une photographie ; vérifier fermeture/réouverture, mode avion puis reconnexion, conflit et acceptation de la mise à jour. Ne pas réinitialiser l'application ou les données de navigation.

Les vidéos originales de l'espace Montage et leurs miniatures restent locales. La reprise d'une application suspendue par iOS s'effectue à sa réouverture ; aucun fonctionnement permanent en arrière-plan n'est annoncé.

La connexion entrante Final Cut Pro n'est pas commencée, conformément à l'ordre des missions. Aucun import manuel n'est présenté comme une synchronisation automatique.

## Signalement iPhone et correction 4.3.1

Une capture de l’iPhone montre « Mon premier film », 0 plan, 00:00, avec la mention Synchronisé. Cette preuve contredit la récupération attendue des 27 plans ; elle ne prouve pas leur suppression et ne permet pas de connaître le contenu du menu Mes films.

Le code conservait le dernier brouillon vide lors des visites suivantes et pouvait sélectionner un brouillon vide distant avant un film réel. La correction privilégie le travail existant à l’ouverture, refuse de remplacer une saisie active ou un projet personnalisé, conserve les anciens brouillons et n’envoie pas de nouveaux films de démarrage vides. Si aucun film avec du contenu n’est retrouvé, l’interface affiche « Aucun film retrouvé » et propose Mes films ou la restauration d’une sauvegarde.

40 tests automatisés passent. Essai navigateur isolé : création d’un film vide de démarrage, rechargement, récupération du film contenant le plan et son image. La présence des 27 plans dans le stockage central du compte réel reste non vérifiée. La validation iPhone est en échec à ce stade, en attente de l’effet de cette correction et de l’examen de Mes films si nécessaire.
