import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import QuyPhong from './Pages/QuyPhong';
import ManagePersons from './Pages/ManagePersons';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<QuyPhong />} />
        <Route path="/admin" element={<ManagePersons />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
