# Levée de réserves

Socle technique : une API ASP.NET Core et un client React + Vite en TypeScript strict.
En développement, le navigateur ne parle qu'à Vite, qui relaie `/bff` vers ASP.NET Core.

```
Navigateur ──► http://localhost:5173  (Vite)
                  └─ /bff/* ──proxy──► http://localhost:5080  (ASP.NET Core)
```

## Structure

```
src/LeveeReserves.Api/             API ASP.NET Core appelée par le client
src/LeveeReserves.Domain/          Règles métier : cycle de vie d'une réserve, sans dépendance
src/client/                        Client React + Vite
tests/LeveeReserves.Domain.Tests/  Tests xUnit des règles métier
```

Le domaine n'est pas encore exposé par l'API : ses règles ne sont joignables que par les tests.

## Prérequis

- SDK .NET 10. `global.json` demande la version `10.0.100` avec `rollForward: latestFeature` :
  tout SDK 10.0.x installé convient (le plus récent est retenu), jamais une autre version majeure
  ou mineure. Vérifié avec le SDK 10.0.115.
- Node.js 24 et npm. Vérifié avec Node 24.22.3 et npm 11.19.1.

## Installation

```
npm --prefix src/client ci
```

## Lancement

Dans deux terminaux, depuis la racine :

```
dotnet run --project src/LeveeReserves.Api     # http://localhost:5080
npm --prefix src/client run dev                # http://localhost:5173
```

Ouvrir `http://localhost:5173/`. La page appelle `GET /bff/etat` par une URL relative et affiche
le service, l'environnement et un horodatage UTC.

## Validation

```
dotnet build LeveeReserves.slnx
dotnet test LeveeReserves.slnx                 # règles métier du domaine
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

1. `http://localhost:5173/` affiche l'état de l'API ; l'horodatage change à chaque rechargement.
2. Dans l'onglet Réseau, la requête part vers `http://localhost:5173/bff/etat`, sans appel direct
   au port 5080.
3. ASP.NET Core arrêté, un rechargement affiche le message d'erreur.

## Hors périmètre à ce stade

Authentification et droits d'accès, base de données, stockage des photos, exposition du cycle de vie
par l'API et écrans du parcours, service du build React par ASP.NET Core et publication.
