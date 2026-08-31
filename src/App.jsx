import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShoppingCart, RefreshCw, Users, Wallet, Store, ChefHat, Info, Check,
  Layers, Leaf, Download, Copy, Image as ImageIcon, Sun, Moon,
  ShoppingBag, Truck, Bike, Lock, Unlock, X, CalendarDays,
  Coins, Snowflake, Sparkles, Lightbulb,
  Waves, Mountain, Sandwich, UserPlus, ClipboardList, ListChecks,
} from "lucide-react";
 
/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */
 
// Indices de prix indicatifs entre enseignes, calés sur des comparatifs publiés
// (UFC-Que Choisir, palmarès drive juin 2025/2026 + enquête hard-discount fév. 2025) :
// Leclerc = référence 1.00. Lidl ≈ 2,5 % moins cher que Leclerc ; Aldi ≈ 4,5 % plus cher
// que Lidl ; Intermarché proche de Leclerc ; Carrefour ≈ +9 % vs Leclerc ; Auchan
// l'enseigne la plus chère du panel hyper/super ; Monoprix (format proximité) nettement
// au-dessus de tout le monde. Moyennes nationales — les prix varient d'un magasin à l'autre
// et selon les promos, donc à prendre comme ordre de grandeur, pas comme un relevé en temps réel.
const STORES = [
  { id: "lidl", name: "Lidl", mult: 0.97 },
  { id: "leclerc", name: "Leclerc", mult: 1.00 },
  { id: "aldi", name: "Aldi", mult: 1.02 },
  { id: "intermarche", name: "Intermarché", mult: 1.03 },
  { id: "carrefour", name: "Carrefour", mult: 1.09 },
  { id: "auchan", name: "Auchan", mult: 1.13 },
  { id: "monoprix", name: "Monoprix", mult: 1.30 },
];
 
/* 🔧 LIENS PARTENAIRES — à remplacer par tes liens affiliés définitifs.
   Chaque clé de DRIVE_LINKS correspond à l'id d'une enseigne dans STORES ci-dessus :
   quand un lien affilié drive existe pour une enseigne, remplace juste sa valeur. */
const AFFILIATE_LINKS = {
  quitoque: "https://www.quitoque.fr/", // TODO: lien affilié Quitoque
  hellofresh: "https://www.hellofresh.fr/", // TODO: lien affilié HelloFresh
  deliveroo: "https://deliveroo.fr/", // TODO: lien affilié Deliveroo
  ubereats: "https://www.ubereats.com/fr", // TODO: lien affilié Uber Eats
};
 
const DRIVE_LINKS = {
  lidl: "https://www.lidl.fr/", // TODO: lien affilié drive Lidl
  aldi: "https://www.aldi.fr/", // TODO: lien affilié drive Aldi
  leclerc: "https://www.leclercdrive.fr/", // TODO: lien affilié Leclerc Drive
  intermarche: "https://www.intermarche.com/", // TODO: lien affilié Intermarché Drive
  auchan: "https://www.auchan.fr/", // TODO: lien affilié Auchan Drive
  carrefour: "https://www.carrefour.fr/", // TODO: lien affilié Carrefour Drive
  monoprix: "https://www.monoprix.fr/", // TODO: lien affilié Monoprix Drive
};
 
const CATEGORY_ORDER = [
  "Fruits & légumes",
  "Viande & poisson",
  "Crèmerie",
  "Féculents & épicerie",
  "Boulangerie",
  "Surgelés",
];
 
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
 
// Saisonnalité (France) des légumes/fruits frais utilisés dans les recettes.
// Un ingrédient absent de cette table est considéré disponible toute l'année.
const SEASON = {
  "Tomates": [6, 7, 8, 9, 10],
  "Tomates cerises": [6, 7, 8, 9],
  "Courgette": [6, 7, 8, 9],
  "Courgettes": [6, 7, 8, 9],
  "Aubergine": [7, 8, 9, 10],
  "Poivron": [7, 8, 9, 10],
  "Brocoli": [10, 11, 12, 1, 2, 3, 4],
  "Basilic": [5, 6, 7, 8, 9],
  "Concombre": [5, 6, 7, 8, 9],
};
 
// Calendrier indicatif (France métropolitaine) des fruits & légumes de saison, pour la
// petite carte "Voir les fruits et légumes de saison". Recoupé avec les repères habituels
// des calendriers Greenpeace / ADEME. Ce sont des grands repères stables d'une année sur
// l'autre, pas un relevé en temps réel — la saisonnalité exacte varie selon la région et la météo.
const FULL_SEASON_CALENDAR = {
  1: {
    fruits: ["Orange", "Clémentine", "Mandarine", "Pamplemousse", "Kiwi", "Poire", "Pomme"],
    legumes: ["Poireau", "Carotte", "Céleri-rave", "Chou", "Endive", "Potiron", "Navet", "Panais", "Topinambour", "Mâche"],
  },
  2: {
    fruits: ["Orange", "Clémentine", "Pamplemousse", "Kiwi", "Poire", "Pomme"],
    legumes: ["Poireau", "Carotte", "Céleri-rave", "Chou", "Endive", "Épinard", "Navet", "Panais", "Topinambour"],
  },
  3: {
    fruits: ["Orange", "Kiwi", "Poire", "Pomme", "Rhubarbe"],
    legumes: ["Poireau", "Carotte", "Épinard", "Radis", "Navet", "Blette", "Chou-fleur", "Artichaut"],
  },
  4: {
    fruits: ["Pomme", "Poire", "Rhubarbe", "Fraise"],
    legumes: ["Asperge", "Radis", "Épinard", "Petits pois", "Artichaut", "Carotte nouvelle", "Blette"],
  },
  5: {
    fruits: ["Fraise", "Rhubarbe", "Cerise"],
    legumes: ["Asperge", "Petits pois", "Radis", "Artichaut", "Courgette", "Épinard", "Fève"],
  },
  6: {
    fruits: ["Fraise", "Cerise", "Abricot", "Melon", "Framboise"],
    legumes: ["Courgette", "Tomate", "Concombre", "Petits pois", "Haricot vert", "Radis", "Fève"],
  },
  7: {
    fruits: ["Abricot", "Pêche", "Nectarine", "Melon", "Framboise", "Cerise", "Myrtille"],
    legumes: ["Tomate", "Courgette", "Aubergine", "Poivron", "Concombre", "Haricot vert", "Maïs"],
  },
  8: {
    fruits: ["Framboise", "Groseille", "Melon", "Mûre", "Myrtille", "Nectarine", "Pastèque", "Pêche", "Poire", "Prune", "Tomate"],
    legumes: ["Artichaut", "Aubergine", "Betterave", "Courgette", "Poivron", "Maïs", "Haricot vert", "Concombre"],
  },
  9: {
    fruits: ["Raisin", "Poire", "Pomme", "Figue", "Prune", "Mirabelle"],
    legumes: ["Potiron", "Courge", "Poireau", "Champignon", "Aubergine", "Poivron", "Betterave"],
  },
  10: {
    fruits: ["Raisin", "Pomme", "Poire", "Coing", "Figue", "Noix"],
    legumes: ["Potiron", "Courge", "Champignon", "Céleri-rave", "Chou", "Brocoli", "Poireau", "Panais"],
  },
  11: {
    fruits: ["Pomme", "Poire", "Kiwi", "Coing", "Marron"],
    legumes: ["Potimarron", "Chou", "Poireau", "Céleri-rave", "Endive", "Navet", "Topinambour", "Mâche"],
  },
  12: {
    fruits: ["Pomme", "Poire", "Orange", "Clémentine", "Kiwi", "Marron"],
    legumes: ["Poireau", "Chou", "Endive", "Céleri-rave", "Potimarron", "Panais", "Topinambour", "Mâche"],
  },
};
 
// Pictogrammes Unicode qui représentent VRAIMENT le fruit/légume en question (pas un à-peu-près).
// Le jeu d'emoji fruits & légumes est limité : la plupart des légumes d'hiver, petits fruits
// rouges et fruits à noyau autres que la pêche n'ont pas d'emoji dédié. Plutôt que d'afficher
// une image inexacte, ProduceIcon retombe sur une pastille avec l'initiale pour ces cas-là.
const PRODUCE_EMOJI = {
  "Fraise": "🍓", "Melon": "🍈", "Pastèque": "🍉", "Pêche": "🍑", "Nectarine": "🍑",
  "Poire": "🍐", "Pomme": "🍎", "Raisin": "🍇", "Cerise": "🍒", "Myrtille": "🫐",
  "Kiwi": "🥝", "Orange": "🍊", "Clémentine": "🍊", "Mandarine": "🍊",
  "Marron": "🌰", "Châtaigne": "🌰",
  "Tomate": "🍅", "Maïs": "🌽", "Carotte": "🥕", "Carotte nouvelle": "🥕",
  "Aubergine": "🍆", "Poivron": "🫑", "Concombre": "🥒", "Champignon": "🍄",
  "Ail": "🧄", "Oignon": "🧅", "Chou": "🥬", "Brocoli": "🥦",
};
 
// Prix moyens ESTIMÉS pour 2 personnes (pas des prix scrapés en temps réel).
// Certains postes à fort impact (poulet, bœuf haché, saumon) ont été recalés à la marge
// après un contrôle ponctuel sur des prix publiés Leclerc/Carrefour/Intermarché — pas un
// scraping exhaustif des enseignes, juste un ordre de grandeur vérifié sur les ingrédients
// qui pèsent le plus dans le budget. Le reste du catalogue reste une estimation raisonnée.
// style: healthy | gourmand | proteine | anti-inflammatoire (cumulables).
// base: ingrédient pivot pour le batch cooking (même ingrédient acheté en plus grande
// quantité, utilisé dans 2 recettes DIFFÉRENTES — pas le même plat mangé deux fois).
// dinnerOnly: plat plutôt long/familial, réservé aux dîners (pas proposé au déjeuner).
const RECIPES = [
  { id: 1, name: "Pâtes à la carbonara", tags: ["viande", "rapide"], style: ["gourmand"], base: "Lardons", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Lardons", q: 150, u: "g", c: "Viande & poisson", p: 2.20 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Crème fraîche", q: 20, u: "cl", c: "Crèmerie", p: 0.90 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
    ] },
  { id: 2, name: "Poulet rôti & légumes", tags: ["viande"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Cuisses de poulet", dinnerOnly: true, diff: "moyen", gluten: false, time: 60,
    ing: [
      { n: "Cuisses de poulet", q: 4, u: "pièce", c: "Viande & poisson", p: 4.50 },
      { n: "Pommes de terre", q: 600, u: "g", c: "Fruits & légumes", p: 0.90 },
      { n: "Carottes", q: 300, u: "g", c: "Fruits & légumes", p: 0.60 },
      { n: "Oignon", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Thym", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 3, name: "Curry de pois chiches", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Pois chiches", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Pois chiches", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Lait de coco", q: 200, u: "ml", c: "Féculents & épicerie", p: 1.20 },
      { n: "Tomates concassées", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.80 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Épices curry", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 4, name: "Saumon poêlé, riz basmati", tags: ["poisson", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Pavés de saumon", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Pavés de saumon", q: 2, u: "pièce", c: "Viande & poisson", p: 5.50 },
      { n: "Riz basmati", q: 200, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Brocoli", q: 300, u: "g", c: "Fruits & légumes", p: 1.10 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 5, name: "Chili con carne", tags: ["viande"], style: ["proteine"], base: "Bœuf haché", diff: "moyen", gluten: false, time: 35,
    ing: [
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Haricots rouges", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Tomates concassées", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.80 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 6, name: "Omelette champignons, salade", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Œufs", diff: "facile", gluten: false, time: 15,
    ing: [
      { n: "Œufs", q: 6, u: "pièce", c: "Crèmerie", p: 1.80 },
      { n: "Champignons", q: 250, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Vinaigrette", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 7, name: "Gratin dauphinois, jambon", tags: ["viande"], style: ["gourmand"], base: "Jambon", dinnerOnly: true, diff: "moyen", gluten: true, time: 70,
    ing: [
      { n: "Pommes de terre", q: 800, u: "g", c: "Fruits & légumes", p: 1.20 },
      { n: "Crème fraîche", q: 40, u: "cl", c: "Crèmerie", p: 1.60 },
      { n: "Gruyère râpé", q: 100, u: "g", c: "Crèmerie", p: 1.50 },
      { n: "Jambon", q: 4, u: "tranche", c: "Viande & poisson", p: 2.80 },
    ] },
  { id: 8, name: "Wok de nouilles au poulet", tags: ["viande", "rapide"], style: ["proteine"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Nouilles chinoises", q: 200, u: "g", c: "Féculents & épicerie", p: 1.00 },
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Légumes wok", q: 400, u: "g", c: "Surgelés", p: 1.80 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 9, name: "Soupe de légumes, croûtons", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Légumes à soupe", diff: "facile", gluten: true, time: 30,
    ing: [
      { n: "Légumes à soupe", q: 800, u: "g", c: "Fruits & légumes", p: 1.60 },
      { n: "Pain (pour croûtons)", q: 4, u: "tranche", c: "Boulangerie", p: 0.60 },
      { n: "Crème fraîche", q: 10, u: "cl", c: "Crèmerie", p: 0.50 },
    ] },
  { id: 10, name: "Steak haché, frites maison", tags: ["viande", "rapide"], style: ["proteine", "gourmand"], base: "Steaks hachés", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Steaks hachés", q: 4, u: "pièce", c: "Viande & poisson", p: 4.00 },
      { n: "Frites surgelées", q: 600, u: "g", c: "Surgelés", p: 1.80 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 11, name: "Risotto aux champignons", tags: ["vegetarien"], style: ["gourmand"], base: "Champignons", dinnerOnly: true, diff: "moyen", gluten: false, time: 40,
    ing: [
      { n: "Riz arborio", q: 250, u: "g", c: "Féculents & épicerie", p: 1.20 },
      { n: "Champignons", q: 300, u: "g", c: "Fruits & légumes", p: 1.80 },
      { n: "Parmesan", q: 40, u: "g", c: "Crèmerie", p: 1.60 },
      { n: "Bouillon de légumes", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
    ] },
  { id: 12, name: "Tacos au bœuf", tags: ["viande", "rapide"], style: ["gourmand"], base: "Bœuf haché", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Tortillas", q: 6, u: "pièce", c: "Féculents & épicerie", p: 1.80 },
      { n: "Tomates", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Salade verte", q: 0.5, u: "pièce", c: "Fruits & légumes", p: 0.50 },
      { n: "Fromage râpé", q: 100, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Sauce tacos", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 13, name: "Quiche lorraine, salade", tags: ["viande"], style: ["gourmand"], base: "Lardons", diff: "moyen", gluten: true, time: 50,
    ing: [
      { n: "Pâte brisée", q: 1, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Lardons", q: 150, u: "g", c: "Viande & poisson", p: 2.20 },
      { n: "Œufs", q: 3, u: "pièce", c: "Crèmerie", p: 0.90 },
      { n: "Crème fraîche", q: 20, u: "cl", c: "Crèmerie", p: 0.90 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 14, name: "Cabillaud en papillote", tags: ["poisson"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Dos de cabillaud", diff: "facile", gluten: false, time: 30,
    ing: [
      { n: "Dos de cabillaud", q: 2, u: "pièce", c: "Viande & poisson", p: 6.00 },
      { n: "Courgette", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Tomates cerises", q: 200, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 15, name: "Ratatouille, œuf poché", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Œufs", dinnerOnly: true, diff: "moyen", gluten: true, time: 45,
    ing: [
      { n: "Aubergine", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Courgette", q: 2, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Poivron", q: 2, u: "pièce", c: "Fruits & légumes", p: 1.40 },
      { n: "Tomates", q: 3, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
    ] },
  { id: 16, name: "Croque-monsieur, salade", tags: ["viande", "rapide"], style: ["gourmand"], base: "Jambon", diff: "facile", gluten: true, time: 15,
    ing: [
      { n: "Pain de mie", q: 6, u: "tranche", c: "Boulangerie", p: 1.00 },
      { n: "Jambon", q: 4, u: "tranche", c: "Viande & poisson", p: 2.80 },
      { n: "Gruyère râpé", q: 100, u: "g", c: "Crèmerie", p: 1.50 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 17, name: "Lasagnes bolognaise", tags: ["viande"], style: ["gourmand", "proteine"], base: "Bœuf haché", dinnerOnly: true, diff: "moyen", gluten: true, time: 60,
    ing: [
      { n: "Plaques de lasagnes", q: 250, u: "g", c: "Féculents & épicerie", p: 1.20 },
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Sauce tomate", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Béchamel", q: 1, u: "brique", c: "Crèmerie", p: 1.50 },
      { n: "Gruyère râpé", q: 80, u: "g", c: "Crèmerie", p: 1.20 },
    ] },
  { id: 18, name: "Dahl de lentilles corail", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Lentilles corail", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Lentilles corail", q: 250, u: "g", c: "Féculents & épicerie", p: 0.90 },
      { n: "Lait de coco", q: 200, u: "ml", c: "Féculents & épicerie", p: 1.20 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Épices curry", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 19, name: "Gnocchis au chorizo", tags: ["viande", "rapide"], style: ["gourmand"], base: "Chorizo", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Gnocchis", q: 500, u: "g", c: "Féculents & épicerie", p: 1.60 },
      { n: "Chorizo", q: 100, u: "g", c: "Viande & poisson", p: 2.20 },
      { n: "Tomates cerises", q: 200, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
    ] },
  { id: 20, name: "Pizza maison margherita", tags: ["vegetarien"], style: ["gourmand"], base: "Mozzarella", diff: "moyen", gluten: true, time: 40,
    ing: [
      { n: "Pâte à pizza", q: 1, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Sauce tomate", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Mozzarella", q: 125, u: "g", c: "Crèmerie", p: 1.40 },
      { n: "Basilic", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 21, name: "Sauté de porc au curry, riz", tags: ["viande"], style: ["proteine"], base: "Sauté de porc", diff: "moyen", gluten: false, time: 35,
    ing: [
      { n: "Sauté de porc", q: 300, u: "g", c: "Viande & poisson", p: 3.90 },
      { n: "Lait de coco", q: 200, u: "ml", c: "Féculents & épicerie", p: 1.20 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Épices curry", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 22, name: "Salade de thon et pâtes", tags: ["poisson", "rapide"], style: ["healthy", "proteine"], base: "Thon en boîte", diff: "facile", gluten: true, time: 15,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Thon en boîte", q: 2, u: "boîte", c: "Viande & poisson", p: 2.60 },
      { n: "Tomates cerises", q: 200, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Maïs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.70 },
      { n: "Vinaigrette", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 23, name: "Burger maison, salade", tags: ["viande"], style: ["gourmand", "proteine"], base: "Steaks hachés", diff: "moyen", gluten: true, time: 30,
    ing: [
      { n: "Pains à burger", q: 4, u: "pièce", c: "Boulangerie", p: 1.60 },
      { n: "Steaks hachés", q: 4, u: "pièce", c: "Viande & poisson", p: 4.00 },
      { n: "Fromage à burger", q: 4, u: "tranche", c: "Crèmerie", p: 1.60 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Tomates", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.80 },
    ] },
  { id: 24, name: "Velouté de courgettes, pain", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Courgettes", diff: "facile", gluten: true, time: 25,
    ing: [
      { n: "Courgettes", q: 800, u: "g", c: "Fruits & légumes", p: 1.60 },
      { n: "Crème fraîche", q: 15, u: "cl", c: "Crèmerie", p: 0.70 },
      { n: "Pain", q: 1, u: "pièce", c: "Boulangerie", p: 1.00 },
    ] },
 
  /* --- Inspirées de tendances food TikTok / Loulou Kitchen --- */
  { id: 25, name: "Riz frit au poulet, légumes du frigo", tags: ["viande", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Carottes", q: 150, u: "g", c: "Fruits & légumes", p: 0.30 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Champignons", q: 150, u: "g", c: "Fruits & légumes", p: 0.90 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 26, name: "Poulet croustillant au miel, haricots verts", tags: ["viande"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "moyen", gluten: true, time: 35,
    ing: [
      { n: "Blancs de poulet", q: 400, u: "g", c: "Viande & poisson", p: 4.30 },
      { n: "Corn flakes nature", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Haricots verts surgelés", q: 400, u: "g", c: "Surgelés", p: 1.60 },
      { n: "Yaourt grec", q: 2, u: "pièce", c: "Crèmerie", p: 1.00 },
    ] },
  { id: 27, name: "Bowl poulet, riz, avocat", tags: ["viande", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Blancs de poulet", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Tomates cerises", q: 150, u: "g", c: "Fruits & légumes", p: 1.10 },
      { n: "Maïs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.70 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 28, name: "Wrap César au poulet croustillant", tags: ["viande", "rapide"], style: ["gourmand"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Tortillas", q: 4, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Salade romaine", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Sauce César", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.90 },
      { n: "Croûtons", q: 50, u: "g", c: "Féculents & épicerie", p: 0.60 },
    ] },
  { id: 29, name: "Pâtes crémeuses au fromage ail & fines herbes", tags: ["vegetarien", "rapide"], style: ["gourmand"], base: "Fromage ail & fines herbes", diff: "facile", gluten: true, time: 15,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Fromage ail & fines herbes", q: 1, u: "pièce", c: "Crèmerie", p: 2.20 },
      { n: "Lait", q: 10, u: "cl", c: "Crèmerie", p: 0.30 },
      { n: "Parmesan", q: 20, u: "g", c: "Crèmerie", p: 0.80 },
      { n: "Tomates cerises", q: 150, u: "g", c: "Fruits & légumes", p: 1.10 },
    ] },
  { id: 30, name: "Pâtes au four, feta et tomates cerises", tags: ["vegetarien"], style: ["gourmand", "healthy", "anti-inflammatoire"], base: "Feta", diff: "moyen", gluten: true, time: 40,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Feta", q: 200, u: "g", c: "Crèmerie", p: 2.40 },
      { n: "Tomates cerises", q: 400, u: "g", c: "Fruits & légumes", p: 2.80 },
      { n: "Ail", q: 3, u: "gousse", c: "Fruits & légumes", p: 0.30 },
      { n: "Basilic", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 31, name: "Poke bowl saumon, avocat, riz vinaigré", tags: ["poisson", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Pavés de saumon", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Pavés de saumon", q: 200, u: "g", c: "Viande & poisson", p: 4.50 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Edamame", q: 100, u: "g", c: "Surgelés", p: 1.20 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 32, name: "Soupe de poulet à l'orzo et citron", tags: ["viande"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Cuisses de poulet", diff: "moyen", gluten: true, time: 45,
    ing: [
      { n: "Cuisses de poulet", q: 2, u: "pièce", c: "Viande & poisson", p: 2.30 },
      { n: "Orzo (pâtes)", q: 150, u: "g", c: "Féculents & épicerie", p: 0.70 },
      { n: "Carottes", q: 200, u: "g", c: "Fruits & légumes", p: 0.40 },
      { n: "Céleri", q: 1, u: "branche", c: "Fruits & légumes", p: 0.40 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
    ] },
  { id: 33, name: "Poulet mariné soja-miel, riz vapeur", tags: ["viande", "rapide"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 34, name: "Wraps healthy thon, avocat", tags: ["poisson", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Thon en boîte", diff: "facile", gluten: true, time: 15,
    ing: [
      { n: "Thon en boîte", q: 2, u: "boîte", c: "Viande & poisson", p: 2.60 },
      { n: "Tortillas", q: 4, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Maïs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.70 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 35, name: "Pâtes crémeuses tomate épicée (façon vodka pasta)", tags: ["vegetarien"], style: ["gourmand"], base: "Pâtes", diff: "facile", gluten: true, time: 25,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Sauce tomate", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Crème fraîche", q: 15, u: "cl", c: "Crèmerie", p: 0.70 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Ail", q: 2, u: "gousse", c: "Fruits & légumes", p: 0.20 },
      { n: "Basilic", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 36, name: "Poulet crémeux tomates séchées (façon Marry Me Chicken)", tags: ["viande"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "moyen", gluten: false, time: 30,
    ing: [
      { n: "Blancs de poulet", q: 350, u: "g", c: "Viande & poisson", p: 3.75 },
      { n: "Crème fraîche", q: 20, u: "cl", c: "Crèmerie", p: 0.90 },
      { n: "Tomates séchées", q: 60, u: "g", c: "Féculents & épicerie", p: 1.80 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Ail", q: 2, u: "gousse", c: "Fruits & légumes", p: 0.20 },
      { n: "Bouillon de légumes", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 37, name: "Salade healthy façon green goddess, poulet grillé", tags: ["viande", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Blancs de poulet", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Salade romaine", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Yaourt grec", q: 2, u: "pièce", c: "Crèmerie", p: 1.00 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Herbes fraîches", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 38, name: "Bowl cottage cheese, fruits rouges et granola", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine"], base: "Cottage cheese", diff: "facile", gluten: true, time: 5, exotic: true,
    ing: [
      { n: "Cottage cheese", q: 400, u: "g", c: "Crèmerie", p: 3.20 },
      { n: "Fruits rouges surgelés", q: 200, u: "g", c: "Surgelés", p: 2.00 },
      { n: "Granola", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
    ] },
  { id: 39, name: "Toast avocat, œuf poché, dukkah", tags: ["vegetarien", "rapide"], style: ["healthy", "anti-inflammatoire"], base: "Avocat", diff: "facile", gluten: true, time: 15, exotic: true,
    ing: [
      { n: "Pain de campagne", q: 4, u: "tranche", c: "Boulangerie", p: 1.20 },
      { n: "Avocat", q: 2, u: "pièce", c: "Fruits & légumes", p: 2.40 },
      { n: "Œufs", q: 4, u: "pièce", c: "Crèmerie", p: 1.20 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Dukkah (graines, épices)", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
    ] },
  { id: 40, name: "Crispy rice salad façon TikTok, saumon fumé", tags: ["poisson", "rapide"], style: ["gourmand", "proteine"], base: "Riz", diff: "moyen", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Riz", q: 250, u: "g", c: "Féculents & épicerie", p: 0.65 },
      { n: "Saumon fumé", q: 150, u: "g", c: "Viande & poisson", p: 4.50 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Sriracha", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Mayonnaise", q: 1, u: "sachet", c: "Crèmerie", p: 0.50 },
    ] },
  { id: 41, name: "Salmon bowl façon TikTok, riz, concombre, sriracha", tags: ["poisson", "rapide"], style: ["gourmand", "proteine", "anti-inflammatoire"], base: "Pavés de saumon", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Pavés de saumon", q: 300, u: "g", c: "Viande & poisson", p: 6.50 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Fromage frais", q: 100, u: "g", c: "Crèmerie", p: 1.60 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Sriracha", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Oignons frits", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 42, name: "Big Mac salad (salade façon burger)", tags: ["viande", "rapide"], style: ["gourmand", "proteine"], base: "Bœuf haché", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Cornichons", q: 1, u: "boîte", c: "Féculents & épicerie", p: 1.20 },
      { n: "Fromage à burger", q: 2, u: "tranche", c: "Crèmerie", p: 0.80 },
      { n: "Tomates", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
      { n: "Sauce burger", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
    ] },
  { id: 43, name: "Riz frit façon kimchi, œuf au plat", tags: ["vegetarien", "rapide"], style: ["gourmand", "anti-inflammatoire"], base: "Riz", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Riz", q: 300, u: "g", c: "Féculents & épicerie", p: 0.75 },
      { n: "Kimchi", q: 200, u: "g", c: "Féculents & épicerie", p: 2.40 },
      { n: "Œufs", q: 4, u: "pièce", c: "Crèmerie", p: 1.20 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Huile de sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 44, name: "Butter chicken maison (murgh makhani), riz basmati", tags: ["viande"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "moyen", gluten: false, time: 40,
    ing: [
      { n: "Blancs de poulet", q: 400, u: "g", c: "Viande & poisson", p: 4.30 },
      { n: "Tomates concassées", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.80 },
      { n: "Crème fraîche", q: 20, u: "cl", c: "Crèmerie", p: 0.90 },
      { n: "Garam masala", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
      { n: "Riz basmati", q: 200, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Ail-gingembre frais", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 45, name: "Tacos birria maison, consommé", tags: ["viande"], style: ["gourmand", "proteine"], base: "Bœuf haché", dinnerOnly: true, diff: "moyen", gluten: true, time: 60,
    ing: [
      { n: "Bœuf haché", q: 400, u: "g", c: "Viande & poisson", p: 5.20 },
      { n: "Tortillas", q: 8, u: "pièce", c: "Féculents & épicerie", p: 2.40 },
      { n: "Fromage râpé", q: 100, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Épices mexicaines", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
      { n: "Tomates concassées", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.80 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
    ] },
  { id: 46, name: "Smash burger tacos", tags: ["viande", "rapide"], style: ["gourmand"], base: "Steaks hachés", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Steaks hachés", q: 4, u: "pièce", c: "Viande & poisson", p: 4.00 },
      { n: "Tortillas", q: 6, u: "pièce", c: "Féculents & épicerie", p: 1.80 },
      { n: "Fromage à burger", q: 4, u: "tranche", c: "Crèmerie", p: 1.60 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Sauce burger", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
    ] },
  { id: 47, name: "Crunchwrap maison", tags: ["viande", "rapide"], style: ["gourmand"], base: "Bœuf haché", diff: "moyen", gluten: true, time: 20,
    ing: [
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Tortillas", q: 4, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Fromage râpé", q: 100, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Tomates", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
      { n: "Salade verte", q: 0.5, u: "pièce", c: "Fruits & légumes", p: 0.50 },
      { n: "Sauce tacos", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 48, name: "Nouilles gochujang épicées au poulet", tags: ["viande", "rapide"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Nouilles chinoises", q: 200, u: "g", c: "Féculents & épicerie", p: 1.00 },
      { n: "Sauce gochujang", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Carottes", q: 100, u: "g", c: "Fruits & légumes", p: 0.20 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 49, name: "Saumon laqué au miso", tags: ["poisson", "rapide"], style: ["gourmand", "proteine", "anti-inflammatoire"], base: "Pavés de saumon", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Pavés de saumon", q: 2, u: "pièce", c: "Viande & poisson", p: 5.50 },
      { n: "Pâte miso", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.90 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Brocoli", q: 250, u: "g", c: "Fruits & légumes", p: 0.90 },
    ] },
  { id: 50, name: "Poulet pop-corn croustillant, sauce miel-sriracha", tags: ["viande"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "moyen", gluten: true, time: 35,
    ing: [
      { n: "Blancs de poulet", q: 400, u: "g", c: "Viande & poisson", p: 4.30 },
      { n: "Chapelure", q: 100, u: "g", c: "Féculents & épicerie", p: 1.20 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Sriracha", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 51, name: "Tuna sushi bake (façon California roll gratiné)", tags: ["poisson"], style: ["gourmand", "proteine"], base: "Thon en boîte", diff: "facile", gluten: false, time: 35, exotic: true,
    ing: [
      { n: "Thon en boîte", q: 3, u: "boîte", c: "Viande & poisson", p: 3.90 },
      { n: "Riz", q: 250, u: "g", c: "Féculents & épicerie", p: 0.65 },
      { n: "Fromage frais", q: 100, u: "g", c: "Crèmerie", p: 1.60 },
      { n: "Mayonnaise", q: 1, u: "sachet", c: "Crèmerie", p: 0.50 },
      { n: "Sriracha", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Algues nori", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.90 },
    ] },
  { id: 52, name: "Katsu curry, poulet pané, riz", tags: ["viande"], style: ["gourmand"], base: "Blancs de poulet", diff: "moyen", gluten: true, time: 35,
    ing: [
      { n: "Blancs de poulet", q: 400, u: "g", c: "Viande & poisson", p: 4.30 },
      { n: "Chapelure", q: 100, u: "g", c: "Féculents & épicerie", p: 1.20 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Sauce curry japonaise", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.20 },
      { n: "Carottes", q: 150, u: "g", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 53, name: "Salade d'orzo méditerranéenne, feta", tags: ["vegetarien", "rapide"], style: ["healthy", "gourmand", "anti-inflammatoire"], base: "Feta", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Orzo (pâtes)", q: 250, u: "g", c: "Féculents & épicerie", p: 1.10 },
      { n: "Feta", q: 150, u: "g", c: "Crèmerie", p: 1.80 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Tomates cerises", q: 200, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Olives", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 54, name: "Falafels maison, sauce tahini", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Pois chiches", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Pois chiches", q: 2, u: "boîte", c: "Féculents & épicerie", p: 1.80 },
      { n: "Pain pita", q: 4, u: "pièce", c: "Boulangerie", p: 1.60 },
      { n: "Sauce tahini", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.00 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Tomates", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
    ] },
  { id: 55, name: "Shakshuka classique, pain", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Œufs", diff: "facile", gluten: true, time: 30,
    ing: [
      { n: "Œufs", q: 4, u: "pièce", c: "Crèmerie", p: 1.20 },
      { n: "Tomates concassées", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.80 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Cumin", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Pain", q: 1, u: "pièce", c: "Boulangerie", p: 1.00 },
    ] },
  { id: 56, name: "Green shakshuka, épinards et feta", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Œufs", diff: "moyen", gluten: true, time: 30,
    ing: [
      { n: "Œufs", q: 4, u: "pièce", c: "Crèmerie", p: 1.20 },
      { n: "Épinards surgelés", q: 300, u: "g", c: "Surgelés", p: 1.50 },
      { n: "Feta", q: 100, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Ail", q: 2, u: "gousse", c: "Fruits & légumes", p: 0.20 },
      { n: "Pain", q: 1, u: "pièce", c: "Boulangerie", p: 1.00 },
    ] },
  { id: 57, name: "Ramen maison rapide, œuf mollet", tags: ["vegetarien", "rapide"], style: ["gourmand"], base: "Nouilles chinoises", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Nouilles chinoises", q: 250, u: "g", c: "Féculents & épicerie", p: 1.20 },
      { n: "Bouillon de légumes", q: 2, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Champignons", q: 150, u: "g", c: "Fruits & légumes", p: 0.90 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Oignon nouveau", q: 1, u: "botte", c: "Fruits & légumes", p: 0.80 },
    ] },
  { id: 58, name: "Bibimbap simplifié, bœuf", tags: ["viande"], style: ["proteine"], base: "Bœuf haché", diff: "moyen", gluten: true, time: 30, exotic: true,
    ing: [
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Riz", q: 250, u: "g", c: "Féculents & épicerie", p: 0.65 },
      { n: "Carottes", q: 150, u: "g", c: "Fruits & légumes", p: 0.30 },
      { n: "Épinards surgelés", q: 200, u: "g", c: "Surgelés", p: 1.00 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Sauce gochujang", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
    ] },
  { id: 59, name: "Tofu croustillant, sauce cacahuète", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Tofu", diff: "facile", gluten: false, time: 20, exotic: true,
    ing: [
      { n: "Tofu ferme", q: 400, u: "g", c: "Féculents & épicerie", p: 2.80 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Sauce cacahuète", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.00 },
      { n: "Carottes", q: 150, u: "g", c: "Fruits & légumes", p: 0.30 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Cacahuètes concassées", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
    ] },
  { id: 60, name: "Curry vert thaï, légumes", tags: ["vegetarien", "rapide"], style: ["healthy", "anti-inflammatoire"], base: "Lait de coco", diff: "facile", gluten: false, time: 20, exotic: true,
    ing: [
      { n: "Lait de coco", q: 400, u: "ml", c: "Féculents & épicerie", p: 2.00 },
      { n: "Pâte de curry vert", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.20 },
      { n: "Aubergine", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Basilic", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 61, name: "Soupe miso, saumon, nouilles udon", tags: ["poisson", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Pavés de saumon", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Pavés de saumon", q: 200, u: "g", c: "Viande & poisson", p: 4.20 },
      { n: "Nouilles udon", q: 200, u: "g", c: "Féculents & épicerie", p: 1.60 },
      { n: "Pâte miso", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.90 },
      { n: "Champignons", q: 150, u: "g", c: "Fruits & légumes", p: 0.90 },
      { n: "Oignon nouveau", q: 1, u: "botte", c: "Fruits & légumes", p: 0.80 },
    ] },
  { id: 62, name: "Salade César crispy kale, poulet pané", tags: ["viande"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "moyen", gluten: true, time: 30,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Chou kale", q: 200, u: "g", c: "Fruits & légumes", p: 1.60 },
      { n: "Chapelure", q: 80, u: "g", c: "Féculents & épicerie", p: 1.00 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Sauce César", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.90 },
      { n: "Croûtons", q: 50, u: "g", c: "Féculents & épicerie", p: 0.60 },
    ] },
  { id: 63, name: "Bowl méditerranéen, houmous, poulet", tags: ["viande", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Blancs de poulet", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Houmous", q: 200, u: "g", c: "Féculents & épicerie", p: 2.00 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Tomates cerises", q: 150, u: "g", c: "Fruits & légumes", p: 1.10 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 64, name: "Pâtes au pesto pistache-citron", tags: ["vegetarien", "rapide"], style: ["gourmand"], base: "Pâtes", diff: "facile", gluten: true, time: 15,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Pesto pistache", q: 1, u: "sachet", c: "Féculents & épicerie", p: 2.20 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Parmesan", q: 30, u: "g", c: "Crèmerie", p: 1.20 },
      { n: "Roquette", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 65, name: "Riz de chou-fleur bowl teriyaki, poulet", tags: ["viande", "rapide"], style: ["healthy", "proteine"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Riz de chou-fleur surgelé", q: 400, u: "g", c: "Surgelés", p: 2.40 },
      { n: "Sauce teriyaki", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 66, name: "Nouilles udon, sauce cacahuète, tofu", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine"], base: "Tofu", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Tofu ferme", q: 300, u: "g", c: "Féculents & épicerie", p: 2.10 },
      { n: "Nouilles udon", q: 250, u: "g", c: "Féculents & épicerie", p: 2.00 },
      { n: "Sauce cacahuète", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.00 },
      { n: "Carottes", q: 100, u: "g", c: "Fruits & légumes", p: 0.20 },
      { n: "Edamame", q: 100, u: "g", c: "Surgelés", p: 1.20 },
    ] },
  { id: 67, name: "Wrap falafel maison, sauce yaourt", tags: ["vegetarien", "rapide"], style: ["healthy"], base: "Pois chiches", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Pois chiches", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Tortillas", q: 4, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Yaourt grec", q: 2, u: "pièce", c: "Crèmerie", p: 1.00 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Tomates", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
      { n: "Épices curry", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 68, name: "Bowl teriyaki, tofu croustillant", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine"], base: "Tofu", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Tofu ferme", q: 400, u: "g", c: "Féculents & épicerie", p: 2.80 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Sauce teriyaki", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 69, name: "Curry rouge de crevettes, riz", tags: ["poisson", "rapide"], style: ["gourmand", "proteine", "anti-inflammatoire"], base: "Crevettes", diff: "facile", gluten: false, time: 20, exotic: true,
    ing: [
      { n: "Crevettes", q: 300, u: "g", c: "Viande & poisson", p: 5.50 },
      { n: "Lait de coco", q: 200, u: "ml", c: "Féculents & épicerie", p: 1.20 },
      { n: "Pâte de curry rouge", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.20 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 70, name: "Poke bowl thon épicé, riz vinaigré", tags: ["poisson", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Thon en boîte", diff: "facile", gluten: false, time: 15, exotic: true,
    ing: [
      { n: "Thon en boîte", q: 2, u: "boîte", c: "Viande & poisson", p: 2.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Sriracha", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Mayonnaise", q: 1, u: "sachet", c: "Crèmerie", p: 0.50 },
      { n: "Edamame", q: 100, u: "g", c: "Surgelés", p: 1.20 },
    ] },
  { id: 71, name: "Buddha bowl patate douce, pois chiches rôtis", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Pois chiches", diff: "facile", gluten: false, time: 35,
    ing: [
      { n: "Patate douce", q: 2, u: "pièce", c: "Fruits & légumes", p: 1.60 },
      { n: "Pois chiches", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Épinards", q: 150, u: "g", c: "Fruits & légumes", p: 1.20 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Épices curry", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 72, name: "Tacos poisson façon Baja, chou rouge", tags: ["poisson", "rapide"], style: ["healthy", "anti-inflammatoire"], base: "Dos de cabillaud", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Dos de cabillaud", q: 2, u: "pièce", c: "Viande & poisson", p: 6.00 },
      { n: "Tortillas", q: 6, u: "pièce", c: "Féculents & épicerie", p: 1.80 },
      { n: "Chou rouge", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Citron vert", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
      { n: "Yaourt grec", q: 2, u: "pièce", c: "Crèmerie", p: 1.00 },
    ] },
  { id: 73, name: "Poulet façon general tso, riz", tags: ["viande"], style: ["gourmand"], base: "Blancs de poulet", diff: "moyen", gluten: true, time: 30,
    ing: [
      { n: "Blancs de poulet", q: 400, u: "g", c: "Viande & poisson", p: 4.30 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 74, name: "Crevettes sautées à l'ail, riz coco", tags: ["poisson", "rapide"], style: ["gourmand", "proteine", "anti-inflammatoire"], base: "Crevettes", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Crevettes", q: 300, u: "g", c: "Viande & poisson", p: 5.50 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Lait de coco", q: 200, u: "ml", c: "Féculents & épicerie", p: 1.20 },
      { n: "Ail", q: 2, u: "gousse", c: "Fruits & légumes", p: 0.20 },
      { n: "Citron vert", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
    ] },
  { id: 75, name: "Halloumi grillé, salade pastèque", tags: ["vegetarien", "rapide"], style: ["healthy", "gourmand"], base: "Halloumi", diff: "facile", gluten: false, time: 15, exotic: true,
    ing: [
      { n: "Halloumi", q: 250, u: "g", c: "Crèmerie", p: 3.50 },
      { n: "Pastèque", q: 500, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Menthe fraîche", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 76, name: "Bowl saumon teriyaki, riz vapeur", tags: ["poisson", "rapide"], style: ["gourmand", "proteine", "anti-inflammatoire"], base: "Pavés de saumon", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Pavés de saumon", q: 2, u: "pièce", c: "Viande & poisson", p: 5.50 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Sauce teriyaki", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 77, name: "Curry de légumes rouge (thaï), tofu", tags: ["vegetarien"], style: ["healthy", "anti-inflammatoire"], base: "Tofu", diff: "facile", gluten: false, time: 25, exotic: true,
    ing: [
      { n: "Tofu ferme", q: 300, u: "g", c: "Féculents & épicerie", p: 2.10 },
      { n: "Lait de coco", q: 400, u: "ml", c: "Féculents & épicerie", p: 2.00 },
      { n: "Pâte de curry rouge", q: 1, u: "sachet", c: "Féculents & épicerie", p: 1.20 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 78, name: "Wrap poulet façon buffalo", tags: ["viande", "rapide"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Tortillas", q: 4, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Sauce buffalo", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Fromage à burger", q: 2, u: "tranche", c: "Crèmerie", p: 0.80 },
    ] },
  { id: 79, name: "Salade de pâtes italienne (TikTok pasta salad)", tags: ["vegetarien", "rapide"], style: ["gourmand"], base: "Pâtes", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Mozzarella", q: 125, u: "g", c: "Crèmerie", p: 1.40 },
      { n: "Tomates cerises", q: 200, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Olives", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
      { n: "Vinaigrette", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 80, name: "Pho maison rapide, bœuf", tags: ["viande"], style: ["healthy"], base: "Bœuf haché", diff: "moyen", gluten: false, time: 30,
    ing: [
      { n: "Bœuf haché", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Vermicelles de riz", q: 200, u: "g", c: "Féculents & épicerie", p: 1.00 },
      { n: "Bouillon de légumes", q: 2, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Coriandre fraîche", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 81, name: "Riz cantonais aux crevettes", tags: ["poisson", "rapide"], style: ["gourmand"], base: "Crevettes", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Crevettes", q: 250, u: "g", c: "Viande & poisson", p: 4.50 },
      { n: "Riz", q: 300, u: "g", c: "Féculents & épicerie", p: 0.75 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Petits pois surgelés", q: 150, u: "g", c: "Surgelés", p: 0.90 },
      { n: "Jambon", q: 2, u: "tranche", c: "Viande & poisson", p: 1.40 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 82, name: "Bowl mexicain, riz, haricots noirs, poulet", tags: ["viande"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Blancs de poulet", diff: "facile", gluten: false, time: 25,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.25 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Haricots noirs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Maïs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.70 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Tomates", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.40 },
    ] },
  { id: 83, name: "Dinde façon teriyaki, riz vapeur", tags: ["viande", "rapide"], style: ["healthy", "proteine"], base: "Blancs de dinde", diff: "facile", gluten: true, time: 20, exotic: true,
    ing: [
      { n: "Blancs de dinde", q: 350, u: "g", c: "Viande & poisson", p: 4.20 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Sauce teriyaki", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.80 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 84, name: "Merguez grillées, semoule aux légumes", tags: ["viande"], style: ["gourmand"], base: "Merguez", diff: "facile", gluten: true, time: 25,
    ing: [
      { n: "Merguez", q: 6, u: "pièce", c: "Viande & poisson", p: 3.60 },
      { n: "Semoule", q: 250, u: "g", c: "Féculents & épicerie", p: 0.80 },
      { n: "Courgette", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Ras el hanout", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
    ] },
 
  /* --- Recettes "Klar de groupe" : vacances (mer / montagne / rapide-pique-nique) ---
     Champ `vacation` (tableau, cumulable) en plus des champs existants. Prix calés sur les
     ingrédients déjà présents dans le catalogue ci-dessus (mêmes tarifs) pour ce qui est
     réutilisé, et sur des relevés publiés pour les ingrédients réellement nouveaux :
     - Baguette : ~0,55 € en grande surface (UFC-Que Choisir Haut-Rhin, relevé fév. 2025).
     - Fromage à raclette : 8 à 12 € / kg en grande surface, marque distributeur (FranceAgriMer
       via Statista 2025 / franceinfo) → base retenue 12 €/kg.
     - Reblochon laitier : 12 à 18 €/kg en supermarché → base retenue 14 €/kg.
     - Moules de bouchot : 2,50 à 4,50 €/kg en grande surface (hors poissonnerie à la coupe)
       → base retenue 4 €/kg.
     Comme pour le reste du catalogue : ordre de grandeur raisonné, pas un relevé en temps réel. */
  { id: 85, name: "Salade niçoise, pique-nique", tags: ["poisson", "rapide"], style: ["healthy", "proteine"], base: "Thon en boîte", diff: "facile", gluten: false, time: 20, vacation: ["mer", "rapide"],
    ing: [
      { n: "Thon en boîte", q: 2, u: "boîte", c: "Viande & poisson", p: 2.60 },
      { n: "Œufs", q: 3, u: "pièce", c: "Crèmerie", p: 0.90 },
      { n: "Tomates", q: 3, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Olives", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
      { n: "Haricots verts surgelés", q: 300, u: "g", c: "Surgelés", p: 1.20 },
      { n: "Pommes de terre", q: 400, u: "g", c: "Fruits & légumes", p: 0.60 },
      { n: "Vinaigrette", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 86, name: "Moules marinières express, frites", tags: ["poisson"], style: ["gourmand"], base: "Moules", dinnerOnly: true, diff: "moyen", gluten: false, time: 30, vacation: ["mer"],
    ing: [
      { n: "Moules", q: 1000, u: "g", c: "Viande & poisson", p: 4.00 },
      { n: "Crème fraîche", q: 20, u: "cl", c: "Crèmerie", p: 0.90 },
      { n: "Ail", q: 3, u: "gousse", c: "Fruits & légumes", p: 0.30 },
      { n: "Persil", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
      { n: "Frites surgelées", q: 600, u: "g", c: "Surgelés", p: 1.80 },
    ] },
  { id: 87, name: "Brochettes de crevettes grillées, riz citronné", tags: ["poisson", "rapide"], style: ["healthy", "proteine", "anti-inflammatoire"], base: "Crevettes", diff: "facile", gluten: false, time: 20, vacation: ["mer"],
    ing: [
      { n: "Crevettes", q: 300, u: "g", c: "Viande & poisson", p: 5.50 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Poivron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Courgette", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
    ] },
  { id: 88, name: "Tartiflette maison", tags: ["viande"], style: ["gourmand"], base: "Reblochon", dinnerOnly: true, diff: "moyen", gluten: false, time: 60, vacation: ["montagne"],
    ing: [
      { n: "Pommes de terre", q: 800, u: "g", c: "Fruits & légumes", p: 1.20 },
      { n: "Reblochon", q: 450, u: "g", c: "Crèmerie", p: 6.30 },
      { n: "Lardons", q: 150, u: "g", c: "Viande & poisson", p: 2.20 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Crème fraîche", q: 10, u: "cl", c: "Crèmerie", p: 0.50 },
    ] },
  { id: 89, name: "Raclette conviviale", tags: ["viande"], style: ["gourmand"], base: "Fromage à raclette", dinnerOnly: true, diff: "facile", gluten: false, time: 30, vacation: ["montagne"],
    ing: [
      { n: "Fromage à raclette", q: 400, u: "g", c: "Crèmerie", p: 4.80 },
      { n: "Pommes de terre", q: 800, u: "g", c: "Fruits & légumes", p: 1.20 },
      { n: "Jambon", q: 4, u: "tranche", c: "Viande & poisson", p: 2.80 },
      { n: "Cornichons", q: 1, u: "boîte", c: "Féculents & épicerie", p: 1.20 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 90, name: "Fondue savoyarde sans alcool", tags: ["vegetarien"], style: ["gourmand"], base: "Fromage à fondue", dinnerOnly: true, diff: "moyen", gluten: true, time: 35, vacation: ["montagne"],
    ing: [
      { n: "Fromage à fondue", q: 500, u: "g", c: "Crèmerie", p: 6.50 },
      { n: "Pain", q: 1, u: "pièce", c: "Boulangerie", p: 1.00 },
      { n: "Ail", q: 2, u: "gousse", c: "Fruits & légumes", p: 0.20 },
      { n: "Bouillon de légumes", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Cornichons", q: 1, u: "boîte", c: "Féculents & épicerie", p: 1.20 },
    ] },
  { id: 91, name: "Sandwich jambon-beurre, crudités", tags: ["viande", "rapide"], style: ["gourmand"], base: "Jambon", diff: "facile", gluten: true, time: 10, vacation: ["rapide", "mer", "montagne"],
    ing: [
      { n: "Baguette", q: 4, u: "pièce", c: "Boulangerie", p: 2.40 },
      { n: "Beurre", q: 80, u: "g", c: "Crèmerie", p: 0.60 },
      { n: "Jambon", q: 4, u: "tranche", c: "Viande & poisson", p: 2.80 },
      { n: "Cornichons", q: 1, u: "boîte", c: "Féculents & épicerie", p: 1.20 },
      { n: "Tomates", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.80 },
    ] },
  { id: 92, name: "Sandwich œufs mayo, crudités", tags: ["vegetarien", "rapide"], style: ["gourmand"], base: "Œufs", diff: "facile", gluten: true, time: 15, vacation: ["rapide", "mer", "montagne"],
    ing: [
      { n: "Baguette", q: 4, u: "pièce", c: "Boulangerie", p: 2.40 },
      { n: "Œufs", q: 4, u: "pièce", c: "Crèmerie", p: 1.20 },
      { n: "Mayonnaise", q: 1, u: "sachet", c: "Crèmerie", p: 0.50 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Tomates", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.80 },
    ] },
  { id: 93, name: "Planche apéro plage, chips", tags: ["viande"], style: ["gourmand"], base: "Jambon", diff: "facile", gluten: false, time: 10, vacation: ["mer", "rapide"],
    ing: [
      { n: "Jambon", q: 4, u: "tranche", c: "Viande & poisson", p: 2.80 },
      { n: "Fromage à raclette", q: 200, u: "g", c: "Crèmerie", p: 2.40 },
      { n: "Chips", q: 150, u: "g", c: "Féculents & épicerie", p: 1.60 },
      { n: "Cornichons", q: 1, u: "boîte", c: "Féculents & épicerie", p: 1.20 },
      { n: "Olives", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
    ] },
  { id: 94, name: "Taboulé express, pique-nique", tags: ["vegetarien", "rapide"], style: ["healthy", "anti-inflammatoire"], base: "Semoule", diff: "facile", gluten: true, time: 15, vacation: ["rapide", "mer"],
    ing: [
      { n: "Semoule", q: 250, u: "g", c: "Féculents & épicerie", p: 0.80 },
      { n: "Tomates", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Menthe fraîche", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
];
 
// Recettes disponibles pour chaque "mode vacances" de Klar de groupe. Une recette taguée
// "rapide" est considérée utilisable dans n'importe quel contexte (mer ou montagne) en plus
// de son propre mode ; à l'inverse le mode "Rapide" seul ne garde que les recettes rapides.
function recipeMatchesVacation(r, vacationMode) {
  if (!vacationMode || vacationMode === "mixte") return true;
  const tags = r.vacation || [];
  if (tags.includes(vacationMode)) return true;
  if (vacationMode !== "rapide" && tags.includes("rapide")) return true;
  return false;
}
 
const PALETTE = ["#F2C14E", "#8FB9A8", "#E3A6A1", "#B9C6E0", "#D8B4E2"];
 
/* ------------------------------------------------------------------ */
/*  NUTRITION (estimation grossière)                                   */
/* ------------------------------------------------------------------ */
 
// Poids approx. (g) pour les ingrédients vendus "à la pièce" — grossier, pas une source pesée.
const PIECE_GRAMS = {
  "Œufs": 55, "Cuisses de poulet": 170, "Oignon": 110, "Pavés de saumon": 150, "Citron": 100,
  "Salade verte": 250, "Dos de cabillaud": 150, "Courgette": 200, "Tomates": 130, "Aubergine": 250,
  "Poivron": 150, "Pâte brisée": 230, "Steaks hachés": 125, "Salade romaine": 250, "Tortillas": 45,
  "Pains à burger": 80, "Avocat": 170, "Concombre": 280, "Pâte à pizza": 280, "Pain": 250,
  "Fromage ail & fines herbes": 150, "Patate douce": 200, "Citron vert": 50, "Merguez": 45,
  "Pain pita": 65, "Baguette": 250,
};
 
// Poids approx. (g) par défaut selon l'unité, quand ce n'est ni g/ml/cl/pièce.
const UNIT_GRAMS_DEFAULT = { boîte: 400, sachet: 10, tranche: 22, botte: 30, gousse: 5, branche: 40, brique: 250 };
 
function ingredientGrams(ing) {
  if (ing.u === "g" || ing.u === "ml") return ing.q;
  if (ing.u === "cl") return ing.q * 10;
  if (ing.u === "pièce") return ing.q * (PIECE_GRAMS[ing.n] || 100);
  return ing.q * (UNIT_GRAMS_DEFAULT[ing.u] || 50);
}
 
// Valeurs pour 100 g/ml, très grossières (par mots-clés puis repli par catégorie).
function nutriPer100g(name, cat) {
  const n = name.toLowerCase();
  if (/lardons|chorizo|merguez/.test(n)) return { kcal: 330, protein: 15 };
  if (/bœuf haché|boeuf haché/.test(n)) return { kcal: 215, protein: 20 };
  if (/poulet/.test(n)) return { kcal: 165, protein: 23 };
  if (/dinde/.test(n)) return { kcal: 135, protein: 29 };
  if (/porc/.test(n)) return { kcal: 200, protein: 21 };
  if (/jambon/.test(n)) return { kcal: 145, protein: 18 };
  if (/saumon/.test(n)) return { kcal: 200, protein: 20 };
  if (/cabillaud|thon/.test(n)) return { kcal: 105, protein: 23 };
  if (/crevettes/.test(n)) return { kcal: 95, protein: 22 };
  if (/tofu/.test(n)) return { kcal: 145, protein: 15 };
  if (/steaks? hach/.test(n)) return { kcal: 215, protein: 20 };
  if (/parmesan|gruyère|comté|reblochon|raclette|fondue/.test(n)) return { kcal: 380, protein: 26 };
  if (/halloumi/.test(n)) return { kcal: 320, protein: 22 };
  if (/moules/.test(n)) return { kcal: 85, protein: 12 };
  if (/beurre/.test(n)) return { kcal: 720, protein: 0.7 };
  if (/chips/.test(n)) return { kcal: 535, protein: 6 };
  if (/mozzarella|feta|cottage cheese|fromage/.test(n)) return { kcal: 240, protein: 18 };
  if (/crème fraîche|béchamel/.test(n)) return { kcal: 290, protein: 2.5 };
  if (/yaourt/.test(n)) return { kcal: 95, protein: 8 };
  if (/^lait$|lait de coco/.test(n)) return { kcal: 60, protein: 3.3 };
  if (/œufs?/.test(n)) return { kcal: 155, protein: 13 };
  if (/houmous/.test(n)) return { kcal: 170, protein: 8 };
  if (/kimchi/.test(n)) return { kcal: 25, protein: 1.5 };
  if (/granola/.test(n)) return { kcal: 450, protein: 10 };
  if (/pois chiches|haricots (rouges|noirs)|lentilles|edamame/.test(n)) return { kcal: 120, protein: 8 };
  if (/patate douce/.test(n)) return { kcal: 86, protein: 1.6 };
  if (/pâtes|nouilles|orzo|gnocchis|lasagnes|riz|tortillas|pain|baguette|frites|pomme|corn flakes|semoule|vermicelles|chapelure/.test(n)) return { kcal: 300, protein: 8 };
  if (/avocat/.test(n)) return { kcal: 160, protein: 2 };
  if (cat === "Fruits & légumes") return { kcal: 35, protein: 1.5 };
  if (cat === "Viande & poisson") return { kcal: 180, protein: 21 };
  if (cat === "Crèmerie") return { kcal: 150, protein: 9 };
  if (cat === "Féculents & épicerie") return { kcal: 250, protein: 7 };
  if (cat === "Boulangerie") return { kcal: 260, protein: 8 };
  if (cat === "Surgelés") return { kcal: 90, protein: 5 };
  return { kcal: 60, protein: 2 };
}
 
// Les quantités des recettes sont pour 2 personnes (cf. commentaire plus haut) → on divise par 2.
function recipeNutritionPerPerson(recipe) {
  let kcal = 0, protein = 0;
  recipe.ing.forEach((ing) => {
    const grams = ingredientGrams(ing);
    const per100 = nutriPer100g(ing.n, ing.c);
    kcal += (grams / 100) * per100.kcal;
    protein += (grams / 100) * per100.protein;
  });
  return { kcal: Math.round(kcal / 2 / 10) * 10, protein: Math.round(protein / 2) };
}
 
const NUTRITION_BY_ID = {};
RECIPES.forEach((r) => { NUTRITION_BY_ID[r.id] = recipeNutritionPerPerson(r); });
 
/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
 
function recipeCost(recipe, factor, storeMult, frozenOk) {
  return effectiveIngredients(recipe, frozenOk).reduce((sum, i) => sum + i.p * factor, 0) * storeMult;
}
 
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
 
function isIngredientInSeason(name, month) {
  const months = SEASON[name];
  return !months || months.includes(month);
}
 
// Ingrédients frais couramment vendus en version surgelée en supermarché français, avec un
// écart de prix indicatif (le surgelé coûte en général moins cher au kilo que le frais,
// surtout hors saison). Activé uniquement si la personne coche "OK pour les surgelés".
const FROZEN_SUBS = {
  "Brocoli": { name: "Brocoli surgelé", priceFactor: 0.55 },
  "Champignons": { name: "Champignons surgelés", priceFactor: 0.65 },
  "Poivron": { name: "Poivrons surgelés (émincés)", priceFactor: 0.60 },
  "Courgette": { name: "Courgette surgelée (rondelles)", priceFactor: 0.60 },
  "Courgettes": { name: "Courgettes surgelées (rondelles)", priceFactor: 0.60 },
  "Épinards": { name: "Épinards surgelés", priceFactor: 0.55 },
  "Carottes": { name: "Carottes surgelées", priceFactor: 0.75 },
  "Patate douce": { name: "Patate douce surgelée (cubes)", priceFactor: 0.65 },
};
 
function applyFrozenPreference(ing, frozenOk) {
  if (!frozenOk) return ing;
  const sub = FROZEN_SUBS[ing.n];
  if (!sub) return ing;
  return { ...ing, n: sub.name, c: "Surgelés", p: ing.p * sub.priceFactor };
}
 
function effectiveIngredients(recipe, frozenOk) {
  return recipe.ing.map((ing) => applyFrozenPreference(ing, frozenOk));
}
 
function recipeInSeason(r, month, frozenOk) {
  return r.ing.every((i) => {
    if (i.c !== "Fruits & légumes") return true;
    if (isIngredientInSeason(i.n, month)) return true;
    // Un légume frais hors saison ne bloque plus la recette si on accepte de le prendre
    // surgelé à la place : le surgelé est disponible toute l'année.
    return frozenOk && !!FROZEN_SUBS[i.n];
  });
}
 
function buildPool({ diet, styles, quickOnly, glutenFree, seasonal, month, excluded, original, frozenOk, vacationMode }) {
  // Les exclusions (allergies, dégoûts) sont une contrainte dure : jamais relâchée,
  // contrairement aux préférences ci-dessous qui cèdent en dernier recours.
  const excludeTest = (r) =>
    !excluded || excluded.length === 0 || !r.ing.some((i) => excluded.some((ex) => i.n.toLowerCase().includes(ex)));
  const base = RECIPES.filter(excludeTest);
  if (base.length === 0) return [];
 
  const dietTest = (r) =>
    diet === "tous" || (diet === "vegetarien" ? r.tags.includes("vegetarien") : !r.tags.includes("poisson"));
  const exoticTest = (r) => original || !r.exotic;
  const vacationTest = (r) => recipeMatchesVacation(r, vacationMode);
  const styleTest = (r) => !styles || styles.length === 0 || r.style.some((s) => styles.includes(s));
  const quickTest = (r) => !quickOnly || r.tags.includes("rapide");
  const glutenTest = (r) => !glutenFree || !r.gluten;
  const seasonTest = (r) => !seasonal || recipeInSeason(r, month, frozenOk);
 
  // Relâche progressivement les contraintes les moins prioritaires si le pool est vide.
  // "Recettes courantes uniquement" (pas de recette exotic) cède en avant-dernier recours,
  // juste avant le régime alimentaire — c'est la préférence la plus importante après le régime.
  // Le mode vacances (Klar de groupe) est un thème, pas une contrainte dure : il cède avant
  // le style, mais après les filtres rapide/sans gluten/saison.
  const layers = [
    [dietTest, exoticTest, styleTest, vacationTest, quickTest, glutenTest, seasonTest],
    [dietTest, exoticTest, styleTest, vacationTest, quickTest, glutenTest],
    [dietTest, exoticTest, styleTest, vacationTest, quickTest],
    [dietTest, exoticTest, styleTest, vacationTest],
    [dietTest, exoticTest, styleTest],
    [dietTest, exoticTest],
    [dietTest],
    [],
  ];
  for (const layer of layers) {
    const pool = base.filter((r) => layer.every((f) => f(r)));
    if (pool.length > 0) return pool;
  }
  return base;
}
 
const canLunch = (r) => !r.dinnerOnly;
 
// Décide comment répartir une paire de recettes (qui partagent un ingrédient pivot)
// entre les créneaux dîner et déjeuner restants. Priorité à la répartition croisée
// (une recette au dîner, l'autre au déjeuner) qui est le vrai objectif du batch cooking demandé.
function assignPair(a, b, dinnerSlots, lunchSlots) {
  const aLunch = canLunch(a), bLunch = canLunch(b);
  if (dinnerSlots >= 1 && lunchSlots >= 1) {
    if (aLunch && !bLunch) return ["dejeuner", "diner"];
    if (bLunch && !aLunch) return ["diner", "dejeuner"];
    if (aLunch && bLunch) return ["dejeuner", "diner"];
  }
  if (dinnerSlots >= 2) return ["diner", "diner"];
  if (lunchSlots >= 2 && aLunch && bLunch) return ["dejeuner", "dejeuner"];
  return null;
}
 
// Ordre de parcours du pool : aléatoire normalement, du moins cher au plus cher en mode
// "petit budget" pour caser un maximum de repas dans l'enveloppe choisie.
function orderPool(pool, costOf, econ) {
  if (econ) return [...pool].sort((a, b) => costOf(a) - costOf(b));
  return shuffle(pool);
}
 
// Sélection "classique" : recettes indépendantes pour chaque créneau dîner / déjeuner.
function selectSingles(pool, dinners, lunches, budget, costOf, econ) {
  const chosen = [];
  const used = new Set();
  let total = 0;
  const dinnerCount = () => chosen.filter((c) => c.meal === "diner").length;
  const lunchCount = () => chosen.filter((c) => c.meal === "dejeuner").length;
 
  for (const r of orderPool(pool, costOf, econ)) {
    if (dinnerCount() >= dinners) break;
    const cost = costOf(r);
    if (total + cost <= budget + 0.01) {
      chosen.push({ r, cost, base: r.base, meal: "diner" });
      used.add(r.id);
      total += cost;
    }
  }
  for (const r of orderPool(pool.filter((r) => canLunch(r) && !used.has(r.id)), costOf, econ)) {
    if (lunchCount() >= lunches) break;
    const cost = costOf(r);
    if (total + cost <= budget + 0.01) {
      chosen.push({ r, cost, base: r.base, meal: "dejeuner" });
      used.add(r.id);
      total += cost;
    }
  }
 
  if (dinnerCount() < dinners) {
    const remaining = pool.filter((r) => !used.has(r.id)).map((r) => ({ r, cost: costOf(r) })).sort((a, b) => a.cost - b.cost);
    let i = 0;
    while (dinnerCount() < dinners && i < 300) {
      const item = remaining.length ? remaining[i % remaining.length] : { r: pool[i % pool.length], cost: costOf(pool[i % pool.length]) };
      chosen.push({ r: item.r, cost: item.cost, base: item.r.base, meal: "diner" });
      used.add(item.r.id);
      total += item.cost;
      i++;
    }
  }
  if (lunchCount() < lunches) {
    const lunchEligible = pool.filter((r) => canLunch(r));
    const remaining = lunchEligible.filter((r) => !used.has(r.id)).map((r) => ({ r, cost: costOf(r) })).sort((a, b) => a.cost - b.cost);
    let i = 0;
    while (lunchCount() < lunches && i < 300 && lunchEligible.length) {
      const item = remaining.length ? remaining[i % remaining.length] : { r: lunchEligible[i % lunchEligible.length], cost: costOf(lunchEligible[i % lunchEligible.length]) };
      chosen.push({ r: item.r, cost: item.cost, base: item.r.base, meal: "dejeuner" });
      used.add(item.r.id);
      total += item.cost;
      i++;
    }
  }
  return { chosen, total };
}
 
// Sélection "batch cooking" : privilégie des paires de recettes DIFFÉRENTES qui partagent
// un même ingrédient de base, réparties idéalement une au dîner + une au déjeuner —
// acheté et préparé en une fois, cuisiné deux façons différentes.
function selectBatch(pool, dinners, lunches, budget, costOf, econ) {
  const byBase = new Map();
  pool.forEach((r) => {
    if (!byBase.has(r.base)) byBase.set(r.base, []);
    byBase.get(r.base).push(r);
  });
  let pairUnits = [];
  byBase.forEach((recs) => {
    if (recs.length >= 2) {
      const s = shuffle(recs);
      for (let i = 0; i + 1 < s.length; i += 2) pairUnits.push([s[i], s[i + 1]]);
    }
  });
  pairUnits = econ
    ? pairUnits.sort((p1, p2) => (costOf(p1[0]) + costOf(p1[1])) - (costOf(p2[0]) + costOf(p2[1])))
    : shuffle(pairUnits);
 
  const chosen = [];
  const used = new Set();
  let total = 0;
  let dinnerSlots = dinners;
  let lunchSlots = lunches;
 
  for (const [a, b] of pairUnits) {
    if (dinnerSlots + lunchSlots < 2) break;
    const cost = costOf(a) + costOf(b);
    if (total + cost > budget + 0.01) continue;
    const assign = assignPair(a, b, dinnerSlots, lunchSlots);
    if (!assign) continue;
    const [mealA, mealB] = assign;
    chosen.push({ r: a, cost: costOf(a), base: a.base, meal: mealA });
    chosen.push({ r: b, cost: costOf(b), base: b.base, meal: mealB });
    used.add(a.id);
    used.add(b.id);
    total += cost;
    dinnerSlots -= [mealA, mealB].filter((m) => m === "diner").length;
    lunchSlots -= [mealA, mealB].filter((m) => m === "dejeuner").length;
  }
 
  for (const r of orderPool(pool.filter((r) => !used.has(r.id)), costOf, econ)) {
    if (dinnerSlots <= 0 && lunchSlots <= 0) break;
    const cost = costOf(r);
    if (total + cost > budget + 0.01) continue;
    let meal = null;
    if (r.dinnerOnly) {
      if (dinnerSlots > 0) meal = "diner";
    } else if (dinnerSlots > 0 && lunchSlots > 0) {
      meal = Math.random() < 0.5 ? "diner" : "dejeuner";
    } else if (dinnerSlots > 0) meal = "diner";
    else if (lunchSlots > 0) meal = "dejeuner";
    if (!meal) continue;
    chosen.push({ r, cost, base: r.base, meal });
    used.add(r.id);
    total += cost;
    if (meal === "diner") dinnerSlots--; else lunchSlots--;
  }
 
  if (dinnerSlots > 0 || lunchSlots > 0) {
    const leftover = pool.filter((r) => !used.has(r.id)).map((r) => ({ r, cost: costOf(r) })).sort((a, b) => a.cost - b.cost);
    let i = 0;
    while ((dinnerSlots > 0 || lunchSlots > 0) && i < 500) {
      const item = leftover.length ? leftover[i % leftover.length] : { r: pool[i % pool.length], cost: costOf(pool[i % pool.length]) };
      const r = item.r;
      let meal = null;
      if (r.dinnerOnly) {
        if (dinnerSlots > 0) meal = "diner";
      } else {
        meal = dinnerSlots > 0 ? "diner" : "dejeuner";
      }
      if (meal) {
        chosen.push({ r, cost: item.cost, base: r.base, meal });
        used.add(r.id);
        total += item.cost;
        if (meal === "diner") dinnerSlots--; else lunchSlots--;
      }
      i++;
    }
  }
 
  return { chosen, total };
}
 
// Certains ingrédients ne s'achètent jamais "à la juste quantité utilisée" : on ne trouve pas
// un demi-sachet de bouillon en rayon, on achète la boîte entière. Cette table corrige le prix
// affiché pour refléter le format réellement en rayon, arrondi au-dessus du besoin de la semaine.
const PACKAGING = {
  "Bouillon de légumes": { label: "boîte de 10 cubes", packQty: 10, packPrice: 1.80 },
  "Épices curry": { label: "pot d'épices (~15 utilisations)", packQty: 15, packPrice: 2.20 },
  "Thym": { label: "pot d'herbes séchées", packQty: 10, packPrice: 1.50 },
  "Vinaigrette": { label: "flacon", packQty: 8, packPrice: 2.00 },
  "Sauce tacos": { label: "flacon", packQty: 6, packPrice: 2.50 },
  "Sauce soja": { label: "flacon", packQty: 10, packPrice: 2.20 },
  "Miel": { label: "pot", packQty: 8, packPrice: 3.50 },
  "Sésame": { label: "sachet de graines", packQty: 6, packPrice: 1.80 },
  "Sauce César": { label: "flacon", packQty: 6, packPrice: 2.80 },
  "Pain de mie": { label: "paquet de 20 tranches", packQty: 20, packPrice: 1.80 },
  "Fromage à burger": { label: "paquet de 8 tranches", packQty: 8, packPrice: 2.50 },
  "Ail": { label: "tête d'ail (~8 gousses)", packQty: 8, packPrice: 0.60 },
  "Sauce cacahuète": { label: "pot", packQty: 8, packPrice: 3.20 },
  "Pâte miso": { label: "pot", packQty: 10, packPrice: 3.50 },
  "Sauce teriyaki": { label: "flacon", packQty: 10, packPrice: 2.40 },
  "Pâte de curry rouge": { label: "pot d'épices (~8 utilisations)", packQty: 8, packPrice: 2.60 },
  "Pâte de curry vert": { label: "pot d'épices (~8 utilisations)", packQty: 8, packPrice: 2.60 },
  "Sauce buffalo": { label: "flacon", packQty: 8, packPrice: 2.80 },
  "Sauce gochujang": { label: "pot", packQty: 10, packPrice: 3.20 },
  "Sauce tahini": { label: "pot", packQty: 10, packPrice: 3.50 },
  "Pesto pistache": { label: "pot", packQty: 4, packPrice: 4.50 },
  "Dukkah (graines, épices)": { label: "sachet d'épices", packQty: 8, packPrice: 2.80 },
  "Garam masala": { label: "pot d'épices (~15 utilisations)", packQty: 15, packPrice: 2.20 },
  "Ail-gingembre frais": { label: "pot de pâte fraîche", packQty: 10, packPrice: 1.80 },
  "Épices mexicaines": { label: "pot d'épices (~15 utilisations)", packQty: 15, packPrice: 2.20 },
  "Cumin": { label: "pot d'épices (~15 utilisations)", packQty: 15, packPrice: 1.80 },
  "Sauce curry japonaise": { label: "brique de roux (~4 utilisations)", packQty: 4, packPrice: 2.40 },
  "Huile de sésame": { label: "flacon", packQty: 12, packPrice: 2.50 },
  "Ras el hanout": { label: "pot d'épices (~15 utilisations)", packQty: 15, packPrice: 2.00 },
};
 
function applyRealisticPackaging(items, storeMult) {
  return items.map((item) => {
    const pack = PACKAGING[item.name];
    if (!pack) return item;
    const packagesNeeded = Math.max(1, Math.ceil(item.qty / pack.packQty));
    return {
      ...item,
      price: packagesNeeded * pack.packPrice * storeMult,
      packagesNeeded,
      packLabel: pack.label,
    };
  });
}
 
// Remise "achat en plus grande quantité" appliquée à l'ingrédient pivot d'un batch cooking
// réussi : acheter le double d'un même ingrédient revient en général un peu moins cher au
// kilo qu'en acheter deux fois séparément. Estimation, pas un prix relevé en rayon.
const BATCH_DISCOUNT = 0.08;
 
function generateWeek({ budget, people, dinners, lunches, diet, styles, quickOnly, glutenFree, seasonal, month, store, batchCooking, excluded, lockedItems, original, frozenOk, econMode, vacationMode }) {
  const factor = people / 2;
  const storeMult = STORES.find((s) => s.id === store)?.mult ?? 1;
  const costOf = (r) => recipeCost(r, factor, storeMult, frozenOk);
 
  // Recettes verrouillées : on les recalcule au tarif courant (personnes/magasin) et on
  // ne régénère que ce qu'il reste de créneaux et de budget.
  const lockedChosen = (lockedItems || [])
    .map(({ rId, meal }) => {
      const r = RECIPES.find((rec) => rec.id === rId);
      if (!r) return null;
      return { r, cost: costOf(r), base: r.base, meal };
    })
    .filter(Boolean);
  const lockedDinners = lockedChosen.filter((c) => c.meal === "diner").length;
  const lockedLunches = lockedChosen.filter((c) => c.meal === "dejeuner").length;
  const lockedTotal = lockedChosen.reduce((s, c) => s + c.cost, 0);
  const lockedIds = new Set(lockedChosen.map((c) => c.r.id));
 
  const remainingDinners = Math.max(0, dinners - lockedDinners);
  const remainingLunches = Math.max(0, lunches - lockedLunches);
  const remainingBudget = Math.max(0, budget - lockedTotal);
 
  const rawPool = buildPool({ diet, styles, quickOnly, glutenFree, seasonal, month, excluded, original, frozenOk, vacationMode });
  const pool = rawPool.filter((r) => !lockedIds.has(r.id));
 
  const { chosen: freshChosen, total: freshTotal } = batchCooking
    ? selectBatch(pool, remainingDinners, remainingLunches, remainingBudget, costOf, econMode)
    : selectSingles(pool, remainingDinners, remainingLunches, remainingBudget, costOf, econMode);
 
  let chosen = [...lockedChosen, ...freshChosen];
 
  const baseCounts = {};
  chosen.forEach((c) => { baseCounts[c.base] = (baseCounts[c.base] || 0) + 1; });
  const pairedBases = Object.keys(baseCounts).filter((b) => baseCounts[b] >= 2);
  const colorMap = {};
  pairedBases.forEach((b, i) => { colorMap[b] = PALETTE[i % PALETTE.length]; });
 
  // En batch cooking, applique la remise pivot sur les plats effectivement appairés : c'est
  // ce qui rend le mode batch cooking concrètement différent (moins cher), pas juste une
  // étiquette. La remise ne s'applique qu'à la part de l'ingrédient pivot dans chaque plat.
  let batchSavings = 0;
  if (batchCooking) {
    chosen = chosen.map((c) => {
      if (!pairedBases.includes(c.base)) return c;
      const pivotIng = effectiveIngredients(c.r, frozenOk).find((i) => i.n === c.r.base);
      if (!pivotIng) return c;
      const pivotCost = pivotIng.p * factor * storeMult;
      const discount = pivotCost * BATCH_DISCOUNT;
      batchSavings += discount;
      return { ...c, cost: Math.max(0, c.cost - discount) };
    });
  }
  const total = chosen.reduce((s, c) => s + c.cost, 0);
 
  const shoppingMap = new Map();
  chosen.forEach(({ r }) => {
    effectiveIngredients(r, frozenOk).forEach((ing) => {
      const key = ing.n + "|" + ing.u;
      const qty = ing.q * factor;
      let price = ing.p * factor * storeMult;
      if (batchCooking && pairedBases.includes(r.base)) {
        const originalIng = r.ing.find((i) => i.n === r.base);
        const effectiveName = originalIng && frozenOk && FROZEN_SUBS[originalIng.n] ? FROZEN_SUBS[originalIng.n].name : r.base;
        if (ing.n === effectiveName) {
          price -= price * BATCH_DISCOUNT;
        }
      }
      if (shoppingMap.has(key)) {
        const cur = shoppingMap.get(key);
        cur.qty += qty;
        cur.price += price;
      } else {
        shoppingMap.set(key, { name: ing.n, unit: ing.u, cat: ing.c, qty, price });
      }
    });
  });
  const shopping = applyRealisticPackaging(Array.from(shoppingMap.values()), storeMult).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat)
  );
 
  return { chosen, total, shopping, colorMap, pairedBases, batchCooking, batchSavings, poolEmpty: rawPool.length === 0 };
}
 
function fmtQty(item) {
  if (item.packLabel) {
    const used = item.unit === "g" || item.unit === "ml" ? Math.round(item.qty / 10) * 10 : Math.round(item.qty * 10) / 10;
    return `${item.packagesNeeded} × ${item.packLabel} (besoin réel : ${used} ${item.unit})`;
  }
  const rounded = item.unit === "g" || item.unit === "ml" ? Math.round(item.qty / 10) * 10 : Math.round(item.qty * 10) / 10;
  return `${rounded} ${item.unit}`;
}
 
const euro = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
 
function buildShoppingText(result, store, people, dinners, lunches, checked) {
  if (!result) return "";
  const lines = [];
  lines.push("KLAR — Liste de courses");
  lines.push(new Date().toLocaleDateString("fr-FR"));
  lines.push(`${STORES.find((s) => s.id === store)?.name} · ${people} pers. · ${dinners} dîners · ${lunches} déjeuners`);
  lines.push("");
  let cartTotal = 0;
  let skipped = 0;
  CATEGORY_ORDER.forEach((cat) => {
    const items = result.shopping.filter((i) => i.cat === cat && !checked[i.name + i.unit]);
    if (!items.length) return;
    lines.push(cat.toUpperCase());
    items.forEach((i) => {
      lines.push(`- ${i.name} : ${fmtQty(i)} (${euro(i.price)})`);
      cartTotal += i.price;
    });
    lines.push("");
  });
  skipped = result.shopping.filter((i) => checked[i.name + i.unit]).length;
  lines.push(`TOTAL À ACHETER : ${euro(cartTotal)}`);
  if (skipped > 0) lines.push(`(${skipped} ingrédient${skipped > 1 ? "s" : ""} déjà chez toi, non inclus)`);
  return lines.join("\n");
}
 
/* ------------------------------------------------------------------ */
/*  KLAR DE GROUPE — répartition & export                              */
/* ------------------------------------------------------------------ */
 
const VACATION_MODES = [
  { id: "mixte", name: "Tout le catalogue" },
  { id: "mer", name: "Mer" },
  { id: "montagne", name: "Montagne" },
  { id: "rapide", name: "Rapide / sandwichs" },
];
 
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
 
// Répartit les plats choisis entre les membres du groupe, à tour de rôle : chaque membre
// devient "responsable" d'un repas (achat + préparation). Un plat déjà assigné manuellement
// (assignments) garde son responsable ; les autres sont distribués en tournant sur la liste
// des membres, dans l'ordre des repas générés.
function assignMealsToMembers(chosen, members, assignments) {
  if (!members || members.length === 0) return chosen.map((c) => ({ ...c, memberId: null }));
  let i = 0;
  return chosen.map((c) => {
    const key = c.r.id + "|" + c.meal;
    const forced = assignments && assignments[key];
    if (forced && members.some((m) => m.id === forced)) {
      return { ...c, memberId: forced };
    }
    const member = members[i % members.length];
    i++;
    return { ...c, memberId: member.id };
  });
}
 
// Reconstitue la liste de courses propre à un seul membre, à partir des seuls plats dont il
// est responsable — même logique de cumul par ingrédient que la liste de courses globale.
function shoppingForMember(assignedChosen, memberId, frozenOk, factor, storeMult, batchCooking, pairedBases) {
  const shoppingMap = new Map();
  assignedChosen
    .filter((c) => c.memberId === memberId)
    .forEach(({ r }) => {
      effectiveIngredients(r, frozenOk).forEach((ing) => {
        const key = ing.n + "|" + ing.u;
        const qty = ing.q * factor;
        let price = ing.p * factor * storeMult;
        if (batchCooking && pairedBases.includes(r.base)) {
          const originalIng = r.ing.find((i) => i.n === r.base);
          const effectiveName = originalIng && frozenOk && FROZEN_SUBS[originalIng.n] ? FROZEN_SUBS[originalIng.n].name : r.base;
          if (ing.n === effectiveName) price -= price * BATCH_DISCOUNT;
        }
        if (shoppingMap.has(key)) {
          const cur = shoppingMap.get(key);
          cur.qty += qty;
          cur.price += price;
        } else {
          shoppingMap.set(key, { name: ing.n, unit: ing.u, cat: ing.c, qty, price });
        }
      });
    });
  return Array.from(shoppingMap.values()).sort((a, b) => CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat));
}
 
// Texte prêt à copier/envoyer (WhatsApp, SMS, Notes...) pour UN membre du groupe : ses repas
// en charge + sa liste de courses associée.
function buildMemberText(trip, assignedChosen, member, frozenOk, factor, storeMult, batchCooking, pairedBases) {
  const lines = [];
  lines.push(`KLAR DE GROUPE — ${trip.name || "Séjour"}`);
  lines.push(`Pour : ${member.name}`);
  lines.push("");
  const myMeals = assignedChosen.filter((c) => c.memberId === member.id);
  if (myMeals.length === 0) {
    lines.push("Aucun repas assigné pour le moment.");
  } else {
    lines.push("REPAS EN CHARGE (achat + préparation) :");
    myMeals.forEach((c) => {
      const label = c.meal === "diner" ? "Dîner" : "Déjeuner";
      lines.push(`- ${label} : ${c.r.name} (${euro(c.cost)})`);
    });
    lines.push("");
    const shop = shoppingForMember(assignedChosen, member.id, frozenOk, factor, storeMult, batchCooking, pairedBases);
    lines.push("INGRÉDIENTS À ACHETER :");
    let myTotal = 0;
    CATEGORY_ORDER.forEach((cat) => {
      const items = shop.filter((i) => i.cat === cat);
      if (!items.length) return;
      lines.push(cat.toUpperCase());
      items.forEach((i) => {
        lines.push(`- ${i.name} : ${fmtQty(i)} (${euro(i.price)})`);
        myTotal += i.price;
      });
    });
    lines.push("");
    lines.push(`TOTAL À TA CHARGE : ${euro(myTotal)}`);
  }
  return lines.join("\n");
}
 
// Texte récapitulatif pour tout le groupe : qui fait quoi, jour par jour, à partager avec
// tout le monde (le fameux "qui achète quoi").
function buildGroupSummaryText(trip, assignedChosen, members) {
  const lines = [];
  lines.push(`KLAR DE GROUPE — ${trip.name || "Séjour"}`);
  const modeLabel = VACATION_MODES.find((m) => m.id === trip.vacationMode)?.name;
  if (modeLabel && trip.vacationMode !== "mixte") lines.push(`Ambiance : ${modeLabel}`);
  lines.push(`${trip.groupPeople} pers. · ${trip.groupDays} jour${trip.groupDays > 1 ? "s" : ""} · ${new Date().toLocaleDateString("fr-FR")}`);
  lines.push("");
  lines.push("QUI S'OCCUPE DE QUOI :");
  members.forEach((m) => {
    const mine = assignedChosen.filter((c) => c.memberId === m.id);
    if (mine.length === 0) return;
    lines.push(`${m.name} :`);
    mine.forEach((c) => {
      const label = c.meal === "diner" ? "Dîner" : "Déjeuner";
      lines.push(`  - ${label} : ${c.r.name}`);
    });
  });
  const unassigned = assignedChosen.filter((c) => !c.memberId);
  if (unassigned.length > 0) {
    lines.push("Non assignés :");
    unassigned.forEach((c) => lines.push(`  - ${c.r.name}`));
  }
  return lines.join("\n");
}
 
// Forme de données pensée pour une future synchro temps réel (ex. via un code de séjour
// partagé et window.storage en mode "shared"). Pour l'instant, uniquement utilisée pour
// structurer l'export — rien n'est persisté ni envoyé à personne.
function buildGroupTripSnapshot({ tripId, name, vacationMode, groupPeople, groupDays, members, assignedChosen, total }) {
  return {
    tripId,
    name,
    vacationMode,
    groupPeople,
    groupDays,
    members,
    meals: assignedChosen.map((c) => ({ recipeId: c.r.id, meal: c.meal, memberId: c.memberId, cost: c.cost })),
    total,
    generatedAt: new Date().toISOString(),
  };
}
 
function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
 
/* ------------------------------------------------------------------ */
/*  UI PRIMITIVES                                                      */
/* ------------------------------------------------------------------ */
 
const INK = "#22201C";
const PAPER = "#FAF8F2";
const GRID = "#DCE3E8";
const STAMP = "#818962";
const GREEN = "#C2869B";
const RED = "#818962";
const YELLOW = "#818962";
 
function Stepper({ value, min, max, onChange, suffix }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 flex items-center justify-center rounded-full border-2 text-lg font-bold transition-transform active:scale-90"
        style={{ borderColor: INK, color: INK }}
      >
        −
      </button>
      <span className="w-16 text-center font-bold text-lg tabular-nums" style={{ fontFamily: "'Space Mono', monospace", color: INK }}>
        {value}{suffix}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 flex items-center justify-center rounded-full border-2 text-lg font-bold transition-transform active:scale-90"
        style={{ borderColor: INK, color: INK }}
      >
        +
      </button>
    </div>
  );
}
 
function ChoiceRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="px-3 py-1.5 rounded-md text-sm font-semibold border-2 transition-colors"
            style={{
              borderColor: INK,
              backgroundColor: active ? INK : "transparent",
              color: active ? PAPER : INK,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
 
function MultiChoiceRow({ options, values, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.id);
        return (
          <button
            key={opt.id}
            onClick={() => onToggle(opt.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold border-2 transition-colors"
            style={{
              borderColor: INK,
              backgroundColor: active ? INK : "transparent",
              color: active ? PAPER : INK,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            <span
              className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: active ? PAPER : INK, backgroundColor: active ? PAPER : "transparent" }}
            >
              {active && <Check size={10} color={INK} strokeWidth={3} />}
            </span>
            {opt.name}
          </button>
        );
      })}
    </div>
  );
}
 
function Toggle({ label, checked, onChange, icon }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 text-sm font-semibold transition-colors"
      style={{
        borderColor: INK,
        backgroundColor: checked ? YELLOW : "transparent",
        color: INK,
      }}
    >
      <span
        className="w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0"
        style={{ borderColor: INK, backgroundColor: checked ? INK : "transparent" }}
      >
        {checked && <Check size={11} color={YELLOW} strokeWidth={3} />}
      </span>
      {icon}
      {label}
    </button>
  );
}
 
// Pictogrammes dessinés à la main (SVG) pour les fruits/légumes sans emoji Unicode fidèle.
// Formes simples et cohérentes avec le style "carnet" de l'appli plutôt qu'une image trompeuse.
const SHAPE_COLORS = {
  red: "#B5473F", pink: "#D98C93", purple: "#6B4C7A", darkPurple: "#3E2A4A",
  orange: "#E08A3C", rust: "#C1541E", yellow: "#E8C24C", paleYellow: "#EDDD9E",
  green: "#5B8C5A", darkGreen: "#4B7A4E", paleGreen: "#A9C79A", cream: "#EDE7C9",
  tan: "#C9A97A", beet: "#7A2E3A",
};
 
const PRODUCE_SHAPES = {
  // fruits
  "Pamplemousse": { type: "citrusHalf", color: SHAPE_COLORS.pink },
  "Rhubarbe": { type: "stalk", color: SHAPE_COLORS.red },
  "Abricot": { type: "stoneFruit", color: SHAPE_COLORS.orange },
  "Framboise": { type: "cluster", color: SHAPE_COLORS.red },
  "Groseille": { type: "clusterStem", color: SHAPE_COLORS.red },
  "Mûre": { type: "cluster", color: SHAPE_COLORS.darkPurple },
  "Prune": { type: "teardrop", color: SHAPE_COLORS.purple },
  "Figue": { type: "fig", color: SHAPE_COLORS.purple },
  "Mirabelle": { type: "clusterRound", color: SHAPE_COLORS.yellow },
  "Coing": { type: "quince", color: SHAPE_COLORS.paleYellow },
  "Noix": { type: "nut", color: SHAPE_COLORS.tan },
  // légumes
  "Poireau": { type: "leek", color: SHAPE_COLORS.green },
  "Céleri-rave": { type: "bulbRoot", color: SHAPE_COLORS.cream },
  "Endive": { type: "torpedo", color: SHAPE_COLORS.paleYellow },
  "Potiron": { type: "pumpkin", color: SHAPE_COLORS.orange },
  "Navet": { type: "bulbRoot", color: "#F2EFE6" },
  "Panais": { type: "root", color: SHAPE_COLORS.cream },
  "Topinambour": { type: "tuber", color: SHAPE_COLORS.tan },
  "Mâche": { type: "rosette", color: SHAPE_COLORS.green },
  "Épinard": { type: "leaf", color: SHAPE_COLORS.darkGreen },
  "Radis": { type: "radish", color: SHAPE_COLORS.red },
  "Blette": { type: "leaf", color: SHAPE_COLORS.red, stem: true },
  "Chou-fleur": { type: "cauliflower", color: SHAPE_COLORS.cream },
  "Artichaut": { type: "artichoke", color: SHAPE_COLORS.paleGreen },
  "Asperge": { type: "spear", color: SHAPE_COLORS.paleGreen },
  "Petits pois": { type: "pod", color: SHAPE_COLORS.green },
  "Fève": { type: "pod", color: SHAPE_COLORS.paleGreen },
  "Haricot vert": { type: "beanPod", color: SHAPE_COLORS.darkGreen },
  "Betterave": { type: "bulbRoot", color: SHAPE_COLORS.beet },
  "Courge": { type: "pumpkin", color: SHAPE_COLORS.rust },
  "Potimarron": { type: "pumpkin", color: SHAPE_COLORS.rust },
  "Courgette": { type: "cylinder", color: SHAPE_COLORS.darkGreen },
};
 
function ShapeIcon({ type, color, stem }) {
  const leafStroke = "#4B6A3F";
  switch (type) {
    case "cluster":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 8 q1 -5 5 -6" stroke={leafStroke} strokeWidth="2" fill="none" />
          <circle cx="15" cy="16" r="6" fill={color} />
          <circle cx="25" cy="16" r="6" fill={color} />
          <circle cx="20" cy="24" r="6" fill={color} />
        </svg>
      );
    case "clusterStem":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 4 v10" stroke={leafStroke} strokeWidth="2" />
          <circle cx="14" cy="19" r="4" fill={color} />
          <circle cx="22" cy="18" r="4" fill={color} />
          <circle cx="28" cy="21" r="4" fill={color} />
          <circle cx="17" cy="27" r="4" fill={color} />
          <circle cx="24" cy="27" r="4" fill={color} />
        </svg>
      );
    case "clusterRound":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 6 q1 -4 5 -5" stroke={leafStroke} strokeWidth="2" fill="none" />
          <circle cx="15" cy="18" r="7" fill={color} />
          <circle cx="25" cy="18" r="7" fill={color} />
          <circle cx="20" cy="27" r="7" fill={color} />
        </svg>
      );
    case "teardrop":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 8 C10 8 8 20 14 28 C18 34 22 34 26 28 C32 20 30 8 20 8 Z" fill={color} />
          <path d="M20 8 q1 -5 5 -6" stroke={leafStroke} strokeWidth="2" fill="none" />
        </svg>
      );
    case "fig":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 10 C12 12 10 22 14 28 C17 33 23 33 26 28 C30 22 28 12 20 10 Z" fill={color} />
          <circle cx="20" cy="10" r="2" fill={SHAPE_COLORS.cream} />
        </svg>
      );
    case "quince":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 10 C12 10 9 18 11 24 C13 31 27 31 29 24 C31 18 28 10 20 10 Z" fill={color} />
          <path d="M20 10 q1 -5 5 -6" stroke={leafStroke} strokeWidth="2" fill="none" />
        </svg>
      );
    case "nut":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <ellipse cx="20" cy="20" rx="12" ry="10" fill={color} />
          <path d="M11 20 q4.5 -7 9 0 q4.5 7 9 0" stroke="#8A6B45" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "stoneFruit":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <circle cx="20" cy="21" r="11" fill={color} />
          <path d="M20 21 q-3 -8 0 -11" stroke="#C97A2E" strokeWidth="1" opacity="0.5" fill="none" />
          <path d="M20 10 q1 -5 5 -6" stroke={leafStroke} strokeWidth="2" fill="none" />
        </svg>
      );
    case "citrusHalf":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <circle cx="20" cy="20" r="14" fill={SHAPE_COLORS.cream} stroke={color} strokeWidth="2" />
          <circle cx="20" cy="20" r="10" fill={color} opacity="0.85" />
          <path d="M20 10 v20 M12.5 14 L27.5 26 M27.5 14 L12.5 26" stroke={SHAPE_COLORS.cream} strokeWidth="1" />
        </svg>
      );
    case "stalk":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <rect x="14" y="14" width="4" height="20" rx="2" fill={color} />
          <rect x="22" y="10" width="4" height="24" rx="2" fill={color} />
          <path d="M14 14 q2 -6 6 -8 M26 10 q2 -5 6 -6" stroke={leafStroke} strokeWidth="2" fill="none" />
        </svg>
      );
    case "leek":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <rect x="15" y="16" width="10" height="18" rx="4" fill={SHAPE_COLORS.cream} />
          <path d="M20 16 L12 4 M20 16 L20 2 M20 16 L28 4" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "bulbRoot":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <ellipse cx="20" cy="22" rx="12" ry="11" fill={color} />
          <path d="M14 8 q2 4 0 8 M20 6 v8 M26 8 q-2 4 0 8" stroke={leafStroke} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M16 33 q4 4 8 0" stroke="#8A6B45" strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "torpedo":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 6 C12 8 10 20 14 30 C16 34 24 34 26 30 C30 20 28 8 20 6 Z" fill={color} />
        </svg>
      );
    case "pumpkin":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <ellipse cx="20" cy="23" rx="14" ry="11" fill={color} />
          <path d="M8 23 Q20 15 32 23 M8 23 Q20 31 32 23" stroke="#00000030" strokeWidth="1" fill="none" />
          <rect x="18" y="6" width="4" height="8" rx="2" fill={leafStroke} />
        </svg>
      );
    case "root":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 8 C26 8 27 20 20 34 C13 20 14 8 20 8 Z" fill={color} />
          <path d="M14 8 q3 -5 6 -6 M26 8 q-3 -5 -6 -6" stroke={leafStroke} strokeWidth="2" fill="none" />
        </svg>
      );
    case "tuber":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M14 14 q-4 4 0 8 q-3 5 3 8 q5 4 10 0 q5 -3 3 -8 q4 -4 0 -8 q-3 -5 -8 -4 q-5 -1 -8 4 Z" fill={color} />
        </svg>
      );
    case "rosette":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <circle cx="20" cy="12" r="6" fill={color} />
          <circle cx="12" cy="23" r="6" fill={color} />
          <circle cx="28" cy="23" r="6" fill={color} />
          <circle cx="20" cy="28" r="6" fill={color} />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 6 C32 10 32 26 20 34 C8 26 8 10 20 6 Z" fill={color} />
          <path d="M20 8 v24" stroke="#00000040" strokeWidth="1.5" />
          {stem && <rect x="18" y="30" width="4" height="6" rx="1" fill={SHAPE_COLORS.red} />}
        </svg>
      );
    case "radish":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 14 C27 14 28 26 20 32 C12 26 13 14 20 14 Z" fill={color} />
          <path d="M15 16 C18 20 22 20 25 16" fill={SHAPE_COLORS.cream} opacity="0.85" />
          <path d="M17 10 q3 -6 3 -8 M23 10 q-3 -6 -3 -8" stroke={leafStroke} strokeWidth="2" fill="none" />
        </svg>
      );
    case "cauliflower":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <circle cx="20" cy="18" r="12" fill={color} />
          <path d="M8 24 Q10 34 20 34 Q30 34 32 24" fill="none" stroke={leafStroke} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "artichoke":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 6 C10 8 8 20 14 30 C17 35 23 35 26 30 C32 20 30 8 20 6 Z" fill={color} />
          <path d="M14 14 q6 -4 12 0 M13 20 q7 -4 14 0 M14 26 q6 -4 12 0" stroke={leafStroke} strokeWidth="1" fill="none" opacity="0.6" />
        </svg>
      );
    case "spear":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M20 4 L24 12 L24 34 L16 34 L16 12 Z" fill={color} />
          <path d="M16 15 h8 M16 20 h8 M16 25 h8" stroke="#00000030" strokeWidth="1" />
        </svg>
      );
    case "pod":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M8 20 Q10 8 20 8 Q30 8 32 20 Q30 32 20 32 Q10 32 8 20 Z" fill={color} opacity="0.35" />
          <circle cx="14" cy="20" r="4" fill={color} />
          <circle cx="20" cy="18" r="4" fill={color} />
          <circle cx="26" cy="20" r="4" fill={color} />
        </svg>
      );
    case "beanPod":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M10 30 Q8 16 22 10 Q34 6 32 14 Q30 24 18 30 Q14 32 10 30 Z" fill={color} />
        </svg>
      );
    case "cylinder":
      return (
        <svg viewBox="0 0 40 40" width="30" height="30">
          <path d="M13 12 C13 9 16 8 20 8 C24 8 27 9 27 12 L26 30 C26 33 23 34 20 34 C17 34 14 33 14 30 Z" fill={color} />
          <ellipse cx="20" cy="9" rx="5" ry="2" fill="#00000020" />
        </svg>
      );
    default:
      return null;
  }
}
 
function ProduceIcon({ name }) {
  const emoji = PRODUCE_EMOJI[name];
  if (emoji) {
    return (
      <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
        <span className="text-3xl leading-none">{emoji}</span>
      </span>
    );
  }
  const shape = PRODUCE_SHAPES[name];
  if (shape) {
    return (
      <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
        <ShapeIcon type={shape.type} color={shape.color} stem={shape.stem} />
      </span>
    );
  }
  // Dernier recours si un produit n'a ni emoji fidèle ni pictogramme dessiné : pastille
  // avec l'initiale plutôt qu'une image trompeuse.
  const color = PALETTE[name.length % PALETTE.length];
  return (
    <span
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
      style={{ backgroundColor: color, color: INK, fontFamily: "'Space Mono', monospace" }}
    >
      {name.charAt(0)}
    </span>
  );
}
 
// Astuces "le saviez-vous", basées sur des repères publiés (ANSES, PNNS, Eufic, études
// grand public sur les surgelés) — pas des chiffres inventés. Sourcé dans le code pour
// pouvoir vérifier/mettre à jour facilement.
const TIPS = [
  {
    key: "antiinflam_budget",
    match: (s) => s.econMode && s.styles.includes("anti-inflammatoire"),
    text: "Anti-inflammatoire + petit budget : le poisson gras frais fait grimper la note. Active aussi « OK pour les surgelés » (saumon et poisson blanc surgelés coûtent souvent moins cher) et mise sur les légumineuses (lentilles, pois chiches) : peu coûteuses et anti-inflammatoires.",
  },
  {
    key: "proteine",
    match: (s) => s.styles.includes("proteine"),
    text: "L'ANSES fixe le besoin en protéines d'un adulte sédentaire en bonne santé à environ 0,83 g par kilo de poids corporel et par jour — soit environ 58 g/jour pour 70 kg.",
  },
  {
    key: "antiinflam",
    match: (s) => s.styles.includes("anti-inflammatoire"),
    text: "Les oméga-3 (poissons gras, huile de colza/lin) et des épices comme le curcuma sont associés à une réduction de l'inflammation ; sucres raffinés et fritures sont plutôt associés à l'inflammation chronique de bas grade.",
  },
  {
    key: "healthy",
    match: (s) => s.styles.includes("healthy"),
    text: "Repère du Programme National Nutrition Santé : viser environ la moitié de l'assiette en légumes (et fruits) à chaque repas.",
  },
  {
    key: "glutenFree",
    match: (s) => s.glutenFree,
    text: "Le gluten est une protéine du blé, de l'orge et du seigle. En dehors d'une maladie cœliaque ou d'une sensibilité diagnostiquée, l'exclure n'a pas de bénéfice santé démontré selon les autorités de santé — mais si c'est ton choix pour une autre raison, l'appli s'adapte sans souci.",
  },
  {
    key: "frozenOk",
    match: (s) => s.frozenOk,
    text: "Les légumes surgelés sont congelés quelques heures après la récolte : plusieurs études (Eufic, presse spécialisée conso) montrent une valeur nutritionnelle comparable au frais, parfois supérieure à un frais resté plusieurs jours au frigo.",
  },
  {
    key: "econMode",
    match: (s) => s.econMode,
    text: "Œufs, légumineuses (lentilles, pois chiches, haricots) et féculents bruts (riz, pâtes) comptent parmi les sources de protéines et calories les moins chères au kilo — les associer aux légumes surgelés fait encore baisser la facture.",
  },
  {
    key: "batchCooking",
    match: (s) => s.batchCooking,
    text: "Le batch cooking, c'est cuisiner en une session des bases réutilisables (protéine, féculent, légumes) dans plusieurs repas de la semaine. Ici, l'ingrédient pivot partagé entre deux plats est aussi facturé avec une petite remise (achat en plus grande quantité).",
  },
  {
    key: "seasonal",
    match: (s) => s.seasonal,
    text: "Les fruits et légumes de saison, plus abondants localement et moins stockés/transportés, sont en général moins chers et plus parfumés que hors-saison.",
  },
  {
    key: "original",
    match: (s) => !s.original,
    text: "Par défaut, l'appli ne propose que des recettes aux ingrédients courants en supermarché français. Active « Recettes qui sortent de l'ordinaire » pour débloquer des recettes plus créatives (miso, gochujang, tahini...).",
  },
];
 
function getActiveTips(state, max = 2) {
  const tips = [];
  for (const tip of TIPS) {
    if (tips.length >= max) break;
    if (tip.match(state)) tips.push(tip);
  }
  return tips;
}
 
function SeasonCalendarModal({ month, onMonthChange, onClose }) {
  const data = FULL_SEASON_CALENDAR[month];
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(34,32,28,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md sm:rounded-lg rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: PAPER, border: `2px solid ${INK}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b-2 flex-shrink-0" style={{ borderColor: INK }}>
          <h3 className="font-bold text-base" style={{ fontFamily: "'Kalam', cursive" }}>
            Fruits &amp; légumes de saison
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0"
            style={{ borderColor: INK }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          className="flex gap-1 px-3 pt-3 overflow-x-auto flex-shrink-0"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          {MONTHS.map((m, i) => {
            const idx = i + 1;
            const active = idx === month;
            return (
              <button
                key={m}
                onClick={() => onMonthChange(idx)}
                className="px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap border-b-2 flex-shrink-0"
                style={{ color: active ? INK : "#22201C88", borderColor: active ? STAMP : "transparent" }}
              >
                {m}
              </button>
            );
          })}
        </div>
        <div className="overflow-y-auto px-4 py-4 space-y-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-70">Fruits</div>
            <div className="grid grid-cols-3 gap-3">
              {data.fruits.map((name) => (
                <div key={name} className="flex flex-col items-center text-center gap-1">
                  <ProduceIcon name={name} />
                  <span className="text-xs font-semibold">{name}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-2 opacity-70">Légumes</div>
            <div className="grid grid-cols-3 gap-3">
              {data.legumes.map((name) => (
                <div key={name} className="flex flex-col items-center text-center gap-1">
                  <ProduceIcon name={name} />
                  <span className="text-xs font-semibold">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-4 py-2.5 border-t-2 text-[11px] opacity-55 flex-shrink-0 space-y-1" style={{ borderColor: INK }}>
          <p>Calendrier indicatif — la saisonnalité peut varier selon les régions et la météo.</p>
          <p>Pictogrammes réalistes quand un emoji existe, dessin simplifié sinon (ex. groseille, artichaut).</p>
        </div>
      </div>
    </div>
  );
}
 
/* ------------------------------------------------------------------ */
/*  APP                                                                 */
/* ------------------------------------------------------------------ */
 
function KlarSolo() {
  const currentMonth = new Date().getMonth() + 1;
 
  const [budget, setBudget] = useState(40);
  const [people, setPeople] = useState(2);
  const [dinners, setDinners] = useState(7);
  const [lunches, setLunches] = useState(0);
  const [store, setStore] = useState("leclerc");
  const [diet, setDiet] = useState("tous");
  const [styles, setStyles] = useState([]);
  const [quickOnly, setQuickOnly] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [batchCooking, setBatchCooking] = useState(false);
  const [seasonal, setSeasonal] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [excluded, setExcluded] = useState([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [lockedItems, setLockedItems] = useState([]); // [{ rId, meal }]
  const [showSeasonCalendar, setShowSeasonCalendar] = useState(false);
  const [econMode, setEconMode] = useState(false);
  const [frozenOk, setFrozenOk] = useState(false);
  const [original, setOriginal] = useState(false);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);
 
  const toggleStyle = (id) => setStyles((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
 
  const addExclusion = () => {
    const v = excludeInput.trim().toLowerCase();
    if (!v) return;
    setExcluded((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setExcludeInput("");
  };
  const removeExclusion = (v) => setExcluded((prev) => prev.filter((x) => x !== v));
 
  const isLocked = (item) => lockedItems.some((l) => l.rId === item.r.id && l.meal === item.meal);
  const toggleLock = (item) => {
    setLockedItems((prev) => {
      const exists = prev.some((l) => l.rId === item.r.id && l.meal === item.meal);
      if (exists) return prev.filter((l) => !(l.rId === item.r.id && l.meal === item.meal));
      return [...prev, { rId: item.r.id, meal: item.meal }];
    });
  };
 
  const totalMeals = dinners + lunches;
 
  const activeTips = useMemo(
    () => getActiveTips({ styles, glutenFree, frozenOk, econMode, batchCooking, seasonal, original }),
    [styles, glutenFree, frozenOk, econMode, batchCooking, seasonal, original]
  );
 
  const runGenerate = useCallback(() => {
    if (totalMeals <= 0) return;
    const r = generateWeek({ budget, people, dinners, lunches, diet, styles, quickOnly, glutenFree, seasonal, month, store, batchCooking, excluded, lockedItems, original, frozenOk, econMode });
    setResult(r);
    setChecked((prev) => {
      // On garde les cases "déjà chez toi" cochées pour les ingrédients qui restent d'un plat verrouillé.
      const next = {};
      r.shopping.forEach((i) => {
        const key = i.name + i.unit;
        if (prev[key]) next[key] = true;
      });
      return next;
    });
  }, [budget, people, dinners, lunches, diet, styles, quickOnly, glutenFree, seasonal, month, store, batchCooking, excluded, lockedItems, original, frozenOk, econMode, totalMeals]);
 
  const overBudget = result && result.total > budget + 0.01;
  const storeName = STORES.find((s) => s.id === store)?.name || "";
  const today = useMemo(
    () => new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
    [result]
  );
 
  const toggleCheck = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));
 
  const cartTotal = useMemo(() => {
    if (!result) return 0;
    return result.shopping.reduce((sum, i) => sum + (checked[i.name + i.unit] ? 0 : i.price), 0);
  }, [result, checked]);
  const haveCount = useMemo(() => (result ? result.shopping.filter((i) => checked[i.name + i.unit]).length : 0), [result, checked]);
 
  const copyShoppingList = async () => {
    const text = buildShoppingText(result, store, people, dinners, lunches, checked);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      downloadTextFile("klar-liste-de-courses.txt", text);
    }
  };
 
  const downloadShoppingList = () => {
    downloadTextFile("klar-liste-de-courses.txt", buildShoppingText(result, store, people, dinners, lunches, checked));
  };
 
  const downloadMenuImage = async () => {
    if (!result) return;
    try {
      if (document.fonts) {
        await Promise.all([
          document.fonts.load("700 40px 'Space Mono'"),
          document.fonts.load("400 24px 'Space Mono'"),
        ]);
      }
    } catch (e) { /* fonts non bloquant */ }
 
    const width = 1080;
    const pad = 56;
    const rowH = 46;
    const badgeH = 26;
    const sectionH = 56;
    const headerH = 190;
    const footerH = 170;
 
    const dinnerItems = result.chosen.filter((c) => c.meal === "diner");
    const lunchItems = result.chosen.filter((c) => c.meal === "dejeuner");
    const rowsHeight = (items) => items.reduce((h, it) => h + rowH + (result.colorMap[it.base] ? badgeH : 0), 0);
 
    let height = headerH;
    if (dinnerItems.length) height += sectionH + rowsHeight(dinnerItems);
    if (lunchItems.length) height += sectionH + rowsHeight(lunchItems);
    height += footerH;
    // Format portrait "façon écran de téléphone" : on garantit un minimum proche d'un ratio 9:16.
    height = Math.max(height, Math.round((width * 16) / 9 * 0.55));
 
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
 
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(pad / 2, pad / 2, width - pad, height - pad);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(pad / 2, pad / 2, width - pad, height - pad);
 
    const dashed = (x1, y, x2) => {
      ctx.save();
      ctx.strokeStyle = INK;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
      ctx.restore();
    };
 
    const left = pad;
    const right = width - pad;
 
    ctx.textAlign = "center";
    ctx.fillStyle = INK;
    ctx.font = "700 40px 'Space Mono', monospace";
    ctx.fillText("KLAR", width / 2, pad + 44);
    ctx.font = "400 22px 'Space Mono', monospace";
    ctx.globalAlpha = 0.75;
    ctx.fillText(today, width / 2, pad + 78);
    const storeName = STORES.find((s) => s.id === store)?.name || "";
    let subtitle = `${storeName} · ${people} pers. · ${dinners}D / ${lunches}Dej`;
    if (batchCooking) subtitle += " · batch cooking";
    ctx.fillText(subtitle, width / 2, pad + 108);
    ctx.globalAlpha = 1;
 
    let y = headerH;
 
    const drawSection = (title, items) => {
      if (!items.length) return;
      dashed(left, y, right);
      y += 40;
      ctx.textAlign = "left";
      ctx.font = "700 24px 'Space Mono', monospace";
      ctx.fillStyle = INK;
      ctx.fillText(title, left, y);
      y += 16;
      items.forEach((item, idx) => {
        y += rowH - 16;
        ctx.font = "400 24px 'Space Mono', monospace";
        ctx.fillStyle = INK;
        ctx.textAlign = "left";
        const label = `${String(idx + 1).padStart(2, "0")}  ${item.r.name}`;
        ctx.fillText(label, left, y, right - left - 140);
        ctx.textAlign = "right";
        ctx.font = "700 24px 'Space Mono', monospace";
        ctx.fillText(euro(item.cost), right, y);
        ctx.textAlign = "left";
        const color = result.colorMap[item.base];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(left + 28, y + 10, 16, 16);
          ctx.fillStyle = INK;
          ctx.globalAlpha = 0.75;
          ctx.font = "400 18px 'Space Mono', monospace";
          ctx.fillText(`lot partagé : ${item.base}`, left + 54, y + 24);
          ctx.globalAlpha = 1;
          y += badgeH;
        }
      });
      y += 12;
    };
 
    drawSection(`DÎNERS (${dinnerItems.length})`, dinnerItems);
    drawSection(`DÉJEUNERS (${lunchItems.length})`, lunchItems);
 
    dashed(left, y, right);
    y += 46;
    ctx.textAlign = "left";
    ctx.font = "700 30px 'Space Mono', monospace";
    ctx.fillStyle = INK;
    ctx.fillText("TOTAL", left, y);
    ctx.textAlign = "right";
    ctx.fillStyle = overBudget ? RED : GREEN;
    ctx.fillText(euro(result.total), right, y);
    ctx.textAlign = "left";
    y += 36;
    ctx.font = "400 20px 'Space Mono', monospace";
    ctx.fillStyle = INK;
    ctx.globalAlpha = 0.7;
    ctx.fillText(`Budget prévu : ${euro(budget)}`, left, y);
    ctx.globalAlpha = 1;
    y += 40;
    ctx.font = "400 17px 'Space Mono', monospace";
    ctx.globalAlpha = 0.5;
    ctx.fillText("Prix moyens estimés — projet libre et gratuit", left, y);
    ctx.globalAlpha = 1;
 
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "klar-menu-semaine.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
 
  return (
    <div>
      <div className="grid md:grid-cols-[340px_1fr] gap-8">
        {/* FORM */}
          <div className="space-y-6">
            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK, backgroundColor: "#FFFFFFaa" }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                <Wallet size={16} /> Budget de la semaine
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={15}
                  max={120}
                  step={1}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: STAMP }}
                />
                <span className="text-xl font-bold tabular-nums w-20 text-right" style={{ fontFamily: "'Space Mono', monospace", color: STAMP }}>
                  {budget} €
                </span>
              </div>
              <div className="mt-2.5">
                <Toggle label="Petit budget" checked={econMode} onChange={setEconMode} icon={<Coins size={13} />} />
                <p className="text-xs mt-1.5" style={{ opacity: 0.6 }}>
                  Priorise les recettes les moins chères du pool pour caser un maximum de repas
                  dans ton budget, plutôt qu'un tirage au hasard.
                </p>
              </div>
            </section>
 
            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                <Users size={16} /> Personnes à table
              </label>
              <Stepper value={people} min={1} max={6} onChange={setPeople} />
            </section>
 
            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
                <ChefHat size={16} /> Repas de la semaine
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Moon size={14} /> Dîners</span>
                  <Stepper value={dinners} min={0} max={7} onChange={setDinners} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Sun size={14} /> Déjeuners</span>
                  <Stepper value={lunches} min={0} max={7} onChange={setLunches} />
                </div>
                {totalMeals === 0 && (
                  <p className="text-xs" style={{ color: RED }}>Choisis au moins un dîner ou un déjeuner.</p>
                )}
                <p className="text-xs" style={{ opacity: 0.6 }}>
                  Les deux se complètent : en batch cooking, un même ingrédient peut être partagé entre un dîner
                  et un déjeuner.
                </p>
              </div>
            </section>
 
            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
                <Store size={16} /> Magasin
              </label>
              <ChoiceRow options={STORES} value={store} onChange={setStore} />
              <p className="text-xs mt-2" style={{ opacity: 0.55 }}>
                Écarts de prix indicatifs entre enseignes, basés sur des comparatifs publiés (UFC-Que Choisir).
                Moyennes nationales — ça bouge selon le magasin exact et les promos du moment.
              </p>
            </section>
 
            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
                <ChefHat size={16} /> Préférences
              </label>
              <div className="space-y-3">
                <ChoiceRow
                  options={[
                    { id: "tous", name: "Tous les plats" },
                    { id: "vegetarien", name: "Végétarien" },
                    { id: "sans-poisson", name: "Sans poisson" },
                  ]}
                  value={diet}
                  onChange={setDiet}
                />
                <div>
                  <MultiChoiceRow
                    options={[
                      { id: "healthy", name: "Healthy" },
                      { id: "gourmand", name: "Gourmand" },
                      { id: "proteine", name: "Protéiné" },
                      { id: "anti-inflammatoire", name: "Anti-inflammatoire" },
                    ]}
                    values={styles}
                    onToggle={toggleStyle}
                  />
                  <p className="text-xs mt-1.5" style={{ opacity: 0.6 }}>
                    Coche plusieurs cases pour mélanger les styles (ex. Healthy + Gourmand).
                    « Anti-inflammatoire » privilégie poisson gras, légumineuses, légumes, huile
                    d'olive et épices (curcuma, gingembre) — à titre indicatif, pas un avis médical.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Toggle label="Rapides (≤ 20 min)" checked={quickOnly} onChange={setQuickOnly} />
                  <Toggle label="Sans gluten" checked={glutenFree} onChange={setGlutenFree} />
                  <Toggle label="Batch cooking" checked={batchCooking} onChange={setBatchCooking} icon={<Layers size={13} />} />
                </div>
                <div>
                  <Toggle
                    label="Recettes qui sortent de l'ordinaire"
                    checked={original}
                    onChange={setOriginal}
                    icon={<Sparkles size={13} />}
                  />
                  <p className="text-xs mt-1.5" style={{ opacity: 0.6 }}>
                    Décoché (par défaut) : que des recettes du quotidien, avec des ingrédients
                    courants en supermarché français. Coché : ouvre aussi les recettes plus
                    créatives, avec des ingrédients moins classiques (miso, gochujang, tahini,
                    edamame, sriracha...).
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ fontFamily: "'Space Mono', monospace" }}>
                    Exclure des ingrédients (allergie, dégoût)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={excludeInput}
                      onChange={(e) => setExcludeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addExclusion()}
                      placeholder="ex. crevettes, champignons..."
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border-2 text-sm bg-transparent"
                      style={{ borderColor: INK, color: INK }}
                    />
                    <button
                      onClick={addExclusion}
                      className="px-3 py-1.5 rounded-md border-2 text-xs font-semibold flex-shrink-0"
                      style={{ borderColor: INK, fontFamily: "'Space Mono', monospace" }}
                    >
                      Ajouter
                    </button>
                  </div>
                  {excluded.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {excluded.map((ex) => (
                        <span
                          key={ex}
                          className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-md text-xs font-semibold"
                          style={{ backgroundColor: RED, color: PAPER }}
                        >
                          {ex}
                          <button onClick={() => removeExclusion(ex)} className="p-0.5">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs mt-1.5" style={{ opacity: 0.6 }}>
                    Toute recette contenant un ingrédient exclu est écartée — cette règle n'est jamais relâchée,
                    même si le budget ou le nombre de repas devient difficile à tenir.
                  </p>
                </div>
              </div>
            </section>
 
            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
                <Leaf size={16} /> Fruits &amp; légumes
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle label="Prioriser la saison" checked={seasonal} onChange={setSeasonal} />
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  disabled={!seasonal}
                  className="px-3 py-1.5 rounded-md text-sm font-semibold border-2 bg-transparent"
                  style={{ borderColor: INK, color: INK, opacity: seasonal ? 1 : 0.4, fontFamily: "'Space Mono', monospace" }}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowSeasonCalendar(true)}
                className="mt-2.5 flex items-center gap-1.5 text-xs underline"
                style={{ opacity: 0.75 }}
              >
                <CalendarDays size={13} /> Voir les fruits et légumes de saison
              </button>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: GRID }}>
                <Toggle
                  label="OK pour les surgelés"
                  checked={frozenOk}
                  onChange={setFrozenOk}
                  icon={<Snowflake size={13} />}
                />
                <p className="text-xs mt-1.5" style={{ opacity: 0.6 }}>
                  Remplace certains légumes frais (brocoli, épinards, champignons, poivron,
                  courgette, carottes, patate douce) par leur équivalent surgelé nature quand
                  c'est moins cher — et lève la contrainte de saison pour ces légumes-là.
                </p>
              </div>
            </section>
 
            {activeTips.length > 0 && (
              <div className="space-y-2">
                {activeTips.map((tip) => (
                  <div
                    key={tip.key}
                    className="flex items-start gap-2 text-xs leading-relaxed border-2 rounded-lg p-3"
                    style={{ borderColor: INK, backgroundColor: `${YELLOW}33` }}
                  >
                    <Lightbulb size={14} className="flex-shrink-0 mt-0.5" />
                    <p><strong>Le saviez-vous ?</strong> {tip.text}</p>
                  </div>
                ))}
              </div>
            )}
 
            <button
              onClick={runGenerate}
              disabled={totalMeals === 0}
              className="w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-40"
              style={{ backgroundColor: STAMP, color: PAPER, fontFamily: "'Space Mono', monospace" }}
            >
              <RefreshCw size={18} />
              {!result
                ? "Générer ma semaine"
                : lockedItems.length > 0
                ? `Régénérer (${lockedItems.length} verrouillé${lockedItems.length > 1 ? "s" : ""})`
                : "Régénérer la semaine"}
            </button>
 
            <button
              onClick={() => setShowInfo((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 text-xs underline"
              style={{ opacity: 0.7 }}
            >
              <Info size={13} /> Comment ça marche ?
            </button>
            {showInfo && (
              <div className="text-xs leading-relaxed border-2 rounded-lg p-3 space-y-2" style={{ borderColor: INK, opacity: 0.85 }}>
                <p>
                  Chaque recette a un prix moyen estimé par ingrédient (pas un prix scrapé en magasin). L'appli
                  tire les recettes qui correspondent à tes filtres et remplit tes dîners et déjeuners sans
                  dépasser le budget.
                </p>
                <p>
                  <strong>Batch cooking</strong> : ce n'est pas le même plat mangé deux fois. L'appli choisit deux
                  recettes différentes qui partagent un même ingrédient pivot (ex. blancs de poulet) — idéalement
                  une pour un dîner, l'autre pour un déjeuner — pour que tu l'achètes et le prépares en une fois.
                  Les plats liés portent le même repère de couleur, et une petite remise (achat en plus grande
                  quantité, ~8%, estimée) est appliquée sur l'ingrédient pivot partagé — visible en bas du ticket.
                </p>
                <p>
                  <strong>Petit budget</strong> : au lieu de tirer les recettes au hasard dans les critères
                  choisis, l'appli part des moins chères du lot pour caser un maximum de repas dans ton budget.
                </p>
                <p>
                  <strong>Recettes qui sortent de l'ordinaire</strong> : décoché par défaut, l'appli ne propose
                  que des recettes aux ingrédients courants en supermarché français. Coché, elle ouvre aussi des
                  recettes plus créatives avec des ingrédients moins classiques (miso, gochujang, tahini...).
                </p>
                <p>
                  <strong>OK pour les surgelés</strong> : remplace certains légumes frais (brocoli, épinards,
                  champignons, poivron, courgette, carottes, patate douce) par leur équivalent surgelé nature,
                  généralement moins cher, et permet de proposer ces recettes même hors saison.
                </p>
                <p>
                  <strong>Verrouiller un plat</strong> : clique sur le cadenas à côté d'un plat pour le figer. Au
                  clic suivant sur « Régénérer », ce plat reste et seul le reste de la semaine change.
                </p>
                <p>
                  <strong>Exclure des ingrédients</strong> : ajoute un mot (allergie, dégoût) et aucune recette
                  qui le contient ne sera proposée, quels que soient les autres filtres.
                </p>
                <p>
                  <strong>Nutrition</strong> : les kcal / protéines affichées sous chaque plat sont une estimation
                  grossière (par catégorie d'ingrédient), pas une valeur nutritionnelle mesurée.
                </p>
                <p>
                  <strong>Anti-inflammatoire</strong> : sélectionne des plats construits autour d'aliments
                  associés à une alimentation anti-inflammatoire (poisson gras, légumineuses, légumes, huile
                  d'olive, curcuma, gingembre) et évite la charcuterie, la friture et les produits très
                  transformés. C'est une indication nutritionnelle générale, pas un conseil médical.
                </p>
                <p>
                  <strong>Format entier</strong> : certains produits (bouillon, épices, sauces...) ne se vendent
                  pas à la juste quantité utilisée dans la recette — tu ne trouveras pas une cuillère de bouillon
                  en rayon, seulement la boîte entière. Le prix et la ligne « besoin réel » dans la liste de
                  courses reflètent ça.
                </p>
                <p>
                  <strong>Déjà chez toi</strong> : coche un ingrédient de la liste de courses si tu l'as déjà. Il
                  est retiré du total à acheter et n'apparaît plus dans la liste copiée ou téléchargée.
                </p>
                <p>
                  <strong>Saison</strong> : les légumes frais ont une fenêtre de saison en France. Active le
                  filtre pour ne garder que les recettes dont les légumes frais collent au mois choisi.
                </p>
              </div>
            )}
          </div>
 
          {/* RESULT — RECEIPT */}
          <div>
            {!result ? (
              <div
                className="h-full min-h-[420px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-3 p-8"
                style={{ borderColor: INK, opacity: 0.6 }}
              >
                <ShoppingCart size={40} />
                <p className="max-w-xs text-sm">
                  Règle ton budget et clique sur « Générer ma semaine » pour voir apparaître ton ticket.
                </p>
              </div>
            ) : result.chosen.length === 0 ? (
              <div
                className="h-full min-h-[420px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-3 p-8"
                style={{ borderColor: RED, opacity: 0.85 }}
              >
                <ShoppingCart size={40} />
                <p className="max-w-xs text-sm">
                  Aucune recette ne correspond à tes critères — vérifie tes ingrédients exclus ou élargis tes
                  filtres, puis régénère.
                </p>
              </div>
            ) : (
              <div>
                {/* receipt */}
                <div
                  className="border-2 shadow-sm px-6 pt-6 pb-2"
                  style={{ borderColor: INK, backgroundColor: "#FFFFFF", fontFamily: "'Space Mono', monospace" }}
                >
                  <div className="text-center mb-4">
                    <div className="font-bold text-lg tracking-widest">KLAR</div>
                    <div className="text-xs opacity-70 capitalize">{today}</div>
                    <div className="text-xs opacity-70">
                      {STORES.find((s) => s.id === store)?.name} · {people} pers. · {dinners} dîners · {lunches} déjeuners
                      {batchCooking && " · batch cooking"}
                    </div>
                  </div>
                  <div className="border-t border-dashed mb-3" style={{ borderColor: INK }} />
 
                  {[
                    { key: "diner", label: "DÎNERS", icon: <Moon size={13} /> },
                    { key: "dejeuner", label: "DÉJEUNERS", icon: <Sun size={13} /> },
                  ].map(({ key, label, icon }) => {
                    const items = result.chosen.filter((c) => c.meal === key);
                    if (!items.length) return null;
                    return (
                      <div key={key} className="mb-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold mb-1.5 opacity-70">
                          {icon} {label}
                        </div>
                        <ul className="space-y-2 text-sm">
                          {items.map((item, idx) => {
                            const color = result.colorMap[item.base];
                            const nutri = NUTRITION_BY_ID[item.r.id];
                            const locked = isLocked(item);
                            return (
                              <li key={item.r.id + "-" + key + "-" + idx}>
                                <div className="flex items-baseline gap-2">
                                  <span className="flex-shrink-0 opacity-50">{String(idx + 1).padStart(2, "0")}</span>
                                  <span className="flex-1">{item.r.name}</span>
                                  <span className="flex-1 border-b border-dotted opacity-40 min-w-[10px]" />
                                  <span className="flex-shrink-0 font-bold">{euro(item.cost)}</span>
                                  <button
                                    onClick={() => toggleLock(item)}
                                    title={locked ? "Déverrouiller ce plat" : "Verrouiller ce plat pour la prochaine régénération"}
                                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border-2 transition-colors"
                                    style={{
                                      borderColor: locked ? STAMP : INK,
                                      backgroundColor: locked ? STAMP : "transparent",
                                      color: locked ? PAPER : INK,
                                      opacity: locked ? 1 : 0.55,
                                    }}
                                  >
                                    {locked ? <Lock size={11} /> : <Unlock size={11} />}
                                  </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap ml-6 mt-0.5">
                                  {color && (
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                                      <span className="text-[10px] opacity-70">lot partagé : {item.base}</span>
                                    </span>
                                  )}
                                  <span className="text-[10px] opacity-55">
                                    ≈ {nutri.kcal} kcal · {nutri.protein} g prot. / pers.
                                  </span>
                                  {locked && (
                                    <span className="text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: STAMP, color: PAPER }}>
                                      verrouillé
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
 
                  <div className="border-t border-dashed my-3" style={{ borderColor: INK }} />
 
                  <div className="flex items-baseline justify-between font-bold text-base mb-1">
                    <span>TOTAL</span>
                    <span style={{ color: overBudget ? RED : GREEN }}>{euro(result.total)}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs opacity-70 mb-1">
                    <span>Budget prévu</span>
                    <span>{euro(budget)}</span>
                  </div>
                  {result.batchSavings > 0.01 && (
                    <div className="flex items-baseline justify-between text-xs mb-4" style={{ color: GREEN }}>
                      <span className="flex items-center gap-1"><Layers size={11} /> Économie batch cooking</span>
                      <span>− {euro(result.batchSavings)}</span>
                    </div>
                  )}
                  {!(result.batchSavings > 0.01) && <div className="mb-4" />}
 
                  <div
                    className="text-center text-xs font-bold py-1.5 rounded mb-4"
                    style={{ backgroundColor: overBudget ? RED : GREEN, color: PAPER }}
                  >
                    {overBudget
                      ? `Dépassement de ${euro(result.total - budget)} — essaie moins de repas ou un autre magasin`
                      : `Dans le budget — il reste ${euro(budget - result.total)}`}
                  </div>
                </div>
                {/* zigzag edge */}
                <div
                  style={{
                    height: 14,
                    backgroundColor: "#FFFFFF",
                    backgroundImage: `linear-gradient(135deg, ${PAPER} 7px, transparent 0), linear-gradient(-135deg, ${PAPER} 7px, transparent 0)`,
                    backgroundSize: "14px 14px",
                    backgroundPosition: "bottom",
                    backgroundRepeat: "repeat-x",
                  }}
                />
 
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={downloadMenuImage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                    style={{ borderColor: INK, fontFamily: "'Space Mono', monospace" }}
                  >
                    <ImageIcon size={14} /> Menu en image (PNG)
                  </button>
                </div>
 
                {/* shopping list */}
                <div className="mt-8">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <h2 className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "'Kalam', cursive" }}>
                      <ShoppingCart size={20} /> Liste de courses
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={copyShoppingList}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                        style={{ borderColor: INK, backgroundColor: copied ? YELLOW : "transparent", fontFamily: "'Space Mono', monospace" }}
                      >
                        <Copy size={13} /> {copied ? "Copié !" : "Copier vers Notes"}
                      </button>
                      <button
                        onClick={downloadShoppingList}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                        style={{ borderColor: INK, fontFamily: "'Space Mono', monospace" }}
                      >
                        <Download size={13} /> .txt
                      </button>
                    </div>
                  </div>
                  <p className="text-xs mb-4" style={{ opacity: 0.6 }}>
                    Coche un ingrédient si tu l'as déjà chez toi : il est retiré du panier et de l'export.
                    « Copier » colle direct dans ton appli Notes.
                  </p>
                  <div className="space-y-5">
                    {CATEGORY_ORDER.filter((cat) => result.shopping.some((i) => i.cat === cat)).map((cat) => (
                      <div key={cat}>
                        <div
                          className="text-xs font-bold uppercase tracking-wide mb-1.5 pb-1 border-b-2"
                          style={{ borderColor: INK, fontFamily: "'Space Mono', monospace" }}
                        >
                          {cat}
                        </div>
                        <ul className="space-y-1">
                          {result.shopping
                            .filter((i) => i.cat === cat)
                            .map((i) => {
                              const key = i.name + i.unit;
                              const isChecked = !!checked[key];
                              const hasSeasonData = cat === "Fruits & légumes" && !!SEASON[i.name];
                              const inSeason = hasSeasonData && isIngredientInSeason(i.name, month);
                              return (
                                <li key={key}>
                                  <button
                                    onClick={() => toggleCheck(key)}
                                    className="w-full flex items-center gap-2 py-1 text-sm text-left"
                                    style={{ opacity: isChecked ? 0.4 : 1 }}
                                  >
                                    <span
                                      className="w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0"
                                      style={{ borderColor: INK, backgroundColor: isChecked ? INK : "transparent" }}
                                    >
                                      {isChecked && <Check size={11} color={PAPER} strokeWidth={3} />}
                                    </span>
                                    <span className="flex-1" style={{ textDecoration: isChecked ? "line-through" : "none" }}>
                                      {i.name}
                                      {isChecked && (
                                        <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: INK, color: PAPER }}>
                                          déjà chez toi
                                        </span>
                                      )}
                                      {!isChecked && hasSeasonData && (
                                        <span
                                          className="ml-1.5 text-[10px] px-1 py-0.5 rounded"
                                          style={{ backgroundColor: inSeason ? GREEN : RED, color: PAPER }}
                                        >
                                          {inSeason ? "de saison" : "hors saison"}
                                        </span>
                                      )}
                                      {!isChecked && i.packLabel && (
                                        <span
                                          className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded"
                                          style={{ backgroundColor: YELLOW, color: INK }}
                                          title={`Vendu par ${i.packLabel} — tu n'utilises qu'une partie mais tu dois acheter le format entier.`}
                                        >
                                          <Info size={9} /> format entier
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-xs opacity-60 tabular-nums text-right">{fmtQty(i)}</span>
                                    <span className="text-xs font-bold tabular-nums w-14 text-right" style={{ fontFamily: "'Space Mono', monospace" }}>
                                      {euro(i.price)}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                    ))}
                  </div>
 
                  <div className="border-t-2 mt-4 pt-3" style={{ borderColor: INK }}>
                    <div className="flex items-baseline justify-between font-bold text-sm">
                      <span>Total du panier à acheter</span>
                      <span style={{ fontFamily: "'Space Mono', monospace", color: GREEN }}>{euro(cartTotal)}</span>
                    </div>
                    {haveCount > 0 && (
                      <p className="text-xs mt-1" style={{ opacity: 0.6 }}>
                        {haveCount} ingrédient{haveCount > 1 ? "s" : ""} déjà chez toi, déduit{haveCount > 1 ? "s" : ""} du panier.
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ opacity: 0.5 }}>
                      Différent du total du ticket : le prix ici reflète le format vraiment vendu en rayon (ex. tu
                      n'achètes pas juste une cuillère de bouillon, mais la boîte entière — repère
                      <span className="mx-1 inline-flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded align-middle" style={{ backgroundColor: YELLOW, color: INK }}>
                        <Info size={9} /> format entier
                      </span>
                      ), pas seulement la quantité utilisée dans les recettes.
                    </p>
                  </div>
 
                  <a
                    href={DRIVE_LINKS[store]}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: STAMP, color: PAPER, fontFamily: "'Space Mono', monospace" }}
                  >
                    <ShoppingBag size={16} /> Faire mes courses chez {storeName}
                  </a>
                  <p className="text-xs text-center mt-1.5" style={{ opacity: 0.55 }}>
                    Ouvre le drive {storeName} pour récupérer directement le panier ci-dessus.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
 
        {/* BANDEAU TOUJOURS VISIBLE — raccourcis livraison */}
        <div className="mt-12 rounded-xl p-6 sm:p-8" style={{ backgroundColor: INK, color: PAPER }}>
          <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: "'Kalam', cursive" }}>
            Encore plus simple
          </h2>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold mb-1.5">
                <Truck size={16} /> Envie de plus simple ? ?
              </div>
              <p className="text-xs mb-3" style={{ opacity: 0.75 }}>
                Les box repas comme Quitoque ou HelloFresh livrent des ingrédients frais et des recettes prêtes à
                cuisiner directement chez toi, sans passer par le magasin.
              </p>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={AFFILIATE_LINKS.quitoque}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                  style={{ borderColor: PAPER, fontFamily: "'Space Mono', monospace" }}
                >
                  Quitoque
                </a>
                <a
                  href={AFFILIATE_LINKS.hellofresh}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                  style={{ borderColor: PAPER, fontFamily: "'Space Mono', monospace" }}
                >
                  HelloFresh
                </a>
              </div>
            </div>
 
            <div>
              <div className="flex items-center gap-2 text-sm font-bold mb-1.5">
                <Bike size={16} /> Pas le temps de faire les courses ?
              </div>
              <p className="text-xs mb-3" style={{ opacity: 0.75 }}>
                Deliveroo et Uber Eats livrent vos courses directement chez vous !.
              </p>
              <div className="flex gap-2 flex-wrap">
                <a
                  href={AFFILIATE_LINKS.deliveroo}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                  style={{ borderColor: PAPER, fontFamily: "'Space Mono', monospace" }}
                >
                  Deliveroo
                </a>
                <a
                  href={AFFILIATE_LINKS.ubereats}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                  style={{ borderColor: PAPER, fontFamily: "'Space Mono', monospace" }}
                >
                  Uber Eats
                </a>
              </div>
            </div>
          </div>
        </div>
 
        <footer className="mt-14 pt-4 border-t text-xs opacity-50" style={{ borderColor: GRID }}>
          Prix moyens estimés à titre indicatif, pas des prix relevés en temps réel en magasin. Saisonnalité
          basée sur le calendrier français des légumes frais. Estimations nutritionnelles grossières, à titre
          indicatif uniquement. Projet libre, gratuit et sans compte.
        </footer>
 
      {showSeasonCalendar && (
        <SeasonCalendarModal month={month} onMonthChange={setMonth} onClose={() => setShowSeasonCalendar(false)} />
      )}
    </div>
  );
}
 
/* ------------------------------------------------------------------ */
/*  KLAR DE GROUPE — composant                                         */
/* ------------------------------------------------------------------ */
 
function MemberChip({ member, onRemove }) {
  return (
    <span
      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full text-sm font-semibold"
      style={{ backgroundColor: member.color, color: INK, fontFamily: "'Space Mono', monospace" }}
    >
      {member.name}
      <button onClick={() => onRemove(member.id)} className="p-0.5 rounded-full" style={{ opacity: 0.7 }}>
        <X size={12} />
      </button>
    </span>
  );
}
 
function VacationModeCard({ mode, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[110px] flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border-2 transition-colors"
      style={{
        borderColor: INK,
        backgroundColor: active ? INK : "transparent",
        color: active ? PAPER : INK,
      }}
    >
      {icon}
      <span className="text-xs font-semibold text-center" style={{ fontFamily: "'Space Mono', monospace" }}>
        {mode.name}
      </span>
    </button>
  );
}
 
function KlarGroupe() {
  const currentMonth = new Date().getMonth() + 1;
 
  const [tripId] = useState(() => uid());
  const [tripName, setTripName] = useState("");
  const [vacationMode, setVacationMode] = useState("mixte");
  const [groupBudget, setGroupBudget] = useState(80);
  const [groupPeople, setGroupPeople] = useState(4);
  const [groupDays, setGroupDays] = useState(5);
  const [dinners, setDinners] = useState(5);
  const [lunches, setLunches] = useState(0);
  const [store, setStore] = useState("leclerc");
  const [diet, setDiet] = useState("tous");
  const [styles, setStyles] = useState([]);
  const [glutenFree, setGlutenFree] = useState(false);
  const [batchCooking, setBatchCooking] = useState(false);
  const [excluded, setExcluded] = useState([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [frozenOk, setFrozenOk] = useState(false);
  const [econMode, setEconMode] = useState(false);
  const [seasonal, setSeasonal] = useState(false);
  const [month] = useState(currentMonth);
 
  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");
  const [assignments, setAssignments] = useState({}); // { "recipeId|meal": memberId }
 
  const [result, setResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
 
  const addMember = () => {
    const name = memberInput.trim();
    if (!name) return;
    setMembers((prev) => [...prev, { id: uid(), name, color: PALETTE[prev.length % PALETTE.length] }]);
    setMemberInput("");
  };
  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setAssignments((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (next[k] === id) delete next[k]; });
      return next;
    });
  };
 
  const totalMeals = dinners + lunches;
  const factor = groupPeople / 2;
  const storeMult = STORES.find((s) => s.id === store)?.mult ?? 1;
 
  const runGenerate = useCallback(() => {
    if (totalMeals <= 0) return;
    const r = generateWeek({
      budget: groupBudget, people: groupPeople, dinners, lunches, diet, styles,
      quickOnly: false, glutenFree, seasonal, month, store, batchCooking,
      excluded, lockedItems: [], original: true, frozenOk, econMode, vacationMode,
    });
    setResult(r);
  }, [groupBudget, groupPeople, dinners, lunches, diet, styles, glutenFree, seasonal, month, store, batchCooking, excluded, frozenOk, econMode, vacationMode, totalMeals]);
 
  const assignedChosen = useMemo(() => {
    if (!result) return [];
    return assignMealsToMembers(result.chosen, members, assignments);
  }, [result, members, assignments]);
 
  const reassign = (item, memberId) => {
    const key = item.r.id + "|" + item.meal;
    setAssignments((prev) => ({ ...prev, [key]: memberId }));
  };
 
  const trip = { tripId, name: tripName, vacationMode, groupPeople, groupDays };
 
  const copyText = async (key, text, filename) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      downloadTextFile(filename, text);
    }
  };
 
  const overBudget = result && result.total > groupBudget + 0.01;
 
  return (
    <div>
      <section className="border-2 rounded-lg p-4 mb-6" style={{ borderColor: INK, backgroundColor: "#FFFFFFaa" }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
          <ClipboardList size={16} /> Le séjour
        </label>
        <input
          type="text"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="ex. Vacances à Arcachon"
          className="w-full px-2.5 py-1.5 rounded-md border-2 text-sm bg-transparent mb-3"
          style={{ borderColor: INK, color: INK }}
        />
        <div className="flex flex-wrap gap-2">
          {VACATION_MODES.map((m) => (
            <VacationModeCard
              key={m.id}
              mode={m}
              active={vacationMode === m.id}
              onClick={() => setVacationMode(m.id)}
              icon={
                m.id === "mer" ? <Waves size={18} /> :
                m.id === "montagne" ? <Mountain size={18} /> :
                m.id === "rapide" ? <Sandwich size={18} /> :
                <Sparkles size={18} />
              }
            />
          ))}
        </div>
        <p className="text-xs mt-2" style={{ opacity: 0.6 }}>
          Un mode vacances ouvre des recettes dédiées (ex. tartiflette, moules, sandwichs de
          pique-nique) en plus du catalogue habituel. « Rapide / sandwichs » ne garde que les
          recettes sans cuisson longue, utile pour un jour d'arrivée ou de plage.
        </p>
      </section>
 
      <section className="border-2 rounded-lg p-4 mb-6" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
          <Users size={16} /> Le groupe
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            placeholder="Prénom d'un participant..."
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border-2 text-sm bg-transparent"
            style={{ borderColor: INK, color: INK }}
          />
          <button
            onClick={addMember}
            className="px-3 py-1.5 rounded-md border-2 text-xs font-semibold flex items-center gap-1 flex-shrink-0"
            style={{ borderColor: INK, fontFamily: "'Space Mono', monospace" }}
          >
            <UserPlus size={13} /> Ajouter
          </button>
        </div>
        {members.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <MemberChip key={m.id} member={m} onRemove={removeMember} />
            ))}
          </div>
        ) : (
          <p className="text-xs" style={{ opacity: 0.6 }}>
            Ajoute au moins une personne pour pouvoir répartir les repas et les courses. Sans
            participant, Klar de groupe fonctionne comme un menu de séjour classique.
          </p>
        )}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <span className="text-xs font-semibold block mb-1.5">Personnes à table</span>
            <Stepper value={groupPeople} min={1} max={20} onChange={setGroupPeople} />
          </div>
          <div>
            <span className="text-xs font-semibold block mb-1.5">Jours sur place</span>
            <Stepper value={groupDays} min={1} max={21} onChange={setGroupDays} />
          </div>
        </div>
      </section>
 
      <section className="border-2 rounded-lg p-4 mb-6" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
          <Wallet size={16} /> Budget du séjour
        </label>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="range"
            min={30}
            max={400}
            step={5}
            value={groupBudget}
            onChange={(e) => setGroupBudget(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: STAMP }}
          />
          <span className="text-xl font-bold tabular-nums w-24 text-right" style={{ fontFamily: "'Space Mono', monospace", color: STAMP }}>
            {groupBudget} €
          </span>
        </div>
        <Toggle label="Petit budget" checked={econMode} onChange={setEconMode} icon={<Coins size={13} />} />
 
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Moon size={14} /> Dîners</span>
            <Stepper value={dinners} min={0} max={21} onChange={setDinners} />
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold"><Sun size={14} /> Déjeuners</span>
            <Stepper value={lunches} min={0} max={21} onChange={setLunches} />
          </div>
          {totalMeals === 0 && <p className="text-xs" style={{ color: RED }}>Choisis au moins un dîner ou un déjeuner.</p>}
        </div>
 
        <div className="mt-4">
          <label className="flex items-center gap-2 text-xs font-bold mb-2" style={{ fontFamily: "'Space Mono', monospace" }}>
            <Store size={14} /> Magasin
          </label>
          <ChoiceRow options={STORES} value={store} onChange={setStore} />
        </div>
      </section>
 
      <section className="border-2 rounded-lg p-4 mb-6" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
          <ChefHat size={16} /> Préférences
        </label>
        <div className="space-y-3">
          <ChoiceRow
            options={[
              { id: "tous", name: "Tous les plats" },
              { id: "vegetarien", name: "Végétarien" },
              { id: "sans-poisson", name: "Sans poisson" },
            ]}
            value={diet}
            onChange={setDiet}
          />
          <MultiChoiceRow
            options={[
              { id: "healthy", name: "Healthy" },
              { id: "gourmand", name: "Gourmand" },
              { id: "proteine", name: "Protéiné" },
              { id: "anti-inflammatoire", name: "Anti-inflammatoire" },
            ]}
            values={styles}
            onToggle={(id) => setStyles((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          />
          <div className="flex flex-wrap gap-2">
            <Toggle label="Sans gluten" checked={glutenFree} onChange={setGlutenFree} />
            <Toggle label="Batch cooking" checked={batchCooking} onChange={setBatchCooking} icon={<Layers size={13} />} />
            <Toggle label="OK pour les surgelés" checked={frozenOk} onChange={setFrozenOk} icon={<Snowflake size={13} />} />
            <Toggle label="Prioriser la saison" checked={seasonal} onChange={setSeasonal} icon={<Leaf size={13} />} />
          </div>
          <div>
            <label className="text-xs font-bold mb-1.5 block" style={{ fontFamily: "'Space Mono', monospace" }}>
              Exclure des ingrédients (allergie, dégoût)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={excludeInput}
                onChange={(e) => setExcludeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (() => {
                  const v = excludeInput.trim().toLowerCase();
                  if (v) setExcluded((prev) => (prev.includes(v) ? prev : [...prev, v]));
                  setExcludeInput("");
                })()}
                placeholder="ex. crevettes, champignons..."
                className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border-2 text-sm bg-transparent"
                style={{ borderColor: INK, color: INK }}
              />
              <button
                onClick={() => {
                  const v = excludeInput.trim().toLowerCase();
                  if (v) setExcluded((prev) => (prev.includes(v) ? prev : [...prev, v]));
                  setExcludeInput("");
                }}
                className="px-3 py-1.5 rounded-md border-2 text-xs font-semibold flex-shrink-0"
                style={{ borderColor: INK, fontFamily: "'Space Mono', monospace" }}
              >
                Ajouter
              </button>
            </div>
            {excluded.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {excluded.map((ex) => (
                  <span key={ex} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-md text-xs font-semibold" style={{ backgroundColor: RED, color: PAPER }}>
                    {ex}
                    <button onClick={() => setExcluded((prev) => prev.filter((x) => x !== ex))} className="p-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
 
      <button
        onClick={runGenerate}
        disabled={totalMeals === 0}
        className="w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-40"
        style={{ backgroundColor: STAMP, color: PAPER, fontFamily: "'Space Mono', monospace" }}
      >
        <RefreshCw size={18} />
        {!result ? "Générer le menu du séjour" : "Régénérer le menu du séjour"}
      </button>
 
      {result && (
        <div className="mt-8">
          {result.chosen.length === 0 ? (
            <div className="border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center gap-3 p-8" style={{ borderColor: RED, opacity: 0.85 }}>
              <ShoppingCart size={40} />
              <p className="max-w-xs text-sm">
                Aucune recette ne correspond à tes critères pour ce mode vacances — élargis les
                filtres ou choisis « Tout le catalogue », puis régénère.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-lg font-bold" style={{ fontFamily: "'Kalam', cursive" }}>
                  Répartition des repas
                </h3>
                <span className="text-sm font-bold" style={{ color: overBudget ? RED : GREEN, fontFamily: "'Space Mono', monospace" }}>
                  {euro(result.total)} / {euro(groupBudget)}
                </span>
              </div>
              <p className="text-xs mb-3" style={{ opacity: 0.6 }}>
                Chaque repas est attribué à un participant (achat + préparation), à tour de rôle
                par défaut. Clique sur un prénom pour réassigner un repas.
              </p>
              <div className="space-y-2">
                {assignedChosen.map((item, idx) => {
                  const assignedMember = members.find((m) => m.id === item.memberId);
                  return (
                    <div
                      key={item.r.id + "-" + item.meal + "-" + idx}
                      className="flex items-center gap-2 border-2 rounded-lg px-3 py-2 flex-wrap"
                      style={{ borderColor: INK, backgroundColor: "#FFFFFF" }}
                    >
                      <span className="flex-shrink-0 opacity-50">{item.meal === "diner" ? <Moon size={14} /> : <Sun size={14} />}</span>
                      <span className="flex-1 text-sm font-semibold min-w-[140px]">{item.r.name}</span>
                      <span className="text-xs font-bold" style={{ fontFamily: "'Space Mono', monospace" }}>{euro(item.cost)}</span>
                      <div className="flex flex-wrap gap-1">
                        {members.length === 0 ? (
                          <span className="text-[10px] opacity-50">ajoute des participants</span>
                        ) : (
                          members.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => reassign(item, m.id)}
                              className="px-2 py-1 rounded-full text-[11px] font-semibold border-2"
                              style={{
                                borderColor: INK,
                                backgroundColor: assignedMember?.id === m.id ? m.color : "transparent",
                                fontFamily: "'Space Mono', monospace",
                              }}
                            >
                              {m.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
 
              {members.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "'Kalam', cursive" }}>
                    <Share2Icon /> La liste de chacun
                  </h3>
                  <p className="text-xs mb-3" style={{ opacity: 0.6 }}>
                    Chaque participant reçoit ses repas et sa propre liste de courses à copier et
                    envoyer (WhatsApp, SMS, Notes...). Pas de synchro en direct pour l'instant :
                    chacun a sa copie du moment de l'envoi.
                  </p>
                  <div className="space-y-3">
                    {members.map((m) => {
                      const text = buildMemberText(trip, assignedChosen, m, frozenOk, factor, storeMult, batchCooking, result.pairedBases);
                      const myMealCount = assignedChosen.filter((c) => c.memberId === m.id).length;
                      return (
                        <div key={m.id} className="border-2 rounded-lg p-3" style={{ borderColor: INK }}>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="flex items-center gap-2 text-sm font-bold">
                              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                              {m.name}
                              <span className="text-xs font-normal opacity-60">
                                {myMealCount} repas{myMealCount > 1 ? "" : ""}
                              </span>
                            </span>
                            <button
                              onClick={() => copyText(m.id, text, `klar-groupe-${m.name}.txt`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border-2"
                              style={{ borderColor: INK, backgroundColor: copiedKey === m.id ? YELLOW : "transparent", fontFamily: "'Space Mono', monospace" }}
                            >
                              <Copy size={13} /> {copiedKey === m.id ? "Copié !" : `Copier la part de ${m.name}`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => copyText("all", buildGroupSummaryText(trip, assignedChosen, members), "klar-groupe-recap.txt")}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold border-2"
                    style={{ borderColor: INK, backgroundColor: copiedKey === "all" ? YELLOW : "transparent", fontFamily: "'Space Mono', monospace" }}
                  >
                    <ListChecks size={14} /> {copiedKey === "all" ? "Copié !" : "Copier le récap complet du groupe"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
 
/* ------------------------------------------------------------------ */
/*  APP (racine) — onglets Klar solo / Klar de groupe                  */
/* ------------------------------------------------------------------ */
 
function Share2Icon() {
  return <ClipboardList size={18} className="inline -mt-1 mr-1.5" />;
}
 
export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Kalam:wght@400;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);
 
  const [tab, setTab] = useState("solo"); // 'solo' | 'groupe'
 
  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: PAPER,
        backgroundImage: `linear-gradient(${GRID} 1px, transparent 1px), linear-gradient(90deg, ${GRID} 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
        color: INK,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div className="max-w-5xl mx-auto px-5 pt-10">
        <header className="mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Kalam', cursive" }}>
              Klar
            </h1>
            <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: YELLOW, fontFamily: "'Space Mono', monospace" }}>
              menus &amp; courses, à ton budget
            </span>
          </div>
          <p className="mt-2 text-sm max-w-xl" style={{ opacity: 0.75 }}>
            {tab === "solo"
              ? "Choisis ton budget, ton magasin, tes envies — Klar compose ta semaine de repas et la liste de courses qui va avec. Gratuit, sans compte, sans surprise à la fin."
              : "Organise les repas d'un séjour à plusieurs : répartis qui achète quoi, qui cuisine quoi, et envoie sa part à chacun."}
          </p>
        </header>
 
        <div className="flex gap-2 mb-8 border-b-2" style={{ borderColor: INK }}>
          <button
            onClick={() => setTab("solo")}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-4 -mb-0.5 transition-colors"
            style={{
              borderColor: tab === "solo" ? STAMP : "transparent",
              color: tab === "solo" ? INK : "#22201C88",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            <ChefHat size={15} /> Klar solo
          </button>
          <button
            onClick={() => setTab("groupe")}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-4 -mb-0.5 transition-colors"
            style={{
              borderColor: tab === "groupe" ? STAMP : "transparent",
              color: tab === "groupe" ? INK : "#22201C88",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            <Users size={15} /> Klar de groupe
          </button>
        </div>
      </div>
 
      <div className="max-w-5xl mx-auto px-5 pb-10">
        {tab === "solo" ? <KlarSolo /> : <KlarGroupe />}
      </div>
    </div>
  );
}
 




