/* * ========================================
 * ARQUIVO: src/App.js
 * (Correção do Layout e da Tarja)
 * ========================================
 */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header/Header';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { FaBroadcastTower } from 'react-icons/fa';

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

      {/* --- INÍCIO DA CORREÇÃO DE LAYOUT --- */}
      {/* * Removemos o <main className="container"> daqui.
              * Agora, o AppRoutes renderiza as páginas (Login, Register, Dashboard)
              * diretamente, permitindo que cada página controle seu próprio layout
              * (tela cheia ou 'container').
            */}
      <AppRoutes />
      {/* --- FIM DA CORREÇÃO DE LAYOUT --- */}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;