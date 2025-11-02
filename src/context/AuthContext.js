import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token')); // Lê o token na inicialização

    const [activeShow, setActiveShow] = useState(null);

    const login = useCallback((newToken) => {
        try {
            localStorage.setItem('token', newToken);
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            const decodedUser = jwtDecode(newToken);
            setUser(decodedUser);
            setToken(newToken);
        } catch (error) {
            console.error("Falha ao decodificar novo token", error);
            logout(); // Se o novo token for inválido, desloga
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        api.defaults.headers.Authorization = null;
        setUser(null);
        setToken(null);
        setActiveShow(null);
    };

    // Este useEffect agora é robusto
    useEffect(() => {
        if (token) {
            // --- INÍCIO DA CORREÇÃO ---
            // Adiciona try...catch para lidar com tokens inválidos
            try {
                const decodedUser = jwtDecode(token);
                if (decodedUser.exp * 1000 > Date.now()) {
                    // Token válido e não expirado
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    setUser(decodedUser);
                } else {
                    // Token expirado
                    logout();
                }
            } catch (error) {
                // Token inválido ou corrompido
                console.error("Token inválido no localStorage", error);
                logout();
            }
            // --- FIM DA CORREÇÃO ---
        }
    }, [token]); // Só executa quando o token mudar

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            activeShow,
            setActiveShow
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;