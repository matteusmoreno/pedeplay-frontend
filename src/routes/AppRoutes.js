import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage/LoginPage';
import ArtistDashboard from '../pages/ArtistDashboard/ArtistDashboard';
import PublicShowPage from '../pages/PublicShowPage/PublicShowPage';
import ProtectedRoute from './ProtectedRoute';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<LoginPage />} />
            {/* A página pública de pedidos usa o ID do artista na URL */}
            <Route path="/show/:artistId" element={<PublicShowPage />} />

            {/* Adicione uma home page pública se desejar, ex:
        <Route path="/" element={<HomePage />} /> 
      */}

            {/* Rotas Protegidas */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <ArtistDashboard />
                    </ProtectedRoute>
                }
            />

            {/* Adicione outras rotas protegidas aqui, ex:
        <Route path="/dashboard/repertorio" element={<ProtectedRoute><RepertorioPage /></ProtectedRoute>} />
      */}

        </Routes>
    );
};

export default AppRoutes;