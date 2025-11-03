/* * ========================================
 * ARQUIVO: src/App.js
 * (Adicionado NotificationProvider)
 * ========================================
 */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header/Header';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { FaBroadcastTower } from 'react-icons/fa';

// --- 1. Importar o Provider e o Container ---
import { NotificationProvider } from './context/NotificationContext';

import './assets/styles/global.css';

// Componente interno para acessar o contexto
const AppContent = () => {
  const { activeShow } = useAuth(); // Lê o estado global

  return (
    <div className="app-container">
      <Header />

      {/* A tarja de "Modo Show" (corrigida) */}
      {activeShow && (
        <div className="live-status-banner">
          <FaBroadcastTower />
          <span>MODO SHOW ATIVO</span>
        </div>
      )}

      <AppRoutes />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      {/* 2. Envolver o Router com o NotificationProvider */}
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;