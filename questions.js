// ---------------------------------------------------------------------------
//  ZDROJ PRAVDY o stanovištích a otázkách (běží POUZE na serveru).
//  Správné odpovědi (pole `a`) se do prohlížeče účastníka NIKDY neposílají —
//  server je používá jen k vyhodnocení. Díky tomu nejde podvádět čtením kódu.
//
//  ÚPRAVY: Otázky s [HRANATÝMI ZÁVORKAMI] doplňte reálnými místními údaji.
//  `a` = index správné odpovědi (0 = první možnost, 1 = druhá, ...).
//  Za každou správnou odpověď se přičítá POINTS_PER_CORRECT bodů (viz níže).
// ---------------------------------------------------------------------------

export const POINTS_PER_CORRECT = 50;

export const THEME_LABEL = {
  historie: "Historie",
  chemie: "Chemie",
  ekologie: "Ekologie",
  finance: "Finance",
  volno: "Kam mimo školu",
};

export const STATIONS = [
  {
    id: "s1", num: 1, name: "Start – Hlavní budova", theme: "historie",
    loc: "Vstupní hala, u informačního pultu",
    task: "Zorientuj se v mapě trasy a všimni si roku založení školy na pamětní desce u vchodu.",
    edit: true,
    q: [
      { t: "[Ve kterém roce byla škola založena?]", opts: ["[1921]", "[1948]", "[1969]", "[1993]"], a: 1,
        expl: "Doplňte správný rok podle pamětní desky. Otázku upravte v questions.js (stanoviště s1)." },
      { t: "Co je „kampus“?", opts: ["Studentská menza", "Areál školy s budovami a zázemím", "Předmět prvního ročníku", "Typ stipendia"], a: 1,
        expl: "Kampus je ucelený areál vysoké školy — budovy, koleje, sportoviště i zeleň." },
    ],
  },
  {
    id: "s2", num: 2, name: "Městská knihovna", theme: "historie",
    loc: "Nám. u knihovny · partner trasy",
    task: "Zajdi dovnitř a najdi studovnu. Zeptej se, jak se student stane čtenářem.",
    edit: false,
    q: [
      { t: "K čemu slouží ISBN u knihy?", opts: ["Určuje cenu", "Jednoznačně identifikuje vydání knihy", "Značí počet stran", "Je to jméno autora"], a: 1,
        expl: "ISBN je mezinárodní číslo, které jednoznačně identifikuje konkrétní vydání publikace." },
      { t: "Co je to studovna?", opts: ["Místo k tichému studiu s přístupem k materiálům", "Kavárna v knihovně", "Sklad starých knih", "Učebna jen pro profesory"], a: 0,
        expl: "Studovna je tiché místo, kde si můžeš půjčit prezenčně literaturu a v klidu se učit." },
    ],
  },
  {
    id: "s3", num: 3, name: "Kavárna Na Zastávce", theme: "volno",
    loc: "Roh ulice u zastávky · partner akce",
    task: "Dej si pauzu. Zjisti, co kavárna nabízí studentům (sleva, klidný kout na učení?).",
    edit: false,
    q: [
      { t: "Odkud pochází káva odrůdy Arabica?", opts: ["Z brambor", "Z kávovníku", "Z čajovníku", "Ze pšenice"], a: 1,
        expl: "Káva se získává z pražených semen (zrn) plodů kávovníku." },
      { t: "Proč je fajn mít místo na učení mimo kolej či domov?", opts: ["Není to k ničemu", "Změna prostředí pomáhá soustředění", "Je to povinné", "Kvůli wifi hesla"], a: 1,
        expl: "Změna prostředí a oddělení „místa na učení“ od „místa na odpočinek“ pomáhá koncentraci." },
    ],
  },
  {
    id: "s4", num: 4, name: "Menza / jídelna", theme: "finance",
    loc: "Přízemí budovy C · studentské stravování",
    task: "Prohlédni si nabídku a ceny. Spočítej, kolik by tě stál oběd každý všední den v měsíci.",
    edit: false,
    q: [
      { t: "Oběd v menze stojí 60 Kč. Kolik zaplatíš za 20 obědů?", opts: ["600 Kč", "1 200 Kč", "1 800 Kč", "2 400 Kč"], a: 1,
        expl: "60 × 20 = 1 200 Kč. Dotované studentské stravování šetří i tisíce korun měsíčně." },
      { t: "Co je na jídelníčku „dotovaná cena“?", opts: ["Cena zvýšená o daň", "Cena snížená příspěvkem (např. školy/státu)", "Cena jen pro učitele", "Cena za nápoj navíc"], a: 1,
        expl: "Dotace snižuje cenu — část hradí škola nebo stát, ty platíš méně." },
    ],
  },
  {
    id: "s5", num: 5, name: "Chemický koutek", theme: "chemie",
    loc: "Venkovní stan u budovy laboratoří",
    task: "U stanoviště uvidíš ukázku jednoduchého pokusu. Sleduj, co se děje, a odpověz na kvíz.",
    edit: false,
    q: [
      { t: "Jaká je chemická značka vody?", opts: ["CO₂", "O₂", "H₂O", "NaCl"], a: 2,
        expl: "Voda je H₂O — dva atomy vodíku a jeden atom kyslíku." },
      { t: "Jaké pH má neutrální roztok (např. čistá voda)?", opts: ["0", "7", "14", "1"], a: 1,
        expl: "Neutrální pH = 7. Pod 7 je kyselé, nad 7 zásadité prostředí." },
    ],
  },
  {
    id: "s6", num: 6, name: "EkoBod – zeleň kampusu", theme: "ekologie",
    loc: "Park mezi budovami A a B",
    task: "Najdi nejbližší tři barevné kontejnery na tříděný odpad a zkontroluj, co kam patří.",
    edit: false,
    q: [
      { t: "Do jakého kontejneru patří sklo?", opts: ["Žlutý", "Modrý", "Zelený", "Hnědý"], a: 2,
        expl: "Sklo se hází do zeleného (barevné) nebo bílého (čiré) kontejneru." },
      { t: "Co znamená zkratka PET u lahví?", opts: ["Domácí zvíře", "Polyethylentereftalát", "Papír a textil", "Přírodní ekologický typ"], a: 1,
        expl: "PET = polyethylentereftalát, plast na nápojové lahve. Patří do žlutého kontejneru." },
    ],
  },
  {
    id: "s7", num: 7, name: "Finanční koutek", theme: "finance",
    loc: "Foyer budovy B · stánek",
    task: "Vyzvedni si leták o studentském rozpočtu a stipendiích. Zamysli se nad svými měsíčními výdaji.",
    edit: false,
    q: [
      { t: "Co znamená zkratka RPSN u půjčky?", opts: ["Roční počet splátek navíc", "Roční procentní sazba nákladů", "Rychlá platba splátek nájmu", "Registr půjček"], a: 1,
        expl: "RPSN vyjadřuje celkové roční náklady půjčky v procentech — pomáhá porovnat nabídky." },
      { t: "Co je to inflace?", opts: ["Růst cen a pokles kupní síly peněz", "Sleva ve všech obchodech", "Zvýšení stipendia", "Druh spoření"], a: 0,
        expl: "Inflace = obecný růst cenové hladiny. Za stejné peníze si postupně koupíš méně." },
    ],
  },
  {
    id: "s8", num: 8, name: "Historický milník", theme: "historie",
    loc: "[Pamětní místo / socha v okolí školy]",
    task: "Přejdi k historickému místu poblíž a přečti si informační ceduli.",
    edit: true,
    q: [
      { t: "[Ke které významné osobnosti / události se místo váže?]", opts: ["[Možnost A]", "[Možnost B — správně]", "[Možnost C]", "[Možnost D]"], a: 1,
        expl: "Doplňte podle konkrétního místa ve vašem městě. Upravte v questions.js (stanoviště s8)." },
      { t: "Proč je dobré znát historii místa, kde budeš studovat?", opts: ["Není to důležité", "Buduje vztah k okolí a je to zajímavé", "Je to u zkoušky", "Kvůli slevě do menzy"], a: 1,
        expl: "Znalost okolí ti pomůže cítit se na novém místě rychleji doma." },
    ],
  },
  {
    id: "s9", num: 9, name: "Volnočasová zóna", theme: "volno",
    loc: "Sportoviště / klubovna spolku",
    task: "Zjisti, jaké kroužky, spolky nebo sporty tady studenti provozují. Kam bys zapadl/a ty?",
    edit: false,
    q: [
      { t: "Co je studentský spolek?", opts: ["Povinný předmět", "Dobrovolná studentská organizace pro aktivity", "Zkouškové období", "Typ koleje"], a: 1,
        expl: "Spolky pořádají akce, sport, kulturu i dobrovolnictví — skvělý způsob, jak poznat lidi." },
      { t: "Proč se zapojit do aktivit mimo výuku?", opts: ["Nová přátelství a zkušenosti", "Zabírá to jen čas", "Je to zakázané", "Sníží se ti známky"], a: 0,
        expl: "Mimoškolní aktivity rozvíjí dovednosti, kontakty i životopis." },
    ],
  },
  {
    id: "s10", num: 10, name: "Cíl – výzva Alza", theme: "chemie",
    loc: "Vstupní hala · finální stanoviště",
    task: "Poslední zastávka! Odpověz na techničtější otázky partnera a odevzdej trasu.",
    edit: false,
    q: [
      { t: "Co je to RAM v počítači?", opts: ["Trvalé úložiště", "Operační (dočasná) paměť", "Procesor", "Grafická karta"], a: 1,
        expl: "RAM je rychlá operační paměť pro běžící programy; po vypnutí se maže." },
      { t: "Co znamená zkratka SSD?", opts: ["Super Speed Disk", "Solid State Drive", "System Software Data", "Secure Storage Device"], a: 1,
        expl: "SSD (Solid State Drive) je rychlé úložiště bez pohyblivých částí, nástupce klasického HDD." },
    ],
  },
];

// Maximální možné skóre (pro procenta a hranice cen).
export const MAX_POINTS = STATIONS.reduce((s, st) => s + st.q.length, 0) * POINTS_PER_CORRECT;

// Verze bez správných odpovědí – tohle dostane prohlížeč účastníka.
export function publicStations() {
  return STATIONS.map((st) => ({
    id: st.id, num: st.num, name: st.name, theme: st.theme,
    loc: st.loc, task: st.task, edit: st.edit,
    q: st.q.map((q) => ({ t: q.t, opts: q.opts })), // POZOR: bez `a` a bez `expl`
  }));
}

// Pomocník pro vyhodnocení jedné odpovědi na serveru.
export function grade(stationId, qIndex, chosen) {
  const st = STATIONS.find((s) => s.id === stationId);
  if (!st) return null;
  const q = st.q[qIndex];
  if (!q) return null;
  const correct = chosen === q.a;
  return {
    correct,
    correctIndex: q.a,
    points: correct ? POINTS_PER_CORRECT : 0,
    expl: q.expl,
    stationQuestionCount: st.q.length,
  };
}
