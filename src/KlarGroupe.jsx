import React, { useMemo, useState } from "react";
import {
  Waves,
  Mountain,
  Sandwich,
  Users,
  UserPlus,
  ShoppingBag,
  ChefHat,
  Sun,
  Moon,
  Check,
  Copy,
} from "lucide-react";

/*
 * KLAR GROUPE
 * Module à intégrer dans le Klar existant.
 *
 * IMPORTANT :
 * - Le catalogue de recettes n'est PAS recréé ici.
 * - Le module utilise `recipes` passé en prop.
 * - Il attend donc le catalogue actuel de Klar, qui contient déjà les recettes
 *   Groupe avec `vacation: ["mer" ...]`, etc.
 * - Cela évite de dupliquer ou de modifier les données recettes existantes.
 *
 * Exemple :
 *   <KlarGroupe recipes={RECIPES} />
 *
 * Les recettes Groupe existantes du fichier fourni sont donc conservées.
 */

const INK = "#22201C";
const PAPER = "#FAF8F2";
const GRID = "#DCE3E8";
const STAMP = "#C1440E";
const GREEN = "#3F6B4F";
const RED = "#A1403D";
const YELLOW = "#F2C14E";

const CATEGORY_ORDER = [
  "Fruits & légumes",
  "Viande & poisson",
  "Crèmerie",
  "Féculents & épicerie",
  "Boulangerie",
  "Surgelés",
];

const VACATION_MODES = [
  { id: "mer", name: "Mer", icon: <Waves size={18} /> },
  { id: "montagne", name: "Montagne", icon: <Mountain size={18} /> },
  { id: "rapide", name: "Repas rapides / pique-nique", icon: <Sandwich size={18} /> },
];

const MEAL_PACE_PRESETS = [
  { id: "libre", name: "Libre", lunch: "libre", dinner: "libre" },
  {
    id: "rapide-midi-travaille-soir",
    name: "Rapide le midi · travaillé le soir",
    lunch: "rapide",
    dinner: "travaille",
  },
  {
    id: "travaille-midi-rapide-soir",
    name: "Travaillé le midi · rapide le soir",
    lunch: "travaille",
    dinner: "rapide",
  },
  { id: "rapide-tous", name: "Rapide midi & soir", lunch: "rapide", dinner: "rapide" },
  { id: "travaille-tous", name: "Plus travaillé midi & soir", lunch: "travaille", dinner: "travaille" },
];

const EQUIPMENT_OPTIONS = [
  { id: "plaque", name: "Plaque de cuisson" },
  { id: "four", name: "Four" },
  { id: "microondes", name: "Micro-ondes" },
  { id: "airfryer", name: "Air fryer" },
  { id: "barbecue", name: "Barbecue" },
];

const COLD_HINTS = [
  "salade", "bowl", "poke", "wrap", "sandwich", "planche",
  "taboulé", "pasta salad", "houmous", "crudités",
];
const OVEN_HINTS = [
  "rôti", "gratin", "quiche", "lasagnes", "pizza",
  "au four", "papillote", "sushi bake", "tartiflette",
];
const BBQ_HINTS = ["brochettes", "merguez grillées", "halloumi grillé", "poulet grillé"];
const AIRFRYER_HINTS = ["croustillant", "croustillante", "pané", "panée", "crispy", "katsu"];
const MICRO_HINTS = ["soupe", "velouté", "curry de pois chiches", "dahl", "chili", "riz vapeur", "riz basmati"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function euro(n) {
  return `${Number(n || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

/* Une recette peut être froide, four, plaque, ou avoir plusieurs solutions. */
function getRecipeEquipment(recipe) {
  const name = String(recipe?.name || "").toLowerCase();

  if (
    COLD_HINTS.some((x) => name.includes(x)) &&
    !/(grillé|grillée|grill|poêlé|poêlée|pané|panée|croustill|poché|pochée|œuf au plat|riz frit)/.test(name)
  ) {
    return { options: [[]], label: "Sans cuisson" };
  }

  if (OVEN_HINTS.some((x) => name.includes(x))) {
    return { options: [["four"]], label: "Four" };
  }

  if (BBQ_HINTS.some((x) => name.includes(x))) {
    return { options: [["plaque"], ["barbecue"]], label: "Plaque ou barbecue" };
  }

  if (AIRFRYER_HINTS.some((x) => name.includes(x))) {
    return { options: [["plaque"], ["airfryer"]], label: "Plaque ou air fryer" };
  }

  if (MICRO_HINTS.some((x) => name.includes(x))) {
    return { options: [["plaque"], ["microondes"]], label: "Plaque ou micro-ondes" };
  }

  return { options: [["plaque"]], label: "Plaque de cuisson" };
}

function recipeHasAvailableEquipment(recipe, equipment) {
  const available = new Set(equipment || []);
  return getRecipeEquipment(recipe).options.some((required) =>
    required.every((id) => available.has(id))
  );
}

/*
 * IMPORTANT :
 * Pour un cumul "Mer + Rapide", une recette doit posséder les deux tags.
 * Le tag rapide peut également venir de `recipe.tags`.
 */
function recipeMatchesVacation(recipe, selectedModes) {
  const modes = Array.isArray(selectedModes) ? selectedModes.filter(Boolean) : [];
  if (!modes.length) return true;

  const vacation = Array.isArray(recipe?.vacation) ? recipe.vacation : [];
  const tags = Array.isArray(recipe?.tags) ? recipe.tags : [];

  return modes.every((mode) => {
    if (mode === "rapide") return vacation.includes("rapide") || tags.includes("rapide");
    return vacation.includes(mode);
  });
}

function isQuick(recipe) {
  return Array.isArray(recipe?.tags) && recipe.tags.includes("rapide")
    ? true
    : Number(recipe?.time || 999) <= 20;
}

function mealMatchesPace(recipe, meal, pace) {
  if (!pace || pace === "libre") return true;

  const preset = MEAL_PACE_PRESETS.find((x) => x.id === pace);
  if (!preset) return true;

  const target = meal === "diner" ? preset.dinner : preset.lunch;
  if (target === "libre") return true;

  if (target === "rapide") return isQuick(recipe);
  return Number(recipe?.time || 0) >= 30 || !!recipe?.dinnerOnly;
}

/*
 * Répartition des courses :
 * UN RAYON = UN RESPONSABLE.
 *
 * Il est impossible de diviser la boulangerie entre deux personnes.
 * Une personne peut prendre autant de rayons qu'elle veut.
 */
function buildShoppingAssignments(shopping, members, mode, leadId, custom) {
  const categories = CATEGORY_ORDER.filter((cat) =>
    (shopping || []).some((item) => item.cat === cat)
  );

  if (!members.length) return {};

  if (mode === "one") {
    const owner =
      members.find((m) => m.id === leadId)?.id ||
      members[0].id;

    return Object.fromEntries(categories.map((cat) => [cat, owner]));
  }

  if (mode === "custom") {
    const result = {};
    categories.forEach((cat) => {
      const selected = custom?.[cat];
      result[cat] = members.some((m) => m.id === selected)
        ? selected
        : members[0].id;
    });
    return result;
  }

  // Intelligent : on attribue les rayons entiers en cherchant à équilibrer
  // la valeur financière, sans jamais couper un rayon.
  const totals = {};
  shopping.forEach((item) => {
    totals[item.cat] = (totals[item.cat] || 0) + Number(item.price || 0);
  });

  const load = Object.fromEntries(members.map((m) => [m.id, 0]));
  const result = {};

  [...categories]
    .sort((a, b) => (totals[b] || 0) - (totals[a] || 0))
    .forEach((cat) => {
      const owner = [...members].sort((a, b) => load[a.id] - load[b.id])[0];
      result[cat] = owner.id;
      load[owner.id] += totals[cat] || 0;
    });

  return result;
}

function aggregateShopping(chosen, people) {
  const factor = Number(people || 1) / 2;
  const map = new Map();

  chosen.forEach(({ recipe }) => {
    (recipe.ing || []).forEach((ing) => {
      const key = `${ing.n}|${ing.u}`;
      const qty = Number(ing.q || 0) * factor;
      const price = Number(ing.p || 0) * factor;

      if (!map.has(key)) {
        map.set(key, {
          name: ing.n,
          unit: ing.u,
          cat: ing.c,
          qty,
          price,
        });
      } else {
        const item = map.get(key);
        item.qty += qty;
        item.price += price;
      }
    });
  });

  return [...map.values()].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.cat) - CATEGORY_ORDER.indexOf(b.cat)
  );
}

function fmtQty(item) {
  const qty =
    item.unit === "g" || item.unit === "ml"
      ? Math.round(item.qty / 10) * 10
      : Math.round(item.qty * 10) / 10;

  return `${qty} ${item.unit}`;
}

function ChoiceButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-md text-sm font-semibold border-2 transition-colors"
      style={{
        borderColor: INK,
        backgroundColor: active ? INK : "transparent",
        color: active ? PAPER : INK,
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {children}
    </button>
  );
}

function MultiButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold border-2"
      style={{
        borderColor: INK,
        backgroundColor: active ? INK : "transparent",
        color: active ? PAPER : INK,
      }}
    >
      <span
        className="w-4 h-4 border-2 rounded-sm flex items-center justify-center"
        style={{ borderColor: active ? PAPER : INK }}
      >
        {active && <Check size={11} />}
      </span>
      {children}
    </button>
  );
}

export default function KlarGroupe({ recipes = [] }) {
  const [tripName, setTripName] = useState("");
  const [vacationModes, setVacationModes] = useState([]);
  const [mealPace, setMealPace] = useState("libre");
  const [equipment, setEquipment] = useState(["plaque", "four", "microondes"]);

  const [people, setPeople] = useState(4);
  const [days, setDays] = useState(5);
  const [dinners, setDinners] = useState(5);
  const [lunches, setLunches] = useState(0);
  const [budget, setBudget] = useState(80);

  const [members, setMembers] = useState([]);
  const [memberInput, setMemberInput] = useState("");

  const [shoppingMode, setShoppingMode] = useState("smart");
  const [shoppingLeadId, setShoppingLeadId] = useState("");
  const [shoppingAssignments, setShoppingAssignments] = useState({});

  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState("");

  const groupRecipes = useMemo(
    () => (recipes || []).filter((r) => Array.isArray(r?.vacation)),
    [recipes]
  );

  const pool = useMemo(
    () =>
      groupRecipes.filter(
        (recipe) =>
          recipeMatchesVacation(recipe, vacationModes) &&
          equipment.length > 0 &&
          recipeHasAvailableEquipment(recipe, equipment)
      ),
    [groupRecipes, vacationModes, equipment]
  );

  const addMember = () => {
    const name = memberInput.trim();
    if (!name) return;

    setMembers((current) => [
      ...current,
      { id: uid(), name },
    ]);
    setMemberInput("");
  };

  const removeMember = (id) => {
    setMembers((current) => current.filter((m) => m.id !== id));
    setShoppingAssignments((current) => {
      const next = { ...current };
      Object.keys(next).forEach((cat) => {
        if (next[cat] === id) delete next[cat];
      });
      return next;
    });
  };

  const toggleMode = (id) => {
    setVacationModes((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
    setGenerated(null);
  };

  const toggleEquipment = (id) => {
    setEquipment((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id]
    );
    setGenerated(null);
  };

  const generate = () => {
    if (!pool.length || dinners + lunches <= 0) {
      setGenerated({ chosen: [], shopping: [], total: 0 });
      return;
    }

    const used = new Set();
    const chosen = [];
    let total = 0;
    const targetMeals = dinners + lunches;

    const ordered = [...pool].sort(
      (a, b) =>
        Number(b.time || 0) - Number(a.time || 0)
    );

    for (let i = 0; i < targetMeals && ordered.length; i += 1) {
      const meal = i < dinners ? "diner" : "dejeuner";

      const candidates = ordered.filter(
        (r) =>
          !used.has(r.id) &&
          !r.dinnerOnly || (!used.has(r.id) && meal === "diner")
      );

      const paced = candidates.filter((r) =>
        mealMatchesPace(r, meal, mealPace)
      );

      const source = paced.length ? paced : candidates;
      if (!source.length) continue;

      const recipe = source[i % source.length];
      used.add(recipe.id);

      const factor = people / 2;
      const cost = (recipe.ing || []).reduce(
        (sum, ing) => sum + Number(ing.p || 0) * factor,
        0
      );

      if (total + cost <= budget || chosen.length === 0) {
        chosen.push({ recipe, meal, cost });
        total += cost;
      }
    }

    const shopping = aggregateShopping(chosen, people);

    const nextAssignments = buildShoppingAssignments(
      shopping,
      members,
      shoppingMode,
      shoppingLeadId,
      shoppingAssignments
    );

    setShoppingAssignments(nextAssignments);
    setGenerated({ chosen, shopping, total });
  };

  const currentAssignments = useMemo(
    () =>
      generated
        ? buildShoppingAssignments(
            generated.shopping,
            members,
            shoppingMode,
            shoppingLeadId,
            shoppingAssignments
          )
        : {},
    [
      generated,
      members,
      shoppingMode,
      shoppingLeadId,
      shoppingAssignments,
    ]
  );

  const copyMemberList = async (member) => {
    if (!generated) return;

    const cats = CATEGORY_ORDER.filter(
      (cat) => currentAssignments[cat] === member.id
    );

    const lines = [
      `KLAR DE GROUPE — ${tripName || "Séjour"}`,
      `Pour : ${member.name}`,
      "",
      "RAYONS À FAIRE :",
      ...cats.map((cat) => `- ${cat}`),
      "",
      "LISTE COMPLÈTE DES ARTICLES DE CES RAYONS :",
    ];

    cats.forEach((cat) => {
      lines.push("");
      lines.push(cat.toUpperCase());
      generated.shopping
        .filter((item) => item.cat === cat)
        .forEach((item) => {
          lines.push(`- ${item.name} : ${fmtQty(item)}`);
        });
    });

    const text = lines.join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(member.id);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      // Clipboard indisponible : aucune donnée n'est perdue dans l'interface.
    }
  };

  return (
    <div className="space-y-6">
      <section
        className="border-2 rounded-lg p-4"
        style={{ borderColor: INK, backgroundColor: "#FFFFFFaa" }}
      >
        <h2
          className="text-xl font-bold mb-3"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          Klar de groupe
        </h2>

        <input
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          placeholder="ex. Vacances à Arcachon"
          className="w-full px-3 py-2 rounded-md border-2 text-sm bg-transparent mb-3"
          style={{ borderColor: INK }}
        />

        <div className="flex flex-wrap gap-2">
          {VACATION_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => toggleMode(mode.id)}
              className="flex-1 min-w-[150px] flex flex-col items-center gap-2 px-3 py-3 rounded-lg border-2"
              style={{
                borderColor: INK,
                backgroundColor: vacationModes.includes(mode.id)
                  ? INK
                  : "transparent",
                color: vacationModes.includes(mode.id) ? PAPER : INK,
              }}
            >
              {mode.icon}
              <span className="text-xs font-semibold text-center">
                {mode.name}
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs mt-3" style={{ opacity: 0.65 }}>
          Les modes sont cumulables : par exemple « Mer + Repas rapides /
          pique-nique » ne garde que les recettes compatibles avec les deux.
        </p>
      </section>

      <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-3">
          <Users size={16} /> Participants
        </label>

        <div className="flex gap-2 mb-3">
          <input
            value={memberInput}
            onChange={(e) => setMemberInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addMember()}
            placeholder="Prénom"
            className="flex-1 px-3 py-2 rounded-md border-2 bg-transparent text-sm"
            style={{ borderColor: INK }}
          />
          <button
            type="button"
            onClick={addMember}
            className="px-3 py-2 border-2 rounded-md font-semibold text-sm"
            style={{ borderColor: INK }}
          >
            <UserPlus size={14} className="inline mr-1" />
            Ajouter
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <span
              key={member.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-sm font-semibold"
              style={{ borderColor: INK }}
            >
              {member.name}
              <button type="button" onClick={() => removeMember(member.id)}>
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="text-sm">
            Personnes
            <input
              type="number"
              min="1"
              max="20"
              value={people}
              onChange={(e) => setPeople(Math.max(1, Number(e.target.value)))}
              className="w-full mt-1 px-3 py-2 border-2 rounded-md bg-transparent"
              style={{ borderColor: INK }}
            />
          </label>

          <label className="text-sm">
            Jours
            <input
              type="number"
              min="1"
              max="21"
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
              className="w-full mt-1 px-3 py-2 border-2 rounded-md bg-transparent"
              style={{ borderColor: INK }}
            />
          </label>
        </div>
      </section>

      <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-3">
          <Sun size={16} /> Organisation des repas
        </label>

        <div className="flex flex-wrap gap-2">
          {MEAL_PACE_PRESETS.map((preset) => (
            <ChoiceButton
              key={preset.id}
              active={mealPace === preset.id}
              onClick={() => {
                setMealPace(preset.id);
                setGenerated(null);
              }}
            >
              {preset.name}
            </ChoiceButton>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <label className="text-sm">
            <Moon size={14} className="inline mr-1" />
            Dîners
            <input
              type="number"
              min="0"
              max="21"
              value={dinners}
              onChange={(e) => setDinners(Math.max(0, Number(e.target.value)))}
              className="w-full mt-1 px-3 py-2 border-2 rounded-md bg-transparent"
              style={{ borderColor: INK }}
            />
          </label>

          <label className="text-sm">
            <Sun size={14} className="inline mr-1" />
            Déjeuners
            <input
              type="number"
              min="0"
              max="21"
              value={lunches}
              onChange={(e) => setLunches(Math.max(0, Number(e.target.value)))}
              className="w-full mt-1 px-3 py-2 border-2 rounded-md bg-transparent"
              style={{ borderColor: INK }}
            />
          </label>
        </div>
      </section>

      <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-3">
          <ChefHat size={16} /> Équipements disponibles
        </label>

        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((option) => (
            <MultiButton
              key={option.id}
              active={equipment.includes(option.id)}
              onClick={() => toggleEquipment(option.id)}
            >
              {option.name}
            </MultiButton>
          ))}
        </div>

        <p className="text-xs mt-3" style={{ opacity: 0.65 }}>
          Les équipements filtrent réellement les recettes proposées. Une
          recette au four ne sort pas si aucun four n'est disponible.
        </p>
      </section>

      <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-3">
          <ShoppingBag size={16} /> Répartition des courses
        </label>

        <div className="flex flex-wrap gap-2">
          <ChoiceButton
            active={shoppingMode === "smart"}
            onClick={() => setShoppingMode("smart")}
          >
            Répartition intelligente
          </ChoiceButton>

          <ChoiceButton
            active={shoppingMode === "one"}
            onClick={() => setShoppingMode("one")}
          >
            Une seule personne
          </ChoiceButton>

          <ChoiceButton
            active={shoppingMode === "custom"}
            onClick={() => setShoppingMode("custom")}
          >
            Personnaliser
          </ChoiceButton>
        </div>

        {shoppingMode === "one" && members.length > 0 && (
          <div className="mt-4">
            <p className="text-xs mb-2" style={{ opacity: 0.65 }}>
              Cette personne reçoit 100 % des rayons.
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <ChoiceButton
                  key={member.id}
                  active={shoppingLeadId === member.id}
                  onClick={() => setShoppingLeadId(member.id)}
                >
                  {member.name}
                </ChoiceButton>
              ))}
            </div>
          </div>
        )}

        {shoppingMode === "custom" && generated && members.length > 0 && (
          <div className="mt-4 space-y-3">
            <p className="text-xs" style={{ opacity: 0.65 }}>
              <strong>Un rayon est indivisible.</strong> Une même personne
              peut prendre plusieurs rayons, mais un rayon ne peut appartenir
              qu'à une seule personne.
            </p>

            {CATEGORY_ORDER.filter((cat) =>
              generated.shopping.some((item) => item.cat === cat)
            ).map((cat) => (
              <div
                key={cat}
                className="border rounded-lg p-3"
                style={{ borderColor: INK }}
              >
                <div className="text-sm font-bold mb-2">{cat}</div>
                <div className="flex flex-wrap gap-2">
                  {members.map((member) => (
                    <ChoiceButton
                      key={member.id}
                      active={currentAssignments[cat] === member.id}
                      onClick={() =>
                        setShoppingAssignments((current) => ({
                          ...current,
                          [cat]: member.id,
                        }))
                      }
                    >
                      {member.name}
                    </ChoiceButton>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs mt-3" style={{ opacity: 0.65 }}>
          Exemple : si Mathieu prend « Boulangerie », toute la boulangerie
          lui est attribuée. Il peut également prendre Fruits & légumes et
          Épicerie.
        </p>
      </section>

      <section className="border-2 rounded-lg p-4" style={{ borderColor: INK }}>
        <label className="flex items-center gap-2 text-sm font-bold mb-2">
          <ShoppingBag size={16} /> Budget du séjour
        </label>
        <input
          type="range"
          min="30"
          max="400"
          step="5"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
          className="w-full"
        />
        <div
          className="text-right text-xl font-bold mt-1"
          style={{ fontFamily: "'Space Mono', monospace", color: STAMP }}
        >
          {euro(budget)}
        </div>
      </section>

      <button
        type="button"
        onClick={generate}
        className="w-full py-3 rounded-lg font-bold border-2"
        style={{
          backgroundColor: STAMP,
          color: PAPER,
          borderColor: STAMP,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        Générer le menu du séjour
      </button>

      {generated && (
        <section className="space-y-4">
          {!generated.chosen.length ? (
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center"
              style={{ borderColor: RED }}
            >
              Aucune recette Groupe ne correspond aux critères actuels.
            </div>
          ) : (
            <>
              <div
                className="border-2 rounded-lg p-4"
                style={{ borderColor: INK }}
              >
                <div className="flex justify-between items-center">
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    Menu du séjour
                  </h3>
                  <span
                    className="font-bold"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {euro(generated.total)} / {euro(budget)}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {generated.chosen.map((item, index) => (
                    <div
                      key={`${item.recipe.id}-${item.meal}-${index}`}
                      className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
                      style={{ borderColor: INK }}
                    >
                      <span className="text-sm font-semibold">
                        {item.meal === "diner" ? "🌙" : "☀️"} {item.recipe.name}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {euro(item.cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="border-2 rounded-lg p-4"
                style={{ borderColor: INK }}
              >
                <h3
                  className="text-lg font-bold mb-3"
                  style={{ fontFamily: "'Kalam', cursive" }}
                >
                  Qui fait les courses ?
                </h3>

                {!members.length ? (
                  <p className="text-sm opacity-65">
                    Ajoute des participants pour répartir les rayons.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => {
                      const cats = CATEGORY_ORDER.filter(
                        (cat) => currentAssignments[cat] === member.id
                      );

                      if (!cats.length) return null;

                      const amount = generated.shopping
                        .filter((item) => currentAssignments[item.cat] === member.id)
                        .reduce((sum, item) => sum + Number(item.price || 0), 0);

                      return (
                        <div
                          key={member.id}
                          className="border rounded-lg p-3"
                          style={{ borderColor: INK }}
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <div className="font-bold">{member.name}</div>
                              <div className="text-xs opacity-65 mt-1">
                                {cats.join(" · ")}
                              </div>
                            </div>
                            <div
                              className="text-xs font-bold"
                              style={{ fontFamily: "'Space Mono', monospace" }}
                            >
                              {euro(amount)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => copyMemberList(member)}
                            className="mt-3 px-3 py-1.5 border-2 rounded-md text-xs font-semibold"
                            style={{ borderColor: INK }}
                          >
                            <Copy size={13} className="inline mr-1" />
                            {copied === member.id
                              ? "Copié !"
                              : `Copier la liste de ${member.name}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5">
                  <h4 className="font-bold text-sm mb-2">
                    Vérification des rayons
                  </h4>

                  <div className="space-y-2">
                    {CATEGORY_ORDER.filter((cat) =>
                      generated.shopping.some((item) => item.cat === cat)
                    ).map((cat) => (
                      <div
                        key={cat}
                        className="flex items-center justify-between border rounded-lg px-3 py-2"
                        style={{ borderColor: INK }}
                      >
                        <span className="text-sm font-semibold">{cat}</span>
                        <span className="text-xs">
                          {members.find((m) => m.id === currentAssignments[cat])?.name ||
                            "Non attribué"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
