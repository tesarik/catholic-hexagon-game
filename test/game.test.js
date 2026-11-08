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
  parseQuestions,
  loadQuestions,
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

test('CSV parser: uvozovky, středník v poli, CRLF', () => {
  assert.deepEqual(parseCsv('a;"b;c";"d ""e"""\r\nx;y;z'), [
    ['a', 'b;c', 'd "e"'],
    ['x', 'y', 'z'],
  ]);
});

test('otázky: hlavička, BOM, neplatné řádky, duplicity a čísla podle pořadí', () => {
  const { questions, skipped } = parseQuestions(
    '\uFEFFpopis;odpověď;písmena\r\n' +
      'budova pro bohoslužbu;Chrám;Ch\r\n' +
      'budova pro bohoslužbu;Kostel;K\r\n' + // stejný popis, jiná odpověď → platí
      'budova pro bohoslužbu;Kostel;K\r\n' + // úplná duplicita → přeskočit
      'bez odpovědi;;X\r\n' +
      '"popis; se středníkem";Odpověď\r\n'
  );
  assert.equal(skipped, 2);
  assert.deepEqual(questions, [
    { number: 1, fullText: 'budova pro bohoslužbu', answer: 'Chrám', letters: 'Ch' },
    { number: 2, fullText: 'budova pro bohoslužbu', answer: 'Kostel', letters: 'K' },
    { number: 3, fullText: 'popis; se středníkem', answer: 'Odpověď', letters: '' },
  ]);
  assert.throws(() => parseQuestions('jen;\n;\n'), /žádné platné/);
});

test('loadQuestions: chyby HTTP a sítě', async () => {
  await assert.rejects(loadQuestions(async () => ({ ok: false, status: 404 })), /HTTP 404/);
  await assert.rejects(loadQuestions(async () => { throw new TypeError('offline'); }), /připojení/);
  const ok = await loadQuestions(async () => ({ ok: true, text: async () => 'A;B;A' }));
  assert.equal(ok.questions.length, 1);
});

test('public/otazky.csv: všech 137 otázek je platných', async () => {
  const { readFile } = await import('node:fs/promises');
  const content = await readFile(new URL('../public/otazky.csv', import.meta.url), 'utf8');
  const { questions, skipped } = parseQuestions(content);
  assert.equal(skipped, 0);
  assert.equal(questions.length, 137);
  assert.deepEqual(questions[0], {
    number: 1,
    fullText: 'stůl v presbytáři, na kterém jsou připraveny věci ke mši svaté',
    answer: 'Abak',
    letters: 'A',
  });
});
