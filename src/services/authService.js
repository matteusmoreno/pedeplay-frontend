/* * ========================================
 * ARQUIVO: src/services/authService.js
 * (Correção do Erro de Login)
 * ========================================
 */
import api from './api';

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });

        // --- INÍCIO DA CORREÇÃO ---
        // O backend retorna { "token": "..." }.
        // Precisamos retornar APENAS a string do token.
        return response.data.token;
        // --- FIM DA CORREÇÃO ---

    } catch (error) {
        // Se a API der erro (ex: 401), ela não retorna 'data.token'
        // Lançamos a mensagem de erro da API ou uma mensagem padrão
        throw new Error(error.response?.data?.message || 'Email ou senha inválidos');
    }
};