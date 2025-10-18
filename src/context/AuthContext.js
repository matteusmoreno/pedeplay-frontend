import React, { createContext, useState, useEffect } from 'react';
import { login as loginService } from '../services/authService';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tenta carregar o token do localStorage ao iniciar
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                // Verifica se o token expirou (a propriedade 'exp' está em segundos)
                if (decodedToken.exp * 1000 > Date.now()) {
                    setToken(storedToken);
                    // O 'sub' (subject) no seu backend é o artistId
                    setUser({ id: decodedToken.sub, email: decodedToken.upn });
                } else {
                    // Token expirado
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error("Erro ao decodificar token:", error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const data = await loginService(email, password);
        const decodedToken = jwtDecode(data.token);

        setToken(data.token);
        // O 'sub' (subject) no seu backend é o artistId
        setUser({ id: decodedToken.sub, email: decodedToken.upn });
        localStorage.setItem('token', data.token);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};