/* * ========================================
 * ARQUIVO: src/services/showService.js
 * ========================================
 */
// CORREÇÃO: Removidas as chaves {} da importação
import api from './api';

// Funções que você já tinha
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
        const response = await api.post('/shows/request-song', requestData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const getSongList = async (artistId) => {
    try {
        // Este endpoint parece ser o que busca o repertório
        const response = await api.get(`/artists/${artistId}/repertoire-details`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};


// --- INÍCIO DAS NOVAS FUNÇÕES ---

/**
 * Busca os detalhes de um show específico pelo ID.
 * Corresponde ao endpoint GET /shows/{showId}
 *
 */
export const getShowDetails = async (showId) => {
    try {
        const response = await api.get(`/shows/${showId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

/**
 * Busca o repertório (lista de músicas) de um artista.
 * Corresponde ao endpoint GET /artists/{artistId}/repertoire-details
 *
 */
export const getArtistRepertoire = async (artistId) => {
    try {
        const response = await api.get(`/artists/${artistId}/repertoire-details`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};
// --- FIM DAS NOVAS FUNÇÕES ---