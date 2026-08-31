import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShoppingCart, RefreshCw, Users, Wallet, Store, ChefHat, Info, Check,
  Layers, Leaf, Download, Copy, Image as ImageIcon, Sun, Moon,
  ShoppingBag, Truck, Bike,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const STORES = [
  { id: "lidl", name: "Lidl", mult: 0.82 },
  { id: "aldi", name: "Aldi", mult: 0.80 },
  { id: "leclerc", name: "Leclerc", mult: 0.95 },
  { id: "intermarche", name: "Intermarché", mult: 0.98 },
  { id: "auchan", name: "Auchan", mult: 1.00 },
  { id: "carrefour", name: "Carrefour", mult: 1.08 },
  { id: "monoprix", name: "Monoprix", mult: 1.22 },
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

// Prix moyens ESTIMÉS pour 2 personnes (pas des prix scrapés en temps réel).
// style: healthy | gourmand | proteine (cumulables).
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
  { id: 2, name: "Poulet rôti & légumes", tags: ["viande"], style: ["healthy", "proteine"], base: "Cuisses de poulet", dinnerOnly: true, diff: "moyen", gluten: false, time: 60,
    ing: [
      { n: "Cuisses de poulet", q: 4, u: "pièce", c: "Viande & poisson", p: 4.50 },
      { n: "Pommes de terre", q: 600, u: "g", c: "Fruits & légumes", p: 0.90 },
      { n: "Carottes", q: 300, u: "g", c: "Fruits & légumes", p: 0.60 },
      { n: "Oignon", q: 2, u: "pièce", c: "Fruits & légumes", p: 0.30 },
      { n: "Thym", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.50 },
    ] },
  { id: 3, name: "Curry de pois chiches", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine"], base: "Pois chiches", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Pois chiches", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.90 },
      { n: "Lait de coco", q: 200, u: "ml", c: "Féculents & épicerie", p: 1.20 },
      { n: "Tomates concassées", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.80 },
      { n: "Oignon", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.15 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Épices curry", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 4, name: "Saumon poêlé, riz basmati", tags: ["poisson", "rapide"], style: ["healthy", "proteine"], base: "Pavés de saumon", diff: "facile", gluten: false, time: 20,
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
  { id: 6, name: "Omelette champignons, salade", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine"], base: "Œufs", diff: "facile", gluten: false, time: 15,
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
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Légumes wok", q: 400, u: "g", c: "Surgelés", p: 1.80 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 9, name: "Soupe de légumes, croûtons", tags: ["vegetarien"], style: ["healthy"], base: "Légumes à soupe", diff: "facile", gluten: true, time: 30,
    ing: [
      { n: "Légumes à soupe", q: 800, u: "g", c: "Fruits & légumes", p: 1.60 },
      { n: "Pain (pour croûtons)", q: 4, u: "tranche", c: "Boulangerie", p: 0.60 },
      { n: "Crème fraîche", q: 10, u: "cl", c: "Crèmerie", p: 0.50 },
    ] },
  { id: 10, name: "Steak haché, frites maison", tags: ["viande", "rapide"], style: ["proteine", "gourmand"], base: "Steaks hachés", diff: "facile", gluten: false, time: 25,
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
  { id: 14, name: "Cabillaud en papillote", tags: ["poisson"], style: ["healthy", "proteine"], base: "Dos de cabillaud", diff: "facile", gluten: false, time: 30,
    ing: [
      { n: "Dos de cabillaud", q: 2, u: "pièce", c: "Viande & poisson", p: 6.00 },
      { n: "Courgette", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.70 },
      { n: "Tomates cerises", q: 200, u: "g", c: "Fruits & légumes", p: 1.50 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 15, name: "Ratatouille, œuf poché", tags: ["vegetarien"], style: ["healthy"], base: "Œufs", dinnerOnly: true, diff: "moyen", gluten: true, time: 45,
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
  { id: 18, name: "Dahl de lentilles corail", tags: ["vegetarien", "rapide"], style: ["healthy", "proteine"], base: "Lentilles corail", diff: "facile", gluten: false, time: 20,
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
  { id: 24, name: "Velouté de courgettes, pain", tags: ["vegetarien"], style: ["healthy"], base: "Courgettes", diff: "facile", gluten: true, time: 25,
    ing: [
      { n: "Courgettes", q: 800, u: "g", c: "Fruits & légumes", p: 1.60 },
      { n: "Crème fraîche", q: 15, u: "cl", c: "Crèmerie", p: 0.70 },
      { n: "Pain", q: 1, u: "pièce", c: "Boulangerie", p: 1.00 },
    ] },

  /* --- Inspirées de tendances food TikTok / Loulou Kitchen --- */
  { id: 25, name: "Riz frit au poulet, légumes du frigo", tags: ["viande", "rapide"], style: ["healthy", "proteine"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Carottes", q: 150, u: "g", c: "Fruits & légumes", p: 0.30 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Champignons", q: 150, u: "g", c: "Fruits & légumes", p: 0.90 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 26, name: "Poulet croustillant au miel, haricots verts", tags: ["viande"], style: ["gourmand", "proteine"], base: "Blancs de poulet", diff: "moyen", gluten: true, time: 35,
    ing: [
      { n: "Blancs de poulet", q: 400, u: "g", c: "Viande & poisson", p: 4.80 },
      { n: "Corn flakes nature", q: 100, u: "g", c: "Féculents & épicerie", p: 1.50 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Œufs", q: 2, u: "pièce", c: "Crèmerie", p: 0.60 },
      { n: "Haricots verts surgelés", q: 400, u: "g", c: "Surgelés", p: 1.60 },
      { n: "Yaourt grec", q: 2, u: "pièce", c: "Crèmerie", p: 1.00 },
    ] },
  { id: 27, name: "Bowl poulet, riz, avocat", tags: ["viande", "rapide"], style: ["healthy", "proteine"], base: "Blancs de poulet", diff: "facile", gluten: false, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Tomates cerises", q: 150, u: "g", c: "Fruits & légumes", p: 1.10 },
      { n: "Maïs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.70 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
  { id: 28, name: "Wrap César au poulet croustillant", tags: ["viande", "rapide"], style: ["gourmand"], base: "Blancs de poulet", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
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
  { id: 30, name: "Pâtes au four, feta et tomates cerises", tags: ["vegetarien"], style: ["gourmand", "healthy"], base: "Feta", diff: "moyen", gluten: true, time: 40,
    ing: [
      { n: "Pâtes", q: 250, u: "g", c: "Féculents & épicerie", p: 0.60 },
      { n: "Feta", q: 200, u: "g", c: "Crèmerie", p: 2.40 },
      { n: "Tomates cerises", q: 400, u: "g", c: "Fruits & légumes", p: 2.80 },
      { n: "Ail", q: 3, u: "gousse", c: "Fruits & légumes", p: 0.30 },
      { n: "Basilic", q: 1, u: "botte", c: "Fruits & légumes", p: 1.00 },
    ] },
  { id: 31, name: "Poke bowl saumon, avocat, riz vinaigré", tags: ["poisson", "rapide"], style: ["healthy", "proteine"], base: "Pavés de saumon", diff: "facile", gluten: true, time: 20,
    ing: [
      { n: "Pavés de saumon", q: 200, u: "g", c: "Viande & poisson", p: 4.50 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Concombre", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.80 },
      { n: "Edamame", q: 100, u: "g", c: "Surgelés", p: 1.20 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
    ] },
  { id: 32, name: "Soupe de poulet à l'orzo et citron", tags: ["viande"], style: ["healthy", "proteine"], base: "Cuisses de poulet", diff: "moyen", gluten: true, time: 45,
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
      { n: "Blancs de poulet", q: 300, u: "g", c: "Viande & poisson", p: 3.60 },
      { n: "Sauce soja", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.40 },
      { n: "Miel", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.60 },
      { n: "Riz", q: 200, u: "g", c: "Féculents & épicerie", p: 0.50 },
      { n: "Brocoli", q: 200, u: "g", c: "Fruits & légumes", p: 0.80 },
      { n: "Sésame", q: 1, u: "sachet", c: "Féculents & épicerie", p: 0.30 },
    ] },
  { id: 34, name: "Wraps healthy thon, avocat", tags: ["poisson", "rapide"], style: ["healthy", "proteine"], base: "Thon en boîte", diff: "facile", gluten: true, time: 15,
    ing: [
      { n: "Thon en boîte", q: 2, u: "boîte", c: "Viande & poisson", p: 2.60 },
      { n: "Tortillas", q: 4, u: "pièce", c: "Féculents & épicerie", p: 1.20 },
      { n: "Avocat", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.20 },
      { n: "Salade verte", q: 1, u: "pièce", c: "Fruits & légumes", p: 1.00 },
      { n: "Maïs", q: 1, u: "boîte", c: "Féculents & épicerie", p: 0.70 },
      { n: "Citron", q: 1, u: "pièce", c: "Fruits & légumes", p: 0.30 },
    ] },
];

const PALETTE = ["#F2C14E", "#8FB9A8", "#E3A6A1", "#B9C6E0", "#D8B4E2"];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

function recipeCost(recipe, factor, storeMult) {
  return recipe.ing.reduce((sum, i) => sum + i.p * factor, 0) * storeMult;
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

function recipeInSeason(r, month) {
  return r.ing.every((i) => i.c !== "Fruits & légumes" || isIngredientInSeason(i.n, month));
}

function buildPool({ diet, styles, quickOnly, glutenFree, seasonal, month }) {
  const dietTest = (r) =>
    diet === "tous" || (diet === "vegetarien" ? r.tags.includes("vegetarien") : !r.tags.includes("poisson"));
  const styleTest = (r) => !styles || styles.length === 0 || r.style.some((s) => styles.includes(s));
  const quickTest = (r) => !quickOnly || r.tags.includes("rapide");
  const glutenTest = (r) => !glutenFree || !r.gluten;
  const seasonTest = (r) => !seasonal || recipeInSeason(r, month);

  // Relâche progressivement les contraintes les moins prioritaires si le pool est vide.
  const layers = [
    [dietTest, styleTest, quickTest, glutenTest, seasonTest],
    [dietTest, styleTest, quickTest, glutenTest],
    [dietTest, styleTest, quickTest],
    [dietTest, styleTest],
    [dietTest],
    [],
  ];
  for (const layer of layers) {
    const pool = RECIPES.filter((r) => layer.every((f) => f(r)));
    if (pool.length > 0) return pool;
  }
  return RECIPES;
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

// Sélection "classique" : recettes indépendantes pour chaque créneau dîner / déjeuner.
function selectSingles(pool, dinners, lunches, budget, costOf) {
  const chosen = [];
  const used = new Set();
  let total = 0;
  const dinnerCount = () => chosen.filter((c) => c.meal === "diner").length;
  const lunchCount = () => chosen.filter((c) => c.meal === "dejeuner").length;

  for (const r of shuffle(pool)) {
    if (dinnerCount() >= dinners) break;
    const cost = costOf(r);
    if (total + cost <= budget + 0.01) {
      chosen.push({ r, cost, base: r.base, meal: "diner" });
      used.add(r.id);
      total += cost;
    }
  }
  for (const r of shuffle(pool.filter((r) => canLunch(r) && !used.has(r.id)))) {
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
function selectBatch(pool, dinners, lunches, budget, costOf) {
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
  pairUnits = shuffle(pairUnits);

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

  for (const r of shuffle(pool.filter((r) => !used.has(r.id)))) {
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

function generateWeek({ budget, people, dinners, lunches, diet, styles, quickOnly, glutenFree, seasonal, month, store, batchCooking }) {
  const factor = people / 2;
  const storeMult = STORES.find((s) => s.id === store)?.mult ?? 1;
  const pool = buildPool({ diet, styles, quickOnly, glutenFree, seasonal, month });
  const costOf = (r) => recipeCost(r, factor, storeMult);

  const { chosen, total } = batchCooking
    ? selectBatch(pool, dinners, lunches, budget, costOf)
    : selectSingles(pool, dinners, lunches, budget, costOf);

  const baseCounts = {};
  chosen.forEach((c) => { baseCounts[c.base] = (baseCounts[c.base] || 0) + 1; });
  const pairedBases = Object.keys(baseCounts).filter((b) => baseCounts[b] >= 2);
  const colorMap = {};
  pairedBases.forEach((b, i) => { colorMap[b] = PALETTE[i % PALETTE.length]; });

  const shoppingMap = new Map();
  chosen.forEach(({ r }) => {
    r.ing.forEach((ing) => {
      const key = ing.n + "|" + ing.u;
      const qty = ing.q * factor;
      const price = ing.p * factor * storeMult;
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

  return { chosen, total, shopping, colorMap, pairedBases, batchCooking };
}

function fmtQty(item) {
  if (item.packLabel) return `${item.packagesNeeded} × ${item.packLabel}`;
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

/* ------------------------------------------------------------------ */
/*  APP                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Kalam:wght@400;700&family=Inter:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Favicon généré à partir de la typo du logo (Kalam) : un "K" papier sur fond tampon,
  // dessiné en canvas pour ne dépendre d'aucun fichier statique externe.
  useEffect(() => {
    let cancelled = false;
    const buildFavicon = async () => {
      try {
        if (document.fonts) {
          await document.fonts.load("700 128px 'Kalam'");
        }
      } catch (e) { /* police non bloquante, on retente quand même le dessin */ }
      if (cancelled) return;

      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      const radius = size * 0.22;
      const roundedRect = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // fond "tampon"
      roundedRect(0, 0, size, size, radius);
      ctx.fillStyle = STAMP;
      ctx.fill();

      // liseré papier
      const bw = size * 0.035;
      roundedRect(bw, bw, size - bw * 2, size - bw * 2, radius - bw);
      ctx.strokeStyle = PAPER;
      ctx.lineWidth = bw;
      ctx.stroke();

      // lettre K, dans la typo du logo
      ctx.font = "700 82px 'Kalam', cursive";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillText("K", size / 2 + 1, size / 2 + 4);
      ctx.fillStyle = PAPER;
      ctx.fillText("K", size / 2, size / 2 + 3);

      const dataUrl = canvas.toDataURL("image/png");
      let linkEl = document.querySelector("link[rel~='icon']");
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.rel = "icon";
        document.head.appendChild(linkEl);
      }
      linkEl.type = "image/png";
      linkEl.href = dataUrl;
    };
    buildFavicon();
    return () => { cancelled = true; };
  }, []);

  const currentMonth = new Date().getMonth() + 1;

  const [budget, setBudget] = useState(40);
  const [people, setPeople] = useState(2);
  const [dinners, setDinners] = useState(7);
  const [lunches, setLunches] = useState(0);
  const [store, setStore] = useState("auchan");
  const [diet, setDiet] = useState("tous");
  const [styles, setStyles] = useState([]);
  const [quickOnly, setQuickOnly] = useState(false);
  const [glutenFree, setGlutenFree] = useState(false);
  const [batchCooking, setBatchCooking] = useState(false);
  const [seasonal, setSeasonal] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleStyle = (id) => setStyles((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const totalMeals = dinners + lunches;

  const runGenerate = useCallback(() => {
    if (totalMeals <= 0) return;
    const r = generateWeek({ budget, people, dinners, lunches, diet, styles, quickOnly, glutenFree, seasonal, month, store, batchCooking });
    setResult(r);
    setChecked({});
  }, [budget, people, dinners, lunches, diet, styles, quickOnly, glutenFree, seasonal, month, store, batchCooking, totalMeals]);

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
      <div className="max-w-5xl mx-auto px-5 py-10">
        {/* HEADER */}
        <header className="mb-8">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ fontFamily: "'Kalam', cursive" }}>
              Klar
            </h1>
            <span className="text-sm px-2 py-0.5 rounded" style={{ backgroundColor: YELLOW, fontFamily: "'Space Mono', monospace" }}>
              Tout est prêt, tout est clair.
            </span>
          </div>
          <p className="mt-2 text-sm max-w-xl" style={{ opacity: 0.75 }}>
            Repas &amp; courses sans prise de tête. Choisis ton budget, ton magasin, tes envies — l'appli compose
            ta semaine de repas et la liste de courses qui va avec. Gratuit, sans compte, sans surprise à la fin.
          </p>
        </header>

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
                    ]}
                    values={styles}
                    onToggle={toggleStyle}
                  />
                  <p className="text-xs mt-1.5" style={{ opacity: 0.6 }}>
                    Coche plusieurs cases pour mélanger les styles (ex. Healthy + Gourmand).
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Toggle label="Rapides (≤ 20 min)" checked={quickOnly} onChange={setQuickOnly} />
                  <Toggle label="Sans gluten" checked={glutenFree} onChange={setGlutenFree} />
                  <Toggle label="Batch cooking" checked={batchCooking} onChange={setBatchCooking} icon={<Layers size={13} />} />
                </div>
              </div>
            </section>

            <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
              <label className="flex items-center gap-2 text-sm font-bold mb-3" style={{ fontFamily: "'Space Mono', monospace" }}>
                <Leaf size={16} /> Légumes de saison
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
            </section>

            <button
              onClick={runGenerate}
              disabled={totalMeals === 0}
              className="w-full py-3 rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-40"
              style={{ backgroundColor: STAMP, color: PAPER, fontFamily: "'Space Mono', monospace" }}
            >
              <RefreshCw size={18} />
              {result ? "Régénérer la semaine" : "Générer ma semaine"}
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
                  Les plats liés portent le même repère de couleur.
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
                            return (
                              <li key={item.r.id + "-" + key + "-" + idx}>
                                <div className="flex items-baseline gap-2">
                                  <span className="flex-shrink-0 opacity-50">{String(idx + 1).padStart(2, "0")}</span>
                                  <span className="flex-1">{item.r.name}</span>
                                  <span className="flex-1 border-b border-dotted opacity-40 min-w-[10px]" />
                                  <span className="flex-shrink-0 font-bold">{euro(item.cost)}</span>
                                </div>
                                {color && (
                                  <div className="flex items-center gap-1.5 ml-6 mt-0.5">
                                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                                    <span className="text-[10px] opacity-70">lot partagé : {item.base}</span>
                                  </div>
                                )}
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
                  <div className="flex items-baseline justify-between text-xs opacity-70 mb-4">
                    <span>Budget prévu</span>
                    <span>{euro(budget)}</span>
                  </div>

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
                                    </span>
                                    <span className="text-xs opacity-60 tabular-nums">{fmtQty(i)}</span>
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
                      Différent du total du ticket : ici certains produits (bouillon, épices, sauces...) sont
                      comptés au format vraiment vendu en rayon, pas juste à la quantité utilisée.
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
                <Truck size={16} /> Envie d'aller encore plus vite ?
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
                <Bike size={16} /> Pas le temps de faire les courses ? Faites-vous livrer !
              </div>
              <p className="text-xs mb-3" style={{ opacity: 0.75 }}>
                Deliveroo et Uber Eats livrent vos courses directment chez vous.
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
          basée sur le calendrier français des légumes frais. Projet libre, gratuit et sans compte.
        </footer>
      </div>
    </div>
  );
}
