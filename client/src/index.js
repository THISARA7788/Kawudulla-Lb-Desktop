// =========================================================================
// WHAT DOES THIS FILE DO?
// This is the absolute startup entrypoint of the React frontend application.
// It loads React, mounts the component tree into the main HTML 'root' div,
// boots up React Router's URL listening (via <BrowserRouter>), and includes
// the global CSS styling rules (index.css).
// =========================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
