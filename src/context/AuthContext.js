/* * ========================================
 * ARQUIVO: src/context/AuthContext.js
 * (Refatorado para buscar dados do Artista)
 * ========================================
 */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';
import { getArtistDetails } from '../services/artistService'; // Importar o serviço

const AuthContext = createContext();

// Função auxiliar para criar o objeto de usuário a partir do token
const createUserFromToken = (token) => {
    try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 > Date.now()) {
            return {
                id: decodedToken.sub,
                email: decodedToken.upn,
                roles: decodedToken.groups,
                ...decodedToken
            };
        }
        return null; // Token expirado
    } catch (error) {
        console.error("Token inválido ou corrompido", error);
        return null; // Token inválido
    }
};


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Dados do Token (id, email)
    const [token, setToken] = useState(null);
    const [artistData, setArtistData] = useState(null); // Dados completos do Artista (nome, foto)
    const [loading, setLoading] = useState(true);
    const [activeShow, setActiveShow] = useState(null);

    // Nova função para buscar e armazenar os dados completos do artista
    const fetchArtistData = useCallback(async (artistId) => {
        try {
            const data = await getArtistDetails(artistId);
            setArtistData(data);
        } catch (error) {
            console.error("Falha ao buscar dados do artista para o contexto", error);
            // Não desloga, mas o header pode ficar sem nome/avatar
        }
    }, []);

    const login = useCallback(async (newToken) => {
        setLoading(true);
        const appUser = createUserFromToken(newToken);

        if (appUser) {
            localStorage.setItem('token', newToken);
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            setUser(appUser);
            setToken(newToken);
            // Busca os dados completos do artista após o login
            await fetchArtistData(appUser.id);
        } else {
            localStorage.removeItem('token');
            api.defaults.headers.Authorization = null;
            setUser(null);
            setToken(null);
            setArtistData(null);
        }
        setLoading(false);
    }, [fetchArtistData]);

    const logout = () => {
        setLoading(true);
        localStorage.removeItem('token');
        api.defaults.headers.Authorization = null;
        setUser(null);
        setToken(null);
        setActiveShow(null);
        setArtistData(null); // Limpa os dados do artista
        setLoading(false);
    };

    // Efeito de inicialização (só roda uma vez)
    useEffect(() => {
        const initializeAuth = async () => {
            const initialToken = localStorage.getItem('token');
            const appUser = createUserFromToken(initialToken);

            if (appUser) {
                api.defaults.headers.Authorization = `Bearer ${initialToken}`;
                setUser(appUser);
                setToken(initialToken);
                // Busca os dados completos do artista na inicialização
                await fetchArtistData(appUser.id);
            }

            setLoading(false);
        };

        initializeAuth();
    }, [fetchArtistData]); // Adicionado fetchArtistData aqui

    return (
        <AuthContext.Provider value={{
            user,
            token,
            artistData, // <-- Exporta os dados completos
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