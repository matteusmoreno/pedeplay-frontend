import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Pode adicionar um componente de "Loading..." aqui
        return <div>Carregando...</div>;
    }

    if (!isAuthenticated) {
        // Redireciona para o login, guardando a página que ele tentou acessar
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;