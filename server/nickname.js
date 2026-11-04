// =============================================================================
//  Kontrola přezdívky – přezdívky se ukazují všem na obrazovce v cíli (/cil),
//  takže musí být krátké, čitelné, bez sprostých slov a bez osobních údajů.
//  Seznam slov je záměrně jednoduchý; co proklouzne, skryje organizátor v /admin.
// =============================================================================

export const MIN_LEN = 3;
export const MAX_LEN = 16;

// Písmena (i s diakritikou), číslice, mezera, tečka, podtržítko, pomlčka.
const ALLOWED = /^[\p{L}\p{N} ._-]+$/u;

// Kořeny sprostých a urážlivých slov (bez diakritiky, malými písmeny, zdvojená písmena jednou –
// stejně jako po normalize()). Hledají se KDEKOLI, i po slepení slov („k u r v a“, „k.u.r.v.a“).
const ANYWHERE = [
  // čeština
  "kurv", "kurev", "prdel", "kokot", "curak", "zmrd", "mrdk", "mrdat", "mrdal", "hovn", "sracka", "sracky",
  "picus", "jebat", "jeban", "jebl", "ojeb", "vyjeb", "zajeb", "dojeb", "pojeb", "debil", "kreten", "idiot",
  "hajzl", "chcip", "kunda", "buzn", "buzerant", "negr", "nigr", "niga", "niger", "cigan", "cikan",
  "hulibrk", "sukat", "sukal", "pizd", "blbec", "blbka", "posra", "vysra", "zasra",
  // angličtina a další
  "fuck", "shit", "bitch", "cunt", "dick", "pusy", "whore", "slut", "porn", "penis", "vagin",
  "nazi", "hitler", "heil", "ashole",
];
// Krátké kořeny, které by „kdekoli“ chytaly i nevinná slova – jen na začátku slova.
const WORD_START = ["pica", "pice", "picu", "pici", "sex", "sux", "jeb", "mrd", "kund", "fag", "anus", "rape", "cock"];
// Nevinná slova, která začínají sprostým kořenem (smažou se před kontrolou).
const ALLOW = ["picas", "sexta"];

// Malá písmena, bez diakritiky, leetspeak → písmena („k0kot“ → „kokot“), zdvojená písmena jednou.
function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/\p{M}/gu, "")
    .replace(/[0@4]/g, (c) => ({ 0: "o", "@": "a", 4: "a" }[c]))
    .replace(/[1!]/g, "i").replace(/3/g, "e").replace(/[5$]/g, "s").replace(/7/g, "t")
    .replace(/(\p{L})\1+/gu, "$1");
}

function isVulgar(nick) {
  let norm = normalize(nick);
  for (const ok of ALLOW) norm = norm.replaceAll(ok, " ");
  const glued = norm.replace(/[^a-z]/g, "");
  if (ANYWHERE.some((w) => glued.includes(w))) return true;
  const words = norm.split(/[^a-z]+/).filter(Boolean);
  return words.some((w) => WORD_START.some((r) => w.startsWith(r)));
}

// Klíč pro porovnání duplicit: „Chemik 007“ = „chemik007“ = „Chémik_007“.
export function nicknameKey(nick) {
  return nick.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/g, "");
}

// Vrací { nickname } (upravená přezdívka) nebo { error } (text pro hráče).
export function checkNickname(raw) {
  const nick = String(raw ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (!nick) return { error: "Napiš si přezdívku – uvidíš se pod ní v žebříčku." };
  if ([...nick].length < MIN_LEN) return { error: `Přezdívka musí mít aspoň ${MIN_LEN} znaky.` };
  if ([...nick].length > MAX_LEN) return { error: `Přezdívka může mít nejvýš ${MAX_LEN} znaků.` };
  if (!ALLOWED.test(nick)) return { error: "Použij jen písmena, číslice, mezeru, tečku, pomlčku nebo podtržítko (bez emoji)." };
  if ((nick.match(/\p{L}/gu) || []).length < 2) return { error: "Přezdívka musí obsahovat aspoň 2 písmena." };
  if (/\d{5,}/.test(nick)) return { error: "Bez dlouhých čísel, ať tam omylem není telefon." };
  if (/^dod[\s._-]?\w{4}$/i.test(nick)) return { error: "Tohle vypadá jako hrací kód – vymysli si jinou přezdívku." };
  if (isVulgar(nick)) return { error: "Tahle přezdívka neprojde – ukáže se všem na obrazovce. Zkus jinou." };
  return { nickname: nick };
}
