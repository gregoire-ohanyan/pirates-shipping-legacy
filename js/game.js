/* =====================================================================
   PIRATES : SHIPPING LEGACY — MOTEUR DU PROTOTYPE 0.5
   Ce fichier ne contient aucune valeur d'équilibrage : tout est lu
   dans js/config.js (window.CONFIG).
   ===================================================================== */
"use strict";
(function () {

const C = window.CONFIG;
const parId = (liste) => Object.fromEntries(liste.map((e) => [e.id, e]));
const DB = {
  items: parId(C.items), iles: parId(C.iles), factions: parId(C.factions), navires: parId(C.navires),
  amelios: parId(C.ameliorations), roles: parId(C.roles.liste), marins: parId(C.marins), traits: parId(C.traits),
  evts: parId(C.evenements), quetes: parId(C.quetes), legendes: parId(C.legendes),
  sallesTypes: parId(C.salles.types), typesCale: parId(C.typesCale)
};
const CLE_SAUVEGARDE = "psl-proto-sauvegarde-v1";

/* ---------------- Outils ---------------- */
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const alea = (a, b) => a + Math.random() * (b - a);
const aleaInt = (a, b) => Math.floor(alea(a, b + 1));
const choisir = (t) => t[Math.floor(Math.random() * t.length)];
const arr = (v) => Math.round(v);
let compteurUid = 1;
const uid = () => "u" + Date.now().toString(36) + (compteurUid++);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const pct = (v) => Math.round(v * 100) + " %";

/* ---------------- État du jeu ---------------- */
let S = null;          // état complet (sauvegardé)
let enPause = true;    // le temps s'écoule-t-il ?
let vitesseIdx = 0;
let selection = null;  // uid de l'item sélectionné dans la cale
let destination = null;// { ile } ou { x, y } choisi sur la carte
let glisse = null;     // état du glisser-déposer
let modaleOuverte = false;

function nouvellePartie() {
  const d = C.depart;
  const ileDep = DB.iles[d.ile];
  S = {
    version: 1,
    temps: 0.3,
    or: d.or,
    coffre: 0,
    ile: d.ile,
    pos: { x: ileDep.x, y: ileDep.y },
    navire: { type: d.navire, coque: DB.navires[d.navire].coqueMax, amelios: [], nom: DB.navires[d.navire].nomParDefaut },
    cale: [], quai: [],
    equipage: d.equipage.map(creerMarin),
    marinsPasses: [...d.equipage],
    cohesion: 50,
    joursSansFrais: 0,
    connues: C.iles.filter((i) => i.connue).map((i) => i.id),
    brouillard: [],
    reputation: { iles: {}, factions: {} },
    mefiance: {},
    prixMod: {},
    contrats: [],
    offres: {},
    quetesFaites: [],
    evtArriveeFaits: [],
    voyage: null,
    joursEnMer: 0,
    journal: [],
    generation: 1,
    stats: {}, jalons: [], jalonsNonVus: 0,
    cosmetiques: { couleurs: [], pavillons: [], titres: [] }, apparence: { couleur: "modele", pavillon: "marchand" }, titre: null,
    marche: [], rumeurs: [], bilan: null,
    monde: 2, legendes: C.legendes.filter((l) => l.depart).map((l) => l.id), legendesNonVues: 0
  };
  C.iles.forEach((i) => { S.reputation.iles[i.id] = 0; S.prixMod[i.id] = {}; });
  C.factions.forEach((f) => { S.reputation.factions[f.id] = 0; S.mefiance[f.id] = 0; });
  S.connues.forEach((id) => devoilerAutour(DB.iles[id].x, DB.iles[id].y));
  placementConseille();
  d.cargaison.forEach(([id, n]) => { for (let k = 0; k < n; k++) { const it = creerItem(id); if (!placerAuto(it)) S.quai.push(it); } });
  genererOffres(S.ile);
  journal("An " + C.monde.annee + " du Fanal. Votre cotre est amarré à <b>" + esc(ileDep.nom) + "</b>.");
  C.legendes.filter((l) => l.ile === d.ile).forEach((l) => S.legendes.push(l.id));
  S.stats.legendes = S.legendes.length;
  sauver();
}

function creerMarin(id) {
  const m = DB.marins[id];
  return { id, nom: m.nom, role: m.role, secondaire: m.secondaire, traits: [...m.traits], sante: 100, moral: 70, salaire: m.salaire, portrait: m.portrait, salle: null };
}
function creerItem(id, extra) {
  const d = DB.items[id];
  return Object.assign({ uid: uid(), id, x: -1, y: -1, rot: false, etat: 100, r: d.rations || 0, contrat: null }, extra || {});
}

function sauver() { try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }
function charger() {
  try { const t = localStorage.getItem(CLE_SAUVEGARDE); if (t) { const s = JSON.parse(t); if (s && s.version === 1) { S = s; migrer(); return true; } } } catch (e) {}
  return false;
}
function migrer() {
  // Sauvegardes d'avant la 0.4.0 : une seule cale, marins sans salle, navire sans nom
  if (!S.navire.nom) S.navire.nom = navire().nomParDefaut;
  // 0.5.0 : progression
  S.stats = S.stats || {}; S.jalons = S.jalons || []; S.jalonsNonVus = S.jalonsNonVus || 0;
  S.cosmetiques = S.cosmetiques || { couleurs: [], pavillons: [], titres: [] }; S.apparence = S.apparence || { couleur: "modele", pavillon: "marchand" };
  if (S.titre === undefined) S.titre = null; S.marche = S.marche || []; S.rumeurs = S.rumeurs || []; if (S.bilan === undefined) S.bilan = null;
  // 0.6.0 : refonte du monde (nouvelles factions, légendes)
  if (!S.monde) {
    const corresp = { couronne: "fanaux", compagnie: "couronne", colonies: "etoile", confrerie: "naufrageurs" };
    const remap = (o) => { const n = {}; Object.keys(o || {}).forEach((k) => { n[corresp[k] || k] = o[k]; }); return n; };
    S.reputation.factions = remap(S.reputation.factions); S.mefiance = remap(S.mefiance);
    S.monde = 2;
  }
  C.factions.forEach((f) => { if (S.reputation.factions[f.id] === undefined) S.reputation.factions[f.id] = 0; if (S.mefiance[f.id] === undefined) S.mefiance[f.id] = 0; });
  if (!S.legendes) { S.legendes = C.legendes.filter((l) => l.depart || (l.ile && S.evtArriveeFaits.concat([S.ile]).includes(l.ile))).map((l) => l.id); S.legendesNonVues = 0; }
  S.legendes = S.legendes.filter((id) => DB.legendes[id]); S.stats.legendes = S.legendes.length;
  S.cale.forEach((it) => { if (!it.cale || !salleDef(it.cale) || !salleDef(it.cale).cale) it.cale = calePrincipale(); });
  verifierPlacement();
}
function journal(t) { S.journal.unshift({ j: jour(), t }); S.journal = S.journal.slice(0, 60); }

/* ---------------- Accès aux données ---------------- */
const navire = () => DB.navires[S.navire.type];
const ileAct = () => (S.ile ? DB.iles[S.ile] : null);
const aAmelio = (effet) => S.navire.amelios.some((a) => DB.amelios[a].effet === effet);
const coqueMax = () => navire().coqueMax + S.navire.amelios.reduce((s, a) => s + (DB.amelios[a].bonusCoque || 0), 0);
const jour = () => Math.floor(S.temps) + 1;
const heure = () => S.temps - Math.floor(S.temps);
const estNuit = () => heure() >= C.temps.debutNuit || heure() < C.temps.finNuit;
const tousItems = () => S.cale.concat(S.quai);

/* ---------------- Salles et cales ---------------- */
function sallesNavire() { return navire().salles; }
function salleDef(id) { return navire().salles.find((s) => s.id === id); }
function typeSalle(s) { return DB.sallesTypes[s.type]; }
function nomSalle(s) { return s.nom || (s.cale ? DB.typesCale[s.cale.type].nom : typeSalle(s).nom); }
function cales() { return navire().salles.filter((s) => s.cale); }
function calePrincipale() { const c = cales(); const p = c.find((s) => s.id === "cale"); return (p || c[0]).id; }
function caleDef(id) {
  const s = salleDef(id) || salleDef(calePrincipale());
  return Object.assign({}, DB.typesCale[s.cale.type], s.cale, { id: s.id, type: s.cale.type, nom: nomSalle(s), salle: s });
}
function itemsDe(caleId) { return S.cale.filter((it) => it.cale === caleId); }
function caleDe(it) { return caleDef(it.cale); }

/* ---------------- Grille d'une cale ---------------- */
function dims(it) { const d = DB.items[it.id]; return it.rot ? { w: d.hauteur, h: d.largeur } : { w: d.largeur, h: d.hauteur }; }
function casesDe(it, x, y, rot) {
  const d = DB.items[it.id]; const w = rot ? d.hauteur : d.largeur; const h = rot ? d.largeur : d.hauteur;
  const r = []; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) r.push([x + i, y + j]); return r;
}
function occupation(caleId, ignorer) {
  const k = caleDef(caleId); const g = Array.from({ length: k.rangees }, () => Array(k.colonnes).fill(null));
  itemsDe(k.id).forEach((it) => { if (it.uid === ignorer) return; casesDe(it, it.x, it.y, it.rot).forEach(([x, y]) => { if (g[y] && x < k.colonnes) g[y][x] = it.uid; }); });
  return g;
}
/* Gravité : un item doit reposer sur le plancher de sa cale ou sur d'autres items.
   Avec cale.appuiCentre, son centre doit en plus se trouver au-dessus de ses appuis.
   Les items "fixe" (planches) sont cloués à la coque : ils n'ont pas besoin d'appui et ne tombent jamais. */
function appuiInfo(it, caleId, x, y, rot, g) {
  const d = DB.items[it.id]; const k = caleDef(caleId); const w = rot ? d.hauteur : d.largeur; const h = rot ? d.largeur : d.hauteur;
  const bas = y + h;
  if (bas >= k.rangees) return { contact: true, stable: true };
  if (d.fixe) return { contact: false, stable: true };
  const appuis = []; for (let i = 0; i < w; i++) if (g[bas] && g[bas][x + i]) appuis.push(x + i);
  if (!appuis.length) return { contact: false, stable: false };
  if (!C.cale.appuiCentre) return { contact: true, stable: true };
  const centre = x + w / 2;
  return { contact: true, stable: centre >= Math.min(...appuis) && centre <= Math.max(...appuis) + 1 };
}
function raisonPlacement(it, caleId, x, y, rot, g) {
  const k = caleDef(caleId);
  if (k.accepte && !k.accepte.includes(it.id)) return "type";
  g = g || occupation(k.id, it.uid);
  for (const [cx, cy] of casesDe(it, x, y, rot)) { if (cx < 0 || cy < 0 || cx >= k.colonnes || cy >= k.rangees) return "hors"; if (g[cy][cx]) return "occupe"; }
  return appuiInfo(it, k.id, x, y, rot, g).stable ? null : "appui";
}
function peutPlacer(it, caleId, x, y, rot, g) { return raisonPlacement(it, caleId, x, y, rot, g) === null; }
function appliquerGravite(sansDegats) {
  const chutes = []; let bouge = true; let garde = 0;
  while (bouge && garde++ < 60) {
    bouge = false;
    const tri = [...S.cale].sort((a, b) => (b.y + dims(b).h) - (a.y + dims(a).h)); // du bas vers le haut
    for (const it of tri) {
      if (DB.items[it.id].fixe) continue;
      const k = caleDe(it); const g = occupation(k.id, it.uid); let y = it.y;
      while (!appuiInfo(it, k.id, it.x, y, it.rot, g).contact && casesDe(it, it.x, y + 1, it.rot).every(([cx, cy]) => cy < k.rangees && !g[cy][cx])) y++;
      if (y !== it.y) { const c = chutes.find((q) => q[0] === it); if (c) c[1] += y - it.y; else chutes.push([it, y - it.y]); it.y = y; bouge = true; }
    }
  }
  if (!sansDegats && chutes.length) {
    let abimes = 0;
    chutes.forEach(([it, r]) => { if (DB.items[it.id].fragile) { it.etat = clamp(it.etat - r * C.cale.degatsChuteParRangee, 0, 100); abimes++; } });
    toast("⬇ " + chutes.length + " item(s) ont glissé vers le bas" + (abimes ? " · " + abimes + " fragile(s) abîmé(s)" : ""));
  }
  return chutes;
}
function estContrebandeQuelquePart(itemId) { return C.iles.some((i) => i.interdits.includes(itemId)); }
function ordreCales(it) {
  const d = DB.items[it.id];
  return cales().map((s) => caleDef(s.id)).filter((k) => !k.accepte || k.accepte.includes(it.id)).map((k) => {
    let sc = (k.colonnes * k.rangees) / 100;
    if (d.craintEau && !k.fondHumide) sc += 3;
    if (d.perissable && k.toutVentile) sc += 3;
    if (k.accepte) sc += 4;
    if (k.discretion) sc += estContrebandeQuelquePart(d.id) ? 4 : -3;
    return [k, sc];
  }).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
}
function placerDans(it, k) {
  const d = DB.items[it.id]; const g = occupation(k.id, it.uid);
  // Ce qui craint l'eau cherche d'abord en haut, le reste d'abord en bas (stabilité).
  const rangees = [...Array(k.rangees).keys()]; if (!d.craintEau) rangees.reverse();
  const centre = (k.colonnes - dims(it).w) / 2; // on remplit depuis le centre pour garder le navire équilibré
  const colonnes = [...Array(k.colonnes).keys()].sort((a, b) => Math.abs(a - centre) - Math.abs(b - centre));
  for (const rot of [false, true]) for (const y of rangees) for (const x of colonnes) {
    if (peutPlacer(it, k.id, x, y, rot, g)) { it.cale = k.id; it.x = x; it.y = y; it.rot = rot; S.quai = S.quai.filter((q) => q.uid !== it.uid); if (!S.cale.includes(it)) S.cale.push(it); return true; }
  }
  return false;
}
function placerAuto(it, caleId) {
  const ancienne = S.cale.includes(it) ? { cale: it.cale, x: it.x, y: it.y, rot: it.rot } : null;
  if (ancienne) S.cale = S.cale.filter((c) => c !== it);
  const liste = caleId ? [caleDef(caleId)] : ordreCales(it);
  for (const k of liste) if (placerDans(it, k)) { if (ancienne) appliquerGravite(); return true; }
  if (ancienne) { Object.assign(it, ancienne); S.cale.push(it); }
  return false;
}
function versQuai(it) { const etaitEnCale = S.cale.includes(it); S.cale = S.cale.filter((c) => c.uid !== it.uid); it.x = -1; it.y = -1; if (!S.quai.includes(it)) S.quai.push(it); if (etaitEnCale) appliquerGravite(); }
function retirer(it) { const etaitEnCale = S.cale.includes(it); S.cale = S.cale.filter((c) => c.uid !== it.uid); S.quai = S.quai.filter((c) => c.uid !== it.uid); if (selection === it.uid) selection = null; if (etaitEnCale) appliquerGravite(); }
function dansCachette(it) {
  const k = caleDe(it); if (k.discretion) return true;
  if (!aAmelio("cachette")) return false;
  const cs = (k.cachette || []).map((c) => c.join(","));
  return casesDe(it, it.x, it.y, it.rot).every((c) => cs.includes(c.join(",")));
}
function discretionItem(it) { const k = caleDe(it); if (k.discretion) return k.discretion; return dansCachette(it) ? C.contrebande.cachetteDiscretion : C.contrebande.discretionNormale; }
function auFond(it) { const k = caleDe(it); if (!k.fondHumide) return false; const { h } = dims(it); return it.y + h - 1 >= k.rangees - 1; }
function ventile(it) { const k = caleDe(it); if (k.toutVentile) return true; const { w } = dims(it); for (let i = 0; i < w; i++) if ((k.colonnesVentilees || []).includes(it.x + i)) return true; return false; }
function facteurVentilation(it) { const k = caleDe(it); return k.ventilation || C.cale.ventilation; }
function poidsAuDessus(it) {
  const { w } = dims(it); const vus = new Set(); let p = 0; const g = occupation(it.cale, it.uid);
  for (let i = 0; i < w; i++) for (let y = it.y - 1; y >= 0; y--) { const u = g[y][it.x + i]; if (u && !vus.has(u)) { vus.add(u); p += DB.items[S.cale.find((c) => c.uid === u).id].poids; } }
  return p;
}

/* ---------------- Statistiques du navire ---------------- */
function charge() { return S.cale.reduce((s, it) => s + DB.items[it.id].poids, 0); }
function chargeCale(caleId) { return itemsDe(caleId).reduce((s, it) => s + DB.items[it.id].poids, 0); }
function ratioCharge() { return charge() / navire().chargeMax; }
function posGlobale(it) { // position de l'item dans la vue en coupe du navire
  const k = caleDe(it); const s = k.salle; const d = dims(it);
  return { x: s.x + (it.x + d.w / 2) / k.colonnes * s.l, y: s.y + (it.y + d.h / 2) / k.rangees * s.h };
}
function centreGravite() {
  let p = 0, mx = 0, my = 0;
  S.cale.forEach((it) => { const w = DB.items[it.id].poids; const g = posGlobale(it); p += w; mx += w * g.x; my += w * g.y; });
  return p ? { x: mx / p, y: my / p } : null;
}
function stabilite() {
  const cg = centreGravite(); if (!cg) return 1; const cp = navire().coupe;
  const fond = Math.max(...cales().map((s) => s.y + s.h));
  return clamp(0.2 + 0.8 * (cg.y - cp.pont) / Math.max(1, fond - cp.pont), 0, 1);
}
function desequilibre() { // −1 = tout à la poupe (gauche), +1 = tout à la proue (droite)
  const cg = centreGravite(); if (!cg) return 0;
  const xs = cales().flatMap((s) => [s.x, s.x + s.l]); const min = Math.min(...xs), max = Math.max(...xs);
  return clamp((cg.x - (min + max) / 2) / ((max - min) / 2), -1, 1);
}

/* ---------------- Équipage et salles ---------------- */
function formeMarin(m) { return 0.5 + 0.5 * Math.min(m.sante, m.moral) / 100; }
function apportBrut(m, c) { // ce que le marin sait faire dans cette compétence, avant la salle
  if (DB.roles[m.role].competence === c) return 1;
  if (m.secondaire && DB.roles[m.secondaire].competence === c) return C.roles.efficaciteSecondaire;
  return 0;
}
function occupants(salleId) { return S.equipage.filter((m) => m.salle === salleId); }
function competenceSalle(c, salleId) {
  const s = salleDef(salleId); if (!s) return 0; const f = (typeSalle(s).competences || {})[c] || 0; if (!f) return 0;
  const vals = occupants(salleId).map((m) => apportBrut(m, c) * formeMarin(m) * f).filter((v) => v > 0).sort((a, b) => b - a);
  const rd = C.salles.rendements;
  return vals.reduce((s, v, i) => s + v * (rd[i] !== undefined ? rd[i] : rd[rd.length - 1]), 0);
}
function competence(c) {
  let v;
  if (C.salles.competencesGlobales.includes(c)) v = S.equipage.reduce((s, m) => s + apportBrut(m, c) * formeMarin(m), 0);
  else v = sallesNavire().reduce((s, sa) => s + competenceSalle(c, sa.id), 0);
  if (c === "defense") v += navire().canons * 0.12;
  return v;
}
function apportDans(m, salleId) { // valeur du marin dans une salle (pour le placement conseillé)
  const s = salleDef(salleId); if (!s) return 0; const comp = typeSalle(s).competences || {};
  return Object.keys(comp).reduce((t, c) => t + apportBrut(m, c) * comp[c], 0);
}
function statutMarin(m) {
  const s = salleDef(m.salle); if (!s) return "inutile"; const t = typeSalle(s);
  if (t.action === "repos") return "repos";
  const v = apportDans(m, m.salle);
  if (t.action === "soin" && !(apportBrut(m, "medecine") > 0)) return "patient";
  if (v >= 1) return "principal"; if (v > 0) return "secondaire"; return "inutile";
}
function placesLibres(salleId) { const s = salleDef(salleId); return s ? s.places - occupants(salleId).length : 0; }
function placerMarin(m, exclure) {
  // la salle libre où le marin est le plus utile, en tenant compte du rendement décroissant
  let best = null, bv = -1;
  sallesNavire().forEach((s) => {
    if (s.places - occupants(s.id).filter((o) => o !== m).length <= 0 || (exclure && exclure.includes(s.id))) return;
    const rang = occupants(s.id).filter((o) => o !== m && apportDans(o, s.id) > 0).length; const rd = C.salles.rendements;
    let v = apportDans(m, s.id) * (rd[rang] !== undefined ? rd[rang] : rd[rd.length - 1]);
    if (typeSalle(s).action === "soin" && m.sante < 50 && !(apportBrut(m, "medecine") > 0)) v += 0.6;
    if (s.type === "pont") v += 0.01; // à valeur égale, sur le pont
    if (v > bv) { bv = v; best = s; }
  });
  m.salle = best ? best.id : sallesNavire()[0].id;
}
function verifierPlacement() {
  S.equipage.forEach((m) => { if (!salleDef(m.salle)) m.salle = null; });
  sallesNavire().forEach((s) => { const occ = occupants(s.id); for (let k = s.places; k < occ.length; k++) occ[k].salle = null; });
  S.equipage.filter((m) => !m.salle).forEach((m) => placerMarin(m));
}
function placementConseille() {
  S.equipage.forEach((m) => { m.salle = null; });
  const ordre = [...S.equipage].sort((a, b) => Math.max(...sallesNavire().map((s) => apportDans(b, s.id))) - Math.max(...sallesNavire().map((s) => apportDans(a, s.id))));
  ordre.forEach((m) => placerMarin(m));
}
function posteTempete() {
  placementConseille(); if (!salleDef("pont")) return;
  const garder = (m) => { const s = salleDef(m.salle); return m.salle === "pont" || (s.cale && apportBrut(m, "arrimage") >= 1); };
  S.equipage.filter((m) => !garder(m)).sort((a, b) => apportBrut(b, "navigation") - apportBrut(a, "navigation")).forEach((m) => { if (placesLibres("pont") > 0) m.salle = "pont"; });
}
function posteRepos() {
  const soin = sallesNavire().find((s) => typeSalle(s).action === "soin"); const dodo = sallesNavire().find((s) => typeSalle(s).action === "repos");
  if (!soin && !dodo) { toast("Ce navire n'a ni infirmerie ni dortoir."); return false; }
  placementConseille();
  const blesses = S.equipage.filter((m) => m.sante < 70 && !(apportBrut(m, "medecine") > 0)).sort((a, b) => a.sante - b.sante);
  blesses.forEach((m) => { if (soin && placesLibres(soin.id) > 0) m.salle = soin.id; });
  if (dodo) S.equipage.filter((m) => m.salle !== "pont" && statutMarin(m) === "inutile").forEach((m) => { if (placesLibres(dodo.id) > 0) m.salle = dodo.id; });
  return true;
}
function deplacerMarin(m, salleId) {
  const s = salleDef(salleId); if (!s || m.salle === salleId) return false;
  if (s.places <= 0) { toast("Pas de place pour un marin ici."); return false; }
  if (placesLibres(salleId) <= 0) { // échange avec l'occupant le moins utile
    const autre = occupants(salleId).sort((a, b) => apportDans(a, salleId) - apportDans(b, salleId))[0];
    autre.salle = m.salle;
  }
  m.salle = salleId; return true;
}
function vitesseNavire() {
  const n = navire(); const r = ratioCharge(); const cc = C.cale; let f = 1;
  if (r > 1) f = cc.surchargeVitesse;
  else if (r > cc.seuilRalentissement) f = 1 - cc.ralentissementMax * (r - cc.seuilRalentissement) / (1 - cc.seuilRalentissement);
  f *= 1 - cc.desequilibreMax * Math.abs(desequilibre());
  return n.vitesse * f * (1 + 0.12 * competence("navigation"));
}
function rations() { return S.cale.reduce((s, it) => s + (it.r || 0), 0); }
function joursDeVivres() { return S.equipage.length ? rations() / (S.equipage.length * C.equipage.rationsParMarinParJour) : 99; }
function moralMoyen() { return S.equipage.reduce((s, m) => s + m.moral, 0) / Math.max(1, S.equipage.length); }

/* ---------------- Réputation, factions, méfiance ---------------- */
function palierDe(v) { let p = C.paliersReputation[0]; C.paliersReputation.forEach((x) => { if (v >= x.min) p = x; }); return p; }
function palierIle(ileId) { return palierDe(S.reputation.iles[ileId] || 0); }
function effetPalier(ileId, k, def) { if (!ileId) return def; const e = palierIle(ileId).effets; return e[k] !== undefined ? e[k] : def; }
function palierSuivant(v) { return C.paliersReputation.find((x) => x.min > v) || null; }
function effetsFactionActifs(fid) { const v = S.reputation.factions[fid] || 0; return C.factionsPaliers.filter((p) => p.faction === fid && (p.seuil > 0 ? v >= p.seuil : v <= p.seuil)); }
function effetFaction(fid, effet) { return effetsFactionActifs(fid).find((p) => p.effet === effet) || null; }
function valeurFaction(fid, effet, def) { const e = effetFaction(fid, effet); return e ? (e.valeur !== undefined ? e.valeur : true) : def; }
function effetQuelconque(effet) { for (const f of C.factions) { const e = effetFaction(f.id, effet); if (e) return e; } return null; }
function valeurQuelconque(effet, def) { const e = effetQuelconque(effet); return e ? (e.valeur !== undefined ? e.valeur : def) : def; }
function rivale(fid) { const p = C.rivalites.paires.find((x) => x.includes(fid)); return p ? p.find((x) => x !== fid) : null; }
function niveauMefiance(fid) { let n = C.mefiance.niveaux[0]; C.mefiance.niveaux.forEach((x) => { if ((S.mefiance[fid] || 0) >= x.min) n = x; }); return n; }
function changerRep(ileId, v) {
  if (!ileId || !v) return; const i = DB.iles[ileId]; const avant = palierIle(ileId).id;
  S.reputation.iles[ileId] = clamp((S.reputation.iles[ileId] || 0) + v, -100, 100);
  const gf = v * C.reputation.partageFaction;
  S.reputation.factions[i.faction] = clamp((S.reputation.factions[i.faction] || 0) + gf, -100, 100);
  if (gf > 0) { const r = rivale(i.faction); if (r) S.reputation.factions[r] = clamp((S.reputation.factions[r] || 0) - gf * C.rivalites.taux, -100, 100); }
  const apres = palierIle(ileId);
  if (apres.id !== avant) { journal("⭐ <b>" + esc(i.nom) + "</b> : vous êtes désormais <b>" + esc(apres.nom) + "</b>."); toast("⭐ " + i.nom + " : " + apres.nom); }
}
const repTexte = (v) => palierDe(v).nom;
function marcheOuvert(ileId) { const i = DB.iles[ileId]; return !!(i && i.marche && !effetFaction(i.faction, "boycott")); }

/* ---------------- Statistiques ---------------- */
function stat(k, v) { S.stats[k] = (S.stats[k] || 0) + (v === undefined ? 1 : v); }

/* ---------------- Marché vivant et rumeurs ---------------- */
function ilesMarche(connuesSeulement) { return C.iles.filter((i) => i.marche && (!connuesSeulement || S.connues.includes(i.id))); }
function creerEvenementMarche(connuesSeulement) {
  const M = C.marche; const iles = ilesMarche(connuesSeulement); if (!iles.length) return null;
  const debut = S.temps + alea(M.delai[0], M.delai[1]);
  const e = { id: "m" + uid(), ile: choisir(iles).id, item: choisir(M.items), type: Math.random() < 0.5 ? "penurie" : "abondance", debut, fin: debut + alea(M.duree[0], M.duree[1]) };
  S.marche.push(e); return e;
}
function majMarche() {
  S.marche = S.marche.filter((e) => e.fin > S.temps);
  if (Math.random() < C.marche.evenementsParJour) creerEvenementMarche(false);
}
function evenementMarche(ileId, itemId) { return (S.marche || []).find((x) => x.ile === ileId && x.item === itemId && x.debut <= S.temps && S.temps <= x.fin) || null; }
function multMarche(ileId, itemId) { const e = evenementMarche(ileId, itemId); return e ? (e.type === "penurie" ? C.marche.penurie : C.marche.abondance) : 1; }
function texteRumeur(r) {
  const n = DB.items[r.item].nom.toLowerCase(); const ile = DB.iles[r.ile].nom;
  return r.type === "penurie" ? "Les « " + n + " » vont manquer à " + ile + " : les prix vont s'envoler." : ile + " va crouler sous les « " + n + " » : les prix vont s'effondrer.";
}
function statutRumeur(r) {
  if (r.statut === "confirmee") return ["pos", "✔ Confirmée"];
  if (r.statut === "fausse") return ["neg", "✘ Fausse rumeur"];
  if (S.temps < r.debut) return ["", "Dans ≈ " + Math.ceil(r.debut - S.temps) + " j, pendant ≈ " + Math.round(r.fin - r.debut) + " j"];
  if (S.temps <= r.fin) return ["", "En ce moment, encore ≈ " + Math.ceil(r.fin - S.temps) + " j"];
  return ["", "Passée"];
}
async function ecouterRumeur() {
  const prix = C.rumeurs.prix; const cle = S.ile + ":" + Math.floor(S.temps);
  if (S.or < prix) return toast("Pas assez d'or pour payer un verre.");
  if (S.rumeurEscale === cle) return toast("Plus personne n'a de nouvelles aujourd'hui. Revenez demain.");
  S.or -= prix; S.rumeurEscale = cle;
  const fiab = Math.min(0.95, C.rumeurs.fiabilite + C.rumeurs.fiabiliteParCommerce * competence("commerce"));
  const vraie = Math.random() < fiab; let e;
  if (vraie) {
    const deja = new Set(S.rumeurs.map((r) => r.ref));
    const cand = S.marche.filter((x) => x.fin > S.temps && !deja.has(x.id) && S.connues.includes(x.ile) && x.ile !== S.ile);
    e = cand.length ? choisir(cand) : creerEvenementMarche(true);
  } else {
    const iles = ilesMarche(true).filter((i) => i.id !== S.ile); const debut = S.temps + alea(C.marche.delai[0], C.marche.delai[1]);
    e = { id: "f" + uid(), ile: choisir(iles.length ? iles : ilesMarche(true)).id, item: choisir(C.marche.items), type: Math.random() < 0.5 ? "penurie" : "abondance", debut, fin: debut + alea(C.marche.duree[0], C.marche.duree[1]) };
  }
  if (!e) return;
  const r = { ref: e.id, ile: e.ile, item: e.item, type: e.type, debut: e.debut, fin: e.fin, vraie, jour: S.temps, statut: null };
  S.rumeurs.unshift(r); S.rumeurs = S.rumeurs.slice(0, 12);
  const qui = choisir(["Un vieux marin jure que", "La serveuse a entendu dire que", "Un douanier de la Couronne raconte que", "Un pêcheur éméché affirme que", "Cap'taine, le vieux perroquet, croasse que", "Un homme à l'étoile tatouée murmure que"]);
  journal("👂 Rumeur : " + esc(texteRumeur(r)));
  rendreTout(); sauver();
  await modale({ titre: "Rumeur de taverne", icone: "🍺", theme: "tresor", html: "<p><i>" + esc(qui) + "…</i></p><p><b>" + esc(texteRumeur(r)) + "</b></p><p class='muted'>" + esc(statutRumeur(r)[1]) + ". Les rumeurs ne sont pas toujours vraies : un bon négociant au poste de capitaine en entend de plus fiables.</p>", boutons: [{ t: "Noter dans le journal", primaire: true }] });
}

/* ---------------- Légendes ---------------- */
function prochainePage() { return C.legendes.filter((l) => l.page && !S.legendes.includes(l.id)).sort((a, b) => a.page - b.page)[0] || null; }
function debloquerLegende(id, discret) {
  const l = id === "page" ? prochainePage() : DB.legendes[id];
  if (!l || S.legendes.includes(l.id)) return null;
  S.legendes.push(l.id); S.legendesNonVues = (S.legendesNonVues || 0) + 1; S.stats.legendes = S.legendes.length; if (l.page) stat("pagesAlienor");
  journal("📖 Légende découverte : <b>" + esc(l.titre) + "</b>.");
  if (!discret) toast("📖 Nouvelle légende : " + l.titre);
  planifierJalons();
  return l;
}
function legendesTaverne(ileId) { return C.legendes.filter((l) => l.taverne === ileId && !S.legendes.includes(l.id)); }
async function ecouterLegende() {
  const i = ileAct(); if (!i) return; const l = legendesTaverne(i.id)[0]; if (!l) return;
  debloquerLegende(l.id, true); rendreTout(); sauver();
  const qui = choisir(["Un vieux marin édenté se penche vers vous", "Une matelote aux bras tatoués baisse la voix", "Le tavernier essuie un verre et raconte", "Un pêcheur aveugle tend la main vers le feu"]);
  await modale({ titre: l.titre, icone: "📖", theme: "fantome", html: "<p><i>" + esc(qui) + "…</i></p><p>" + esc(l.texte) + "</p><p class='muted'>Retrouvez toutes les légendes dans l'onglet Quêtes.</p>", boutons: [{ t: "Merci, l'ancien", primaire: true }] });
}

/* ---------------- Note d'arrimage ---------------- */
function noteArrimage() {
  const N = C.noteArrimage; let s = 100; const det = [];
  const risque = S.cale.filter(enRisque).length; if (risque) { s -= risque * N.parItemARisque; det.push(risque + " item(s) mal protégé(s)"); }
  const mal = S.cale.filter((it) => !DB.items[it.id].fixe && !appuiInfo(it, it.cale, it.x, it.y, it.rot, occupation(it.cale, it.uid)).stable).length;
  if (mal) { s -= mal * N.parItemMalCale; det.push(mal + " item(s) mal calé(s)"); }
  const dq = Math.abs(desequilibre()); if (dq >= 0.15) { s -= dq * N.assiette; det.push("assiette déséquilibrée"); }
  const st = stabilite(); s -= (1 - st) * N.stabilite; if (st < 0.5) det.push("stabilité faible");
  if (ratioCharge() > 1) { s -= N.surcharge; det.push("surcharge"); }
  s = clamp(arr(s), 0, 100);
  return { score: s, lettre: N.notes.find(([min]) => s >= min)[1], details: det };
}
function moyenneEtat() { const its = S.cale.filter((it) => !DB.items[it.id].fixe && !(it.r > 0)); return its.length ? its.reduce((s, it) => s + it.etat, 0) / its.length : null; }

/* ---------------- Bilan de traversée ---------------- */
function nouveauBilan() { S.bilan = { depuis: S.ile, orDepart: S.or, tDepart: S.temps, note: noteArrimage(), etatDepart: moyenneEtat(), evts: 0, reussites: 0, livraisons: 0, parfaites: 0, gainLivraisons: 0, taxes: 0 }; }
async function montrerBilan(i) {
  const b = S.bilan; if (!b) return; S.bilan = null;
  const gain = arr(S.or - b.orDepart); const jours = S.temps - b.tDepart; const etat = moyenneEtat();
  const signe = (v) => (v >= 0 ? "+" : "−") + Math.abs(arr(v));
  const L = ["⏳ " + jours.toFixed(1).replace(".", ",") + " jours de mer", "💰 Or " + signe(gain)];
  if (b.livraisons) L.push("📜 " + b.livraisons + " livraison(s)" + (b.parfaites ? ", dont " + b.parfaites + " parfaite(s)" : ""));
  if (etat !== null && b.etatDepart !== null) L.push("📦 État de la cargaison " + arr(etat) + " %" + (Math.abs(etat - b.etatDepart) >= 1 ? " (" + signe(etat - b.etatDepart) + ")" : ""));
  L.push("📋 Note d'arrimage au départ : " + b.note.lettre);
  L.push(b.evts ? "🌊 " + b.evts + " événement(s), " + b.reussites + " réussi(s)" : "🌊 Traversée sans incident");
  if (b.taxes) L.push("🏛️ Taxe d'entrée −" + b.taxes);
  let record = false; if (gain > 0 && gain > (S.stats.recordGain || 0)) { S.stats.recordGain = gain; record = true; }
  await modale({ titre: "Bilan de la traversée", icone: record ? "🏆" : "📋", theme: record ? "tresor" : "mer",
    html: "<p class='muted'>" + esc(b.depuis ? DB.iles[b.depuis].nom : "Le large") + " → " + esc(i.nom) + "</p><div class='gros-gain' style='color:" + (gain >= 0 ? "#6b4c0a" : "#b23a2e") + "'>" + signe(gain) + " 💰</div>" + (record ? "<p style='text-align:center;font-weight:700;color:#8a6a10'>🏆 Nouveau record de traversée !</p>" : ""),
    chips: L, boutons: [{ t: "À terre !", primaire: true }] });
}

/* ---------------- Jalons et cosmétiques ---------------- */
function progressionJalon(j) {
  const c = j.condition; let v = 0, cible = c.valeur || 1;
  switch (c.type) {
    case "stat": v = S.stats[c.stat] || 0; break;
    case "ilesConnues": v = S.connues.length; break;
    case "toutesIles": v = S.connues.length; cible = C.iles.length; break;
    case "fortune": v = S.or + S.coffre; break;
    case "navire": v = S.navire.type === c.navire || S.stats["navire_" + c.navire] ? 1 : 0; cible = 1; break;
    case "equipageComplet": v = navire().equipageMax >= 3 && S.equipage.length >= navire().equipageMax ? 1 : 0; cible = 1; break;
    case "generation": v = S.generation; break;
    case "palier": { const idx = C.paliersReputation.findIndex((p) => p.id === c.palier); v = Object.keys(S.reputation.iles).some((k) => C.paliersReputation.indexOf(palierIle(k)) >= idx) ? 1 : 0; cible = 1; break; }
  }
  return { v: Math.min(v, cible), cible, fait: S.jalons.includes(j.id) };
}
function texteRecompense(r) {
  const t = [];
  if (r.or) t.push("💰 " + r.or + " or");
  if (r.couleur) { const c = C.cosmetiques.couleurs.find((x) => x.id === r.couleur); t.push("🎨 Coque « " + (c ? c.nom : r.couleur) + " »"); }
  if (r.pavillon) { const p = C.cosmetiques.pavillons.find((x) => x.id === r.pavillon); t.push("🏳️ Pavillon « " + (p ? p.nom : r.pavillon) + " »"); }
  if (r.titre) t.push("🎖️ Titre « " + r.titre + " »");
  return t;
}
let fileJalons = [];
function verifierJalons() {
  const nouveaux = C.jalons.filter((j) => !S.jalons.includes(j.id) && (() => { const p = progressionJalon(j); return p.v >= p.cible; })());
  if (!nouveaux.length) return;
  nouveaux.forEach((j) => {
    S.jalons.push(j.id); const r = j.recompense || {};
    if (r.or) S.or += r.or;
    if (r.couleur && !S.cosmetiques.couleurs.includes(r.couleur)) S.cosmetiques.couleurs.push(r.couleur);
    if (r.pavillon && !S.cosmetiques.pavillons.includes(r.pavillon)) S.cosmetiques.pavillons.push(r.pavillon);
    if (r.titre && !S.cosmetiques.titres.includes(r.titre)) { S.cosmetiques.titres.push(r.titre); if (!S.titre) S.titre = r.titre; }
    S.jalonsNonVus = (S.jalonsNonVus || 0) + 1;
    journal("🏆 Jalon atteint : <b>" + esc(j.nom) + "</b>.");
    fileJalons.push(j);
  });
  sauver(); rendreTout(); montrerJalons();
}
async function montrerJalons() {
  if (!fileJalons.length) return;
  if (modaleOuverte) { setTimeout(montrerJalons, 700); return; }
  const j = fileJalons.shift(); vibrer([20, 40, 20]);
  await modale({ titre: "Jalon atteint !", icone: "🏆", theme: "tresor", html: "<p style='font-size:18px;font-weight:700;margin-bottom:4px'>" + esc(j.nom) + "</p><p class='muted'>" + esc(j.description) + "</p>", chips: texteRecompense(j.recompense || {}).map((t) => "+ " + t), boutons: [{ t: "Magnifique !", primaire: true }].concat((j.recompense || {}).couleur || (j.recompense || {}).pavillon || (j.recompense || {}).titre ? [{ t: "🎨 Personnaliser le navire" }] : []) }).then((r) => { if (r === 1) personnaliser(); });
  if (fileJalons.length) setTimeout(montrerJalons, 300);
}
let minuteurJalons = null;
function planifierJalons() { if (!minuteurJalons) minuteurJalons = setTimeout(() => { minuteurJalons = null; if (S) verifierJalons(); }, 400); }
function couleurNavire(n) { const c = C.cosmetiques.couleurs.find((x) => x.id === (S.apparence || {}).couleur); return c && c.couleur ? c.couleur : n.couleurCoque; }
function pavillonActuel() { return C.cosmetiques.pavillons.find((x) => x.id === (S.apparence || {}).pavillon) || C.cosmetiques.pavillons[0]; }
function cosmetiqueDispo(type, id) { const liste = C.cosmetiques[type]; const c = liste.find((x) => x.id === id); return c && (c.base || S.cosmetiques[type].includes(id)); }

/* ---------------- Commerce ---------------- */
function estInterdit(itemId, ileId) { return !!ileId && DB.iles[ileId].interdits.includes(itemId); }
function prixMarche(ileId, itemId) {
  const i = DB.iles[ileId]; const d = DB.items[itemId];
  let p = d.prix * (i.produit[itemId] || i.demande[itemId] || 1);
  if (estInterdit(itemId, ileId)) p *= C.commerce.prixContrebande;
  return p * (S.prixMod[ileId][itemId] || 1) * multMarche(ileId, itemId);
}
function prixAchat(ileId, itemId) {
  const vivres = DB.items[itemId].rations ? valeurQuelconque("vivres", 1) : 1;
  return Math.max(1, arr(prixMarche(ileId, itemId) * C.commerce.margeAchat * (1 - Math.min(0.3, C.commerce.bonusCommerce * competence("commerce"))) * effetPalier(ileId, "prix", 1) * vivres));
}
function prixVente(ileId, it) {
  const noir = estInterdit(it.id, ileId) ? valeurQuelconque("marcheNoir", 1) : 1;
  return Math.max(0, arr(prixMarche(ileId, it.id) * C.commerce.margeVente * (it.etat / 100) * (1 + C.commerce.bonusCommerce * competence("commerce")) / effetPalier(ileId, "prix", 1) * (noir === true ? 1 : noir)));
}
function bougerPrix(ileId, itemId, sens) { const m = S.prixMod[ileId]; m[itemId] = clamp((m[itemId] || 1) * (1 + sens * C.commerce.elasticite), 0.4, 2.5); }
function acheter(itemId) {
  const p = prixAchat(S.ile, itemId); if (S.or < p) return toast("Pas assez d'or.");
  S.or -= p; bougerPrix(S.ile, itemId, +1);
  const it = creerItem(itemId); S.quai.push(it); selection = it.uid;
  changerRep(S.ile, (p / 100) * C.reputation.venteMarche);
  toast(DB.items[itemId].icone + " " + DB.items[itemId].nom + " posé sur le quai"); rendreTout(); sauver();
}
function vendre(it) {
  if (it.contrat) return toast("Cette marchandise appartient à un contrat.");
  const p = prixVente(S.ile, it); S.or += p; bougerPrix(S.ile, it.id, -1); retirer(it); stat("ventesOr", p);
  changerRep(S.ile, (p / 100) * C.reputation.venteMarche);
  journal("Vendu " + esc(DB.items[it.id].nom) + " pour " + p + " or."); rendreTout(); sauver();
}

/* ---------------- Contrats et quêtes ---------------- */
function joursTrajet(a, b) { return dist(a, b) / Math.max(1, vitesseNavire()); }
function genererOffres(ileId) {
  const i = DB.iles[ileId]; const ca = C.contratsAleatoires; const offres = []; const pal = palierIle(ileId).effets;
  if (i.marche && pal.contrats !== false && marcheOuvert(ileId)) {
    const dests = S.connues.filter((d) => d !== ileId && DB.iles[d].marche);
    const fac = valeurFaction(i.faction, "contratsBonus", 1); const mult = (pal.recompense || 1) * (fac === true ? 1 : fac);
    const n = ca.parPort + (pal.contratsBonus || 0);
    for (let k = 0; k < n && dests.length; k++) {
      const dest = choisir(dests); const item = choisir(ca.items); const q = aleaInt(ca.quantiteMin, ca.quantiteMax);
      const j = joursTrajet(i, DB.iles[dest]);
      offres.push({ id: "c" + uid(), type: "livraison", titre: "Livraison pour " + DB.iles[dest].nom, origine: ileId, destination: dest, item, quantite: q,
        delaiJours: Math.ceil(j * ca.margeDelai) + 1, etatMin: ca.etatMin,
        recompense: arr((DB.items[item].prix * q * ca.recompenseParValeur + j * ca.recompenseParJour) * mult), reputation: ca.reputation, aleatoire: true });
    }
    const cr = C.contratsRares;
    if (dests.length && Math.random() < cr.chance + (pal.rares || 0)) {
      const dest = choisir(dests); const item = choisir(cr.items); const q = aleaInt(1, 2); const j = joursTrajet(i, DB.iles[dest]);
      offres.unshift({ id: "r" + uid(), type: "livraison", rare: true, titre: "Commande exceptionnelle pour " + DB.iles[dest].nom, origine: ileId, destination: dest, item, quantite: q,
        delaiJours: Math.max(2, Math.ceil(j * ca.margeDelai * cr.multDelai) + 1), etatMin: cr.etatMin,
        recompense: arr((DB.items[item].prix * q * ca.recompenseParValeur + j * ca.recompenseParJour) * cr.multRecompense * mult), reputation: ca.reputation * 2, aleatoire: true,
        texte: "Un riche client paie très cher… à condition que la marchandise arrive vite et en parfait état." });
    }
  }
  S.offres[ileId] = offres;
}
function prerequisOk(q) {
  const p = q.prerequis || {};
  if (p.quetes && !p.quetes.every((id) => S.quetesFaites.includes(id))) return false;
  if (p.reputationIle && !Object.entries(p.reputationIle).every(([il, v]) => (S.reputation.iles[il] || 0) >= v)) return false;
  return true;
}
function offresIci() {
  if (!S.ile) return [];
  const ouvert = effetPalier(S.ile, "contrats", true) !== false && effetPalier(S.ile, "quetes", true) !== false;
  const quetes = ouvert ? C.quetes.filter((q) => q.origine === S.ile && !S.quetesFaites.includes(q.id) && !S.contrats.some((c) => c.id === q.id) && prerequisOk(q)) : [];
  return quetes.concat(S.offres[S.ile] || []);
}
function accepter(o) {
  if (o.type === "decouverte") {
    (o.revele || []).forEach((id) => connaitre(id));
    S.quetesFaites.push(o.id);
    journal("Quête « " + esc(o.titre) + " » : de nouvelles îles apparaissent sur la carte.");
    toast("Carte mise à jour !"); rendreTout(); sauver(); return;
  }
  const c = Object.assign({}, o, { echeance: S.temps + o.delaiJours });
  S.contrats.push(c);
  for (let k = 0; k < o.quantite; k++) S.quai.push(creerItem(o.item, { contrat: c.id }));
  if (o.aleatoire) S.offres[S.ile] = S.offres[S.ile].filter((x) => x.id !== o.id);
  journal("Contrat accepté : « " + esc(o.titre) + " ». La marchandise attend sur le quai.");
  toast("Marchandise posée sur le quai : rangez-la dans la cale."); rendreTout(); sauver();
}
async function livrerContrats() {
  for (const c of [...S.contrats]) {
    if (c.destination !== S.ile) continue;
    const items = S.cale.filter((it) => it.contrat === c.id);
    if (!items.length) continue;
    const etat = items.reduce((s, it) => s + it.etat, 0) / c.quantite; // les items manquants comptent pour 0
    const retard = Math.max(0, Math.ceil(S.temps - c.echeance));
    let gain = c.recompense * Math.max(0, 1 - retard * C.contrats.retardPenaliteParJour);
    let rep = c.reputation; const lignes = [];
    if (items.length < c.quantite) lignes.push("Marchandise manquante : " + (c.quantite - items.length) + " / " + c.quantite + ".");
    const parfaite = items.length === c.quantite && etat >= C.livraisonParfaite.seuil;
    if (etat < c.etatMin) { gain *= 0.5 * etat / c.etatMin; rep = -Math.abs(C.contrats.reputationEchec) / 2; lignes.push("État moyen " + arr(etat) + " % (minimum " + c.etatMin + " %) : le client est mécontent."); }
    else lignes.push("État moyen : " + arr(etat) + " %.");
    if (parfaite) { gain *= 1 + C.livraisonParfaite.bonus; lignes.push("✨ Livraison parfaite : +" + pct(C.livraisonParfaite.bonus)); }
    if (retard) lignes.push("Retard : " + retard + " jour(s).");
    stat("livraisons"); if (!retard && etat >= c.etatMin) stat("livraisonsATemps"); if (parfaite) stat("livraisonsParfaites");
    gain = arr(gain); S.or += gain; changerRep(S.ile, rep);
    if (S.bilan) { S.bilan.livraisons++; S.bilan.gainLivraisons += gain; if (parfaite) S.bilan.parfaites++; }
    items.forEach(retirer); S.contrats = S.contrats.filter((x) => x.id !== c.id);
    if (!c.aleatoire) S.quetesFaites.push(c.id);
    journal("Contrat « " + esc(c.titre) + " » livré : +" + gain + " or.");
    await modale({ titre: c.rare ? "Commande exceptionnelle livrée" : "Livraison", icone: parfaite ? "✨" : "📜", theme: rep >= 0 ? (c.rare || parfaite ? "tresor" : "succes") : "echec", html: "<p><b>" + esc(c.titre) + "</b></p><div class='gros-gain'>+" + gain + " 💰</div>", chips: lignes.concat(["Réputation " + (rep >= 0 ? "+" : "−") + Math.abs(arr(rep))]), boutons: [{ t: "Encaisser", primaire: true }] });
  }
}
function verifierEcheances() {
  for (const c of [...S.contrats]) {
    if (S.temps > c.echeance + C.contrats.abandonApresRetard) {
      S.contrats = S.contrats.filter((x) => x.id !== c.id);
      tousItems().forEach((it) => { if (it.contrat === c.id) it.contrat = null; });
      changerRep(c.destination, C.contrats.reputationEchec);
      journal("<b>Contrat échoué</b> : « " + esc(c.titre) + " ». La marchandise vous reste, mais votre réputation en souffre.");
    }
  }
}

/* ---------------- Carte et brouillard ---------------- */
function devoilerAutour(x, y, r) { S.brouillard.push([arr(x * 10) / 10, arr(y * 10) / 10, r || C.carte.rayonBrouillard]); if (S.brouillard.length > 400) S.brouillard.splice(0, S.brouillard.length - 400); }
function connaitre(id) { if (!S.connues.includes(id)) { S.connues.push(id); const i = DB.iles[id]; devoilerAutour(i.x, i.y); journal("Nouvelle île découverte : <b>" + esc(i.nom) + "</b>."); toast("Île découverte : " + i.nom); } }
function decouvrirAutour(p) {
  const r = C.carte.rayonDecouverte + C.carte.rayonParNavigation * competence("navigation");
  C.iles.forEach((i) => { if (S.connues.includes(i.id)) return; const d = dist(p, i); if (d <= (i.cachee ? C.carte.rayonIleCachee : r)) connaitre(i.id); });
}

/* ---------------- Voyage et temps ---------------- */
function dangerPoint(p) { return p.ile ? DB.iles[p.ile].danger : C.carte.dangerEauxInconnues; }
function partir(dest) {
  const cible = dest.ile ? DB.iles[dest.ile] : dest;
  S.voyage = { de: { x: S.pos.x, y: S.pos.y, ile: S.ile }, vers: { x: cible.x, y: cible.y, ile: dest.ile || null }, fait: 0, attente: 0, dist: dist(S.pos, cible), dernierDevoile: 0 };
  if (S.ile) { S.joursEnMer = 0; nouveauBilan(); } // depuis le large, les jours de mer et le bilan continuent jusqu'au prochain port
  S.quai = []; S.ile = null; selection = null; destination = null; vuePort = "accueil";
  journal("Départ vers <b>" + esc(dest.ile ? DB.iles[dest.ile].nom : "des eaux inconnues") + "</b>.");
  vitesseIdx = 0; enPause = false; sauver(); rendreTout(); afficherPanneau("p-carte");
}
async function demanderDepart() {
  if (!destination) return;
  const avert = [];
  const quai = S.quai.length; const quaiContrat = S.quai.filter((it) => it.contrat).length;
  if (quai) avert.push(quai + " item(s) restent sur le quai et seront <b>perdus</b>" + (quaiContrat ? " (dont " + quaiContrat + " de contrat !)" : "") + ".");
  const cible = destination.ile ? DB.iles[destination.ile] : destination;
  const j = joursTrajet(S.pos, cible);
  if (joursDeVivres() < j + 1) avert.push("Vivres pour " + joursDeVivres().toFixed(1) + " jours seulement, pour un trajet d'environ " + j.toFixed(1) + " jours.");
  if (ratioCharge() > 1) avert.push("Le navire est en <b>surcharge</b> : lent et vulnérable aux tempêtes.");
  if (S.navire.coque < coqueMax() * 0.4) avert.push("La coque est très abîmée (" + arr(S.navire.coque) + " / " + coqueMax() + ").");
  if (avert.length) {
    const r = await modale({ titre: "Avant de lever l'ancre", icone: "⚓", theme: "mer", html: "<ul><li>" + avert.join("</li><li>") + "</li></ul>", boutons: [{ t: "Partir quand même", primaire: true }, { t: "Rester au port" }] });
    if (r !== 0) return;
  }
  partir(destination);
}
async function interrompreNavigation() {
  const v = S.voyage; if (!v || modaleOuverte) return;
  const etaitEnPause = enPause; enPause = true; rendreHaut();
  const ici = posVoyage(); const origine = v.de.ile ? DB.iles[v.de.ile] : null;
  const nomDest = v.vers.ile ? DB.iles[v.vers.ile].nom : "des eaux inconnues";
  const reste = Math.max(0, (v.dist - v.fait) / Math.max(0.1, vitesseNavire()) + v.attente);
  const options = [{ t: "⚓ Jeter l'ancre ici", sous: "Le navire s'arrête en pleine mer ; choisissez ensuite un nouveau cap sur la carte", k: "ancre" }];
  if (origine) options.push({ t: "↩ Faire demi-tour vers " + origine.nom, sous: "≈ " + joursTrajet(ici, origine).toFixed(1) + " jour(s) de mer", k: "retour" });
  options.push({ t: "⛵ Continuer vers " + nomDest, sous: "Encore ≈ " + reste.toFixed(1) + " jour(s)", k: "continuer", primaire: true });
  const r = await modale({ titre: "Interrompre la navigation ?", icone: "🧭", theme: "mer", html: "<p>Cap actuel : <b>" + esc(nomDest) + "</b>.</p><p class='muted'>En pleine mer, le temps ne passe pas tant que le navire est à l'ancre. Les salaires seront payés au prochain port.</p>", boutons: options });
  const k = options[r].k;
  if (k === "continuer") { enPause = etaitEnPause; rendreHaut(); majVoyage(); return; }
  jeterAncre();
  if (k === "retour") partir({ ile: origine.id });
}
function jeterAncre() {
  const p = posVoyage(); const v = S.voyage;
  S.voyage = null; S.ile = null; S.pos = { x: p.x, y: p.y }; enPause = true; destination = null;
  devoilerAutour(p.x, p.y); decouvrirAutour(p);
  journal("Navigation interrompue en route vers <b>" + esc(v.vers.ile ? DB.iles[v.vers.ile].nom : "des eaux inconnues") + "</b> : le navire jette l'ancre en pleine mer.");
  toast("⚓ À l'ancre en pleine mer. Choisissez un nouveau cap sur la carte.");
  sauver(); rendreTout(); afficherPanneau("p-carte");
}
function posVoyage() { const v = S.voyage; const t = v.dist ? clamp(v.fait / v.dist, 0, 1) : 1; return { x: v.de.x + (v.vers.x - v.de.x) * t, y: v.de.y + (v.vers.y - v.de.y) * t }; }

let dernierT = null, accRendu = 0;
function boucle(t) {
  requestAnimationFrame(boucle);
  if (dernierT === null) { dernierT = t; return; }
  const dt = Math.min(0.25, (t - dernierT) / 1000); dernierT = t;
  if (!S || !S.voyage || enPause || modaleOuverte) return;
  avancer(dt * C.temps.vitesses[vitesseIdx] / C.temps.secondesParJour);
  boucleAffichage(dt);
}
function avancer(dJours) {
  const v = S.voyage; const avant = Math.floor(S.temps);
  S.temps += dJours;
  if (v.attente > 0) v.attente = Math.max(0, v.attente - dJours); else v.fait += vitesseNavire() * dJours;
  S.pos = posVoyage();
  if (S.temps - v.dernierDevoile > 0.25) { v.dernierDevoile = S.temps; devoilerAutour(S.pos.x, S.pos.y); decouvrirAutour(S.pos); }
  for (let k = avant; k < Math.floor(S.temps); k++) { finDeJournee(true); if (!S.voyage) return; }
  if (v.fait >= v.dist && !modaleOuverte) arriver();
}

/* ---------------- Une journée ---------------- */
function finDeJournee(enMer) {
  const eq = C.equipage; S.joursEnMer += enMer ? 1 : 0;
  // Nourriture
  if (enMer) {
    let besoin = S.equipage.length * eq.rationsParMarinParJour; let frais = false;
    const vivres = S.cale.filter((it) => it.r > 0).sort((a, b) => (DB.items[b.id].frais ? 1 : 0) - (DB.items[a.id].frais ? 1 : 0));
    for (const it of vivres) { if (besoin <= 0) break; const pris = Math.min(it.r, besoin); it.r -= pris; besoin -= pris; if (DB.items[it.id].frais) frais = true; if (it.r <= 0) retirer(it); }
    if (frais) S.joursSansFrais = 0; else S.joursSansFrais++;
    const cuisine = competence("cuisine"); const medecine = competence("medecine"); const rhum = S.cale.some((it) => it.id === "rhum");
    S.equipage.forEach((m) => {
      if (besoin > 0) { m.sante += eq.faimSante; m.moral += eq.faimMoral; }
      else m.moral += eq.moralCuisine * cuisine / Math.max(1, S.equipage.length);
      if (S.joursSansFrais > eq.scorbutApresJours) m.sante += eq.scorbutSante * (m.traits.includes("robuste") ? DB.traits.robuste.maladie : 1);
      m.moral += eq.moralParJourEnMer;
      m.sante += eq.soinParJour * medecine / Math.max(1, S.equipage.length);
      const st = statutMarin(m);
      if (st === "patient") { const avant = m.sante; m.sante += C.salles.soinPatientParJour * (1 + competenceSalle("medecine", m.salle)); if (avant < 95 && m.sante >= 95) { journal(esc(m.nom) + " est rétabli et peut reprendre son poste."); toast("🩹 " + m.nom + " est rétabli : remettez ce marin à son poste."); } }
      if (st === "repos") { m.sante += C.salles.reposSanteParJour; m.moral += C.salles.reposMoralParJour; }
      m.traits.forEach((t) => { const tr = DB.traits[t]; if (tr.moralJourSansRhum && !rhum) m.moral += tr.moralJourSansRhum; });
    });
    if (besoin > 0) journal("<b>Faim à bord !</b> Il n'y a plus de vivres.");
    S.cohesion = clamp(S.cohesion + eq.cohesionParJourEnMer, 0, 100);
  }
  // Cargaison : pourriture et humidité
  const climat = enMer ? (S.voyage.vers.ile ? DB.iles[S.voyage.vers.ile].climat : "tropical") : (ileAct() ? ileAct().climat : "tempere");
  for (const it of [...S.cale]) {
    const d = DB.items[it.id];
    if (d.perissable > 0) {
      let perte = 100 / d.perissable; if (climat === "tropical") perte *= C.cale.climatTropical; if (ventile(it)) perte *= facteurVentilation(it);
      it.etat -= perte;
      if (it.etat <= 0) { journal(esc(d.nom) + " a pourri et a été jeté."); retirer(it); continue; }
    }
    if (enMer && d.craintEau && auFond(it)) it.etat -= C.cale.humiditeFondParJour / (aAmelio("baches") ? DB.amelios.baches.diviseurEau : 1);
    it.etat = clamp(it.etat, 0, 100);
  }
  // Monde
  C.factions.forEach((f) => { S.mefiance[f.id] = Math.max(0, S.mefiance[f.id] - C.contrebande.mefianceBaisseParJour); });
  majMarche(); if (enMer) stat("joursMer");
  C.iles.forEach((i) => { const m = S.prixMod[i.id]; Object.keys(m).forEach((k) => { m[k] += (1 - m[k]) * C.commerce.retourParJour; }); });
  verifierEcheances();
  verifierEquipage();
  if (enMer) tirerEvenement();
  rafraichir(enMer);
}
function verifierEquipage() {
  for (const m of [...S.equipage]) {
    m.moral = clamp(m.moral, 0, 100);
    if (m.sante <= 0) {
      if (S.equipage.length === 1) { m.sante = 1; continue; }
      S.equipage = S.equipage.filter((x) => x !== m);
      journal("<b>" + esc(m.nom) + " est mort.</b>");
      S.equipage.forEach((o) => { o.moral -= 10 * (o.traits.includes("superstitieux") ? DB.traits.superstitieux.moralDrame : 1); });
      S.cohesion = clamp(S.cohesion - 10, 0, 100);
      toast(m.nom + " est mort.");
    }
    m.sante = clamp(m.sante, 0, 100);
  }
}

/* ---------------- Événements ---------------- */
function contrebandeFaction(fid) { const ids = new Set(C.iles.filter((i) => i.faction === fid).flatMap((i) => i.interdits)); return S.cale.filter((it) => ids.has(it.id)); }
function cibleDisponible(e) { return !e.cible || (e.cible === "cale" ? cales().length > 0 : sallesNavire().some((s) => s.type === e.cible)); }
function tirerEvenement() {
  const v = S.voyage; const danger = (dangerPoint(v.de) + dangerPoint(v.vers)) / 2;
  const possibles = C.evenements.filter((e) => e.chanceParJour > 0 && (!e.nuitSeulement || estNuit()) && (e.condition !== "contrebande" || contrebandeFaction(e.faction).length) && cibleDisponible(e) && !(e.faction && effetFaction(e.faction, "lettreDeMarque")) && (e.condition !== "pageAlienor" || prochainePage()));
  const poids = (e) => {
    let w = e.chanceParJour;
    if (e.id === "patrouille" && e.faction) { const p = valeurFaction(e.faction, "patrouilles", 1); w *= (p === true ? 1 : p) * (niveauMefiance(e.faction).patrouilles || 1); }
    if (e.id === "hostile") w *= valeurQuelconque("pirates", 1);
    if (e.fantome) w *= valeurQuelconque("feuxMorts", 1) * (aAmelio("lanterne") ? DB.amelios.lanterne.fantomes : 1);
    return w;
  };
  const total = possibles.reduce((s, e) => s + poids(e), 0); const base = possibles.reduce((s, e) => s + e.chanceParJour, 0);
  const chance = Math.min(C.carte.chanceEvenementMax, total * (C.carte.chanceEvenementBase + danger * C.carte.chanceEvenementParDanger) * (base ? 1 : 0));
  if (Math.random() > chance) return;
  let r = Math.random() * total;
  for (const e of possibles) {
    r -= poids(e); if (r > 0) continue;
    const ami = valeurQuelconque("pavillonAmi", 0);
    if (e.id === "hostile" && ami && Math.random() < ami) {
      journal("🏴‍☠️ Un navire pirate reconnaît votre pavillon et vous laisse passer.");
      modale({ titre: "Pavillon ami", icone: "🏴‍☠️", theme: "tresor", html: "<p>Un navire des Naufrageurs s'approche… puis vous salue d'un coup de canon à blanc. Vos amitiés vous protègent.</p>", boutons: [{ t: "Saluer en retour", primaire: true }] });
      return;
    }
    lancerEvenement(e); return;
  }
}
function chanceTest(t) { return t ? clamp(t.base + t.parPoint * competence(t.competence), 0.05, 0.95) : 1; }
function chanceMarin(t, m) { return t ? clamp(t.base + t.parPoint * apportBrut(m, t.competence) * formeMarin(m), 0.05, 0.95) : 1; }
function salleEnvoi(envoi, ctx) {
  if (envoi.salle === "cible") return ctx.cible;
  const s = sallesNavire().find((x) => x.type === envoi.salle || x.id === envoi.salle); return s ? s.id : null;
}
async function choisirMarin(c, ctx, e) {
  const dest = salleEnvoi(c.envoi, ctx); const nomDest = dest ? nomSalle(salleDef(dest)) : "";
  const liste = [...S.equipage].sort((a, b) => chanceMarin(c.test, b) - chanceMarin(c.test, a));
  const r = await modale({ titre: "Qui envoyer ?", icone: e.icone || "❗", theme: e.theme || "mer",
    html: "<p>" + esc(c.texte) + (nomDest ? " — <b>" + esc(nomDest) + "</b>" : "") + "</p><p class='muted'>La réussite dépend de la compétence « " + esc(nomCompetence(c.envoi.competence)) + " » du marin choisi.</p>",
    boutons: liste.map((m) => {
      const ap = apportBrut(m, c.envoi.competence); const ici = salleDef(m.salle);
      return { t: m.nom, chance: c.test ? chanceMarin(c.test, m) : null, sous: (ap > 0 ? nomCompetence(c.envoi.competence) + " " + fmt2(ap) : "Pas de compétence utile") + (c.test ? " · réussite " + pct(chanceMarin(c.test, m)) : "") + " · " + (ici ? nomSalle(ici) : "—") + (m.sante < 50 ? " · ❤️ " + arr(m.sante) : "") };
    }).concat([{ t: "↩ Choisir une autre option" }]) });
  return r < liste.length ? liste[r] : null;
}
async function lancerEvenement(e) {
  const ctx = { cible: null, blesses: [] };
  if (e.cible === "cale") ctx.cible = choisir(cales()).id;
  else if (e.cible) { const s = sallesNavire().find((x) => x.type === e.cible); ctx.cible = s ? s.id : null; }
  const txt = (t) => String(t || "").split("{salle}").join(ctx.cible ? nomSalle(salleDef(ctx.cible)) : "la cale");
  const options = e.choix.filter((c) => (!c.requiert || sallesNavire().some((s) => s.type === c.requiert)) && (!c.requiertAmelio || S.navire.amelios.includes(c.requiertAmelio)));
  let c = null, marin = null;
  while (!c) {
    const idx = await modale({ titre: e.titre, icone: e.icone || "❗", theme: e.theme || "mer", html: "<p>" + esc(txt(e.texte)) + "</p>",
      boutons: options.map((o) => o.envoi
        ? { t: "👤 " + txt(o.texte), sous: "Choisir un marin · " + nomCompetence(o.envoi.competence) + " · meilleure chance " + pct(Math.max(...S.equipage.map((m) => chanceMarin(o.test, m)))) }
        : { t: txt(o.texte), chance: o.test ? chanceTest(o.test) : null, sous: o.test ? "Réussite " + pct(chanceTest(o.test)) + " · " + nomCompetence(o.test.competence) + ouCompetence(o.test.competence) : "Sans risque d'échec" }) });
    const o = options[idx];
    if (o.envoi) { marin = await choisirMarin(o, ctx, e); if (!marin) continue; }
    c = o;
  }
  const lignes = [];
  if (marin) { // le marin rejoint la salle (s'il y a de la place) ou y va le temps de la manœuvre
    const dest = salleEnvoi(c.envoi, ctx); const sd = salleDef(dest);
    if (sd && sd.places > 0 && marin.salle !== dest) { deplacerMarin(marin, dest); lignes.push(marin.nom + " rejoint : " + nomSalle(sd)); }
    else if (sd && marin.salle !== dest) lignes.push(marin.nom + " y va le temps de la manœuvre");
  }
  const chance = c.test ? (marin ? chanceMarin(c.test, marin) : chanceTest(c.test)) : 1;
  const ok = Math.random() < chance;
  if (S.bilan && S.voyage) { S.bilan.evts++; if (ok && c.test) S.bilan.reussites++; }
  const eff = ok ? c.succes : (c.echec || c.succes);
  lignes.push(...await appliquerEffets(eff, ctx, marin));
  journal("<b>" + esc(e.titre) + "</b> — " + esc(txt(c.texte)) + (marin ? " (" + esc(marin.nom) + ")" : "") + " : " + (ok ? "réussite" : "échec") + ".");
  if (eff.texte || lignes.length) await modale({ titre: c.test ? (ok ? "Réussite !" : "Échec…") : e.titre, icone: c.test ? (ok ? "✅" : "❌") : (e.icone || "⚓"), theme: c.test ? (ok ? "succes" : "echec") : (e.theme || "mer"), html: (marin ? portraitSvg(marin.portrait, 44) : "") + (eff.texte ? "<p>" + esc(txt(eff.texte)) + "</p>" : ""), chips: lignes, boutons: [{ t: "Continuer", primaire: true }] });
  if (e.legende) debloquerLegende(e.legende);
  verifierEquipage();
  if (S.navire.coque <= 0) { await naufrage(); return; }
  await proposerInfirmerie(ctx.blesses);
  sauver(); rendreTout();
}
async function proposerInfirmerie(blesses) {
  const inf = sallesNavire().find((s) => typeSalle(s).action === "soin"); if (!inf) return;
  for (const m of [...new Set(blesses)]) {
    if (!S.equipage.includes(m) || m.salle === inf.id || apportBrut(m, "medecine") > 0 || m.sante >= C.salles.infirmerieSousSante) continue;
    const plein = placesLibres(inf.id) <= 0; const gain = arr(C.salles.soinPatientParJour * (1 + competenceSalle("medecine", inf.id)));
    const r = await modale({ titre: m.nom + " a besoin de soins", icone: "🩹", theme: "danger",
      html: portraitSvg(m.portrait, 52) + "<p>Santé : <b>" + arr(m.sante) + "</b>. À l'" + esc(nomSalle(inf).toLowerCase()) + " : environ <b>+" + gain + " santé par jour</b>, mais plus de travail à son poste (" + esc(nomSalle(salleDef(m.salle))) + ").</p>",
      boutons: [{ t: "Conduire à l'" + nomSalle(inf).toLowerCase(), primaire: true, sous: plein ? "Infirmerie pleine : échange avec un occupant" : "" }, { t: "Rester à son poste" }] });
    if (r === 0) { deplacerMarin(m, inf.id); journal(esc(m.nom) + " rejoint l'infirmerie."); }
  }
}
function ouCompetence(c) { // salles où la compétence compte à 100 %
  if (C.salles.competencesGlobales.includes(c)) return "";
  const s = sallesNavire().filter((x) => ((typeSalle(x).competences || {})[c] || 0) >= 1).map(nomSalle);
  return s.length ? " (" + [...new Set(s)].join(", ") + ")" : " (aucune salle adaptée)";
}
function nomCompetence(c) { const r = C.roles.liste.find((x) => x.competence === c); return r ? r.nom : c; }
async function appliquerEffets(e, ctx, marin) {
  const L = []; ctx = ctx || { cible: null, blesses: [] };
  if ((e.coque && e.coque < 0) || e.choc || e.eau || e.eauCible || e.chocCible) secousse();
  const surcharge = ratioCharge() > 1 ? C.cale.surchargeDegats : 1;
  if (e.coque) { const v = e.coque < 0 ? e.coque * surcharge : e.coque; S.navire.coque = clamp(S.navire.coque + v, 0, coqueMax()); L.push("Coque " + (v > 0 ? "+" : "") + arr(v)); }
  if (e.choc) L.push(...degatsChoc(e.choc * surcharge));
  if (e.eau) L.push(...degatsEau(e.eau * surcharge));
  if (e.chocCible) L.push(...degatsChoc(e.chocCible * surcharge, ctx.cible));
  if (e.eauCible) L.push(...degatsEau(e.eauCible * surcharge, ctx.cible));
  if (e.moral) { S.equipage.forEach((m) => { m.moral += e.moral * (e.moral < 0 && m.traits.includes("superstitieux") ? DB.traits.superstitieux.moralDrame : 1); }); L.push("Moral " + (e.moral > 0 ? "+" : "") + e.moral); }
  if (e.sante) { S.equipage.forEach((m) => { m.sante += e.sante; }); L.push("Santé de l'équipage " + (e.sante > 0 ? "+" : "") + e.sante); }
  if (e.cohesion) { S.cohesion = clamp(S.cohesion + e.cohesion, 0, 100); L.push("Cohésion " + (e.cohesion > 0 ? "+" : "") + e.cohesion); }
  if (e.or) { S.or = Math.max(0, S.or + e.or); L.push("Or " + (e.or > 0 ? "+" : "") + e.or); }
  if (e.orPourcent) { const p = arr(S.or * e.orPourcent / 100); S.or -= p; L.push("Or −" + p); }
  if (e.jours && S.voyage) { S.voyage.attente += e.jours; L.push("Trajet +" + e.jours + " jour(s)"); }
  if (e.jeter) {
    const cand = S.cale.filter((it) => it.id !== "coffre"); const n = Math.min(cand.length, Math.max(1, Math.round(cand.length * e.jeter)));
    const perdus = []; for (let k = 0; k < n; k++) { const it = cand.splice(Math.floor(Math.random() * cand.length), 1)[0]; perdus.push(DB.items[it.id].nom); retirer(it); }
    if (perdus.length) L.push("Cargaison perdue : " + perdus.join(", "));
  }
  if (e.gagner) {
    const [id, n] = e.gagner;
    if (id === "coffre") stat("tresors", n);
    for (let k = 0; k < n; k++) { const it = creerItem(id); if (placerAuto(it)) L.push(DB.items[id].nom + " rangé dans la cale"); else if (S.ile) { S.quai.push(it); L.push(DB.items[id].nom + " posé à terre : faites-lui de la place dans la cale"); } else L.push("Pas de place pour " + DB.items[id].nom + " : perdu"); }
  }
  if (e.blesse && S.equipage.length) { const m = choisir(S.equipage); m.sante -= e.blesse; ctx.blesses.push(m); L.push(m.nom + " : blessure, santé −" + e.blesse); }
  if (e.blesseEnvoye && marin) { marin.sante -= e.blesseEnvoye; ctx.blesses.push(marin); L.push(marin.nom + " : blessure, santé −" + e.blesseEnvoye); }
  if (e.legende) { const l = debloquerLegende(e.legende, true); if (l) L.push("📖 Légende : " + l.titre); }
  if (e.inspection) await inspection(e.inspection, null, true);
  return L;
}
function reductionArrimage(caleId) { return 1 - Math.min(0.8, C.cale.reductionArrimage * competenceSalle("arrimage", caleId)); }
function degatsChoc(I, caleId) {
  const stab = stabilite(); let n = 0, total = 0;
  S.cale.filter((it) => !caleId || it.cale === caleId).forEach((it) => {
    if (!DB.items[it.id].fragile) return;
    const p = poidsAuDessus(it);
    const d = I * alea(0.6, 1.2) * (1 + Math.max(0, p - C.cale.poidsFragile) / C.cale.poidsFragile) * (1.5 - stab) * reductionArrimage(it.cale);
    it.etat = clamp(it.etat - d, 0, 100); n++; total += d;
  });
  return n ? ["Items fragiles secoués : " + n + " (−" + arr(total / n) + " % d'état en moyenne)"] : [];
}
function degatsEau(I, caleId) {
  // Sans caleId : l'humidité générale touche surtout les fonds humides.
  // Avec caleId (voie d'eau) : l'eau entre dans CETTE cale et monte depuis le bas, même dans une cale sèche.
  let n = 0, total = 0; const div = aAmelio("baches") ? DB.amelios.baches.diviseurEau : 1;
  S.cale.filter((it) => !caleId || it.cale === caleId).forEach((it) => {
    if (!DB.items[it.id].craintEau) return;
    const k = caleDe(it); const bas = it.y + dims(it).h - 1 >= k.rangees - 1;
    const f = caleId ? (bas ? alea(0.8, 1.3) : alea(0.15, 0.35)) : (auFond(it) ? alea(0.8, 1.3) : alea(0.1, 0.3)) * (k.fondHumide ? 1 : 0.2);
    const d = I * f / div * reductionArrimage(it.cale);
    it.etat = clamp(it.etat - d, 0, 100); n++; total += d;
  });
  const ou = caleId ? " dans " + nomSalle(salleDef(caleId)) : "";
  return n ? ["Items mouillés" + ou + " : " + n + " (−" + arr(total / n) + " % d'état en moyenne)"] : (caleId ? ["Rien qui craigne l'eau" + ou] : []);
}

/* ---------------- Inspection ---------------- */
async function inspection(fid, ileId, certaine) {
  const ids = ileId ? new Set(DB.iles[ileId].interdits) : new Set(C.iles.filter((i) => i.faction === fid).flatMap((i) => i.interdits));
  const suspects = S.cale.filter((it) => ids.has(it.id));
  if (!suspects.length) { if (certaine) await modale({ titre: "Inspection", icone: "🔍", theme: "autorite", html: "<p>Les inspecteurs fouillent la cale et ne trouvent rien.</p>", boutons: [{ t: "Continuer", primaire: true }] }); return; }
  if (!certaine) {
    const i = DB.iles[ileId];
    const nm = niveauMefiance(fid); const ip = effetPalier(ileId, "inspection", 1);
    let ch = 1;
    if (nm.inspection !== "systematique" && ip !== "systematique") {
      ch = i.surveillance * nm.inspection * ip * (1 - Math.min(0.6, C.contrebande.bonusCommerce * competence("commerce")));
      if (estNuit()) ch *= C.contrebande.nuitInspection;
      ch *= valeurQuelconque("delation", 1);
    }
    if (Math.random() > ch) { stat("inspectionsEchappees"); return; }
  }
  const f = DB.factions[fid];
  const r = await modale({ titre: "Inspection !", icone: "🔍", theme: "autorite", html: "<p>Des agents de <b>" + esc(f.nom) + "</b> montent à bord pour fouiller la cale.</p><p class='muted'>Contrebande à bord : " + suspects.map((it) => esc(DB.items[it.id].nom) + (dansCachette(it) ? " (cachette)" : "")).join(", ") + "</p>",
    boutons: [{ t: "Laisser fouiller", primaire: true }, { t: "Glisser un pot-de-vin (" + C.contrebande.potDeVin + " or)", sous: "Chance : " + pct(clamp(f.corruptible + 0.1 * competence("commerce"), 0, 0.95)), off: S.or < C.contrebande.potDeVin }] });
  if (r === 1) {
    S.or -= C.contrebande.potDeVin;
    if (Math.random() < clamp(f.corruptible + 0.1 * competence("commerce"), 0, 0.95)) { stat("inspectionsEchappees"); journal("Pot-de-vin accepté par " + esc(f.nom) + "."); await modale({ titre: "Marché conclu", icone: "🤝", theme: "succes", html: "<p>L'inspecteur empoche l'or et regarde ailleurs.</p>", boutons: [{ t: "Continuer", primaire: true }] }); return; }
    S.mefiance[fid] += 10;
  }
  const bonusTrait = S.equipage.reduce((s, m) => s + m.traits.reduce((a, t) => a + (DB.traits[t].cachette || 0), 0), 0);
  const fouille = niveauMefiance(fid).cachette || 1;
  const ombre = valeurQuelconque("marquesOmbre", 1); // < 1 : les inspecteurs trouvent moins
  const trouves = suspects.filter((it) => Math.random() < (1 - clamp(discretionItem(it) * fouille + bonusTrait, 0, 0.98)) * ombre);
  if (!trouves.length) { stat("inspectionsEchappees"); await modale({ titre: "Ouf !", icone: "😮‍💨", theme: "succes", html: "<p>Les inspecteurs repartent bredouilles.</p>", boutons: [{ t: "Continuer", primaire: true }] }); return; }
  const valeur = trouves.reduce((s, it) => s + DB.items[it.id].prix, 0);
  const amende = Math.min(S.or, arr(valeur * C.contrebande.amendeParValeur * f.severite));
  S.or -= amende; trouves.forEach(retirer); S.mefiance[fid] += C.contrebande.mefianceGain;
  if (ileId) changerRep(ileId, C.contrebande.reputationIle); S.reputation.factions[fid] += C.contrebande.reputationFaction;
  journal("<b>Contrebande saisie</b> par " + esc(f.nom) + " : amende de " + amende + " or.");
  await modale({ titre: "Contrebande saisie", icone: "⛓️", theme: "echec", html: "<ul><li>Confisqué : " + trouves.map((it) => esc(DB.items[it.id].nom)).join(", ") + "</li><li>Amende : " + amende + " or</li><li>Réputation en baisse, méfiance en hausse</li></ul>", boutons: [{ t: "Continuer", primaire: true }] });
}

/* ---------------- Arrivée au port ---------------- */
async function arriver() {
  const v = S.voyage; enPause = true; S.pos = { x: v.vers.x, y: v.vers.y }; S.voyage = null;
  if (!v.vers.ile) {
    S.ile = null; devoilerAutour(S.pos.x, S.pos.y, C.carte.rayonBrouillard + 4); decouvrirAutour(S.pos); stat("mouillages");
    journal("Vous jetez l'ancre au large, en eaux inconnues.");
    rendreTout(); sauver();
    await modale({ titre: "Au large", icone: "🧭", theme: "mer", html: "<p>Vous voici en eaux inconnues. Observez la carte et choisissez un nouveau cap.</p>", boutons: [{ t: "Voir la carte", primaire: true }] });
    afficherPanneau("p-carte"); return;
  }
  const i = DB.iles[v.vers.ile]; S.ile = i.id; vuePort = "accueil"; connaitre(i.id); devoilerAutour(i.x, i.y, C.carte.rayonBrouillard + 4); decouvrirAutour(S.pos);
  journal("Arrivée à <b>" + esc(i.nom) + "</b> après " + S.joursEnMer + " jour(s) de mer.");
  // Salaires
  const du = S.equipage.reduce((s, m) => s + m.salaire, 0) * S.joursEnMer;
  if (du > 0) { if (S.or >= du) { S.or -= du; journal("Salaires payés : " + du + " or."); } else { S.equipage.forEach((m) => { m.moral += C.equipage.salaireImpayeMoral; }); journal("<b>Salaires impayés !</b> L'équipage gronde."); S.or = 0; } }
  const taxe = effetPalier(i.id, "taxeEntree", 0);
  if (taxe) { const t = Math.min(S.or, taxe); S.or -= t; if (S.bilan) S.bilan.taxes += t; journal("🏛️ Port hostile : taxe d'entrée de " + t + " or."); }
  S.rumeurs.forEach((r) => { if (r.ile === i.id && !r.statut && S.temps >= r.debut && S.temps <= r.fin) r.statut = r.vraie ? "confirmee" : "fausse"; });
  rendreTout(); afficherPanneau("p-port");
  if (i.surveillance > 0) await inspection(i.faction, i.id, false);
  await livrerContrats();
  if (i.evenementArrivee && !S.evtArriveeFaits.includes(i.id)) { S.evtArriveeFaits.push(i.id); await lancerEvenement(DB.evts[i.evenementArrivee]); }
  // Désertion
  for (const m of [...S.equipage]) if (S.equipage.length > 1 && m.moral < C.equipage.desertionSousMoral && Math.random() < C.equipage.chanceDesertion) { S.equipage = S.equipage.filter((x) => x !== m); journal("<b>" + esc(m.nom) + " a déserté.</b>"); toast(m.nom + " a déserté !"); }
  await montrerBilan(i);
  C.legendes.filter((l) => l.ile === i.id).forEach((l) => debloquerLegende(l.id));
  genererOffres(i.id);
  verifierEquipage(); sauver(); rendreTout(); verifierJalons();
}

/* ---------------- Naufrage ---------------- */
async function naufrage() {
  const survivant = choisir(S.equipage); const nf = C.naufrage;
  const ancienRole = survivant.role;
  const proches = S.connues.filter((id) => DB.iles[id].marche).sort((a, b) => dist(S.pos, DB.iles[a]) - dist(S.pos, DB.iles[b]));
  const refuge = proches[0] || C.depart.ile;
  S.equipage = [survivant];
  if (ancienRole !== "capitaine") { survivant.secondaire = ancienRole; survivant.role = "capitaine"; }
  survivant.sante = Math.max(30, survivant.sante); survivant.moral = 40;
  S.navire = { type: nf.navire, coque: DB.navires[nf.navire].coqueMax, amelios: [], nom: DB.navires[nf.navire].nomParDefaut };
  placementConseille();
  S.cale = []; S.quai = []; S.or = arr(S.or * nf.orConserve);
  S.contrats = []; S.voyage = null; S.ile = refuge; S.pos = { x: DB.iles[refuge].x, y: DB.iles[refuge].y };
  Object.keys(S.reputation.iles).forEach((k) => { S.reputation.iles[k] *= nf.reputationConservee; });
  Object.keys(S.reputation.factions).forEach((k) => { S.reputation.factions[k] *= nf.reputationConservee; });
  S.generation++; S.cohesion = 50; stat("naufrages"); S.bilan = null;
  for (let k = 0; k < nf.rations[1]; k++) { const it = creerItem(nf.rations[0]); placerAuto(it); }
  genererOffres(refuge);
  journal("<b>Naufrage !</b> " + esc(survivant.nom) + " est le seul survivant et reprend la mer sur une barque.");
  enPause = true; sauver(); rendreTout(); afficherPanneau("p-port");
  await modale({ titre: "Naufrage", icone: "🌊", theme: "echec", html: "<p>Le navire sombre corps et biens. Seul <b>" + esc(survivant.nom) + "</b> s'en sort, accroché à une épave, et finit par atteindre <b>" + esc(DB.iles[refuge].nom) + "</b>.</p><ul><li>Navire, cargaison et or à bord : perdus</li><li>Carte découverte : conservée</li><li>Réputation : " + pct(nf.reputationConservee) + " conservée</li><li>Coffre à terre : " + S.coffre + " or</li></ul><p>" + esc(survivant.nom) + " devient capitaine d'une barque. L'aventure continue…</p>", boutons: [{ t: "Reprendre la mer", primaire: true }] });
}

/* ---------------- Services du port ---------------- */
function prixPointCoque() { return C.commerce.reparationParPoint * effetPalier(S.ile, "reparation", 1); }
function coutReparation() { return arr((coqueMax() - S.navire.coque) * prixPointCoque()); }
function reparer() { const c = coutReparation(); const pay = Math.min(S.or, c); const pts = pay / prixPointCoque(); S.or -= pay; S.navire.coque = Math.min(coqueMax(), S.navire.coque + pts); journal("Réparations : " + pay + " or."); rendreTout(); sauver(); }
function repos() {
  const eq = C.equipage; if (S.or < eq.reposPrix) return toast("Pas assez d'or.");
  S.or -= eq.reposPrix; S.temps += 1;
  S.equipage.forEach((m) => { m.sante += eq.reposSante; m.moral += eq.reposMoral; });
  finDeJournee(false); genererOffres(S.ile);
  journal("Une journée de repos à terre."); rendreTout(); sauver();
}
function recruesDispo() {
  const i = ileAct(); if (i && effetFaction(i.faction, "pasDeRecrues")) return [];
  return C.marins.filter((m) => m.prixRecrutement && !S.marinsPasses.includes(m.id)).slice(0, 2 + effetPalier(S.ile, "recrues", 0));
}
function prixRecrue(m) { const i = ileAct(); const f = i ? valeurFaction(i.faction, "recrutement", 1) : 1; return arr(m.prixRecrutement * (f === true ? 1 : f)); }
function recruter(id) {
  const m = DB.marins[id]; if (S.or < prixRecrue(m)) return toast("Pas assez d'or.");
  if (S.equipage.length >= navire().equipageMax) return toast("Plus de place à bord.");
  S.or -= prixRecrue(m); const recrue = creerMarin(id); S.equipage.push(recrue); placerMarin(recrue); S.marinsPasses.push(id); S.cohesion = clamp(S.cohesion + C.equipage.cohesionRecrue, 0, 100);
  journal(esc(m.nom) + " rejoint l'équipage."); rendreTout(); sauver();
}
function acheterAmelio(id) {
  const a = DB.amelios[id]; if (S.or < a.prix) return toast("Pas assez d'or.");
  if (S.navire.amelios.length >= navire().emplacements) return toast("Plus d'emplacement d'amélioration sur ce navire.");
  S.or -= a.prix; S.navire.amelios.push(id); if (a.bonusCoque) S.navire.coque += a.bonusCoque;
  journal("Amélioration installée : " + esc(a.nom) + "."); rendreTout(); sauver();
}
function navireAutorise(n) { return !n.requiert || (S.reputation.factions[n.requiert.faction] || 0) >= n.requiert.reputation; }
function reprise() { return arr(navire().prix * 0.5); }
async function acheterNavire(id) {
  const n = DB.navires[id]; const cout = n.prix - reprise(); if (S.or < cout) return toast("Pas assez d'or.");
  if (!navireAutorise(n)) return toast("Réputation insuffisante auprès de : " + DB.factions[n.requiert.faction].nom + ".");
  const r = await modale({ titre: "Changer de navire", icone: "⛵", html: "<p>Acheter une <b>" + esc(n.nom) + "</b> pour " + cout + " or (reprise de votre " + esc(navire().nom) + " déduite) ?</p><p class='muted'>Les améliorations sont perdues. La cargaison est déposée sur le quai : rangez-la dans les nouvelles cales. L'équipage est réparti dans les salles du nouveau navire.</p>", boutons: [{ t: "Acheter", primaire: true }, { t: "Annuler" }] });
  if (r !== 0) return;
  S.or -= cout; S.cale.forEach((it) => { it.x = -1; it.y = -1; it.cale = null; S.quai.push(it); }); S.cale = [];
  S.navire = { type: id, coque: n.coqueMax, amelios: [], nom: n.nomParDefaut }; stat("navire_" + id);
  placementConseille(); salleSel = calePrincipale();
  journal("Nouveau navire : <b>" + esc(n.nom) + "</b> !"); rendreTout(); sauver(); afficherPanneau("p-cale");
}
function coffre(sens, montant) {
  if (sens > 0) { const m = Math.min(S.or, montant); S.or -= m; S.coffre += m; } else { const m = Math.min(S.coffre, montant); S.coffre -= m; S.or += m; }
  rendreTout(); sauver();
}

/* =====================================================================
   INTERFACE
   ===================================================================== */
let vuePort = "accueil";        // lieu du port affiché
let ongletMarche = "acheter";
let precedent = null;           // valeurs précédentes de la barre du haut (pour les animations)
let carteRendue = { brouillard: 0, connues: 0 };
let dernierTap = { uid: null, t: 0 };
const estPC = () => window.matchMedia("(min-width: 980px)").matches;

function afficherPanneau(id) {
  if (estPC()) {
    if (id === "p-equipage") { document.body.classList.remove("voirQuetes"); document.body.classList.toggle("voirEquipage"); }
    if (id === "p-quetes") { document.body.classList.remove("voirEquipage"); document.body.classList.toggle("voirQuetes"); rendreQuetes(); rendreOnglets(); }
    return;
  }
  if (id === "p-quetes") { rendreQuetes(); }
  document.querySelectorAll(".panneau").forEach((p) => p.classList.toggle("actif", p.id === id));
  document.querySelectorAll("#onglets button").forEach((b) => b.classList.toggle("actif", b.dataset.p === id));
  if (id === "p-cale") rendreCale();
}
function rendreTout() { rendreHaut(); rendrePort(); rendreCale(); rendreCarte(); rendreEquipage(); rendreQuetes(); rendreOnglets(); planifierJalons(); }
function rafraichir(enMer) {
  if (enMer && S.voyage) { rendreHaut(); majVoyage(); rendreCale(); rendreEquipage(); majCarteVoyage(); }
  else rendreTout();
}
function jauge(v, max) { const r = clamp(v / (max || 100), 0, 1); return "<div class='jauge " + (r < 0.3 ? "bas" : r < 0.6 ? "moy" : "") + "'><i style='width:" + r * 100 + "%'></i></div>"; }
function hhmm() { const m = Math.floor(heure() * 24 * 60); return String(Math.floor(m / 60)).padStart(2, "0") + "h" + String(m % 60).padStart(2, "0"); }
function vibrer(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

/* ---------- Retours visuels ---------- */
function flotter(texte, el, positif) {
  const r = el ? el.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const d = document.createElement("div"); d.className = "flotte " + (positif ? "pos" : "neg"); d.textContent = texte;
  d.style.left = clamp(r.left + r.width / 2, 50, window.innerWidth - 50) + "px"; d.style.top = (r.top + r.height + 4) + "px";
  document.body.appendChild(d); setTimeout(() => d.remove(), 1400);
}
function secousse() { const p = $("#panneaux"); p.classList.remove("secoue"); void p.offsetWidth; p.classList.add("secoue"); vibrer([40, 30, 60]); setTimeout(() => p.classList.remove("secoue"), 500); }
function signeLigne(t) { return /−|-\d|perdu|blessé|abîmé|mouillé|secoué|manquante|mécontent|Retard|Pas de place/i.test(t) ? "neg" : /\+/.test(t) ? "pos" : ""; }

/* ---------- Barre du haut ---------- */
function rendreHaut() {
  const top = $("#top");
  if (!$("#st-or")) {
    top.innerHTML = "<span class='stat' id='st-or' title='Or à bord'><i>💰</i><b></b></span>" +
      "<span class='stat' id='st-jour' title='Jour et heure'><i></i><b></b> <small></small></span>" +
      "<span class='stat' id='st-vivres' title='Vivres (jours)'><i>🍞</i><b></b></span>" +
      "<span class='stat' id='st-coque' title='Coque'><i>🛠️</i><b></b></span>" +
      "<span class='stat' id='st-charge' title='Charge de la cale'><i>⚖️</i><b></b></span>" +
      "<span class='stat' id='st-moral' title='Moral moyen'><i>🙂</i><b></b></span>" +
      "<span id='hautDroite'><span id='hautTemps'></span><button class='btnHaut' id='btnQuetesPC' title='Quêtes'>📜</button><button class='btnHaut' id='btnEquipagePC' title='Équipage'>👥</button><button class='btnHaut' id='menuBtn' title='Menu'>☰</button></span>";
    $("#menuBtn").onclick = menu;
    $("#btnEquipagePC").onclick = () => afficherPanneau("p-equipage");
    $("#btnQuetesPC").onclick = () => afficherPanneau("p-quetes");
  }
  const jv = joursDeVivres(); const rc = ratioCharge(); const cq = S.navire.coque / coqueMax(); const mo = moralMoyen();
  const v = { or: arr(S.or), coque: arr(S.navire.coque), moral: arr(mo) };
  const pose = (id, texte, etat) => { const el = $("#" + id); el.querySelector("b").textContent = texte; el.classList.toggle("alerte", etat === 1); el.classList.toggle("danger", etat === 2); return el; };
  const elOr = pose("st-or", v.or, 0);
  const elJ = $("#st-jour"); elJ.querySelector("i").textContent = estNuit() ? "🌙" : "☀️"; elJ.querySelector("b").textContent = "J" + jour(); elJ.querySelector("small").textContent = hhmm();
  pose("st-vivres", jv >= 99 ? "—" : jv.toFixed(1) + "j", jv < 3 ? 2 : jv < 6 ? 1 : 0);
  const elC = pose("st-coque", v.coque + "/" + coqueMax(), cq < 0.3 ? 2 : cq < 0.6 ? 1 : 0);
  pose("st-charge", pct(rc), rc > 1 ? 2 : rc > C.cale.seuilRalentissement ? 1 : 0);
  const elM = pose("st-moral", v.moral, mo < 25 ? 2 : mo < 45 ? 1 : 0);
  $("#st-moral i").textContent = mo >= 60 ? "😀" : mo >= 40 ? "🙂" : mo >= 25 ? "😟" : "😠";
  if (precedent) {
    const anime = (el, d, suffixe) => { if (!d) return; el.classList.remove("up", "down"); void el.offsetWidth; el.classList.add(d > 0 ? "up" : "down"); flotter((d > 0 ? "+" : "−") + Math.abs(d) + suffixe, el, d > 0); };
    anime(elOr, v.or - precedent.or, " 💰"); anime(elC, v.coque - precedent.coque, " 🛠️");
    if (Math.abs(v.moral - precedent.moral) >= 3) anime(elM, v.moral - precedent.moral, "");
  }
  precedent = v;
  // Contrôle du temps (seulement en mer)
  const ht = $("#hautTemps"); const cle = S.voyage ? "mer" + (enPause ? "p" : vitesseIdx) : "port";
  if (ht.dataset.cle !== cle) {
    ht.dataset.cle = cle;
    ht.innerHTML = S.voyage ? "<button class='btnHaut " + (enPause ? "actif" : "") + "' data-v='p'>⏸</button>" + C.temps.vitesses.map((x, k) => "<button class='btnHaut " + (!enPause && vitesseIdx === k ? "actif" : "") + "' data-v='" + k + "'>x" + x + "</button>").join("") : "";
    ht.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => regler(b.dataset.v));
  }
}
function regler(v) { if (v === "p") enPause = !enPause; else { vitesseIdx = +v; enPause = false; } rendreHaut(); majVoyage(); }
function rendreOnglets() {
  const bq = document.querySelector("#onglets button[data-p='p-quetes']");
  if (bq) { const n = (S.jalonsNonVus || 0) + (S.legendesNonVues || 0); let pq = bq.querySelector(".pastille"); if (n && !pq) { pq = document.createElement("i"); pq.className = "pastille"; bq.appendChild(pq); } if (pq) { if (n) pq.textContent = n; else pq.remove(); } }
  const btnPC = $("#btnQuetesPC"); if (btnPC) btnPC.classList.toggle("nouveau", !!(S.jalonsNonVus || S.legendesNonVues));
  const b = document.querySelector("#onglets button[data-p='p-cale']"); if (!b) return;
  const n = S.quai.length; let p = b.querySelector(".pastille");
  if (n && !p) { p = document.createElement("i"); p.className = "pastille"; b.appendChild(p); }
  if (p) { if (n) p.textContent = n; else p.remove(); }
}

/* ---------- Illustrations ---------- */
function banniereIle(i) {
  const f = DB.factions[i.faction]; const trop = i.climat === "tropical";
  const maisons = i.faction === "aucune" ? 0 : clamp(i.services.length + 1, 2, 6);
  let s = "<svg viewBox='0 0 360 130' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='ciel" + i.id + "' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + (trop ? "#8cc7e0" : "#a9c3cf") + "'/><stop offset='1' stop-color='#f5e2b8'/></linearGradient></defs>";
  s += "<rect width='360' height='130' fill='url(#ciel" + i.id + ")'/><circle cx='300' cy='34' r='16' fill='#ffe9a8' opacity='.9'/>";
  s += "<g class='nuage' opacity='.8'><ellipse cx='60' cy='28' rx='26' ry='8' fill='#fff'/><ellipse cx='80' cy='24' rx='18' ry='7' fill='#fff'/></g>";
  s += "<path d='M40 98 Q90 40 160 52 Q210 30 260 70 Q300 82 330 98Z' fill='" + (trop ? "#6f9a4f" : "#7f9468") + "'/><path d='M40 98 Q120 80 330 98Z' fill='#e9d39a'/>";
  for (let k = 0; k < maisons; k++) { const x = 120 + k * 22, y = 66 - (k % 2) * 6; s += "<rect x='" + x + "' y='" + y + "' width='16' height='14' fill='#f1e3c3' stroke='#6b4b2a' stroke-width='1'/><path d='M" + (x - 2) + " " + y + " L" + (x + 8) + " " + (y - 8) + " L" + (x + 18) + " " + y + "Z' fill='#a5482e'/>"; }
  if (trop) s += "<path d='M95 92 Q97 70 92 58' stroke='#6b4b2a' stroke-width='3' fill='none'/><path d='M92 58 q-14 -4 -20 6 M92 58 q12 -8 22 0 M92 58 q-4 -12 -14 -14 M92 58 q8 -10 18 -10' stroke='#3f7a35' stroke-width='4' fill='none' stroke-linecap='round'/>";
  if (i.id === "pendu") s += "<path d='M200 62 V34 H220 V40' stroke='#3b2a1a' stroke-width='3' fill='none'/><path d='M220 40 v6' stroke='#3b2a1a' stroke-width='1'/>";
  s += "<path d='M255 92 V44' stroke='#3b2a1a' stroke-width='2'/><path d='M256 45 h24 l-5 7 l5 7 h-24z' fill='" + f.couleur + "'/>";
  s += "<g class='vague1'><path d='M0 100 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V130 H0Z' fill='#3e7590'/></g>";
  s += "<g class='vague2' opacity='.7'><path d='M0 110 q15 -5 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V130 H0Z' fill='#2b5469'/></g>";
  return s + "</svg>";
}
function navireSvg() {
  // Petit navire vu de côté (proue à droite)
  return "<g><path d='M140 108 L232 108 L222 124 Q186 130 150 124 Z' fill='#5a3a1e' stroke='#2e1c0e' stroke-width='1.5'/><path d='M146 112 H226' stroke='#c9a24a' stroke-width='1.5'/>" +
    "<path d='M186 108 V40' stroke='#3b2a1a' stroke-width='3'/><path d='M188 46 Q214 70 188 98 Z' fill='#f6ecd2' stroke='#b9a57a'/><path d='M184 50 Q162 74 184 100 Z' fill='#efe2c0' stroke='#b9a57a'/>" +
    "<path d='M186 40 h16 l-4 4 l4 4 h-16z' fill='#8a2f2f'/><path d='M232 108 L246 100' stroke='#3b2a1a' stroke-width='2'/></g>";
}
function couleurCiel(h) {
  const st = [[0, [14, 26, 43]], [0.22, [30, 44, 70]], [0.28, [242, 167, 107]], [0.36, [143, 195, 224]], [0.68, [143, 195, 224]], [0.76, [232, 138, 90]], [0.82, [40, 50, 80]], [1, [14, 26, 43]]];
  for (let k = 0; k < st.length - 1; k++) { const [a, ca] = st[k], [b, cb] = st[k + 1]; if (h >= a && h <= b) { const t = (h - a) / (b - a); return "rgb(" + ca.map((x, j) => Math.round(x + (cb[j] - x) * t)).join(",") + ")"; } }
  return "rgb(14,26,43)";
}

/* ---------- Panneau Port ---------- */
function rendrePort() {
  const p = $("#p-port");
  if (S.voyage) { if (p.dataset.mode !== "voyage") { p.dataset.mode = "voyage"; p.innerHTML = vueVoyage(); p.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => regler(b.dataset.v)); p.querySelectorAll("[data-interrompre]").forEach((b) => b.onclick = interrompreNavigation); } majVoyage(); return; }
  p.dataset.mode = "port";
  const i = ileAct(); let h = "";
  if (!i) h = "<h2>Au large</h2><div class='bloc'><p style='margin:0 0 8px'>À l'ancre en pleine mer. Choisissez un nouveau cap sur la carte : une île connue ou un point à explorer.</p><button class='primaire' data-a='carte' style='width:100%'>🗺️ Ouvrir la carte</button></div>" + journalHtml();
  else if (vuePort === "accueil") h = vueAccueil(i);
  else h = "<div class='retour'><button data-a='accueil'>‹ Port</button><h2>" + titreLieu(vuePort, i) + "</h2></div>" + ({ capitainerie: vueCapitainerie, marche: vueMarche, chantier: vueChantier, taverne: vueTaverne, banque: vueBanque }[vuePort])(i);
  p.innerHTML = h;
  lierPort(p);
}
function journalHtml() { return "<details class='journal'><summary>Journal de bord</summary><div class='liste bloc'>" + S.journal.map((e) => "<div><span class='muted'>J" + e.j + "</span> " + e.t + "</div>").join("") + "</div></details>"; }
function lieuxDe(i) {
  const L = []; const livr = offresIci().filter((o) => o.type === "livraison").length; const rum = offresIci().filter((o) => o.type === "decouverte").length;
  const rares = (S.offres[i.id] || []).filter((o) => o.rare).length; const ferme = effetPalier(i.id, "contrats", true) === false;
  if (i.marche) L.push({ id: "capitainerie", ic: "📜", t: "Capitainerie", s: ferme ? "Fermée : vous êtes indésirable" : rares ? "✨ Commande exceptionnelle !" : livr ? livr + " contrat(s) proposé(s)" : "Aucun contrat", badge: rares ? "✨" : livr, badgeOr: !!rares });
  if (i.marche) L.push({ id: "marche", ic: "⚖️", t: "Marché", s: marcheOuvert(i.id) ? (S.marche.some((e) => e.ile === i.id && e.debut <= S.temps && S.temps <= e.fin) ? "📈 Les prix bougent !" : "Acheter et vendre") : "Boycott : marché fermé" });
  if (i.services.includes("reparation") || i.services.includes("chantier") || i.ameliorations.length) L.push({ id: "chantier", ic: "🔨", t: i.services.includes("chantier") ? "Chantier naval" : "Atelier", s: "Coque " + arr(S.navire.coque) + "/" + coqueMax(), badge: S.navire.coque < coqueMax() * 0.6 ? "!" : 0 });
  const tav = i.services.includes("taverne");
  const leg = tav ? legendesTaverne(i.id).length : 0;
  L.push({ id: "taverne", ic: tav ? "🍺" : "🔥", t: tav ? "Taverne" : "Bivouac", s: rum ? rum + " quête(s) à écouter" : leg ? "📖 Une légende se raconte ici" : tav ? "Rumeurs, légendes, recrues" : "Se reposer", badge: rum + leg, badgeOr: true });
  if (i.services.includes("coffre") || (i.marche && effetQuelconque("coffrePartout"))) L.push({ id: "banque", ic: "🔒", t: "Coffre", s: S.coffre + " or à l'abri" });
  return L;
}
function titreLieu(id, i) { const l = lieuxDe(i).find((x) => x.id === id); return l ? l.ic + " " + l.t : id; }
function vueAccueil(i) {
  const f = DB.factions[i.faction]; const rep = S.reputation.iles[i.id] || 0;
  let h = "<div class='banniere'>" + banniereIle(i) + "<div class='nomIle'>" + esc(i.nom) + "</div></div>";
  h += "<div class='tags'><span class='tag' style='background:" + f.couleur + ";color:#fff'>" + esc(f.nom) + "</span><span class='tag'>" + (i.climat === "tropical" ? "🌴 Tropical" : "🌿 Tempéré") + "</span><span class='tag'>👁️ Surveillance " + niveau(i.surveillance) + "</span>" + tagPalier(rep) + "<span class='tag' style='background:" + niveauMefiance(i.faction).couleur + ";color:#fff'>👁️‍🗨️ " + esc(niveauMefiance(i.faction).nom) + "</span>" + (i.interdits.length ? "<span class='tag rouge'>⚠️ Interdit : " + i.interdits.map((x) => DB.items[x].icone).join(" ") + "</span>" : "") + "</div>";
  if (i.description) h += "<p class='desc-ile'>" + esc(i.description) + "</p>";
  if (palierIle(i.id).id === "hostile") h += "<div class='bloc' style='border-color:#b23a2e;background:#f8dcd6'>⛔ <b>Vous êtes indésirable ici.</b> " + esc(palierIle(i.id).resume) + ".</div>";
  h += objectifsHtml(i);
  if (S.quai.length) h += "<div class='bloc' style='border-color:#c47a1a;background:#fff1d6;display:flex;align-items:center;gap:10px'><span style='font-size:26px'>📦</span><div style='flex:1'><b>" + S.quai.length + " item(s) sur le quai</b><div class='muted'>À ranger dans la cale avant de partir.</div></div><button class='primaire' data-a='cale'>Ranger</button></div>";
  h += "<div class='lieux'>" + lieuxDe(i).map((l) => "<button class='lieu' data-lieu='" + l.id + "'>" + (l.badge ? "<span class='badge" + (l.badgeOr ? " or" : "") + "'>" + l.badge + "</span>" : "") + "<span class='ic'>" + l.ic + "</span><span class='t'>" + l.t + "</span><span class='s'>" + l.s + "</span></button>").join("") + "</div>";
  h += "<button class='primaire' data-a='carte' style='width:100%;min-height:50px;font-size:16px'>⛵ Lever l'ancre…</button>";
  if (S.contrats.length) h += "<h3>📌 Contrats en cours</h3>" + S.contrats.map(contratEnCours).join("");
  return h + "<div style='height:8px'></div>" + journalHtml();
}
function contratEnCours(c) {
  const r = c.echeance - S.temps; const a = tousItems().filter((it) => it.contrat === c.id).length; const d = DB.items[c.item];
  return "<div class='contrat' style='cursor:default'><span class='ai'>" + d.icone + "</span><div style='flex:1;min-width:0'><div class='nom'>" + esc(c.titre) + "</div><div class='route'>" + c.quantite + " × " + esc(d.nom) + " → " + esc(DB.iles[c.destination].nom) + "</div><div class='sous'>" + (r >= 0 ? "⏳ reste " + r.toFixed(1) + " j" : "<b style='color:#b23a2e'>⏳ en retard de " + (-r).toFixed(1) + " j</b>") + " · état min " + c.etatMin + " % · à bord " + a + "/" + c.quantite + "</div></div><span class='gain'>" + c.recompense + " 💰</span></div>";
}
function carteOffre(o) {
  if (o.type === "decouverte") return "<button class='contrat' data-offre='" + o.id + "'><span class='ai'>🗺️</span><div style='flex:1;min-width:0'><div class='nom'>" + esc(o.titre) + "</div><div class='sous'>" + esc(o.texte) + "</div></div></button>";
  const d = DB.items[o.item]; const dest = DB.iles[o.destination]; const noir = estInterdit(o.item, o.destination);
  return "<button class='contrat" + (o.rare ? " rare" : "") + "' data-offre='" + o.id + "'><span class='ai'>" + d.icone + "</span><div style='flex:1;min-width:0'><div class='nom'>" + (o.rare ? "✨ " : "") + esc(o.titre) + (o.aleatoire ? "" : " <span class='tag or'>quête</span>") + "</div><div class='route'>" + esc(S.ile ? DB.iles[S.ile].nom : "") + " → " + esc(dest.nom) + "</div><div class='sous'>" + o.quantite + " × " + esc(d.nom) + " · ⏳ " + o.delaiJours + " j · état ≥ " + o.etatMin + " % " + (d.fragile ? "🔸" : "") + (d.craintEau ? "💧" : "") + (d.perissable ? "⏳" : "") + (noir ? " <span class='tag rouge'>⚠️ contrebande</span>" : "") + "</div></div><span class='gain'>" + o.recompense + " 💰</span></button>";
}
function vueCapitainerie(i) {
  const livr = offresIci().filter((o) => o.type === "livraison");
  let h = "<p class='muted' style='margin-top:-4px'>Le client fournit la marchandise : vous la livrez dans les délais et en bon état.</p>";
  h += livr.length ? livr.map(carteOffre).join("") : "<div class='bloc muted'>Aucun contrat pour le moment. Revenez après un repos ou une autre escale.</div>";
  if (S.contrats.length) h += "<h3>📌 En cours</h3>" + S.contrats.map(contratEnCours).join("");
  return h;
}
function articleHtml(d, droite, sous, couleurFond) {
  return "<div class='article'><div class='ai' style='background:" + (couleurFond || d.couleur) + "'>" + d.icone + "</div><div class='ac'><div class='nom'>" + esc(d.nom) + (d.id && S.ile ? etiquetteMarche(S.ile, d.id) : "") + "</div><div class='sous'>" + sous + "</div></div>" + droite + "</div>";
}
function etiquetteMarche(ileId, itemId) { const e = evenementMarche(ileId, itemId); return e ? (e.type === "penurie" ? " <span class='tag rouge'>📈 pénurie</span>" : " <span class='tag vert'>📉 abondance</span>") : ""; }
function vueMarche(i) {
  if (!marcheOuvert(i.id)) return "<div class='bloc' style='border-color:#b23a2e;background:#f8dcd6'>⛔ <b>Boycott.</b> " + esc(DB.factions[i.faction].nom) + " refuse de commercer avec vous. Améliorez votre réputation auprès de cette faction.</div>";
  let h = "<div class='segment'><button data-seg='acheter' class='" + (ongletMarche === "acheter" ? "actif" : "") + "'>Acheter</button><button data-seg='vendre' class='" + (ongletMarche === "vendre" ? "actif" : "") + "'>Vendre</button></div>";
  if (ongletMarche === "acheter") {
    const achats = C.items.filter((d) => d.achetable !== false && !estInterdit(d.id, i.id));
    h += achats.map((d) => {
      const pa = prixAchat(i.id, d.id); const ratio = pa / d.prix; const nb = tousItems().filter((it) => it.id === d.id).length;
      const tend = ratio < 0.85 ? "<span class='tendance bas'>▼ bon prix</span>" : ratio > 1.3 ? "<span class='tendance haut'>▲ cher</span>" : "";
      const sous = d.largeur + "×" + d.hauteur + " · " + d.poids + " kg " + (d.fragile ? "🔸" : "") + (d.craintEau ? "💧" : "") + (d.perissable ? "⏳" : "") + (d.rations ? " · 🍞" + d.rations : "") + (C.iles.some((x) => x.interdits.includes(d.id)) ? " ⚠️" : "") + (nb ? " · <b>" + nb + " à bord</b>" : "") + "<br>" + tend;
      return articleHtml(d, "<button class='prix or' data-achat='" + d.id + "' " + (S.or < pa ? "disabled" : "") + ">" + pa + "<small>💰 acheter</small></button>", sous);
    }).join("");
  } else {
    const vendables = tousItems().filter((it) => !it.contrat);
    h += vendables.length ? vendables.map((it) => {
      const d = DB.items[it.id]; const noir = estInterdit(it.id, i.id);
      const sous = "État " + arr(it.etat) + " %" + (it.r ? " · 🍞" + it.r : "") + (S.quai.includes(it) ? " · sur le quai" : "") + (noir ? " <span class='tag rouge'>marché noir</span>" : "") + jauge(it.etat);
      return articleHtml(d, "<button class='prix or' data-vente='" + it.uid + "'>" + prixVente(i.id, it) + "<small>💰 vendre</small></button>", sous);
    }).join("") : "<div class='bloc muted'>Rien à vendre.</div>";
  }
  return h;
}
function descNavire(n) {
  const cs = n.salles.filter((s) => s.cale).map((s) => miniGrille(s.cale) + " " + (s.nom || DB.typesCale[s.cale.type].nom) + " " + s.cale.colonnes + "×" + s.cale.rangees).join("<br>");
  const autres = n.salles.filter((s) => !s.cale).map((s) => DB.sallesTypes[s.type].nom).join(", ");
  return cs + "<br>Salles : " + autres;
}
function miniGrille(n) { let s = "<span class='mini-grille' style='grid-template-columns:repeat(" + n.colonnes + ",7px)'>"; for (let y = 0; y < n.rangees; y++) for (let x = 0; x < n.colonnes; x++) s += "<i class='" + (y === n.rangees - 1 ? "h" : "") + "'></i>"; return s + "</span>"; }
function vueChantier(i) {
  let h = "";
  if (i.services.includes("reparation")) h += "<div class='bloc'><div class='ligne'><div class='g'><div class='nom'>🛠️ Coque " + arr(S.navire.coque) + " / " + coqueMax() + "</div>" + jauge(S.navire.coque, coqueMax()) + "</div><button class='or' data-a='reparer' " + (S.navire.coque >= coqueMax() || !S.or ? "disabled" : "") + ">Réparer · " + coutReparation() + " 💰</button></div></div>";
  if (i.ameliorations.length) { h += "<h3>⚙️ Améliorations <span class='muted' style='font-family:Inter'>" + S.navire.amelios.length + "/" + navire().emplacements + "</span></h3>"; i.ameliorations.forEach((id) => { const a = DB.amelios[id]; const eu = S.navire.amelios.includes(id); h += articleHtml({ icone: a.effet === "cachette" ? "🗝️" : a.effet === "baches" ? "🧥" : "🪵", nom: a.nom }, eu ? "<span class='tag vert'>installée</span>" : "<button class='prix or' data-amelio='" + id + "' " + (S.or < a.prix ? "disabled" : "") + ">" + a.prix + "<small>💰 installer</small></button>", esc(a.description), "#e9d6a6"); }); }
  if (i.services.includes("chantier")) { h += "<h3>⛵ Navires</h3>"; C.navires.filter((n) => n.prix > 0 && n.id !== S.navire.type).forEach((n) => { const ok = navireAutorise(n); h += articleHtml({ icone: "⛵", nom: n.nom }, ok ? "<button class='prix or' data-navire='" + n.id + "'>" + Math.max(0, n.prix - reprise()) + "<small>💰 reprise déduite</small></button>" : "<button class='prix' disabled>🔒<small>" + esc(DB.factions[n.requiert.faction].nom) + " ≥ " + n.requiert.reputation + "</small></button>", descNavire(n) + "<br>charge " + n.chargeMax + " · équipage " + n.equipageMax + " · " + n.canons + " canons · vitesse " + n.vitesse, "#cfe0ee"); }); }
  return h || "<div class='bloc muted'>Aucun service ici.</div>";
}
function vueTaverne(i) {
  const tav = i.services.includes("taverne"); let h = "";
  if (tav) {
    const deja = S.rumeurEscale === S.ile + ":" + Math.floor(S.temps);
    h += articleHtml({ icone: "🍺", nom: "Payer un verre et écouter" }, "<button class='prix or' data-a='rumeur' " + (deja || S.or < C.rumeurs.prix ? "disabled" : "") + ">" + C.rumeurs.prix + "<small>" + (deja ? "déjà écouté" : "💰 un verre") + "</small></button>", "Les marins parlent des pénuries et des abondances à venir… pas toujours à raison.", "#e9d6a6");
    const leg = legendesTaverne(i.id);
    h += articleHtml({ icone: "📖", nom: "Écouter les vieux marins" }, "<button class='prix' data-a='legende' " + (leg.length ? "" : "disabled") + ">" + (leg.length ? "Écouter" : "—") + "<small>" + (leg.length ? leg.length + " légende(s)" : "rien de neuf") + "</small></button>", leg.length ? "Ils connaissent des histoires que l'on ne raconte qu'ici." : "Vous connaissez déjà toutes les histoires de cette taverne.", "#cfe0d8");
    const recentes = S.rumeurs.slice(0, 3);
    if (recentes.length) h += "<div class='bloc'>" + recentes.map((r) => { const [s, t] = statutRumeur(r); return "<div class='ligne'><div class='g'><div class='nom' style='font-size:13px'>" + esc(texteRumeur(r)) + "</div><span class='effet " + s + "' style='font-size:11.5px'>" + esc(t) + "</span></div></div>"; }).join("") + "</div>";
  }
  h += articleHtml({ icone: "🛏️", nom: "Repos à terre (1 jour)" }, "<button class='prix or' data-a='repos' " + (S.or < C.equipage.reposPrix ? "disabled" : "") + ">" + C.equipage.reposPrix + "<small>💰 1 jour</small></button>", "Santé +" + C.equipage.reposSante + " · moral +" + C.equipage.reposMoral + " · de nouveaux contrats arrivent", "#e9d6a6");
  const rum = offresIci().filter((o) => o.type === "decouverte");
  if (rum.length) h += "<h3>👂 Rumeurs</h3>" + rum.map(carteOffre).join("");
  if (i.services.includes("recrutement")) {
    const rec = recruesDispo(); const plein = S.equipage.length >= navire().equipageMax;
    h += "<h3>🍺 Recrues <span class='muted' style='font-family:Inter'>" + S.equipage.length + "/" + navire().equipageMax + " à bord</span></h3>";
    h += rec.length ? rec.map((m) => "<div class='article'>" + portraitSvg(m.portrait, 48) + "<div class='ac'><div class='nom'>" + esc(m.nom) + "</div><div class='sous'>" + esc(DB.roles[m.role].nom) + " · second : " + esc(DB.roles[m.secondaire].nom) + "<br>" + m.salaire + " or/jour" + (m.traits.length ? " · " + m.traits.map((t) => DB.traits[t].nom).join(", ") : "") + "</div></div><button class='prix or' data-recrue='" + m.id + "' " + (plein || S.or < prixRecrue(m) ? "disabled" : "") + ">" + prixRecrue(m) + "<small>" + (plein ? "plus de place" : "💰 recruter") + "</small></button></div>").join("") : "<div class='bloc muted'>" + (effetFaction(i.faction, "pasDeRecrues") ? "Votre mauvaise réputation auprès de " + esc(DB.factions[i.faction].nom) + " fait fuir les candidats." : "Personne ne cherche d'embarquement.") + "</div>";
  } else if (tav) h += "<p class='muted'>Personne ici ne cherche à s'engager.</p>";
  return h;
}
function vueBanque() {
  return "<div class='bloc' style='text-align:center'><div style='font-size:40px'>🔒</div><div class='gros-gain' style='font-size:28px'>" + S.coffre + " 💰</div><p class='muted'>L'or du coffre est conservé même en cas de naufrage.</p>" +
    "<div class='grille2'><button data-coffre='50'>Déposer 50</button><button data-coffre='-50'>Retirer 50</button><button data-coffre='tout'>Tout déposer</button><button data-coffre='-tout'>Tout retirer</button></div></div>";
}
function lierPort(p) {
  p.querySelectorAll("[data-a]").forEach((b) => b.onclick = () => { const a = b.dataset.a; if (a === "rumeur") return ecouterRumeur(); if (a === "legende") return ecouterLegende(); if (a === "quetes") return afficherPanneau("p-quetes"); if (a === "carte") { if (estPC()) { const m = $("#p-carte"); m.scrollTop = 0; m.classList.remove("secoue"); } afficherPanneau("p-carte"); } if (a === "cale") afficherPanneau("p-cale"); if (a === "accueil") { vuePort = "accueil"; rendrePort(); } if (a === "reparer") reparer(); if (a === "repos") repos(); });
  p.querySelectorAll("[data-lieu]").forEach((b) => b.onclick = () => { vuePort = b.dataset.lieu; p.scrollTop = 0; rendrePort(); });
  p.querySelectorAll("[data-seg]").forEach((b) => b.onclick = () => { ongletMarche = b.dataset.seg; rendrePort(); });
  p.querySelectorAll("[data-achat]").forEach((b) => b.onclick = () => acheter(b.dataset.achat));
  p.querySelectorAll("[data-vente]").forEach((b) => b.onclick = () => { const it = tousItems().find((x) => x.uid === b.dataset.vente); if (it) vendre(it); });
  p.querySelectorAll("[data-recrue]").forEach((b) => b.onclick = () => recruter(b.dataset.recrue));
  p.querySelectorAll("[data-amelio]").forEach((b) => b.onclick = () => acheterAmelio(b.dataset.amelio));
  p.querySelectorAll("[data-navire]").forEach((b) => b.onclick = () => acheterNavire(b.dataset.navire));
  p.querySelectorAll("[data-coffre]").forEach((b) => b.onclick = () => { const v = b.dataset.coffre; coffre(v.startsWith("-") ? -1 : 1, v.endsWith("tout") ? 1e9 : 50); });
  p.querySelectorAll("[data-offre]").forEach((b) => b.onclick = () => { const o = offresIci().find((x) => x.id === b.dataset.offre); if (o) voirOffre(o); });
}
function niveau(v) { return v >= 0.5 ? "élevée" : v >= 0.25 ? "moyenne" : v > 0 ? "faible" : "aucune"; }
function contraintesTags(d, it) {
  let t = "";
  if (d.fragile) t += "<span class='tag'>🔸 fragile</span>";
  if (d.perissable) t += "<span class='tag'>⏳ périssable " + d.perissable + " j</span>";
  if (d.craintEau) t += "<span class='tag bleu'>💧 craint l'eau</span>";
  if (d.rations) t += "<span class='tag vert'>🍞 " + (it ? it.r : d.rations) + " rations</span>";
  const interdit = C.iles.filter((i) => i.interdits.includes(d.id) && S.connues.includes(i.id));
  if (interdit.length) t += "<span class='tag rouge'>⚠️ interdit à " + interdit.map((i) => esc(i.nom)).join(", ") + "</span>";
  return t;
}
async function voirOffre(o) {
  let html, icone = "📜";
  if (o.type === "decouverte") { html = "<p>" + esc(o.texte) + "</p>"; icone = "🗺️"; }
  else {
    const d = DB.items[o.item]; const dest = DB.iles[o.destination]; icone = d.icone;
    const risque = estInterdit(o.item, o.destination) ? "<p><span class='tag rouge'>⚠️ " + esc(d.nom) + " est de la contrebande à " + esc(dest.nom) + " !</span></p>" : "";
    html = (o.texte ? "<p>" + esc(o.texte) + "</p>" : "") + "<div class='gros-gain' style='font-size:26px'>" + o.recompense + " 💰</div><ul><li>" + o.quantite + " × " + esc(d.nom) + " (" + d.largeur + "×" + d.hauteur + ", " + d.poids + " kg chacun)</li><li>Vers " + esc(dest.nom) + " · ≈ " + joursTrajet(S.pos, dest).toFixed(1) + " jours de mer</li><li>Délai : " + o.delaiJours + " jours · état minimum " + o.etatMin + " %</li><li>Réputation +" + o.reputation + "</li></ul><div>" + contraintesTags(d, null) + "</div>" + risque;
  }
  const r = await modale({ titre: o.titre, icone, theme: o.type === "decouverte" ? "tresor" : "", html, boutons: [{ t: o.type === "decouverte" ? "Écouter la rumeur" : "Accepter le contrat", primaire: true }, { t: "Refuser" }] });
  if (r === 0) accepter(o);
}

/* ---------- Vue de navigation ---------- */
function vueVoyage() {
  const v = S.voyage; const de = v.de.ile ? DB.iles[v.de.ile].nom : "Large"; const vers = v.vers.ile ? DB.iles[v.vers.ile].nom : "Eaux inconnues";
  let h = "<h2>En mer</h2><div class='scene'><svg viewBox='0 0 360 150' preserveAspectRatio='xMidYMid slice'><rect id='scCiel' width='360' height='150' fill='#8fc3e0'/>" +
    "<g id='scEtoiles' opacity='0'>" + Array.from({ length: 24 }, (_, k) => "<circle cx='" + ((k * 53) % 360) + "' cy='" + ((k * 29) % 70 + 6) + "' r='" + (k % 3 ? 0.8 : 1.3) + "' fill='#fff'/>").join("") + "</g>" +
    "<circle id='scAstre' cx='60' cy='40' r='13' fill='#ffe9a8'/>" +
    "<g class='nuage' opacity='.85'><ellipse cx='60' cy='30' rx='28' ry='8' fill='#fff'/><ellipse cx='82' cy='25' rx='18' ry='7' fill='#fff'/></g>" +
    "<g class='nuage' style='animation-duration:62s;animation-delay:-30s' opacity='.7'><ellipse cx='40' cy='52' rx='22' ry='6' fill='#fff'/></g>" +
    "<g class='vague2' opacity='.8'><path d='M0 112 q15 -6 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V150 H0Z' fill='#2b5469'/></g>" +
    "<g class='tangue'>" + navireSvg() + "</g>" +
    "<g class='vague1'><path d='M0 120 q15 -7 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 V150 H0Z' fill='#3e7590'/></g>" +
    "<rect id='scNuit' width='360' height='150' fill='#0a1430' opacity='0' pointer-events='none'/></svg></div>";
  h += "<div class='bloc'><div class='trajet'><span>" + esc(de) + "</span><div class='barre'><i id='vgBarre'></i><b id='vgNav'>⛵</b></div><span>" + esc(vers) + "</span></div>" +
    "<div class='grille2' style='margin-top:12px'><div class='muted'>Arrivée dans<br><b id='vgEta' style='font-size:16px;color:var(--encre)'></b></div><div class='muted'>Vitesse<br><b id='vgVit' style='font-size:16px;color:var(--encre)'></b></div></div>" +
    "<div class='vitesses'><button data-v='p'>⏸ Pause</button>" + C.temps.vitesses.map((x, k) => "<button data-v='" + k + "'>x" + x + "</button>").join("") + "</div>" +
    "<button class='btnInterrompre' data-interrompre='1'>🧭 Interrompre la navigation…</button></div>";
  h += "<p class='muted'>Les événements mettent le jeu en pause. Vous pouvez réorganiser la cale pendant la traversée.</p>";
  if (S.contrats.length) h += "<h3>📌 Contrats en cours</h3>" + S.contrats.map(contratEnCours).join("");
  return h + journalHtml();
}
function majVoyage() {
  const v = S.voyage; if (!v || !$("#vgBarre")) return;
  const t = v.dist ? clamp(v.fait / v.dist, 0, 1) : 1; const reste = Math.max(0, (v.dist - v.fait) / Math.max(0.1, vitesseNavire()) + v.attente);
  $("#vgBarre").style.width = t * 100 + "%"; $("#vgNav").style.left = t * 100 + "%";
  $("#vgEta").textContent = "≈ " + reste.toFixed(1) + " jour(s)"; $("#vgVit").textContent = vitesseNavire().toFixed(1) + " / jour" + (v.attente > 0 ? " (immobile)" : "");
  const h = heure(); $("#scCiel").setAttribute("fill", couleurCiel(h));
  const nuit = estNuit(); const a = $("#scAstre"); const ang = ((h + 0.75) % 0.5) / 0.5;
  a.setAttribute("cx", 20 + ang * 320); a.setAttribute("cy", 70 - Math.sin(ang * Math.PI) * 50); a.setAttribute("fill", nuit ? "#e8eefc" : "#ffe9a8");
  $("#scEtoiles").setAttribute("opacity", nuit ? 0.9 : 0); $("#scNuit").setAttribute("opacity", nuit ? 0.25 : 0);
  document.querySelectorAll("#p-port .vitesses button").forEach((b) => b.classList.toggle("actif", b.dataset.v === "p" ? enPause : !enPause && +b.dataset.v === vitesseIdx));
}

/* ---------- Panneau Bateau ---------- */
let salleSel = null;      // salle affichée en détail
let coupeGrande = false;  // vue en coupe agrandie (téléphone)
const ABR = { navigation: "Nav", vigie: "Vig", defense: "Déf", cuisine: "Cuis", medecine: "Méd", arrimage: "Arr", charpente: "Charp", commerce: "Com" };
const STATUTS = { principal: "rôle principal", secondaire: "rôle secondaire", patient: "patient", repos: "au repos", inutile: "sans compétence utile ici" };
function salleSelectionnee() { if (!salleSel || !salleDef(salleSel)) salleSel = calePrincipale(); return salleDef(salleSel); }
function fmt2(v) { return v.toFixed(v >= 10 ? 0 : 1).replace(".", ","); }

function hautCoupe(n) { // sans vigie, on coupe le haut du ciel pour gagner de la place
  const yMin = Math.min(...n.salles.map((s) => s.y));
  return yMin < 60 ? 0 : Math.max(0, yMin - 14);
}
function silhouetteSvg(n) {
  const cp = n.coupe; const H = cp.hauteur; const coul = couleurNavire(n); const y0 = hautCoupe(n); const pav = pavillonActuel();
  const eau = clamp(cp.quille - 26 - ratioCharge() * 16, cp.pont + 30, cp.quille - 8);
  const formes = {
    barque: { coque: "M 60 100 L 300 100 Q 318 98 326 86 Q 318 150 278 190 Q 226 210 184 210 Q 134 208 104 192 Q 66 156 60 100 Z",
      greement: "<rect x='198' y='16' width='4' height='86' fill='#4a321c'/><path d='M 203 20 L 262 90 L 204 92 Z' fill='#f6ecd2' stroke='#b9a57a'/><path d='M 201 16 L 218 19 L 201 23 Z' fill='#3f8a4f'/><line x1='110' y1='104' x2='84' y2='150' stroke='#6b4b2a' stroke-width='3' stroke-linecap='round'/>",
      bande: "M 0 110 Q 180 116 366 98", lignes: [136, 166], fenetres: "" },
    cotre: { coque: "M 34 116 L 56 116 L 62 140 L 294 140 Q 312 132 324 116 L 332 118 Q 326 190 292 248 Q 244 292 178 294 Q 108 292 80 254 Q 50 196 34 116 Z",
      greement: "<line x1='320' y1='120' x2='358' y2='98' stroke='#3b2a1a' stroke-width='4' stroke-linecap='round'/><rect x='174' y='8' width='6' height='134' fill='#4a321c'/><path d='M 181 30 L 262 44 L 270 132 L 181 132 Z' fill='#f6ecd2' stroke='#b9a57a'/><path d='M 180 22 L 354 100 L 186 128 Z' fill='#faf2dc' stroke='#b9a57a'/><path d='M 180 8 L 202 11 L 196 15 L 202 19 L 180 19 Z' fill='#3f8a4f'/>",
      bande: "M 0 148 Q 180 156 366 128", lignes: [176, 206, 236, 266], fenetres: "<rect x='39' y='122' width='7' height='9' rx='1' fill='#e7c977'/>" },
    goelette: { coque: "M 8 112 L 34 112 L 42 140 L 318 140 Q 338 132 350 114 L 358 116 Q 352 200 316 268 Q 262 324 170 326 Q 84 324 50 278 Q 20 210 8 112 Z",
      greement: "<line x1='346' y1='118' x2='366' y2='92' stroke='#3b2a1a' stroke-width='4' stroke-linecap='round'/><rect x='118' y='6' width='5' height='136' fill='#4a321c'/><rect x='244' y='28' width='5' height='114' fill='#4a321c'/><path d='M 125 58 L 200 66 L 206 132 L 125 132 Z' fill='#f6ecd2' stroke='#b9a57a'/><path d='M 251 44 L 312 54 L 318 132 L 251 132 Z' fill='#f1e5c6' stroke='#b9a57a'/><path d='M 252 34 L 364 96 L 258 126 Z' fill='#faf2dc' stroke='#b9a57a'/><path d='M 123 6 L 146 9 L 140 13 L 146 17 L 123 17 Z' fill='#3f8a4f'/><path d='M 249 28 L 266 32 L 249 36 Z' fill='#3f8a4f'/>",
      bande: "M 0 148 Q 180 156 366 128", lignes: [176, 206, 236, 266, 296], fenetres: "<rect x='13' y='118' width='7' height='9' rx='1' fill='#e7c977'/><rect x='24' y='118' width='7' height='9' rx='1' fill='#e7c977'/>" }
  };
  const f = formes[n.silhouette] || formes.cotre; const idc = "coque-" + n.id;
  let s = "<svg class='coupe-svg' viewBox='0 " + y0 + " 366 " + (H - y0) + "' preserveAspectRatio='none' aria-hidden='true'><defs><linearGradient id='bois-" + n.id + "' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7a5132'/><stop offset='0.7' stop-color='#4a2d17'/><stop offset='1' stop-color='#2e1a0b'/></linearGradient><clipPath id='" + idc + "'><path d='" + f.coque + "'/></clipPath></defs>";
  s += f.greement.split("fill='#3f8a4f'").join("fill='" + pav.couleurs[0] + "' stroke='" + pav.couleurs[1] + "' stroke-width='1.5'");
  s += "<path d='" + f.coque + "' fill='url(#bois-" + n.id + ")' stroke='#24150a' stroke-width='2'/>";
  s += "<g clip-path='url(#" + idc + ")'><path d='" + f.bande + "' stroke='" + coul + "' stroke-width='9' fill='none'/>" + f.lignes.map((y) => "<path d='M 0 " + y + " Q 180 " + (y + 8) + " 366 " + (y - 24) + "' stroke='rgba(0,0,0,0.28)' stroke-width='1.5' fill='none'/>").join("") + "</g>" + f.fenetres;
  s += "<text x='180' y='" + (cp.quille - 12) + "' text-anchor='middle' font-family='IM Fell English SC, Georgia, serif' font-size='12' fill='#e7c977'>" + esc(S.navire.nom || n.nomParDefaut) + "</text>";
  return s + "</svg>";
}
function niveauEau(n) { const cp = n.coupe; return clamp(cp.quille - 26 - ratioCharge() * 16, cp.pont + 30, cp.quille - 8); }
function merSvg(n, devant) {
  // La mer reste horizontale : seul le navire s'incline. Elle déborde largement pour remplir tout le cadre.
  const H = n.coupe.hauteur; const y0 = hautCoupe(n); const eau = niveauEau(n);
  const vagues = (y, amp) => { let d = "M -420 " + y; for (let k = 0; k < 50; k++) d += " q 12 " + (-amp) + " 24 0"; return d + " V " + (H + 200) + " H -420 Z"; };
  return "<svg class='coupe-mer' viewBox='0 " + y0 + " 366 " + (H - y0) + "' preserveAspectRatio='none' aria-hidden='true'>" +
    (devant ? "<path class='vague1' d='" + vagues(eau, 6) + "' fill='#3e7590' opacity='0.72'/>"
            : "<rect x='-420' y='" + (eau - 6) + "' width='1206' height='" + (H + 200) + "' fill='#2b5469'/><path class='vague2' d='" + vagues(eau - 8, 4) + "' fill='#2b5469' opacity='0.6'/>") + "</svg>";
}
function miniPortrait(m, t, deplacable) {
  return "<span class='mp st-" + statutMarin(m) + "' " + (deplacable ? "data-marin='" + m.id + "' " : "") + "title='" + esc(m.nom + " — " + STATUTS[statutMarin(m)]) + "' style='width:" + t + "px;height:" + t + "px'>" + portraitSvg(m.portrait, t) + "</span>";
}
function resumeSalle(s) {
  if (s.cale) { const k = caleDef(s.id); return chargeCale(s.id) + " kg · " + k.colonnes + "×" + k.rangees; }
  const comp = typeSalle(s).competences || {};
  const parts = Object.keys(comp).filter((c) => comp[c] >= 1).map((c) => ABR[c] + " " + fmt2(competenceSalle(c, s.id)));
  if (typeSalle(s).action === "repos") return occupants(s.id).length + " au repos";
  return parts.join(" · ");
}
function boiteSalle(s, H, y0) {
  const t = typeSalle(s); const occ = occupants(s.id); const sel = salleSel === s.id;
  const alerte = t.critique && !occ.length; const Hv = H - y0;
  const st = "left:" + (s.x / 366 * 100) + "%;top:" + ((s.y - y0) / Hv * 100) + "%;width:" + (s.l / 366 * 100) + "%;height:" + (s.h / Hv * 100) + "%";
  let gens = occ.map((m) => miniPortrait(m, 20, true)).join("");
  for (let k = occ.length; k < s.places; k++) gens += "<span class='place-vide' aria-hidden='true'></span>";
  const info = resumeSalle(s); const large = s.l >= 120;
  return "<div class='salle" + (sel ? " sel" : "") + (alerte ? " alerte" : "") + (s.cale ? " est-cale" : "") + (s.cale && caleDef(s.id).fondHumide ? " humide" : "") + "' data-salle='" + s.id + "' style='" + st + "' role='button' tabindex='0' aria-label='" + esc(nomSalle(s) + (info ? ", " + info : "")) + "' title='" + esc(nomSalle(s) + (info ? " · " + info : "")) + "'>" +
    "<span class='s-nom'>" + esc(nomSalle(s)) + (s.places ? " <small>" + occ.length + "/" + s.places + "</small>" : "") + (!s.cale && large && info ? " <small>· " + info + "</small>" : "") + "</span>" +
    (gens ? "<span class='s-gens'>" + gens + "</span>" : "") + (s.cale ? "<span class='s-info'>" + info + "</span>" : "") + "</div>";
}
function tailleCase(k) {
  const panneau = $("#p-cale"); const larg = (panneau.clientWidth || window.innerWidth) - 24 - 56;
  return clamp(Math.floor(larg / k.colonnes), 26, 54);
}
function rendreCale() {
  if (glisse || glisseMarin) return;
  const p = $("#p-cale"); const scroll = p.scrollTop; const n = navire(); const H = n.coupe.hauteur;
  const s = salleSelectionnee();
  const rc = ratioCharge(); const st = stabilite(); const dq = desequilibre(); const cg = centreGravite();
  let h = "<div class='nav-tete'><h2>" + esc(S.navire.nom) + "</h2><button class='btnMini' id='bRenommer' aria-label='Renommer le navire'>✏️</button><button class='btnMini' id='bPerso' aria-label='Personnaliser le navire'>🎨</button></div>";
  h += "<div class='tags' style='margin:-4px 0 8px'>" + (S.titre ? "<span class='tag or'>🎖️ " + esc(S.titre) + "</span>" : "") + "<span class='tag' style='background:" + couleurNavire(n) + ";color:#fff'>" + esc(n.nom) + "</span><span class='tag'>" + S.equipage.length + "/" + n.equipageMax + " marins</span><span class='tag'>" + n.canons + " canons</span><span class='tag'>" + cales().length + " cale(s)</span></div>";
  // Vue en coupe
  const y0 = hautCoupe(n); const Hv = H - y0;
  const incl = "transform:rotate(" + (dq * 2.2).toFixed(2) + "deg)";
  h += "<div class='coupe-cadre'><div class='coupe' style='aspect-ratio:366/" + Hv + ";width:100%;max-width:560px'>" + merSvg(n, false) +
    "<div class='coupe-in' style='" + incl + "'>" + silhouetteSvg(n) + "</div>" + merSvg(n, true) +
    "<div class='coupe-in' style='" + incl + "'>" + sallesNavire().map((x) => boiteSalle(x, H, y0)).join("") +
    (cg ? "<span class='cg " + (Math.abs(dq) < 0.15 ? "ok" : "") + "' role='img' aria-label='Centre de gravité' style='left:" + (cg.x / 366 * 100) + "%;top:" + ((cg.y - y0) / Hv * 100) + "%'>+</span>" : "") +
    "</div></div><span class='lbl-bord g'>◀ POUPE</span><span class='lbl-bord d'>PROUE ▶</span></div>";
  // Jauges du navire
  const assiette = Math.abs(dq) < 0.15 ? "Équilibrée" : dq > 0 ? "Sur l'avant" : "Sur l'arrière";
  h += "<div class='pastilles'>" +
    "<div class='pas'><span>⚖️ Charge</span><b class='" + (rc > 1 ? "rouge" : rc > C.cale.seuilRalentissement ? "orange" : "") + "'>" + charge() + "/" + n.chargeMax + "</b></div>" +
    "<div class='pas'><span>⚓ Stabilité</span><b class='" + (st < 0.5 ? "orange" : "") + "'>" + pct(st) + "</b></div>" +
    "<div class='pas'><span>↔️ Assiette</span><b class='" + (Math.abs(dq) >= 0.15 ? "orange" : "") + "'>" + assiette + "</b><i class='assiette'><i style='left:" + (50 + dq * 50) + "%'></i></i></div>" +
    "<div class='pas'><span>💨 Vitesse</span><b>" + fmt2(vitesseNavire()) + "/j</b></div>" +
    (() => { const na = noteArrimage(); return "<div class='pas' title='" + esc(na.details.join(", ") || "Rien à signaler") + "'><span>📋 Arrimage</span><b class='note note-" + na.lettre + "'>" + na.lettre + "</b></div>"; })() + "</div>";
  // Postes rapides
  const aSoin = sallesNavire().some((x) => typeSalle(x).action);
  h += "<div class='postes'><button data-poste='conseil'>✨ Placement conseillé</button><button data-poste='tempete'>⛈️ Tempête</button><button data-poste='repos' " + (aSoin ? "" : "disabled title='Ni infirmerie ni dortoir sur ce navire'") + ">🛏️ Soins</button></div>";
  // Détail de la salle
  h += "<div id='detailSalle' class='bloc'>" + (s.cale ? detailCaleHtml(s) : detailSalleHtml(s)) + "</div>";
  if (s.cale && S.ile) h += "<div class='quai-barre" + (S.quai.length ? "" : " vide") + "'><div class='tete'>⚓ Quai <span class='muted' style='font-family:Inter'>" + (S.quai.length ? S.quai.length + " item(s) à charger" : "") + "</span>" + (S.quai.length ? "<button class='primaire' id='bToutRanger'>Tout ranger</button>" : "") + "</div><div id='quai' class='" + (S.quai.length ? "" : "vide") + "' data-vide='Quai vide. Glissez un item ici pour le décharger.'>" + S.quai.map((it) => itemHtml(it, Math.min(tailleCase(caleDef(s.id)), 44), null, null)).join("") + "</div></div>";
  p.innerHTML = h; p.scrollTop = scroll;
  // Interactions
  p.querySelectorAll(".salle").forEach((el) => { el.onclick = () => { salleSel = el.dataset.salle; selection = null; vibrer(6); rendreCale(); }; el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.onclick(); } }; });
  p.querySelectorAll(".mp[data-marin]").forEach((el) => el.addEventListener("pointerdown", debutGlisseMarin));
  p.querySelectorAll(".item").forEach((el) => el.addEventListener("pointerdown", debutGlisse));
  p.querySelectorAll("[data-poste]").forEach((b) => b.onclick = () => { const k = b.dataset.poste; let ok = true; if (k === "conseil") placementConseille(); if (k === "tempete") posteTempete(); if (k === "repos") ok = posteRepos(); if (ok) { toast(k === "tempete" ? "Tout le monde sur le pont !" : k === "repos" ? "Blessés à l'infirmerie, les autres à leur poste." : "Chacun à son poste."); vibrer(12); } rendreTout(); sauver(); });
  const on = (id, f) => { const b = $("#" + id); if (b) b.onclick = f; };
  on("bToutRanger", toutRanger);
  on("bRenommer", renommerNavire);
  on("bPerso", personnaliser);
  if (s.cale) rendreDetail();
  rendreOnglets();
}
function detailSalleHtml(s) {
  const t = typeSalle(s); const occ = occupants(s.id);
  let h = "<div class='d-tete'><h3 style='margin:0'>" + t.icone + " " + esc(nomSalle(s)) + "</h3><span class='muted'>" + s.places + " place(s)</span></div><p class='muted' style='margin:4px 0 8px'>" + esc(t.description) + "</p>";
  occ.forEach((m) => {
    const comp = t.competences || {}; const st = statutMarin(m);
    const chips = Object.keys(comp).map((c) => [c, apportBrut(m, c) * comp[c]]).filter(([, v]) => v > 0).map(([c, v]) => "<span class='effet pos'>" + esc(nomCompetence(c)) + " " + fmt2(v) + "</span>").join("");
    const extra = st === "patient" ? "<span class='effet pos'>+" + arr(C.salles.soinPatientParJour * (1 + competenceSalle("medecine", s.id))) + " santé / j</span>" : st === "repos" ? "<span class='effet pos'>+" + C.salles.reposSanteParJour + " santé · +" + C.salles.reposMoralParJour + " moral / j</span>" : "";
    h += "<div class='occupant'>" + miniPortrait(m, 40, true) + "<div style='flex:1;min-width:0'><div class='nom'>" + esc(m.nom) + "</div><div class='sous'>" + esc(DB.roles[m.role].nom) + (m.secondaire ? " · second : " + esc(DB.roles[m.secondaire].nom) : "") + " · " + STATUTS[st] + " · ❤️ " + arr(m.sante) + "</div><div class='effets' style='margin-top:4px'>" + (chips || extra || "<span class='effet neg'>Inutile ici</span>") + (chips && extra ? extra : "") + "</div></div></div>";
  });
  for (let k = occ.length; k < s.places; k++) h += "<div class='occupant libre'><span class='place-vide grande' aria-hidden='true'></span><span class='muted'>Place libre : glissez un portrait ici</span></div>";
  return h;
}
function detailCaleHtml(s) {
  const k = caleDef(s.id); const cs = tailleCase(k); const occ = occupants(s.id);
  let h = "<div class='d-tete'><h3 style='margin:0'>📦 " + esc(k.nom) + "</h3><span class='muted'>" + k.colonnes + "×" + k.rangees + " · " + chargeCale(s.id) + " kg</span></div><p class='muted' style='margin:4px 0 6px'>" + esc(k.description) + (s.places ? " " + esc(typeSalle(s).description) : "") + "</p>";
  if (s.places) h += "<div class='occupants-ligne'>" + (occ.length ? occ.map((m) => miniPortrait(m, 30, true) + "<span class='sous'>" + esc(m.nom.split(" ")[0]) + " · Arrimage " + fmt2(competenceSalle("arrimage", s.id)) + "</span>").join("") : "<span class='place-vide'></span><span class='sous'>Personne pour protéger cette cale</span>") + "</div>";
  h += "<div class='coque-wrap'><span class='lbl' style='left:4px;top:50%;transform:translateY(-50%) rotate(-90deg)'>POUPE</span><span class='lbl' style='right:4px;top:50%;transform:translateY(-50%) rotate(90deg)'>PROUE</span><span class='lbl' style='left:50%;top:7px;transform:translateX(-50%)'>HAUT</span><span class='lbl' style='left:50%;bottom:8px;transform:translateX(-50%)'>" + (k.fondHumide ? "FOND · HUMIDE" : "FOND · SEC") + "</span><div id='grille' data-cale='" + k.id + "' style='width:" + k.colonnes * cs + "px;height:" + k.rangees * cs + "px'>";
  const cache = aAmelio("cachette") ? (k.cachette || []).map((c) => c.join(",")) : [];
  for (let y = 0; y < k.rangees; y++) for (let x = 0; x < k.colonnes; x++) h += "<div class='case" + (k.fondHumide && y === k.rangees - 1 ? " humide" : "") + (k.toutVentile || (k.colonnesVentilees || []).includes(x) ? " vent" : "") + (cache.includes(x + "," + y) || k.discretion ? " cache" : "") + "' style='left:" + x * cs + "px;top:" + y * cs + "px;width:" + cs + "px;height:" + cs + "px'></div>";
  itemsDe(k.id).forEach((it) => { h += itemHtml(it, cs, it.x * cs, it.y * cs); });
  h += "</div></div><div class='legende'>" + (k.fondHumide ? "<span class='tag bleu'>💧 fond humide</span>" : "<span class='tag vert'>☀️ cale sèche</span>") + "<span class='tag'>▨ ventilé</span><span class='tag'>⬇ tout repose sur un appui</span><span class='tag'>🪚 planche = étagère</span>" + (cales().length > 1 ? "<span class='tag or'>⇄ changer de cale : glissez sur la coupe ou touchez l'item</span>" : "") + "</div>";
  h += "<div id='detail'></div>";
  return h;
}
async function renommerNavire() {
  const r = await modale({ titre: "Renommer le navire", icone: "✏️", html: "<label for='nomNavire' class='muted'>Nouveau nom</label><input id='nomNavire' maxlength='28' value='" + esc(S.navire.nom) + "' style='width:100%;box-sizing:border-box;margin-top:4px;padding:10px;font:inherit;font-size:16px;border:1px solid #8c6239;border-radius:10px;background:#fffaf0'>", boutons: [{ t: "Renommer", primaire: true }, { t: "Annuler" }] });
  const champ = $("#nomNavire"); const v = champ ? champ.value.trim() : "";
  if (r === 0 && v) { S.navire.nom = v; journal("Le navire s'appelle désormais <b>" + esc(v) + "</b>."); rendreTout(); sauver(); }
}
function toutRanger() {
  const tri = [...S.quai].sort((a, b) => DB.items[b.id].poids * dimsAire(b) - DB.items[a.id].poids * dimsAire(a));
  let ko = 0; tri.forEach((it) => { if (!placerAuto(it)) ko++; });
  vibrer(15); if (ko) toast(ko + " item(s) n'ont pas trouvé de place."); else toast("Tout est rangé ! Vérifiez les risques (!).");
  rendreTout(); sauver();
  document.querySelectorAll("#grille .item").forEach((el) => el.classList.add("pose"));
}
function dimsAire(it) { const d = DB.items[it.id]; return d.largeur * d.hauteur; }
function enRisque(it) { if (it.x < 0 || !it.cale) return false; const d = DB.items[it.id]; return (d.craintEau && auFond(it)) || (d.fragile && poidsAuDessus(it) > C.cale.poidsFragile); }
function itemHtml(it, cs, left, top) {
  const d = DB.items[it.id]; const dm = dims(it);
  const pos = left === null ? "" : "left:" + left + "px;top:" + top + "px;";
  const dest = S.voyage ? S.voyage.vers.ile : (destination && destination.ile) || S.ile;
  const badges = (d.fragile ? "🔸" : "") + (d.perissable ? "⏳" : "") + (d.craintEau ? "💧" : "") + (estInterdit(it.id, dest) ? "⚠️" : "") + (it.contrat ? "📜" : "");
  const coul = it.etat < 40 ? "#ff7b6b" : it.etat < 70 ? "#ffc562" : "#9be27a";
  return "<div class='item" + (d.fixe ? " planche" : "") + (selection === it.uid ? " sel" : "") + (enRisque(it) ? " risque" : "") + "' data-uid='" + it.uid + "' style='" + pos + "width:" + (dm.w * cs - 4) + "px;height:" + (dm.h * cs - 4) + "px;margin:2px;background:" + d.couleur + "'><span class='badges'>" + badges + "</span><span class='ic'>" + d.icone + "</span><span class='nm'>" + (dm.w * cs > 70 ? esc(d.nom) : "") + "</span><div class='etat'><i style='width:" + it.etat + "%;background:" + coul + "'></i></div></div>";
}
function risquesPosition(it) {
  const d = DB.items[it.id]; const r = [];
  if (it.x < 0 || !it.cale) return r;
  const k = caleDe(it);
  if (d.fixe) r.push(["pos", "🪚 Fixée à la coque : elle sert d'appui, même au-dessus du vide."]);
  else if (!appuiInfo(it, k.id, it.x, it.y, it.rot, occupation(k.id, it.uid)).stable) r.push(["neg", "⬇ Mal calé : son centre n'est pas au-dessus d'un appui."]);
  if (d.craintEau && auFond(it)) r.push(["neg", "💧 Au fond de cale humide : il s'abîme chaque jour en mer."]);
  if (d.craintEau && !k.fondHumide) r.push(["pos", "☀️ Cale sèche : à l'abri de l'humidité."]);
  if (d.fragile) { const p = poidsAuDessus(it); if (p > C.cale.poidsFragile) r.push(["neg", "🔸 " + p + " kg posés dessus : il souffrira des chocs."]); else r.push(["pos", "🔸 Rien de lourd dessus : bien protégé."]); }
  if (d.perissable) r.push(ventile(it) ? ["pos", "▨ Zone ventilée : pourrit moins vite."] : ["", "⏳ Hors zone ventilée : pourrit à vitesse normale."]);
  if (d.poids >= 9 && it.y < k.rangees - 2) r.push(["neg", "⚖️ Lourd et placé haut : le navire est moins stable."]);
  if (dansCachette(it)) r.push(["pos", "🗝️ Bien caché : presque invisible aux inspections."]);
  const arrim = competenceSalle("arrimage", k.id); r.push(arrim > 0 ? ["pos", "📦 Arrimage de la cale : " + fmt2(arrim)] : ["", "📦 Personne n'arrime cette cale."]);
  return r;
}
function rendreDetail() {
  const el = $("#detail"); if (!el) return;
  const it = tousItems().find((x) => x.uid === selection);
  if (!it) { el.innerHTML = "<span class='muted'>👆 Touchez un item pour voir ses caractéristiques et les risques de son emplacement. Glissez-le pour le déplacer.</span>"; return; }
  const d = DB.items[it.id]; const c = it.contrat ? S.contrats.find((x) => x.id === it.contrat) : null;
  const risques = risquesPosition(it);
  const autres = S.cale.includes(it) ? cales().filter((x) => x.id !== it.cale) : [];
  el.innerHTML = "<div style='display:flex;gap:10px;align-items:center;border-top:1px dashed var(--parchemin2);padding-top:8px'><div class='article' style='margin:0;padding:0;border:0;box-shadow:none;background:none'><div class='ai' style='background:" + d.couleur + "'>" + d.icone + "</div></div><div style='flex:1;min-width:0'><div class='nom' style='font-size:15px'>" + esc(d.nom) + "</div><div class='sous'>" + dims(it).w + "×" + dims(it).h + " · " + d.poids + " kg · valeur " + d.prix + " 💰" + (it.cale && S.cale.includes(it) ? " · " + esc(caleDe(it).nom) : "") + "</div>" + jauge(it.etat) + "</div><b style='font-size:15px'>" + arr(it.etat) + " %</b></div>" +
    "<div style='margin:6px 0'>" + contraintesTags(d, it) + (c ? "<span class='tag or'>📜 " + esc(c.titre) + "</span>" : "") + "</div>" +
    (risques.length ? "<div class='effets'>" + risques.map(([s, t]) => "<span class='effet " + s + "'>" + t + "</span>").join("") + "</div>" : "") +
    "<div class='actions'><button id='bPivot'>↻ Pivoter</button>" +
    autres.map((x) => "<button data-vers='" + x.id + "'>⇄ " + esc(nomSalle(x)) + "</button>").join("") +
    (S.ile && S.cale.includes(it) ? "<button id='bQuai'>⬇ Sur le quai</button>" : "") +
    (S.ile && !S.cale.includes(it) ? "<button class='primaire' id='bAuto'>⬆ Ranger</button>" : "") +
    (S.ile && ileAct().marche && !it.contrat ? "<button class='or' id='bVendre'>Vendre " + prixVente(S.ile, it) + " 💰</button>" : "") +
    (!S.ile ? "<button id='bJeter'>🌊 Jeter à la mer</button>" : "") + "</div>";
  const on = (id, f) => { const b = $("#" + id); if (b) b.onclick = f; };
  on("bPivot", () => pivoter(it));
  on("bQuai", () => { versQuai(it); rendreTout(); sauver(); });
  on("bAuto", () => { if (!placerAuto(it, salleSel && salleDef(salleSel).cale ? salleSel : null) && !placerAuto(it)) toast("Pas de place dans les cales."); else vibrer(10); rendreTout(); sauver(); animerItem(it.uid, "pose"); });
  el.querySelectorAll("[data-vers]").forEach((b) => b.onclick = () => changerDeCale(it, b.dataset.vers));
  on("bVendre", () => vendre(it));
  on("bJeter", async () => { const r = await modale({ titre: "Jeter à la mer ?", icone: "🌊", theme: "mer", html: "<p>" + esc(d.nom) + " sera perdu définitivement.</p>", boutons: [{ t: "Jeter", primaire: true }, { t: "Annuler" }] }); if (r === 0) { retirer(it); rendreTout(); sauver(); } });
}
function changerDeCale(it, caleId) {
  const k = caleDef(caleId);
  if (k.accepte && !k.accepte.includes(it.id)) { toast(k.nom + " n'accepte pas cet item."); return false; }
  if (!placerAuto(it, caleId)) { toast("Pas de place dans " + k.nom + "."); return false; }
  salleSel = caleId; vibrer(12); toast(DB.items[it.id].nom + " → " + k.nom); rendreTout(); sauver(); animerItem(it.uid, "pose"); return true;
}
function animerItem(uidItem, classe) { const el = document.querySelector("#p-cale .item[data-uid='" + uidItem + "']"); if (el) { el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe); } }
function pivoter(it) {
  if (!S.cale.includes(it)) { it.rot = !it.rot; rendreCale(); animerItem(it.uid, "pose"); return; }
  if (peutPlacer(it, it.cale, it.x, it.y, !it.rot)) { it.rot = !it.rot; appliquerGravite(); rendreTout(); sauver(); animerItem(it.uid, "pose"); vibrer(10); }
  else { const r = raisonPlacement(it, it.cale, it.x, it.y, !it.rot); toast(r === "appui" ? "Une fois pivoté, il n'aurait plus d'appui." : "Pas la place de le pivoter ici."); animerItem(it.uid, "refus"); }
}

/* ---------- Glisser-déposer de la marchandise (souris et tactile) ---------- */
function salleSous(x, y) { const el = document.elementFromPoint(x, y); return el ? el.closest(".coupe .salle") : null; }
function debutGlisse(ev) {
  if (glisse) { // un 2e doigt pendant le glisser : pivoter
    if (glisse.bouge) { glisse.it.rot = !glisse.it.rot; majFantome(); vibrer(10); }
    return;
  }
  const el = ev.currentTarget; const it = tousItems().find((x) => x.uid === el.dataset.uid); if (!it) return;
  ev.preventDefault();
  const r = el.getBoundingClientRect();
  glisse = { it, el, id: ev.pointerId, rot0: it.rot, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, fx: (ev.clientX - r.left) / r.width, fy: (ev.clientY - r.top) / r.height, bouge: false, fantome: null, apercu: null, cible: null, versCale: null };
  window.addEventListener("pointermove", pendantGlisse); window.addEventListener("pointerup", finGlisse); window.addEventListener("pointercancel", finGlisse);
  window.addEventListener("pointerdown", secondDoigt, true);
}
function secondDoigt(ev) { if (glisse && ev.pointerId !== glisse.id && glisse.bouge) { ev.preventDefault(); ev.stopPropagation(); glisse.it.rot = !glisse.it.rot; majFantome(); vibrer(10); } }
function majFantome() {
  const g = glisse; if (!g || !g.fantome) return; const grille = $("#grille"); const cs = tailleCase(caleDef(grille ? grille.dataset.cale : calePrincipale())); const dm = dims(g.it);
  g.fantome.style.width = (dm.w * cs - 4) + "px"; g.fantome.style.height = (dm.h * cs - 4) + "px";
  pendantGlisse({ clientX: g.x, clientY: g.y, pointerId: g.id });
}
function pendantGlisse(ev) {
  const g = glisse; if (!g || ev.pointerId !== g.id) return;
  g.x = ev.clientX; g.y = ev.clientY;
  if (!g.bouge && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) < 6) return;
  const grille = $("#grille"); if (!grille) return;
  const caleId = grille.dataset.cale; const k = caleDef(caleId); const cs = tailleCase(k); const dm = dims(g.it); const d = DB.items[g.it.id];
  if (!g.bouge) {
    g.bouge = true; g.fantome = g.el.cloneNode(true); g.fantome.classList.add("fantome"); g.fantome.classList.remove("sel", "risque");
    g.fantome.style.width = (dm.w * cs - 4) + "px"; g.fantome.style.height = (dm.h * cs - 4) + "px"; g.fantome.style.left = "0"; g.fantome.style.top = "0"; g.fantome.style.margin = "0";
    document.body.appendChild(g.fantome); g.el.style.opacity = "0.25";
    grille.classList.toggle("g-eau", !!d.craintEau); grille.classList.toggle("g-peris", !!d.perissable); grille.classList.toggle("g-cache", estContrebandeQuelquePart(d.id));
    vibrer(8);
  }
  const w = dm.w * cs, h = dm.h * cs; const ox = g.fx * w, oy = g.fy * h;
  g.fantome.style.transform = "translate(" + (ev.clientX - ox) + "px," + (ev.clientY - oy) + "px) scale(1.06)";
  const gr = grille.getBoundingClientRect();
  const gx = Math.round((ev.clientX - ox - gr.left) / cs); const gy = Math.round((ev.clientY - oy - gr.top) / cs);
  const dedans = ev.clientX >= gr.left - cs && ev.clientX <= gr.right + cs && ev.clientY >= gr.top - cs && ev.clientY <= gr.bottom + cs;
  if (!g.apercu) { g.apercu = document.createElement("div"); g.apercu.className = "apercu"; grille.appendChild(g.apercu); }
  if (dedans) {
    const raison = raisonPlacement(g.it, caleId, gx, gy, g.it.rot); const ok = !raison;
    let classe = ok ? "ok" : "non";
    g.apercu.innerHTML = raison === "appui" ? "<span>⬇ sans appui</span>" : raison === "type" ? "<span>refusé dans cette cale</span>" : "";
    if (ok) { const t = Object.assign({}, g.it, { cale: caleId, x: gx, y: gy }); if ((d.craintEau && auFond(t)) || (d.fragile && poidsAuDessus(t) > C.cale.poidsFragile)) classe = "risque"; }
    g.apercu.className = "apercu " + classe; g.apercu.style.display = "block";
    g.apercu.style.left = gx * cs + "px"; g.apercu.style.top = gy * cs + "px"; g.apercu.style.width = w + "px"; g.apercu.style.height = h + "px";
    if (ok && (!g.cible || g.cible.x !== gx || g.cible.y !== gy)) vibrer(4);
    g.cible = ok ? { x: gx, y: gy } : null;
  } else { g.apercu.style.display = "none"; g.cible = null; }
  // Vers une autre cale de la vue en coupe
  document.querySelectorAll(".coupe .salle.cible").forEach((x) => x.classList.remove("cible"));
  const sal = dedans ? null : salleSous(ev.clientX, ev.clientY);
  g.versCale = sal && sal.classList.contains("est-cale") && sal.dataset.salle !== caleId ? sal.dataset.salle : null;
  if (g.versCale) sal.classList.add("cible");
  const quai = $("#quai"); g.surQuai = false;
  if (quai) { const q = quai.parentElement.getBoundingClientRect(); g.surQuai = ev.clientX >= q.left && ev.clientX <= q.right && ev.clientY >= q.top && ev.clientY <= q.bottom; }
}
function finGlisse(ev) {
  const g = glisse; if (!g || (ev && ev.pointerId !== undefined && ev.pointerId !== g.id)) return;
  glisse = null;
  window.removeEventListener("pointermove", pendantGlisse); window.removeEventListener("pointerup", finGlisse); window.removeEventListener("pointercancel", finGlisse);
  window.removeEventListener("pointerdown", secondDoigt, true);
  if (g.fantome) g.fantome.remove();
  if (!g.bouge) {
    const t = Date.now();
    if (dernierTap.uid === g.it.uid && t - dernierTap.t < 320) { dernierTap = { uid: null, t: 0 }; selection = g.it.uid; pivoter(g.it); return; }
    dernierTap = { uid: g.it.uid, t }; selection = g.it.uid; rendreCale(); return;
  }
  const grille = $("#grille"); const caleId = grille ? grille.dataset.cale : calePrincipale();
  let resultat = "refus";
  if (g.cible) {
    S.cale = S.cale.filter((c) => c !== g.it); g.it.cale = caleId; g.it.x = g.cible.x; g.it.y = g.cible.y; S.quai = S.quai.filter((q) => q.uid !== g.it.uid); S.cale.push(g.it); resultat = "pose"; vibrer(12);
    appliquerGravite();
  } else if (g.versCale) { g.it.rot = g.rot0; selection = g.it.uid; if (changerDeCale(g.it, g.versCale)) return; }
  else if (g.surQuai && S.ile) { versQuai(g.it); resultat = "pose"; }
  else g.it.rot = g.rot0;
  selection = g.it.uid; rendreTout(); sauver(); animerItem(g.it.uid, resultat);
}
window.addEventListener("keydown", (e) => {
  if ((e.key === "r" || e.key === "R") && !modaleOuverte && !(e.target && e.target.tagName === "INPUT")) {
    if (glisse && glisse.bouge) { glisse.it.rot = !glisse.it.rot; majFantome(); return; }
    if (selection) { const it = tousItems().find((x) => x.uid === selection); if (it) pivoter(it); }
  }
});

/* ---------- Glisser-déposer des marins entre les salles ---------- */
let glisseMarin = null;
function debutGlisseMarin(ev) {
  const el = ev.currentTarget; const m = S.equipage.find((x) => x.id === el.dataset.marin); if (!m || glisseMarin) return;
  ev.preventDefault(); ev.stopPropagation();
  glisseMarin = { m, el, id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, bouge: false, fantome: null, cible: null };
  window.addEventListener("pointermove", pendantGlisseMarin); window.addEventListener("pointerup", finGlisseMarin); window.addEventListener("pointercancel", finGlisseMarin);
}
function pendantGlisseMarin(ev) {
  const g = glisseMarin; if (!g || ev.pointerId !== g.id) return;
  if (!g.bouge && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) < 6) return;
  if (!g.bouge) {
    g.bouge = true; g.fantome = document.createElement("div"); g.fantome.className = "mp-fantome"; g.fantome.innerHTML = portraitSvg(g.m.portrait, 44);
    document.body.appendChild(g.fantome); g.el.style.opacity = "0.3"; vibrer(8);
    document.querySelectorAll(".coupe .salle").forEach((x) => { const s = salleDef(x.dataset.salle); if (s.places > 0 && apportDans(g.m, s.id) > 0) x.classList.add("utile"); });
  }
  g.fantome.style.transform = "translate(" + (ev.clientX - 24) + "px," + (ev.clientY - 24) + "px)";
  document.querySelectorAll(".coupe .salle.cible, .coupe .salle.cible-non").forEach((x) => x.classList.remove("cible", "cible-non"));
  const sal = salleSous(ev.clientX, ev.clientY); g.cible = null;
  if (sal) { const s = salleDef(sal.dataset.salle); if (s.places > 0) { sal.classList.add("cible"); g.cible = s.id; } else sal.classList.add("cible-non"); }
}
function finGlisseMarin(ev) {
  const g = glisseMarin; if (!g || (ev && ev.pointerId !== undefined && ev.pointerId !== g.id)) return;
  glisseMarin = null;
  window.removeEventListener("pointermove", pendantGlisseMarin); window.removeEventListener("pointerup", finGlisseMarin); window.removeEventListener("pointercancel", finGlisseMarin);
  if (g.fantome) g.fantome.remove();
  if (!g.bouge) { salleSel = g.m.salle; rendreCale(); return; }
  if (g.cible && g.cible !== g.m.salle) {
    const avant = occupants(g.cible).length >= salleDef(g.cible).places;
    if (deplacerMarin(g.m, g.cible)) { vibrer(12); toast(g.m.nom.split(" ")[0] + " → " + nomSalle(salleDef(g.cible)) + (avant ? " (échange)" : "")); salleSel = g.cible; sauver(); }
  }
  rendreTout();
}

/* ---------- Panneau Carte ---------- */
function navireCarte() { return "<g id='navCarte'><circle r='3.2' fill='#ffe08a' opacity='.35' class='pulse'/><g id='navCarteSens'><path d='M-2.6 0.4 L2.6 0.4 L2 1.6 L-2 1.6Z' fill='#5a3a1e' stroke='#2e1c0e' stroke-width='.2'/><path d='M0 0.4 V-3.4' stroke='#2e1c0e' stroke-width='.3'/><path d='M0.2 -3.2 Q2.2 -1.4 0.2 0.1Z' fill='#fbf1d8'/><path d='M-0.2 -2.8 Q-1.8 -1.3 -0.2 0.1Z' fill='#efe2c0'/></g></g>"; }
function rendreCarte() {
  const p = $("#p-carte");
  let svg = "<svg id='carteSvg' viewBox='0 0 100 140' xmlns='http://www.w3.org/2000/svg'>";
  svg += "<defs><pattern id='vagues' width='8' height='6' patternUnits='userSpaceOnUse'><path d='M0 3 Q2 1 4 3 T8 3' fill='none' stroke='#79a9bd' stroke-width='0.3' opacity='.6'/><animateTransform attributeName='patternTransform' type='translate' from='0 0' to='8 0' dur='4s' repeatCount='indefinite'/></pattern>" +
    "<radialGradient id='mer' cx='50%' cy='45%' r='75%'><stop offset='0' stop-color='#4f87a0'/><stop offset='1' stop-color='#2d5a70'/></radialGradient>" +
    "<mask id='masque'><rect width='100' height='140' fill='white'/><g id='trous'>" + S.brouillard.map(([x, y, r]) => "<circle cx='" + x + "' cy='" + y + "' r='" + r + "' fill='black'/>").join("") + "</g></mask>" +
    "<filter id='flou'><feGaussianBlur stdDeviation='2.2'/></filter></defs>";
  svg += "<rect width='100' height='140' fill='url(#mer)'/><rect width='100' height='140' fill='url(#vagues)'/>";
  // Rose des vents
  svg += "<g class='rose' transform='translate(88 12)'><circle r='6' fill='none' stroke='#f3e6c4' stroke-width='.3'/><path d='M0 -6 L1 0 L0 6 L-1 0Z M-6 0 L0 1 L6 0 L0 -1Z' fill='#f3e6c4'/><text y='-7' font-size='2.6' text-anchor='middle' fill='#f3e6c4'>N</text></g>";
  // Routes
  if (!S.voyage) S.connues.forEach((id) => { if (id === S.ile) return; const i = DB.iles[id]; const sel = destination && destination.ile === id; svg += "<line x1='" + S.pos.x + "' y1='" + S.pos.y + "' x2='" + i.x + "' y2='" + i.y + "' stroke='" + (sel ? "#ffe08a" : "#f3e6c4") + "' stroke-width='" + (sel ? 0.8 : 0.3) + "' stroke-dasharray='1.5 1.2' opacity='" + (sel ? 1 : 0.45) + "'>" + (sel ? "<animate attributeName='stroke-dashoffset' from='5.4' to='0' dur='1s' repeatCount='indefinite'/>" : "") + "</line>"; });
  if (S.voyage) svg += "<line x1='" + S.voyage.de.x + "' y1='" + S.voyage.de.y + "' x2='" + S.voyage.vers.x + "' y2='" + S.voyage.vers.y + "' stroke='#ffe08a' stroke-width='0.7' stroke-dasharray='1.5 1.2'><animate attributeName='stroke-dashoffset' from='5.4' to='0' dur='1s' repeatCount='indefinite'/></line>";
  if (destination && !destination.ile) svg += "<line x1='" + S.pos.x + "' y1='" + S.pos.y + "' x2='" + destination.x + "' y2='" + destination.y + "' stroke='#ffe08a' stroke-width='0.8' stroke-dasharray='1.5 1.2'><animate attributeName='stroke-dashoffset' from='5.4' to='0' dur='1s' repeatCount='indefinite'/></line><text x='" + destination.x + "' y='" + (destination.y + 1.5) + "' font-size='5' text-anchor='middle' fill='#b23a2e' font-weight='bold'>✕</text>";
  // Îles connues
  C.iles.filter((i) => S.connues.includes(i.id)).forEach((i) => {
    const r = 3 + (i.services.length > 3 ? 2 : i.services.length > 1 ? 1 : 0); const sel = destination && destination.ile === i.id; const ici = S.ile === i.id;
    svg += "<g data-ile='" + i.id + "' style='cursor:pointer'>" + (sel ? "<circle cx='" + i.x + "' cy='" + i.y + "' r='" + (r + 2) + "' fill='none' stroke='#ffe08a' stroke-width='.6' class='pulse'/>" : "") +
      "<ellipse cx='" + i.x + "' cy='" + (i.y + 0.4) + "' rx='" + (r + 1.8) + "' ry='" + (r + 1.1) + "' fill='#e9d9a6' opacity='.6'/><path d='M" + (i.x - r) + " " + i.y + " Q" + (i.x - r * 0.6) + " " + (i.y - r) + " " + i.x + " " + (i.y - r * 0.8) + " Q" + (i.x + r * 0.8) + " " + (i.y - r * 1.05) + " " + (i.x + r) + " " + i.y + " Q" + i.x + " " + (i.y + r * 0.8) + " " + (i.x - r) + " " + i.y + "Z' fill='" + (i.faction === "aucune" ? "#7a8b4a" : "#6f9a4f") + "' stroke='#3e5a2a' stroke-width='.4'/>" +
      "<circle cx='" + (i.x + r * 0.7) + "' cy='" + (i.y - r * 0.8) + "' r='1.1' fill='" + DB.factions[i.faction].couleur + "' stroke='#fff' stroke-width='.3'/>" +
      "<text x='" + i.x + "' y='" + (i.y + r + 4) + "' font-size='3.4' text-anchor='middle' fill='" + (ici ? "#ffe08a" : "#fff8e6") + "' stroke='#2a1e12' stroke-width='.7' paint-order='stroke' font-family='IM Fell English SC, serif'>" + esc(i.nom) + "</text>" +
      (S.contrats.some((c) => c.destination === i.id) ? "<text x='" + (i.x - r - 1.5) + "' y='" + (i.y - r * 0.4) + "' font-size='3.2'>📜</text>" : "") +
      "<circle cx='" + i.x + "' cy='" + i.y + "' r='" + (r + 4) + "' fill='transparent'/></g>";
  });
  // Brouillard de guerre
  svg += "<g mask='url(#masque)' pointer-events='none' opacity='.88'><rect width='100' height='140' fill='#e9d8ae'/><rect width='100' height='140' fill='#cdb27a' opacity='.35' filter='url(#flou)'/><text x='50' y='72' font-size='5' text-anchor='middle' fill='#a48a5a' font-family='IM Fell English SC, serif' opacity='.8'>Terra incognita</text></g>";
  svg += "<rect id='nuitCarte' width='100' height='140' fill='#0a1430' opacity='0' pointer-events='none'/>";
  // Étiquette de durée sur la route choisie
  if (destination && !S.voyage) { const cible = destination.ile ? DB.iles[destination.ile] : destination; const mx = (S.pos.x + cible.x) / 2, my = (S.pos.y + cible.y) / 2; const txt = joursTrajet(S.pos, cible).toFixed(1) + " j"; svg += "<g pointer-events='none'><rect x='" + (mx - 5) + "' y='" + (my - 2.6) + "' width='10' height='4.4' rx='2' fill='#2a1e12' opacity='.85'/><text x='" + mx + "' y='" + (my + 0.8) + "' font-size='2.8' text-anchor='middle' fill='#ffe08a' font-weight='bold'>" + txt + "</text></g>"; }
  svg += "<g pointer-events='none'>" + navireCarte() + "</g>";
  svg += "<text x='4' y='136' font-size='3' fill='#fff8e6' opacity='.85' font-family='IM Fell English SC, serif'>Les Hauts-Fonds de Sel</text></svg>";
  p.innerHTML = "<h2>Carte</h2><div class='carte-cadre'>" + svg + "</div><div id='infoDest' class='bloc'>" + infoDestination() + "</div>";
  carteRendue = { brouillard: S.brouillard.length, connues: S.connues.length };
  const el = $("#carteSvg");
  el.addEventListener("click", (ev) => {
    if (S.voyage) return;
    const g = ev.target.closest("[data-ile]");
    if (g) destination = g.dataset.ile === S.ile ? null : { ile: g.dataset.ile };
    else { const pt = el.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const q = pt.matrixTransform(el.getScreenCTM().inverse()); destination = { x: clamp(q.x, 2, 98), y: clamp(q.y, 2, 138) }; }
    vibrer(6); rendreCarte(); rendreCale();
  });
  lierInfo(); majCarteVoyage();
}
function infoDestination() {
  if (S.voyage) return "<div class='nom'>⛵ En route vers " + esc(S.voyage.vers.ile ? DB.iles[S.voyage.vers.ile].nom : "des eaux inconnues") + "</div><div class='vitesses'><button data-v='p'>⏸</button>" + C.temps.vitesses.map((x, k) => "<button data-v='" + k + "'>x" + x + "</button>").join("") + "</div><button class='btnInterrompre' data-interrompre='1'>🧭 Interrompre la navigation…</button>";
  if (!destination) return "<span class='muted'>👆 Touchez une île pour préparer un trajet, ou touchez la mer et le brouillard pour partir explorer.</span>";
  const cible = destination.ile ? DB.iles[destination.ile] : destination; const j = joursTrajet(S.pos, cible);
  const danger = (dangerPoint({ ile: S.ile }) + dangerPoint(destination)) / 2; let h = "";
  if (destination.ile) {
    const i = DB.iles[destination.ile]; const f = DB.factions[i.faction]; const rep = S.reputation.iles[i.id] || 0;
    const contr = S.contrats.filter((c) => c.destination === i.id).length; const illegaux = tousItems().filter((it) => estInterdit(it.id, i.id));
    h += "<div class='nom titre' style='font-size:22px;color:var(--bois)'>" + esc(i.nom) + "</div><div style='margin:4px 0'><span class='tag' style='background:" + f.couleur + ";color:#fff'>" + esc(f.nom) + "</span><span class='tag'>" + (i.climat === "tropical" ? "🌴 Tropical" : "🌿 Tempéré") + "</span><span class='tag'>👁️ " + niveau(i.surveillance) + "</span><span class='tag " + (rep < 0 ? "rouge" : "vert") + "'>⭐ " + repTexte(rep) + "</span>" + (contr ? "<span class='tag or'>📜 " + contr + " livraison(s)</span>" : "") + "</div>";
    if (i.description) h += "<div class='desc-ile'>" + esc(i.description) + "</div>";
    if (i.interdits.length) h += "<div class='muted'>Contrebande ici : " + i.interdits.map((x) => DB.items[x].icone + " " + esc(DB.items[x].nom)).join(", ") + "</div>";
    if (illegaux.length) h += "<div style='margin-top:4px'><span class='tag rouge'>⚠️ " + illegaux.length + " item(s) interdit(s) à bord</span></div>";
  } else h += "<div class='nom titre' style='font-size:22px;color:var(--bois)'>🧭 Exploration</div><div class='muted'>Eaux inconnues : on y découvre des îles, mais le danger y est plus grand.</div>";
  const vj = joursDeVivres();
  const na = noteArrimage();
  h += "<div class='puces' style='margin:10px 0'><div class='puce'>⏳ Durée<b>" + j.toFixed(1) + " j</b></div><div class='puce'>☠️ Danger<b>" + niveau(danger) + "</b></div><div class='puce'>🍞 Vivres<b style='color:" + (vj < j + 1 ? "var(--danger)" : "inherit") + "'>" + (vj >= 99 ? "—" : vj.toFixed(1) + " j") + "</b></div></div>";
  h += "<div class='muted' style='margin-bottom:8px'>📋 Note d'arrimage : <b class='note note-" + na.lettre + "'>" + na.lettre + "</b>" + (na.details.length ? " · " + esc(na.details.join(", ")) : " · cale bien rangée") + "</div>";
  if (S.quai.length) h += "<div class='muted' style='margin-bottom:6px'>📦 " + S.quai.length + " item(s) encore sur le quai.</div>";
  return h + "<button class='primaire' id='bPartir' style='width:100%;min-height:50px;font-size:16px'>⛵ Lever l'ancre</button>";
}
function lierInfo() {
  const bp = $("#bPartir"); if (bp) bp.onclick = demanderDepart;
  document.querySelectorAll("#infoDest [data-v]").forEach((b) => b.onclick = () => regler(b.dataset.v));
  document.querySelectorAll("#infoDest [data-interrompre]").forEach((b) => b.onclick = interrompreNavigation);
}
function majCarteVoyage() {
  const nav = $("#navCarte"); if (!nav) return;
  if (S.connues.length !== carteRendue.connues) { rendreCarte(); return; }
  const trous = $("#trous");
  if (trous && S.brouillard.length > carteRendue.brouillard) {
    S.brouillard.slice(carteRendue.brouillard).forEach(([x, y, r]) => { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r); c.setAttribute("fill", "black"); trous.appendChild(c); });
    carteRendue.brouillard = S.brouillard.length;
  }
  let sens = 1; if (S.voyage) sens = S.voyage.vers.x < S.voyage.de.x ? -1 : 1; else if (destination) sens = (destination.ile ? DB.iles[destination.ile].x : destination.x) < S.pos.x ? -1 : 1;
  nav.setAttribute("transform", "translate(" + S.pos.x + " " + S.pos.y + ")");
  $("#navCarteSens").setAttribute("transform", "scale(" + sens + " 1) rotate(" + (S.voyage && !enPause ? Math.sin(Date.now() / 500) * 6 : 0) + ")");
  $("#nuitCarte").setAttribute("opacity", estNuit() ? 0.28 : 0);
  document.querySelectorAll("#infoDest .vitesses button").forEach((b) => b.classList.toggle("actif", b.dataset.v === "p" ? enPause : !enPause && +b.dataset.v === vitesseIdx));
}

/* ---------- Onglet Quêtes ---------- */
let ongletQuetes = "quetes";
function barreRep(v) { const x = (v + 100) / 2; return "<div class='barre-rep'><i style='left:" + x + "%'></i>" + C.paliersReputation.map((p) => "<b style='left:" + (p.min + 100) / 2 + "%'></b>").join("") + "</div>"; }
function tagPalier(v) { const p = palierDe(v); return "<span class='tag' style='background:" + p.couleur + ";color:#fff'>⭐ " + esc(p.nom) + "</span>"; }
function etapeFaite(e) { return e.quete ? S.quetesFaites.includes(e.quete) : (S.stats[e.stat] || 0) >= (e.valeur || 1); }
function texteEtape(e) {
  if (!e.quete) return { titre: e.texte, ou: "" };
  const q = DB.quetes[e.quete]; const enCours = S.contrats.find((c) => c.id === q.id);
  let ou = "";
  if (enCours) ou = "En cours : livrer à " + DB.iles[q.destination].nom;
  else if (!prerequisOk(q)) ou = "🔒 Après l'étape précédente";
  else ou = S.connues.includes(q.origine) ? "Proposée à " + DB.iles[q.origine].nom : "Proposée sur une île encore inconnue";
  return { titre: q.titre, ou };
}
function rendreQuetes() {
  const p = $("#p-quetes"); if (!p) return;
  const segs = [["contrats", "Contrats", S.contrats.length], ["quetes", "Quêtes", 0], ["legendes", "Légendes", S.legendesNonVues || 0], ["jalons", "Jalons", S.jalonsNonVus || 0], ["reputation", "Réputation", 0]];
  let h = "<h2>Quêtes" + (estPC() ? " <button class='btnMini' style='float:right' data-fermer-quetes='1' aria-label='Fermer'>✕</button>" : "") + "</h2>";
  h += "<div class='segment cinq'>" + segs.map(([id, t, n]) => "<button data-segq='" + id + "' class='" + (ongletQuetes === id ? "actif" : "") + "'>" + t + (n ? " <small class='compte'>" + n + "</small>" : "") + "</button>").join("") + "</div>";
  if (ongletQuetes === "contrats") {
    h += S.contrats.length ? S.contrats.map(contratEnCours).join("") : "<div class='bloc muted'>Aucun contrat en cours. Les capitaineries des ports en proposent à chaque escale.</div>";
    if (S.ile && offresIci().length) h += "<button class='primaire' data-a='capitainerie' style='width:100%'>📜 Voir les offres de " + esc(DB.iles[S.ile].nom) + "</button>";
  }
  if (ongletQuetes === "quetes") {
    C.chaines.forEach((ch) => {
      const faites = ch.etapes.filter(etapeFaite).length; const fini = faites === ch.etapes.length;
      let premiereOuverte = true;
      h += "<div class='bloc chaine" + (fini ? " finie" : "") + "'><div class='d-tete'><div class='nom' style='font-size:15px'>" + (fini ? "✅ " : "🧭 ") + esc(ch.titre) + "</div><span class='muted'>" + faites + "/" + ch.etapes.length + "</span></div>" + jauge(faites, ch.etapes.length) + "<ol class='etapes'>";
      ch.etapes.forEach((e) => {
        const f = etapeFaite(e); const t = texteEtape(e); const cls = f ? "faite" : premiereOuverte ? "active" : "verrou"; if (!f) premiereOuverte = false;
        h += "<li class='" + cls + "'><b>" + esc(t.titre) + "</b>" + (!f && t.ou ? "<span class='sous'>" + esc(cls === "verrou" ? "🔒 À débloquer" : t.ou) + "</span>" : "") + "</li>";
      });
      h += "</ol></div>";
    });
    h += "<h3>👂 Rumeurs entendues</h3>";
    h += S.rumeurs.length ? S.rumeurs.map((r) => { const [s, t] = statutRumeur(r); return "<div class='article'><div class='ai' style='background:" + DB.items[r.item].couleur + "'>" + DB.items[r.item].icone + "</div><div class='ac'><div class='nom' style='font-size:13px'>" + esc(texteRumeur(r)) + "</div><div class='effets' style='margin-top:4px'><span class='effet " + s + "'>" + esc(t) + "</span></div></div></div>"; }).join("") : "<div class='bloc muted'>Payez un verre dans une taverne pour entendre les nouvelles des marchés.</div>";
  }
  if (ongletQuetes === "legendes") {
    S.legendesNonVues = 0;
    const n = S.legendes.length;
    h += "<div class='bloc'><div class='nom'>📖 " + n + " / " + C.legendes.length + " légendes</div>" + jauge(n, C.legendes.length) + "<div class='sous'>Les vieux marins des tavernes, les îles et la mer elle-même ont des histoires à raconter.</div></div>";
    C.categoriesLegendes.forEach((cat) => {
      const liste = C.legendes.filter((l) => l.categorie === cat.id);
      h += "<h3>" + cat.icone + " " + esc(cat.nom) + " <span class='muted' style='font-family:Inter;font-size:13px'>" + liste.filter((l) => S.legendes.includes(l.id)).length + "/" + liste.length + "</span></h3>";
      liste.forEach((l) => {
        if (S.legendes.includes(l.id)) h += "<details class='leg-entree'><summary>" + esc(l.titre) + "</summary><p>" + esc(l.texte) + "</p></details>";
        else {
          let indice = "Une histoire encore inconnue.";
          if (l.taverne) indice = S.connues.includes(l.taverne) ? "Se raconte à la taverne de " + DB.iles[l.taverne].nom + "." : "Se raconte dans une taverne que vous ne connaissez pas encore.";
          else if (l.ile) indice = S.connues.includes(l.ile) ? "À découvrir en accostant à " + DB.iles[l.ile].nom + "." : "À découvrir sur une île encore inconnue.";
          else if (l.page) indice = "Une page perdue : on dit que la Persévérance hante la Brume, la nuit.";
          else indice = "On la vit en mer, la nuit.";
          h += "<div class='leg-entree verrou'>🔒 <span>" + (l.page ? esc(l.titre) : "???") + "</span><div class='sous'>" + esc(indice) + "</div></div>";
        }
      });
    });
  }
  if (ongletQuetes === "jalons") {
    S.jalonsNonVus = 0;
    const faits = S.jalons.length;
    h += "<div class='bloc' style='display:flex;align-items:center;gap:10px'><div style='flex:1'><div class='nom'>🎖️ " + esc(S.titre || "Aucun titre") + "</div><div class='muted'>" + faits + " / " + C.jalons.length + " jalons</div>" + jauge(faits, C.jalons.length) + "</div><button data-a='personnaliser'>🎨 Personnaliser</button></div>";
    const tri = [...C.jalons].sort((a, b) => { const pa = progressionJalon(a), pb = progressionJalon(b); return (pa.fait - pb.fait) || (pb.v / pb.cible - pa.v / pa.cible); });
    tri.forEach((j) => {
      const pr = progressionJalon(j);
      h += "<div class='jalon" + (pr.fait ? " fait" : "") + "'><span class='j-ic'>" + (pr.fait ? "🏆" : "🔹") + "</span><div style='flex:1;min-width:0'><div class='nom'>" + esc(j.nom) + "</div><div class='sous'>" + esc(j.description) + "</div>" + (pr.fait ? "" : jauge(pr.v, pr.cible) + "<div class='sous'>" + (pr.cible > 1 ? arr(pr.v) + " / " + pr.cible : "Pas encore") + "</div>") + "<div class='effets' style='margin-top:4px'>" + texteRecompense(j.recompense || {}).map((t) => "<span class='effet" + (pr.fait ? " pos" : "") + "'>" + esc(t) + "</span>").join("") + "</div></div></div>";
    });
  }
  if (ongletQuetes === "reputation") {
    h += "<h3>🏝️ Îles</h3>";
    S.connues.forEach((id) => {
      const i = DB.iles[id]; const v = S.reputation.iles[id] || 0; const suiv = palierSuivant(v);
      h += "<div class='bloc'><div class='d-tete'><div class='nom'>" + esc(i.nom) + "</div>" + tagPalier(v) + "</div>" + barreRep(v) + "<div class='sous'>" + esc(palierDe(v).resume) + "</div>" + (suiv ? "<div class='sous'>➤ <b>" + esc(suiv.nom) + "</b> à " + suiv.min + " (encore " + Math.ceil(suiv.min - v) + ") : " + esc(suiv.resume) + "</div>" : "") + "</div>";
    });
    h += "<h3>⚑ Factions</h3>";
    C.factions.filter((f) => f.id !== "aucune").forEach((f) => {
      const v = S.reputation.factions[f.id] || 0; const r = rivale(f.id); const nm = niveauMefiance(f.id);
      const effets = C.factionsPaliers.filter((x) => x.faction === f.id);
      h += "<div class='bloc'><div class='d-tete'><div class='nom'><span class='pastille-f' style='background:" + f.couleur + "'></span>" + esc(f.nom) + "</div><b>" + (v >= 0 ? "+" : "") + arr(v) + "</b></div>" + barreRep(v) +
        (f.description ? "<div class='sous'>" + esc(f.description) + "</div>" : "") + (f.chef ? "<div class='sous'>👤 " + esc(f.chef.nom) + ", " + esc(f.chef.titre) + "</div>" : "") +
        "<div class='sous'>" + (r ? "Rivale : " + esc(DB.factions[r].nom) + " (perd " + pct(C.rivalites.taux) + " de vos gains ici)" : "") + "</div>" +
        "<div class='sous'>Méfiance : <span class='tag' style='background:" + nm.couleur + ";color:#fff'>" + esc(nm.nom) + " · " + arr(S.mefiance[f.id] || 0) + "</span></div>" +
        "<ul class='effets-f'>" + effets.map((x) => { const actif = x.seuil > 0 ? v >= x.seuil : v <= x.seuil; return "<li class='" + (actif ? (x.seuil > 0 ? "actif" : "malus") : "") + "'>" + (actif ? (x.seuil > 0 ? "✔ " : "⚠ ") : (x.seuil > 0 ? "🔒 " : "· ")) + "<b>" + (x.seuil > 0 ? "+" : "") + x.seuil + "</b> " + esc(x.texte) + "</li>"; }).join("") + "</ul></div>";
    });
    h += "<p class='muted'>La méfiance baisse de " + C.contrebande.mefianceBaisseParJour + " point par jour. Au-delà de " + C.mefiance.niveaux[2].min + ", les fouilles deviennent minutieuses ; au-delà de " + C.mefiance.niveaux[3].min + ", chaque arrivée dans ses ports est inspectée.</p>";
  }
  p.innerHTML = h;
  p.querySelectorAll("[data-segq]").forEach((b) => b.onclick = () => { ongletQuetes = b.dataset.segq; rendreQuetes(); rendreOnglets(); });
  p.querySelectorAll("[data-a='personnaliser']").forEach((b) => b.onclick = personnaliser);
  p.querySelectorAll("[data-a='capitainerie']").forEach((b) => b.onclick = () => { vuePort = "capitainerie"; rendrePort(); document.body.classList.remove("voirQuetes"); afficherPanneau("p-port"); });
  p.querySelectorAll("[data-fermer-quetes]").forEach((b) => b.onclick = () => document.body.classList.remove("voirQuetes"));
}
function objectifsHtml(i) {
  const v = S.reputation.iles[i.id] || 0; const suiv = palierSuivant(v);
  const cand = C.jalons.map((j) => [j, progressionJalon(j)]).filter(([, p]) => !p.fait && p.cible > 1).sort((a, b) => b[1].v / b[1].cible - a[1].v / a[1].cible);
  let h = "<div class='bloc objectifs'><div class='nom' style='margin-bottom:4px'>🎯 Objectifs</div>";
  if (suiv) h += "<div class='obj'><div class='d-tete'><span>⭐ <b>" + esc(suiv.nom) + "</b> à " + esc(i.nom) + "</span><span class='muted'>" + arr(Math.max(v, 0)) + " / " + suiv.min + "</span></div>" + jauge(Math.max(0, v - (palierDe(v).min > 0 ? palierDe(v).min : 0)), suiv.min - (palierDe(v).min > 0 ? palierDe(v).min : 0)) + "<div class='sous'>" + esc(suiv.resume) + "</div></div>";
  if (cand.length) { const [j, p] = cand[0]; h += "<div class='obj'><div class='d-tete'><span>🏆 <b>" + esc(j.nom) + "</b></span><span class='muted'>" + arr(p.v) + " / " + p.cible + "</span></div>" + jauge(p.v, p.cible) + "<div class='sous'>" + esc(j.description) + "</div></div>"; }
  return h + "<button class='btnMini' data-a='quetes' style='width:100%;margin-top:4px'>📜 Toutes les quêtes et jalons ›</button></div>";
}
async function personnaliser() {
  const coul = C.cosmetiques.couleurs.filter((c) => cosmetiqueDispo("couleurs", c.id)); const pav = C.cosmetiques.pavillons.filter((c) => cosmetiqueDispo("pavillons", c.id));
  const verrou = (t) => C.cosmetiques[t].length - C.cosmetiques[t].filter((c) => cosmetiqueDispo(t, c.id)).length;
  const html = () => "<p class='muted'>Les couleurs, pavillons et titres se gagnent avec les jalons.</p>" +
    "<div class='nom'>Couleur de la coque</div><div class='nuancier'>" + coul.map((c) => "<button class='nuance" + ((S.apparence.couleur || "modele") === c.id ? " choisi" : "") + "' data-couleur='" + c.id + "' title='" + esc(c.nom) + "' style='background:" + (c.couleur || navire().couleurCoque) + "'>" + (c.id === "modele" ? "✦" : "") + "</button>").join("") + "</div><div class='sous'>" + (verrou("couleurs") ? "🔒 " + verrou("couleurs") + " à débloquer" : "Toutes débloquées") + "</div>" +
    "<div class='nom' style='margin-top:10px'>Pavillon</div><div class='nuancier'>" + pav.map((p) => "<button class='nuance drapeau" + ((S.apparence.pavillon || "marchand") === p.id ? " choisi" : "") + "' data-pavillon='" + p.id + "' title='" + esc(p.nom) + "' style='background:linear-gradient(135deg," + p.couleurs[0] + " 50%," + p.couleurs[1] + " 50%)'></button>").join("") + "</div><div class='sous'>" + (verrou("pavillons") ? "🔒 " + verrou("pavillons") + " à débloquer" : "Tous débloqués") + "</div>" +
    "<div class='nom' style='margin-top:10px'>Titre du capitaine</div>" + (S.cosmetiques.titres.length ? "<div class='nuancier'>" + ["(aucun)"].concat(S.cosmetiques.titres).map((t) => "<button class='titre-btn" + ((S.titre || "(aucun)") === t ? " choisi" : "") + "' data-titre='" + esc(t) + "'>" + esc(t) + "</button>").join("") + "</div>" : "<div class='sous'>Aucun titre pour l'instant.</div>");
  const pr = modale({ titre: "Personnaliser le navire", icone: "🎨", theme: "tresor", html: html(), boutons: [{ t: "Terminé", primaire: true }] });
  const lier = () => {
    const m = $("#modale");
    m.querySelectorAll("[data-couleur]").forEach((b) => b.onclick = () => { S.apparence.couleur = b.dataset.couleur; maj(); });
    m.querySelectorAll("[data-pavillon]").forEach((b) => b.onclick = () => { S.apparence.pavillon = b.dataset.pavillon; maj(); });
    m.querySelectorAll("[data-titre]").forEach((b) => b.onclick = () => { S.titre = b.dataset.titre === "(aucun)" ? null : b.dataset.titre; maj(); });
  };
  const maj = () => { const corps = $("#modale .m-corps > div"); if (corps) corps.innerHTML = html(); lier(); vibrer(8); sauver(); rendreCale(); rendreEquipage(); rendreQuetes(); };
  lier(); await pr; rendreTout();
}

/* ---------- Panneau Équipage ---------- */
function portraitSvg(p, t) {
  t = t || 64; let s = "<svg width='" + t + "' height='" + t + "' viewBox='0 0 64 64' style='flex:none;border-radius:10px;border:2px solid var(--laiton)'>";
  s += "<rect width='64' height='64' fill='#d8c39a'/><circle cx='32' cy='30' r='30' fill='#e6d3a8'/><path d='M10 64 Q32 40 54 64Z' fill='#6b4528'/>";
  s += "<ellipse cx='32' cy='30' rx='14' ry='16' fill='" + p.peau + "'/>";
  s += "<path d='M18 26 Q20 10 32 11 Q44 10 46 26 Q40 18 32 19 Q24 18 18 26Z' fill='" + p.cheveux + "'/>";
  if (p.barbe) s += "<path d='M19 32 Q20 48 32 48 Q44 48 45 32 Q40 40 32 40 Q24 40 19 32Z' fill='" + p.cheveux + "'/>";
  s += "<circle cx='26' cy='29' r='1.8' fill='#1b1209'/><circle cx='38' cy='29' r='1.8' fill='#1b1209'/><path d='M27 38 Q32 41 37 38' stroke='#5a2e1a' stroke-width='1.4' fill='none'/>";
  if (p.chapeau === "tricorne") s += "<path d='M10 20 L32 6 L54 20 Q32 14 10 20Z' fill='#2a1e12'/><path d='M14 19 Q32 12 50 19' stroke='#c8a03a' stroke-width='1' fill='none'/>";
  if (p.chapeau === "bandana") s += "<path d='M17 22 Q32 8 47 22 Q32 17 17 22Z' fill='#b23a2e'/><path d='M46 21 L54 26 L50 18Z' fill='#b23a2e'/>";
  return s + "</svg>";
}
function rendreEquipage() {
  const p = $("#p-equipage"); const n = navire();
  let h = (S.titre ? "<div class='tag or' style='margin-bottom:6px'>🎖️ " + esc(S.titre) + "</div>" : "") + "<h2>Équipage <span class='muted' style='font-family:Inter;font-size:14px'>" + S.equipage.length + "/" + n.equipageMax + "</span>" + (estPC() ? " <button style='float:right;min-height:30px;padding:2px 10px' onclick=\"document.body.classList.remove('voirEquipage')\">✕</button>" : "") + "</h2>";
  h += "<div class='bloc'><div class='ligne'><div class='g'><div class='nom'>🤝 Cohésion</div>" + jauge(S.cohesion) + "</div><b>" + arr(S.cohesion) + "</b></div><div class='muted'>Vivres frais il y a " + S.joursSansFrais + " j" + (S.joursSansFrais > C.equipage.scorbutApresJours ? " — <b style='color:var(--danger)'>scorbut !</b>" : "") + "</div></div>";
  S.equipage.forEach((m) => {
    h += "<div class='bloc marin'>" + portraitSvg(m.portrait, 64) + "<div style='flex:1;min-width:0'><div class='nom' style='font-size:15px'>" + esc(m.nom) + "</div><div class='muted'>" + esc(DB.roles[m.role].nom) + (m.secondaire ? " · second : " + esc(DB.roles[m.secondaire].nom) : "") + " · " + m.salaire + " or/j</div>" +
      (m.traits.length ? "<div>" + m.traits.map((t) => "<span class='tag' title='" + esc(DB.traits[t].description) + "'>" + esc(DB.traits[t].nom) + "</span>").join("") + "</div>" : "") +
      "<button class='btnPoste' data-poste-marin='" + m.id + "'>📍 " + esc(salleDef(m.salle) ? nomSalle(salleDef(m.salle)) : "—") + " · " + STATUTS[statutMarin(m)] + " ›</button>" +
      "<div class='grille2' style='margin-top:4px'><div class='muted'>❤️ Santé " + arr(m.sante) + jauge(m.sante) + "</div><div class='muted'>🙂 Moral " + arr(m.moral) + jauge(m.moral) + "</div></div></div></div>";
  });
  const comps = [["navigation", "🧭"], ["arrimage", "📦"], ["charpente", "🔨"], ["cuisine", "🍲"], ["medecine", "⚕️"], ["defense", "💣"], ["vigie", "🔭"], ["commerce", "🤝"]];
  h += "<h3>Compétences</h3><div class='bloc grille2'>" + comps.map(([c, ic]) => { const v = competence(c); return "<div style='font-size:12.5px'>" + ic + " " + esc(nomCompetence(c)) + " <b style='float:right'>" + v.toFixed(2) + "</b>" + jauge(v, 1.5) + "</div>"; }).join("") + "</div>";
  h += "<p class='muted'>Une compétence ne compte que si le marin est dans la bonne salle : réorganisez l'équipage depuis l'onglet Bateau. Recrutez à la taverne quand le navire a de la place.</p>";
  p.innerHTML = h;
  p.querySelectorAll("[data-poste-marin]").forEach((b) => b.onclick = () => { const m = S.equipage.find((x) => x.id === b.dataset.posteMarin); if (m) { salleSel = m.salle; document.body.classList.remove("voirEquipage"); rendreCale(); afficherPanneau("p-cale"); } });
}

/* ---------- Fenêtre modale ---------- */
function modale({ titre, html, boutons, icone, theme, chips }) {
  return new Promise((resoudre) => {
    modaleOuverte = true;
    const eff = chips && chips.length ? "<div class='effets'>" + chips.map((t) => "<span class='effet " + signeLigne(t) + "'>" + t + "</span>").join("") + "</div>" : "";
    $("#modale").innerHTML = "<div class='m-tete " + (theme || "") + "'>" + (icone ? "<span class='m-ic'>" + icone + "</span>" : "") + "<h3>" + esc(titre) + "</h3></div><div class='m-corps'><div>" + (html || "") + "</div>" + eff + "<div class='boutons'>" +
      boutons.map((b, k) => "<button data-k='" + k + "' class='" + (b.primaire ? "primaire" : "") + "' " + (b.off ? "disabled" : "") + ">" + esc(b.t) + (b.sous ? "<small>" + esc(b.sous) + "</small>" : "") + (b.chance != null ? "<div class='chance'><i style='width:" + b.chance * 100 + "%;background:" + (b.chance < 0.4 ? "var(--danger)" : b.chance < 0.65 ? "var(--alerte)" : "var(--bon)") + "'></i></div>" : "") + "</button>").join("") + "</div></div>";
    $("#voile").classList.add("ouvert"); $("#modale").scrollTop = 0;
    $("#modale").querySelectorAll(".boutons button").forEach((b) => b.onclick = () => { $("#voile").classList.remove("ouvert"); modaleOuverte = false; vibrer(8); resoudre(+b.dataset.k); });
  });
}
let minuteurToast = null;
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("vu"); clearTimeout(minuteurToast); minuteurToast = setTimeout(() => el.classList.remove("vu"), 2400); }

async function menu() {
  const r = await modale({ titre: "Menu", icone: "☰", html: "<p class='muted'>Prototype 0.6 · an " + C.monde.annee + " du Fanal · la partie est sauvegardée automatiquement dans ce navigateur.</p>", boutons: [{ t: "Reprendre", primaire: true }, { t: "Comment jouer" }, { t: "Nouvelle partie" }] });
  if (r === 1) aide();
  if (r === 2) { const c = await modale({ titre: "Nouvelle partie ?", icone: "⚠️", theme: "echec", html: "<p>La partie en cours sera effacée.</p>", boutons: [{ t: "Recommencer", primaire: true }, { t: "Annuler" }] }); if (c === 0) { nouvellePartie(); destination = null; selection = null; enPause = true; vuePort = "accueil"; precedent = null; rendreTout(); afficherPanneau("p-port"); intro(); } }
}
function intro() {
  return modale({ titre: "Les Hauts-Fonds de Sel", icone: "🌫️", theme: "fantome", html: "<p>" + esc(C.monde.intro) + "</p>", boutons: [{ t: "Prendre la mer", primaire: true }] });
}
function aide() {
  return modale({ titre: "Comment jouer", icone: "🧭", theme: "mer", html: "<ul>" +
    "<li><b>⚓ Port</b> : chaque lieu a son rôle. Capitainerie pour les contrats, Marché pour acheter et vendre, Taverne pour les rumeurs et les recrues. Ce que vous recevez arrive sur le <b>quai</b>.</li>" +
    "<li><b>⛵ Bateau</b> : la vue en coupe montre les salles et l'équipage. Touchez une salle pour l'ouvrir. Glissez un portrait d'une salle à l'autre : une compétence ne compte que dans la bonne salle (navigation sur le pont, cuisine en coquerie…). Les boutons Conseillé, Tempête et Soins réorganisent tout d'un geste.</li><li><b>📦 Cales</b> : glissez les items du quai vers la grille, ou utilisez « Tout ranger ». Glissez un item sur une autre cale de la vue en coupe pour l'y déplacer. Pour pivoter : double-tap, un 2ᵉ doigt pendant le glisser, ou la touche R. Un <b>!</b> orange signale un item mal placé. Chaque item doit reposer sur le plancher ou sur un autre item : achetez des <b>planches</b> au marché pour créer des étagères et surélever la marchandise.</li>" +
    "<li><b>🗺️ Carte</b> : touchez une île pour y aller, ou la mer et le brouillard pour explorer.</li>" +
    "<li><b>⛵ En mer</b> : ⏸ x1 x2 x4 règlent le temps. L'équipage mange 1 ration par jour. Les événements mettent le jeu en pause.</li>" +
    "<li><b>📜 Quêtes</b> : suivez vos contrats, les chaînes de quêtes, les rumeurs, les jalons (qui débloquent couleurs, pavillons et titres) et votre réputation. Chaque palier de réputation sur une île apporte des avantages ; gagner la confiance d'une faction agace sa rivale.</li><li><b>🍺 Rumeurs</b> : à la taverne, un verre permet d'apprendre une pénurie ou une abondance à venir… parfois fausse.</li><li><b>⚠️ Contrebande</b> : très rentable là où elle est interdite, mais gare aux inspections et à la méfiance des factions.</li>" +
    "<li><b>📖 Légendes</b> : les vieux marins des tavernes, les îles et la mer racontent l'histoire de l'archipel. Certaines légendes mènent à des trésors. Retrouvez-les dans Quêtes › Légendes.</li>" +
    "<li><b>🌊 Naufrage</b> : un seul marin survit et repart sur une barque. Le coffre à terre est conservé.</li></ul>", boutons: [{ t: "À la mer !", primaire: true }] });
}

/* ---------- Boucle d'affichage ---------- */
let accScene = 0;
function boucleAffichage(dt) {
  if (S && S.voyage) { majCarteVoyage(); accScene += dt; if (accScene > 0.25) { accScene = 0; rendreHaut(); majVoyage(); } }
}

/* ---------- Démarrage ---------- */
function demarrer() {
  document.querySelectorAll("#onglets button").forEach((b) => b.onclick = () => afficherPanneau(b.dataset.p));
  const reprise = charger();
  if (!reprise) nouvellePartie(); else appliquerGravite(true); // anciennes sauvegardes : les items en l'air retombent sans dégât
  if (S.voyage) enPause = true;
  rendreTout(); afficherPanneau("p-port");
  let largeurPrec = window.innerWidth;
  window.addEventListener("resize", () => { if (glisse || Math.abs(window.innerWidth - largeurPrec) < 20) return; largeurPrec = window.innerWidth; rendreTout(); });
  requestAnimationFrame(boucle);
  if (!reprise) intro().then(aide);
  window.__jeu = { get S() { return S; }, DB, debloquerLegende, ecouterLegende, tirerEvenement, verifierJalons, changerRep, palierIle, noteArrimage, ecouterRumeur, genererOffres, progressionJalon, personnaliser, creerEvenementMarche, interrompreNavigation, jeterAncre, competence, competenceSalle, placementConseille, posteTempete, posteRepos, deplacerMarin, statutMarin, changerDeCale, desequilibre, stabilite, centreGravite, calePrincipale, cales, vitesseNavire, avancer, arriver, finDeJournee, lancerEvenement, naufrage, rendreTout, raisonPlacement, appliquerGravite, creerItem, retirer, placerAuto };
}
demarrer();
})();
