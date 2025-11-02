import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

// Função auxiliar para criar o objeto de usuário a partir do token
const createUserFromToken = (token) => {
    try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
            // Constrói o objeto 'user' que a aplicação espera
            return {
                id: decodedToken.sub, // Traduz 'sub' (subject) para 'id'
                email: decodedToken.upn, // Traduz 'upn' (user principal name) para 'email'
                roles: decodedToken.groups,
                ...decodedToken // Mantém o resto (exp, iat, etc.) se necessário
            };
        }
        return null; // Token expirado
    } catch (error) {
        console.error("Token inválido ou corrompido", error);
        return null; // Token inválido
    }
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeShow, setActiveShow] = useState(null);

    const login = useCallback((newToken) => {
        setLoading(true);
        const appUser = createUserFromToken(newToken);

        if (appUser) {
            localStorage.setItem('token', newToken);
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            setUser(appUser);
            setToken(newToken);
        } else {
            // Se o token for inválido (raro no login, mas seguro)
            localStorage.removeItem('token');
            api.defaults.headers.Authorization = null;
            setUser(null);
            setToken(null);
        }
        setLoading(false);
    }, []);

    const logout = () => {
        setLoading(true);
        localStorage.removeItem('token');
        api.defaults.headers.Authorization = null;
        setUser(null);
        setToken(null);
        setActiveShow(null);
        setLoading(false);
    };

    // Efeito de inicialização (só roda uma vez)
    useEffect(() => {
        const initialToken = localStorage.getItem('token');
        const appUser = createUserFromToken(initialToken);

        if (appUser) {
            api.defaults.headers.Authorization = `Bearer ${initialToken}`;
            setUser(appUser);
            setToken(initialToken);
        }

        setLoading(false);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            activeShow,
            setActiveShow,
            isAuthenticated: !!user,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;