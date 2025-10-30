# AK Medlánky – Klubová soutěž (React)

Jednoduchá React aplikace, která načte `pilots_info.json` ze své `PUBLIC_URL` a vykreslí tabulku.
Používá Create React App (react-scripts).

## Použití
1. Ujisti se, že máš nainstalovaný Node.js (>=18).
2. Rozbal projekt, přejdi do složky a spusť:
   ```bash
   npm install
   npm start
   ```
3. Nahraď `public/pilots_info.json` svým skutečným souborem (nebo jej tam zkopíruj build skriptem z Pythonu).
4. Pro produkční build:
   ```bash
   npm run build
   ```

Aplikace načítá data z `${process.env.PUBLIC_URL}/pilots_info.json`.
Při nasazení pod podcestou (např. GitHub Pages) nastav `homepage` v `package.json`
nebo proměnnou prostředí `PUBLIC_URL` během buildu.
