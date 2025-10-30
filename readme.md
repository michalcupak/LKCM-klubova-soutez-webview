# AK Medlánky – Klubová soutěž (React)

Jednoduchá React aplikace, která načte `soutez_vysledky.json` ze své `PUBLIC_URL` a vykreslí tabulku.
Používá Create React App (react-scripts).

## Použití
1. Ujisti se, že máš nainstalovaný Node.js (>=18).
2. Rozbal projekt, přejdi do složky a spusť:
   ```bash
   npm install
   npm start
   ```
3. Nahraď `public/soutez_vysledky.json` svým skutečným souborem (nebo jej tam zkopíruj build skriptem z Pythonu).
4. Pro produkční build:
   ```bash
   npm run build
   ```

Aplikace načítá data z `${process.env.PUBLIC_URL}/soutez_vysledky.json`.
Při nasazení pod podcestou (např. GitHub Pages) nastav `homepage` v `package.json`
nebo proměnnou prostředí `PUBLIC_URL` během buildu.
