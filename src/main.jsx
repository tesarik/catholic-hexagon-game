import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HexagonGame from './App.jsx';
import Admin from './Admin.jsx';

const ADMIN_HASH = '#spravce';
const isAdmin = () => window.location.hash === ADMIN_HASH;

const Root = () => {
  const [admin, setAdmin] = useState(isAdmin);
  useEffect(() => {
    const onHashChange = () => setAdmin(isAdmin());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return admin ? <Admin /> : <HexagonGame />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
