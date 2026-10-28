# Nový frontend (Next.js) – roadmapa a deník postupu

Zdroj zadání: `FRONTEND-HANDOFF.md` (Figma board `8:518` – „Směr A × VŠCHT – Laboratoř v oranžové“).
Logika serveru (`server/*.js`) zůstala beze změny – nový frontend je jen klient nad stávajícím API.

## Rozhodnutí

- **Nasazení: varianta A** – Next.js se staticky exportuje (`output: 'export'`) do `web/out`
  a Express ho servíruje místo `public/`. Na Azure dál běží jeden proces, SQLite jedna instance.
  Jediná změna v `server/server.js`: odkud se berou stránky (+ `redirect: false` u statických souborů).
- **Styly:** CSS proměnné (tokeny) v `web/app/globals.css` + CSS Modules u komponent. Bez Tailwindu.
- **Písma:** Archivo + IBM Plex Mono přes `next/font/google`.
- **Barvy metrik** se berou z `/api/config`, ne natvrdo z CSS.
- **Nic se nepočítá v prohlížeči.** Pruhy u metrik jsou jen zobrazení: v HUD rostou od nuly do stran
  (body můžou být záporné), v cíli ukazují pořadí v kategorii (to posílá server).
- Veřejné API nevrací průměr, podíl Erasmu ani rozložení profilů, proto `/cil` místo nich ukazuje
  počet hráčů, počet v cíli, nejlepší skóre a „Nejlepší v kategorii“ (podle toho se dávají ceny).

## Kroky

- [x] Next.js ve `web/`, tokeny, písma, dev proxy na Express (`npm run dev:web`)
- [x] Typy odpovědí API (`web/lib/types.ts`) a klient (`web/lib/api.ts`)
- [x] Základní komponenty: `Button`, `TopBar`, `ElementTile`, `Chip`, `CodeCard`, `Alert`
- [x] Úvod + registrace, kód v `localStorage` (stejný klíč `dodCode` jako dřív), obnova kódem
- [x] Sken QR (kamera: BarcodeDetector / jsQR), ruční kód, `?qr=` v URL, mapa trasy
- [x] Stanoviště s úkolem (druhý QR od obsluhy)
- [x] Stanoviště a volba: `StationProgress`, `MetricHud`, `OptionCard` (běžná / vybraná / zamčená)
- [x] Výsledek volby: `DeltaGrid`, zůstatek, další stanoviště
- [x] Cíl: `ScoreRing`, `MetricBreakdown`, profil, hodnocení hry (`/api/feedback` – dřív chybělo)
- [x] `/cil` – žebříček pro projektor, obnova každých 15 s, QR na hru
- [x] `/admin` – přihlášení, přehled, trychtýř, tabulka, CSV, smazání dat, QR k tisku (A4)
- [x] Build v GitHub Actions (`npm run build`), Express servíruje `web/out`
- [ ] Projít na mobilu venku přes HTTPS (iPhone i Android, kamera, kontrast)
- [ ] Ve Figmě doplnit chybějící stavy (chyba QR, offline, admin) a případně sladit s kódem

## Deník

- **2026-10-28** – přečtený handoff a API v `server/server.js` + `server/game.js`. Založená větev
  `feature/next-setup` a tahle roadmapa.
- **2026-10-28** – celý frontend (hra, `/cil`, `/admin`) hotový podle Figmy. Otestováno lokálně
  v prohlížeči: celá trasa 10 stanovišť, odkaz z QR v novém prohlížeči, špatné stanoviště,
  neplatný kód, tisk QR (10 stanovišť = 10 stran A4).
