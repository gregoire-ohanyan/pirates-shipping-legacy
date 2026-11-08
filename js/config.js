/* =====================================================================
   PIRATES : SHIPPING LEGACY — FICHIER DE PARAMÈTRES (prototype 0.5)
   ---------------------------------------------------------------------
   Tout l'équilibrage du jeu se règle ICI, à la main.
   Le moteur (game.js) ne contient aucune valeur de jeu : il lit ce fichier.

   Règles d'édition :
   - Chaque bloc est une liste ou un dictionnaire. Pour ajouter un élément,
     copiez un élément existant et changez son "id" (unique, sans espace).
   - Les nombres sont modifiables librement. Les commentaires indiquent
     l'unité et l'effet de chaque valeur.
   - Après modification, rechargez la page et cliquez "Nouvelle partie"
     (une sauvegarde en cours garde les anciennes valeurs de départ).
   ===================================================================== */

window.CONFIG = {

  /* ------------------------------------------------------------------
     TEMPS
     ------------------------------------------------------------------ */
  temps: {
    secondesParJour: 10,      // durée réelle d'une journée de jeu en vitesse x1 (le GDD prévoit 30, réduit ici pour tester vite)
    vitesses: [1, 2, 4],      // multiplicateurs proposés au joueur
    debutNuit: 0.75,          // fraction de la journée où la nuit commence (0.75 = 18h)
    finNuit: 0.25             // fraction de la journée où la nuit se termine (0.25 = 6h)
  },

  /* ------------------------------------------------------------------
     DÉPART D'UNE NOUVELLE PARTIE
     ------------------------------------------------------------------ */
  depart: {
    or: 200,                  // pièces d'or au départ
    ile: "lunebaie",          // id de l'île de départ (voir "iles")
    navire: "cotre",          // id du navire de départ (voir "navires")
    cargaison: [              // items déjà à bord au départ : [id d'item, quantité]
      ["biscuits", 2],
      ["fruits", 1]
    ],
    equipage: ["mara", "bastien", "jojo"] // ids de marins (voir "marins")
  },

  /* ------------------------------------------------------------------
     ITEMS (marchandises, vivres, objets)
     largeur / hauteur : forme sur la grille de cale, en cases
     poids             : unités de poids (la charge max du navire est dans "navires")
     prix              : prix de base en or, modifié ensuite par chaque île
     fragile           : true = abîmé par les chocs (tempête, récif, abordage)
     perissable        : nombre de jours avant pourriture complète (0 = ne pourrit pas)
     craintEau         : true = abîmé par l'humidité du fond de cale et les voies d'eau
     rations           : si > 0, l'item est un vivre : nombre de rations qu'il contient
     frais             : true = vivre frais qui évite le scorbut
     fixe              : true = fixé à la coque (planches) : n'a pas besoin d'appui, ne tombe jamais
                         et sert d'appui aux items posés dessus
     couleur           : couleur d'affichage dans la cale
     icone             : emoji affiché sur l'item
     (La contrebande dépend de chaque île : voir "interdits" dans "iles")
     ------------------------------------------------------------------ */
  items: [
    { id: "rhum",      nom: "Tonneau de rhum",       largeur: 2, hauteur: 1, poids: 6,  prix: 30,  fragile: true,  perissable: 0,  craintEau: false, couleur: "#8a4b2a", icone: "🛢️" },
    { id: "sucre",     nom: "Sac de sucre",          largeur: 1, hauteur: 1, poids: 4,  prix: 14,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#d8cfb8", icone: "🍚" },
    { id: "tabac",     nom: "Balles de tabac",       largeur: 2, hauteur: 2, poids: 3,  prix: 40,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#7b5a2e", icone: "🍂" },
    { id: "epices",    nom: "Caisse d'épices",       largeur: 1, hauteur: 1, poids: 2,  prix: 35,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#b5562b", icone: "🌶️" },
    { id: "soie",      nom: "Rouleaux de soie",      largeur: 2, hauteur: 1, poids: 2,  prix: 55,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#9b4f8f", icone: "🧵" },
    { id: "porcelaine",nom: "Caisse de porcelaine",  largeur: 2, hauteur: 2, poids: 5,  prix: 70,  fragile: true,  perissable: 0,  craintEau: false, couleur: "#9fb6c9", icone: "🏺" },
    { id: "fruitsvente",nom: "Cageot de fruits",     largeur: 1, hauteur: 1, poids: 4,  prix: 12,  fragile: false, perissable: 8,  craintEau: false, couleur: "#e0a230", icone: "🍍" },
    { id: "poisson",   nom: "Poisson salé",          largeur: 1, hauteur: 1, poids: 4,  prix: 10,  fragile: false, perissable: 30, craintEau: false, couleur: "#8fa3a8", icone: "🐟" },
    { id: "bois",      nom: "Bois précieux",         largeur: 3, hauteur: 1, poids: 12, prix: 45,  fragile: false, perissable: 0,  craintEau: false, couleur: "#5c3a1e", icone: "🪵" },
    { id: "poudre",    nom: "Baril de poudre",       largeur: 1, hauteur: 1, poids: 5,  prix: 25,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#3c3c3c", icone: "💥" },
    { id: "mousquets", nom: "Caisse de mousquets",   largeur: 2, hauteur: 1, poids: 9,  prix: 60,  fragile: false, perissable: 0,  craintEau: false, couleur: "#4a4f57", icone: "🔫" },
    { id: "sel",       nom: "Sacs de sel",           largeur: 1, hauteur: 1, poids: 6,  prix: 16,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#e6e1d3", icone: "🧂" },
    { id: "fauxsel",   nom: "Faux-sel",              largeur: 1, hauteur: 1, poids: 6,  prix: 16,  fragile: false, perissable: 0,  craintEau: true,  couleur: "#bfb49c", icone: "🫙" },
    { id: "perles",    nom: "Coffret de perles",     largeur: 1, hauteur: 1, poids: 1,  prix: 110, fragile: false, perissable: 0,  craintEau: false, couleur: "#e9e4f0", icone: "🦪" },
    { id: "perlesnoires", nom: "Perles noires",      largeur: 1, hauteur: 1, poids: 1,  prix: 150, fragile: false, perissable: 0,  craintEau: false, couleur: "#3a3542", icone: "⚫" },
    { id: "corail",    nom: "Branches de corail",    largeur: 2, hauteur: 1, poids: 4,  prix: 50,  fragile: true,  perissable: 0,  craintEau: false, couleur: "#e07a6a", icone: "🪸" },
    { id: "vanille",   nom: "Gousses de vanille",    largeur: 1, hauteur: 1, poids: 1,  prix: 45,  fragile: false, perissable: 25, craintEau: true,  couleur: "#5a3d22", icone: "🌿" },
    { id: "coprah",    nom: "Sacs de coprah",        largeur: 2, hauteur: 2, poids: 5,  prix: 10,  fragile: false, perissable: 0,  craintEau: false, couleur: "#cdb68a", icone: "🌴" },
    { id: "lingots",   nom: "Lingots d'argent",      largeur: 1, hauteur: 1, poids: 14, prix: 90,  fragile: false, perissable: 0,  craintEau: false, couleur: "#b9bcc2", icone: "🥈" },
    // --- Vivres (se consomment : 1 ration par marin et par jour) ---
    { id: "biscuits",  nom: "Biscuits de mer",       largeur: 1, hauteur: 1, poids: 3,  prix: 8,   fragile: false, perissable: 0,  craintEau: true,  rations: 10, frais: false, couleur: "#c9a86a", icone: "🍘" },
    { id: "fruits",    nom: "Vivres frais",          largeur: 1, hauteur: 1, poids: 3,  prix: 10,  fragile: false, perissable: 10, craintEau: false, rations: 6,  frais: true,  couleur: "#6aa84f", icone: "🥥" },
    // --- Planches (étagères fixées à la coque, pour surélever la marchandise) ---
    { id: "planche",   nom: "Planche",               largeur: 2, hauteur: 1, poids: 2,  prix: 6,   fragile: false, perissable: 0,  craintEau: false, fixe: true, couleur: "#a9784a", icone: "🪚" },
    { id: "planche_longue", nom: "Longue planche",   largeur: 3, hauteur: 1, poids: 3,  prix: 9,   fragile: false, perissable: 0,  craintEau: false, fixe: true, couleur: "#9a6b40", icone: "🪚" },
    // --- Objets spéciaux (non achetables : "achetable: false") ---
    { id: "coffre",    nom: "Coffre au trésor",      largeur: 2, hauteur: 2, poids: 16, prix: 700, fragile: false, perissable: 0,  craintEau: false, couleur: "#c8a03a", icone: "💰", achetable: false }
  ],

  /* ------------------------------------------------------------------
     FACTIONS
     severite     : multiplicateur de l'amende quand de la contrebande est trouvée
     corruptible  : chance (0 à 1) qu'un pot-de-vin fonctionne lors d'une inspection
     description  : texte affiché dans l'onglet Quêtes > Réputation
     chef         : figure de proue de la faction { nom, titre }
     ------------------------------------------------------------------ */
  factions: [
    { id: "fanaux",      nom: "Ordre des Fanaux", couleur: "#2f5d9e", severite: 2.0, corruptible: 0.2,
      description: "Gardiens des phares et des cartes, devenus l'autorité maritime de l'archipel. Leur Feu blanc repousse les morts.",
      chef: { nom: "Ambroise Lumen", titre: "Grand Gardien" } },
    { id: "couronne",    nom: "La Couronne",      couleur: "#b8902e", severite: 1.5, corruptible: 0.6,
      description: "Pouvoir royal né du sel : monopole du sel, taxes et lettres de change. Son Sel scellé lie les contrats.",
      chef: { nom: "Pétronille III", titre: "la Reine du Sel" } },
    { id: "etoile",      nom: "L'Étoile Noire",   couleur: "#4a3a6a", severite: 0.8, corruptible: 0.7,
      description: "Contrebandiers chevronnés qui tiennent la pègre de chaque port. Leurs Marques d'ombre cachent ce qui doit l'être.",
      chef: { nom: "Séraphin Minuit", titre: "le Prince des Quais" } },
    { id: "naufrageurs", nom: "Les Naufrageurs",  couleur: "#3f7a5f", severite: 0.5, corruptible: 0.9,
      description: "Clans qui allument de faux feux pour piller les épaves. Leurs Feux morts appellent les noyés.",
      chef: { nom: "Gaspard Lanterne-Verte", titre: "chef des Naufrageurs" } },
    { id: "coralins",    nom: "Les Coralins",     couleur: "#2a9d8f", severite: 0.3, corruptible: 0.4,
      description: "Le peuple des lagons de Nacre, isolé par la Brume depuis des siècles. Leur Chant des coraux apaise les récifs.",
      chef: { nom: "La Vieille Anémone", titre: "gardienne des chants" } },
    { id: "aucune",      nom: "Sans maître",      couleur: "#777777", severite: 0,   corruptible: 1 }
  ],

  /* ------------------------------------------------------------------
     ÎLES (région 1 : "Les Hauts-Fonds de Sel")
     x, y          : position sur la carte (0-100 en largeur, 0-140 en hauteur)
     faction       : id de faction
     climat        : "tropical" (pourriture x climatTropical) ou "tempere"
     connue        : true = visible dès le départ
     cachee        : true = n'apparaît qu'en passant très près ou via une quête
     danger        : 0 à 1, risque d'événements sur les routes qui touchent cette île
     surveillance  : 0 à 1, chance de base d'une inspection à l'arrivée
     marche        : false = pas de commerce (île sauvage)
     produit       : { idItem: multiplicateur de prix }  (< 1 = moins cher, produit ici)
     demande       : { idItem: multiplicateur de prix }  (> 1 = recherché ici)
     interdits     : liste d'ids d'items qui sont de la CONTREBANDE sur cette île
     services      : "reparation", "recrutement", "chantier", "coffre", "taverne"
     ameliorations : ids d'améliorations vendues ici (voir "ameliorations")
     evenementArrivee : id d'événement déclenché à la première arrivée (optionnel)
     description   : présentation de l'île (accueil du port et carte)
     forme         : "atoll" = dessinée en anneau sur la carte
     nomCarte      : nom plus court affiché sur la carte (facultatif)
     repeterTantQue : l'événement d'arrivée se répète tant que cette statistique vaut 0
     ------------------------------------------------------------------ */
  iles: [
    { id: "hautegarde", nom: "Hautegarde", x: 30, y: 26, faction: "fanaux", climat: "tempere", connue: true, cachee: false,
      danger: 0.15, surveillance: 0.6, marche: true,
      produit: { mousquets: 0.7, poudre: 0.7, biscuits: 0.8 },
      demande: { sucre: 1.5, epices: 1.6, fruitsvente: 1.8, soie: 1.4, sel: 1.5, perles: 1.5, vanille: 1.6 },
      interdits: ["tabac", "rhum", "fauxsel", "perlesnoires"],
      services: ["reparation", "recrutement", "chantier", "coffre", "taverne"], ameliorations: ["coque", "lanterne"],
      description: "Siège du Grand Fanal, le plus vieux phare de l'archipel. Ville austère et très surveillée." },

    { id: "vasque", nom: "Comptoir de Vasque", x: 76, y: 40, faction: "couronne", climat: "tropical", connue: true, cachee: false,
      danger: 0.25, surveillance: 0.4, marche: true,
      produit: { epices: 0.6, soie: 0.65, porcelaine: 0.7, sel: 0.5 },
      demande: { bois: 1.5, rhum: 1.4, poisson: 1.4, corail: 1.5, perles: 1.3 },
      interdits: ["mousquets", "fauxsel", "perlesnoires"],
      services: ["reparation", "coffre", "taverne"], ameliorations: ["baches"],
      description: "Salines royales et entrepôts immenses. Tout s'y achète, tout y est taxé." },

    { id: "lunebaie", nom: "Lunebaie", x: 40, y: 78, faction: "etoile", climat: "tropical", connue: true, cachee: false,
      danger: 0.2, surveillance: 0.15, marche: true,
      produit: { sucre: 0.6, rhum: 0.6, fruitsvente: 0.5, fruits: 0.7, fauxsel: 0.55 },
      demande: { mousquets: 1.6, porcelaine: 1.5, poudre: 1.4, perlesnoires: 1.5, vanille: 1.4 },
      interdits: [],
      services: ["reparation", "recrutement", "taverne"], ameliorations: [],
      description: "Port franc aux mille quais et aux mille tavernes, capitale officieuse de l'Étoile Noire." },

    { id: "sternes", nom: "Île aux Sternes", x: 14, y: 104, faction: "etoile", climat: "tropical", connue: false, cachee: false,
      danger: 0.3, surveillance: 0.1, marche: true,
      produit: { poisson: 0.5, tabac: 0.55, bois: 0.7, fauxsel: 0.6 },
      demande: { biscuits: 1.5, sucre: 1.3, epices: 1.5 },
      interdits: [],
      services: ["taverne"], ameliorations: [],
      description: "Îlot d'oiseaux et de guano. Repaire de contrebandiers face au premier passage du Reflux." },

    { id: "criquenoire", nom: "La Crique Noire", x: 82, y: 96, faction: "naufrageurs", climat: "tropical", connue: false, cachee: true,
      danger: 0.5, surveillance: 0.0, marche: true,
      produit: { lingots: 0.75, rhum: 0.8 },
      demande: { mousquets: 2.0, poudre: 1.8, tabac: 1.6, soie: 1.5, sel: 1.4, perlesnoires: 1.6, corail: 1.4 },
      interdits: [],
      services: ["reparation", "recrutement", "taverne"], ameliorations: ["cachette"],
      description: "Crique cernée de récifs, avec de faux feux allumés sur les falaises." },

    { id: "pendu", nom: "Île du Pendu", x: 58, y: 124, faction: "aucune", climat: "tropical", connue: false, cachee: true,
      danger: 0.6, surveillance: 0.0, marche: false,
      produit: {}, demande: {}, interdits: [],
      services: [], ameliorations: [], evenementArrivee: "fouille_tresor",
      description: "Île longtemps noyée dans la Brume. Ruines anciennes, gibet sans explication." },

    // ===== Région 2 : l'Archipel de Nacre (au sud de la Brume, accessible après la Passe) =====
    { id: "portroyal", nom: "Port-Royal", x: 36, y: 176, faction: "couronne", climat: "tropical", connue: false, cachee: false,
      danger: 0.3, surveillance: 0.7, marche: true,
      produit: { poudre: 0.8, mousquets: 0.85, biscuits: 0.9 },
      demande: { bois: 2.2, sel: 1.7, biscuits: 1.3, soie: 1.6, porcelaine: 1.5 },
      interdits: ["perlesnoires", "fauxsel", "tabac"],
      services: ["reparation", "chantier", "coffre", "taverne", "recrutement"], ameliorations: ["baches"],
      description: "Fort, chantier et palais du Vice-Roi des Perles. La Couronne y règne sur les atolls." },

    { id: "perliere", nom: "La Perlière", x: 70, y: 186, faction: "couronne", climat: "tropical", connue: false, cachee: false, forme: "atoll",
      danger: 0.3, surveillance: 0.5, marche: true,
      produit: { perles: 0.6, coprah: 0.7 },
      demande: { fruits: 1.6, rhum: 1.7, biscuits: 1.5, sel: 1.5 },
      interdits: ["perlesnoires"],
      services: ["taverne"], ameliorations: [],
      description: "Atoll des pêcheries royales, où des plongeurs coralins travaillent sous contrat." },

    { id: "anneau", nom: "L'Anneau des Mille Pirogues", nomCarte: "Mille Pirogues", x: 18, y: 206, faction: "coralins", climat: "tropical", connue: false, cachee: false, forme: "atoll",
      danger: 0.25, surveillance: 0.05, marche: true,
      produit: { corail: 0.5, vanille: 0.5, coprah: 0.5, fruits: 0.6 },
      demande: { lingots: 1.7, sel: 1.9, bois: 1.8, poudre: 1.3 },
      interdits: [],
      services: ["reparation", "recrutement", "taverne"], ameliorations: [],
      description: "Village sur pilotis au milieu d'un immense lagon. Les Coralins y vivent depuis toujours." },

    { id: "lagonnoir", nom: "Le Lagon Noir", x: 86, y: 222, faction: "etoile", climat: "tropical", connue: false, cachee: true, forme: "atoll",
      danger: 0.55, surveillance: 0.0, marche: true,
      produit: { perlesnoires: 0.6 },
      demande: { mousquets: 1.8, poudre: 1.6, tabac: 1.7, fauxsel: 1.6, rhum: 1.4 },
      interdits: [],
      services: ["reparation", "taverne"], ameliorations: ["cachette"],
      description: "Atoll caché, repaire des contrebandiers de perles de l'Étoile Noire." },

    { id: "recif", nom: "Le Récif du Silence", nomCarte: "Récif du Silence", x: 52, y: 232, faction: "aucune", climat: "tropical", connue: false, cachee: true,
      danger: 0.65, surveillance: 0.0, marche: false,
      produit: {}, demande: {}, interdits: [],
      services: [], ameliorations: [], evenementArrivee: "la_tour", repeterTantQue: "tour",
      description: "Ruines des Bâtisseurs à demi noyées. Une tour de pierre noire jaillit du lagon." }
  ],

  /* ------------------------------------------------------------------
     SALLES DU NAVIRE
     Chaque marin se trouve dans une salle. Une compétence ne compte que dans les salles
     qui la fournissent, avec le multiplicateur indiqué (1 = 100 %, 0.5 = 50 %).
     competences : { idCompetence: multiplicateur }
     action      : "soin"  = les marins sans compétence de médecine y sont patients (ne travaillent pas, guérissent vite)
                   "repos" = les occupants se reposent (ne travaillent pas, santé et moral remontent)
     critique    : true = contour rouge si la salle est vide
     ------------------------------------------------------------------ */
  salles: {
    types: [
      { id: "pont",       nom: "Pont",       icone: "🧭", critique: true, competences: { navigation: 1, vigie: 0.5, defense: 0.5 }, description: "Navigation à 100 %, vigie et défense à 50 %." },
      { id: "vigie",      nom: "Vigie",      icone: "🔭", competences: { vigie: 1 }, description: "Repère les dangers plus tôt : récifs, voiles hostiles, patrouilles." },
      { id: "coquerie",   nom: "Coquerie",   icone: "🍲", competences: { cuisine: 1 }, description: "Cuisine à 100 % : moral en hausse, vivres plus nourrissants." },
      { id: "infirmerie", nom: "Infirmerie", icone: "⚕️", competences: { medecine: 1 }, action: "soin", description: "Médecine à 100 %. Les autres marins placés ici sont patients : ils ne travaillent pas mais guérissent vite." },
      { id: "batterie",   nom: "Batterie",   icone: "💣", competences: { defense: 1 }, description: "Défense à 100 % avec les canons du navire." },
      { id: "dortoir",    nom: "Dortoir",    icone: "🛏️", action: "repos", description: "Les occupants se reposent : santé et moral remontent, mais ils ne travaillent pas." },
      { id: "cale",       nom: "Cale",       icone: "📦", competences: { arrimage: 1, charpente: 1 }, description: "Le maître d'arrimage protège la cargaison de CETTE cale ; le charpentier y colmate les voies d'eau." }
    ],
    rendements: [1, 0.5, 0.25],   // 1er, 2e, 3e marin (et suivants) qui apportent la même compétence dans une salle
    competencesGlobales: ["commerce"], // compétences qui comptent quelle que soit la salle
    soinPatientParJour: 6,        // santé gagnée par jour par un patient, x (1 + médecine de l'infirmerie)
    reposSanteParJour: 4,         // au dortoir
    reposMoralParJour: 4,
    infirmerieSousSante: 80       // après un événement, on propose d'emmener à l'infirmerie un blessé sous cette santé
  },

  /* ------------------------------------------------------------------
     TYPES DE CALE
     fondHumide   : true = la rangée du bas est humide
     toutVentile  : true = toutes les cases sont ventilées
     ventilation  : multiplicateur de pourriture dans les cases ventilées de cette cale (sinon cale.ventilation)
     accepte      : liste d'ids d'items acceptés (absent = tout)
     discretion   : chance qu'un item de contrebande rangé ici échappe à une inspection
     ------------------------------------------------------------------ */
  typesCale: [
    { id: "classique", nom: "Cale",           fondHumide: true,  description: "Fond de cale humide, quelques colonnes ventilées." },
    { id: "seche",     nom: "Cale sèche",     fondHumide: false, description: "Aucune humidité : idéale pour le sucre, le tabac, les épices." },
    { id: "ventilee",  nom: "Cale ventilée",  fondHumide: true,  toutVentile: true, ventilation: 0.4, description: "Entièrement ventilée : les périssables pourrissent bien moins vite." },
    { id: "soute",     nom: "Soute à poudre", fondHumide: false, accepte: ["poudre", "mousquets"], description: "Doublée de cuivre : seulement la poudre et les armes, à l'abri des incendies." },
    { id: "cachee",    nom: "Cale cachée",    fondHumide: false, discretion: 0.95, description: "Compartiment secret : la contrebande y est presque invisible." }
  ],

  /* ------------------------------------------------------------------
     NAVIRES
     chargeMax / vitesse / coqueMax / equipageMax / canons / emplacements / prix : comme avant
     nomParDefaut : nom donné au navire à l'achat (le joueur peut le renommer)
     silhouette   : dessin utilisé ("barque", "cotre", "goelette")
     couleurCoque : couleur de la bande peinte
     coupe        : taille de la vue en coupe (largeur 366) : hauteur, ligne du pont, bas de la quille
     salles       : liste des salles. x, y, l, h = rectangle dans la vue en coupe ; places = marins max.
                    Une cale porte "cale" : type (voir typesCale), colonnes, rangees,
                    colonnesVentilees (0 = poupe, à gauche), cachette (cases actives avec l'amélioration "cachette")
     ------------------------------------------------------------------ */
  navires: [
    { id: "barque", nom: "Barque", nomParDefaut: "La Coquille", silhouette: "barque", couleurCoque: "#6b6b3a",
      chargeMax: 20, vitesse: 9, coqueMax: 40, equipageMax: 1, canons: 0, emplacements: 1, prix: 0,
      coupe: { hauteur: 226, pont: 100, quille: 210 },
      salles: [
        { id: "pont", type: "pont", places: 1, x: 92, y: 54, l: 184, h: 44 },
        { id: "cale", type: "cale", places: 1, x: 118, y: 110, l: 132, h: 62,
          cale: { type: "classique", colonnes: 4, rangees: 2, colonnesVentilees: [1, 2], cachette: [[0, 1]] } }
      ] },

    { id: "cotre", nom: "Cotre", nomParDefaut: "Le Furet", silhouette: "cotre", couleurCoque: "#8a2f2f",
      chargeMax: 60, vitesse: 12, coqueMax: 100, equipageMax: 3, canons: 2, emplacements: 2, prix: 500,
      coupe: { hauteur: 310, pont: 140, quille: 294 },
      salles: [
        { id: "pont", type: "pont", places: 3, x: 62, y: 88, l: 236, h: 48 },
        { id: "coquerie", type: "coquerie", places: 1, x: 64, y: 150, l: 234, h: 56 },
        { id: "cale", type: "cale", places: 1, x: 86, y: 212, l: 194, h: 62,
          cale: { type: "classique", colonnes: 8, rangees: 4, colonnesVentilees: [3, 4], cachette: [[0, 3], [1, 3]] } }
      ] },

    { id: "goelette", nom: "Goélette", nomParDefaut: "La Mouette", silhouette: "goelette", couleurCoque: "#2f5d4e",
      requiert: { faction: "fanaux", reputation: 20 }, // en vente seulement si les Fanaux vous estiment assez
      chargeMax: 110, vitesse: 15, coqueMax: 160, equipageMax: 6, canons: 6, emplacements: 3, prix: 1800,
      coupe: { hauteur: 340, pont: 140, quille: 326 },
      salles: [
        { id: "vigie", type: "vigie", places: 1, x: 70, y: 4, l: 100, h: 48 },
        { id: "pont", type: "pont", places: 4, x: 36, y: 88, l: 290, h: 48 },
        { id: "coquerie", type: "coquerie", places: 1, x: 40, y: 150, l: 88, h: 64 },
        { id: "infirmerie", type: "infirmerie", places: 2, x: 134, y: 150, l: 98, h: 64 },
        { id: "seche", type: "cale", nom: "Cale sèche", places: 0, x: 238, y: 150, l: 90, h: 64,
          cale: { type: "seche", colonnes: 4, rangees: 2, colonnesVentilees: [], cachette: [] } },
        { id: "cale", type: "cale", nom: "Cale principale", places: 1, x: 62, y: 220, l: 236, h: 72,
          cale: { type: "classique", colonnes: 10, rangees: 4, colonnesVentilees: [4, 5], cachette: [[0, 3], [1, 3]] } }
      ] }
  ],

  /* ------------------------------------------------------------------
     AMÉLIORATIONS
     prix   : coût en or
     effet  : "cachette" (active le compartiment caché du navire)
              "baches"   (divise les dégâts d'eau par diviseurEau)
              "coque"    (ajoute bonusCoque à la coque max)
              "lanterne" (multiplie par "fantomes" la fréquence des événements fantômes)
     ------------------------------------------------------------------ */
  ameliorations: [
    { id: "cachette", nom: "Compartiment caché", prix: 250, effet: "cachette", description: "La contrebande rangée dans les cases marquées 🗝️ échappe presque toujours aux inspections." },
    { id: "baches",   nom: "Bâches goudronnées", prix: 140, effet: "baches", diviseurEau: 2, description: "Les dégâts d'eau sont divisés par 2." },
    { id: "coque",    nom: "Coque renforcée",    prix: 220, effet: "coque", bonusCoque: 40, description: "+40 points de coque maximum." },
    { id: "lanterne", nom: "Lanterne bénie",     prix: 180, effet: "lanterne", fantomes: 0.5, description: "Un Feu blanc béni par les Fanaux : deux fois moins de navires fantômes, et un moyen de les repousser." }
  ],

  /* ------------------------------------------------------------------
     RÔLES DE L'ÉQUIPAGE
     Chaque rôle donne une "compétence" utilisée par les tests des événements.
     Un marin donne 1 point dans son rôle principal, "efficaciteSecondaire" dans son rôle secondaire,
     multiplié par son état (santé et moral).
     ------------------------------------------------------------------ */
  roles: {
    efficaciteSecondaire: 0.5,
    liste: [
      { id: "capitaine",  nom: "Capitaine",          competence: "commerce",   description: "Meilleurs prix, négociation, réduit les inspections." },
      { id: "navigateur", nom: "Navigateur",         competence: "navigation", description: "Vitesse, révèle la carte, évite récifs et tempêtes." },
      { id: "arrimeur",   nom: "Maître d'arrimage",  competence: "arrimage",   description: "Réduit les dégâts à la cargaison." },
      { id: "charpentier",nom: "Charpentier",        competence: "charpente",  description: "Répare la coque en mer, colmate les voies d'eau." },
      { id: "cuisinier",  nom: "Cuisinier",          competence: "cuisine",    description: "Moral et santé grâce aux repas." },
      { id: "chirurgien", nom: "Chirurgien",         competence: "medecine",   description: "Soigne blessures et maladies." },
      { id: "canonnier",  nom: "Canonnier",          competence: "defense",    description: "Défense face aux navires hostiles." },
      { id: "vigie",      nom: "Vigie",              competence: "vigie",      description: "Repère les dangers plus tôt." }
    ]
  },

  /* ------------------------------------------------------------------
     MARINS (équipage de départ et recrues possibles)
     role / secondaire : ids de rôles
     traits            : ids de traits (voir "traits")
     portrait          : peau, cheveux, chapeau ("tricorne", "bandana", "aucun"), barbe (true/false)
     salaire           : or par jour passé en mer
     ------------------------------------------------------------------ */
  marins: [
    { id: "mara",    nom: "Mara Vélin",        role: "capitaine",  secondaire: "navigateur", traits: ["robuste"],        salaire: 0, portrait: { peau: "#c68b59", cheveux: "#2b1b10", chapeau: "tricorne", barbe: false } },
    { id: "bastien", nom: "Bastien Corde",     role: "arrimeur",   secondaire: "charpentier",traits: ["contrebandier"],  salaire: 2, portrait: { peau: "#e5b98f", cheveux: "#a0522d", chapeau: "bandana",  barbe: true } },
    { id: "jojo",    nom: "Jojo Marmite",      role: "cuisinier",  secondaire: "chirurgien", traits: ["superstitieux"],  salaire: 2, portrait: { peau: "#8d5a3b", cheveux: "#111111", chapeau: "aucun",    barbe: true } },
    // --- Recrues disponibles dans les tavernes ---
    { id: "ines",    nom: "Inès Longuevue",    role: "vigie",      secondaire: "navigateur", traits: [],                 salaire: 3, prixRecrutement: 60,  portrait: { peau: "#f1c9a5", cheveux: "#d9b26a", chapeau: "bandana",  barbe: false } },
    { id: "goran",   nom: "Goran Mèchecourte", role: "canonnier",  secondaire: "charpentier",traits: ["ivrogne"],        salaire: 3, prixRecrutement: 80,  portrait: { peau: "#d9a07a", cheveux: "#555555", chapeau: "aucun",    barbe: true } },
    { id: "salome",  nom: "Salomé Rebouteuse", role: "chirurgien", secondaire: "cuisinier",  traits: ["robuste"],        salaire: 3, prixRecrutement: 90,  portrait: { peau: "#7a4a2e", cheveux: "#3b2416", chapeau: "aucun",    barbe: false } },
    { id: "pietro",  nom: "Pietro Gouvernail", role: "navigateur", secondaire: "vigie",      traits: [],                 salaire: 4, prixRecrutement: 110, portrait: { peau: "#e8c39e", cheveux: "#1f1f1f", chapeau: "tricorne", barbe: true } },
    { id: "auguste", nom: "Auguste Rabot",     role: "charpentier",secondaire: "arrimeur",   traits: ["robuste"],        salaire: 3, prixRecrutement: 70,  portrait: { peau: "#b97a52", cheveux: "#8b8b8b", chapeau: "bandana",  barbe: true } },
    // --- Recrues coralines ("iles" : seulement dans ces tavernes) ---
    { id: "tiv",     nom: "Tiv Anneau-Clair",  role: "vigie",      secondaire: "navigateur", traits: ["robuste"],        salaire: 3, prixRecrutement: 90,  iles: ["anneau"], portrait: { peau: "#a8673f", cheveux: "#1b1209", chapeau: "aucun",    barbe: false } },
    { id: "sauge",   nom: "Sauge Lagon",       role: "chirurgien", secondaire: "vigie",      traits: [],                 salaire: 3, prixRecrutement: 100, iles: ["anneau"], portrait: { peau: "#8a5232", cheveux: "#2b1b10", chapeau: "bandana",  barbe: false } }
  ],

  /* ------------------------------------------------------------------
     TRAITS DES MARINS
     effets possibles : santeJour (+/- santé par jour), moralJour, maladie (multiplicateur de risque),
                        cachette (bonus de discrétion de la contrebande, 0 à 1), rhumParSemaine
     ------------------------------------------------------------------ */
  traits: [
    { id: "robuste",       nom: "Robuste",              description: "Tombe moins malade.",                       maladie: 0.5 },
    { id: "contrebandier", nom: "Ancien contrebandier", description: "La contrebande est mieux dissimulée.",      cachette: 0.25 },
    { id: "superstitieux", nom: "Superstitieux",        description: "Le moral chute davantage lors des drames.", moralDrame: 1.5 },
    { id: "ivrogne",       nom: "Ivrogne",              description: "Moral en baisse sans rhum à bord.",         moralJourSansRhum: -2 }
  ],

  /* ------------------------------------------------------------------
     ÉQUIPAGE : RÈGLES DES JAUGES (toutes de 0 à 100)
     ------------------------------------------------------------------ */
  equipage: {
    rationsParMarinParJour: 1,
    faimSante: -8,            // santé perdue par jour sans nourriture
    faimMoral: -12,           // moral perdu par jour sans nourriture
    scorbutApresJours: 12,    // jours sans vivres frais avant le scorbut
    scorbutSante: -4,         // santé perdue par jour de scorbut
    moralParJourEnMer: -1,    // usure du moral pendant les trajets
    moralCuisine: 2,          // moral gagné par jour par point de compétence "cuisine"
    cohesionParJourEnMer: 0.5,
    cohesionRecrue: -10,      // cohésion perdue à chaque recrutement
    soinParJour: 4,           // santé rendue par jour par point de compétence "medecine"
    reposPrix: 15,            // or pour un jour de repos au port
    reposSante: 20,
    reposMoral: 12,
    salaireImpayeMoral: -15,  // moral perdu si le salaire ne peut pas être payé
    desertionSousMoral: 15,   // en dessous, un marin peut déserter au port (jamais le dernier)
    chanceDesertion: 0.5
  },

  /* ------------------------------------------------------------------
     CALE ET CARGAISON
     ------------------------------------------------------------------ */
  cale: {
    seuilRalentissement: 0.8,   // au-delà de 80 % de charge, le navire ralentit
    ralentissementMax: 0.35,    // ralentissement à 100 % de charge
    surchargeVitesse: 0.5,      // multiplicateur de vitesse en surcharge
    surchargeDegats: 1.6,       // multiplicateur de dégâts en surcharge
    poidsFragile: 4,            // poids posé sur un item fragile à partir duquel il souffre davantage
    reductionArrimage: 0.3,     // dégâts réduits de 30 % par point de compétence "arrimage"
    ventilation: 0.5,           // multiplicateur de pourriture dans une colonne ventilée
    climatTropical: 1.3,        // multiplicateur de pourriture en climat tropical
    humiditeFondParJour: 1.5,   // état perdu par jour par un item "craintEau" posé au fond de cale
    desequilibreMax: 0.25,      // perte de vitesse maximale si toute la charge est d'un seul côté
    appuiCentre: true,          // true = le centre d'un item doit être au-dessus de ses appuis ; false = un seul point d'appui suffit
    degatsChuteParRangee: 10    // état perdu par un item fragile qui tombe, par rangée de chute
  },

  /* ------------------------------------------------------------------
     COMMERCE
     ------------------------------------------------------------------ */
  commerce: {
    margeAchat: 1.1,           // le joueur achète à prix x 1.1
    margeVente: 0.9,           // le joueur vend à prix x 0.9 x état
    prixContrebande: 2.2,      // un item interdit se revend x 2.2 au marché noir de l'île
    elasticite: 0.06,          // chaque unité achetée/vendue déplace le prix de 6 %
    retourParJour: 0.05,       // les prix reviennent de 5 % par jour vers la normale
    bonusCommerce: 0.06,       // prix améliorés de 6 % par point de compétence "commerce"
    reparationParPoint: 2,     // or par point de coque réparé
    reputationPrix: 0          // (remplacé par les paliers de réputation, voir "paliersReputation")
  },

  /* ------------------------------------------------------------------
     CONTREBANDE ET INSPECTIONS
     ------------------------------------------------------------------ */
  contrebande: {
    bonusCommerce: 0.15,       // inspection réduite de 15 % par point de "commerce"
    mefianceInspection: 0,     // (remplacé par les niveaux de méfiance, voir "mefiance")
    cachetteDiscretion: 0.85,  // chance qu'un item rangé dans la cachette ne soit pas trouvé
    discretionNormale: 0.15,   // chance qu'un item hors cachette ne soit pas trouvé
    amendeParValeur: 0.5,      // amende = valeur des items x 0.5 x sévérité de la faction
    reputationIle: -12,
    reputationFaction: -6,
    mefianceGain: 20,
    mefianceBaisseParJour: 1,  // la méfiance de chaque faction baisse de 1 point par jour
    potDeVin: 40,              // or proposé pour corrompre un inspecteur
    nuitInspection: 0.6        // les inspections à l'arrivée sont x 0.6 de nuit
  },

  /* ------------------------------------------------------------------
     RÉPUTATION (de -100 à 100, par île et par faction)
     ------------------------------------------------------------------ */
  reputation: {
    partageFaction: 0.5,       // une variation sur une île est répercutée à 50 % sur sa faction
    venteMarche: 0.2           // réputation gagnée sur l'île par 100 or de commerce
  },

  /* ------------------------------------------------------------------
     CONTRATS ALÉATOIRES (générés à chaque escale)
     ------------------------------------------------------------------ */
  contratsAleatoires: {
    parPort: 2,                // nombre de contrats proposés à chaque escale
    quantiteMin: 1,
    quantiteMax: 3,
    recompenseParValeur: 0.6,  // récompense = valeur de la marchandise x 0.6 ...
    recompenseParJour: 12,     // ... + 12 or par jour de trajet
    margeDelai: 1.6,           // délai = durée du trajet x 1.6 (+1 jour)
    etatMin: 60,               // état minimum à la livraison (%)
    reputation: 5,
    items: ["rhum", "sucre", "epices", "porcelaine", "poisson", "bois", "soie", "fruitsvente", "sel", "corail", "vanille", "coprah"] // items possibles
  },

  /* ------------------------------------------------------------------
     RÈGLES DES CONTRATS (aléatoires et quêtes)
     ------------------------------------------------------------------ */
  contrats: {
    retardPenaliteParJour: 0.15,  // récompense réduite de 15 % par jour de retard
    abandonApresRetard: 4,        // contrat échoué après 4 jours de retard
    reputationEchec: -8
  },

  /* ------------------------------------------------------------------
     QUÊTES ÉCRITES À LA MAIN
     type          : "livraison" (le client fournit la marchandise à livrer)
                     "decouverte" (révèle des îles, sans cargaison)
     origine       : île où la quête est proposée
     destination   : île où la livrer (livraison)
     item, quantite: marchandise fournie par le client
     delaiJours    : délai en jours de jeu
     etatMin       : état minimum (%) à la livraison
     recompense    : or ; reputation : points de réputation sur l'île de destination
     prerequis     : { reputationIle: { idIle: valeur minimum }, quetes: [ids terminées] }
     revele        : ids d'îles révélées sur la carte quand on accepte
     texte         : description affichée
     ------------------------------------------------------------------ */
  quetes: [
    { id: "q_premier_rhum", type: "livraison", titre: "Le rhum du Grand Gardien",
      origine: "lunebaie", destination: "hautegarde", item: "rhum", quantite: 2, delaiJours: 6, etatMin: 70,
      recompense: 220, reputation: 10, prerequis: {},
      texte: "Le Grand Gardien de Hautegarde réclame du rhum de Lunebaie pour la Fête des Feux. Le rhum est interdit chez les Fanaux… sauf pour lui. Ses inspecteurs, eux, ne sont pas au courant." },

    { id: "q_porcelaine", type: "livraison", titre: "Porcelaine pour la mariée",
      origine: "vasque", destination: "lunebaie", item: "porcelaine", quantite: 1, delaiJours: 7, etatMin: 85,
      recompense: 260, reputation: 12, prerequis: {},
      texte: "Une caisse de porcelaine fine pour un mariage à Lunebaie. Elle doit arriver intacte : rien de lourd par-dessus !" },

    { id: "q_rumeur_crique", type: "decouverte", titre: "La rumeur de la Crique Noire",
      origine: "sternes", recompense: 0, reputation: 0, prerequis: {},
      revele: ["criquenoire"],
      texte: "Un vieux pêcheur parle d'une crique où les Naufrageurs achètent armes et poudre sans poser de questions." },

    { id: "q_carte_pendu", type: "decouverte", titre: "La carte du Pendu",
      origine: "criquenoire", recompense: 0, reputation: 0, prerequis: {},
      revele: ["pendu"],
      texte: "Un naufrageur ivre vous vend un fragment de carte : une croix sur une île sortie de la Brume, que l'on dit maudite." },

    { id: "q_mousquets", type: "livraison", titre: "Armes pour les Naufrageurs",
      origine: "hautegarde", destination: "criquenoire", item: "mousquets", quantite: 2, delaiJours: 9, etatMin: 60,
      recompense: 480, reputation: 15, prerequis: { quetes: ["q_rumeur_crique"] },
      texte: "Un officier corrompu vous confie des mousquets à livrer discrètement à la Crique Noire." },

    { id: "q_epices_bal", type: "livraison", titre: "Des épices pour la Fête des Feux",
      origine: "vasque", destination: "hautegarde", item: "epices", quantite: 2, delaiJours: 7, etatMin: 80,
      recompense: 300, reputation: 12, prerequis: { quetes: ["q_premier_rhum"] },
      texte: "Ravi de son rhum, le Grand Gardien commande maintenant les épices du Comptoir de Vasque pour le banquet de la Fête des Feux." },

    { id: "q_soie_robe", type: "livraison", titre: "Soie pour la robe",
      origine: "vasque", destination: "lunebaie", item: "soie", quantite: 2, delaiJours: 8, etatMin: 85,
      recompense: 320, reputation: 12, prerequis: { quetes: ["q_porcelaine"] },
      texte: "La mariée de Lunebaie veut une robe de soie : deux rouleaux, impeccables. La soie craint l'eau !" },

    // ----- La Passe du Sud (ouvre l'Archipel de Nacre) -----
    { id: "q_rumeur_passe", type: "decouverte", titre: "La rumeur de la Passe",
      origine: "sternes", recompense: 0, reputation: 0, prerequis: {}, revele: [], legende: "passe",
      texte: "Un passeur édenté jure qu'un chemin s'est ouvert dans la Brume, droit au sud. La Couronne l'emprunte déjà ; l'Étoile Noire aussi. Il faut une carte de la Passe." },
    { id: "q_lettre_passage", type: "livraison", titre: "La lettre de passage",
      origine: "vasque", destination: "hautegarde", item: "porcelaine", quantite: 1, delaiJours: 8, etatMin: 80,
      recompense: 150, reputation: 8, prerequis: { quetes: ["q_rumeur_passe"], reputationFaction: { couronne: 15 } },
      exclusif: "passe", ouvrePassage: true, revele: ["portroyal"],
      texte: "La Couronne vous délivre une lettre de passage… qu'il faut faire viser par les Fanaux, gardiens des cartes. Portez ce présent au Grand Gardien : il signera la carte de la Passe." },
    { id: "q_passeurs", type: "livraison", titre: "La carte des passeurs",
      origine: "lunebaie", destination: "sternes", item: "fauxsel", quantite: 3, delaiJours: 6, etatMin: 60,
      recompense: 120, reputation: 8, prerequis: { quetes: ["q_rumeur_passe"] },
      exclusif: "passe", ouvrePassage: true, revele: ["portroyal"],
      texte: "Séraphin Minuit veut bien vous confier la carte de ses passeurs… si vous livrez trois sacs de faux-sel à son repaire de l'Île aux Sternes. Sans poser de questions." },

    // ----- L'Archipel de Nacre ("passage: true" = seulement après la Passe) -----
    { id: "q_bois_fort", type: "livraison", titre: "Du bois pour le fort",
      origine: "sternes", destination: "portroyal", item: "bois", quantite: 2, delaiJours: 12, etatMin: 60,
      recompense: 520, reputation: 12, prerequis: { passage: true },
      texte: "Les atolls n'ont pas de forêts. Le Vice-Roi paie une fortune pour du bois des Hauts-Fonds : son fort tombe en ruine sous les termites." },
    { id: "q_perles_vice_roi", type: "livraison", titre: "Les perles du Vice-Roi",
      origine: "perliere", destination: "portroyal", item: "perles", quantite: 2, delaiJours: 5, etatMin: 90,
      recompense: 420, reputation: 12, prerequis: { quetes: ["q_bois_fort"] },
      texte: "Le Vice-Roi croit avoir perdu une perle de sa cape. Il en exige deux nouvelles, parfaites, avant le prochain bal." },
    { id: "q_sel_anneau", type: "livraison", titre: "Le sel des Coralins",
      origine: "vasque", destination: "anneau", item: "sel", quantite: 3, delaiJours: 14, etatMin: 70,
      recompense: 380, reputation: 14, prerequis: { passage: true },
      texte: "Les Coralins salent leur poisson, mais la Couronne leur refuse le sel. La Vieille Anémone paiera bien… sans le dire au Vice-Roi." },
    { id: "q_rumeur_recif", type: "decouverte", titre: "Le corail qui se tait",
      origine: "anneau", recompense: 0, reputation: 0, prerequis: {},
      revele: ["recif"],
      texte: "La Vieille Anémone parle d'un récif où le corail ne chante plus, et d'une tour qui monte de l'eau. Elle trace pour vous le chemin sur une feuille de palme." },
    { id: "q_rumeur_lagon", type: "decouverte", titre: "Le nom du Lagon Noir",
      origine: "perliere", recompense: 0, reputation: 0, prerequis: {},
      revele: ["lagonnoir"],
      texte: "Une plongeuse à l'œil de perle noire vous glisse un nom à l'oreille, et un relevé de cap : le Lagon Noir." }
  ],

  /* ------------------------------------------------------------------
     ÉVÉNEMENTS
     icone / theme : illustration de la fenêtre ("orage", "mer", "danger", "autorite", "tresor", "fantome")
     fantome       : true = navire fantôme (moins fréquent avec la lanterne bénie ou le pacte des Naufrageurs)
     legende       : id de légende débloquée quand l'événement a lieu
     condition     : "pageAlienor" = seulement s'il reste une page du journal d'Aliénor à trouver
     region        : id de région (voir "regions") : seulement en mer dans cette région
     chanceParJour : probabilité de base par jour de trajet (multipliée par le danger de la route)
     nuitSeulement : true = seulement de nuit
     condition     : "contrebande" = seulement si la cale contient un item interdit chez cette faction (patrouille)
     cible         : salle touchée par l'événement : "cale" (une cale au hasard) ou un type de salle ("coquerie"…).
                     L'événement n'a lieu que si le navire possède cette salle. "{salle}" dans les textes = son nom.
     choix         : liste de choix proposés au joueur
       test        : { competence: id, base: chance de base, parPoint: chance gagnée par point de compétence }
                     (sans test = réussite automatique)
       envoi       : { salle: "cible" ou un type de salle, competence: id } = le joueur choisit UN marin à envoyer.
                     La réussite dépend alors de la compétence de ce marin (pas de toute la salle).
                     Le marin reste dans la salle si elle a de la place, sinon il y va le temps de la manœuvre.
       requiert    : type de salle nécessaire pour proposer ce choix (ex. "vigie")
       requiertAmelio : id d'amélioration nécessaire pour proposer ce choix (ex. "lanterne")
       succes / echec : effets appliqués
     EFFETS possibles :
       coque (+/-), choc (intensité des dégâts aux fragiles), eau (intensité des dégâts d'eau),
       moral (+/- à tous), sante (+/- à tous), cohesion (+/-), or (+/-), orPourcent (- % de l'or à bord),
       jours (jours de trajet en plus), jeter (fraction de la cargaison perdue, 0 à 1),
       gagner: [idItem, quantité], blesse (santé perdue par un marin au hasard),
       inspection: id de faction (déclenche une inspection), texte (message affiché),
       eauCible / chocCible : comme eau / choc, mais seulement dans la salle ciblée,
       blesseEnvoye : santé perdue par le marin envoyé, coqueCible : comme coque,
       legende : id de légende débloquée, ou "page" (prochaine page du journal d'Aliénor),
       repFaction : [idFaction, points], stat : statistique augmentée de 1 (ex. "tour").
     Après un événement, un marin blessé peut être conduit à l'infirmerie (si le navire en a une).
     ------------------------------------------------------------------ */
  evenements: [
    { id: "tempete", titre: "Tempête !", icone: "⛈️", theme: "orage", chanceParJour: 0.12,
      texte: "Le ciel noircit, la houle se lève. Une tempête fond sur le navire.",
      choix: [
        { texte: "Affronter la tempête", test: { competence: "navigation", base: 0.45, parPoint: 0.3 },
          succes: { choc: 10, eau: 5, moral: 3, texte: "Le navire tient bon. Quelques caisses ont été secouées." },
          echec:  { choc: 30, eau: 20, coque: -25, blesse: 20, moral: -8, texte: "Des vagues énormes balaient le pont. La cale est en désordre." } },
        { texte: "Contourner (1 jour de plus)", test: { competence: "navigation", base: 0.7, parPoint: 0.2 },
          succes: { jours: 1, texte: "Vous évitez le cœur de la tempête." },
          echec:  { jours: 1, choc: 15, eau: 10, coque: -10, texte: "Le détour ne suffit pas : la tempête vous rattrape." } },
        { texte: "Jeter du lest par-dessus bord", test: null,
          succes: { jeter: 0.25, choc: 5, texte: "Le navire allégé file dans la tempête, mais une partie de la cargaison est perdue." } }
      ] },

    { id: "calme", titre: "Calme plat", icone: "🌫️", theme: "mer", chanceParJour: 0.06,
      texte: "Plus un souffle de vent. Les voiles pendent.",
      choix: [
        { texte: "Attendre le vent (1 à 2 jours)", test: { competence: "navigation", base: 0.5, parPoint: 0.3 },
          succes: { jours: 1, texte: "Le vent revient au bout d'une journée." },
          echec:  { jours: 2, moral: -6, texte: "Deux jours d'attente sous un soleil de plomb." } },
        { texte: "Ramer", test: null,
          succes: { sante: -6, moral: -4, texte: "L'équipage rame jusqu'au retour du vent. Épuisant." } }
      ] },

    { id: "recif", titre: "Récif en vue", icone: "🪨", theme: "danger", chanceParJour: 0.07,
      texte: "Des rochers affleurent juste devant la proue.",
      choix: [
        { texte: "Manœuvrer entre les rochers", test: { competence: "vigie", base: 0.4, parPoint: 0.35 },
          succes: { texte: "Le navire glisse entre les récifs sans une égratignure." },
          echec:  { coque: -20, choc: 20, eau: 15, texte: "Un raclement sinistre : la coque a touché." } },
        { texte: "Envoyer un marin guider depuis la vigie", requiert: "vigie", envoi: { salle: "vigie", competence: "vigie" },
          test: { competence: "vigie", base: 0.45, parPoint: 0.45 },
          succes: { texte: "Depuis le nid-de-pie, la passe est limpide : vous la franchissez sans heurt." },
          echec:  { coque: -12, choc: 12, texte: "Les indications arrivent trop tard : la coque frotte le récif." } },
        { texte: "Faire un large détour (1 jour)", test: null,
          succes: { jours: 1, texte: "Prudence est mère de sûreté." } }
      ] },

    { id: "voie_eau", titre: "Voie d'eau !", icone: "💦", theme: "mer", chanceParJour: 0.05, cible: "cale",
      texte: "De l'eau monte dans la {salle} !",
      choix: [
        { texte: "Envoyer quelqu'un colmater la brèche", envoi: { salle: "cible", competence: "charpente" },
          test: { competence: "charpente", base: 0.3, parPoint: 0.6 },
          succes: { eauCible: 5, texte: "La brèche est colmatée à temps." },
          echec:  { eauCible: 30, coque: -15, blesseEnvoye: 10, texte: "Le temps de colmater, la cale a pris l'eau et le marin s'est blessé." } },
        { texte: "Pomper tous ensemble", test: null,
          succes: { eauCible: 15, sante: -4, texte: "L'équipage pompe sans relâche." } }
      ] },

    { id: "incendie", titre: "Le feu à bord !", icone: "🔥", theme: "danger", chanceParJour: 0.03, cible: "coquerie",
      texte: "Le fourneau s'est renversé : la {salle} prend feu !",
      choix: [
        { texte: "Envoyer quelqu'un étouffer les flammes", envoi: { salle: "cible", competence: "cuisine" },
          test: { competence: "cuisine", base: 0.35, parPoint: 0.5 },
          succes: { coque: -3, texte: "Le feu est étouffé sous des couvertures mouillées." },
          echec:  { coque: -18, blesseEnvoye: 25, moral: -6, texte: "Les flammes lèchent le pont avant d'être maîtrisées. Le marin est brûlé." } },
        { texte: "Faire la chaîne avec des seaux", test: null,
          succes: { coque: -8, sante: -3, texte: "Tout l'équipage se relaie : le feu s'éteint, la coquerie est noircie." } }
      ] },

    { id: "homme_mer", titre: "Un homme à la mer !", icone: "🛟", theme: "orage", chanceParJour: 0.03,
      texte: "Une lame balaie le pont : un marin passe par-dessus bord !",
      choix: [
        { texte: "Envoyer quelqu'un le repérer et lancer un cordage", envoi: { salle: "pont", competence: "vigie" },
          test: { competence: "vigie", base: 0.5, parPoint: 0.4 },
          succes: { moral: 4, cohesion: 4, texte: "Le cordage arrive pile : on le hisse à bord, trempé mais vivant." },
          echec:  { blesse: 30, moral: -6, texte: "Il faut de longues minutes pour le repêcher. Il est en piteux état." } },
        { texte: "Virer de bord et le repêcher (1 jour)", test: null,
          succes: { jours: 1, blesse: 10, texte: "La manœuvre prend du temps, mais il est sauf." } }
      ] },

    { id: "hostile", titre: "Voile hostile", icone: "🏴‍☠️", theme: "danger", chanceParJour: 0.07,
      texte: "Un navire pavillon noir change de cap pour vous intercepter.",
      choix: [
        { texte: "Fuir", test: { competence: "navigation", base: 0.4, parPoint: 0.3 },
          succes: { texte: "Vous les semez à la faveur du vent." },
          echec:  { orPourcent: 30, jeter: 0.3, moral: -10, texte: "Ils vous rattrapent et pillent une partie de la cale." } },
        { texte: "Se défendre", test: { competence: "defense", base: 0.25, parPoint: 0.3 },
          succes: { moral: 10, cohesion: 5, or: 40, texte: "Vos canons les repoussent ! Vous récupérez un peu de butin." },
          echec:  { coque: -30, blesse: 30, jeter: 0.3, moral: -12, texte: "Le combat tourne mal. Ils repartent avec une partie de la cargaison." } },
        { texte: "Négocier un passage", test: { competence: "commerce", base: 0.35, parPoint: 0.4 },
          succes: { orPourcent: 10, texte: "Quelques pièces suffisent à les convaincre." },
          echec:  { orPourcent: 40, texte: "Ils exigent bien plus que prévu." } }
      ] },

    { id: "patrouille", titre: "Patrouille des Fanaux", icone: "⚓", theme: "autorite", chanceParJour: 0.08, condition: "contrebande", faction: "fanaux",
      texte: "Une frégate des Fanaux, lanterne blanche au mât, vous fait signe de mettre en panne pour une inspection.",
      choix: [
        { texte: "Accepter l'inspection", test: null,
          succes: { inspection: "fanaux" } },
        { texte: "Tenter de fuir", test: { competence: "navigation", base: 0.3, parPoint: 0.3 },
          succes: { texte: "Vous disparaissez dans la brume." },
          echec:  { coque: -15, inspection: "fanaux", texte: "Un boulet dans la coque vous force à vous arrêter." } }
      ] },

    { id: "epave", titre: "Épave à la dérive", icone: "🛟", theme: "mer", chanceParJour: 0.05,
      texte: "Les restes d'un navire marchand flottent à quelques encablures.",
      choix: [
        { texte: "Fouiller l'épave", test: { competence: "vigie", base: 0.55, parPoint: 0.2 },
          succes: { gagner: ["epices", 1], texte: "Vous repêchez une caisse d'épices intacte !" },
          echec:  { blesse: 15, texte: "Un marin se blesse dans les débris. Rien à récupérer." } },
        { texte: "Passer son chemin", test: null, succes: { texte: "Mieux vaut ne pas traîner." } }
      ] },

    { id: "maladie", titre: "Fièvre à bord", icone: "🤒", theme: "danger", chanceParJour: 0.04,
      texte: "Un marin grelotte de fièvre.",
      choix: [
        { texte: "Le soigner", test: { competence: "medecine", base: 0.4, parPoint: 0.45 },
          succes: { texte: "La fièvre tombe en deux jours." },
          echec:  { blesse: 35, moral: -5, texte: "La fièvre s'aggrave." } },
        { texte: "L'isoler et prier", test: { competence: "medecine", base: 0.3, parPoint: 0.2 },
          succes: { moral: -2, texte: "Il s'en remet, par miracle." },
          echec:  { sante: -10, moral: -8, texte: "La fièvre se propage à tout l'équipage." } }
      ] },


    // --- Le fantastique (voir "legendes") ---
    { id: "amiral_os", titre: "La Dernière Marée", icone: "💀", theme: "fantome", chanceParJour: 0.03, nuitSeulement: true, fantome: true, legende: "amiral_os",
      texte: "Un trois-mâts aux voiles en lambeaux sort de la brume. À la barre, un squelette en habit d'amiral soulève poliment son tricorne : « Le péage, je vous prie. En âmes ou en or. »",
      choix: [
        { texte: "Brandir la lanterne bénie", requiertAmelio: "lanterne", test: null,
          succes: { moral: 8, texte: "Le Feu blanc aveugle l'équipage fantôme. La Dernière Marée vire de bord dans un long gémissement." } },
        { texte: "Payer le péage", test: null,
          succes: { orPourcent: 15, texte: "L'Amiral d'Os compte les pièces une à une, vous remercie, et s'efface dans la brume." } },
        { texte: "Fuir à toutes voiles", test: { competence: "navigation", base: 0.35, parPoint: 0.3 },
          succes: { texte: "Le vent tourne en votre faveur : la Dernière Marée disparaît derrière vous." },
          echec:  { coque: -20, blesse: 20, moral: -12, texte: "Des mains d'os s'agrippent au bastingage avant que vous ne parveniez à vous dégager." } },
        { texte: "Lui proposer une partie de dés", test: { competence: "commerce", base: 0.3, parPoint: 0.35 },
          succes: { or: 60, moral: 8, texte: "L'Amiral perd avec élégance et vous laisse une bourse de pièces anciennes." },
          echec:  { orPourcent: 25, moral: -6, texte: "L'Amiral triche, évidemment. Il repart avec un quart de votre or." } }
      ] },

    { id: "feux_verts", titre: "Des feux sur la côte", icone: "🟢", theme: "fantome", chanceParJour: 0.04, nuitSeulement: true, legende: "feux_morts",
      texte: "Des lueurs vertes dansent sur une falaise, comme les feux d'un port. Les anciens marmonnent : ce sont les feux des Naufrageurs.",
      choix: [
        { texte: "Envoyer quelqu'un guetter les récifs", envoi: { salle: "pont", competence: "vigie" },
          test: { competence: "vigie", base: 0.45, parPoint: 0.4 },
          succes: { moral: 4, texte: "Votre vigie repère les brisants à temps. Vous passez au large des faux feux." },
          echec:  { coque: -20, choc: 30, blesseEnvoye: 10, texte: "Le navire racle les récifs avant de se dégager." } },
        { texte: "Faire un long détour (1 jour)", test: null,
          succes: { jours: 1, texte: "Mieux vaut un jour de perdu qu'une coque éventrée." } }
      ] },

    { id: "perseverance", titre: "Une voile dans la Brume", icone: "👻", theme: "fantome", chanceParJour: 0.025, nuitSeulement: true, fantome: true, condition: "pageAlienor",
      texte: "Une goélette pâle glisse sans bruit à la lisière de la Brume. Sur sa poupe, à peine lisible : « Persévérance ». Un équipage de spectres s'affaire en silence.",
      choix: [
        { texte: "La suivre et l'approcher", test: { competence: "navigation", base: 0.4, parPoint: 0.3 },
          succes: { legende: "page", moral: -4, texte: "Le temps d'un battement de cœur, vous frôlez son bastingage. Une page de journal reste entre vos doigts." },
          echec:  { jours: 1, moral: -8, texte: "Elle se dissout dans la brume. Vous perdez une journée à la chercher." } },
        { texte: "Détourner les yeux et passer", test: null,
          succes: { moral: -2, texte: "Personne à bord n'ose en parler." } }
      ] },

    // --- La Brume et l'Archipel de Nacre ("region" : seulement en mer dans cette région) ---
    { id: "traversee", titre: "Dans la Brume", icone: "🌫️", theme: "fantome", chanceParJour: 0, legende: "nacre_brume",
      texte: "Le brouillard se referme sur le navire. Le compas tourne sur lui-même et l'on entend chanter sous la coque. Votre carte de la Passe tremble dans vos mains.",
      choix: [
        { texte: "Suivre la carte, cap au sud", test: { competence: "navigation", base: 0.5, parPoint: 0.3 },
          succes: { moral: 6, texte: "Le chant s'éloigne. Devant vous, la Brume s'ouvre sur des lagons turquoise." },
          echec:  { jours: 2, moral: -10, coque: -10, texte: "Vous tournez en rond deux jours durant, avant que la Brume ne vous recrache enfin au sud." } },
        { texte: "Envoyer quelqu'un guetter les récifs", envoi: { salle: "pont", competence: "vigie" }, test: { competence: "vigie", base: 0.45, parPoint: 0.4 },
          succes: { moral: 4, texte: "Une voix crie « Récif ! » juste à temps. Vous vous faufilez entre deux murs de corail." },
          echec:  { choc: 25, coque: -15, blesseEnvoye: 10, texte: "La coque racle le corail. Vous passez, mais de justesse." } }
      ] },

    { id: "cyclone", titre: "Cyclone sur les lagons", icone: "🌀", theme: "orage", chanceParJour: 0.05, region: "nacre",
      texte: "Le ciel vire au vert. Un cyclone se forme et fond sur les atolls.",
      choix: [
        { texte: "Fuir le bord du cyclone", test: { competence: "navigation", base: 0.35, parPoint: 0.35 },
          succes: { texte: "Vous longez la tempête sans y entrer." },
          echec:  { coque: -25, eau: 35, choc: 30, moral: -8, texte: "Le cyclone vous happe. La cale est sens dessus dessous." } },
        { texte: "S'abriter dans un lagon (1 jour)", test: null,
          succes: { jours: 1, eau: 10, texte: "À l'abri du corail, vous laissez passer la tempête." } }
      ] },

    { id: "pirogues", titre: "Des pirogues à l'horizon", icone: "🛶", theme: "mer", chanceParJour: 0.05, region: "nacre",
      texte: "Une flottille de pirogues coralines vient à votre rencontre. On vous tend des gousses de vanille, en échange de quelques pièces.",
      choix: [
        { texte: "Échanger (30 or)", test: null,
          succes: { or: -30, gagner: ["vanille", 2], repFaction: ["coralins", 3], texte: "Les Coralins repartent en chantant. La vanille embaume la cale." } },
        { texte: "Les saluer et passer", test: null,
          succes: { texte: "Les pirogues s'éloignent aussi vite qu'elles sont venues." } }
      ] },

    { id: "plongeur", titre: "Un plongeur en détresse", icone: "🤿", theme: "orage", chanceParJour: 0.04, region: "nacre",
      texte: "Un plongeur coralin se débat au milieu des ailerons. Son panier de perles lui glisse des mains.",
      choix: [
        { texte: "Envoyer quelqu'un lui lancer un cordage", envoi: { salle: "pont", competence: "vigie" }, test: { competence: "vigie", base: 0.5, parPoint: 0.35 },
          succes: { repFaction: ["coralins", 6], moral: 5, texte: "Vous le hissez à bord. Il vous remercie dans une langue chantante, et vous jure amitié." },
          echec:  { blesseEnvoye: 20, repFaction: ["coralins", 2], texte: "Vous le sauvez, mais votre marin y laisse un bout de mollet." } },
        { texte: "Passer son chemin", test: null,
          succes: { moral: -6, repFaction: ["coralins", -5], texte: "L'équipage détourne les yeux. Les Coralins, eux, ne l'oublieront pas." } }
      ] },

    { id: "la_tour", titre: "La tour du Récif", icone: "🗼", theme: "fantome", chanceParJour: 0, legende: "tour",
      texte: "Une tour de pierre noire jaillit du lagon, plus haute que le Grand Fanal : exactement le dessin du journal d'Aliénor. Tout en haut, une lumière brille encore.",
      choix: [
        { texte: "Grimper jusqu'au sommet", test: { competence: "vigie", base: 0.45, parPoint: 0.35 },
          succes: { stat: "tour", legende: "page4", gagner: ["coffre", 1], moral: 10, texte: "Au sommet, une lanterne froide et, coincée dessous, une page de l'écriture d'Aliénor. L'encre est encore fraîche. Dans une niche, un coffre des Bâtisseurs." },
          echec:  { blesse: 30, moral: -10, texte: "Une marche cède sous vos pieds. Le blessé jure avoir vu une silhouette en haut. Vous redescendez… pour cette fois." } },
        { texte: "Repartir, ce lieu est maudit", test: null,
          succes: { moral: -4, texte: "La lumière vous suit des yeux jusqu'à l'horizon." } }
      ] },

    // --- Événement d'arrivée (déclenché par "evenementArrivee" d'une île) ---
    { id: "fouille_tresor", titre: "La croix du Pendu", icone: "💀", theme: "tresor", chanceParJour: 0,
      texte: "La carte indique un vieux gibet au sommet de l'île. L'équipage débarque avec des pelles.",
      choix: [
        { texte: "Creuser sous le gibet", test: { competence: "navigation", base: 0.55, parPoint: 0.25 },
          succes: { gagner: ["coffre", 1], legende: "page", moral: 20, cohesion: 10, texte: "Les pelles heurtent du bois : un coffre plein d'or ! Sous le couvercle, une page de journal soigneusement pliée. Il faut faire de la place dans la cale." },
          echec:  { blesse: 25, moral: -10, texte: "Un éboulement ! Le coffre reste introuvable… pour cette fois." } },
        { texte: "Repartir, l'île est maudite", test: null, succes: { moral: -5, texte: "Les superstitieux soufflent de soulagement." } }
      ] }
  ],

  /* ------------------------------------------------------------------
     PALIERS DE RÉPUTATION (par île). Chaque palier commence à "min" (de −100 à 100).
     effets :
       prix        : multiplicateur des prix d'achat (et diviseur des prix de vente)
       contrats    : false = aucun contrat ni quête proposé
       contratsBonus : contrats aléatoires en plus à chaque escale
       recompense  : multiplicateur des récompenses de contrat
       reparation  : multiplicateur du coût des réparations
       inspection  : multiplicateur de la chance d'inspection, ou "systematique"
       rares       : chance en plus d'un contrat rare à chaque escale
       recrues     : recrues en plus proposées à la taverne
       taxeEntree  : or payé à chaque arrivée dans le port
     ------------------------------------------------------------------ */
  paliersReputation: [
    { id: "hostile", nom: "Hostile", min: -100, couleur: "#b23a2e", effets: { prix: 1.25, contrats: false, inspection: "systematique", taxeEntree: 40 }, resume: "Taxe d'entrée 40 or, prix +25 %, aucun contrat, inspection systématique" },
    { id: "mefiant", nom: "Méfiant", min: -39, couleur: "#c47a1a", effets: { prix: 1.10, contrats: true, quetes: false, inspection: 1.5 }, resume: "Prix +10 %, pas de quête, inspections ×1,5" },
    { id: "inconnu", nom: "Inconnu", min: -9, couleur: "#8a7a5e", effets: {}, resume: "Situation de base" },
    { id: "connu", nom: "Connu", min: 10, couleur: "#5b8a3a", effets: { prix: 0.97, contratsBonus: 1 }, resume: "1 contrat de plus, prix −3 %" },
    { id: "estime", nom: "Estimé", min: 30, couleur: "#3f8a4f", effets: { prix: 0.97, contratsBonus: 1, recompense: 1.15, reparation: 0.8, rares: 0.2, recrues: 1 }, resume: "Contrats +15 %, réparations −20 %, contrats rares plus fréquents, une recrue de plus" },
    { id: "notable", nom: "Notable", min: 60, couleur: "#b8902e", effets: { prix: 0.92, contratsBonus: 1, recompense: 1.15, reparation: 0.8, rares: 0.35, recrues: 1, inspection: 0.5 }, resume: "Prix −8 %, inspections ×0,5, contrats rares encore plus fréquents" }
  ],

  /* ------------------------------------------------------------------
     EFFETS DE FACTION. Actif quand la réputation de faction atteint "seuil"
     (seuil positif : atteint ou dépassé ; seuil négatif : atteint ou en dessous).
     effet : "info" (texte seulement), "lettreDeMarque", "patrouilles" (x valeur), "contratsBonus" (x valeur),
             "coffrePartout", "boycott", "recrutement" (x valeur du prix), "vivres" (x valeur du prix),
             "pasDeRecrues", "marcheNoir" (x valeur du prix de vente), "pavillonAmi" (chance d'être épargné),
             "pirates" (x valeur de la fréquence des navires hostiles), "marquesOmbre" (x valeur de la chance
             qu'un inspecteur trouve la contrebande), "delation" (x valeur de la chance d'inspection),
             "feuxMorts" (x valeur de la fréquence des navires fantômes), "recifsCalmes" (x valeur de la chance
             d'événement en mer dans l'Archipel de Nacre)
     ------------------------------------------------------------------ */
  factionsPaliers: [
    { faction: "fanaux",      seuil: 20,  effet: "info",            texte: "La goélette est en vente au chantier de Hautegarde" },
    { faction: "fanaux",      seuil: 40,  effet: "lettreDeMarque",  texte: "Sauf-conduit des Fanaux : leurs patrouilles ne vous arrêtent plus" },
    { faction: "fanaux",      seuil: -30, effet: "patrouilles", valeur: 2, texte: "Patrouilles des Fanaux 2 fois plus fréquentes" },
    { faction: "couronne",    seuil: 20,  effet: "contratsBonus", valeur: 1.25, texte: "Contrats au départ de ses ports payés +25 %" },
    { faction: "couronne",    seuil: 40,  effet: "coffrePartout",   texte: "Lettres de change royales : votre coffre est accessible dans tous les ports" },
    { faction: "couronne",    seuil: -30, effet: "boycott",         texte: "Ses ports refusent de commercer avec vous" },
    { faction: "etoile",      seuil: 20,  effet: "marcheNoir", valeur: 1.2, texte: "Les receleurs rachètent la contrebande +20 %" },
    { faction: "etoile",      seuil: 40,  effet: "marquesOmbre", valeur: 0.5, texte: "Marques d'ombre : les inspecteurs trouvent deux fois moins votre contrebande" },
    { faction: "etoile",      seuil: -30, effet: "delation", valeur: 1.5, texte: "L'Étoile Noire vous dénonce : inspections ×1,5" },
    { faction: "naufrageurs", seuil: 20,  effet: "pavillonAmi", valeur: 0.5, texte: "Pavillon ami : une chance sur deux qu'un navire pirate vous laisse passer" },
    { faction: "naufrageurs", seuil: 40,  effet: "feuxMorts", valeur: 0.5, texte: "Pacte des feux morts : deux fois moins de navires fantômes" },
    { faction: "naufrageurs", seuil: -30, effet: "pirates", valeur: 1.5, texte: "Les navires pirates vous cherchent : rencontres ×1,5" },
    { faction: "coralins",    seuil: 20,  effet: "recrutement", valeur: 0.5, texte: "Les Coralins embarquent à moitié prix sur leurs îles" },
    { faction: "coralins",    seuil: 40,  effet: "recifsCalmes", valeur: 0.5, texte: "Chant des coraux : deux fois moins d'incidents en mer dans l'Archipel de Nacre" },
    { faction: "coralins",    seuil: -30, effet: "pasDeRecrues",    texte: "Plus aucun Coralin ne veut embarquer avec vous" }
  ],
  rivalites: { taux: 0.25, paires: [["fanaux", "naufrageurs"], ["couronne", "etoile"], ["couronne", "coralins"]] }, // un gain chez l'une retire 25 % de ce gain chez l'autre

  /* ------------------------------------------------------------------
     MÉFIANCE (par faction, de 0 à 100) : niveaux et effets
     inspection : multiplicateur de la chance d'inspection, ou "systematique"
     cachette   : multiplicateur de la discrétion de la contrebande (fouille minutieuse)
     patrouilles: multiplicateur de la fréquence des patrouilles de cette faction
     ------------------------------------------------------------------ */
  mefiance: {
    niveaux: [
      { id: "calme",        nom: "Calme",             min: 0,  couleur: "#3f8a4f", inspection: 1 },
      { id: "attentive",    nom: "Attentive",         min: 20, couleur: "#c4a21a", inspection: 1.3 },
      { id: "soupconneuse", nom: "Soupçonneuse",      min: 50, couleur: "#c47a1a", inspection: 1.7, cachette: 0.6 },
      { id: "recherche",    nom: "Avis de recherche", min: 80, couleur: "#b23a2e", inspection: "systematique", cachette: 0.6, patrouilles: 2 }
    ]
  },

  /* ------------------------------------------------------------------
     COSMÉTIQUES (gagnés avec les jalons ; "base: true" = disponible dès le départ)
     ------------------------------------------------------------------ */
  cosmetiques: {
    couleurs: [
      { id: "modele", nom: "Couleur du modèle", couleur: null, base: true },
      { id: "brique", nom: "Rouge brique", couleur: "#8a2f2f", base: true },
      { id: "corail", nom: "Corail", couleur: "#c4573a" },
      { id: "nuit",   nom: "Bleu nuit", couleur: "#1f3a5f" },
      { id: "or",     nom: "Dorure", couleur: "#b8902e" },
      { id: "ivoire", nom: "Ivoire", couleur: "#d9ccb0" },
      { id: "ebene",  nom: "Ébène", couleur: "#1d1612" },
      { id: "lagon",  nom: "Lagon", couleur: "#2a8d8a" }
    ],
    pavillons: [
      { id: "marchand", nom: "Marchand", couleurs: ["#3f8a4f", "#3f8a4f"], base: true },
      { id: "vagues",   nom: "Vagues", couleurs: ["#2f5d9e", "#fbeed0"] },
      { id: "soleil",   nom: "Soleil", couleurs: ["#e7b92f", "#8a2f2f"] },
      { id: "etoile",   nom: "Étoile", couleurs: ["#7a3e6e", "#e7c977"] },
      { id: "crane",    nom: "Crâne", couleurs: ["#151515", "#eeeeee"] },
      { id: "brume",    nom: "Brume", couleurs: ["#3f7a6f", "#d9e6df"] },
      { id: "nacre",    nom: "Nacre", couleurs: ["#2a9d8f", "#f4efe6"] }
    ]
  },

  /* ------------------------------------------------------------------
     JALONS (conservés même après un naufrage)
     condition : { type, valeur }
       "stat"           : statistique de la partie ("livraisons", "livraisonsATemps", "livraisonsParfaites",
                          "ventesOr", "joursMer", "mouillages", "inspectionsEchappees", "tresors", "naufrages") ; champ "stat"
       "ilesConnues", "toutesIles" (champ "region" facultatif), "fortune" (or à bord + coffre), "navire" (champ "navire"),
       "equipageComplet", "generation", "palier" (champ "palier" : une île à ce palier)
     Statistiques liées aux légendes : "legendes" (légendes découvertes), "pagesAlienor"
     recompense : { or, couleur, pavillon, titre }
     ------------------------------------------------------------------ */
  jalons: [
    { id: "premier_contrat", nom: "Premier contrat", description: "Livrer un premier contrat.", condition: { type: "stat", stat: "livraisons", valeur: 1 }, recompense: { or: 30, titre: "Marchand débutant" } },
    { id: "fiable",          nom: "Marchand fiable", description: "Livrer 10 contrats dans les délais.", condition: { type: "stat", stat: "livraisonsATemps", valeur: 10 }, recompense: { titre: "Marchand fiable", pavillon: "vagues" } },
    { id: "arrimeur",        nom: "Arrimeur hors pair", description: "Réussir 5 livraisons parfaites (95 % d'état ou plus).", condition: { type: "stat", stat: "livraisonsParfaites", valeur: 5 }, recompense: { titre: "Arrimeur hors pair", couleur: "corail" } },
    { id: "bourse",          nom: "Bourse pleine", description: "Posséder 1 000 or (à bord et au coffre).", condition: { type: "fortune", valeur: 1000 }, recompense: { couleur: "or" } },
    { id: "negociant",       nom: "Négociant", description: "Vendre pour 5 000 or de marchandises.", condition: { type: "stat", stat: "ventesOr", valeur: 5000 }, recompense: { titre: "Négociant", pavillon: "soleil" } },
    { id: "cartographe",     nom: "Cartographe", description: "Découvrir 5 îles.", condition: { type: "ilesConnues", valeur: 5 }, recompense: { titre: "Cartographe", couleur: "nuit" } },
    { id: "terra",           nom: "Terra cognita", description: "Découvrir toutes les îles des Hauts-Fonds de Sel.", condition: { type: "toutesIles", region: "hautsfonds" }, recompense: { titre: "Maître de l'archipel", pavillon: "etoile" } },
    { id: "explorateur",     nom: "Explorateur", description: "Jeter l'ancre 3 fois en eaux inconnues.", condition: { type: "stat", stat: "mouillages", valeur: 3 }, recompense: { titre: "Explorateur" } },
    { id: "goelette",        nom: "Nouvelle coque", description: "Acheter une goélette.", condition: { type: "navire", navire: "goelette" }, recompense: { couleur: "ivoire", or: 100 } },
    { id: "vieux_loup",      nom: "Vieux loup de mer", description: "Passer 100 jours en mer.", condition: { type: "stat", stat: "joursMer", valeur: 100 }, recompense: { titre: "Vieux loup de mer" } },
    { id: "equipage",        nom: "Équipage au complet", description: "Remplir tous les postes d'un navire d'au moins 3 marins.", condition: { type: "equipageComplet" }, recompense: { titre: "Capitaine respecté" } },
    { id: "passe_muraille",  nom: "Passe-muraille", description: "Échapper 5 fois à une inspection avec de la contrebande à bord.", condition: { type: "stat", stat: "inspectionsEchappees", valeur: 5 }, recompense: { titre: "Passe-muraille", pavillon: "crane" } },
    { id: "notable",         nom: "Notable", description: "Devenir Notable sur une île.", condition: { type: "palier", palier: "notable" }, recompense: { titre: "Notable de l'archipel" } },
    { id: "chasseur",        nom: "Chasseur de trésor", description: "Déterrer un coffre au trésor.", condition: { type: "stat", stat: "tresors", valeur: 1 }, recompense: { titre: "Chasseur de trésor", couleur: "ebene", or: 100 } },
    { id: "survivant",       nom: "Survivant", description: "Survivre à un naufrage.", condition: { type: "stat", stat: "naufrages", valeur: 1 }, recompense: { titre: "Rescapé" } },
    { id: "dynastie",        nom: "Revenant des mers", description: "Survivre à 3 naufrages.", condition: { type: "stat", stat: "naufrages", valeur: 3 }, recompense: { titre: "Revenant des mers" } },
    { id: "conteur",         nom: "Conteur", description: "Découvrir 12 légendes.", condition: { type: "stat", stat: "legendes", valeur: 12 }, recompense: { titre: "Conteur des Hauts-Fonds", pavillon: "brume" } },
    { id: "passe_brume",     nom: "Au-delà de la Brume", description: "Traverser la Passe des Brumes.", condition: { type: "stat", stat: "passages", valeur: 1 }, recompense: { titre: "Passe-Brume", pavillon: "nacre" } },
    { id: "atolls",          nom: "Maître des atolls", description: "Découvrir toutes les îles de l'Archipel de Nacre.", condition: { type: "toutesIles", region: "nacre" }, recompense: { titre: "Maître des atolls", couleur: "lagon" } },
    { id: "journal_alienor", nom: "Sur la trace d'Aliénor", description: "Retrouver 3 pages du journal d'Aliénor Corvelle.", condition: { type: "stat", stat: "pagesAlienor", valeur: 3 }, recompense: { titre: "Chercheur de Brume", or: 150 } }
  ],

  /* ------------------------------------------------------------------
     MARCHÉ VIVANT : pénuries et abondances temporaires
     ------------------------------------------------------------------ */
  marche: {
    evenementsParJour: 0.15,       // chance par jour qu'une pénurie ou une abondance se prépare quelque part
    delai: [2, 5],                 // jours avant le début
    duree: [5, 8],                 // durée en jours
    penurie: 1.8,                  // multiplicateur de prix pendant une pénurie
    abondance: 0.55,               // multiplicateur de prix pendant une abondance
    items: ["sucre", "rhum", "tabac", "epices", "soie", "porcelaine", "bois", "poisson", "poudre", "mousquets", "fruitsvente", "sel", "perles", "corail", "vanille"]
  },
  rumeurs: {
    prix: 5,                       // prix d'un verre à la taverne
    fiabilite: 0.7,                // chance qu'une rumeur soit vraie…
    fiabiliteParCommerce: 0.1      // … + 10 % par point de compétence "commerce" (95 % au plus)
  },
  contratsRares: {
    chance: 0.2,                   // chance d'un contrat rare à chaque escale (+ bonus du palier de réputation)
    multRecompense: 2.5,
    multDelai: 0.8,                // délai plus serré
    etatMin: 80,
    items: ["porcelaine", "soie", "rhum", "epices", "lingots", "perles", "corail"]
  },
  livraisonParfaite: { seuil: 95, bonus: 0.2 }, // +20 % si la marchandise arrive à 95 % d'état ou plus

  /* ------------------------------------------------------------------
     NOTE D'ARRIMAGE (de A à E) : 100 points moins les pénalités
     ------------------------------------------------------------------ */
  noteArrimage: {
    parItemARisque: 12,            // item au fond humide ou fragile écrasé
    parItemMalCale: 10,            // centre hors de ses appuis
    assiette: 40,                  // x écart d'assiette (0 à 1)
    stabilite: 30,                 // x (1 − stabilité)
    surcharge: 30,
    notes: [[90, "A"], [75, "B"], [60, "C"], [40, "D"], [0, "E"]]
  },

  /* ------------------------------------------------------------------
     CHAÎNES DE QUÊTES (affichées dans l'onglet Quêtes)
     etapes : { quete: id }, { ou: [ids de quêtes], texte } (l'une ou l'autre)
              ou { stat: id, valeur, texte } (étape réussie quand la statistique est atteinte)
     ------------------------------------------------------------------ */
  chaines: [
    { id: "gouverneur", titre: "Les caprices du Grand Gardien", etapes: [{ quete: "q_premier_rhum" }, { quete: "q_epices_bal" }] },
    { id: "mariage",    titre: "Le mariage de Lunebaie",     etapes: [{ quete: "q_porcelaine" }, { quete: "q_soie_robe" }] },
    { id: "confrerie",  titre: "Les secrets des Naufrageurs", etapes: [{ quete: "q_rumeur_crique" }, { quete: "q_mousquets" }] },
    { id: "passe",      titre: "La Passe du Sud",             etapes: [{ quete: "q_rumeur_passe" }, { ou: ["q_lettre_passage", "q_passeurs"], texte: "Obtenir la route : lettre de la Couronne ou carte de l'Étoile Noire" }, { stat: "passages", valeur: 1, texte: "Traverser la Passe des Brumes" }] },
    { id: "nacre",      titre: "Entre le Vice-Roi et les Coralins", etapes: [{ quete: "q_bois_fort" }, { quete: "q_perles_vice_roi" }, { quete: "q_sel_anneau" }] },
    { id: "recif",      titre: "Le secret du Récif",          etapes: [{ quete: "q_rumeur_recif" }, { stat: "tour", valeur: 1, texte: "Gravir la tour du Récif du Silence" }] },
    { id: "pendu",      titre: "Le trésor du Pendu",          etapes: [{ quete: "q_rumeur_crique" }, { quete: "q_carte_pendu" }, { stat: "tresors", valeur: 1, texte: "Déterrer le coffre sur l'Île du Pendu" }] }
  ],

  /* ------------------------------------------------------------------
     MONDE ET LÉGENDES (voir la Bible de l'univers)
     intro : texte de la fenêtre d'ouverture d'une nouvelle partie
     legendes : entrées de l'onglet Quêtes > Légendes
       categorie : "monde", "factions", "personnages", "journal"
       depart    : true = connue dès le début
       ile       : débloquée à la première arrivée sur cette île
       taverne   : racontée par les vieux marins de cette île (bouton à la taverne)
       (une légende peut aussi être débloquée par un événement : champ "legende" des événements)
       page      : numéro de page du journal d'Aliénor (trouvées dans l'ordre ; "special" = seulement par un événement précis)
       indice    : texte affiché tant que la légende est inconnue (facultatif)
     ------------------------------------------------------------------ */
  monde: {
    annee: 312,
    intro: "An 312 du Fanal. Personne n'a jamais vu de continent : la Brume sépare les archipels depuis des siècles. Il y a douze ans, elle a commencé à s'estomper, et l'on parle déjà de passages vers d'autres archipels. Dans les Hauts-Fonds de Sel, les Fanaux font la loi, la Couronne tient le sel, l'Étoile Noire tient la pègre et les Naufrageurs allument leurs faux feux. Vous n'êtes qu'un petit marchand, avec un vieux cotre et trois marins. Enrichissez-vous… et ouvrez l'oreille : dans les tavernes, les légendes mènent aux trésors."
  },
  categoriesLegendes: [
    { id: "monde", nom: "Le monde", icone: "🌫️" },
    { id: "nacre", nom: "L'Archipel de Nacre", icone: "🐚" },
    { id: "factions", nom: "Factions", icone: "⚑" },
    { id: "personnages", nom: "Personnages", icone: "👤" },
    { id: "journal", nom: "Journal d'Aliénor", icone: "📓" }
  ],
  legendes: [
    { id: "brume", categorie: "monde", titre: "La Brume", depart: true,
      texte: "Personne n'a jamais vu de continent. Des murs de brouillard séparent les archipels depuis des siècles. Chaque archipel a vécu seul, avec ses peuples, ses pouvoirs et ses légendes. Les navires qui entrent dans la Brume reviennent rarement." },
    { id: "reflux", categorie: "monde", titre: "Le Reflux", depart: true,
      texte: "Il y a douze ans, la Brume a commencé à s'estomper par endroits. Des passages s'ouvrent vers d'autres archipels, peuplés depuis toujours. Le premier se dessine au sud des Hauts-Fonds de Sel, et toutes les factions veulent être les premières à le traverser." },
    { id: "hautsfonds", categorie: "monde", titre: "Les Hauts-Fonds de Sel", depart: true,
      texte: "Un archipel de bancs de sable, de lagunes et de marais salants. Au nord, les eaux profondes et les phares ; au centre, les salines ; au sud, la Lisière, au bord de la Brume. Le sel est partout, et qui tient le sel tient le commerce." },
    { id: "feu_blanc", categorie: "monde", titre: "Le premier fanal", taverne: "hautegarde",
      texte: "En l'an 0, une gardienne alluma un feu blanc sur le rocher de Hautegarde. Les navires fantômes qui rôdaient s'enfuirent. On compte les années depuis ce jour : nous sommes en l'an 312 du Fanal." },
    { id: "sel_morts", categorie: "monde", titre: "Pourquoi le sel vaut si cher", taverne: "vasque",
      texte: "Parce qu'il brûle les morts. Un cercle de sel autour d'un hamac, et aucun noyé ne vient vous tirer par les pieds. Les marins avisés gardent toujours un sac de sel à bord." },
    { id: "equipages_fond", categorie: "monde", titre: "Les Équipages du Fond", taverne: "sternes",
      texte: "Ceux qui meurent en mer dérivent dans la Brume. Les plus féroces gardent leur navire et leur équipage : ce sont les Équipages du Fond. Depuis le Reflux, on les croise de plus en plus souvent, la nuit." },
    { id: "gibet", categorie: "monde", titre: "Le gibet du sud", taverne: "criquenoire",
      texte: "Sur une île au sud, longtemps noyée dans la Brume, un gibet se dresse au sommet d'une colline. Personne ne sait qui l'a construit. Un naufrageur jure qu'un coffre dort sous ses pieds… et qu'une page du journal d'Aliénor l'accompagne." },
    { id: "feux_morts", categorie: "monde", titre: "Les feux morts",
      texte: "Les feux verts des Naufrageurs ne trompent pas que les vivants : ils appellent aussi les noyés. Quand un navire s'éventre sur les récifs, ses marins rejoignent la Brume… et parfois l'équipage de ceux qui les ont attirés." },
    { id: "batisseurs", categorie: "monde", titre: "Les Bâtisseurs", ile: "pendu",
      texte: "Des ruines de pierre plus anciennes que le premier fanal. Leurs gravures montrent des navires qu'aucun chantier connu ne sait construire. Qui étaient les Bâtisseurs, et que fuyaient-ils ?" },

    { id: "l_fanaux", categorie: "factions", titre: "L'Ordre des Fanaux", ile: "hautegarde",
      texte: "Ils ont allumé le premier feu, et les marins leur doivent la vie. Avec le temps, ils sont devenus juges et percepteurs : naviguer sans leurs cartes est illégal. Leur Feu blanc aveugle les morts. Ils veulent être les premiers à cartographier les passages du Reflux." },
    { id: "l_couronne", categorie: "factions", titre: "La Couronne", ile: "vasque",
      texte: "Il y a un siècle, le plus riche des sauniers s'est fait couronner roi des Salines. Ses héritiers fixent le prix du sel, lèvent les taxes et traquent le faux-sel. Leur Sel scellé lie les contrats : rompre un serment royal porte malheur." },
    { id: "l_etoile", categorie: "factions", titre: "L'Étoile Noire", ile: "lunebaie",
      texte: "Quand la Couronne a pris le monopole du sel, les sauniers indépendants ont choisi la contrebande. Leurs descendants tiennent la pègre de chaque port : receleurs, faussaires, douaniers achetés. Une étoile noire gravée sous un comptoir signifie qu'on peut parler librement." },
    { id: "l_naufrageurs", categorie: "factions", titre: "Les Naufrageurs", ile: "criquenoire",
      texte: "D'anciens marins ruinés par les taxes des Fanaux. Ils allument des feux verts sur les falaises pour attirer les navires sur les récifs, puis pillent les épaves. On dit qu'ils ont des arrangements avec les noyés." },

    { id: "ambroise", categorie: "personnages", titre: "Ambroise Lumen, le Grand Gardien", ile: "hautegarde",
      texte: "Aveugle depuis cinquante ans, il dit voir les morts mieux que les vivants, et les gronde comme des enfants désobéissants. Il a un faible pour le rhum de Lunebaie, interdit dans sa propre ville." },
    { id: "petronille", categorie: "personnages", titre: "Pétronille III, la Reine du Sel", ile: "vasque",
      texte: "Elle trône sur un siège de sel taillé et fait peser chaque visiteur avant de parler affaires. Elle n'oublie aucune dette, et prête volontiers… à des taux redoutables." },
    { id: "seraphin", categorie: "personnages", titre: "Séraphin Minuit, le Prince des Quais", ile: "lunebaie",
      texte: "Perruque poudrée, étoile noire tatouée sous l'œil. Il connaît le prix de chaque douanier et ne montre jamais ses deux mains à la fois. Ses faveurs se paient toujours plus tard." },
    { id: "gaspard", categorie: "personnages", titre: "Gaspard Lanterne-Verte", ile: "criquenoire",
      texte: "Le chef des Naufrageurs porte à la ceinture une lanterne où brûle l'âme de son ancien capitaine. Les deux se disputent sans cesse, surtout sur le partage du butin." },
    { id: "coquille", categorie: "personnages", titre: "Madame Coquille et Cap'taine", taverne: "lunebaie",
      texte: "Madame Coquille vend les rumeurs de Lunebaie. Son perroquet, Cap'taine, a plus de cent ans et en sait plus qu'elle. Il ment une fois sur trois, et personne ne sait laquelle." },
    { id: "alienor", categorie: "personnages", titre: "Aliénor Corvelle, la capitaine disparue", taverne: "lunebaie",
      texte: "La capitaine la plus audacieuse de l'archipel. En 293, elle entra dans la Brume à bord de la Persévérance et ne revint jamais. Sept ans plus tard, la Brume commençait à s'estomper, exactement dans la direction qu'elle avait prise. Son journal, vendu page par page, circule encore." },
    { id: "amiral_os", categorie: "personnages", titre: "L'Amiral d'Os", taverne: "criquenoire",
      texte: "Il commande La Dernière Marée, un trois-mâts aux voiles en lambeaux. Squelette d'une politesse exquise, il réclame un péage en âmes ou en or. On dit qu'il adore les dés… et qu'il triche." },

    { id: "passe", categorie: "monde", titre: "La Passe des Brumes", taverne: "sternes",
      texte: "Au sud de l'Île aux Sternes, la Brume s'est amincie au point de laisser passer un navire. La Couronne a été la première à la franchir, il y a huit ans. Sans carte, on y tourne en rond jusqu'à la folie." },
    { id: "nacre_brume", categorie: "nacre", titre: "L'Archipel de Nacre", indice: "Se découvre en traversant la Passe des Brumes.",
      texte: "Derrière la Brume, des anneaux de corail entourent des lagons turquoise. La Couronne y a planté son drapeau, mais ces atolls n'ont jamais été vides : les Coralins y vivent depuis toujours." },
    { id: "chant_coraux", categorie: "nacre", titre: "Le Chant des coraux", taverne: "anneau",
      texte: "Les Coralins chantent au récif, et le récif répond : il ouvre des passes, apaise les requins et garde les noyés au fond. Ils disent que le corail se souvient de tout." },
    { id: "perle_fausse", categorie: "nacre", titre: "La fausse perle", taverne: "portroyal",
      texte: "Le Vice-Roi porte une cape cousue de mille perles. L'une d'elles est fausse, et il en perd le sommeil. Au port, on murmure que c'est Nacre-Noire qui l'a cousue là, pour rire." },
    { id: "tour", categorie: "nacre", titre: "La tour du Récif", indice: "Se découvre au Récif du Silence.",
      texte: "Une tour de pierre noire, bâtie par les Bâtisseurs au milieu d'un lagon où le corail ne chante plus. Exactement la tour du journal d'Aliénor. Une lumière y brille encore, et personne ne sait qui l'allume." },
    { id: "l_coralins", categorie: "factions", titre: "Les Coralins", ile: "anneau",
      texte: "Le peuple des lagons de Nacre, isolé par la Brume depuis des siècles. Ils naviguent en pirogue, chantent au récif et refusent de plonger pour le Vice-Roi. Depuis l'arrivée de la Couronne, certains ont rejoint l'Étoile Noire." },
    { id: "sabliere", categorie: "personnages", titre: "Hugues de Sablière, le Vice-Roi des Perles", ile: "portroyal",
      texte: "Il porte une cape cousue de mille perles et les compte chaque matin. Il veut faire des atolls la nouvelle fortune de la Couronne, et des Coralins ses plongeurs." },
    { id: "anemone", categorie: "personnages", titre: "La Vieille Anémone", ile: "anneau",
      texte: "Gardienne des chants du récif. Elle parle au corail comme à un vieil ami, et dit qu'il se souvient même des Bâtisseurs." },
    { id: "nacre_noire", categorie: "personnages", titre: "Nacre-Noire", ile: "lagonnoir",
      texte: "Plongeuse coraline passée à la contrebande. Elle porte une perle noire à la place d'un œil, et fait sortir des atolls tout ce que la Couronne voudrait garder." },
    { id: "page1", categorie: "journal", titre: "Page 1", page: 1,
      texte: "« Jour 3 dans la Brume. Le compas tourne sur lui-même. Les hommes entendent chanter sous la coque. Je tiens le cap au sud-sud-est, d'après des étoiles qu'on ne voit pas. »" },
    { id: "page2", categorie: "journal", titre: "Page 2", page: 2,
      texte: "« Jour 9. Une tour, au milieu de l'eau, plus haute que le Grand Fanal. Il y a de la lumière tout en haut. Quelqu'un, ou quelque chose, nous attendait. »" },
    { id: "page3", categorie: "journal", titre: "Page 3", page: 3,
      texte: "« La Brume ne garde pas, elle attend que… » La phrase s'arrête là. Au dos, un relevé de cap, et une étoile dessinée à l'encre noire." },
    { id: "page4", categorie: "journal", titre: "Page 4", page: 4, special: true, indice: "Une page qui n'aurait jamais dû quitter la Brume…",
      texte: "« J'ai trouvé la tour. Elle n'est pas faite pour garder la Brume : elle la nourrit. Si quelqu'un lit ceci, éteignez la lumière. » Daté de l'an 293. L'encre est encore fraîche." }
  ],

  /* ------------------------------------------------------------------
     NAUFRAGE
     ------------------------------------------------------------------ */
  naufrage: {
    navire: "barque",         // navire du survivant
    reputationConservee: 0.7, // part de la réputation conservée
    orConserve: 0,            // part de l'or à bord conservée (le coffre à terre est toujours conservé)
    rations: ["biscuits", 1]  // vivres du survivant
  },

  /* ------------------------------------------------------------------
     CARTE
     ------------------------------------------------------------------ */
  regions: [
    { id: "hautsfonds", nom: "Les Hauts-Fonds de Sel", y0: 0, y1: 140 },
    { id: "nacre", nom: "L'Archipel de Nacre", y0: 160, y1: 245 }
  ],
  carte: {
    largeur: 100, hauteur: 245, // taille du monde (la carte affiche 100 x 140 à la fois : on la fait glisser)
    brume: { y0: 140, y1: 160, passage: { x: 16, y: 150, largeur: 16 }, danger: 0.7, fantomes: 2 }, // bande de Brume entre les régions
    rayonDecouverte: 26,       // distance à laquelle une île normale est découverte
    rayonParNavigation: 8,     // + rayon par point de compétence "navigation"
    rayonIleCachee: 9,         // distance à laquelle une île cachée est découverte en passant
    rayonBrouillard: 22,       // rayon de brouillard dissipé autour du navire et des îles connues
    dangerEauxInconnues: 0.4,  // danger d'une route vers un point d'exploration
    chanceEvenementBase: 0.4,  // chance d'événement par jour = somme des chances x (base + danger x parDanger)
    chanceEvenementParDanger: 1.5,
    chanceEvenementMax: 0.6    // probabilité maximale d'un événement par jour
  }
};
