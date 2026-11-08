import React, { useEffect, useState } from 'react';
import { loadQuestions } from './game.js';

// Stránka pro správce hry (#spravce): očíslovaný seznam otázek a odpovědí.
// Číslo odpovídá „Otázka č. …“, které hra ukazuje u každé otázky.
const Admin = () => {
  const [questions, setQuestions] = useState(null);
  const [skipped, setSkipped] = useState(0);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadQuestions()
      .then(({ questions: loaded, skipped: s }) => {
        setQuestions(loaded);
        setSkipped(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  const q = query.trim().toLowerCase();
  // Samotné číslo hledá jen podle čísla otázky, jinak se hledá v textu.
  const filtered = (questions ?? []).filter((item) =>
    !q
      ? true
      : /^\d+$/.test(q)
        ? String(item.number) === q
        : [item.fullText, item.answer].some((t) => t.toLowerCase().includes(q))
  );

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>Správce hry</h1>
        <p>
          {questions
            ? `${questions.length} otázek` +
              (skipped ? ` · ${skipped} neplatných nebo duplicitních přeskočeno` : '')
            : error
              ? ''
              : 'Načítám otázky…'}
        </p>
        <input
          type="search"
          inputMode="search"
          className="admin-search"
          placeholder="Číslo otázky nebo text…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Hledat otázku"
        />
      </header>

      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      <ol className="admin-list">
        {filtered.map((item) => (
          <li key={item.number} className="admin-item">
            <div className="admin-number">{item.number}</div>
            <div>
              <div className="admin-answer">
                {item.answer}
                {item.letters && <span className="admin-letters">{item.letters}</span>}
              </div>
              <div className="admin-full">{item.fullText}</div>
            </div>
          </li>
        ))}
      </ol>
      {questions && filtered.length === 0 && <p className="admin-empty">Nic nenalezeno.</p>}
    </div>
  );
};

export default Admin;
