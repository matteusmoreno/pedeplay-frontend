/* * ========================================
 * ARQUIVO: src/routes/AppRoutes.js
 * ========================================
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import ArtistDashboard from '../pages/ArtistDashboard/ArtistDashboard';
import PublicShowPage from '../pages/PublicShowPage/PublicShowPage';
import ProtectedRoute from './ProtectedRoute';
import RegisterPage from '../pages/RegisterPage/RegisterPage'; // 1. Importe a nova página

const AppRoutes = () => {
    return (
        <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} /> {/* 2. Adicione a nova rota */}
            <Route path="/show/:showId" element={<PublicShowPage />} />

            {/* Rotas Protegidas (Exemplo) */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <ArtistDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Rota Padrão (pode redirecionar para login ou dashboard) */}
            <Route path="/" element={<LoginPage />} />
        </Routes>
    );
};

export default AppRoutes;