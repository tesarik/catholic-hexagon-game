# Ministrantský kvíz

Kvízová hra pro dva týmy (Červení a Modří) na trojúhelníkovém poli z šestiúhelníků.
Rozložení je určené pro projektor nebo velkou obrazovku: pole přes celou výšku, vpravo panel
se skóre a ovládáním (Nová hra, Celá obrazovka, Pravidla). Na mobilu se panel přesune nad pole.

## Instalace a spuštění

1. Nainstalujte závislosti:
```bash
npm install
```

2. Spusťte aplikaci:
```bash
npm run dev
```

Hra se otevře v prohlížeči na adrese `http://localhost:5173`.

Další příkazy:
- `npm run build` – produkční build do složky `dist/` (statické soubory, lze nahrát kamkoli)
- `npm run preview` – náhled produkčního buildu
- `npm test` – testy herní logiky

## Pravidla hry

- Týmy Červení a Modří se střídají
- **Vyhrává**, kdo jako první propojí svými poli všechny tři strany trojúhelníku
- Obsazená (červená/modrá) pole už nejde změnit
- Po kliknutí na hexagon se zobrazí otázka
- **Správně** = pole v barvě hráče, tah přechází na soupeře
- **Špatně** = šedé pole, tah přechází na soupeře  
- **Soupeř správně** = pole v barvě soupeře, hráč hraje znovu
- Na šedé pole lze kliknout znovu a získat novou otázku
- Otázky se neopakují; když dojdou (nebo se zaplní pole), rozhoduje počet obsazených polí
- Tlačítko „Nová hra“ hru kdykoli restartuje

## Otázky

Otázky jsou v souboru `public/otazky.csv`, který se nasazuje spolu s hrou
(137 ministrantských pojmů). Pro změnu otázek stačí upravit tento soubor
(např. v LibreOffice/Excelu, uložit jako CSV v UTF-8 se středníkem) a hru znovu nasadit (`npm run build`).

Formát – jeden řádek = jedna otázka, sloupce oddělené středníkem:

```
popis;odpověď;začáteční písmena
stůl v presbytáři, na kterém jsou připraveny věci ke mši svaté;Abak;A
delší modlitba v misálu, jejíž součástí je proměňování;Eucharistická modlitba;EM
```

- Ve hře se ukáže **popis** a **začáteční písmena** jako nápověda, **odpověď** jde rozbalit.
- **Číslo otázky = pořadí řádku v souboru** (od 1). Hra ho ukazuje u každé otázky („Otázka č. 7“).
- Text se středníkem dejte do uvozovek. První řádek může být hlavička (`popis;odpověď;písmena`).
- Řádky bez popisu nebo odpovědi a úplné duplicity se přeskočí. Stejný popis s jinou odpovědí
  (např. Chrám / Kostel) je v pořádku – rozliší je písmena.

## Stránka pro správce hry

Na adrese `…/#spravce` (např. `https://example.com/hexagon/#spravce`) je očíslovaný
seznam všech otázek a odpovědí s vyhledáváním podle čísla nebo textu. Správce si ji může
otevřít na mobilu a podle čísla zobrazeného ve hře rychle najít správnou odpověď.

> ⚠️ Stránka ani soubor s otázkami nejsou chráněné heslem – kdo zná adresu, může si odpovědi zobrazit.

## Struktura projektu

```
catholic-hexagon-game/
├── index.html          # Vstupní HTML (Vite)
├── public/
│   ├── otazky.csv      # Otázky a odpovědi
│   └── ministrant.png  # Logo (kresba z letáku ministrantské schůzky)
├── src/
│   ├── main.jsx        # Entry point
│   ├── App.jsx         # Komponenta hry (UI)
│   ├── Admin.jsx       # Stránka pro správce (#spravce)
│   ├── game.js         # Herní logika: pole, výhra, načtení otázek
│   └── index.css       # Styly (barvy jsou proměnné v :root nahoře)
├── test/
│   └── game.test.js    # Testy herní logiky (node --test)
├── vite.config.js
└── package.json
```

## Technologie

- React 18 + Vite
