// Čistá herní logika bez Reactu – hrací pole, výhra, výběr a import otázek.

export const ROWS = 7;

// Pole má tvar trojúhelníku: řada r (0 = vrchol) obsahuje r + 1 polí.
// ID pole je pořadové číslo shora zleva, počínaje 1.
export const cellId = (row, col) => (row * (row + 1)) / 2 + col + 1;

export function buildBoard(rows = ROWS) {
  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= row; col++) {
      cells.push({ id: cellId(row, col), row, col });
    }
  }
  return cells;
}

// Sousedé v trojúhelníku šestiúhelníků otočených špičkou nahoru.
export function neighbors({ row, col }, rows = ROWS) {
  return [
    [row, col - 1], [row, col + 1],
    [row - 1, col - 1], [row - 1, col],
    [row + 1, col], [row + 1, col + 1],
  ]
    .filter(([r, c]) => r >= 0 && r < rows && c >= 0 && c <= r)
    .map(([r, c]) => cellId(r, c));
}

// Které strany trojúhelníku pole leží (levá, pravá, spodní).
function sidesOf({ row, col }, rows) {
  const sides = [];
  if (col === 0) sides.push('left');
  if (col === row) sides.push('right');
  if (row === rows - 1) sides.push('bottom');
  return sides;
}

// Vítěz = hráč, jehož souvislá skupina polí se dotýká všech tří stran.
// Vrací { winner, path } (path = ID polí vítězné skupiny), nebo null.
export function findWinner(colors, rows = ROWS) {
  const board = buildBoard(rows);
  const byId = new Map(board.map((c) => [c.id, c]));

  for (const player of ['red', 'blue']) {
    const visited = new Set();
    for (const start of board) {
      if (colors.get(start.id) !== player || visited.has(start.id)) continue;

      const group = [];
      const sides = new Set();
      const queue = [start.id];
      visited.add(start.id);
      while (queue.length) {
        const id = queue.shift();
        const cell = byId.get(id);
        group.push(id);
        sidesOf(cell, rows).forEach((s) => sides.add(s));
        for (const n of neighbors(cell, rows)) {
          if (!visited.has(n) && colors.get(n) === player) {
            visited.add(n);
            queue.push(n);
          }
        }
      }
      if (sides.size === 3) return { winner: player, path: group };
    }
  }
  return null;
}

// Pole je dohrané, když už není žádné bílé ani šedé (tj. hratelné) pole.
export function isBoardFull(colors, rows = ROWS) {
  return buildBoard(rows).every((c) => {
    const color = colors.get(c.id);
    return color === 'red' || color === 'blue';
  });
}

export function countColors(colors) {
  const counts = { red: 0, blue: 0, gray: 0 };
  for (const color of colors.values()) counts[color]++;
  return counts;
}

// Náhodný index z dosud nepoužitých otázek, nebo null, když došly.
export function pickQuestionIndex(poolSize, used, random = Math.random) {
  const free = [];
  for (let i = 0; i < poolSize; i++) if (!used.has(i)) free.push(i);
  if (free.length === 0) return null;
  return free[Math.floor(random() * free.length)];
}

// --- Import otázek -------------------------------------------------------

// CSV s oddělovačem ";" a podporou uvozovek ("pole se ; uvnitř", "" = ").
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field.trim() === '') {
      field = '';
      inQuotes = true;
    } else if (ch === ';') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const HEADER_NAMES = ['fulltext', 'otázka', 'otazka', 'question'];

function normalizeQuestion(item) {
  if (!item || typeof item !== 'object') return null;
  const str = (v) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '');
  const fullText = str(item.fullText);
  const answer = str(item.answer);
  if (!fullText || !answer) return null;
  return { fullText, answer, displayText: str(item.displayText) || fullText };
}

// Vrací { questions, skipped }; při nepoužitelném souboru vyhodí Error s českou zprávou.
export function parseQuestionsFile(fileName, rawContent) {
  const content = rawContent.replace(/^﻿/, '');
  const name = fileName.toLowerCase();
  let items;

  if (name.endsWith('.json')) {
    let data;
    try {
      data = JSON.parse(content);
    } catch {
      throw new Error('Soubor není platný JSON.');
    }
    if (!Array.isArray(data)) {
      throw new Error('JSON musí obsahovat pole otázek ([ {…}, {…} ]).');
    }
    items = data;
  } else if (name.endsWith('.csv')) {
    const rows = parseCsv(content).filter((r) => r.some((f) => f.trim() !== ''));
    if (rows.length && HEADER_NAMES.includes(rows[0][0].trim().toLowerCase())) rows.shift();
    items = rows.map(([fullText, answer, displayText]) => ({ fullText, answer, displayText }));
  } else {
    throw new Error('Podporované jsou jen soubory .json a .csv.');
  }

  const seen = new Set();
  const questions = [];
  let skipped = 0;
  for (const item of items) {
    const q = normalizeQuestion(item);
    if (!q || seen.has(q.fullText)) {
      skipped++;
      continue;
    }
    seen.add(q.fullText);
    questions.push(q);
  }

  if (questions.length === 0) {
    throw new Error('Soubor neobsahuje žádné platné otázky (každá potřebuje otázku a odpověď).');
  }
  return { questions, skipped };
}
