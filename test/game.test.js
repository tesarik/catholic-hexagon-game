import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBoard,
  cellId,
  neighbors,
  findWinner,
  isBoardFull,
  pickQuestionIndex,
  parseCsv,
  parseQuestionsFile,
} from '../src/game.js';

const colorsOf = (entries) => new Map(entries);

test('pole má 28 políček s ID 1–28', () => {
  const board = buildBoard(7);
  assert.equal(board.length, 28);
  assert.deepEqual(board.map((c) => c.id), Array.from({ length: 28 }, (_, i) => i + 1));
  assert.equal(cellId(6, 6), 28);
});

test('sousedé', () => {
  assert.deepEqual(neighbors({ row: 0, col: 0 }).sort((a, b) => a - b), [2, 3]);
  // pole 5 (řada 2, sloupec 1) je uprostřed – má 6 sousedů
  assert.deepEqual(neighbors({ row: 2, col: 1 }).sort((a, b) => a - b), [2, 3, 4, 6, 8, 9]);
});

test('výhra: levý okraj od vrcholu dolů spojuje všechny tři strany', () => {
  const ids = [0, 1, 2, 3, 4, 5, 6].map((r) => cellId(r, 0));
  const result = findWinner(colorsOf(ids.map((id) => [id, 'blue'])));
  assert.equal(result.winner, 'blue');
  assert.equal(result.path.length, 7);
});

test('žádná výhra, když chybí jedna strana nebo je řetěz přerušený', () => {
  // levá + spodní strana, ale ne pravá
  const ids = [1, 2, 3, 4, 5, 6].map((r) => cellId(r, 0));
  assert.equal(findWinner(colorsOf(ids.map((id) => [id, 'red']))), null);
  // přerušeno šedým polem
  const broken = [0, 1, 2, 4, 5, 6].map((r) => [cellId(r, 0), 'red']);
  broken.push([cellId(3, 0), 'gray']);
  assert.equal(findWinner(colorsOf(broken)), null);
});

test('plné pole', () => {
  const all = buildBoard(7).map((c) => [c.id, 'red']);
  assert.equal(isBoardFull(colorsOf(all)), true);
  all[3] = [all[3][0], 'gray'];
  assert.equal(isBoardFull(colorsOf(all)), false);
});

test('výběr otázky najde i poslední volnou z velkého balíčku', () => {
  const used = new Set(Array.from({ length: 199 }, (_, i) => i));
  for (let i = 0; i < 50; i++) assert.equal(pickQuestionIndex(200, used), 199);
  used.add(199);
  assert.equal(pickQuestionIndex(200, used), null);
});

test('CSV: uvozovky, středník v poli, CRLF, BOM a hlavička', () => {
  assert.deepEqual(parseCsv('a;"b;c";"d ""e"""\r\nx;y;z'), [
    ['a', 'b;c', 'd "e"'],
    ['x', 'y', 'z'],
  ]);
  const { questions, skipped } = parseQuestionsFile(
    'q.CSV',
    '﻿fullText;answer;displayText\nOtázka?;"Ano; jistě.";Krátká?\nBez odpovědi;;\nJen otázka?;Odpověď\n'
  );
  assert.equal(skipped, 1);
  assert.deepEqual(questions, [
    { fullText: 'Otázka?', answer: 'Ano; jistě.', displayText: 'Krátká?' },
    { fullText: 'Jen otázka?', answer: 'Odpověď', displayText: 'Jen otázka?' },
  ]);
});

test('JSON: validace a duplicity', () => {
  assert.throws(() => parseQuestionsFile('q.json', '{"a":1}'), /pole otázek/);
  assert.throws(() => parseQuestionsFile('q.json', 'nejson'), /platný JSON/);
  assert.throws(() => parseQuestionsFile('q.json', '[{"fullText":"x"}]'), /žádné platné/);
  assert.throws(() => parseQuestionsFile('q.txt', ''), /\.json a \.csv/);
  const q = { fullText: 'X?', answer: 'Y' };
  const { questions, skipped } = parseQuestionsFile('q.json', JSON.stringify([q, q, null]));
  assert.equal(questions.length, 1);
  assert.equal(skipped, 2);
});

test('ukázkové soubory se načtou', async () => {
  const { readFile } = await import('node:fs/promises');
  for (const name of ['questions-example.json', 'questions-example.csv']) {
    const content = await readFile(new URL(`../${name}`, import.meta.url), 'utf8');
    assert.equal(parseQuestionsFile(name, content).questions.length, 5);
  }
});
