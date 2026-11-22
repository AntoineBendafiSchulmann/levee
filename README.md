# levee

Une API ASP.NET Core et un client React + Vite en TypeScript strict, stylé avec Tailwind CSS.
Le client propose le parcours accueil → critères → résultats → fiche d'une pièce avec des données de démonstration (lots 1 à 3).
En développement, le navigateur ne parle qu'à Vite, qui relaie `/bff` vers ASP.NET Core.

```
Navigateur ──► http://localhost:5173  (Vite)
                  └─ /bff/* ──proxy──► http://localhost:5080  (ASP.NET Core)
```

## Structure

```
server/Levee.Api/               API ASP.NET Core (BFF) appelée par le client
src/                            Client React + Vite (index.html, package.json et configurations à la racine)
  accueil/                      Accueil : page, carrousel d'affiches, affiche, actions
  criteres/                     Formulaire de critères et feuille qui le contient
  resultats/                    Page des résultats, carte d'une séance (lien vers sa fiche), frise horaire
  fiche/                        Fiche d'une pièce : séances par jour, verdict, détail du trajet et du calcul
  parcours/                     Navigation (adresses, écran, critères, défilement, focus de retour)
  commun/                       Éléments partagés (en-tête)
  domaine/                      Types et fonctions pures : évaluation d'une séance, résultats, temps (+ tests)
  donnees-demo/                 DONNÉES FICTIVES de démonstration, importées par App.tsx seul
  technique/                    Contrôle technique de l'API, servi sur /technique
```

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
5. Le carrousel défile au doigt, avec les flèches (à partir de 700 px de large) et au clavier
   (Tab, ← → Début Fin) ; l'affiche centrée est de face, les voisines inclinées et assombries.
   Avec « réduire les animations » activé dans le système, les affiches restent à plat.
6. « Préparer une autre sortie » (ou un critère) ouvre la feuille de critères : chaque changement
   s'applique tout de suite, Échap la ferme et le focus revient à l'élément qui l'a ouverte.
   « Voir N séances » ouvre les résultats (`/seances`) ; le retour du navigateur ramène à l'accueil
   avec les critères conservés. Une ouverture directe de `/seances` utilise les critères de démonstration.
7. Parcours de référence : samedi 28 novembre, départ République à 18 h 30. Avec « Sortie au plus
   tard à » 22 h 00, *Le Jeu de l’amour et du hasard* de 20 h 00 est « À temps » ; à 21 h 50 il devient
   « Fin incertaine » (fin entre 21 h 45 et 21 h 55). En avançant le départ à 16 h 00, ses deux
   représentations (16 h 30 et 20 h 00) apparaissent comme deux cartes distinctes.
8. À 375 × 667, « Voir les séances » et « Préparer une autre sortie » sont visibles sans défilement.
9. Fiche. Sur l'accueil, un premier geste à la souris ou au doigt sur une affiche voisine la centre ; le
   geste suivant sur l'affiche centrée ouvre `/piece/:idSpectacle`. Au clavier, Entrée ouvre l'affiche
   focalisée. La séance présélectionnée est la première qui convient à partir du départ, le jour choisi : c'est
   aussi l'horaire de la légende de l'affiche. Sur `/seances`, chaque carte est un lien vers
   `/seances/:idSeance` : avec départ à 16 h 00 le samedi 28 novembre, la carte de 20 h du *Jeu de l'amour
   et du hasard* ouvre la séance de 20 h (limite 21 h 50 : « Fin incertaine »), pas celle de 16 h 30.
10. Sur la fiche : les onglets de jour filtrent la liste, un clic sur un horaire le choisit et met l'adresse à
    jour (`/seances/:idSeance`, sans nouvelle entrée d'historique), « Trajet et calcul horaire » déplie le
    détail, « ← Résultats » ou « ← Accueil » revient à l'écran d'origine avec critères, défilement et focus (la
    carte ou l'affiche d'origine) restitués. Le rechargement, l'ouverture directe et le retour du navigateur
    affichent la séance de l'adresse ; une adresse inconnue affiche « Fiche introuvable ».
11. Critères et rechargement. Les critères ne sont pas dans l'adresse : ils sont gardés dans le `sessionStorage`
    de l'onglet. Actualiser la page conserve donc les critères (et le verdict) ; un onglet neuf ouvert sur la
    même adresse affiche la même séance avec les critères de démonstration. Une valeur absente, illisible ou
    refusée par le domaine (origine inconnue, heure hors bornes ou hors pas de 5 minutes, genre ou jour inconnu)
    est ignorée ; un stockage inaccessible aussi.

## Hors périmètre à ce stade

Authentification et droits d'accès, persistance en base, réservation simulée, confirmation et « Mes billets »
(lot suivant), menu global,
branchement des séances au BFF, service du build React par ASP.NET Core et publication.
