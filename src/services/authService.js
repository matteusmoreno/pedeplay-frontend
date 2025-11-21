/* * ========================================
 * ARQUIVO: src/services/authService.js
 * (Correção do Erro de Login)
 * ========================================
 */
import api from './api';

export const login = async (email, password) => {
    try {
        // Limpa qualquer token anterior antes de tentar login
        delete api.defaults.headers.Authorization;
        
        const response = await api.post('/auth/login', { 
            email, 
            password 
        }, {
            // Garante que não vai enviar headers de autenticação nesta requisição
            headers: {
                'Authorization': undefined
            }
        });

        // O backend retorna { "token": "..." }
        // Retorna apenas a string do token
        return response.data.token;

    } catch (error) {
        // Se a API der erro (ex: 401), lança mensagem de erro
        throw new Error(error.response?.data?.message || 'Email ou senha inválidos');
    }
};