/* =====================================================================
   PIRATES : SHIPPING LEGACY — FICHIER DE PARAMÈTRES (prototype 0.1)
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
    { id: "lingots",   nom: "Lingots d'argent",      largeur: 1, hauteur: 1, poids: 14, prix: 90,  fragile: false, perissable: 0,  craintEau: false, couleur: "#b9bcc2", icone: "🥈" },
    // --- Vivres (se consomment : 1 ration par marin et par jour) ---
    { id: "biscuits",  nom: "Biscuits de mer",       largeur: 1, hauteur: 1, poids: 3,  prix: 8,   fragile: false, perissable: 0,  craintEau: true,  rations: 10, frais: false, couleur: "#c9a86a", icone: "🍘" },
    { id: "fruits",    nom: "Vivres frais",          largeur: 1, hauteur: 1, poids: 3,  prix: 10,  fragile: false, perissable: 10, craintEau: false, rations: 6,  frais: true,  couleur: "#6aa84f", icone: "🥥" },
    // --- Objets spéciaux (non achetables : "achetable: false") ---
    { id: "coffre",    nom: "Coffre au trésor",      largeur: 2, hauteur: 2, poids: 16, prix: 700, fragile: false, perissable: 0,  craintEau: false, couleur: "#c8a03a", icone: "💰", achetable: false }
  ],

  /* ------------------------------------------------------------------
     FACTIONS
     severite     : multiplicateur de l'amende quand de la contrebande est trouvée
     corruptible  : chance (0 à 1) qu'un pot-de-vin fonctionne lors d'une inspection
     ------------------------------------------------------------------ */
  factions: [
    { id: "couronne",  nom: "La Couronne d'Aubrac",     couleur: "#2f5d9e", severite: 2.0, corruptible: 0.2 },
    { id: "compagnie", nom: "Compagnie des Comptoirs",  couleur: "#b07a1e", severite: 1.5, corruptible: 0.6 },
    { id: "colonies",  nom: "Colonies libres",          couleur: "#3f8a4f", severite: 0.8, corruptible: 0.7 },
    { id: "confrerie", nom: "Confrérie de la Marée",    couleur: "#8a2f2f", severite: 0.5, corruptible: 0.9 },
    { id: "aucune",    nom: "Sans maître",              couleur: "#777777", severite: 0,   corruptible: 1 }
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
     ------------------------------------------------------------------ */
  iles: [
    { id: "hautegarde", nom: "Hautegarde", x: 30, y: 26, faction: "couronne", climat: "tempere", connue: true, cachee: false,
      danger: 0.15, surveillance: 0.6, marche: true,
      produit: { mousquets: 0.7, poudre: 0.7, biscuits: 0.8 },
      demande: { sucre: 1.5, epices: 1.6, fruitsvente: 1.8, soie: 1.4 },
      interdits: ["tabac", "rhum"],
      services: ["reparation", "recrutement", "chantier", "coffre", "taverne"], ameliorations: ["coque"] },

    { id: "vasque", nom: "Comptoir de Vasque", x: 76, y: 40, faction: "compagnie", climat: "tropical", connue: true, cachee: false,
      danger: 0.25, surveillance: 0.4, marche: true,
      produit: { epices: 0.6, soie: 0.65, porcelaine: 0.7 },
      demande: { bois: 1.5, rhum: 1.4, poisson: 1.4 },
      interdits: ["mousquets"],
      services: ["reparation", "coffre", "taverne"], ameliorations: ["baches"] },

    { id: "lunebaie", nom: "Lunebaie", x: 40, y: 78, faction: "colonies", climat: "tropical", connue: true, cachee: false,
      danger: 0.2, surveillance: 0.15, marche: true,
      produit: { sucre: 0.6, rhum: 0.6, fruitsvente: 0.5, fruits: 0.7 },
      demande: { mousquets: 1.6, porcelaine: 1.5, poudre: 1.4 },
      interdits: [],
      services: ["reparation", "recrutement", "taverne"], ameliorations: [] },

    { id: "sternes", nom: "Île aux Sternes", x: 14, y: 104, faction: "colonies", climat: "tropical", connue: false, cachee: false,
      danger: 0.3, surveillance: 0.1, marche: true,
      produit: { poisson: 0.5, tabac: 0.55, bois: 0.7 },
      demande: { biscuits: 1.5, sucre: 1.3, epices: 1.5 },
      interdits: [],
      services: ["taverne"], ameliorations: [] },

    { id: "criquenoire", nom: "La Crique Noire", x: 82, y: 96, faction: "confrerie", climat: "tropical", connue: false, cachee: true,
      danger: 0.5, surveillance: 0.0, marche: true,
      produit: { lingots: 0.75, rhum: 0.8 },
      demande: { mousquets: 2.0, poudre: 1.8, tabac: 1.6, soie: 1.5 },
      interdits: [],
      services: ["reparation", "recrutement", "taverne"], ameliorations: ["cachette"] },

    { id: "pendu", nom: "Île du Pendu", x: 58, y: 124, faction: "aucune", climat: "tropical", connue: false, cachee: true,
      danger: 0.6, surveillance: 0.0, marche: false,
      produit: {}, demande: {}, interdits: [],
      services: [], ameliorations: [], evenementArrivee: "fouille_tresor" }
  ],

  /* ------------------------------------------------------------------
     NAVIRES
     colonnes / rangees : taille de la grille de cale (rangée du bas = fond de cale humide)
     chargeMax          : poids maximal avant surcharge
     vitesse            : unités de carte parcourues par jour
     coqueMax           : points de coque
     equipageMax        : nombre maximal de marins
     canons             : nombre de canons (défense)
     colonnesVentilees  : colonnes (0 = proue/gauche) près des écoutilles : les périssables y pourrissent moins vite
     cachette           : cases [colonne, rangée] du compartiment caché (actif seulement avec l'amélioration "cachette")
     emplacements       : nombre maximal d'améliorations
     prix               : prix au chantier (0 = non achetable)
     ------------------------------------------------------------------ */
  navires: [
    { id: "barque",   nom: "Barque",   colonnes: 4,  rangees: 2, chargeMax: 20,  vitesse: 9,  coqueMax: 40,  equipageMax: 1,  canons: 0, colonnesVentilees: [1, 2],      cachette: [[0, 1]],                 emplacements: 1, prix: 0 },
    { id: "cotre",    nom: "Cotre",    colonnes: 8,  rangees: 4, chargeMax: 60,  vitesse: 12, coqueMax: 100, equipageMax: 3,  canons: 2, colonnesVentilees: [3, 4],      cachette: [[0, 3], [1, 3]],         emplacements: 2, prix: 500 },
    { id: "goelette", nom: "Goélette", colonnes: 10, rangees: 5, chargeMax: 110, vitesse: 15, coqueMax: 160, equipageMax: 6,  canons: 6, colonnesVentilees: [4, 5],      cachette: [[0, 4], [1, 4], [2, 4]], emplacements: 3, prix: 1800 }
  ],

  /* ------------------------------------------------------------------
     AMÉLIORATIONS
     prix   : coût en or
     effet  : "cachette" (active le compartiment caché du navire)
              "baches"   (divise les dégâts d'eau par diviseurEau)
              "coque"    (ajoute bonusCoque à la coque max)
     ------------------------------------------------------------------ */
  ameliorations: [
    { id: "cachette", nom: "Compartiment caché", prix: 250, effet: "cachette", description: "La contrebande rangée dans les cases marquées 🗝️ échappe presque toujours aux inspections." },
    { id: "baches",   nom: "Bâches goudronnées", prix: 140, effet: "baches", diviseurEau: 2, description: "Les dégâts d'eau sont divisés par 2." },
    { id: "coque",    nom: "Coque renforcée",    prix: 220, effet: "coque", bonusCoque: 40, description: "+40 points de coque maximum." }
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
    { id: "auguste", nom: "Auguste Rabot",     role: "charpentier",secondaire: "arrimeur",   traits: ["robuste"],        salaire: 3, prixRecrutement: 70,  portrait: { peau: "#b97a52", cheveux: "#8b8b8b", chapeau: "bandana",  barbe: true } }
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
    desequilibreMax: 0.25       // perte de vitesse maximale si toute la charge est d'un seul côté
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
    reputationPrix: 0.002      // prix améliorés de 0,2 % par point de réputation sur l'île
  },

  /* ------------------------------------------------------------------
     CONTREBANDE ET INSPECTIONS
     ------------------------------------------------------------------ */
  contrebande: {
    bonusCommerce: 0.15,       // inspection réduite de 15 % par point de "commerce"
    mefianceInspection: 0.006, // +0,6 % d'inspection par point de méfiance de la faction
    cachetteDiscretion: 0.85,  // chance qu'un item rangé dans la cachette ne soit pas trouvé
    discretionNormale: 0.15,   // chance qu'un item hors cachette ne soit pas trouvé
    amendeParValeur: 0.5,      // amende = valeur des items x 0.5 x sévérité de la faction
    reputationIle: -12,
    reputationFaction: -6,
    mefianceGain: 20,
    mefianceBaisseParJour: 0.5,
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
    items: ["rhum", "sucre", "epices", "porcelaine", "poisson", "bois", "soie", "fruitsvente"] // items possibles
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
    { id: "q_premier_rhum", type: "livraison", titre: "Le rhum du gouverneur",
      origine: "lunebaie", destination: "hautegarde", item: "rhum", quantite: 2, delaiJours: 6, etatMin: 70,
      recompense: 220, reputation: 10, prerequis: {},
      texte: "Le gouverneur de Hautegarde veut du rhum de Lunebaie pour son bal. Le rhum est interdit là-bas… sauf pour lui. Des inspecteurs zélés pourraient l'ignorer." },

    { id: "q_porcelaine", type: "livraison", titre: "Porcelaine pour la mariée",
      origine: "vasque", destination: "lunebaie", item: "porcelaine", quantite: 1, delaiJours: 7, etatMin: 85,
      recompense: 260, reputation: 12, prerequis: {},
      texte: "Une caisse de porcelaine fine pour un mariage à Lunebaie. Elle doit arriver intacte : rien de lourd par-dessus !" },

    { id: "q_rumeur_crique", type: "decouverte", titre: "La rumeur de la Crique Noire",
      origine: "sternes", recompense: 0, reputation: 0, prerequis: {},
      revele: ["criquenoire"],
      texte: "Un vieux pêcheur parle d'une crique où la Confrérie achète armes et poudre sans poser de questions." },

    { id: "q_carte_pendu", type: "decouverte", titre: "La carte du Pendu",
      origine: "criquenoire", recompense: 0, reputation: 0, prerequis: {},
      revele: ["pendu"],
      texte: "Un pirate ivre vous vend un fragment de carte : une croix sur une île au sud, que l'on dit maudite." },

    { id: "q_mousquets", type: "livraison", titre: "Armes pour la Confrérie",
      origine: "hautegarde", destination: "criquenoire", item: "mousquets", quantite: 2, delaiJours: 9, etatMin: 60,
      recompense: 480, reputation: 15, prerequis: { quetes: ["q_rumeur_crique"] },
      texte: "Un officier corrompu vous confie des mousquets à livrer discrètement à la Crique Noire." }
  ],

  /* ------------------------------------------------------------------
     ÉVÉNEMENTS
     icone / theme : illustration de la fenêtre ("orage", "mer", "danger", "autorite", "tresor")
     chanceParJour : probabilité de base par jour de trajet (multipliée par le danger de la route)
     nuitSeulement : true = seulement de nuit
     condition     : "contrebande" = seulement si la cale contient un item interdit chez cette faction (patrouille)
     choix         : liste de choix proposés au joueur
       test        : { competence: id, base: chance de base, parPoint: chance gagnée par point de compétence }
                     (sans test = réussite automatique)
       succes / echec : effets appliqués
     EFFETS possibles :
       coque (+/-), choc (intensité des dégâts aux fragiles), eau (intensité des dégâts d'eau),
       moral (+/- à tous), sante (+/- à tous), cohesion (+/-), or (+/-), orPourcent (- % de l'or à bord),
       jours (jours de trajet en plus), jeter (fraction de la cargaison perdue, 0 à 1),
       gagner: [idItem, quantité], blesse (santé perdue par un marin au hasard),
       inspection: id de faction (déclenche une inspection), texte (message affiché)
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
        { texte: "Faire un large détour (1 jour)", test: null,
          succes: { jours: 1, texte: "Prudence est mère de sûreté." } }
      ] },

    { id: "voie_eau", titre: "Voie d'eau !", icone: "💦", theme: "mer", chanceParJour: 0.05,
      texte: "De l'eau monte au fond de la cale.",
      choix: [
        { texte: "Colmater la brèche", test: { competence: "charpente", base: 0.35, parPoint: 0.45 },
          succes: { eau: 5, texte: "La brèche est colmatée à temps." },
          echec:  { eau: 30, coque: -15, texte: "Le temps de colmater, le fond de cale a pris l'eau." } },
        { texte: "Pomper jour et nuit", test: null,
          succes: { eau: 15, sante: -4, texte: "L'équipage pompe sans relâche." } }
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

    { id: "patrouille", titre: "Patrouille de la Couronne", icone: "⚓", theme: "autorite", chanceParJour: 0.08, condition: "contrebande", faction: "couronne",
      texte: "Une frégate de la Couronne vous fait signe de mettre en panne pour une inspection.",
      choix: [
        { texte: "Accepter l'inspection", test: null,
          succes: { inspection: "couronne" } },
        { texte: "Tenter de fuir", test: { competence: "navigation", base: 0.3, parPoint: 0.3 },
          succes: { texte: "Vous disparaissez dans la brume." },
          echec:  { coque: -15, inspection: "couronne", texte: "Un boulet dans la coque vous force à vous arrêter." } }
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

    // --- Événement d'arrivée (déclenché par "evenementArrivee" d'une île) ---
    { id: "fouille_tresor", titre: "La croix du Pendu", icone: "💀", theme: "tresor", chanceParJour: 0,
      texte: "La carte indique un vieux gibet au sommet de l'île. L'équipage débarque avec des pelles.",
      choix: [
        { texte: "Creuser sous le gibet", test: { competence: "navigation", base: 0.55, parPoint: 0.25 },
          succes: { gagner: ["coffre", 1], moral: 20, cohesion: 10, texte: "Les pelles heurtent du bois : un coffre plein d'or ! Il faut lui faire de la place dans la cale." },
          echec:  { blesse: 25, moral: -10, texte: "Un éboulement ! Le coffre reste introuvable… pour cette fois." } },
        { texte: "Repartir, l'île est maudite", test: null, succes: { moral: -5, texte: "Les superstitieux soufflent de soulagement." } }
      ] }
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
  carte: {
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
