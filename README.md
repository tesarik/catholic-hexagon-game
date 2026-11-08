# Hexagon Game

Strategická hra s hexagonálním herním polem a otázkami.

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

- Červený a modrý hráč se střídají
- **Vyhrává**, kdo jako první propojí svými poli všechny tři strany trojúhelníku
- Obsazená (červená/modrá) pole už nejde změnit
- Po kliknutí na hexagon se zobrazí otázka
- **Správně** = pole v barvě hráče, tah přechází na soupeře
- **Špatně** = šedé pole, tah přechází na soupeře  
- **Soupeř správně** = pole v barvě soupeře, hráč hraje znovu
- Na šedé pole lze kliknout znovu a získat novou otázku
- Otázky se neopakují; když dojdou (nebo se zaplní pole), rozhoduje počet obsazených polí
- Tlačítko „Nová hra“ hru kdykoli restartuje

## Import otázek

Použijte tlačítko "📁 Nahrát otázky" pro import vlastních otázek. Nahráním souboru začne nová hra.
Otázky bez otázky nebo odpovědi a duplicity se přeskočí; `displayText` je nepovinný (jinak se použije `fullText`).

### Podporované formáty:

#### JSON formát
```json
[
  {
    "fullText": "Plné znění otázky s detaily?",
    "answer": "Správná odpověď na otázku.",
    "displayText": "Krátký text otázky?"
  }
]
```

#### CSV formát
Oddělovač středník (;), kódování UTF-8. První řádek může být hlavička (`fullText;answer;displayText`).
Pole obsahující středník dejte do uvozovek.
```
Plné znění otázky?;Správná odpověď;Krátký text?
Další otázka?;"Odpověď; se středníkem";Krátce?
```

Ukázkové soubory: `questions-example.json` a `questions-example.csv`

## Struktura projektu

```
catholic-hexagon-game/
├── index.html          # Vstupní HTML (Vite)
├── src/
│   ├── main.jsx        # Entry point
│   ├── App.jsx         # Komponenta hry (UI)
│   ├── game.js         # Herní logika: pole, výhra, import otázek
│   └── index.css       # Styly
├── test/
│   └── game.test.js    # Testy herní logiky (node --test)
├── vite.config.js
├── package.json
├── questions-example.json
└── questions-example.csv
```

## Technologie

- React 18 + Vite
- FileReader API pro import otázek
