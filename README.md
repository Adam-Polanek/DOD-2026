# Studium na VŠCHT – finanční hra pro den otevřených dveří

Mobilní webová hra pro terénní část DOD VŠCHT (Praha-Holešovice, Jankovcova).
Uchazeč projde 10 stanovišť, na každém naskenuje QR kód, přečte kus příběhu
ze studia a rozhodne se (a/b/c). Každá volba mění tři oblasti – **finance,
vzdělání, požitky** – a úspory v Kč. Podle bodů se trasa v půlce rozdělí
(Erasmus / doma). V cíli hráč uvidí své **Životní skóre 0–100**, profil
a pořadí mezi ostatními.

- **Hra pro hráče:** `/` – běží v mobilu, bez instalace a bez osobních údajů
  (hráč dostane anonymní kód `DOD-XXXX`).
- **Přehled pro organizátory:** `/admin` – hráči, výsledky, export do Excelu, QR k tisku.
- **Obrazovka do cíle:** `/cil` – žebříček na monitor nebo projektor.

Body počítá **server**. Do mobilu se neposílá, kolik která odpověď dává bodů,
takže nejde podvádět úpravou stránky.

---

## 1) Spuštění na vlastním počítači

Potřebuješ **Node.js 22 nebo novější** (`node --version`).

```bash
npm install     # jen poprvé
npm run build   # sestaví frontend (Next.js) do web/out – poprvé a po každé změně ve web/
npm start
```

Pak otevři <http://localhost:3000> (hra), <http://localhost:3000/admin>
(heslo ve výchozím stavu `zmen-me`) a <http://localhost:3000/cil>.
Zastavení: `Ctrl + C`. Data se ukládají do `data/dod.sqlite`.

Kódy stanovišť pro zkoušení najdeš v `/admin` → záložka **QR k tisku**.

Když `web/out` neexistuje (frontend není sestavený), server použije původní
stránky ze složky `public/`.

### Vývoj frontendu (Next.js)

Frontend je ve složce `web/` (Next.js, React, TypeScript). Při vývoji běží dva procesy:

```bash
npm start          # 1. terminál: server a API na http://localhost:3000
npm run dev:web    # 2. terminál: frontend na http://localhost:3001 (změny vidíš hned)
```

Frontend na `:3001` posílá dotazy na `/api` serveru na `:3000`. Design tokeny
(barvy, písma) jsou ve `web/app/globals.css`, komponenty ve `web/components/`.
Návrh je ve Figmě (board „Směr A × VŠCHT – Laboratoř v oranžové“).

## 2) Nasazení na Azure App Service

Kód je na GitHubu a Azure si ho po každém `git push` sám stáhne a nasadí
(GitHub Actions, záložka **Actions** v repozitáři). GitHub Actions při tom
sám spustí `npm run build`, takže sestavený frontend se do gitu nedává.

Nastavení aplikace v Azure Portalu:

| Kde | Co |
|---|---|
| Vytvoření Web App | Publish **Code**, **Node 22 LTS**, **Linux**, plán **Basic B1** (Free má denní limit a v den akce by se mohl zastavit) |
| Settings → Environment variables | `ADMIN_TOKEN`, `QR_SECRET`, `DB_PATH=/home/data/dod.sqlite` |
| Settings → Configuration → General | **Always on: On** |
| Monitoring → Health check | cesta `/api/health` |
| Scale out | **1 instance** (databáze SQLite neunese víc serverů najednou) |

Hesla vygeneruješ v Terminálu příkazem `openssl rand -hex 16`.

## 3) Nastavení (proměnné prostředí)

| Proměnná | K čemu je | Výchozí |
|---|---|---|
| `ADMIN_TOKEN` | heslo do `/admin` a exportu | `zmen-me` – **změnit!** |
| `QR_SECRET` | z něj se počítají kódy v QR | `zmen-me-qr` – **změnit před tiskem QR a pak už nikdy** |
| `DB_PATH` | kde leží databáze | `./data/dod.sqlite` |
| `PORT` | port serveru | `3000` (Azure nastaví sám) |

⚠ Když se `QR_SECRET` změní, všechny vytištěné QR kódy přestanou platit.

## 4) Úprava otázek a stanovišť

Všechen obsah je v jediném souboru **`server/questions.js`**. Design ani server se
kvůli tomu měnit nemusí. Jedna odpověď vypadá takhle:

```js
{ t: "Kolej – 5 000 Kč měsíčně za dvoulůžkový pokoj…",   // text odpovědi
  fx: { f: 1, v: 0, p: 1 },   // body: f finance, v vzdělání, p požitky
  kc: -5000,                  // změna úspor v Kč
  r: "Rychle si najdeš kamarády…",   // co se stalo (ukáže se po odpovědi)
  needs: { kc: 10000 },       // nepovinné: podmínka, jinak je možnost zamčená
},
```

- Stanoviště s jiným textem pro skupinu Erasmus a doma má `variants: { erasmus: {…}, doma: {…} }`.
- O tom, kdo jede na Erasmus, rozhoduje funkce `chooseGroup()` (dole v souboru).
- Texty označené `[NÁVRH]` jsou zástupné a mají se nahradit finálními.

Po úpravě: vyzkoušet lokálně (`npm start`), pak `git commit` a `git push`.
Výsledky hráčů se přepočítají samy, v databázi jsou uložené jen jejich volby.

## 5) Před akcí – kontrolní seznam

- [ ] Na Azure nastavené `ADMIN_TOKEN` a `QR_SECRET` (admin stránka jinak varuje).
- [ ] Finální texty v `server/questions.js`, žádné `[NÁVRH]`.
- [ ] QR kódy vytisknout **z ostré adresy** (`https://…azurewebsites.net/admin`
      → QR k tisku → Tisknout). Z `localhost` nefungují.
- [ ] Projít celou trasu s mobily (iPhone i Android) a vytištěnými QR.
- [ ] Smazat testovací hráče: `/admin` → dole **Nebezpečná zóna** → napsat
      `SMAZAT` → **Smazat všechna data**. Server si předtím sám uloží zálohu
      do `/home/data/zalohy/`.

## 6) V den akce

- `/admin` na notebooku organizátora: kdo hraje, kde lidé odpadají.
- `/cil` na monitoru v cíli – obnovuje se sama.
- Hráč, kterému nejde QR: opíše 6znakový kód pod QR. Zavřený prohlížeč:
  hru obnoví svým kódem `DOD-XXXX`.
- Průběžně stahovat **Excel (CSV)** z `/admin` jako zálohu.
- Ceny: celkově nejlepší + nejlepší v každé oblasti (vidět na `/cil`).

## 7) Po akci

- Stáhnout finální export z `/admin`.
- V Azure se platí za **plán**, ne za běžící aplikaci – pouhé zastavení (Stop)
  placení **neukončí**. Plán přepnout na **Free F1** (Scale up), nebo smazat
  celou skupinu prostředků `DOD-2026`.
- Na další ročník: nový `QR_SECRET` = nové QR kódy, prázdná databáze.

## Bezpečnost a soukromí

- Žádné osobní údaje: jen anonymní kód a nepovinná přezdívka.
- Hesla nejsou v kódu (repozitář je veřejný), nastavují se jen na serveru.

## Struktura projektu

```
server/server.js     server a API, hlídá pořadí stanovišť
server/game.js       pravidla: výpočet bodů (replay), trasa, skóre, QR kódy
server/questions.js  obsah: příběhy, otázky, body, Kč
server/db.js         databáze SQLite (ukládá jen volby hráčů)
web/                 frontend (Next.js): app/ stránky /, /cil, /admin; components/ části UI
web/lib/             volání API (api.ts) a typy odpovědí serveru (types.ts)
web/out/             sestavený frontend (vznikne po `npm run build`, není v gitu)
public/              původní verze stránek (záloha, když web/out chybí)
data/                databáze (jen lokálně, není v gitu)
navrh/               mockupy a podklady na schůzky
dokumenty/           projektové řízení (zadání, plánování, charta, otázky od týmu)
```

API (pro vývojáře): `GET /api/config`, `POST /api/register`, `GET /api/me/:code`,
`POST /api/unlock`, `POST /api/answer`, `POST /api/feedback`, `GET /api/leaderboard`,
`GET /api/health`, `GET /api/admin/leaderboard|qr|export.csv?token=…`,
`POST /api/admin/reset` (`{confirm: "SMAZAT"}`, záloha se uloží předem).
