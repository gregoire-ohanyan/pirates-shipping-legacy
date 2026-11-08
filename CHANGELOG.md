# Journal des modifications

Toutes les modifications notables du jeu sont listées ici, de la plus récente à la plus ancienne.
Chaque version correspond à la valeur `VERSION` de `sw.js` (par exemple `psl-0.3.0` pour la 0.3.0).

## [0.6.1] — 2026-11-08

### Ajouté
- **L'Archipel de Nacre**, la deuxième région : des atolls au sud, derrière la Brume. Il compte cinq îles :
  - Port-Royal, à la Couronne ;
  - La Perlière, à la Couronne ;
  - L'Anneau des Mille Pirogues, aux Coralins ;
  - Le Lagon Noir, à l'Étoile Noire, caché ;
  - Le Récif du Silence, sans maître, caché.

  Les atolls sont dessinés en anneau sur la carte.
- **Carte qu'on fait glisser** : le monde mesure désormais 100 × 245. On fait glisser la carte au doigt ou à la souris (molette sur ordinateur).
  - Une piste sur le côté indique la partie affichée, et le bouton ⌖ recentre la carte sur le navire.
  - En voyage, la carte suit le navire.
- **La Brume** sépare les deux régions. Tant que la Passe n'est pas ouverte, impossible d'aller au sud.
- **Chaîne « La Passe du Sud »** :
  1. La rumeur de la Passe, à la taverne de l'Île aux Sternes.
  2. Obtenir la route, au choix. Les deux quêtes s'excluent.
     - **Voie légale** : « La lettre de passage », à Vasque. Il faut 15 de réputation auprès de la Couronne.
     - **Voie de l'ombre** : « La carte des passeurs », à Lunebaie, en livrant du faux-sel.
  3. Traverser la Passe des Brumes.
- **Trajets par la Passe** : entre les deux régions, la route passe automatiquement par la Passe, en deux étapes et sans arrêt. Les durées en tiennent compte, et la Brume est plus dangereuse et plus hantée. La première traversée déclenche l'événement « Dans la Brume ».
- **Les Coralins**, 5ᵉ faction, chef : la Vieille Anémone.
  - Recrutement à moitié prix à +20.
  - Chant des coraux à +40 : deux fois moins d'incidents en mer dans l'archipel.
  - Plus de recrues à −30.
- **Rivalités multiples** : la Couronne a maintenant deux rivales, l'Étoile Noire et les Coralins.
- **Nouvelles marchandises** :
  - perles : monopole royal ;
  - perles noires : contrebande chez la Couronne et les Fanaux ;
  - corail : fragile ;
  - vanille : périssable, craint l'eau ;
  - coprah.

  Les atolls manquent de bois, de sel et de métal.
- **Nouvelles quêtes** :
  - « Du bois pour le fort » ;
  - « Les perles du Vice-Roi » ;
  - « Le sel des Coralins » ;
  - deux découvertes, qui révèlent le Récif du Silence et le Lagon Noir.
- **Deux nouvelles chaînes de quêtes** :
  - « Entre le Vice-Roi et les Coralins » ;
  - « Le secret du Récif ».
- **La tour du Récif** : on peut retenter de la gravir à chaque passage tant qu'on n'a pas réussi. Elle livre la page 4 du journal d'Aliénor et un coffre des Bâtisseurs.
- **Nouveaux événements dans l'archipel** :
  - Cyclone sur les lagons ;
  - Des pirogues à l'horizon (échange de vanille) ;
  - Un plongeur en détresse.
- **Deux recrues coralines** à l'Anneau : Tiv Anneau-Clair et Sauge Lagon.
- **10 nouvelles légendes**, dont une nouvelle catégorie « L'Archipel de Nacre ».
- **Nouveaux jalons** :
  - « Au-delà de la Brume », avec le pavillon Nacre ;
  - « Maître des atolls », avec la coque Lagon.

  « Terra cognita » ne compte plus que les îles des Hauts-Fonds de Sel.
- **Nouveaux réglages dans `js/config.js`** :
  - `regions` ;
  - `carte.largeur`, `carte.hauteur` et `carte.brume` (bande, Passe, danger, fantômes) ;
  - champs des îles : `forme`, `nomCarte`, `repeterTantQue` ;
  - champs des quêtes : `exclusif`, `ouvrePassage`, `revele` sur les livraisons, `legende` sur les découvertes, et les prérequis `reputationFaction` et `passage` ;
  - étape `ou` dans les chaînes ;
  - champ `region` des événements, et effets `repFaction` et `stat` ;
  - champ `iles` des marins ;
  - champs `indice` et `special` des légendes.

## [0.6.0] — 2026-11-08

### Ajouté
- **Le monde du jeu** (d'après la Bible de l'univers) : une fenêtre d'ouverture présente l'an 312 du Fanal, la Brume, le Reflux et les quatre factions.
- **Légendes** : nouvelle section « Légendes » dans l'onglet Quêtes, avec 23 légendes en quatre catégories (Le monde, Factions, Personnages, Journal d'Aliénor). Une légende se découvre :
  - dès le départ ;
  - en accostant sur une île ;
  - à la taverne, avec le nouveau bouton gratuit « Écouter les vieux marins » ;
  - en mer, lors de certains événements.

  Les légendes encore inconnues donnent un indice sur l'endroit où les trouver.
- **Le fantastique en mer**, avec trois événements de nuit :
  - **La Dernière Marée** : l'Amiral d'Os réclame un péage. On peut payer, fuir ou jouer aux dés.
  - **Des feux sur la côte** : les faux feux des Naufrageurs. On envoie une vigie ou on fait un détour.
  - **Une voile dans la Brume** : la Persévérance fantôme laisse une page du journal d'Aliénor.
- **Journal d'Aliénor** : 3 pages à retrouver, sur la Persévérance et dans le trésor de l'Île du Pendu.
- **Lanterne bénie** (amélioration, Hautegarde, 180 or) : deux fois moins de navires fantômes, et un choix pour repousser l'Amiral d'Os.
- **Sel et faux-sel** : le sel est produit à Vasque et recherché au nord. Le faux-sel est produit chez l'Étoile Noire, et il est interdit à Hautegarde et à Vasque.
- Une description pour chaque île, à l'accueil du port et sur la carte.
- Des descriptions et des chefs pour chaque faction, dans Quêtes › Réputation.
- Nouveaux jalons :
  - « Conteur » : découvrir 12 légendes, avec le pavillon Brume en récompense ;
  - « Sur la trace d'Aliénor » : retrouver les 3 pages du journal.
- Nouveaux blocs dans `js/config.js` : `monde`, `categoriesLegendes`, `legendes`. Ajouts : champs `description` et `chef` des factions, `description` des îles, `legende`, `fantome`, `requiertAmelio` et la condition `pageAlienor` des événements.

### Modifié
- **Nouvelles factions** :

  | Faction | Remplace | Île(s) |
  | --- | --- | --- |
  | Ordre des Fanaux | la Couronne d'Aubrac | Hautegarde |
  | La Couronne | la Compagnie des Comptoirs | Vasque |
  | L'Étoile Noire | les Colonies libres | Lunebaie, Île aux Sternes |
  | Les Naufrageurs | la Confrérie de la Marée | La Crique Noire |

  Les rivalités opposent les Fanaux aux Naufrageurs, et la Couronne à l'Étoile Noire.
- **Effets de faction** revus :
  - **Étoile Noire** : receleurs +20 %, Marques d'ombre (les inspecteurs trouvent deux fois moins la contrebande), délation à −30.
  - **Naufrageurs** : pavillon ami à +20, pacte des feux morts à +40 (deux fois moins de navires fantômes).
  - Les recrues et les vivres moins chers n'appartiennent plus à aucune faction.
- La goélette exige 20 de réputation auprès des Fanaux.
- La patrouille devient la « Patrouille des Fanaux ».
- Les quêtes du gouverneur deviennent celles du Grand Gardien. La Confrérie devient les Naufrageurs.
- La notion d'héritage disparaît :
  - le jalon « Dynastie » devient « Revenant des mers » (survivre à 3 naufrages) ;
  - la génération n'est plus affichée.
- Les sauvegardes existantes sont migrées : la réputation et la méfiance passent aux nouvelles factions.

## [0.5.0] — 2026-11-08

### Ajouté
- **Onglet « 📜 Quêtes »** (5ᵉ onglet en bas sur mobile, bouton en haut sur PC) avec quatre sections :
  - **Contrats** en cours ;
  - **Quêtes et chaînes**, avec les étapes et les rumeurs entendues ;
  - **Livre des jalons** ;
  - **Réputation** par île et par faction.
  
  Une pastille signale les nouveautés.
- **Paliers de réputation par île** : Hostile, Méfiant, Inconnu, Connu, Estimé, Notable. Chaque palier change les prix, le nombre et la récompense des contrats, l'accès aux quêtes, le prix des réparations, la fréquence des inspections, les contrats rares, les recrues et la taxe d'entrée. Un port hostile reste ouvert, mais devient très cher. Le palier s'affiche sur la bannière du port, et un message apparaît au changement de palier.
- **Paliers de faction** à +20, +40 et −30 :
  - goélette réservée aux amis de la Couronne ;
  - lettre de marque ;
  - coffre de la Compagnie dans tous les ports ;
  - boycott ;
  - recrues et vivres moins chers chez les Colonies ;
  - marché noir et pavillon ami avec la Confrérie ;
  - etc.
- **Rivalités** : Couronne et Confrérie, Compagnie et Colonies. La faction rivale perd 25 % de chaque gain de réputation.
- **Méfiance des autorités** en quatre niveaux, de Calme à Recherché. Elle modifie la fréquence des inspections et l'efficacité des cachettes.
- **16 jalons** (premier contrat, cartographe, équipage complet, fortune, générations…). Chaque jalon débloque une récompense, surtout cosmétique : couleur de coque, pavillon ou titre de capitaine. Une fenêtre « Jalon atteint ! » s'affiche à chaque déblocage.
- **🎨 Personnaliser le navire** (onglet Bateau) : couleur de coque, pavillon et titre, visibles sur la vue en coupe et sur la carte.
- **Carte « Objectifs »** sur l'accueil du port : prochain palier de l'île et jalon le plus proche.
- **Marché vivant** : des pénuries (prix ×1,8) et des abondances (×0,55) apparaissent et durent quelques jours. Elles sont signalées sur les étiquettes du marché.
- **Rumeurs à la taverne**, pour le prix d'un verre, une par port et par jour. Elles annoncent une pénurie ou une abondance à venir, sont fiables à 70 % (plus avec un bon commerçant), puis sont confirmées ou démenties à l'arrivée.
- **Contrats rares ✨**, mis en valeur en doré : récompense ×2,5, délai plus court et état exigé élevé. Ils sont plus fréquents quand on est estimé.
- **Livraison parfaite** : +20 % de récompense si la marchandise arrive à 95 % d'état ou plus.
- **Note d'arrimage** de A à E, calculée sur la répartition, l'assiette et les protections. Elle s'affiche sur l'onglet Bateau et sur la carte.
- **Bilan de la traversée** à chaque arrivée : durée, gains, livraisons (dont parfaites), note d'arrimage, incidents et record battu.
- Nouvelles quêtes : « Des épices pour le bal » et « Soie pour la robe ». Quatre chaînes sont regroupées : gouverneur, mariage, Confrérie et Pendu.
- Nouveaux blocs dans `js/config.js` :
  - `paliersReputation`, `factionsPaliers`, `rivalites`, `mefiance.niveaux` ;
  - `cosmetiques`, `jalons` ;
  - `marche`, `rumeurs`, `contratsRares` ;
  - `livraisonParfaite`, `noteArrimage`, `chaines`.

### Modifié
- L'effet de la réputation sur les prix passe par les paliers (`commerce.reputationPrix` vaut 0), et l'effet de la méfiance sur les inspections passe par ses niveaux.
- La goélette exige 20 de réputation auprès de la Couronne.
- Les anciennes sauvegardes sont migrées automatiquement avec les nouveaux champs.

## [0.4.2] — 2026-11-08

### Ajouté
- **Interrompre la navigation en cours**, avec le bouton « 🧭 Interrompre la navigation… » de la vue de navigation (onglet Port) ou de la carte. Le temps se met en pause et trois choix s'offrent :
  - **Jeter l'ancre ici** : le navire s'arrête en pleine mer, puis on choisit un nouveau cap sur la carte (île connue ou point à explorer) ;
  - **Faire demi-tour** vers l'île de départ, avec la durée du retour affichée ;
  - **Continuer** la traversée, avec la durée restante affichée.

### Modifié
- Repartir depuis le large ne remet plus à zéro les jours de mer : les salaires de toute la traversée sont payés au prochain port.

## [0.4.1] — 2026-11-08

### Ajouté
- **Événements qui demandent un marin** : certains choix (« 👤 ») font choisir QUI envoyer. La liste montre, pour chaque marin, sa compétence utile, sa chance de réussite et son poste actuel. La réussite dépend de ce marin seul, pas de toute la salle. Le marin reste dans la salle visée s'il y a de la place (échange si elle est pleine), sinon il y va le temps de la manœuvre.
- **Événements qui visent une salle** : la voie d'eau touche une cale précise (« De l'eau monte dans la Cale sèche ! ») et ne mouille que sa cargaison, même dans une cale sèche ; l'incendie se déclare dans la coquerie. Un événement n'a lieu que si le navire possède la salle visée.
- Nouveaux événements : **Le feu à bord !** (coquerie) et **Un homme à la mer !** (envoyer quelqu'un lancer un cordage depuis le pont).
- Récif en vue : nouveau choix « Envoyer un marin guider depuis la vigie », proposé seulement si le navire a une vigie.
- **Conduire un blessé à l'infirmerie** : après un événement, si un marin tombe sous 80 de santé et que le navire a une infirmerie, le jeu propose de l'y conduire. Quand un patient est rétabli, un message invite à le remettre à son poste.
- Nouveaux paramètres dans `js/config.js` : pour les événements `cible`, et pour les choix `envoi` et `requiert` ; nouveaux effets `eauCible`, `chocCible` et `blesseEnvoye` ; `salles.infirmerieSousSante`.

### Corrigé
- Vue en coupe : la mer reste horizontale et remplit tout le cadre ; seul le navire s'incline selon l'assiette. Auparavant, la mer penchait avec la coque et laissait une bande immobile en dessous.

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
