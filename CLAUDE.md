# CLAUDE.md

Ministrantský kvíz – kvízová hra pro dva týmy (Červení / Modří) na trojúhelníku z 28 šestiúhelníků.
Hraje se na projektoru, moderátor má na mobilu stránku správce s odpověďmi. Uživatelské rozhraní,
texty, komentáře v kódu i README jsou česky.

## Příkazy

- `npm run dev` – vývojový server (http://localhost:5173, živé obnovování)
- `npm test` – testy logiky (`node --test`, soubor `test/game.test.js`)
- `npm run dist` – testy + produkční build do `dist/` + výpis souborů (tímhle se připravuje nasazení)
- `npm run preview` – náhled buildu

## Architektura

Čistě statický web (React 18 + Vite, `base: './'` → funguje i v podsložce domény). Žádný server,
databáze ani přihlašování – stav hry žije jen v jedné kartě prohlížeče.

- `src/game.js` – veškerá logika bez Reactu: pole (`buildBoard`, `neighbors`, `cellId`), výhra
  (`findWinner` = souvislá skupina dotýkající se všech tří stran), výběr otázky, CSV parser,
  `loadQuestions()`. Novou logiku dávej sem a testuj v `test/game.test.js`.
- `src/App.jsx` – hra (UI): geometrie SVG pole, panel, dialogy (otázka, konec hry, pravidla).
- `src/Admin.jsx` – stránka správce; `src/main.jsx` ji zobrazí, když je hash přesně `#spravce`.
- `src/index.css` – všechny styly; barvy jsou CSS proměnné v `:root` (`--red`, `--blue`, `--gold`…),
  barvy polí se nastavují třídami (`.hex.red` …), ne v JS.
- `public/otazky.csv` – otázky; `public/ministrant.png` – logo a favicon.

## Otázky (`public/otazky.csv`) – důležité

- Formát `popis;odpověď;začáteční písmena`, UTF-8, **CRLF konce řádků** (soubor uživatel spravuje
  v LibreOffice/Excelu – zachovej kódování i konce řádků).
- **Číslo otázky = pořadí řádku.** Moderátor hledá odpověď podle čísla na stránce správce.
  Vložení / smazání / přeřazení řádku přečísluje všechny další otázky – upozorni na to uživatele,
  než to uděláš.
- Duplicita = stejný popis **i** odpověď. Stejný popis s jinou odpovědí je záměr (Chrám/Kostel,
  Rocheta/Superpelice – rozliší je písmena).
- Obsah otázek (texty, překlepy, věcná správnost) neměň bez souhlasu uživatele – navrhni a zeptej se.
- Test `public/otazky.csv: všech 137 otázek…` hlídá počet a první řádek – při změně souboru ho uprav.

## Hraní a pravidla (záměrné chování)

- Správně → pole týmu na tahu, hraje soupeř. Špatně → šedé pole, hraje soupeř.
  Soupeř správně → pole soupeře, **tým na tahu hraje znovu** (odsouhlaseno uživatelem).
- Obsazená pole nejdou změnit; šedé pole lze zkusit znovu s novou otázkou.
- Konec: propojení tří stran, nebo došlé otázky / plné pole → rozhoduje počet polí.
- „Zobrazit odpověď“ ve hře je záměrně zachované (hra jde i bez správce).
- Stránka správce ani CSV nejsou chráněné – bez serveru to nejde; uživatel o tom ví.

## Ověřování změn

- Logiku pokryj testem; UI ověř v prohlížeči (`npm run dist` + `npx vite preview`) – na šířku
  (projektor, pole se nesmí posouvat) i v úzké šířce ~390 px (mobil, bez vodorovného posunu).
- Písmo je Nunito (Google Fonts, má latin-ext). Nepoužívej písma bez české diakritiky.

## Git a nasazení

- `dist/` a `node_modules/` jsou v `.gitignore`; `dist/` se necommituje, vytváří se `npm run dist`
  a uživatel nahrává její obsah na hosting.
- Výchozí větev `main`. Commituj a pushuj jen na výslovný pokyn uživatele.
