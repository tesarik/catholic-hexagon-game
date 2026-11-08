import React, { useEffect, useState } from 'react';
import {
  ROWS,
  buildBoard,
  findWinner,
  isBoardFull,
  countColors,
  pickQuestionIndex,
  loadQuestions,
} from './game.js';

const TEAM_NAMES = { red: 'Červení', blue: 'Modří' };
const other = (player) => (player === 'red' ? 'blue' : 'red');

// --- Geometrie hracího pole ----------------------------------------------
// Šestiúhelníky otočené špičkou nahoru, těsně vedle sebe; středy tvoří
// rovnostranný trojúhelník.
const HEX_SIZE = 40; // poloměr (střed → vrchol)
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE; // vodorovný rozestup středů
const ROW_STEP = 1.5 * HEX_SIZE; // svislý rozestup řad
const SIDE_OFFSET = HEX_SIZE + 12; // jak daleko od středů krajních polí vede čára strany
const SIDE_GAP = 0.14; // podíl délky strany vynechaný u každého rohu
const MARGIN = 12;

const rawHexagons = buildBoard(ROWS).map((cell) => ({
  ...cell,
  x: (cell.col - cell.row / 2) * HEX_WIDTH,
  y: cell.row * ROW_STEP,
}));

// Tři strany trojúhelníku: zvětšený trojúhelník středů krajních polí,
// každá strana zkrácená u rohů, aby byly vidět jako tři samostatné čáry.
const corners = (() => {
  const top = { x: 0, y: 0 };
  const left = { x: (-(ROWS - 1) / 2) * HEX_WIDTH, y: (ROWS - 1) * ROW_STEP };
  const right = { x: ((ROWS - 1) / 2) * HEX_WIDTH, y: (ROWS - 1) * ROW_STEP };
  const c = { x: 0, y: (2 / 3) * (ROWS - 1) * ROW_STEP }; // těžiště
  const inradius = ((ROWS - 1) * HEX_WIDTH) / (2 * Math.sqrt(3));
  const k = (inradius + SIDE_OFFSET) / inradius;
  const grow = (p) => ({ x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k });
  return { top: grow(top), left: grow(left), right: grow(right) };
})();

const sideSegment = (a, b) => ({
  x1: a.x + (b.x - a.x) * SIDE_GAP,
  y1: a.y + (b.y - a.y) * SIDE_GAP,
  x2: b.x + (a.x - b.x) * SIDE_GAP,
  y2: b.y + (a.y - b.y) * SIDE_GAP,
});

const rawSides = [
  { key: 'left', ...sideSegment(corners.top, corners.left) },
  { key: 'right', ...sideSegment(corners.top, corners.right) },
  { key: 'bottom', ...sideSegment(corners.left, corners.right) },
];

// Rozměry viewBoxu podle všech polí a čar stran
const bounds = (() => {
  const xs = [];
  const ys = [];
  rawHexagons.forEach(({ x, y }) => {
    xs.push(x - HEX_WIDTH / 2, x + HEX_WIDTH / 2);
    ys.push(y - HEX_SIZE, y + HEX_SIZE);
  });
  rawSides.forEach(({ x1, y1, x2, y2 }) => {
    xs.push(x1, x2);
    ys.push(y1, y2);
  });
  return {
    minX: Math.min(...xs) - MARGIN,
    minY: Math.min(...ys) - MARGIN,
    width: Math.max(...xs) - Math.min(...xs) + 2 * MARGIN,
    height: Math.max(...ys) - Math.min(...ys) + 2 * MARGIN,
  };
})();

const VIEW_BOX = `${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`;

const hexagonPath = (cx, cy, size) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return `M ${points.join(' L ')} Z`;
};

// --- Celá obrazovka --------------------------------------------------------

const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled;

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && !!document.fullscreenElement
  );
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  return [isFullscreen, toggle];
}

// --- Hra -----------------------------------------------------------------

const HexagonGame = () => {
  const [hexagonColors, setHexagonColors] = useState(new Map());
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [currentHexagon, setCurrentHexagon] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [questions, setQuestions] = useState(null); // null = načítá se
  const [loadError, setLoadError] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState(new Set());
  const [gameOver, setGameOver] = useState(null); // { reason, winner, path, counts, dismissed }
  const [showRules, setShowRules] = useState(false);
  const [isFullscreen, toggleFullscreen] = useFullscreen();

  useEffect(() => {
    loadQuestions()
      .then(({ questions: loaded }) => setQuestions(loaded))
      .catch((error) => setLoadError(error.message));
  }, []);

  const questionPool = questions ?? [];
  const counts = countColors(hexagonColors);
  const remainingQuestions = questionPool.length - usedQuestions.size;
  const winningPath = new Set(gameOver?.path ?? []);
  const currentQuestion =
    currentQuestionIndex === null ? null : questionPool[currentQuestionIndex];

  const startNewGame = () => {
    setHexagonColors(new Map());
    setCurrentPlayer('red');
    setCurrentHexagon(null);
    setCurrentQuestionIndex(null);
    setUsedQuestions(new Set());
    setGameOver(null);
  };

  const handleHexagonClick = (hexId) => {
    if (!questions || gameOver || currentHexagon !== null) return;

    // Obsazená pole (červená/modrá) jsou definitivní
    const hexColor = hexagonColors.get(hexId);
    if (hexColor === 'red' || hexColor === 'blue') return;

    const index = pickQuestionIndex(questionPool.length, usedQuestions);
    if (index === null) return; // nemělo by nastat – hra končí hned po poslední otázce

    setUsedQuestions((prev) => new Set(prev).add(index));
    setCurrentHexagon(hexId);
    setCurrentQuestionIndex(index);
  };

  const handleAnswer = (answerType) => {
    const newColor =
      answerType === 'correct' ? currentPlayer
      : answerType === 'incorrect' ? 'gray'
      : other(currentPlayer); // opponentCorrect

    const newColors = new Map(hexagonColors);
    newColors.set(currentHexagon, newColor);
    setHexagonColors(newColors);

    // Správně / Špatně → tah přechází; Soupeř správně → hráč hraje znovu
    if (answerType !== 'opponentCorrect') setCurrentPlayer(other(currentPlayer));
    setCurrentHexagon(null);
    setCurrentQuestionIndex(null);

    const newCounts = countColors(newColors);
    const byCount =
      newCounts.red === newCounts.blue ? null : newCounts.red > newCounts.blue ? 'red' : 'blue';

    const win = findWinner(newColors, ROWS);
    if (win) {
      setGameOver({ reason: 'connected', winner: win.winner, path: win.path, counts: newCounts });
    } else if (isBoardFull(newColors, ROWS)) {
      setGameOver({ reason: 'boardFull', winner: byCount, counts: newCounts });
    } else if (usedQuestions.size >= questionPool.length) {
      setGameOver({ reason: 'noQuestions', winner: byCount, counts: newCounts });
    }
  };

  const gameOverReason = {
    connected: 'Propojili všechny tři strany trojúhelníku.',
    boardFull: 'Pole je zaplněné – rozhoduje počet obsazených polí.',
    noQuestions: 'Došly otázky – rozhoduje počet obsazených polí.',
  };

  return (
    <div className="app">
      <aside className="side-panel">
        <header className="brand">
          <img src="./ministrant.png" alt="" className="brand-logo" />
          <div>
            <h1 className="brand-title">Ministrantský kvíz</h1>
            <p className="brand-subtitle">Propojte všechny tři strany</p>
          </div>
        </header>

        <div className={`turn-card ${gameOver ? 'over' : currentPlayer}`} aria-live="polite">
          <div className="turn-label">{gameOver ? 'Konec hry' : 'Na tahu'}</div>
          <div className="turn-team">
            {gameOver
              ? gameOver.winner
                ? `Vítězí ${TEAM_NAMES[gameOver.winner]}`
                : 'Remíza'
              : TEAM_NAMES[currentPlayer]}
          </div>
        </div>

        <div className="scoreboard" aria-label="Skóre">
          <div className="score red">
            <span className="score-count">{counts.red}</span>
            <span className="score-name">{TEAM_NAMES.red}</span>
          </div>
          <span className="score-sep">:</span>
          <div className="score blue">
            <span className="score-count">{counts.blue}</span>
            <span className="score-name">{TEAM_NAMES.blue}</span>
          </div>
        </div>

        <div className="status-line">
          {loadError ? (
            <span className="status-error" role="alert">{loadError}</span>
          ) : questions ? (
            <>
              Zbývá <strong>{remainingQuestions}</strong> otázek
              {counts.gray > 0 && <> · šedých polí: {counts.gray}</>}
            </>
          ) : (
            'Načítám otázky…'
          )}
        </div>

        <nav className="controls">
          <button className="btn" onClick={startNewGame}>
            <span aria-hidden="true">↻</span> Nová hra
          </button>
          {canFullscreen && (
            <button className="btn" onClick={toggleFullscreen}>
              <span aria-hidden="true">{isFullscreen ? '⤡' : '⤢'}</span>{' '}
              {isFullscreen ? 'Ukončit celou obrazovku' : 'Celá obrazovka'}
            </button>
          )}
          <button className="btn" onClick={() => setShowRules(true)}>
            <span aria-hidden="true">?</span> Pravidla
          </button>
        </nav>
      </aside>

      <main className="board-area">
        <svg viewBox={VIEW_BOX} className="board" role="group" aria-label="Hrací pole">
          {rawSides.map(({ key, x1, y1, x2, y2 }) => (
            <line key={key} className="board-side" x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}

          {rawHexagons.map((hex, index) => {
            const hexColor = hexagonColors.get(hex.id);
            const playable =
              !!questions && !gameOver && hexColor !== 'red' && hexColor !== 'blue';
            const classes = [
              'hex',
              hexColor ?? 'empty',
              playable && 'playable',
              winningPath.has(hex.id) && 'win',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <g
                key={hex.id}
                className={classes}
                onClick={() => handleHexagonClick(hex.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleHexagonClick(hex.id);
                  }
                }}
                role="button"
                tabIndex={playable ? 0 : -1}
                aria-label={`Pole ${hex.id}`}
                style={{ animationDelay: `${index * 0.015}s` }}
              >
                <path className="hex-path" d={hexagonPath(hex.x, hex.y, HEX_SIZE - 1)} />
                <text className="hex-label" x={hex.x} y={hex.y}>
                  {hex.id}
                </text>
              </g>
            );
          })}
        </svg>
      </main>

      {currentQuestion && (
        <div className="modal-overlay">
          <div className="modal question-modal" role="dialog" aria-modal="true">
            <div className="modal-meta">
              <span>Otázka č. {currentQuestion.number}</span>
              <span className={`team-chip ${currentPlayer}`}>
                Hrají {TEAM_NAMES[currentPlayer]}
              </span>
            </div>

            {currentQuestion.letters && (
              <div className="question-letters" aria-label="Začáteční písmena odpovědi">
                {currentQuestion.letters}
              </div>
            )}
            <p className="question-text">{currentQuestion.fullText}</p>

            <details className="answer-details">
              <summary>Zobrazit odpověď</summary>
              <div className="answer-box">{currentQuestion.answer}</div>
            </details>

            <div className="answer-buttons">
              <button className="answer-button" onClick={() => handleAnswer('correct')}>
                <span className="answer-icon" aria-hidden="true">✓</span> Správně
              </button>
              <button className="answer-button" onClick={() => handleAnswer('incorrect')}>
                <span className="answer-icon" aria-hidden="true">✗</span> Špatně
              </button>
              <button className="answer-button" onClick={() => handleAnswer('opponentCorrect')}>
                <span className="answer-icon" aria-hidden="true">⇄</span> Soupeř správně
              </button>
            </div>
          </div>
        </div>
      )}

      {gameOver && !gameOver.dismissed && (
        <div className="modal-overlay">
          <div className="modal result-modal" role="dialog" aria-modal="true">
            <h2 className="result-title">
              {gameOver.winner ? (
                <>
                  Vítězí <span className={`team-text ${gameOver.winner}`}>{TEAM_NAMES[gameOver.winner]}</span>!
                </>
              ) : (
                'Remíza!'
              )}
            </h2>
            <p className="result-reason">{gameOverReason[gameOver.reason]}</p>
            <div className="scoreboard large">
              <div className="score red">
                <span className="score-count">{gameOver.counts.red}</span>
                <span className="score-name">{TEAM_NAMES.red}</span>
              </div>
              <span className="score-sep">:</span>
              <div className="score blue">
                <span className="score-count">{gameOver.counts.blue}</span>
                <span className="score-name">{TEAM_NAMES.blue}</span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn primary" onClick={startNewGame}>
                Nová hra
              </button>
              <button className="btn" onClick={() => setGameOver({ ...gameOver, dismissed: true })}>
                Zobrazit pole
              </button>
            </div>
          </div>
        </div>
      )}

      {showRules && (
        <div className="modal-overlay" onClick={() => setShowRules(false)}>
          <div
            className="modal rules-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rules-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="rules-title">Pravidla</h2>
            <ul>
              <li>
                Týmy se střídají a vybírají pole. Vyhrává tým, který jako první propojí svými
                poli <strong>všechny tři strany</strong> trojúhelníku.
              </li>
              <li><strong>Správně</strong> – pole získá tým na tahu, hraje soupeř.</li>
              <li><strong>Špatně</strong> – pole zešedne, hraje soupeř.</li>
              <li>
                <strong>Soupeř správně</strong> – pole získá soupeř, tým na tahu hraje znovu.
              </li>
              <li>Na šedé pole lze kliknout znovu a dostat novou otázku.</li>
              <li>
                Otázky se neopakují. Když dojdou, rozhoduje počet obsazených polí.
              </li>
            </ul>
            <div className="modal-actions">
              <button className="btn primary" onClick={() => setShowRules(false)}>
                Rozumím
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HexagonGame;
