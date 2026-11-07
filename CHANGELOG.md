# Journal des modifications

Toutes les modifications notables du jeu sont listées ici, de la plus récente à la plus ancienne.
Chaque version correspond à la valeur `VERSION` de `sw.js` (par exemple `psl-0.3.0` pour la 0.3.0).

## [0.3.0] — 2026-11-07

### Ajouté
- **Gravité et empilement dans la cale.** Chaque item doit reposer sur le plancher (fond de cale) ou sur d'autres items. Son centre doit se trouver au-dessus de ses appuis : une longue caisse posée sur un seul petit item à une extrémité est refusée.
- **Chute de la cargaison.** Quand un item qui en soutient d'autres est retiré (vendu, déchargé, jeté, pourri, consommé, saisi, perdu lors d'un événement), les items au-dessus retombent. Un item fragile perd 10 % d'état par rangée de chute.
- **Planches** achetables au marché de chaque port : *Planche* (2×1, 2 kg, 6 or) et *Longue planche* (3×1, 3 kg, 9 or). Fixées à la coque, elles n'ont pas besoin d'appui, ne tombent jamais et servent d'étagère pour surélever la marchandise, par exemple pour la sortir du fond de cale humide.
- Pendant le glisser-déposer, l'aperçu affiche « ⬇ sans appui » quand l'emplacement visé n'est pas soutenu.
- Fiche d'un item : nouvelles indications « Fixée à la coque » (planches) et « Mal calé ».
- Nouveaux paramètres dans `js/config.js` : `fixe` (items), `cale.appuiCentre` et `cale.degatsChuteParRangee`.
- Ce journal des modifications (`CHANGELOG.md`).

### Modifié
- Le rangement automatique (« Tout ranger », « Ranger ») ne propose plus que des emplacements soutenus.
- La rotation d'un item est refusée si, une fois pivoté, il n'a plus d'appui.
- Aide du jeu et légende de la cale mises à jour.

### Compatibilité
- Les sauvegardes des versions précédentes restent valides : au chargement, les items qui étaient « en l'air » retombent, sans dégât.

## Versions précédentes (avant ce journal)

- **0.2.0** — Interface refaite (parchemin et bois, port en lieux illustrés, scène de navigation animée, retours visuels) et publication en webapp installable sur GitHub Pages.
- **0.1.0** — Premier prototype jouable : port, cale, carte, trajet en temps accéléré, événements, contrats, contrebande, équipage, naufrage.
