import React, { useState } from 'react';
import { Hexagon } from 'lucide-react';

const HexagonGame = () => {
  // Definice hexagonální mřížky - trojúhelník bez mezer
  // Rozměry šestiúhelníku
  const hexSize = 40;
  const hexWidth = hexSize * 2;
  const hexHeight = Math.sqrt(3) * hexSize;
  const horizontalSpacing = hexWidth * 0.75; // 75% šířky pro těsné uložení
  
  // Generování trojúhelníkového pole
  const rows = [1, 2, 3, 4, 5, 6, 7]; // Počet hexagonů v každé řadě
  const hexagons = [];
  let idCounter = 1;
  
  rows.forEach((hexCount, rowIndex) => {
    for (let col = 0; col < hexCount; col++) {
      const x = 250 + (col - (hexCount - 1) / 2) * horizontalSpacing;
      const y = 80 + rowIndex * hexHeight;
      
      hexagons.push({
        id: idCounter++,
        row: rowIndex,
        col: col,
        x: x,
        y: y
      });
    }
  });

  const [hexagonColors, setHexagonColors] = useState(new Map());
  const [selectedColor, setSelectedColor] = useState('red');
  const [showQuestion, setShowQuestion] = useState(false);
  const [currentHexagon, setCurrentHexagon] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState(new Set());

  // Výchozí ukázkové otázky
  const defaultQuestions = [
    {
      fullText: "Je Země kulatá?",
      answer: "Ano, Země má přibližně kulovitý tvar.",
      displayText: "Je Země kulatá?"
    },
    {
      fullText: "Je voda mokrá?",
      answer: "Ano, voda je mokrá.",
      displayText: "Je voda mokrá?"
    },
    {
      fullText: "Má trojúhelník čtyři strany?",
      answer: "Ne, trojúhelník má tři strany.",
      displayText: "Má trojúhelník čtyři strany?"
    },
  ];

  // Načtení souboru s otázkami
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        // Podpora pro JSON nebo CSV formát
        if (file.name.endsWith('.json')) {
          const loadedQuestions = JSON.parse(content);
          setQuestions(loadedQuestions);
          setUsedQuestions(new Set());
        } else if (file.name.endsWith('.csv')) {
          // CSV formát: fullText;answer;displayText
          const lines = content.split('\n').filter(line => line.trim());
          const loadedQuestions = lines.map(line => {
            const [fullText, answer, displayText] = line.split(';').map(s => s.trim());
            return { fullText, answer, displayText };
          });
          setQuestions(loadedQuestions);
          setUsedQuestions(new Set());
        }
      } catch (error) {
        alert('Chyba při načítání souboru. Zkontrolujte formát.');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const getRandomQuestion = () => {
    const questionPool = questions.length > 0 ? questions : defaultQuestions;
    
    // Pokud byly použity všechny otázky, konec hry
    if (usedQuestions.size >= questionPool.length) {
      return null;
    }
    
    // Najdi nepoužitou otázku
    let question;
    let attempts = 0;
    do {
      question = questionPool[Math.floor(Math.random() * questionPool.length)];
      attempts++;
    } while (usedQuestions.has(question.fullText) && attempts < 100);
    
    // Pokud jsme nenašli nepoužitou otázku, vraťme null
    if (usedQuestions.has(question.fullText)) {
      return null;
    }
    
    setUsedQuestions(prev => new Set([...prev, question.fullText]));
    return question;
  };

  const handleHexagonClick = (hexId) => {
    const hexColor = hexagonColors.get(hexId);
    
    // Pokud je pole barevné (červené nebo modré), odznač ho
    if (hexColor === 'red' || hexColor === 'blue') {
      setHexagonColors(prev => {
        const newMap = new Map(prev);
        newMap.delete(hexId);
        return newMap;
      });
      // Vrátíme otázku zpět do poolu
      return;
    }
    
    // Pokud je pole šedé, odstraň šedou barvu a zobraz novou otázku
    if (hexColor === 'gray') {
      setHexagonColors(prev => {
        const newMap = new Map(prev);
        newMap.delete(hexId);
        return newMap;
      });
    }

    // Zobraz otázku (pro bílé i předchozí šedé pole)
    setCurrentHexagon(hexId);
    const question = getRandomQuestion();
    
    // Pokud není otázka (došly), ukonči hru
    if (!question) {
      alert('Došly otázky! Hra končí.\n\nVýsledek:\nČervený: ' + 
        Array.from(hexagonColors.values()).filter(c => c === 'red').length + 
        '\nModrý: ' + 
        Array.from(hexagonColors.values()).filter(c => c === 'blue').length);
      return;
    }
    
    setCurrentQuestion(question);
    setShowQuestion(true);
  };

  const handleAnswer = (answerType) => {
    if (answerType === 'correct') {
      // Správná odpověď - obarvi zvolenou barvou a předej tah
      setHexagonColors(prev => {
        const newMap = new Map(prev);
        newMap.set(currentHexagon, selectedColor);
        return newMap;
      });
      // Přepni hráče
      setSelectedColor(selectedColor === 'red' ? 'blue' : 'red');
    } else if (answerType === 'incorrect') {
      // Špatná odpověď - obarvi šedě a předej tah
      setHexagonColors(prev => {
        const newMap = new Map(prev);
        newMap.set(currentHexagon, 'gray');
        return newMap;
      });
      // Přepni hráče
      setSelectedColor(selectedColor === 'red' ? 'blue' : 'red');
    } else if (answerType === 'opponentCorrect') {
      // Soupeř správně - obarvi druhou barvou, tah zůstává
      const opponentColor = selectedColor === 'red' ? 'blue' : 'red';
      setHexagonColors(prev => {
        const newMap = new Map(prev);
        newMap.set(currentHexagon, opponentColor);
        return newMap;
      });
      // Tah zůstává u stejného hráče
    }
    
    setShowQuestion(false);
    setCurrentHexagon(null);
  };

  // Funkce pro generování SVG path pro šestiúhelník
  const generateHexagonPath = (cx, cy, size) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = cx + size * Math.cos(angle);
      const y = cy + size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      fontFamily: '"Space Mono", "Courier New", monospace'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@500;700;900&display=swap');
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .hex-path {
          transition: fill 0.2s ease, stroke 0.2s ease;
          cursor: pointer;
        }
        
        .title {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 3.5rem;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 20px;
          animation: slideDown 0.8s ease-out;
        }
        
        .subtitle {
          color: #333333;
          font-size: 1rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-bottom: 40px;
          opacity: 0;
          animation: slideDown 0.8s ease-out 0.3s forwards;
        }
        
        .color-picker {
          display: flex;
          gap: 20px;
          margin-bottom: 40px;
          animation: slideDown 0.8s ease-out 0.4s backwards;
        }
        
        .color-button {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          border: 3px solid #000000;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .color-button:hover {
          transform: scale(1.05);
        }
        
        .color-button.selected {
          border-width: 4px;
          box-shadow: 0 0 0 3px #000000;
        }
        
        .color-button.red {
          background-color: #ff4444;
        }
        
        .color-button.blue {
          background-color: #4444ff;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
        }
        
        .modal-content {
          background: #ffffff;
          border: 3px solid #000000;
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: scaleIn 0.3s ease-out;
        }
        
        .question-text {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #000000;
          margin-bottom: 30px;
          text-align: center;
          line-height: 1.4;
        }
        
        .answer-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
        }
        
        .answer-button {
          padding: 15px 40px;
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          border: 3px solid #000000;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .answer-button.correct {
          background-color: #44ff44;
          color: #000000;
        }
        
        .answer-button.correct:hover {
          background-color: #33dd33;
          transform: scale(1.05);
        }
        
        .answer-button.incorrect {
          background-color: #ff4444;
          color: #ffffff;
        }
        
        .answer-button.incorrect:hover {
          background-color: #dd3333;
          transform: scale(1.05);
        }
        
        .answer-button.opponent {
          background-color: #ffaa44;
          color: #000000;
        }
        
        .answer-button.opponent:hover {
          background-color: #ee9933;
          transform: scale(1.05);
        }
        
        .current-player {
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 20px;
          padding: 10px 20px;
          border-radius: 8px;
          display: inline-block;
        }
        
        .current-player.red {
          background-color: #ff4444;
          color: #ffffff;
        }
        
        .current-player.blue {
          background-color: #4444ff;
          color: #ffffff;
        }
        
        .info-panel {
          background: #f5f5f5;
          border: 2px solid #000000;
          border-radius: 16px;
          padding: 24px 32px;
          margin-top: 40px;
          min-width: 300px;
          text-align: center;
          animation: slideDown 0.8s ease-out 0.6s backwards;
        }
        
        .info-label {
          color: #333333;
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        
        .info-value {
          color: #000000;
          font-size: 1.5rem;
          font-weight: 700;
          font-family: 'Orbitron', sans-serif;
        }
        
        .board-container {
          background: #fafafa;
          border-radius: 24px;
          padding: 60px;
          border: 2px solid #000000;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          animation: slideDown 0.8s ease-out 0.5s backwards;
        }
      `}</style>

      <h1 className="title">Hexagon</h1>
      <div className="subtitle">Strategická hra</div>

      <div style={{ 
        marginBottom: '20px',
        animation: 'slideDown 0.8s ease-out 0.35s backwards',
        textAlign: 'center'
      }}>
        <label style={{
          display: 'inline-block',
          padding: '12px 24px',
          backgroundColor: '#f5f5f5',
          border: '2px solid #000000',
          borderRadius: '8px',
          cursor: 'pointer',
          fontFamily: "'Space Mono', monospace",
          fontSize: '0.9rem',
          fontWeight: '700',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#e5e5e5'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#f5f5f5'}
        >
          📁 Nahrát otázky
          <input 
            type="file" 
            accept=".json,.csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {questions.length > 0 && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.8rem',
            color: '#666'
          }}>
            ✓ Nahráno {questions.length} otázek
          </div>
        )}
      </div>

      <div style={{ 
        marginBottom: '40px',
        animation: 'slideDown 0.8s ease-out 0.4s backwards',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-block',
          padding: '15px 30px',
          borderRadius: '12px',
          border: '3px solid #000000',
          backgroundColor: selectedColor === 'red' ? '#ff4444' : '#4444ff',
          color: '#ffffff',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '1.2rem',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        }}>
          Na tahu: {selectedColor === 'red' ? 'Červený' : 'Modrý'}
        </div>
      </div>

      <div className="board-container">
        <svg 
          width="500" 
          height="600" 
          viewBox="0 0 500 600"
          style={{
            filter: 'drop-shadow(0 2px 10px rgba(0, 0, 0, 0.1))'
          }}
        >
          <defs>
            <filter id="hexShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
            </filter>
          </defs>

          {hexagons.map((hex, index) => {
            const hexColor = hexagonColors.get(hex.id);
            
            let fillColor = '#ffffff';
            if (hexColor === 'red') {
              fillColor = '#ff4444';
            } else if (hexColor === 'blue') {
              fillColor = '#4444ff';
            } else if (hexColor === 'gray') {
              fillColor = '#999999';
            }
            
            return (
              <g 
                key={hex.id}
                onClick={() => handleHexagonClick(hex.id)}
                style={{
                  animation: `slideDown 0.5s ease-out ${0.5 + index * 0.02}s backwards`
                }}
              >
                <path
                  className="hex-path"
                  d={generateHexagonPath(hex.x, hex.y, hexSize)}
                  fill={fillColor}
                  stroke="#000000"
                  strokeWidth="2"
                  filter="url(#hexShadow)"
                />
                
                {/* Číslo v hexagonu */}
                <text
                  x={hex.x}
                  y={hex.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={hexColor ? '#ffffff' : '#000000'}
                  fontSize="16"
                  fontWeight="700"
                  fontFamily="'Orbitron', sans-serif"
                  style={{
                    pointerEvents: 'none'
                  }}
                >
                  {hex.id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {showQuestion && currentQuestion && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span className={`current-player ${selectedColor}`}>
                {selectedColor === 'red' ? 'Hraje: Červený' : 'Hraje: Modrý'}
              </span>
            </div>
            
            {/* Krátký text otázky - výrazný */}
            <div className="question-text">{currentQuestion.displayText}</div>
            
            {/* Plný text otázky - drobný pod displayText */}
            <div style={{ 
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#666',
              lineHeight: '1.5',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              {currentQuestion.fullText}
            </div>
            
            {/* Skrytá odpověď - zobrazí se po rozbalení */}
            <details style={{ 
              marginBottom: '20px', 
              padding: '15px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: '700',
                fontSize: '0.9rem',
                color: '#666',
                userSelect: 'none'
              }}>
                📖 Zobrazit odpověď
              </summary>
              <div style={{ 
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#e8f5e9',
                borderRadius: '6px',
                border: '1px solid #4caf50',
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}>
                <strong>Odpověď:</strong><br/>
                {currentQuestion.answer}
              </div>
            </details>
            
            <div className="answer-buttons" style={{ flexDirection: 'column', gap: '15px' }}>
              <button 
                className="answer-button correct"
                onClick={() => handleAnswer('correct')}
              >
                Správně
              </button>
              <button 
                className="answer-button incorrect"
                onClick={() => handleAnswer('incorrect')}
              >
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

      <div className="info-panel">
        <div className="info-label">Označené hexagony</div>
        <div className="info-value">{hexagonColors.size} / {hexagons.length}</div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e0e0e0', display: 'flex', justifyContent: 'space-around' }}>
          <div>
            <div className="info-label">Červené</div>
            <div className="info-value" style={{ color: '#ff4444' }}>
              {Array.from(hexagonColors.values()).filter(c => c === 'red').length}
            </div>
          </div>
          <div>
            <div className="info-label">Modré</div>
            <div className="info-value" style={{ color: '#4444ff' }}>
              {Array.from(hexagonColors.values()).filter(c => c === 'blue').length}
            </div>
          </div>
          <div>
            <div className="info-label">Šedé</div>
            <div className="info-value" style={{ color: '#999999' }}>
              {Array.from(hexagonColors.values()).filter(c => c === 'gray').length}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e0e0e0' }}>
          <div className="info-label">Zbývá otázek</div>
          <div className="info-value">
            {(questions.length > 0 ? questions : defaultQuestions).length - usedQuestions.size}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '30px',
        color: '#333333',
        fontSize: '0.875rem',
        textAlign: 'center',
        maxWidth: '550px',
        lineHeight: '1.6',
        animation: 'slideDown 0.8s ease-out 0.8s backwards'
      }}>
        <strong>Pravidla:</strong><br/>
        • <strong>Správně</strong> = pole v barvě hráče, tah přechází na soupeře<br/>
        • <strong>Špatně</strong> = šedé pole, tah přechází na soupeře<br/>
        • <strong>Soupeř správně</strong> = pole v barvě soupeře, hráč hraje znovu<br/>
        • Na <strong>šedé pole</strong> lze kliknout znovu a získat novou otázku<br/>
        • Otázky se <strong>neopakují</strong> - hra končí, když dojdou otázky<br/>
        <br/>
        <em>Nahrajte soubor s otázkami (JSON nebo CSV formát)</em>
      </div>
    </div>
  );
};

export default HexagonGame;