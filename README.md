# levee

Une API ASP.NET Core et un client React + Vite en TypeScript strict, stylé avec Tailwind CSS.
Le client propose le parcours accueil → critères → résultats → fiche d'une pièce → réservation simulée → « Mes billets » avec des données de démonstration.
En développement, le navigateur ne parle qu'à Vite, qui relaie `/bff` vers ASP.NET Core.

```
Navigateur ──► http://localhost:5173  (Vite)
                  └─ /bff/* ──proxy──► http://localhost:5080  (ASP.NET Core)
```

## Structure

Code en anglais, interface en français : les conventions de nommage et le vocabulaire sont dans `CLAUDE.md`. Les dossiers
antérieurs au lot Billets portent encore des noms français, en attente d'un lot de migration dédié.

```
server/Levee.Api/               API ASP.NET Core (BFF) appelée par le client
src/                            Client React + Vite (index.html, package.json et configurations à la racine)
  composants/                   Composants partagés entre plusieurs fonctionnalités : navigation principale (Navbar),
                                affiche (Affiche), carte de séance (CarteSeance) et sa frise (FriseHoraire), libellés
                                et couleurs de statut (presentationStatut.ts), gestion du clic simple sur un lien (clicSimple.ts)
    ui/                         Primitives sans logique métier : feuille modale (Sheet : dialogue, fermeture, focus, feuille
                                mobile ou panneau latéral), commune à la feuille de critères et aux réservations
  bookings/                     Réservation simulée : état et stockage des réservations (useBookings, bookingSessionStorage),
                                règles (bookingRules.ts : tarifs, 1 à 6 places, référence), feuille « Réservation », « C'est noté »
                                et « Mes billets » (BookingSheet, BookingForm, BookingReceipt, bookingSummary)
  accueil/                      Page d'accueil et ses composants propres : pièce à l'affiche et ses voisines
                                (CarrouselAffiches, useCarrousel, useReducedMotion, useDesktopBreakpoint), séances sous
                                l'affiche, séances du soir (SeancesDuSoir pour l'affichage, selectionnerSeancesDuSoir pour le choix)
  resultats/                    Page des résultats (liste complète, filtres, compteurs)
  piece/                        Page d'une pièce (PagePiece) et ses composants propres : choix du jour et de l'horaire
                                (ChoixSeance), verdict, trajet et calcul horaire (CalculHoraire)
  criteres/                     Critères de la sortie : formulaire et feuille qui le contient
  parcours/                     Navigation : adresses, écran, critères conservés (stockageCriteres), défilement, focus de retour
  domaine/                      Types et fonctions pures (évaluation, résultats, temps, bornes horaires, textes d'explication) et leurs tests
  donnees-demo/                 DONNÉES FICTIVES de démonstration, importées par App.tsx côté application et par les tests
  technique/                    Contrôle technique de l'API, servi sur /technique
```

Une page et les composants qu'elle seule utilise restent dans le dossier de sa fonctionnalité ; un composant
utilisé par plusieurs fonctionnalités va dans `composants/`.

## Prérequis

- SDK .NET 10. `global.json` demande la version `10.0.100` avec `rollForward: latestFeature` :
  tout SDK 10.0.x installé convient (le plus récent est retenu), jamais une autre version majeure
  ou mineure. Vérifié avec le SDK 10.0.115.
- Node.js 24 et npm. Vérifié avec Node 24.22.3 et npm 11.19.1.
- Docker Engine et son extension Compose, pour la base de développement. Vérifié avec Docker
  29.10.0 et Compose 5.8.0.

## Installation

```
npm ci
```

## Base de données de développement

`compose.yaml` décrit une base PostgreSQL 18.7 réservée au développement local : elle n'écoute que
sur `127.0.0.1:55433` et ses identifiants viennent d'un fichier `.env`, non suivi par Git.
L'application ne s'y connecte pas encore.

Sur un nouveau poste, depuis la racine, créer le `.env` à partir du modèle avec un mot de passe
généré, sans l'afficher. La commande peut être relancée : un `.env` existant n'est jamais modifié.

```
[ -e .env ] || (umask 077 && sed "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 16)/" .env.example > .env)
```

Démarrer la base, vérifier sa disponibilité, puis l'arrêter en conservant les données (préfixer
par `sudo` si le compte n'appartient pas au groupe `docker`) :

```
docker compose up -d --wait                    # rend la main quand la base est prête
docker compose ps                              # état attendu : healthy
docker compose stop                            # arrêt, données conservées
```

Les données vivent dans le volume `levee_pgdata`. `docker compose down` le conserve aussi ;
seul `docker compose down -v` le supprime. Le mot de passe est fixé à la création du volume : le
changer ensuite dans `.env` ne modifie pas une base existante.

## Lancement

Dans deux terminaux, depuis la racine :

```
dotnet run --project server/Levee.Api          # http://localhost:5080
npm run dev                                    # http://localhost:5173
```

Ouvrir `http://localhost:5173/` : l'accueil. Ouvrir `http://localhost:5173/technique` : le contrôle
technique, qui appelle `GET /bff/etat` par une URL relative et affiche le service, l'environnement
et un horodatage UTC.

## Validation

```
dotnet build Levee.slnx
npm run lint
npm run typecheck
npm test                                       # tests unitaires du domaine (Vitest)
npm run build                                  # sortie dans dist/, ignorée par Git
```

Serveurs lancés :

```
curl -i http://localhost:5173/bff/etat         # 200, JSON, via le proxy Vite
curl -i http://localhost:5173/bff/inconnu      # 404
```

Dans le navigateur :

1. `http://localhost:5173/technique` affiche l'état de l'API (service `Levee.Api`) ; l'horodatage
   change à chaque rechargement.
2. Dans l'onglet Réseau, la requête part vers `http://localhost:5173/bff/etat`, sans appel direct
   au port 5080.
3. ASP.NET Core arrêté, un rechargement de `/technique` affiche « Erreur : L’API est injoignable
   ou en erreur (HTTP 502). ».
4. `http://localhost:5173/` affiche l'accueil : titre de l'onglet « levee », surtitre « Jeudi 26
   novembre · à l’affiche » (date de démonstration), trois critères, et le bouton « Voir les séances
   de ce soir » avec ses compteurs (« 4 possibles · 1 à vérifier · 1 impossible »).
5. Composition de l'accueil. Mobile : titre, affiche centrée entre deux voisines à demi visibles, flèches,
   titre complet de la pièce, puis le bouton principal ; à 390 × 844 il est visible sans défiler, à 375 la page
   défile. Tablette (≥ 700 px) : affiche à gauche, texte à droite. Bureau (≥ 1100 px) : zone centrale de 1100 px
   (affiche de 360 px, texte à 52 px) et une affiche voisine de chaque côté. Ultra-wide (≥ 2200 px) : zone de
   1560 px (affiche de 540 px, texte à 96 px) et deux voisines de chaque côté. Il n'y a jamais de défilement
   horizontal. Les voisines n'existent que si la position le permet : la première affiche n'en a pas avant elle.
6. Le carrousel s'arrête aux bords (flèches grisées en butée, pas de boucle) et une seule sélection commande le
   titre, les séances, le compteur, les flèches et la fiche ouverte ; elle suit l'identifiant de la pièce : si les critères
   changent la liste, la même pièce reste à l'affiche, et si elle disparaît la première pièce disponible la remplace.
   Sous 1100 px : défilement natif avec accroche,
   l'affiche suit le doigt, les voisines se redressent progressivement, l'accroche termine le geste, le défilement
   vertical reste possible depuis l'affiche et un balayage n'ouvre pas de fiche. À partir de 1100 px : scène par
   indice (voisines de chaque côté, balayage à la souris ou au doigt au-delà de 48 px). Partout : un premier clic
   ou toucher sur une voisine la met à l'affiche, l'affiche active ouvre sa fiche ; au clavier, ← → Début Fin
   changent d'affiche et Entrée ouvre directement la fiche de l'affiche focalisée. Franchir 1100 px, dans un sens ou
   dans l'autre, garde la même pièce. Le changement s'anime sur la scène (et pour le texte) ; avec « réduire les
   animations » activé, il est instantané et les affiches restent à plat.
7. Sous l'affiche, les séances de la pièce ce jour-là (heure, sortie calculée, statut) ouvrent la représentation
   exacte ; celle que la fiche présélectionne porte la mention « Séance proposée » et une bordure claire. Plus bas, « Les séances qui rentrent dans votre soirée » : au plus trois séances possibles tirées des
   résultats, chacune ouvrant sa fiche ; « Voir tous les résultats » mène à `/seances` avec les critères courants ;
   sans séance possible (« À temps »), un message le dit ; une séance « à vérifier », par exemple « Arrivée serrée », n'y figure pas mais reste sur `/seances`. L'en-tête : le logo et « À l'affiche » ramènent en haut de
   l'accueil (ou à l'accueil depuis une autre page), « Séances de la soirée » (« Séances » sur mobile) mène à la
   sélection, la date du jour choisi apparaît dès 700 px.
8. « Préparer une autre sortie » (ou un critère) ouvre la feuille de critères : chaque changement
   s'applique tout de suite, Échap la ferme et le focus revient à l'élément qui l'a ouverte.
   « Voir N séances » ouvre les résultats (`/seances`) ; le retour du navigateur ramène à l'accueil
   avec les critères conservés. Une ouverture directe de `/seances` utilise les critères de démonstration.
9. Parcours de référence : samedi 28 novembre, départ République à 18 h 30. Avec « Sortie au plus
   tard à » 22 h 00, *Le Jeu de l’amour et du hasard* de 20 h 00 est « À temps » ; à 21 h 50 il devient
   « Fin incertaine » (fin entre 21 h 45 et 21 h 55). En avançant le départ à 16 h 00, ses deux
   représentations (16 h 30 et 20 h 00) apparaissent comme deux cartes distinctes.
10. Fiche. Sur l'accueil, l'affiche active ouvre `/piece/:idSpectacle`. Au clavier, Entrée ouvre l'affiche
   focalisée. La séance présélectionnée est la première qui convient à partir du départ, le jour choisi : c'est
   aussi l'horaire de la légende de l'affiche. Sur `/seances`, chaque carte est un lien vers
   `/seances/:idSeance` : avec départ à 16 h 00 le samedi 28 novembre, la carte de 20 h du *Jeu de l'amour
   et du hasard* ouvre la séance de 20 h (limite 21 h 50 : « Fin incertaine »), pas celle de 16 h 30.
11. Sur la fiche : les onglets de jour filtrent la liste, un clic sur un horaire le choisit et met l'adresse à
    jour (`/seances/:idSeance`, sans nouvelle entrée d'historique), « Trajet et calcul horaire » déplie le
    détail, « ← Résultats » ou « ← Accueil » revient à l'écran d'origine avec critères, défilement et focus (la
    carte ou l'affiche d'origine) restitués. Le rechargement, l'ouverture directe et le retour du navigateur
    affichent la séance de l'adresse ; un identifiant de pièce ou de séance inconnu affiche « Fiche introuvable ».
12. Critères et rechargement. Les critères ne sont pas dans l'adresse : ils sont gardés dans le `sessionStorage`
    de l'onglet. Actualiser la page conserve donc les critères (et le verdict) ; un onglet neuf ouvert sur la
    même adresse affiche la même séance avec les critères de démonstration. Une valeur absente, illisible ou
    refusée par le domaine (origine inconnue, heure hors bornes ou hors pas de 5 minutes, genre ou jour inconnu)
    est ignorée ; un stockage inaccessible aussi.

13. Billets et réservation simulée. L'en-tête porte « Billets · N » sur l'accueil, les résultats et la fiche, sur
    mobile comme sur ordinateur ; N est le nombre de réservations (pas de places). À zéro, le bouton ouvre « Mes
    billets » et son état vide « Aucune réservation simulée pour l’instant. ». Sur la fiche, « Réserver cette séance »
    (séance « À temps ») ou « Réserver malgré tout » (à vérifier ou impossible) ouvre « Réservation » pour la séance
    exactement sélectionnée : choisir 20 h alors que la pièce joue aussi à 16 h 30 donne un billet de 20 h. À chaque
    ouverture, le formulaire repart du plein tarif et de deux places ; tarifs propres à la pièce (par exemple *Le Jeu de
    l'amour et du hasard* : 29 € plein tarif, 16 € moins de 26 ans), de 1 à 6 places, total en direct. Fermer ou
    « Changer de séance » ne crée rien. « Confirmer la simulation » crée une seule réservation et affiche « C'est noté »
    (reçu) ; « Retour à l'accueil » ou « Retour aux résultats » suit la provenance de la fiche. Aucun paiement, aucun
    billet réel : la mention est affichée partout. Les réservations sont gardées dans le `sessionStorage` de l'onglet
    (clé `levee:reservations`), la plus récente en premier ; actualiser les conserve, un onglet neuf commence vide, un
    stockage inaccessible laisse le parcours fonctionner en mémoire, et un contenu illisible ou refusé par la
    programmation (séance inconnue, tarif inconnu, places hors de 1 à 6, référence répétée) est ignoré en entier.
    Parcours de référence : samedi 28 novembre, *Le Jeu de l'amour et du hasard* à 20 h, deux places au plein tarif :
    58 € ; après confirmation, « Billets · 1 » et « Mes billets » montre la séance de 20 h, deux places, 58 €.

## Hors périmètre à ce stade

Authentification et droits d'accès, persistance en base, paiement et émission de billets réels (la réservation
est une simulation en mémoire de l'onglet), menu global,
branchement des séances au BFF, service du build React par ASP.NET Core et publication.
