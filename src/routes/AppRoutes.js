/* * ========================================
 * ARQUIVO: src/routes/AppRoutes.js
 * (Atualizado com a nova HomePage)
 * ========================================
 */
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import ArtistDashboard from '../pages/ArtistDashboard/ArtistDashboard';
import PublicShowPage from '../pages/PublicShowPage/PublicShowPage';
import ProtectedRoute from './ProtectedRoute';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import HomePage from '../pages/HomePage/HomePage'; // 1. Importe a nova página

const AppRoutes = () => {
    return (
        <Routes>
            {/* --- INÍCIO DA CORREÇÃO --- */}
            {/* Rotas Públicas */}
            <Route path="/" element={<HomePage />} /> {/* 2. Rota principal agora é a HomePage */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* --- FIM DA CORREÇÃO --- */}

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

            {/* Rota Padrão (agora é a HomePage) */}
            <Route path="*" element={<HomePage />} />
        </Routes>
    );
};

export default AppRoutes;