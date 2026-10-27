// ---------------------------------------------------------------------------
//  ZDROJ PRAVDY o obsahu hry (běží POUZE na serveru).
//
//  Hráč prožije studium na VŠCHT v 10 stanovištích. Každá odpověď mění tři
//  metriky a peníze:
//    f  Finance     v  Vzdělání     p  Požitky     kc  změna úspor v Kč
//
//  Tady se mění texty, body a částky. Pravidla (výpočet, trasa, skóre) jsou
//  v game.js.
//
//  Každá možnost odpovědi má:
//    t      text odpovědi (co hráč vybírá)
//    fx     změna metrik, např. { f: -2, v: 1, p: 2 } (chybějící = 0)
//    kc     změna úspor v Kč (záporné = výdaj)
//    r      (nepovinné) co se stalo – ukáže se hráči po odpovědi
//    needs  (nepovinné) podmínka, např. { kc: 10000 } nebo { v: 3 }. Když ji
//           hráč nesplní, uvidí možnost zamčenou i s vysvětlením proč.
//    ok     (nepovinné) u výpočtů: true = správná odpověď
//    switchTo (nepovinné) po odpovědi přepne hráče do jiné skupiny/trasy
//
//  Pole fx, kc a ok se do prohlížeče NEPOSÍLAJÍ (viz publicStation v game.js),
//  takže hráč z kódu stránky nevyčte, co se vyplatí.
//
//  Stanoviště může mít `variants: { erasmus: {...}, doma: {...} }` – jiný
//  příběh a otázku podle skupiny, do které hráč padl (viz chooseGroup níže).
//
//  ⚠ Texty označené [NÁVRH] jsou jen zástupné, aby šla hra vyzkoušet celá.
//    Nahradí je texty od Julie a Jany.
// ---------------------------------------------------------------------------

export const START_KC = 20000;

export const STATIONS = [
  { id: "s1", place: "Obytné budovy", title: "Nástup na vysokou",
    story: "Přijali tě na VŠCHT! Od rodičů a z letní brigády máš naspořeno 20 000 Kč. První důležité rozhodnutí je tady: kde budeš bydlet?",
    q: "Kde budeš bydlet?",
    opts: [
      { t: "Sdílené bydlení s kamarády – 8 000 Kč měsíčně za nájem a bude třeba složit kauci. Budeš mít vlastní pokoj a klid na učení.",
        fx: { f: -2, v: 1, p: 2 }, kc: -12000,
        r: "Máš soukromí, vlastní pokoj a prostor na učení, ale na kauci padne značná část úspor a budeš muset během semestru pracovat, abys zvládal/a platit nájem." },
      { t: "Kolej – 5 000 Kč měsíčně za dvoulůžkový pokoj, sdílená kuchyňka a hluk, ale spousta nových známostí, díky kterým bude studium snazší.",
        fx: { f: 1, p: 1 }, kc: -5000,
        r: "Rychle si najdeš kamarády, můžete se učit spolu a sdílet materiály. Na pokoji je občas hluk, ale ušetříš peníze i stres." },
      { t: "Bydlení u rodičů – 2 hodiny dojíždění denně, 800 Kč měsíčně za vlak, ale nezbývá ti čas na školní akce a kamarády.",
        fx: { f: 3, v: -1, p: -2 }, kc: -800,
        r: "Ušetříš větší částku za nájem, ale strávíš každý týden 10 hodin na cestě, pokud všechny spoje pojedou včas. V plném vlaku někdy budeš muset stát v uličce. Nezbyde moc energie a času na akce po škole. Kolik tě ten čas vlastně stojí?" },
    ] },

  { id: "s2", place: "Bistro", title: "Stravování",
    story: "[NÁVRH] Je poledne a máš hlad. Menza je levná, ale fronta je až ke dveřím. Kamarádi jdou do bistra naproti.",
    q: "Jak to budeš s jídlem řešit přes semestr?",
    opts: [
      { t: "[NÁVRH] Menza – levně a rychle, sedím u stolu se spolužáky", fx: { f: 1, v: 1 }, kc: -3000 },
      { t: "[NÁVRH] Bistro a rozvoz jídla – chutná to a nemusím nic řešit", fx: { f: -2, p: 3 }, kc: -9000 },
      { t: "[NÁVRH] Vařím si dopředu na celý týden", fx: { f: 2, v: -1 }, kc: -1500 },
    ] },

  { id: "s3", place: "Městská knihovna", title: "Zkouškové je tady!",
    story: "[NÁVRH] Blíží se zkouškové a čekají tě tři těžké zkoušky. Kamarádi zároveň plánují výlet na hory.",
    q: "Jak strávíš zkouškové?",
    opts: [
      { t: "[NÁVRH] Zavřu se v knihovně a na pár týdnů přeruším brigádu", fx: { v: 3, f: -1, p: -2 }, kc: -2000 },
      { t: "[NÁVRH] Zaplatím si doučování u staršího studenta", fx: { v: 2, f: -1 }, kc: -3000 },
      { t: "[NÁVRH] Jedu na hory, učit se budu na poslední chvíli", fx: { p: 3, v: -2 }, kc: -2500 },
    ] },

  { id: "s4", place: "Prodejna elektroniky", title: "Rozbitý notebook",
    story: "[NÁVRH] Uprostřed semestru ti spadl notebook a nejde zapnout. Bez něj se neobejdeš.",
    q: "Co uděláš?",
    opts: [
      { t: "[NÁVRH] Koupím nový výkonný notebook za hotové (25 000 Kč)", fx: { v: 1, p: 2, f: -2 }, kc: -25000,
        needs: { kc: 25000 } },
      { t: "[NÁVRH] Nechám ho opravit v servisu", fx: { v: 1, f: 1 }, kc: -4000 },
      { t: "[NÁVRH] Koupím nový na splátky – na úrocích přeplatím 5 000 Kč", fx: { p: 2, v: 1, f: -3 }, kc: -5000 },
    ] },

  { id: "s5", place: "Vnitroblok", title: "Odborná praxe",
    story: "[NÁVRH] Blíží se léto a máš na výběr, co s ním. Na katedře shánějí studenty na praxi v laboratoři.",
    q: "Co budeš dělat přes léto?",
    opts: [
      { t: "[NÁVRH] Neplacená praxe v laboratoři v mém oboru", fx: { v: 3, f: -1, p: -1 }, kc: 0 },
      { t: "[NÁVRH] Placená brigáda ve skladu, s oborem nesouvisí", fx: { f: 3, v: -1 }, kc: 15000 },
      { t: "[NÁVRH] Volno a cestování s kamarády", fx: { p: 3, f: -1 }, kc: -6000 },
    ] },

  // O tom, kdo jede na Erasmus, rozhodují body ze stanovišť 1–5 (chooseGroup).
  { id: "s6", place: "Přístav", title: "Erasmus",
    variants: {
      erasmus: {
        story: "Výběrová komise tě vybrala na semestr do zahraničí s grantem programu Erasmus+!",
        q: "Kam pojedeš?",
        opts: [
          { t: "Vyberu dražší zemi – 70 % nákladů mi pokryje grant, zbytek doplatím z úspor",
            fx: { f: -2, v: 2, p: 3 }, kc: -10000, needs: { kc: 10000 },
            r: "Semestr na zahraniční univerzitě ti přinese nové kontakty, zkušenosti a zdokonalíš se v jazyce. V životopise bude taková zkušenost vynikat. Ubyde ale z úspor a po návratu budeš muset šetřit." },
          { t: "Vyberu levnější zemi, kde nebudu muset doplácet nic z úspor. Na partnerské škole ale nejspíš nebude moc předmětů z mého oboru.",
            fx: { v: 1, p: 2 }, kc: 0,
            r: "Máš v životopise zahraniční zkušenost a nebudeš se muset uskromňovat po návratu. Všechny předměty ti ale na škole neuznají a budeš muset po návratu dohnat několik zkoušek." },
          // Kdo odmítne, přejde na trasu „doma“ (Kanceláře → Banka) – rozhodnuto 26. 10.
          { t: "Nepojedu, semestr strávím doma, všechny předměty dokončím včas a budu stíhat práci na částečný úvazek",
            fx: { f: 3, p: -2 }, kc: 12000, switchTo: "doma",
            r: "Nebudeš muset řešit prodlužování studia a dosáhneš na slušné úspory. Spolužáci budou ale mít lepší angličtinu, zážitky a kontakty na celý život. Možná už se podobná příležitost neobjeví." },
        ] },
      doma: {
        story: "[NÁVRH – píšou Julie a Jana] Na Erasmus tě tentokrát nevybrali. Spolužáci odjíždějí a ty máš před sebou semestr v Praze.",
        q: "Co se semestrem uděláš?",
        opts: [
          { t: "[NÁVRH] Vezmu práci na částečný úvazek", fx: { f: 3, p: -1 }, kc: 20000 },
          { t: "[NÁVRH] Přihlásím se na intenzivní jazykový kurz", fx: { v: 2, f: -1 }, kc: -6000 },
          { t: "[NÁVRH] Užiju si Prahu – koncerty, výlety, kamarádi", fx: { p: 3, f: -1 }, kc: -5000 },
        ] },
    } },

  // Banka a Kanceláře: skupina „erasmus“ jde nejdřív do Banky, „doma“ nejdřív do Kanceláří.
  { id: "s7", place: "Banka", title: "Spořicí účet",
    variants: {
      erasmus: {
        story: "[NÁVRH] Po návratu z Erasmu chceš zbylé peníze z grantu uložit. Banka nabízí spořicí účet s úrokem 4 % ročně.",
        q: "Uložíš 10 000 Kč na rok. Kolik budeš mít na konci roku?",
        opts: [
          { t: "10 040 Kč", fx: {}, kc: 0 },
          { t: "10 400 Kč", fx: { f: 2 }, kc: 400, ok: true },
          { t: "14 000 Kč", fx: {}, kc: 0 },
        ] },
      doma: {
        story: "[NÁVRH] Díky práci při studiu ti každý měsíc něco zbývá. Banka nabízí spořicí účet s úrokem 4 % ročně.",
        q: "Uložíš 20 000 Kč na rok. Kolik budeš mít na konci roku?",
        opts: [
          { t: "20 080 Kč", fx: {}, kc: 0 },
          { t: "24 000 Kč", fx: {}, kc: 0 },
          { t: "20 800 Kč", fx: { f: 2 }, kc: 800, ok: true },
        ] },
    } },

  { id: "s8", place: "Kancelářské budovy", title: "Státnice a první nabídka",
    variants: {
      erasmus: {
        story: "[NÁVRH] Máš po státnicích! Díky zkušenosti ze zahraničí máš na stole víc nabídek, než jsi čekal/a.",
        q: "Kterou nabídku vezmeš?",
        opts: [
          { t: "[NÁVRH] Mezinárodní firma, vysoký plat, hodně přesčasů", fx: { f: 3, p: -1 }, kc: 10000,
            needs: { v: 4 } },
          { t: "[NÁVRH] Doktorát na VŠCHT", fx: { v: 3, f: -1 }, kc: 0 },
          { t: "[NÁVRH] Půl roku cestuju, práci řeším potom", fx: { p: 3, f: -2 }, kc: -8000 },
        ] },
      doma: {
        story: "[NÁVRH] Máš po státnicích! Firma, kde jsi pracoval/a při studiu, ti nabízí stálé místo.",
        q: "Co uděláš?",
        opts: [
          { t: "[NÁVRH] Zůstanu ve firmě, kterou znám", fx: { f: 2, v: 1 }, kc: 8000 },
          { t: "[NÁVRH] Doktorát na VŠCHT", fx: { v: 3, f: -1 }, kc: 0 },
          { t: "[NÁVRH] Půl roku cestuju, práci řeším potom", fx: { p: 3, f: -2 }, kc: -8000 },
        ] },
    } },

  { id: "s9", place: "Park", title: "Rozpočet na semestr",
    story: "[NÁVRH] Sedíš v parku a přemýšlíš, jak rozdělit první výplatu.",
    q: "Jak ji rozdělíš?",
    opts: [
      { t: "[NÁVRH] Podle pravidla 50/30/20 – nutné výdaje, zábava, spoření", fx: { f: 1, v: 1, p: 1 }, kc: 5000 },
      { t: "[NÁVRH] Užiju si ji – zasloužím si to", fx: { p: 3, f: -2 }, kc: -5000 },
      { t: "[NÁVRH] Všechno, co zbude, odložím na spořicí účet", fx: { f: 3, p: -2 }, kc: 10000 },
    ] },

  // final: true = poslední stanoviště, žádná otázka, jen vyhodnocení.
  { id: "s10", place: "DOX", title: "Promoce a první výplata", final: true },
];

// ---- Trasa -------------------------------------------------------------------
// Body ze stanovišť 1–5 rozhodnou, kdo jede na Erasmus. VARIANTA 1 (vybraná
// 26. 10.): Vzdělání > Finance (při rovnosti jede) a zároveň aspoň MIN_V bodů
// vzdělání. Pro variantu 4 („nejsilnější metrika“) stačí přepsat jen tuhle funkci.
export const GROUP_AFTER = "s5";
const MIN_V = 2;
export function chooseGroup(m) {
  return m.v >= m.f && m.v >= MIN_V ? "erasmus" : "doma";
}

// Pořadí stanovišť pro každou skupinu (id stanovišť).
export const ROUTES = {
  erasmus: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"],
  doma:    ["s1", "s2", "s3", "s4", "s5", "s6", "s8", "s7", "s9", "s10"],
};

// Proč hráč padl do skupiny – ukáže se na stanovišti 6.
export const GROUP_INFO = {
  erasmus: { name: "Jedeš na Erasmus",
             why: "Výběrová komise hodnotí hlavně studijní výsledky. Do studia jsi zatím investoval/a víc než do peněz, a to se vyplatilo." },
  doma:    { name: "Zůstáváš doma",
             why: "Na výběrko to tentokrát nestačilo, komise hledí hlavně na studijní výsledky. Semestr strávíš v Praze." },
};

// ---- Vyhodnocení -------------------------------------------------------------
// Tři metriky = tři profily hráče. Nejsilnější metrika určí profil.
export const METRICS = {
  f: { name: "Finance",  profile: "Střadatel",    color: "#4a8af0",
       text: "Umíš hospodařit a máš rezervu. Peníze pro tebe znamenají jistotu. Nezapomeň ale, že investice do sebe a do zážitků se taky vrací." },
  v: { name: "Vzdělání", profile: "Studijní typ", color: "#e64010",
       text: "Investuješ do sebe a do kontaktů. To se ti dlouhodobě vrátí v lepší práci. Hlídej si ale, aby ti mezitím nedošly peníze." },
  p: { name: "Požitky",  profile: "Požitkář",     color: "#f2a33a",
       text: "Umíš si užít studentský život a máš spoustu zážitků. Pozor jen, ať ti po studiu něco zbude." },
};

// Životní skóre 0–100: 80 % průměr (finance, vzdělání, požitky, Kč)
// + 20 % nejslabší oblast = bonus za vyvážený život.
export const SCORE = { avgWeight: 0.8, balanceWeight: 0.2 };

// Slovní hodnocení podle skóre (od nejlepšího).
export const BANDS = [
  { min: 70, t: "Výborně vyvážený start", d: "Zvládl/a jsi studium, peníze i život kolem. Do pracovního života vstupuješ s náskokem." },
  { min: 45, t: "Solidní start",          d: "Někde jsi vyhrál/a, jinde ztratil/a. Na tom se dá stavět." },
  { min: 0,  t: "Start s dluhem",         d: "Něco jsi hodně zanedbal/a. Dobrá zpráva: ve skutečném životě máš čas to dohnat." },
];
