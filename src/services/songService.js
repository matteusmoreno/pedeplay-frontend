/* * ========================================
 * ARQUIVO NOVO: src/services/songService.js
 * ========================================
 */
import api from './api';

/**
 * Busca todas as músicas cadastradas (paginadas).
 * Corresponde ao: GET /songs/all
 */
export const getAllSongs = async (page = 0, size = 10) => {
    try {
        const response = await api.get(`/songs/all`, {
            params: { page, size }
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar músicas:", error);
        throw error.response?.data || new Error(error.message);
    }
};

/**
 * Cria uma nova música no banco de dados.
 * Corresponde ao: POST /songs
 */
export const createSong = async (title, artistName) => {
    try {
        const response = await api.post('/songs', { title, artistName });
        return response.data;
    } catch (error) {
        console.error("Erro ao criar música:", error);
        throw error.response?.data || new Error(error.message);
    }
};