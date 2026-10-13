// ---------------------------------------------------------------------------
//  ZDROJ PRAVDY o obsahu hry „Od kapesného k důchodu" (běží POUZE na serveru).
//
//  Tady se mění texty, částky a odpovědi. Pravidla (jak se peníze počítají)
//  jsou v game.js.
//
//  Každá možnost odpovědi má:
//    t     text odpovědi
//    d     (nepovinné) menší popisek pod odpovědí
//    g     typ hráče, kterému dá bod: "p" Požitkář, "s" Střadatel, "r" Podnikavec
//    to    kam jdou peníze: { spent, piggy, bank, invest } jako podíl (1 = vše)
//    risk  (podnikání) { p: šance na úspěch 0–1, win: kolik Kč získá při úspěchu }
//    debt  (nepovinné) kolik Kč navíc to stojí (např. úroky ze splátek)
//    needs (nepovinné) "invest" = možnost je zamčená, dokud hráč neprojde kurzem
//    ok    jen u kvízu: true = správná odpověď
//
//  Pole g, to, risk, debt a ok se do prohlížeče NEPOSÍLAJÍ (viz publicStations
//  v game.js), takže hráč z kódu stránky nevyčte, co se vyplatí.
// ---------------------------------------------------------------------------

export const STATIONS = [
  { id: "s1", age: 8, title: "První kapesné", income: 50,
    story: "Je ti 8 let. Babička ti k narozeninám dala první kapesné, padesátikorunu. Cestou domů jdete kolem cukrárny.",
    q: "Co uděláš s padesátikorunou?",
    opts: [
      { g: "s", t: "Hodím ji do prasátka", d: "Doma v poličce", to: { piggy: 1 } },
      { g: "p", t: "Koupím si zmrzlinu", d: "Hned a s radostí", to: { spent: 1 } },
      { g: "r", t: "Koupím semínka, vypěstuju bylinky a prodám je sousedům", d: "Může vynést víc, ale taky nemusí vyrůst nic", risk: { p: 0.75, win: 150 } },
    ],
    tip: ["Prasátko vs. účet", "Peníze v prasátku se neztratí, ale kvůli inflaci si za ně za pár let koupíš méně."] },

  { id: "s2", age: 12, title: "Příležitost: nošení dřeva", income: 100,
    story: "Soused potřebuje přenosit dřevo do kůlny. Po dvou hodinách práce ti dá stovku.",
    q: "Co s vydělanou stovkou?",
    opts: [
      { g: "p", t: "Koupím si novou hru do mobilu", to: { spent: 1 } },
      { g: "r", t: "Koupím z bazaru rozbité kolo, opravím ho a prodám", d: "Když se to povede, vyděláš", risk: { p: 0.75, win: 400 } },
      { g: "s", t: "Uložím ji na dětský spořicí účet", to: { bank: 1 } },
    ],
    tip: ["První vlastní výdělek", "Peníze, které si vyděláš prací, jsou aktivní příjem. Zkus si z každého příjmu nejdřív kousek odložit a teprve pak utrácet."] },

  { id: "s3", age: 16, title: "První brigáda ve fastfoodu", income: 4800,
    story: "O prázdninách jsi na brigádě ve fastfoodu. Za 40 odpracovaných hodin po 120 Kč máš 4 800 Kč.",
    q: "Jak naložíš s první výplatou?",
    opts: [
      { g: "r", t: "Koupím použitý foťák a budu fotit na zakázku", d: "Plesy, oslavy, sociální sítě", risk: { p: 0.7, win: 12000 } },
      { g: "s", t: "Celou výplatu na spořicí účet", to: { bank: 1 } },
      { g: "p", t: "Nové boty a oblečení", to: { spent: 1 } },
    ],
    tip: ["Pravidlo 50/30/20", "Oblíbené pravidlo říká: 50 % příjmu na nutné výdaje, 30 % na to, co tě baví, a 20 % na spoření."] },

  { id: "s4", age: 20, title: "Práce při studiu", income: 24000,
    story: "Studuješ na VŠCHT a vedle školy pracuješ v laboratoři za 200 Kč/h. Za semestr ti zbylo 24 000 Kč.",
    q: "Kamarádi mají nový telefon. Co uděláš?",
    opts: [
      { g: "p", t: "Koupím telefon za 24 000 Kč na splátky", d: "Na úrocích přeplatíš 6 000 Kč", to: { spent: 1 }, debt: 6000 },
      { g: "s", t: "Založím si nouzovou rezervu na účtu", d: "Pro případ nečekaných výdajů", to: { bank: 1 } },
      { g: "r", t: "Rozjedu s kamarádem e-shop s vlastními tričky", d: "Podnikání: velká šance, velké riziko", risk: { p: 0.6, win: 60000 } },
    ],
    tip: ["Splátky jsou drahé", "Nákup na splátky znamená, že za stejnou věc zaplatíš víc. Nouzová rezerva ve výši 3–6 měsíčních výdajů tě podrží, když se něco pokazí."] },

  // task: true = na stanovišti je úkol s obsluhou. Po splnění organizátor
  // ukáže druhý QR kód („úkolový"), teprve pak jde odpovídat.
  { id: "s5", age: 22, title: "Příležitostný přivýdělek", income: 500, task: true,
    story: "Na stanovišti tě čeká úkol od studentů. Když ho splníš, organizátor ti ukáže speciální QR kód a dostaneš odměnu 500 Kč.",
    taskText: "[DOPLNIT: zadání úkolu, který připraví tým stanoviště]",
    q: "Úkol splněn. Kam dáš odměnu?",
    opts: [
      { g: "s", t: "Na spořicí účet", to: { bank: 1 } },
      { g: "r", t: "Půjčím ji kamarádovi na start-up za malý podíl ve firmě", d: "Většina start-upů neuspěje", risk: { p: 0.5, win: 2500 } },
      { g: "p", t: "Utratím ji za večer ve městě", to: { spent: 1 } },
    ],
    tip: ["Bonusy a přivýdělky", "Nečekané peníze se utrácejí nejsnáz. Když je rovnou uložíš, ani ti nebudou chybět."] },

  // quiz: true = otázka má správnou odpověď (ok: true). Nedává bod žádnému typu.
  { id: "s6", age: 24, title: "Kurz o investování", income: 0, quiz: true, bonus: 2000,
    story: "Škola pořádá dobrovolný kurz o investování. Kdo správně odpoví na kontrolní otázku, získá bonus 2 000 Kč. Po kurzu můžeš peníze nově ukládat i do akcií a ETF.",
    q: "Co je ETF?",
    opts: [
      { t: "Spořicí účet s pevným úrokem garantovaným státem" },
      { t: "Fond, který kupuje najednou akcie mnoha firem", ok: true },
      { t: "Druh kryptoměny" },
    ],
    tip: ["Diverzifikace", "ETF rozloží tvoje peníze mezi stovky firem, takže neztratíš všechno, když se jedné nedaří. Dlouhodobě akciové ETF rostly rychleji než spořicí účty, ale jejich hodnota kolísá."] },

  { id: "s7", age: 25, title: "Práce na plný úvazek", income: 900000,
    story: "Nastupuješ jako chemik do firmy. Každý měsíc ti po zaplacení nájmu a jídla zbyde 5 000 Kč. Za 15 let to dělá 900 000 Kč.",
    q: "Co budeš s volnými penězi dělat?",
    opts: [
      { g: "p", t: "Užívat si: dražší auto, dovolené", to: { spent: 1 } },
      { g: "r", t: "Pravidelně investovat do ETF", to: { invest: 1 }, needs: "invest" },
      { g: "s", t: "Posílat je na spořicí účet", to: { bank: 1 } },
    ],
    tip: ["Složené úročení", "Výnos, který investice vydělá, se dál zhodnocuje. Čím dřív začneš, tím víc za tebe pracuje čas."] },

  { id: "s8", age: 40, title: "Ředitel firmy", income: 2000000,
    story: "Povýšili tě na ředitele s platem 150 000 Kč měsíčně. Za dalších 15 let ti zbyde 2 miliony korun.",
    q: "Jak naložíš s vyšším příjmem?",
    opts: [
      { g: "s", t: "Na spořicí účet", to: { bank: 1 } },
      { g: "p", t: "Luxusní vila a sportovní auto", to: { spent: 1 } },
      { g: "r", t: "Investovat a žít skromněji", to: { invest: 1 }, needs: "invest" },
    ],
    tip: ["Inflace životního stylu", "Když s vyšším platem rostou i výdaje, nezbývá ti víc než dřív. Bohatství neurčuje plat, ale to, kolik z něj ti zůstane."] },

  { id: "s9", age: 55, title: "Poloviční úvazek", income: 300000,
    story: "Zpomaluješ a pracuješ na poloviční úvazek. Do důchodu ti zbyde ještě 300 000 Kč.",
    q: "Co s posledními úsporami před důchodem?",
    opts: [
      { g: "r", t: "Investovat", to: { invest: 1 }, needs: "invest" },
      { g: "p", t: "Procestovat svět", to: { spent: 1 } },
      { g: "s", t: "Na spořicí účet", to: { bank: 1 } },
    ],
    tip: ["Blíž k důchodu, míň rizika", "Před důchodem se vyplatí přesouvat část investic do bezpečnějších produktů, aby tě pokles trhu nezaskočil těsně před tím, než peníze budeš potřebovat."] },

  // final: true = poslední stanoviště, žádná otázka, jen vyhodnocení.
  { id: "s10", age: 65, title: "Důchod", final: true },
];

// Roční zhodnocení v herním zjednodušení (v dnešních penězích).
export const RATE = { piggy: -0.02, bank: 0.01, invest: 0.06 };

// Tři typy hráče (dolní lišta). Texty se ukážou na konci hry.
export const GROUPS = {
  p: { name: "Požitkář", color: "#f2a33a", motto: "Žiju teď",
       text: "Peníze jsou pro tebe hlavně prostředek, jak si užít život. Umíš si udělat radost a nebojíš se utratit. Pozor jen, aby ti na stáří něco zbylo: i malá pravidelná částka stranou dělá za 40 let velký rozdíl." },
  s: { name: "Střadatel", color: "#4a8af0", motto: "Jistota především",
       text: "Jsi opatrný a rozvážný. Máš rezervu a dluhy ti nahánějí strach. Tvoje peníze jsou v bezpečí, jen rostou pomalu. Zkus část úspor dlouhodobě investovat, ať ti inflace neujídá." },
  r: { name: "Podnikavec", color: "#e64010", motto: "Riskuju, aby to rostlo",
       text: "Vidíš příležitosti tam, kde ostatní ne, a nebojíš se riskovat. Díky tomu ti peníze můžou růst nejrychleji. Nezapomínej ale na rezervu pro horší časy, ne každá sázka vyjde." },
};

// Úrovně důchodu a ceny (od nejlepší). Ceny podle toho, jak hráč skončí.
export const TIERS = [
  { id: "renta",  min: 8000000, t: "Vlastní dům a renta z dividend", d: "Žiješ z výnosů svých investic a peníze ti ještě rostou.", prize: "Hlavní cena", prizeText: "[DOPLNIT cenu]" },
  { id: "byt",    min: 2500000, t: "Vlastní byt a klidný důchod", d: "Máš rezervu, občas si dopřeješ výlet.", prize: "Střední cena", prizeText: "[DOPLNIT cenu]" },
  { id: "najem",  min: 500000,  t: "Skromný důchod v nájmu", d: "Vyjdeš, ale na nečekané výdaje nezbývá moc.", prize: "Malá cena", prizeText: "[DOPLNIT cenu]" },
  { id: "davky",  min: null,    t: "Domov důchodců na dávkách", d: "Jsi odkázaný na státní důchod a dávky.", prize: "Účastnická drobnost", prizeText: "[DOPLNIT cenu]" },
];
