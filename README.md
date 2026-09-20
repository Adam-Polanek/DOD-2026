# Trasa DOD — kvízová webová aplikace pro terénní část dne otevřených dveří

Mobilní webová hra pro 10 stanovišť: účastník naskenuje QR kód, dostane svůj
hrací kód, na každém stanovišti splní úkol a kvíz, sbírá body a na konci vidí
skóre i pořadí v žebříčku. Organizátoři mají živý přehled a export výsledků.

- **Frontend** (`public/index.html`) — appka pro účastníky, běží v mobilu bez instalace.
- **Backend** (`server.js`, `db.js`, `questions.js`) — Node + Express + SQLite.
- **Admin** (`public/admin.html`) — živý žebříček na projektor + export do CSV/Excelu.

Body počítá **server**, správné odpovědi se do prohlížeče nikdy neposílají —
nejde tedy podvádět čtením kódu stránky.

---

## 1) Rychlé spuštění na vlastním počítači (test)

Potřebuješ **Node.js verze 22.5 nebo novější** (`node --version`).

```bash
npm install
npm start
```

Pak otevři:
- Účastník: <http://localhost:3000>
- Admin přehled: <http://localhost:3000/admin> (token je ve výchozím stavu `zmen-me`)

Zastavení: `Ctrl+C`. Data se ukládají do `data/dod.sqlite`.

Nastavení přes proměnné prostředí (volitelné, zkopíruj `.env.example` → `.env`):

| Proměnná | Význam | Výchozí |
|---|---|---|
| `PORT` | port serveru | `3000` |
| `ADMIN_TOKEN` | heslo do admin přehledu a exportu | `zmen-me` |
| `DB_PATH` | cesta k databázi | `./data/dod.sqlite` |

---

## 2) Nasazení na internet — Render.com (krok za krokem)

> ⚠️ **Důležité pro den akce — kam se ukládají data.**
> Databáze je soubor na disku serveru. Na **bezplatném** plánu Renderu se server
> po ~15 minutách bez provozu **uspí** a jeho disk je dočasný — při uspání nebo
> novém nasazení by se **výsledky smazaly**. Pro ostrou akci proto zvol placený
> plán **Starter (~7 $/měs) + trvalý disk (~0,25 $/GB)**; server pak běží pořád
> a data přežijí. Po akci můžeš službu zase zrušit — reálně to vyjde na pár dolarů.
> Bezplatný plán je fajn jen na testování (a průběžně si dělej **Export CSV**).

### A. Připrav si kód na GitHubu
1. Založ si účet na <https://github.com> (pokud nemáš).
2. Vytvoř nový repozitář (např. `dod-trasa`) a nahraj do něj obsah této složky.
   (Buď přes web „Add file → Upload files", nebo přes `git`.)

### B. Vytvoř službu na Renderu
1. Registrace na <https://render.com> (jde přihlásit přes GitHub).
2. **New → Web Service** a vyber svůj repozitář `dod-trasa`.
3. Render sám pozná Node. Zkontroluj:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** pro akci vyber **Starter** (kvůli datům, viz výše).
4. **Environment → Add Environment Variable:**
   - `ADMIN_TOKEN` = *tvé tajné heslo* (např. `dodTeam8-2026!`)
   - `DB_PATH` = `/data/dod.sqlite`
5. **Disks → Add Disk** (jen u placeného plánu):
   - **Name:** `dod-data`, **Mount Path:** `/data`, **Size:** `1 GB`
6. **Create Web Service.** Za pár minut dostaneš veřejnou adresu, např.
   `https://dod-trasa.onrender.com`.

> 💡 Ve složce je i `render.yaml` (Blueprint) — když v Renderu zvolíš
> **New → Blueprint**, předvyplní většinu nastavení za tebe. `ADMIN_TOKEN`
> stejně zadáš ručně.

### C. Hotovo — adresy
- Účastníci: `https://dod-trasa.onrender.com`
- Admin přehled: `https://dod-trasa.onrender.com/admin`

*(Alternativy k Renderu: Railway, Fly.io — postup je obdobný: připojit repozitář,
nastavit start `npm start`, přidat proměnnou `ADMIN_TOKEN` a trvalý disk na `/data`.)*

---

## 3) QR kód na stanoviště a plakáty

Vytvoř QR kód, který vede na adresu appky (`https://…onrender.com`), jakýmkoli
generátorem (např. napiš do vyhledávače „QR code generator"). Ten samý QR dej
na start i na letáky. Účastníci ho naskenují foťákem v mobilu a appka se otevře.

---

## 4) Jak upravit otázky a stanoviště

Vše je v jednom souboru: **`questions.js`**.

- Každé stanoviště má `name`, `loc` (kde stojí), `task` (úkol na místě) a pole `q` s otázkami.
- U otázky je `t` (text), `opts` (možnosti) a `a` = **index správné odpovědi**
  (0 = první možnost, 1 = druhá, …) a `expl` (vysvětlení po odpovědi).
- Otázky v **[hranatých závorkách]** jsou schválně k doplnění reálných
  místních údajů (rok založení školy, historický milník města) — najdeš je
  u stanovišť `s1` a `s8`.

Body za správnou odpověď se řídí `POINTS_PER_CORRECT` (výchozí 50). Maximum
skóre se dopočítá samo. Po úpravě `questions.js` server restartuj (na Renderu
stačí nové nasazení / „Manual Deploy").

Hranice cen (kdo dostane co) se nastavují ve funkci `prizeFor` — v `public/index.html`
(text pro účastníka) a odpovídají procentům skóre (≥ 80 % hlavní cena, ≥ 50 % střední).

---

## 5) V den akce — pro organizátory

- Otevři **admin přehled** na projektoru/notebooku, zadej `ADMIN_TOKEN`.
  Žebříček se sám obnovuje každých 10 s.
- Ceny předáváš podle **hracího kódu** účastníka (vidíš ho v žebříčku i v exportu).
- **Export CSV** kdykoli stáhne všechny výsledky (otevře se v Excelu, se správnou diakritikou) —
  hodí se do závěrečné dokumentace projektu.
- Zpětná vazba účastníků se ukládá do databáze (tabulka `feedback`).

## Bezpečnost a soukromí
- **Určitě změň `ADMIN_TOKEN`** z výchozí hodnoty na vlastní heslo.
- Účastníci jsou anonymní (jen náhodný kód `DOD-XXXX`), žádné osobní údaje se nesbírají.

---

## Struktura projektu
```
dod-app/
├─ server.js          # Express server + API
├─ db.js              # datová vrstva (SQLite)
├─ questions.js       # ← ZDE upravuješ stanoviště a otázky
├─ public/
│  ├─ index.html      # appka pro účastníky (mobil)
│  └─ admin.html      # přehled pro organizátory
├─ render.yaml        # konfigurace nasazení (volitelné)
├─ package.json
└─ data/              # sem se ukládá databáze (vzniká sama)
```
