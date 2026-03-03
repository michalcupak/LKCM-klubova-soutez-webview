# AK Medlánky – Klubová soutěž (React)

Jednoduchá React aplikace, která dle `PUBLIC_URL/year_map.json` načte seznam ročníků a poté načítá zvolený ročník z `PUBLIC_URL/soutez_vysledky/soutez_vysledky_{rok}.json` a vykreslí tabulky výsledků.
Používá Create React App (react-scripts).

## Nápověda aplikace
App loads year_map.json and per-year results from PUBLIC_URL and renders the table.
Extras:
- URL params:
   - scale / zoom: font scaling (default 1.0). e.g. ?scale=1.25 or ?zoom=1.5
   - tv: 1/true/yes/on to enable "TV mode" (no scroll, columns)
   - cols: optional 1..3 manual column count override for TV mode
   - rok: optional year override
   - soutez: optional klubova/typova/vekova


## Nasazení
1. Ujisti se, že máš nainstalovaný Node.js (>=18).
2. Rozbal projekt, přejdi do složky a spusť:
   ```bash
   npm install
   npm start
   ```
3. Nahraď `public/year_map.json` a `public/soutez_vysledky/soutez_vysledky_{rok}.json` svými skutečnými soubory (nebo je tam zkopíruj build skriptem z Pythonu).
4. Pro produkční build:
   ```bash
   npm run build
   ```

Aplikace načítá data z `${process.env.PUBLIC_URL}/year_map.json` a `${process.env.PUBLIC_URL}/soutez_vyslekdy/soutez_vysledky_{rok}.json`.
Při nasazení pod podcestou (např. GitHub Pages) nastav `homepage` v `package.json`
nebo proměnnou prostředí `PUBLIC_URL` během buildu.

## Todo
- zobrazit přímo v aplikaci nápovědu s ovládáním pomocí URL parametrů