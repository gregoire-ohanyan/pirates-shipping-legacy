# Journal des modifications

Toutes les modifications notables du jeu sont listées ici, de la plus récente à la plus ancienne.
Chaque version correspond à la valeur `VERSION` de `sw.js` (par exemple `psl-0.3.0` pour la 0.3.0).

## [0.4.0] — 2026-11-08

### Ajouté
- **Onglet « Bateau »** (remplace l'onglet « Cale ») : vue en coupe du navire avec sa silhouette (mâts, voiles, coque peinte, nom écrit sur la coque), ses salles et l'équipage dedans.
- **Salles** : pont, vigie, coquerie, infirmerie, batterie, dortoir et cales. Chaque marin se trouve dans une salle ; on le déplace à tout moment en faisant glisser son portrait (échange automatique si la salle est pleine).
- **Compétences par salle** : une compétence ne compte que dans la salle prévue pour elle (navigation sur le pont, cuisine en coquerie, médecine à l'infirmerie, vigie au nid-de-pie, arrimage et charpente dans une cale…), à 50 % dans certaines salles voisines. Le commerce compte partout.
- **Rendement décroissant** : dans une même salle, le 2e marin qui apporte la même compétence compte à 50 %, le 3e à 25 %.
- **Actions de salle** : à l'infirmerie, les marins qui ne sont pas soignants deviennent patients (ils ne travaillent pas mais regagnent 6 santé par jour, plus avec la chirurgienne) ; au dortoir, les occupants se reposent (+4 santé, +4 moral par jour).
- **Postes rapides** : « Placement conseillé », « Tempête » (tout le monde sur le pont sauf le maître d'arrimage) et « Soins » (blessés à l'infirmerie).
- **Plusieurs cales par navire**, chacune avec sa grille et son type : classique (fond humide), sèche, ventilée, soute à poudre (poudre et armes uniquement), cachée (contrebande presque invisible). La goélette a une cale principale 10×4 et une cale sèche 4×2.
- **Déplacer la marchandise d'une cale à l'autre** : en glissant un item sur une autre cale de la vue en coupe, ou avec le bouton « ⇄ » de sa fiche.
- **Plans des navires** : barque (pont, cale), cotre (pont, coquerie, cale), goélette (vigie, pont, coquerie, infirmerie, cale sèche, cale principale).
- **Nom du navire**, modifiable avec le bouton ✏️ ; chaque modèle a une couleur de coque.
- **Équilibre visible** : le navire penche selon l'assiette, le centre de gravité est marqué d'une croix, la ligne de flottaison monte avec la charge. Jauges de charge, stabilité, assiette et vitesse sous la vue en coupe.
- Places libres en pointillés dans chaque salle, contour rouge si le pont est vide, résumé des compétences dans chaque salle.
- Fenêtres d'événement : la salle qui compte est indiquée à côté de la compétence testée.
- Onglet Équipage : le poste de chaque marin et son statut, avec un raccourci vers sa salle.
- Nouveaux paramètres dans `js/config.js` : `salles` (types, compétences, rendements, soins, repos), `typesCale`, et pour chaque navire `nomParDefaut`, `silhouette`, `couleurCoque`, `coupe` et `salles` (position dans la vue en coupe, places, cales).

### Modifié
- L'arrimage protège seulement la cale où se trouve le maître d'arrimage.
- La stabilité et l'assiette se calculent sur toutes les cales, selon leur position dans le navire.
- Le rangement automatique choisit la cale la plus adaptée (sèche pour ce qui craint l'eau, ventilée pour les périssables, soute pour la poudre, cachée pour la contrebande) et remplit depuis le centre pour garder le navire équilibré.
- Dans la grille, la poupe est à gauche et la proue à droite, comme dans la vue en coupe.
- Les fiches des navires au chantier décrivent leurs cales et leurs salles.

### Compatibilité
- Les sauvegardes des versions précédentes sont converties automatiquement : la cargaison va dans la cale principale, les marins sont placés selon leur rôle et le navire reçoit son nom par défaut.

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
