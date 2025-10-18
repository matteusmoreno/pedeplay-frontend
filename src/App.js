import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header/Header';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <main className="container">
          <AppRoutes />
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;