# Pirates : Shipping Legacy — prototype

Jeu de gestion maritime pour mobile et PC. On joue un marchand dans un archipel à l'âge d'or de la piraterie : on accepte des contrats, on range sa cargaison dans les cales du navire (poids, volume, fragile, périssable, craint l'eau, contrebande), on place son équipage dans les salles du bateau, puis on navigue d'île en île en affrontant tempêtes, récifs, pirates et inspections.

**Jouer :** ouvrez la page GitHub Pages du dépôt sur votre téléphone, puis :
- **Android (Chrome)** : menu ⋮ → *Installer l'application* (ou *Ajouter à l'écran d'accueil*).
- **iPhone (Safari)** : bouton Partager → *Sur l'écran d'accueil*.

Le jeu s'ouvre alors en plein écran comme une application. Il fonctionne hors ligne après le premier lancement, et la partie est sauvegardée sur l'appareil.

## Contenu du dépôt

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page du jeu : structure et styles |
| `js/config.js` | **Tous les paramètres d'équilibrage** : marchandises, îles, factions, salles, types de cale, plans des navires, marins, quêtes, événements, légendes et textes du monde, temps |
| `js/game.js` | Moteur et interface (ne contient aucune valeur de jeu) |
| `manifest.webmanifest` | Nom, icônes et couleurs de l'application installée |
| `sw.js` | Mise en cache pour jouer hors ligne |
| `icones/` | Icônes de l'application |
| `CHANGELOG.md` | Liste des modifications de chaque version |

## Modifier l'équilibrage

1. Ouvrez `js/config.js` (directement sur GitHub avec le crayon ✏️, ou en local).
2. Changez les valeurs : chaque bloc est commenté en français. Pour ajouter une marchandise, une quête ou un événement, copiez un bloc existant et changez son `id`.
3. Dans `sw.js`, augmentez `VERSION` (par exemple `psl-0.3.1`) et ajoutez une entrée dans `CHANGELOG.md` pour que les téléphones récupèrent la nouvelle version.
4. Enregistrez (commit). La page est mise à jour en une à deux minutes.
5. Dans le jeu : menu ☰ → *Nouvelle partie* pour repartir avec les nouvelles valeurs de départ.

## Activer GitHub Pages (une seule fois)

*Settings* → *Pages* → *Build and deployment* → *Source : Deploy from a branch* → branche `main`, dossier `/ (root)` → *Save*.

L'adresse du jeu sera `https://<votre-compte>.github.io/<nom-du-dépôt>/`.
