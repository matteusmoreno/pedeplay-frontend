/* * ========================================
 * ARQUIVO: src/services/showService.js
 * ========================================
 */
import api from './api';

export const getActiveShowByArtist = async (artistId) => {
    try {
        const response = await api.get(`/shows/active/${artistId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const makeSongRequest = async (requestData) => {
    try {
        // --- CORREÇÃO DE ENDPOINT ---
        // Seu backend (ShowResource.java) usa /shows/request
        const response = await api.post('/shows/request', requestData);
        // --- FIM DA CORREÇÃO ---
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const getSongList = async (artistId) => {
    try {
        const response = await api.get(`/artists/${artistId}/repertoire-details`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};


export const getShowDetails = async (showId) => {
    try {
        const response = await api.get(`/shows/${showId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const getArtistRepertoire = async (artistId) => {
    try {
        const response = await api.get(`/artists/${artistId}/repertoire-details`);
        // Corrigido para retornar o array de 'repertoire'
        return response.data.repertoire || [];
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

// --- INÍCIO DA NOVA FUNÇÃO ---
/**
 * Busca o histórico de shows (paginado) de um artista.
 * Corresponde ao endpoint GET /shows/all/{artistId}
 */
export const getPastShowsByArtist = async (artistId, page = 0, size = 5) => {
    try {
        const response = await api.get(`/shows/all/${artistId}`, {
            params: { page, size, sort: 'startTime,desc' } // Ordena pelos mais recentes
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar histórico de shows:", error);
        throw error.response?.data || new Error(error.message);
    }
};
// --- FIM DA NOVA FUNÇÃO ---