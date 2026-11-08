# Hexagon Game

Strategická hra s hexagonálním herním polem a otázkami.

## Instalace a spuštění

1. Nainstalujte závislosti:
```bash
npm install
```

2. Spusťte aplikaci:
```bash
npm start
```

Hra se otevře v prohlížeči na adrese `http://localhost:3000`

## Pravidla hry

- Červený a modrý hráč se střídají
- Po kliknutí na hexagon se zobrazí otázka
- **Správně** = pole v barvě hráče, tah přechází na soupeře
- **Špatně** = šedé pole, tah přechází na soupeře  
- **Soupeř správně** = pole v barvě soupeře, hráč hraje znovu

## Import otázek

Použijte tlačítko "📁 Nahrát otázky" pro import vlastních otázek.

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
Oddělovač středník (;)
```
Plné znění otázky?;Správná odpověď;Krátký text?
```

Ukázkové soubory: `questions-example.json` a `questions-example.csv`

## Struktura projektu

```
catholic-hexagon-game/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Hlavní komponenta
│   ├── App.jsx         # Herní logika
│   ├── index.js        # Entry point
│   └── index.css       # Základní styly
├── package.json
├── questions-example.json
└── questions-example.csv
```

## Technologie

- React 18
- CSS-in-JS pro styling
- FileReader API pro import otázek
