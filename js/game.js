/* =====================================================================
   PIRATES : SHIPPING LEGACY — MOTEUR DU PROTOTYPE 0.2
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
  evts: parId(C.evenements), quetes: parId(C.quetes)
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
    navire: { type: d.navire, coque: DB.navires[d.navire].coqueMax, amelios: [] },
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
    generation: 1
  };
  C.iles.forEach((i) => { S.reputation.iles[i.id] = 0; S.prixMod[i.id] = {}; });
  C.factions.forEach((f) => { S.reputation.factions[f.id] = 0; S.mefiance[f.id] = 0; });
  S.connues.forEach((id) => devoilerAutour(DB.iles[id].x, DB.iles[id].y));
  d.cargaison.forEach(([id, n]) => { for (let k = 0; k < n; k++) { const it = creerItem(id); if (!placerAuto(it)) S.quai.push(it); } });
  genererOffres(S.ile);
  journal("Nouvelle partie. Votre cotre est amarré à <b>" + esc(ileDep.nom) + "</b>.");
  sauver();
}

function creerMarin(id) {
  const m = DB.marins[id];
  return { id, nom: m.nom, role: m.role, secondaire: m.secondaire, traits: [...m.traits], sante: 100, moral: 70, salaire: m.salaire, portrait: m.portrait };
}
function creerItem(id, extra) {
  const d = DB.items[id];
  return Object.assign({ uid: uid(), id, x: -1, y: -1, rot: false, etat: 100, r: d.rations || 0, contrat: null }, extra || {});
}

function sauver() { try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }
function charger() {
  try { const t = localStorage.getItem(CLE_SAUVEGARDE); if (t) { const s = JSON.parse(t); if (s && s.version === 1) { S = s; return true; } } } catch (e) {}
  return false;
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

/* ---------------- Grille de cale ---------------- */
function dims(it) { const d = DB.items[it.id]; return it.rot ? { w: d.hauteur, h: d.largeur } : { w: d.largeur, h: d.hauteur }; }
function casesDe(it, x, y, rot) {
  const d = DB.items[it.id]; const w = rot ? d.hauteur : d.largeur; const h = rot ? d.largeur : d.hauteur;
  const r = []; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) r.push([x + i, y + j]); return r;
}
function occupation(ignorer) {
  const n = navire(); const g = Array.from({ length: n.rangees }, () => Array(n.colonnes).fill(null));
  S.cale.forEach((it) => { if (it.uid === ignorer) return; casesDe(it, it.x, it.y, it.rot).forEach(([x, y]) => { if (g[y] && x < n.colonnes) g[y][x] = it.uid; }); });
  return g;
}
function peutPlacer(it, x, y, rot, g) {
  const n = navire(); g = g || occupation(it.uid);
  return casesDe(it, x, y, rot).every(([cx, cy]) => cx >= 0 && cy >= 0 && cx < n.colonnes && cy < n.rangees && !g[cy][cx]);
}
function placerAuto(it) {
  const n = navire(); const d = DB.items[it.id]; const g = occupation(it.uid);
  // Les items qui craignent l'eau cherchent d'abord en haut, les autres d'abord en bas (stabilité).
  const rangees = [...Array(n.rangees).keys()]; if (!d.craintEau) rangees.reverse();
  for (const rot of [false, true]) for (const y of rangees) for (let x = 0; x < n.colonnes; x++) {
    if (peutPlacer(it, x, y, rot, g)) { it.x = x; it.y = y; it.rot = rot; S.quai = S.quai.filter((q) => q.uid !== it.uid); if (!S.cale.includes(it)) S.cale.push(it); return true; }
  }
  return false;
}
function versQuai(it) { S.cale = S.cale.filter((c) => c.uid !== it.uid); it.x = -1; it.y = -1; if (!S.quai.includes(it)) S.quai.push(it); }
function retirer(it) { S.cale = S.cale.filter((c) => c.uid !== it.uid); S.quai = S.quai.filter((c) => c.uid !== it.uid); if (selection === it.uid) selection = null; }
function dansCachette(it) {
  if (!aAmelio("cachette")) return false;
  const cs = navire().cachette.map((c) => c.join(","));
  return casesDe(it, it.x, it.y, it.rot).every((c) => cs.includes(c.join(",")));
}
function auFond(it) { const { h } = dims(it); return it.y + h - 1 >= navire().rangees - 1; }
function ventile(it) { const { w } = dims(it); for (let i = 0; i < w; i++) if (navire().colonnesVentilees.includes(it.x + i)) return true; return false; }
function poidsAuDessus(it) {
  const { w } = dims(it); const vus = new Set(); let p = 0; const g = occupation(it.uid);
  for (let i = 0; i < w; i++) for (let y = it.y - 1; y >= 0; y--) { const u = g[y][it.x + i]; if (u && !vus.has(u)) { vus.add(u); p += DB.items[S.cale.find((c) => c.uid === u).id].poids; } }
  return p;
}

/* ---------------- Statistiques ---------------- */
function charge() { return S.cale.reduce((s, it) => s + DB.items[it.id].poids, 0); }
function ratioCharge() { return charge() / navire().chargeMax; }
function stabilite() {
  const n = navire(); let p = 0, m = 0;
  S.cale.forEach((it) => { const w = DB.items[it.id].poids; const { h } = dims(it); p += w; m += w * (it.y + (h - 1) / 2); });
  if (!p) return 1; return clamp(0.2 + 0.8 * (m / p) / Math.max(1, n.rangees - 1), 0, 1);
}
function desequilibre() {
  const n = navire(); let p = 0, m = 0;
  S.cale.forEach((it) => { const w = DB.items[it.id].poids; const d = dims(it); p += w; m += w * (it.x + (d.w - 1) / 2); });
  if (!p) return 0; const c = (n.colonnes - 1) / 2; return ((m / p) - c) / c; // -1 = tout à la proue, +1 = tout à la poupe
}
function competence(c) {
  let v = 0;
  S.equipage.forEach((m) => {
    const forme = 0.5 + 0.5 * Math.min(m.sante, m.moral) / 100;
    if (DB.roles[m.role].competence === c) v += forme;
    else if (m.secondaire && DB.roles[m.secondaire].competence === c) v += C.roles.efficaciteSecondaire * forme;
  });
  if (c === "defense") v += navire().canons * 0.12;
  return v;
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

/* ---------------- Réputation ---------------- */
function changerRep(ileId, v) {
  if (!ileId) return; const i = DB.iles[ileId];
  S.reputation.iles[ileId] = clamp((S.reputation.iles[ileId] || 0) + v, -100, 100);
  S.reputation.factions[i.faction] = clamp((S.reputation.factions[i.faction] || 0) + v * C.reputation.partageFaction, -100, 100);
}
const repTexte = (v) => (v >= 50 ? "Héros" : v >= 20 ? "Estimé" : v >= 5 ? "Connu" : v > -5 ? "Neutre" : v > -20 ? "Méfiant" : "Hostile");

/* ---------------- Commerce ---------------- */
function estInterdit(itemId, ileId) { return !!ileId && DB.iles[ileId].interdits.includes(itemId); }
function prixMarche(ileId, itemId) {
  const i = DB.iles[ileId]; const d = DB.items[itemId];
  let p = d.prix * (i.produit[itemId] || i.demande[itemId] || 1);
  if (estInterdit(itemId, ileId)) p *= C.commerce.prixContrebande;
  return p * (S.prixMod[ileId][itemId] || 1);
}
function prixAchat(ileId, itemId) { return Math.max(1, arr(prixMarche(ileId, itemId) * C.commerce.margeAchat * (1 - Math.min(0.3, C.commerce.bonusCommerce * competence("commerce"))))); }
function prixVente(ileId, it) {
  const rep = S.reputation.iles[ileId] || 0;
  return Math.max(0, arr(prixMarche(ileId, it.id) * C.commerce.margeVente * (it.etat / 100) * (1 + C.commerce.bonusCommerce * competence("commerce")) * (1 + rep * C.commerce.reputationPrix)));
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
  const p = prixVente(S.ile, it); S.or += p; bougerPrix(S.ile, it.id, -1); retirer(it);
  changerRep(S.ile, (p / 100) * C.reputation.venteMarche);
  journal("Vendu " + esc(DB.items[it.id].nom) + " pour " + p + " or."); rendreTout(); sauver();
}

/* ---------------- Contrats et quêtes ---------------- */
function joursTrajet(a, b) { return dist(a, b) / Math.max(1, vitesseNavire()); }
function genererOffres(ileId) {
  const i = DB.iles[ileId]; const ca = C.contratsAleatoires; const offres = [];
  if (i.marche) {
    const dests = S.connues.filter((d) => d !== ileId && DB.iles[d].marche);
    for (let k = 0; k < ca.parPort && dests.length; k++) {
      const dest = choisir(dests); const item = choisir(ca.items); const q = aleaInt(ca.quantiteMin, ca.quantiteMax);
      const j = joursTrajet(i, DB.iles[dest]);
      offres.push({ id: "c" + uid(), type: "livraison", titre: "Livraison pour " + DB.iles[dest].nom, origine: ileId, destination: dest, item, quantite: q,
        delaiJours: Math.ceil(j * ca.margeDelai) + 1, etatMin: ca.etatMin,
        recompense: arr(DB.items[item].prix * q * ca.recompenseParValeur + j * ca.recompenseParJour), reputation: ca.reputation, aleatoire: true });
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
  const quetes = C.quetes.filter((q) => q.origine === S.ile && !S.quetesFaites.includes(q.id) && !S.contrats.some((c) => c.id === q.id) && prerequisOk(q));
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
    if (etat < c.etatMin) { gain *= 0.5 * etat / c.etatMin; rep = -Math.abs(C.contrats.reputationEchec) / 2; lignes.push("État moyen " + arr(etat) + " % (minimum " + c.etatMin + " %) : le client est mécontent."); }
    else lignes.push("État moyen : " + arr(etat) + " %.");
    if (retard) lignes.push("Retard : " + retard + " jour(s).");
    gain = arr(gain); S.or += gain; changerRep(S.ile, rep);
    items.forEach(retirer); S.contrats = S.contrats.filter((x) => x.id !== c.id);
    if (!c.aleatoire) S.quetesFaites.push(c.id);
    journal("Contrat « " + esc(c.titre) + " » livré : +" + gain + " or.");
    await modale({ titre: "Livraison", icone: "📜", theme: rep >= 0 ? "succes" : "echec", html: "<p><b>" + esc(c.titre) + "</b></p><div class='gros-gain'>+" + gain + " 💰</div>", chips: lignes.concat(["Réputation " + (rep >= 0 ? "+" : "−") + Math.abs(arr(rep))]), boutons: [{ t: "Encaisser", primaire: true }] });
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
  S.quai = []; S.ile = null; S.joursEnMer = 0; selection = null; destination = null; vuePort = "accueil";
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
      let perte = 100 / d.perissable; if (climat === "tropical") perte *= C.cale.climatTropical; if (ventile(it)) perte *= C.cale.ventilation;
      it.etat -= perte;
      if (it.etat <= 0) { journal(esc(d.nom) + " a pourri et a été jeté."); retirer(it); continue; }
    }
    if (enMer && d.craintEau && auFond(it)) it.etat -= C.cale.humiditeFondParJour / (aAmelio("baches") ? DB.amelios.baches.diviseurEau : 1);
    it.etat = clamp(it.etat, 0, 100);
  }
  // Monde
  C.factions.forEach((f) => { S.mefiance[f.id] = Math.max(0, S.mefiance[f.id] - C.contrebande.mefianceBaisseParJour); });
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
function tirerEvenement() {
  const v = S.voyage; const danger = (dangerPoint(v.de) + dangerPoint(v.vers)) / 2;
  const possibles = C.evenements.filter((e) => e.chanceParJour > 0 && (!e.nuitSeulement || estNuit()) && (e.condition !== "contrebande" || contrebandeFaction(e.faction).length));
  const total = possibles.reduce((s, e) => s + e.chanceParJour, 0);
  const chance = Math.min(C.carte.chanceEvenementMax, total * (C.carte.chanceEvenementBase + danger * C.carte.chanceEvenementParDanger));
  if (Math.random() > chance) return;
  let r = Math.random() * total; for (const e of possibles) { r -= e.chanceParJour; if (r <= 0) { lancerEvenement(e); return; } }
}
function chanceTest(t) { return t ? clamp(t.base + t.parPoint * competence(t.competence), 0.05, 0.95) : 1; }
async function lancerEvenement(e) {
  const choixIdx = await modale({ titre: e.titre, icone: e.icone || "❗", theme: e.theme || "mer", html: "<p>" + esc(e.texte) + "</p>",
    boutons: e.choix.map((c) => ({ t: c.texte, chance: c.test ? chanceTest(c.test) : null, sous: c.test ? "Réussite " + pct(chanceTest(c.test)) + " · " + nomCompetence(c.test.competence) : "Sans risque d'échec" })) });
  const c = e.choix[choixIdx]; const ok = Math.random() < chanceTest(c.test);
  const eff = ok ? c.succes : (c.echec || c.succes);
  const lignes = await appliquerEffets(eff);
  journal("<b>" + esc(e.titre) + "</b> — " + esc(c.texte) + " : " + (ok ? "réussite" : "échec") + ".");
  if (eff.texte || lignes.length) await modale({ titre: c.test ? (ok ? "Réussite !" : "Échec…") : e.titre, icone: c.test ? (ok ? "✅" : "❌") : (e.icone || "⚓"), theme: c.test ? (ok ? "succes" : "echec") : (e.theme || "mer"), html: eff.texte ? "<p>" + esc(eff.texte) + "</p>" : "", chips: lignes, boutons: [{ t: "Continuer", primaire: true }] });
  verifierEquipage();
  if (S.navire.coque <= 0) { await naufrage(); return; }
  sauver(); rendreTout();
}
function nomCompetence(c) { const r = C.roles.liste.find((x) => x.competence === c); return r ? r.nom : c; }
async function appliquerEffets(e) {
  const L = [];
  if ((e.coque && e.coque < 0) || e.choc || e.eau) secousse();
  const surcharge = ratioCharge() > 1 ? C.cale.surchargeDegats : 1;
  if (e.coque) { const v = e.coque < 0 ? e.coque * surcharge : e.coque; S.navire.coque = clamp(S.navire.coque + v, 0, coqueMax()); L.push("Coque " + (v > 0 ? "+" : "") + arr(v)); }
  if (e.choc) L.push(...degatsChoc(e.choc * surcharge));
  if (e.eau) L.push(...degatsEau(e.eau * surcharge));
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
    for (let k = 0; k < n; k++) { const it = creerItem(id); if (placerAuto(it)) L.push(DB.items[id].nom + " rangé dans la cale"); else if (S.ile) { S.quai.push(it); L.push(DB.items[id].nom + " posé à terre : faites-lui de la place dans la cale"); } else L.push("Pas de place pour " + DB.items[id].nom + " : perdu"); }
  }
  if (e.blesse && S.equipage.length) { const m = choisir(S.equipage); m.sante -= e.blesse; L.push(m.nom + " est blessé (santé −" + e.blesse + ")"); }
  if (e.inspection) await inspection(e.inspection, null, true);
  return L;
}
function reductionArrimage() { return 1 - Math.min(0.8, C.cale.reductionArrimage * competence("arrimage")); }
function degatsChoc(I) {
  const stab = stabilite(); let n = 0, total = 0;
  S.cale.forEach((it) => {
    if (!DB.items[it.id].fragile) return;
    const p = poidsAuDessus(it);
    const d = I * alea(0.6, 1.2) * (1 + Math.max(0, p - C.cale.poidsFragile) / C.cale.poidsFragile) * (1.5 - stab) * reductionArrimage();
    it.etat = clamp(it.etat - d, 0, 100); n++; total += d;
  });
  return n ? ["Items fragiles secoués : " + n + " (−" + arr(total / n) + " % d'état en moyenne)"] : [];
}
function degatsEau(I) {
  let n = 0, total = 0; const div = aAmelio("baches") ? DB.amelios.baches.diviseurEau : 1;
  S.cale.forEach((it) => {
    if (!DB.items[it.id].craintEau) return;
    const d = I * (auFond(it) ? alea(0.8, 1.3) : alea(0.1, 0.3)) / div * reductionArrimage();
    it.etat = clamp(it.etat - d, 0, 100); n++; total += d;
  });
  return n ? ["Items mouillés : " + n + " (−" + arr(total / n) + " % d'état en moyenne)"] : [];
}

/* ---------------- Inspection ---------------- */
async function inspection(fid, ileId, certaine) {
  const ids = ileId ? new Set(DB.iles[ileId].interdits) : new Set(C.iles.filter((i) => i.faction === fid).flatMap((i) => i.interdits));
  const suspects = S.cale.filter((it) => ids.has(it.id));
  if (!suspects.length) { if (certaine) await modale({ titre: "Inspection", icone: "🔍", theme: "autorite", html: "<p>Les inspecteurs fouillent la cale et ne trouvent rien.</p>", boutons: [{ t: "Continuer", primaire: true }] }); return; }
  if (!certaine) {
    const i = DB.iles[ileId];
    let ch = i.surveillance * (1 + S.mefiance[fid] * C.contrebande.mefianceInspection) * (1 - Math.min(0.6, C.contrebande.bonusCommerce * competence("commerce")));
    if (estNuit()) ch *= C.contrebande.nuitInspection;
    if (Math.random() > ch) return;
  }
  const f = DB.factions[fid];
  const r = await modale({ titre: "Inspection !", icone: "🔍", theme: "autorite", html: "<p>Des agents de <b>" + esc(f.nom) + "</b> montent à bord pour fouiller la cale.</p><p class='muted'>Contrebande à bord : " + suspects.map((it) => esc(DB.items[it.id].nom) + (dansCachette(it) ? " (cachette)" : "")).join(", ") + "</p>",
    boutons: [{ t: "Laisser fouiller", primaire: true }, { t: "Glisser un pot-de-vin (" + C.contrebande.potDeVin + " or)", sous: "Chance : " + pct(clamp(f.corruptible + 0.1 * competence("commerce"), 0, 0.95)), off: S.or < C.contrebande.potDeVin }] });
  if (r === 1) {
    S.or -= C.contrebande.potDeVin;
    if (Math.random() < clamp(f.corruptible + 0.1 * competence("commerce"), 0, 0.95)) { journal("Pot-de-vin accepté par " + esc(f.nom) + "."); await modale({ titre: "Marché conclu", icone: "🤝", theme: "succes", html: "<p>L'inspecteur empoche l'or et regarde ailleurs.</p>", boutons: [{ t: "Continuer", primaire: true }] }); return; }
    S.mefiance[fid] += 10;
  }
  const bonusTrait = S.equipage.reduce((s, m) => s + m.traits.reduce((a, t) => a + (DB.traits[t].cachette || 0), 0), 0);
  const trouves = suspects.filter((it) => Math.random() > clamp((dansCachette(it) ? C.contrebande.cachetteDiscretion : C.contrebande.discretionNormale) + bonusTrait, 0, 0.98));
  if (!trouves.length) { await modale({ titre: "Ouf !", icone: "😮‍💨", theme: "succes", html: "<p>Les inspecteurs repartent bredouilles.</p>", boutons: [{ t: "Continuer", primaire: true }] }); return; }
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
    S.ile = null; devoilerAutour(S.pos.x, S.pos.y, C.carte.rayonBrouillard + 4); decouvrirAutour(S.pos);
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
  rendreTout(); afficherPanneau("p-port");
  if (i.surveillance > 0) await inspection(i.faction, i.id, false);
  await livrerContrats();
  if (i.evenementArrivee && !S.evtArriveeFaits.includes(i.id)) { S.evtArriveeFaits.push(i.id); await lancerEvenement(DB.evts[i.evenementArrivee]); }
  // Désertion
  for (const m of [...S.equipage]) if (S.equipage.length > 1 && m.moral < C.equipage.desertionSousMoral && Math.random() < C.equipage.chanceDesertion) { S.equipage = S.equipage.filter((x) => x !== m); journal("<b>" + esc(m.nom) + " a déserté.</b>"); toast(m.nom + " a déserté !"); }
  genererOffres(i.id);
  verifierEquipage(); sauver(); rendreTout();
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
  S.navire = { type: nf.navire, coque: DB.navires[nf.navire].coqueMax, amelios: [] };
  S.cale = []; S.quai = []; S.or = arr(S.or * nf.orConserve);
  S.contrats = []; S.voyage = null; S.ile = refuge; S.pos = { x: DB.iles[refuge].x, y: DB.iles[refuge].y };
  Object.keys(S.reputation.iles).forEach((k) => { S.reputation.iles[k] *= nf.reputationConservee; });
  Object.keys(S.reputation.factions).forEach((k) => { S.reputation.factions[k] *= nf.reputationConservee; });
  S.generation++; S.cohesion = 50;
  for (let k = 0; k < nf.rations[1]; k++) { const it = creerItem(nf.rations[0]); placerAuto(it); }
  genererOffres(refuge);
  journal("<b>Naufrage !</b> " + esc(survivant.nom) + " est le seul survivant et reprend la mer sur une barque. Génération " + S.generation + ".");
  enPause = true; sauver(); rendreTout(); afficherPanneau("p-port");
  await modale({ titre: "Naufrage", icone: "🌊", theme: "echec", html: "<p>Le navire sombre corps et biens. Seul <b>" + esc(survivant.nom) + "</b> s'en sort, accroché à une épave, et finit par atteindre <b>" + esc(DB.iles[refuge].nom) + "</b>.</p><ul><li>Navire, cargaison et or à bord : perdus</li><li>Carte découverte : conservée</li><li>Réputation : " + pct(nf.reputationConservee) + " conservée</li><li>Coffre à terre : " + S.coffre + " or</li></ul><p>" + esc(survivant.nom) + " devient capitaine d'une barque. L'héritage continue…</p>", boutons: [{ t: "Reprendre la mer", primaire: true }] });
}

/* ---------------- Services du port ---------------- */
function coutReparation() { return arr((coqueMax() - S.navire.coque) * C.commerce.reparationParPoint); }
function reparer() { const c = coutReparation(); const pay = Math.min(S.or, c); const pts = pay / C.commerce.reparationParPoint; S.or -= pay; S.navire.coque = Math.min(coqueMax(), S.navire.coque + pts); journal("Réparations : " + pay + " or."); rendreTout(); sauver(); }
function repos() {
  const eq = C.equipage; if (S.or < eq.reposPrix) return toast("Pas assez d'or.");
  S.or -= eq.reposPrix; S.temps += 1;
  S.equipage.forEach((m) => { m.sante += eq.reposSante; m.moral += eq.reposMoral; });
  finDeJournee(false); genererOffres(S.ile);
  journal("Une journée de repos à terre."); rendreTout(); sauver();
}
function recruesDispo() { return C.marins.filter((m) => m.prixRecrutement && !S.marinsPasses.includes(m.id)).slice(0, 2); }
function recruter(id) {
  const m = DB.marins[id]; if (S.or < m.prixRecrutement) return toast("Pas assez d'or.");
  if (S.equipage.length >= navire().equipageMax) return toast("Plus de place à bord.");
  S.or -= m.prixRecrutement; S.equipage.push(creerMarin(id)); S.marinsPasses.push(id); S.cohesion = clamp(S.cohesion + C.equipage.cohesionRecrue, 0, 100);
  journal(esc(m.nom) + " rejoint l'équipage."); rendreTout(); sauver();
}
function acheterAmelio(id) {
  const a = DB.amelios[id]; if (S.or < a.prix) return toast("Pas assez d'or.");
  if (S.navire.amelios.length >= navire().emplacements) return toast("Plus d'emplacement d'amélioration sur ce navire.");
  S.or -= a.prix; S.navire.amelios.push(id); if (a.bonusCoque) S.navire.coque += a.bonusCoque;
  journal("Amélioration installée : " + esc(a.nom) + "."); rendreTout(); sauver();
}
function reprise() { return arr(navire().prix * 0.5); }
async function acheterNavire(id) {
  const n = DB.navires[id]; const cout = n.prix - reprise(); if (S.or < cout) return toast("Pas assez d'or.");
  const r = await modale({ titre: "Changer de navire", icone: "⛵", html: "<p>Acheter une <b>" + esc(n.nom) + "</b> pour " + cout + " or (reprise de votre " + esc(navire().nom) + " déduite) ?</p><p class='muted'>Les améliorations sont perdues. La cargaison est déposée sur le quai : rangez-la dans la nouvelle cale.</p>", boutons: [{ t: "Acheter", primaire: true }, { t: "Annuler" }] });
  if (r !== 0) return;
  S.or -= cout; S.cale.forEach((it) => { it.x = -1; it.y = -1; S.quai.push(it); }); S.cale = [];
  S.navire = { type: id, coque: n.coqueMax, amelios: [] };
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
  if (estPC()) { if (id === "p-equipage") document.body.classList.toggle("voirEquipage"); return; }
  document.querySelectorAll(".panneau").forEach((p) => p.classList.toggle("actif", p.id === id));
  document.querySelectorAll("#onglets button").forEach((b) => b.classList.toggle("actif", b.dataset.p === id));
  if (id === "p-cale") rendreCale();
}
function rendreTout() { rendreHaut(); rendrePort(); rendreCale(); rendreCarte(); rendreEquipage(); rendreOnglets(); }
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
      "<span id='hautDroite'><span id='hautTemps'></span><button class='btnHaut' id='btnEquipagePC' title='Équipage'>👥</button><button class='btnHaut' id='menuBtn' title='Menu'>☰</button></span>";
    $("#menuBtn").onclick = menu;
    $("#btnEquipagePC").onclick = () => document.body.classList.toggle("voirEquipage");
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
  if (S.voyage) { if (p.dataset.mode !== "voyage") { p.dataset.mode = "voyage"; p.innerHTML = vueVoyage(); p.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => regler(b.dataset.v)); } majVoyage(); return; }
  p.dataset.mode = "port";
  const i = ileAct(); let h = "";
  if (!i) h = "<h2>Au large</h2><div class='bloc'><p style='margin:0 0 8px'>Ancré en eaux inconnues. Choisissez un nouveau cap.</p><button class='primaire' data-a='carte' style='width:100%'>🗺️ Ouvrir la carte</button></div>" + journalHtml();
  else if (vuePort === "accueil") h = vueAccueil(i);
  else h = "<div class='retour'><button data-a='accueil'>‹ Port</button><h2>" + titreLieu(vuePort, i) + "</h2></div>" + ({ capitainerie: vueCapitainerie, marche: vueMarche, chantier: vueChantier, taverne: vueTaverne, banque: vueBanque }[vuePort])(i);
  p.innerHTML = h;
  lierPort(p);
}
function journalHtml() { return "<details class='journal'><summary>Journal de bord</summary><div class='liste bloc'>" + S.journal.map((e) => "<div><span class='muted'>J" + e.j + "</span> " + e.t + "</div>").join("") + "</div></details>"; }
function lieuxDe(i) {
  const L = []; const livr = offresIci().filter((o) => o.type === "livraison").length; const rum = offresIci().filter((o) => o.type === "decouverte").length;
  if (i.marche) L.push({ id: "capitainerie", ic: "📜", t: "Capitainerie", s: livr ? livr + " contrat(s) proposé(s)" : "Aucun contrat", badge: livr });
  if (i.marche) L.push({ id: "marche", ic: "⚖️", t: "Marché", s: "Acheter et vendre" });
  if (i.services.includes("reparation") || i.services.includes("chantier") || i.ameliorations.length) L.push({ id: "chantier", ic: "🔨", t: i.services.includes("chantier") ? "Chantier naval" : "Atelier", s: "Coque " + arr(S.navire.coque) + "/" + coqueMax(), badge: S.navire.coque < coqueMax() * 0.6 ? "!" : 0 });
  const tav = i.services.includes("taverne");
  L.push({ id: "taverne", ic: tav ? "🍺" : "🔥", t: tav ? "Taverne" : "Bivouac", s: rum ? rum + " rumeur(s)" : tav ? "Repos, recrues" : "Se reposer", badge: rum, badgeOr: true });
  if (i.services.includes("coffre")) L.push({ id: "banque", ic: "🔒", t: "Coffre", s: S.coffre + " or à l'abri" });
  return L;
}
function titreLieu(id, i) { const l = lieuxDe(i).find((x) => x.id === id); return l ? l.ic + " " + l.t : id; }
function vueAccueil(i) {
  const f = DB.factions[i.faction]; const rep = S.reputation.iles[i.id] || 0;
  let h = "<div class='banniere'>" + banniereIle(i) + "<div class='nomIle'>" + esc(i.nom) + "</div></div>";
  h += "<div class='tags'><span class='tag' style='background:" + f.couleur + ";color:#fff'>" + esc(f.nom) + "</span><span class='tag'>" + (i.climat === "tropical" ? "🌴 Tropical" : "🌿 Tempéré") + "</span><span class='tag'>👁️ Surveillance " + niveau(i.surveillance) + "</span><span class='tag " + (rep < 0 ? "rouge" : "vert") + "'>⭐ " + repTexte(rep) + "</span>" + (i.interdits.length ? "<span class='tag rouge'>⚠️ Interdit : " + i.interdits.map((x) => DB.items[x].icone).join(" ") + "</span>" : "") + "</div>";
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
  return "<button class='contrat' data-offre='" + o.id + "'><span class='ai'>" + d.icone + "</span><div style='flex:1;min-width:0'><div class='nom'>" + esc(o.titre) + (o.aleatoire ? "" : " <span class='tag or'>quête</span>") + "</div><div class='route'>" + esc(S.ile ? DB.iles[S.ile].nom : "") + " → " + esc(dest.nom) + "</div><div class='sous'>" + o.quantite + " × " + esc(d.nom) + " · ⏳ " + o.delaiJours + " j · état ≥ " + o.etatMin + " % " + (d.fragile ? "🔸" : "") + (d.craintEau ? "💧" : "") + (d.perissable ? "⏳" : "") + (noir ? " <span class='tag rouge'>⚠️ contrebande</span>" : "") + "</div></div><span class='gain'>" + o.recompense + " 💰</span></button>";
}
function vueCapitainerie(i) {
  const livr = offresIci().filter((o) => o.type === "livraison");
  let h = "<p class='muted' style='margin-top:-4px'>Le client fournit la marchandise : vous la livrez dans les délais et en bon état.</p>";
  h += livr.length ? livr.map(carteOffre).join("") : "<div class='bloc muted'>Aucun contrat pour le moment. Revenez après un repos ou une autre escale.</div>";
  if (S.contrats.length) h += "<h3>📌 En cours</h3>" + S.contrats.map(contratEnCours).join("");
  return h;
}
function articleHtml(d, droite, sous, couleurFond) {
  return "<div class='article'><div class='ai' style='background:" + (couleurFond || d.couleur) + "'>" + d.icone + "</div><div class='ac'><div class='nom'>" + esc(d.nom) + "</div><div class='sous'>" + sous + "</div></div>" + droite + "</div>";
}
function vueMarche(i) {
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
function miniGrille(n) { let s = "<span class='mini-grille' style='grid-template-columns:repeat(" + n.colonnes + ",7px)'>"; for (let y = 0; y < n.rangees; y++) for (let x = 0; x < n.colonnes; x++) s += "<i class='" + (y === n.rangees - 1 ? "h" : "") + "'></i>"; return s + "</span>"; }
function vueChantier(i) {
  let h = "";
  if (i.services.includes("reparation")) h += "<div class='bloc'><div class='ligne'><div class='g'><div class='nom'>🛠️ Coque " + arr(S.navire.coque) + " / " + coqueMax() + "</div>" + jauge(S.navire.coque, coqueMax()) + "</div><button class='or' data-a='reparer' " + (S.navire.coque >= coqueMax() || !S.or ? "disabled" : "") + ">Réparer · " + coutReparation() + " 💰</button></div></div>";
  if (i.ameliorations.length) { h += "<h3>⚙️ Améliorations <span class='muted' style='font-family:Inter'>" + S.navire.amelios.length + "/" + navire().emplacements + "</span></h3>"; i.ameliorations.forEach((id) => { const a = DB.amelios[id]; const eu = S.navire.amelios.includes(id); h += articleHtml({ icone: a.effet === "cachette" ? "🗝️" : a.effet === "baches" ? "🧥" : "🪵", nom: a.nom }, eu ? "<span class='tag vert'>installée</span>" : "<button class='prix or' data-amelio='" + id + "' " + (S.or < a.prix ? "disabled" : "") + ">" + a.prix + "<small>💰 installer</small></button>", esc(a.description), "#e9d6a6"); }); }
  if (i.services.includes("chantier")) { h += "<h3>⛵ Navires</h3>"; C.navires.filter((n) => n.prix > 0 && n.id !== S.navire.type).forEach((n) => { h += articleHtml({ icone: "⛵", nom: n.nom }, "<button class='prix or' data-navire='" + n.id + "'>" + Math.max(0, n.prix - reprise()) + "<small>💰 reprise déduite</small></button>", miniGrille(n) + " cale " + n.colonnes + "×" + n.rangees + "<br>charge " + n.chargeMax + " · équipage " + n.equipageMax + " · " + n.canons + " canons · vitesse " + n.vitesse, "#cfe0ee"); }); }
  return h || "<div class='bloc muted'>Aucun service ici.</div>";
}
function vueTaverne(i) {
  const tav = i.services.includes("taverne"); let h = "";
  h += articleHtml({ icone: "🛏️", nom: "Repos à terre (1 jour)" }, "<button class='prix or' data-a='repos' " + (S.or < C.equipage.reposPrix ? "disabled" : "") + ">" + C.equipage.reposPrix + "<small>💰 1 jour</small></button>", "Santé +" + C.equipage.reposSante + " · moral +" + C.equipage.reposMoral + " · de nouveaux contrats arrivent", "#e9d6a6");
  const rum = offresIci().filter((o) => o.type === "decouverte");
  if (rum.length) h += "<h3>👂 Rumeurs</h3>" + rum.map(carteOffre).join("");
  if (i.services.includes("recrutement")) {
    const rec = recruesDispo(); const plein = S.equipage.length >= navire().equipageMax;
    h += "<h3>🍺 Recrues <span class='muted' style='font-family:Inter'>" + S.equipage.length + "/" + navire().equipageMax + " à bord</span></h3>";
    h += rec.length ? rec.map((m) => "<div class='article'>" + portraitSvg(m.portrait, 48) + "<div class='ac'><div class='nom'>" + esc(m.nom) + "</div><div class='sous'>" + esc(DB.roles[m.role].nom) + " · second : " + esc(DB.roles[m.secondaire].nom) + "<br>" + m.salaire + " or/jour" + (m.traits.length ? " · " + m.traits.map((t) => DB.traits[t].nom).join(", ") : "") + "</div></div><button class='prix or' data-recrue='" + m.id + "' " + (plein || S.or < m.prixRecrutement ? "disabled" : "") + ">" + m.prixRecrutement + "<small>" + (plein ? "plus de place" : "💰 recruter") + "</small></button></div>").join("") : "<div class='bloc muted'>Personne ne cherche d'embarquement.</div>";
  } else if (tav) h += "<p class='muted'>Personne ici ne cherche à s'engager.</p>";
  return h;
}
function vueBanque() {
  return "<div class='bloc' style='text-align:center'><div style='font-size:40px'>🔒</div><div class='gros-gain' style='font-size:28px'>" + S.coffre + " 💰</div><p class='muted'>L'or du coffre est conservé même en cas de naufrage.</p>" +
    "<div class='grille2'><button data-coffre='50'>Déposer 50</button><button data-coffre='-50'>Retirer 50</button><button data-coffre='tout'>Tout déposer</button><button data-coffre='-tout'>Tout retirer</button></div></div>";
}
function lierPort(p) {
  p.querySelectorAll("[data-a]").forEach((b) => b.onclick = () => { const a = b.dataset.a; if (a === "carte") { if (estPC()) { const m = $("#p-carte"); m.scrollTop = 0; m.classList.remove("secoue"); } afficherPanneau("p-carte"); } if (a === "cale") afficherPanneau("p-cale"); if (a === "accueil") { vuePort = "accueil"; rendrePort(); } if (a === "reparer") reparer(); if (a === "repos") repos(); });
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
    "<div class='vitesses'><button data-v='p'>⏸ Pause</button>" + C.temps.vitesses.map((x, k) => "<button data-v='" + k + "'>x" + x + "</button>").join("") + "</div></div>";
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

/* ---------- Panneau Cale ---------- */
function tailleCase() {
  const n = navire(); const panneau = $("#p-cale"); const larg = (panneau.clientWidth || window.innerWidth) - 24 - 56;
  return clamp(Math.floor(larg / n.colonnes), 30, 58);
}
function rendreCale() {
  if (glisse) return;
  const p = $("#p-cale"); const scroll = p.scrollTop; const n = navire(); const cs = tailleCase();
  const rc = ratioCharge(); const st = stabilite(); const dq = desequilibre();
  let h = "<h2>Cale — " + esc(n.nom) + "</h2>";
  h += "<div class='puces'>" +
    "<div class='puce'>⚖️ Charge<b style='color:" + (rc > 1 ? "var(--danger)" : rc > C.cale.seuilRalentissement ? "var(--alerte)" : "inherit") + "'>" + charge() + " / " + n.chargeMax + "</b><div class='jauge " + (rc > 1 ? "bas" : rc > C.cale.seuilRalentissement ? "moy" : "") + "'><i style='width:" + Math.min(100, rc * 100) + "%'></i></div></div>" +
    "<div class='puce'>⚓ Stabilité<b>" + pct(st) + "</b>" + jauge(st * 100) + "</div>" +
    "<div class='puce'>↔️ Équilibre<b>" + (Math.abs(dq) < 0.15 ? "Bon" : dq < 0 ? "Proue lourde" : "Poupe lourde") + "</b>" + jauge((1 - Math.abs(dq)) * 100) + "</div>" +
    "<div class='puce'>💨 Vitesse<b>" + vitesseNavire().toFixed(1) + " / j</b></div>" +
    "<div class='puce'>🍞 Vivres<b>" + rations() + " · " + (joursDeVivres() >= 99 ? "—" : joursDeVivres().toFixed(1) + " j") + "</b></div>" +
    "<div class='puce'>▦ Volume<b>" + casesOccupees() + " / " + n.colonnes * n.rangees + "</b></div></div>";
  h += "<div class='coque-wrap'><span class='lbl' style='left:4px;top:50%;transform:translateY(-50%) rotate(-90deg)'>PROUE</span><span class='lbl' style='right:4px;top:50%;transform:translateY(-50%) rotate(90deg)'>POUPE</span><span class='lbl' style='left:50%;top:7px;transform:translateX(-50%)'>PONT · SEC</span><span class='lbl' style='left:50%;bottom:8px;transform:translateX(-50%)'>FOND DE CALE · HUMIDE</span><div id='grille' style='width:" + n.colonnes * cs + "px;height:" + n.rangees * cs + "px'>";
  const cache = aAmelio("cachette") ? n.cachette.map((c) => c.join(",")) : [];
  for (let y = 0; y < n.rangees; y++) for (let x = 0; x < n.colonnes; x++) h += "<div class='case" + (y === n.rangees - 1 ? " humide" : "") + (n.colonnesVentilees.includes(x) ? " vent" : "") + (cache.includes(x + "," + y) ? " cache" : "") + "' style='left:" + x * cs + "px;top:" + y * cs + "px;width:" + cs + "px;height:" + cs + "px'></div>";
  S.cale.forEach((it) => { h += itemHtml(it, cs, it.x * cs, it.y * cs); });
  h += "</div></div><div class='legende'><span class='tag bleu'>💧 fond humide</span><span class='tag'>▨ ventilé : ⏳ pourrit moins</span><span class='tag'>🔸 fragile : rien de lourd dessus</span>" + (cache.length ? "<span class='tag or'>🗝️ cachette</span>" : "") + "<span class='tag'>↻ double-tap ou 2ᵉ doigt</span></div>";
  h += "<div id='detail' class='bloc'></div>";
  if (S.ile) h += "<div class='quai-barre" + (S.quai.length ? "" : " vide") + "'><div class='tete'>⚓ Quai <span class='muted' style='font-family:Inter'>" + (S.quai.length ? S.quai.length + " item(s) à charger" : "") + "</span>" + (S.quai.length ? "<button class='primaire' id='bToutRanger'>Tout ranger</button>" : "") + "</div><div id='quai' class='" + (S.quai.length ? "" : "vide") + "' data-vide='Quai vide. Glissez un item ici pour le décharger.'>" + S.quai.map((it) => itemHtml(it, Math.min(cs, 44), null, null)).join("") + "</div></div>";
  p.innerHTML = h; p.scrollTop = scroll;
  p.querySelectorAll(".item").forEach((el) => el.addEventListener("pointerdown", debutGlisse));
  const bt = $("#bToutRanger"); if (bt) bt.onclick = toutRanger;
  rendreDetail(); rendreOnglets();
}
function toutRanger() {
  const tri = [...S.quai].sort((a, b) => DB.items[b.id].poids * dimsAire(b) - DB.items[a.id].poids * dimsAire(a));
  let ko = 0; tri.forEach((it) => { if (!placerAuto(it)) ko++; });
  vibrer(15); if (ko) toast(ko + " item(s) n'ont pas trouvé de place."); else toast("Tout est rangé ! Vérifiez les risques (!).");
  rendreTout(); sauver();
  document.querySelectorAll("#grille .item").forEach((el) => el.classList.add("pose"));
}
function dimsAire(it) { const d = DB.items[it.id]; return d.largeur * d.hauteur; }
function casesOccupees() { return S.cale.reduce((s, it) => { const d = dims(it); return s + d.w * d.h; }, 0); }
function enRisque(it) { if (it.x < 0) return false; const d = DB.items[it.id]; return (d.craintEau && auFond(it)) || (d.fragile && poidsAuDessus(it) > C.cale.poidsFragile); }
function itemHtml(it, cs, left, top) {
  const d = DB.items[it.id]; const dm = dims(it);
  const pos = left === null ? "" : "left:" + left + "px;top:" + top + "px;";
  const dest = S.voyage ? S.voyage.vers.ile : (destination && destination.ile) || S.ile;
  const badges = (d.fragile ? "🔸" : "") + (d.perissable ? "⏳" : "") + (d.craintEau ? "💧" : "") + (estInterdit(it.id, dest) ? "⚠️" : "") + (it.contrat ? "📜" : "");
  const coul = it.etat < 40 ? "#ff7b6b" : it.etat < 70 ? "#ffc562" : "#9be27a";
  return "<div class='item" + (selection === it.uid ? " sel" : "") + (enRisque(it) ? " risque" : "") + "' data-uid='" + it.uid + "' style='" + pos + "width:" + (dm.w * cs - 4) + "px;height:" + (dm.h * cs - 4) + "px;margin:2px;background:" + d.couleur + "'><span class='badges'>" + badges + "</span><span class='ic'>" + d.icone + "</span><span class='nm'>" + (dm.w * cs > 70 ? esc(d.nom) : "") + "</span><div class='etat'><i style='width:" + it.etat + "%;background:" + coul + "'></i></div></div>";
}
function risquesPosition(it) {
  const d = DB.items[it.id]; const r = [];
  if (it.x < 0) return r;
  if (d.craintEau && auFond(it)) r.push(["neg", "💧 Au fond de cale humide : il s'abîme chaque jour en mer."]);
  if (d.fragile) { const p = poidsAuDessus(it); if (p > C.cale.poidsFragile) r.push(["neg", "🔸 " + p + " kg posés dessus : il souffrira des chocs."]); else r.push(["pos", "🔸 Rien de lourd dessus : bien protégé."]); }
  if (d.perissable) r.push(ventile(it) ? ["pos", "▨ Zone ventilée : pourrit moins vite."] : ["", "⏳ Hors zone ventilée : pourrit à vitesse normale."]);
  if (d.poids >= 9 && it.y < navire().rangees - 2) r.push(["neg", "⚖️ Lourd et placé haut : le navire est moins stable."]);
  if (dansCachette(it)) r.push(["pos", "🗝️ Dans la cachette : presque invisible aux inspections."]);
  return r;
}
function rendreDetail() {
  const el = $("#detail"); if (!el) return;
  const it = tousItems().find((x) => x.uid === selection);
  if (!it) { el.innerHTML = "<span class='muted'>👆 Touchez un item pour voir ses caractéristiques et les risques de son emplacement. Glissez-le pour le déplacer.</span>"; return; }
  const d = DB.items[it.id]; const c = it.contrat ? S.contrats.find((x) => x.id === it.contrat) : null;
  const risques = risquesPosition(it);
  el.innerHTML = "<div style='display:flex;gap:10px;align-items:center'><div class='article' style='margin:0;padding:0;border:0;box-shadow:none;background:none'><div class='ai' style='background:" + d.couleur + "'>" + d.icone + "</div></div><div style='flex:1;min-width:0'><div class='nom' style='font-size:15px'>" + esc(d.nom) + "</div><div class='sous'>" + dims(it).w + "×" + dims(it).h + " · " + d.poids + " kg · valeur " + d.prix + " 💰</div>" + jauge(it.etat) + "</div><b style='font-size:15px'>" + arr(it.etat) + " %</b></div>" +
    "<div style='margin:6px 0'>" + contraintesTags(d, it) + (c ? "<span class='tag or'>📜 " + esc(c.titre) + "</span>" : "") + "</div>" +
    (risques.length ? "<div class='effets'>" + risques.map(([s, t]) => "<span class='effet " + s + "'>" + t + "</span>").join("") + "</div>" : "") +
    "<div class='actions'><button id='bPivot'>↻ Pivoter</button>" +
    (S.ile && S.cale.includes(it) ? "<button id='bQuai'>⬇ Sur le quai</button>" : "") +
    (S.ile && !S.cale.includes(it) ? "<button class='primaire' id='bAuto'>⬆ Ranger</button>" : "") +
    (S.ile && ileAct().marche && !it.contrat ? "<button class='or' id='bVendre'>Vendre " + prixVente(S.ile, it) + " 💰</button>" : "") +
    (!S.ile ? "<button id='bJeter'>🌊 Jeter à la mer</button>" : "") + "</div>";
  const on = (id, f) => { const b = $("#" + id); if (b) b.onclick = f; };
  on("bPivot", () => pivoter(it));
  on("bQuai", () => { versQuai(it); rendreTout(); sauver(); });
  on("bAuto", () => { if (!placerAuto(it)) toast("Pas de place dans la cale."); else vibrer(10); rendreTout(); sauver(); animerItem(it.uid, "pose"); });
  on("bVendre", () => vendre(it));
  on("bJeter", async () => { const r = await modale({ titre: "Jeter à la mer ?", icone: "🌊", theme: "mer", html: "<p>" + esc(d.nom) + " sera perdu définitivement.</p>", boutons: [{ t: "Jeter", primaire: true }, { t: "Annuler" }] }); if (r === 0) { retirer(it); rendreTout(); sauver(); } });
}
function animerItem(uidItem, classe) { const el = document.querySelector("#p-cale .item[data-uid='" + uidItem + "']"); if (el) { el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe); } }
function pivoter(it) {
  if (!S.cale.includes(it)) { it.rot = !it.rot; rendreCale(); animerItem(it.uid, "pose"); return; }
  if (peutPlacer(it, it.x, it.y, !it.rot)) { it.rot = !it.rot; rendreTout(); sauver(); animerItem(it.uid, "pose"); vibrer(10); }
  else { toast("Pas la place de le pivoter ici."); animerItem(it.uid, "refus"); }
}

/* ---------- Glisser-déposer (souris et tactile) ---------- */
function debutGlisse(ev) {
  if (glisse) { // un 2e doigt pendant le glisser : pivoter
    if (glisse.bouge) { glisse.it.rot = !glisse.it.rot; majFantome(); vibrer(10); }
    return;
  }
  const el = ev.currentTarget; const it = tousItems().find((x) => x.uid === el.dataset.uid); if (!it) return;
  ev.preventDefault();
  const r = el.getBoundingClientRect();
  glisse = { it, el, id: ev.pointerId, rot0: it.rot, x0: ev.clientX, y0: ev.clientY, x: ev.clientX, y: ev.clientY, fx: (ev.clientX - r.left) / r.width, fy: (ev.clientY - r.top) / r.height, bouge: false, fantome: null, apercu: null, cible: null };
  window.addEventListener("pointermove", pendantGlisse); window.addEventListener("pointerup", finGlisse); window.addEventListener("pointercancel", finGlisse);
  window.addEventListener("pointerdown", secondDoigt, true);
}
function secondDoigt(ev) { if (glisse && ev.pointerId !== glisse.id && glisse.bouge) { ev.preventDefault(); ev.stopPropagation(); glisse.it.rot = !glisse.it.rot; majFantome(); vibrer(10); } }
function majFantome() {
  const g = glisse; if (!g || !g.fantome) return; const cs = tailleCase(); const dm = dims(g.it);
  g.fantome.style.width = (dm.w * cs - 4) + "px"; g.fantome.style.height = (dm.h * cs - 4) + "px";
  pendantGlisse({ clientX: g.x, clientY: g.y, pointerId: g.id });
}
function pendantGlisse(ev) {
  const g = glisse; if (!g || ev.pointerId !== g.id) return;
  g.x = ev.clientX; g.y = ev.clientY;
  if (!g.bouge && Math.hypot(ev.clientX - g.x0, ev.clientY - g.y0) < 6) return;
  const cs = tailleCase(); const dm = dims(g.it); const d = DB.items[g.it.id];
  const grille = $("#grille"); if (!grille) return;
  if (!g.bouge) {
    g.bouge = true; g.fantome = g.el.cloneNode(true); g.fantome.classList.add("fantome"); g.fantome.classList.remove("sel", "risque");
    g.fantome.style.width = (dm.w * cs - 4) + "px"; g.fantome.style.height = (dm.h * cs - 4) + "px"; g.fantome.style.left = "0"; g.fantome.style.top = "0"; g.fantome.style.margin = "0";
    document.body.appendChild(g.fantome); g.el.style.opacity = "0.25";
    grille.classList.toggle("g-eau", !!d.craintEau); grille.classList.toggle("g-peris", !!d.perissable); grille.classList.toggle("g-cache", C.iles.some((i) => i.interdits.includes(d.id)));
    vibrer(8);
  }
  const w = dm.w * cs, h = dm.h * cs; const ox = g.fx * w, oy = g.fy * h;
  g.fantome.style.transform = "translate(" + (ev.clientX - ox) + "px," + (ev.clientY - oy) + "px) rotate(" + (g.it.rot !== g.rot0 ? 0 : 0) + "deg) scale(1.06)";
  const gr = grille.getBoundingClientRect();
  const gx = Math.round((ev.clientX - ox - gr.left) / cs); const gy = Math.round((ev.clientY - oy - gr.top) / cs);
  const dedans = ev.clientX >= gr.left - cs && ev.clientX <= gr.right + cs && ev.clientY >= gr.top - cs && ev.clientY <= gr.bottom + cs;
  if (!g.apercu) { g.apercu = document.createElement("div"); g.apercu.className = "apercu"; grille.appendChild(g.apercu); }
  if (dedans) {
    const ok = peutPlacer(g.it, gx, gy, g.it.rot);
    let classe = ok ? "ok" : "non";
    if (ok) { const t = Object.assign({}, g.it, { x: gx, y: gy }); if ((d.craintEau && auFond(t)) || (d.fragile && poidsAuDessus(t) > C.cale.poidsFragile)) classe = "risque"; }
    g.apercu.className = "apercu " + classe; g.apercu.style.display = "block";
    g.apercu.style.left = gx * cs + "px"; g.apercu.style.top = gy * cs + "px"; g.apercu.style.width = w + "px"; g.apercu.style.height = h + "px";
    if (ok && (!g.cible || g.cible.x !== gx || g.cible.y !== gy)) vibrer(4);
    g.cible = ok ? { x: gx, y: gy } : null;
  } else { g.apercu.style.display = "none"; g.cible = null; }
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
  let resultat = "refus";
  if (g.cible) {
    g.it.x = g.cible.x; g.it.y = g.cible.y; S.quai = S.quai.filter((q) => q.uid !== g.it.uid); if (!S.cale.includes(g.it)) S.cale.push(g.it); resultat = "pose"; vibrer(12);
  } else if (g.surQuai && S.ile) { versQuai(g.it); resultat = "pose"; }
  else g.it.rot = g.rot0;
  selection = g.it.uid; rendreTout(); sauver(); animerItem(g.it.uid, resultat);
}
window.addEventListener("keydown", (e) => {
  if ((e.key === "r" || e.key === "R") && !modaleOuverte) {
    if (glisse && glisse.bouge) { glisse.it.rot = !glisse.it.rot; majFantome(); return; }
    if (selection) { const it = tousItems().find((x) => x.uid === selection); if (it) pivoter(it); }
  }
});

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
  if (S.voyage) return "<div class='nom'>⛵ En route vers " + esc(S.voyage.vers.ile ? DB.iles[S.voyage.vers.ile].nom : "des eaux inconnues") + "</div><div class='vitesses'><button data-v='p'>⏸</button>" + C.temps.vitesses.map((x, k) => "<button data-v='" + k + "'>x" + x + "</button>").join("") + "</div>";
  if (!destination) return "<span class='muted'>👆 Touchez une île pour préparer un trajet, ou touchez la mer et le brouillard pour partir explorer.</span>";
  const cible = destination.ile ? DB.iles[destination.ile] : destination; const j = joursTrajet(S.pos, cible);
  const danger = (dangerPoint({ ile: S.ile }) + dangerPoint(destination)) / 2; let h = "";
  if (destination.ile) {
    const i = DB.iles[destination.ile]; const f = DB.factions[i.faction]; const rep = S.reputation.iles[i.id] || 0;
    const contr = S.contrats.filter((c) => c.destination === i.id).length; const illegaux = tousItems().filter((it) => estInterdit(it.id, i.id));
    h += "<div class='nom titre' style='font-size:22px;color:var(--bois)'>" + esc(i.nom) + "</div><div style='margin:4px 0'><span class='tag' style='background:" + f.couleur + ";color:#fff'>" + esc(f.nom) + "</span><span class='tag'>" + (i.climat === "tropical" ? "🌴 Tropical" : "🌿 Tempéré") + "</span><span class='tag'>👁️ " + niveau(i.surveillance) + "</span><span class='tag " + (rep < 0 ? "rouge" : "vert") + "'>⭐ " + repTexte(rep) + "</span>" + (contr ? "<span class='tag or'>📜 " + contr + " livraison(s)</span>" : "") + "</div>";
    if (i.interdits.length) h += "<div class='muted'>Contrebande ici : " + i.interdits.map((x) => DB.items[x].icone + " " + esc(DB.items[x].nom)).join(", ") + "</div>";
    if (illegaux.length) h += "<div style='margin-top:4px'><span class='tag rouge'>⚠️ " + illegaux.length + " item(s) interdit(s) à bord</span></div>";
  } else h += "<div class='nom titre' style='font-size:22px;color:var(--bois)'>🧭 Exploration</div><div class='muted'>Eaux inconnues : on y découvre des îles, mais le danger y est plus grand.</div>";
  const vj = joursDeVivres();
  h += "<div class='puces' style='margin:10px 0'><div class='puce'>⏳ Durée<b>" + j.toFixed(1) + " j</b></div><div class='puce'>☠️ Danger<b>" + niveau(danger) + "</b></div><div class='puce'>🍞 Vivres<b style='color:" + (vj < j + 1 ? "var(--danger)" : "inherit") + "'>" + (vj >= 99 ? "—" : vj.toFixed(1) + " j") + "</b></div></div>";
  if (S.quai.length) h += "<div class='muted' style='margin-bottom:6px'>📦 " + S.quai.length + " item(s) encore sur le quai.</div>";
  return h + "<button class='primaire' id='bPartir' style='width:100%;min-height:50px;font-size:16px'>⛵ Lever l'ancre</button>";
}
function lierInfo() {
  const bp = $("#bPartir"); if (bp) bp.onclick = demanderDepart;
  document.querySelectorAll("#infoDest [data-v]").forEach((b) => b.onclick = () => regler(b.dataset.v));
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
  let h = "<h2>Équipage <span class='muted' style='font-family:Inter;font-size:14px'>" + S.equipage.length + "/" + n.equipageMax + "</span>" + (estPC() ? " <button style='float:right;min-height:30px;padding:2px 10px' onclick=\"document.body.classList.remove('voirEquipage')\">✕</button>" : "") + "</h2>";
  h += "<div class='bloc'><div class='ligne'><div class='g'><div class='nom'>🤝 Cohésion</div>" + jauge(S.cohesion) + "</div><b>" + arr(S.cohesion) + "</b></div><div class='muted'>Génération " + S.generation + " · vivres frais il y a " + S.joursSansFrais + " j" + (S.joursSansFrais > C.equipage.scorbutApresJours ? " — <b style='color:var(--danger)'>scorbut !</b>" : "") + "</div></div>";
  S.equipage.forEach((m) => {
    h += "<div class='bloc marin'>" + portraitSvg(m.portrait, 64) + "<div style='flex:1;min-width:0'><div class='nom' style='font-size:15px'>" + esc(m.nom) + "</div><div class='muted'>" + esc(DB.roles[m.role].nom) + (m.secondaire ? " · second : " + esc(DB.roles[m.secondaire].nom) : "") + " · " + m.salaire + " or/j</div>" +
      (m.traits.length ? "<div>" + m.traits.map((t) => "<span class='tag' title='" + esc(DB.traits[t].description) + "'>" + esc(DB.traits[t].nom) + "</span>").join("") + "</div>" : "") +
      "<div class='grille2' style='margin-top:4px'><div class='muted'>❤️ Santé " + arr(m.sante) + jauge(m.sante) + "</div><div class='muted'>🙂 Moral " + arr(m.moral) + jauge(m.moral) + "</div></div></div></div>";
  });
  const comps = [["navigation", "🧭"], ["arrimage", "📦"], ["charpente", "🔨"], ["cuisine", "🍲"], ["medecine", "⚕️"], ["defense", "💣"], ["vigie", "🔭"], ["commerce", "🤝"]];
  h += "<h3>Compétences</h3><div class='bloc grille2'>" + comps.map(([c, ic]) => { const v = competence(c); return "<div style='font-size:12.5px'>" + ic + " " + esc(nomCompetence(c)) + " <b style='float:right'>" + v.toFixed(2) + "</b>" + jauge(v, 1.5) + "</div>"; }).join("") + "</div>";
  h += "<p class='muted'>Un rôle sans titulaire n'apporte rien : les tests correspondants sont plus difficiles. Recrutez à la taverne quand le navire a de la place.</p>";
  p.innerHTML = h;
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
  const r = await modale({ titre: "Menu", icone: "☰", html: "<p class='muted'>Prototype 0.2 · la partie est sauvegardée automatiquement dans ce navigateur.</p>", boutons: [{ t: "Reprendre", primaire: true }, { t: "Comment jouer" }, { t: "Nouvelle partie" }] });
  if (r === 1) aide();
  if (r === 2) { const c = await modale({ titre: "Nouvelle partie ?", icone: "⚠️", theme: "echec", html: "<p>La partie en cours sera effacée.</p>", boutons: [{ t: "Recommencer", primaire: true }, { t: "Annuler" }] }); if (c === 0) { nouvellePartie(); destination = null; selection = null; enPause = true; vuePort = "accueil"; precedent = null; rendreTout(); afficherPanneau("p-port"); } }
}
function aide() {
  return modale({ titre: "Comment jouer", icone: "🧭", theme: "mer", html: "<ul>" +
    "<li><b>⚓ Port</b> : chaque lieu a son rôle. Capitainerie pour les contrats, Marché pour acheter et vendre, Taverne pour les rumeurs et les recrues. Ce que vous recevez arrive sur le <b>quai</b>.</li>" +
    "<li><b>📦 Cale</b> : glissez les items du quai vers la grille, ou utilisez « Tout ranger ». Pour pivoter : double-tap, un 2ᵉ doigt pendant le glisser, ou la touche R. Un <b>!</b> orange signale un item mal placé.</li>" +
    "<li><b>🗺️ Carte</b> : touchez une île pour y aller, ou la mer et le brouillard pour explorer.</li>" +
    "<li><b>⛵ En mer</b> : ⏸ x1 x2 x4 règlent le temps. L'équipage mange 1 ration par jour. Les événements mettent le jeu en pause.</li>" +
    "<li><b>⚠️ Contrebande</b> : très rentable là où elle est interdite, mais gare aux inspections.</li>" +
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
  if (!reprise) nouvellePartie();
  if (S.voyage) enPause = true;
  rendreTout(); afficherPanneau("p-port");
  let largeurPrec = window.innerWidth;
  window.addEventListener("resize", () => { if (glisse || Math.abs(window.innerWidth - largeurPrec) < 20) return; largeurPrec = window.innerWidth; rendreTout(); });
  requestAnimationFrame(boucle);
  if (!reprise) aide();
  window.__jeu = { get S() { return S; }, DB, competence, vitesseNavire, avancer, arriver, finDeJournee, lancerEvenement, naufrage, rendreTout };
}
demarrer();
})();
