// ---------------------------------------------------------------------------
//  ZDROJ PRAVDY o obsahu hry (běží POUZE na serveru).
//
//  Hráč prožije studium na VŠCHT v 10 stanovištích. Každá odpověď mění tři
//  metriky:  f  Finance     v  Vzdělání     p  Požitky
//  Každá metrika začíná na START_METRIC bodech.
//
//  Texty a body: dokumenty/otázky/Stanoviště DOD - pracovní verze.docx (5. 11.)
//  a Vyhodnocení DOD.docx. Pravidla (výpočet, trasa, skóre) jsou v game.js.
//
//  Každá možnost odpovědi má:
//    t      text odpovědi (co hráč vybírá)
//    fx     změna metrik, např. { f: -2, v: 1, p: 2 } (chybějící = 0)
//    r      (nepovinné) co se stalo – ukáže se hráči po odpovědi
//    needs  (nepovinné) podmínka, např. { v: 12 }. Když ji hráč nesplní,
//           uvidí možnost zamčenou i s vysvětlením proč.
//    ok     (nepovinné) u výpočtů: true = správně, false = špatně
//    switchTo (nepovinné) po odpovědi přepne hráče do skupiny/trasy
//
//  Otevřená otázka (hráč píše číslo): místo opts má stanoviště
//    input: { unit: "Kč", ranges: [{ min, max, fx, r, ok }, …] }
//  Odpověď spadne do prvního rozsahu, kam patří; poslední rozsah bez min/max
//  je „jiný výsledek“.
//
//  Pole fx, ok a ranges se do prohlížeče NEPOSÍLAJÍ (viz publicStation v game.js),
//  takže hráč z kódu stránky nevyčte, co se vyplatí.
//
//  Stanoviště může mít `variants: { erasmus: {...}, doma: {...} }` – jiný
//  příběh a otázku podle trasy hráče.
// ---------------------------------------------------------------------------

export const START_METRIC = 10;

// Výběrové řízení na Erasmus (stanoviště 6): komise hledí na vzdělání.
// Kdo nemá aspoň ERASMUS_MIN_V, má možnosti A a B zamčené a zbývá mu C (zůstat doma).
// Dražší země (A) navíc potřebuje finance aspoň START_METRIC – doplácí se z úspor.
// Při náhodných odpovědích projde výběrem asi 60 % hráčů.
export const ERASMUS_MIN_V = 12;

// Spořicí účet (Banka) – stejné vyhodnocení pro obě trasy.
// 10 000 Kč × 2,5 % = 250 Kč úrok, daň 15 % = 37,50 Kč → 10 212,50 Kč ÷ 1,05 = 9 726 Kč.
const SAVINGS = {
  unit: "Kč",
  ranges: [
    { min: 9700, max: 9744, ok: true, fx: { f: 1, v: 2 },
      r: "Přesně tak! Správně jsi spočítal/a hodnotu úspor po odečtení srážkové daně i zohlednění inflace. Když inflace převyšuje čistou úrokovou míru, úspory ztrácí na hodnotě." },
    { min: 9745, max: 9770, fx: { v: 1 },
      r: "Skoro! Z celkové částky se ti ještě strhne srážková daň 15 %. U malé částky je zanedbatelná, na větším objemu peněz se už znatelně projeví." },
    { ok: false, fx: { v: -1 },
      r: "To nevychází. Úrok 250 Kč, z něj srážková daň 37,50 Kč. Pak odečteme inflaci (vydělíme částku 1,05) a máme 9 726 Kč. Peněz na účtu je více, ale koupíš za ně méně." },
  ],
};

// Státnice a první nabídka – možnosti jsou stejné pro obě trasy, liší se příběh.
const JOB_OPTS = (travel) => [
  { t: "Zjistím si průměrné mzdy v oboru a snažím se vyjednat o 10 % lepší plat, než byl v inzerátu. Jinak nabídku nepřijmu, i když riskuji odmítnutí.",
    fx: { f: 3, v: 2, p: 1 },
    r: "Firma sice chvíli váhala, ty ses ale nenechal/a odbýt a máš o 10 % vyšší výplatu. Z té se pak bude vycházet při každém dalším procentuálním navýšení. Skvělá práce!" },
  { t: "Vezmu hned nižší mzdu, protože mi firma nabídla odbornou certifikaci a mentoring.",
    fx: { f: 1, v: 3, p: -1 },
    r: "Sice teď dostaneš nižší odměnu, ale certifikace za desítky tisíc spolu s mentorem ti v horizontu následujících let mohou přinést daleko lepší pozici a vyšší mzdu, než kdybys šel/šla hned za nejlákavější finanční nabídkou." },
  { t: travel,
    fx: { f: -2, v: 1, p: 3 },
    r: "Získáš nadhled, zlepšíš se v cizím jazyce, už ti nebude dělat problém komunikace s lidmi a taky si přivezeš spoustu zážitků. Je na tobě, jak následně zahraniční zkušenost prodáš, zatímco ostatní už získali náskok půl roku praxe v oboru." },
];

export const STATIONS = [
  { id: "s1", place: "Obytné budovy", title: "Nástup na vysokou",
    story: "Přijali tě na VŠCHT! Od rodičů a z letní brigády máš naspořeno 20 000 Kč. První důležité rozhodnutí ještě před začátkem semestru:",
    q: "Kde budeš bydlet?",
    opts: [
      { t: "Sdílené bydlení s kamarády – 8 000 Kč měsíčně za nájem a bude třeba složit kauci. Tady budeš mít vlastní pokoj a klid na učení.",
        fx: { f: -2, v: 1, p: 2 },
        r: "Máš vlastní pokoj a klid na učení, ale na kauci padne značná část úspor a budeš muset během semestru pracovat, abys zvládal/a platit nájem." },
      { t: "Kolej – 5 000 Kč měsíčně za dvoulůžkový pokoj, sdílená kuchyňka a hluk. Zároveň ale spousta nových známostí.",
        fx: { f: 1, v: 1, p: 1 },
        r: "Rychle si najdeš kamarády, můžete se učit spolu a sdílet materiály. Na pokoji je občas hluk, ale ušetříš peníze i stres." },
      { t: "Bydlení u rodičů – 2 hodiny dojíždění denně, 800 Kč měsíčně za vlak, ale zbývá minimum času na školní akce a kamarády.",
        fx: { f: 3, v: -1, p: -2 },
        r: "Ušetříš větší částku za nájem, ale strávíš každý týden 10 hodin na cestě, pokud všechny spoje pojedou včas. V plném vlaku někdy budeš muset stát v uličce a taky tam bývá dost hluku. Nezbyde moc energie a času na akce po škole. Kolik tě ten čas vlastně stojí?" },
    ] },

  { id: "s2", place: "Bistro", title: "Stravování",
    story: "Po dlouhém dni ve škole nemáš chuť vařit. V aplikaci na rozvoz jídla je tento týden sleva.",
    q: "Jak se budeš stravovat?",
    opts: [
      { t: "Většinou si objednám nějakou dovážku, vyjde mě na 200 Kč/jídlo. Ušetřený čas věnuji učení.",
        fx: { f: -3, v: 1, p: 2 },
        r: "Dovážka jídla tě měsíčně vyjde o několik tisíc dráž, než kdyby sis předem uvařil/a. Ušetřený čas se snadno ztratí u seriálu nebo sociálních sítí. Za pohodlí si výrazně připlatíš." },
      { t: "Na oběd zajdu do menzy za 100 Kč, v neděli si se spolubydlícími připravíme společně jídlo na následující dny (cca 3 hodiny času).",
        fx: { f: 1, v: 1, p: 1 },
        r: "Každý týden strávíš čas se spolubydlícími, stravuješ se zdravě a na konci měsíce ti zbydou peníze." },
      { t: "Sleduji akce v obchodech a vždycky vyberu něco rychlého. Občas nestíhám a vynechám snídani nebo večeři.",
        fx: { f: 2, v: -1, p: -3 },
        r: "Když nevěnuješ pozornost stravování, budeš mít často hlad a potíže se soustředěním. Ve škole budeš stále unavený/á. Vynechávání jídla není rozumný způsob šetření peněz." },
    ] },

  { id: "s3", place: "Městská knihovna", title: "Zkouškové je tady!",
    story: "Za týden tě čeká zkouška z mikroekonomie, která je pověstná vysokou propadovostí. Šéf na brigádě nabízí extra směny za příplatek + 30 %.",
    q: "Co uděláš?",
    opts: [
      { t: "Beru všechny směny – první termín jen zkusím, mám další dva v rezervě.",
        fx: { f: 3, v: -2, p: -1 },
        r: "Sice sis vydělal/a 10 000 Kč, ale zkoušku musíš opakovat. Čeká tě opravný termín v časovém presu a při nejhorším opakování předmětu. Pokud se zkouška nepovede, studium budeš muset protáhnout, a to stojí peníze." },
      { t: "Odmítnu brigádu a celý týden se učím.",
        fx: { f: -1, v: 3, p: -1 },
        r: "První úspěšný pokus a zkouška je za tebou. Šéf ti možná už příště nenabídne další směny. Investoval/a jsi však čas do vzdělání, které ti hodnotu přinese později." },
      { t: "Vezmu jen jednu víkendovou směnu a přes týden se učím se spolužáky.",
        fx: { f: 1, v: 1, p: 1 },
        r: "Zkouška hotová a přivydělal/a sis alespoň 2 000 Kč. Pomohlo ti společné učení se spolužáky, ale stálo tě to několik hodin spánku." },
    ] },

  { id: "s4", place: "Prodejna elektroniky", title: "Rozbitý notebook",
    story: "Rozbil se ti notebook, který nutně potřebuješ na odevzdání zápočtových prací. Máš k dispozici našetřenou rezervu 10 000 Kč.",
    q: "Jak to vyřešíš?",
    opts: [
      { t: "Využiju rezervu na repasovaný notebook za 9 000 Kč se zárukou.",
        fx: { f: -2, v: 1 },
        r: "Nový notebook funguje bez problému a nemusel/a ses zadlužit. Co nejdříve začni doplňovat rezervu, která je teď minimální, ať tě nezaskočí další nečekané výdaje." },
      { t: "Vezmu co nejrychleji nový notebook na splátky (3 × 6 000 Kč), které mám bez navýšení, platím jen při prodlení.",
        fx: { f: -1, v: 2, p: 2 },
        r: "Notebook funguje, zápočty zvládnuty. Máš teď ale dluh, na který musíš stále myslet, a včas splácet, aby nenarostl o poplatky z prodlení." },
      { t: "Do zápočtů budu chodit do školního výpočetního centra, nebo si půjčovat notebook od spolubydlícího. Za tři měsíce našetřím na nový.",
        fx: { f: 1, p: -1 },
        r: "Spolubydlící je často s notebookem pryč a půjčuje ti ho až pozdě večer, v knihovně musíš čekat na místo. Zápočty jsi zvládl/a na poslední chvíli s horším hodnocením. Ušetřil/a jsi, ale stálo tě to spoustu času a stresu navíc." },
    ] },

  { id: "s5", place: "Vnitroblok", title: "Odborná praxe",
    story: "V posledním ročníku máš čas na praxi. Nabídky jsou tři.",
    q: "Kterou si vybereš?",
    opts: [
      { t: "Brigáda ve skladu za 220 Kč/h, 20 hodin týdně.",
        fx: { f: 3, v: -1, p: -1 },
        r: "Máš našetřenou rezervu, ale bude náročnější tuhle pracovní zkušenost prodat u pohovoru do zaměstnání. Chybí ti cenné zkušenosti v oboru." },
      { t: "Placená stáž v renomované poradenské firmě za 160 Kč/h.",
        fx: { f: -1, v: 3 },
        r: "Tato zkušenost se bude v životopise vyjímat. Získáš taky kontakty, které jsou mnohdy při hledání práce nejcennějším benefitem. Celý semestr ale budeš muset zvládnout s podporou rodičů a ušetřit se příliš nepodaří." },
      // V dokumentu bylo f −2, v +3, p −1 – nesedělo s textem (odpočinek, ztráta náskoku). Upraveno 5. 11.
      { t: "Poslední ročník si chci odpočinout, možná zajdu někdy vypomoct na jednorázovou brigádu.",
        fx: { f: -1, v: -2, p: 3 },
        r: "Zbyla ti spousta času na kamarády a občas sis něco přivydělal/a. Za chvíli se ale začneš ucházet o práci a ostatní uchazeči budou mít pravděpodobně náskok se zkušenostmi i kontakty." },
    ] },

  // Výběrko: podle vzdělání (ERASMUS_MIN_V) jsou A a B volné, nebo zamčené.
  // A, B → trasa „erasmus“ (Banka, pak Kanceláře), C → trasa „doma“ (Kanceláře, pak Banka).
  { id: "s6", place: "Přístav", title: "Erasmus", selection: true,
    story: "Máš možnost vyjet na semestr do zahraničí s grantem Erasmus+.",
    q: "Využiješ nabídku?",
    opts: [
      { t: "Ano – vyberu dražší zemi, 70 % nákladů mi pokryje grant, zbytek doplatím z úspor.",
        fx: { f: -2, v: 2, p: 3 }, needs: { v: ERASMUS_MIN_V, f: START_METRIC }, switchTo: "erasmus",
        r: "Semestr na zahraniční univerzitě ti přinese nové kontakty, zkušenosti a zdokonalíš se v jazyce. V životopise bude vynikat. Ubyde ale z úspor a po návratu budeš muset šetřit." },
      { t: "Ano – vyberu levnější zemi, kde nebudu muset doplácet nic z úspor. Na partnerské škole pravděpodobně nebude moc předmětů z mého oboru.",
        fx: { f: -1, v: 1, p: 2 }, needs: { v: ERASMUS_MIN_V }, switchTo: "erasmus",
        r: "Máš v životopise zahraniční zkušenost a nebudeš se muset uskromňovat po návratu. Všechny předměty ti ale na škole neuznají a budeš muset dohnat několik zkoušek." },
      { t: "Nepojedu, semestr strávím doma. Všechny předměty tak dokončím včas a budu stíhat práci na částečný úvazek.",
        fx: { f: 3, p: -2 }, switchTo: "doma",
        r: "Nebudeš muset řešit prodlužování studia a dosáhneš na slušné úspory. Spolužáci budou ale mít lepší angličtinu, zážitky a kontakty na celý život. Možná už se podobná příležitost neobjeví." },
    ] },

  // Banka a Kanceláře: trasa „erasmus“ jde nejdřív do Banky, „doma“ nejdřív do Kanceláří.
  { id: "s7", place: "Banka", title: "Spořicí účet",
    variants: {
      erasmus: {
        story: "Rok před odjezdem na Erasmus jsi začal/a šetřit, protože grant nepřijde hned první den. Na začátku máš na spořicím účtu 10 000 Kč, úročených sazbou 2,5 % p. a. Inflace za rok je 5 %.",
        q: "Jakou reálnou hodnotu budou tyto tvoje úspory mít na konci roku?",
        input: SAVINGS },
      doma: {
        story: "Zvolil/a jsi dlouhodobou brigádu při studiu a daří se ti každý měsíc část příjmu odkládat na spořicí účet. Pro snadný výpočet použijme částku 10 000 Kč. Ta je na spořicím účtu úročena sazbou 2,5 % p. a. Inflace za rok bude 5 %.",
        q: "Jakou reálnou hodnotu budou tyto tvoje úspory mít na konci roku?",
        input: SAVINGS },
    } },

  { id: "s8", place: "Kancelářské budovy", title: "Státnice a první nabídka",
    variants: {
      erasmus: {
        story: "Po návratu z Erasmu dokončíš diplomku a úspěšně završíš studium státnicemi. Zaměstnavatele zaujme tvoje zahraniční zkušenost v životopise a jdeš na pohovor do mezinárodní firmy.",
        q: "Jak s nabídkou naložíš?",
        opts: JOB_OPTS("Na půl roku si dám pauzu, chci cestovat ze zbylých úspor.") },
      doma: {
        story: "Studium jsi stihl/a bez prodlužování a při škole jsi nasbíral/a i pracovní zkušenosti do životopisu. Teď přichází první pracovní nabídka.",
        q: "Jak s nabídkou naložíš?",
        opts: JOB_OPTS("Na půl roku se vydám cestovat z úspor, teď nebudu práci řešit.") },
    } },

  // Stanoviště je až po státnicích, proto příběh jako ohlédnutí za prvákem (upraveno 5. 11.).
  { id: "s9", place: "Park", title: "Rozpočet na semestr",
    story: "Ohlédnutí za prvákem: měsíčně jsi měl/a k dispozici kapesné 6 000 Kč a kamarádi pořád někam vyráželi.",
    q: "Jak jsi s kapesným naložil/a?",
    opts: [
      { t: "Chci užít akce s kamarády, kdyžtak zavolám rodičům a kapesné se nějak vyřeší.",
        fx: { f: -2, v: -1, p: 3 },
        r: "Prvák byl plný nových zážitků! V polovině měsíce ti ale pravidelně začaly docházet finance, kvůli brigádám jsi nestíhal/a učení na zkoušky a musel/a je opakovat, občas ti půjčili kamarádi. Takhle snadno spadneš do dluhů." },
      { t: "Odložím si na pravidelné spoření, pak zaplatím nutné výdaje a zbyde mi i na nějaký výlet s kamarády, ale občas jim budu muset říct ne.",
        fx: { f: 2, v: 1, p: -1 },
        r: "Pokud se ti povede pravidelně odložit např. 1 500 Kč, máš ročně ušetřeno 18 000 Kč. Taková částka ti už může pomoci dosáhnout na kauci, až budeš řešit bydlení po škole. Stále si užiješ čas s přáteli a naučíš se hospodařit s měsíčním rozpočtem, což oceníš, až přijde první výplata." },
      { t: "Stáhnu si aplikaci na sledování výdajů, a až budu mít někdy čas, podívám se, jak funguje. Utrácím s rozumem a co zbyde na konci měsíce, pošlu na spořicí účet.",
        fx: { f: -2, v: -1, p: 1 },
        r: "„Co zbyde“ může často být nic. Při nepravidelném spoření rezerva roste pomalu. Pokud utrácíš bez přehledu, můžeš být s postupem času shovívavější a snadno skončit bez rezerv." },
    ] },

  // Poslední stanoviště – po odpovědi hra končí a hráč vidí vyhodnocení.
  { id: "s10", place: "DOX", title: "Promoce a první výplata",
    story: "Máš titul a nastupuješ do první práce! Na účet ti přišla první plná výplata: 33 000 Kč čistého.",
    q: "Co s ní uděláš?",
    opts: [
      { t: "Nastavím trvalý příkaz na rezervu a penzijní spoření, abych získal/a příspěvek od zaměstnavatele, zbytek utratím.",
        fx: { f: 2, v: 1, p: -1 },
        r: "Máš do začátku silný finanční základ a dostáváš navíc příspěvek. Nezbývá na bezmyšlenkovité utrácení, zato tě nerozhodí nečekané výdaje. Ideální start!" },
      { t: "Třetinu rozdělím mezi kapitálové fondy, abych si hned začal/a tvořit finanční rezervu. Uskromním se a zbytek mám na útratu.",
        fx: { f: 1, v: 1, p: -1 },
        r: "Využíváš časovou výhodu naplno a peníze pracují pro tebe. Dávej však pozor, aby stále bylo kam sáhnout v případě nečekaných výdajů a nebyl/a jsi nucen/a hned prodávat investice ve ztrátě." },
      { t: "První výplata půjde na dovolenou s kamarády, od příštího měsíce začínám spořit.",
        fx: { f: -1, p: 3 },
        r: "Dovolená byla skvělá forma odpočinku po letech studia. Nicméně sis stále neukotvil/a finanční návyky a čím déle to budeš odkládat, tím těžší bude se uskromnit." },
    ] },
];

// ---- Trasa -------------------------------------------------------------------
// Pořadí stanovišť pro každou skupinu (id stanovišť = vytištěné QR, NEMĚNIT).
// Do Erasmu (s6) je trasa stejná; o skupině rozhodne volba na s6 (switchTo).
export const ROUTES = {
  erasmus: ["s1", "s2", "s5", "s3", "s4", "s6", "s7", "s8", "s9", "s10"],
  doma:    ["s1", "s2", "s5", "s3", "s4", "s6", "s8", "s7", "s9", "s10"],
};

// Výsledek výběrka – ukáže se na stanovišti 6 nad otázkou.
export const SELECTION_INFO = {
  in:  { name: "Výběrová komise tě vybrala!",
         why: "Komise hodnotí hlavně studijní výsledky a ty jsi do vzdělání investoval/a dost. Teď je jen na tobě, jestli pojedeš." },
  out: { name: "Na výběrko to tentokrát nestačilo",
         why: `Komise hledí hlavně na studijní výsledky – potřebuješ aspoň ${ERASMUS_MIN_V} bodů vzdělání. Semestr strávíš v Praze.` },
};

// ---- Vyhodnocení -------------------------------------------------------------
// Tři metriky = tři profily hráče. Nejsilnější metrika určí profil.
// eval = texty z Vyhodnocení DOD.docx podle konečného počtu bodů (do max včetně).
export const METRICS = {
  f: { name: "Finance",  profile: "Střadatel",    color: "#4a8af0",
       eval: [
         { max: 10, t: "Během studia sis výdaje příliš nehlídal/a, nemáš finanční rezervu, a teď budeš muset co nejdříve přijmout pracovní nabídku, neboť přílišné vyjednávání by představovalo finanční riziko. Nečekané výdaje tě rozhodí a stěží složíš kauci při stěhování do nového bydlení. Co nejdříve si vytvoř pravidelný příkaz a část výplaty směřuj do rezerv, abys zůstal/a v klidu a bez dluhů." },
         { max: 19, t: "Tvoje finanční rozhodnutí byla rozumná. Někdy jsi dal/a přednost zážitkům a pohodlí, avšak podařilo se ti vytvořit si dostatečnou rezervu, aby sis teď mohl/a v práci dovolit vyjednávat, nerozhodí tě složení kauce na bydlení ani nečekané výdaje. Zkus ještě zapracovat na spoření a investování a nechat peníze pracovat pro tebe." },
         { max: Infinity, t: "Finance pod kontrolou! Na konci studia máš vytvořenou rezervu a nepřekvapí tě nečekané výdaje. Zbývá ti teď i na výlety a zábavu, v klidu se můžeš rozhlédnout po nové práci a vyjednat si podmínky. Skvělá práce!" },
       ] },
  v: { name: "Vzdělání", profile: "Studijní typ", color: "#e64010",
       eval: [
         { max: 10, t: "Nevěnoval/a jsi moc pozornosti učení a musel/a opakovat některé zkoušky. Hodně času ti ukrojila zábava a dobře placené brigády, teď ti ale chybí praxe v oboru. Abys vynikl/a při hledání práce, bude třeba praxi teď dohnat. Je na tobě, jak dokážeš prodat své pracovní zkušenosti mimo obor." },
         { max: 19, t: "Výborně! Studium je úspěšně za tebou, k diplomu se ti povedlo nasbírat i cenné pracovní zkušenosti a kontakty. Zvládáš si zorganizovat čas a skloubit práci, studium i odpočinek. Zvládnutý time management tě teď podrží v pracovním životě. Máš silný životopis a prostor pro nástavbu, ideální start kariéry!" },
         { max: Infinity, t: "Vzdělání pro tebe bylo celou dobu jasnou prioritou. Zvládl/a jsi taky získat praxi v oboru a cenné kontakty. Teď přichází čas to prodat! Máš velmi silný základ a slibnou kariérní cestu před sebou. Dobrá práce!" },
       ] },
  p: { name: "Požitky",  profile: "Požitkář",     color: "#f2a33a",
       eval: [
         { max: 10, t: "Studium sis příliš neužil/a, nezbývalo ti moc prostoru na zábavu a kamarády. Hodně jsi obětoval/a výsledkům a teď je čas si odpočinout. Soustřeď se na koníčky, lidi okolo sebe a po státnicích si najdi čas na zasloužený odpočinek. Diplom už je v kapse, nezapomínej taky na sebe, aby sis udržel/a motivaci." },
         { max: 19, t: "Povedlo se ti najít rovnováhu mezi povinnostmi a zábavou. Užitých akcí a výletů bylo dost, i když jsi některé kvůli studiu musel/a odříct. Stále máš však velmi dobré studijní výsledky a i na kamarády čas zbyl. Tento přístup se ti bude hodit také v práci, kde se díky vyhrazenému prostoru na zábavu a přátele vyhneš vyhoření, udržíš si motivaci i dostatek odpočinku." },
         { max: Infinity, t: "U tebe měla zábava a kamarádi před studiem jednoznačně přednost. Máš spoustu vzpomínek a nových přátel, ale zamysli se, zda ti neutekly znalosti, které budeš muset později dohánět. Stála za to každá akce a stres při učení v noci před zkouškou? Ve škole jsi měl/a možnost dostat se ke spoustě informací, které tě později mohou přijít draho." },
       ] },
};

// Životní skóre 0–100: 80 % průměr (finance, vzdělání, požitky)
// + 20 % nejslabší oblast = bonus za vyvážený život.
export const SCORE = { avgWeight: 0.8, balanceWeight: 0.2 };

// Slovní hodnocení podle skóre (od nejlepšího).
export const BANDS = [
  { min: 65, t: "Výborně vyvážený start", d: "Zvládl/a jsi studium, peníze i život kolem. Do pracovního života vstupuješ s náskokem." },
  { min: 40, t: "Solidní start",          d: "Někde jsi vyhrál/a, jinde ztratil/a. Na tom se dá stavět." },
  { min: 0,  t: "Je co dohánět",          d: "Něco jsi hodně zanedbal/a. Dobrá zpráva: ve skutečném životě máš čas to dohnat." },
];
