# Conventions de levee

## Langue : code en anglais, interface en français

- **Code en anglais idiomatique** : dossiers, fichiers, composants, hooks, fonctions, variables, props, types, constantes,
  tests (noms de fichiers et identifiants), **commentaires techniques et descriptions des tests** (`describe` / `it`). Un nom lu
  dans l'explorateur ou dans un import dit ce que le fichier contient.
- **Interface en français** : libellés visibles, messages destinés à l'utilisateur, `aria-label` et autres textes
  d'accessibilité, titres de page, noms propres des pièces et des lieux. Une description de test en anglais cite en français
  la chaîne d'interface qu'elle vérifie (`it('shows « Fin incertaine » for ...')`).
- **Contrats persistés ou publics inchangés** (voir plus bas) : un renommage de code ne modifie jamais ce qui est déjà écrit
  ailleurs. La traduction se fait dans un seul fichier de codec par contrat, jamais en changeant le format :
  `navigation/criteriaSessionStorage.ts`, `navigation/useJourney.ts` (`history.state`), `bookings/bookingSessionStorage.ts`,
  `diagnostics/DiagnosticsPage.tsx` et `server/Levee.Api/Program.cs`.
- Le README reste en français ; les chemins et les exemples de code qu'il cite doivent être exacts.
- **Reste à traiter** : les jetons Tailwind français (`fond`, `filet`, `contour`, `texte`, `texte-doux`, `corail`, `corail-vif`,
  `surface-survol`, points de rupture `tablette` et `bureau`) sont des noms de classes dans le code ; leur passage à l'anglais
  est un lot distinct, à vérifier par des captures identiques. Tant qu'ils existent, ne pas en créer de nouveaux en français.

## Fichiers et symboles

- Composant React : `PascalCase.tsx`, le fichier porte le nom du composant exporté (`BookingForm.tsx`).
- Hook : `useX.ts`, un hook par fichier, nommé comme son export.
- Module de fonctions, de types ou de constantes : `camelCase.ts`, nommé d'après son contenu (`bookingRules.ts`), pas d'après
  un type de contenu vague (`utils`, `helpers`, `data`) ; `domain/types.ts` est le fichier unique des types du domaine.
- Test : à côté du fichier testé, `nom.test.ts` ou `nom.test.tsx`.
- Dossier : minuscules (kebab-case si plusieurs mots, `demo-data/`), un par fonctionnalité (`bookings/`) ; ce qui sert à plusieurs fonctionnalités va dans un dossier
  partagé, les primitives sans logique métier dans `ui/`.
- Types et composants en `PascalCase`, fonctions et variables en `camelCase`, constantes en `SCREAMING_SNAKE_CASE`.
  Props de rappel `onXxx`, booléens `isXxx` / `hasXxx`, nombres explicites (`seatCount`, pas `count` seul quand plusieurs
  quantités coexistent).

## Vocabulaire métier

| Concept | Terme du code | Remarque |
|---|---|---|
| Œuvre théâtrale | `Play` | « pièce » dans l'interface |
| Représentation précise (date et horaire) | `Performance` | « séance » dans l'interface |
| Lieu de représentation (établissement, adresse) | `Venue` | « salle » dans les données de démonstration |
| Affiche visuelle | `Poster` | |
| Réservation (une représentation, un tarif, un nombre de places) | `Booking` | l'application ne manipule que des réservations |
| Nombre de places | `seatCount` | distinct du nombre de réservations (`count`) |
| Tarif | `fare` (`full`, `reduced`) | « Plein tarif », « Moins de 26 ans » dans l'interface |
| Destination « Billets » / « Mes billets » | `tickets` | uniquement pour cette destination, pas d'entité `Ticket` |
| Navigation principale, feuille modale, carrousel | `Navbar`, `Sheet`, `Carousel` | noms techniques usuels |
| Représentation proposée par l'application / choisie par l'utilisateur | `suggestedPerformance` / `selectedPerformance` | `suggestPerformance` (domaine) et `selectPerformance` (parcours) |
| Écran de la page d'une pièce | `PlayPage`, `Screen 'play'` | route publique `/piece/:id` inchangée |

Une seule traduction par concept : n'introduis pas de synonyme (`Show`, `Session`, `Reservation`, `Theater`) pour un concept
de ce tableau.

## Contrats à ne pas casser

- **Routes publiques** : `/`, `/seances`, `/piece/:id`, `/seances/:id`, `/technique`, ancre `/#seances-du-soir`.
  Les identifiants de pièce et de représentation (`jeu-amour-hasard`, `jeu-amour-hasard-2026-11-28-1200`) sont des adresses.
- **`history.state`** : `{ levee: true, origine: 'accueil' | 'resultats', cleOrigine: string | null }`.
- **`sessionStorage`** : `levee:criteres` (`jour`, `origine`, `departMinutes`, `limiteMinutes`, `genres`, `auteur`,
  `masquerImpossibles`) et `levee:reservations` (`[{ reference, seanceId, tarif: 'plein' | 'reduit', places }]`). Le format
  enregistré se relit à l'identique après un renommage : des tests figent un contenu réel de chaque clé.
- **API** : `GET /bff/etat` renvoie `{ service, environnement, horodatageUtc }`.
- Les noms de classes Tailwind (jetons de `src/index.css`) sont du code ; leur renommage se fait avec le lot de migration.

## Vérifications avant de proposer un lot

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`. Le dossier `prototype/` (export de
Claude Design) reste hors du dépôt et de tout lot. Le stage, le commit et le push sont faits par la personne qui maintient le dépôt.
