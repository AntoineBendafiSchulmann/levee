# levee

Une API ASP.NET Core et un client React + Vite en TypeScript strict, stylé avec Tailwind CSS.
Le client affiche l'accueil « Que voir ce soir ? » avec des données de démonstration (lot 1).
En développement, le navigateur ne parle qu'à Vite, qui relaie `/bff` vers ASP.NET Core.

```
Navigateur ──► http://localhost:5173  (Vite)
                  └─ /bff/* ──proxy──► http://localhost:5080  (ASP.NET Core)
```

## Structure

```
src/Levee.Api/                  API ASP.NET Core appelée par le client
src/client/                     Client React + Vite
  src/accueil/                  Accueil : page, carrousel d'affiches, affiche, actions
  src/domaine/                  Types et fonctions pures (heures, jours, programme)
  src/donnees-demo/             DONNÉES FICTIVES de démonstration, importées par App.tsx seul
  src/technique/                Contrôle technique de l'API, servi sur /technique
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
npm --prefix src/client ci
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
dotnet run --project src/Levee.Api             # http://localhost:5080
npm --prefix src/client run dev                # http://localhost:5173
```

Ouvrir `http://localhost:5173/` : l'accueil. Ouvrir `http://localhost:5173/technique` : le contrôle
technique, qui appelle `GET /bff/etat` par une URL relative et affiche le service, l'environnement
et un horodatage UTC.

## Validation

```
dotnet build Levee.slnx
npm --prefix src/client run lint
npm --prefix src/client run typecheck
npm --prefix src/client run build              # sortie dans src/client/dist/, ignorée par Git
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
   novembre · à l’affiche » (date de démonstration), critères marqués « lecture seule », bouton
   « Voir les séances de ce soir » avec « 6 séances ce soir » et « Préparer une autre sortie ».
5. Le carrousel défile au doigt, avec les flèches (à partir de 700 px de large) et au clavier
   (Tab, ← → Début Fin) ; l'affiche centrée est de face, les voisines inclinées et assombries.
   Avec « réduire les animations » activé dans le système, les affiches restent à plat.
6. À 375 × 667, « Voir les séances » et « Préparer une autre sortie » sont visibles sans défilement.
   Les trois boutons de destination affichent un avis « Provisoire » : leurs écrans arrivent aux
   lots suivants.

## Hors périmètre à ce stade

Authentification et droits d'accès, persistance en base, liste des séances, fiche séance,
réservation, branchement des séances au BFF, service du build React par ASP.NET Core et publication.
