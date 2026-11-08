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

const COLORS = { red: '#ff4444', blue: '#4444ff', gray: '#999999', empty: '#ffffff' };
const PLAYER_NAMES = { red: 'Červený', blue: 'Modrý' };
const other = (player) => (player === 'red' ? 'blue' : 'red');

// Geometrie: šestiúhelníky otočené špičkou nahoru, těsně vedle sebe.
const HEX_SIZE = 40; // poloměr (střed → vrchol)
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE; // šířka = vodorovný rozestup středů
const ROW_STEP = 1.5 * HEX_SIZE; // svislý rozestup řad
const PADDING = 10;
const VIEW_WIDTH = ROWS * HEX_WIDTH + 2 * PADDING;
const VIEW_HEIGHT = (ROWS - 1) * ROW_STEP + 2 * HEX_SIZE + 2 * PADDING;

const HEXAGONS = buildBoard(ROWS).map((cell) => ({
  ...cell,
  x: VIEW_WIDTH / 2 + (cell.col - cell.row / 2) * HEX_WIDTH,
  y: PADDING + HEX_SIZE + cell.row * ROW_STEP,
}));

const hexagonPath = (cx, cy, size) => {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return `M ${points.join(' L ')} Z`;
};

const HexagonGame = () => {
  const [hexagonColors, setHexagonColors] = useState(new Map());
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [currentHexagon, setCurrentHexagon] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);
  const [questions, setQuestions] = useState(null); // null = načítá se
  const [loadError, setLoadError] = useState(null);
  const [usedQuestions, setUsedQuestions] = useState(new Set());
  const [gameOver, setGameOver] = useState(null); // { reason, winner, path, counts }

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
    connected: 'spojil všechny tři strany pole',
    boardFull: 'pole je zaplněné',
    noQuestions: 'došly otázky',
  };

  return (
    <div className="page">
      <h1 className="title">Hexagon</h1>
      <div className="subtitle">Strategická hra</div>

      <div className="toolbar">
        <button className="tool-button" onClick={startNewGame}>
          ↻ Nová hra
        </button>
      </div>
      {loadError && (
        <div className="notice error" role="alert">
          {loadError}
        </div>
      )}
      {!questions && !loadError && <div className="notice">Načítám otázky…</div>}

      <div className="turn-indicator" style={{ backgroundColor: gameOver ? '#000000' : COLORS[currentPlayer] }}>
        {gameOver ? 'Konec hry' : `Na tahu: ${PLAYER_NAMES[currentPlayer]}`}
      </div>

      <div className="board-container">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="board"
          role="group"
          aria-label="Hrací pole"
        >
          <defs>
            <filter id="hexShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
            </filter>
          </defs>

          {HEXAGONS.map((hex, index) => {
            const hexColor = hexagonColors.get(hex.id);
            const playable = !!questions && !gameOver && hexColor !== 'red' && hexColor !== 'blue';
            const inWinningPath = winningPath.has(hex.id);

            return (
              <g
                key={hex.id}
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
                className={playable ? 'hex playable' : 'hex'}
                style={{ animationDelay: `${0.5 + index * 0.02}s` }}
              >
                <path
                  className="hex-path"
                  d={hexagonPath(hex.x, hex.y, HEX_SIZE)}
                  fill={COLORS[hexColor] ?? COLORS.empty}
                  stroke={inWinningPath ? '#ffd700' : '#000000'}
                  strokeWidth={inWinningPath ? 5 : 2}
                  filter="url(#hexShadow)"
                />
                <text
                  x={hex.x}
                  y={hex.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={hexColor ? '#ffffff' : '#000000'}
                  fontSize="16"
                  fontWeight="700"
                  fontFamily="'Orbitron', sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {hex.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {currentQuestion && (
        <div className="modal-overlay">
          <div className="modal-content" role="dialog" aria-modal="true">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span className={`current-player ${currentPlayer}`}>
                Hraje: {PLAYER_NAMES[currentPlayer]}
              </span>
            </div>

            <div className="question-number">Otázka č. {currentQuestion.number}</div>
            {currentQuestion.letters && (
              <div className="question-letters" aria-label="Začáteční písmena odpovědi">
                {currentQuestion.letters}
              </div>
            )}
            <div className="question-text">{currentQuestion.fullText}</div>

            <details className="answer-details">
              <summary>📖 Zobrazit odpověď</summary>
              <div className="answer-box">
                <strong>Odpověď:</strong>
                <br />
                {currentQuestion.answer}
              </div>
            </details>

            <div className="answer-buttons">
              <button className="answer-button correct" onClick={() => handleAnswer('correct')}>
                Správně
              </button>
              <button className="answer-button incorrect" onClick={() => handleAnswer('incorrect')}>
                Špatně
              </button>
              <button
                className="answer-button opponent"
                onClick={() => handleAnswer('opponentCorrect')}
              >
                Soupeř správně
              </button>
            </div>
          </div>
        </div>
      )}

      {gameOver && !gameOver.dismissed && (
        <div className="modal-overlay">
          <div className="modal-content" role="dialog" aria-modal="true">
            <div className="question-text">
              {gameOver.winner ? (
                <>
                  Vítězí{' '}
                  <span style={{ color: COLORS[gameOver.winner] }}>
                    {PLAYER_NAMES[gameOver.winner]}
                  </span>
                  !
                </>
              ) : (
                'Remíza!'
              )}
            </div>
            <div className="question-full">
              Konec hry – {gameOverReason[gameOver.reason]}.
              {gameOver.reason !== 'connected' && ' Rozhoduje počet obsazených polí.'}
            </div>
            <div className="final-score">
              <span style={{ color: COLORS.red }}>Červený: {gameOver.counts.red}</span>
              <span style={{ color: COLORS.blue }}>Modrý: {gameOver.counts.blue}</span>
            </div>
            <div className="answer-buttons">
              <button className="answer-button correct" onClick={startNewGame}>
                Nová hra
              </button>
              <button className="answer-button neutral" onClick={() => setGameOver({ ...gameOver, dismissed: true })}>
                Zobrazit pole
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="info-panel">
        <div className="info-label">Označené hexagony</div>
        <div className="info-value">
          {hexagonColors.size} / {HEXAGONS.length}
        </div>
        <div className="info-row">
          <div>
            <div className="info-label">Červené</div>
            <div className="info-value" style={{ color: COLORS.red }}>{counts.red}</div>
          </div>
          <div>
            <div className="info-label">Modré</div>
            <div className="info-value" style={{ color: COLORS.blue }}>{counts.blue}</div>
          </div>
          <div>
            <div className="info-label">Šedé</div>
            <div className="info-value" style={{ color: COLORS.gray }}>{counts.gray}</div>
          </div>
        </div>
        <div className="info-row">
          <div>
            <div className="info-label">Zbývá otázek</div>
            <div className="info-value">{remainingQuestions}</div>
          </div>
        </div>
      </div>

      <div className="rules">
        <strong>Pravidla:</strong>
        <br />
        • <strong>Vyhrává</strong>, kdo jako první propojí svými poli všechny tři strany
        trojúhelníku
        <br />• <strong>Správně</strong> = pole v barvě hráče, tah přechází na soupeře
        <br />• <strong>Špatně</strong> = šedé pole, tah přechází na soupeře
        <br />• <strong>Soupeř správně</strong> = pole v barvě soupeře, hráč hraje znovu
        <br />• Na <strong>šedé pole</strong> lze kliknout znovu a získat novou otázku
        <br />• Otázky se <strong>neopakují</strong> – když dojdou, rozhoduje počet polí

      </div>
    </div>
  );
};

export default HexagonGame;
