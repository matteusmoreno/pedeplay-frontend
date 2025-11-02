/* * ========================================
 * ARQUIVO: src/services/artistService.js
 * ========================================
 */
import api from './api';

// --- FUNÇÕES DE SHOW (Movidas do showService) ---

/**
 * Inicia um novo show.
 * Corresponde ao: POST /shows/start/{artistId}
 */
export const startShow = async (artistId) => {
    const response = await api.post(`/shows/start/${artistId}`);
    return response.data;
};

/**
 * Finaliza um show ativo.
 * Corresponde ao: PATCH /shows/end/{showId}
 */
export const endShow = async (showId) => {
    const response = await api.patch(`/shows/end/${showId}`);
    return response.data;
};

/**
 * Atualiza o status de um pedido de música (PLAYED, CANCELED).
 * Corresponde ao: PATCH /shows/{showId}/requests/{requestId}/status
 */
export const updateRequestStatus = async (showId, requestId, status) => {
    const response = await api.patch(
        `/shows/${showId}/requests/${requestId}/status`,
        { status } // Envia { "status": "PLAYED" }
    );
    return response.data;
};

// --- FUNÇÕES DE CADASTRO (Já existente) ---

/**
 * Cadastra um novo artista.
 * Corresponde ao: POST /artists
 */
export const registerArtist = async (artistData) => {
    try {
        const dataToPost = {
            name: artistData.name,
            email: artistData.email,
            password: artistData.password,
            biography: artistData.biography,
            cep: artistData.cep.replace(/\D/g, ''), // Garante que só números sejam enviados
            number: artistData.number,
            complement: artistData.complement,
            socialLinks: {
                instagramUrl: artistData.instagramUrl || null,
                facebookUrl: artistData.facebookUrl || null,
                youtubeUrl: artistData.youtubeUrl || null,
                linkedInUrl: artistData.linkedInUrl || null
            }
        };

        const response = await api.post('/artists', dataToPost);
        return response.data;
    } catch (error) {
        const errorData = error.response?.data;
        if (errorData && errorData.message) {
            throw new Error(errorData.message);
        }
        throw new Error(error.message || 'Erro desconhecido no servidor.');
    }
};

// --- NOVAS FUNÇÕES DO DASHBOARD ---

/**
 * Busca os detalhes completos do artista logado.
 * Corresponde ao: GET /artists/{artistId}
 */
export const getArtistDetails = async (artistId) => {
    try {
        const response = await api.get(`/artists/${artistId}`);
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar detalhes do artista:", error);
        throw error.response?.data || new Error(error.message);
    }
};

/**
 * Atualiza os dados do perfil do artista.
 * Corresponde ao: PUT /artists
 */
export const updateArtistDetails = async (artistData) => {
    try {
        // O backend espera o objeto completo, incluindo o ID
        const response = await api.put('/artists', artistData);
        return response.data;
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        throw error.response?.data || new Error(error.message);
    }
};

/**
 * Faz upload da foto de perfil do artista.
 * Corresponde ao: PATCH /artists/profile-image/{id}
 */
export const uploadProfileImage = async (artistId, file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.patch(`/artists/profile-image/${artistId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao enviar imagem:", error);
        throw error.response?.data || new Error(error.message);
    }
};


// --- FUNÇÕES DE REPERTÓRIO ---

/**
 * Busca o repertório detalhado do artista (lista de músicas).
 * Corresponde ao: GET /artists/{artistId}/repertoire-details
 */
export const getArtistRepertoire = async (artistId) => {
    try {
        const response = await api.get(`/artists/${artistId}/repertoire-details`);
        return response.data.repertoire || []; // Garante que seja sempre um array
    } catch (error) {
        console.error("Erro ao buscar repertório:", error);
        throw error.response?.data || new Error(error.message);
    }
};

/**
 * Adiciona uma ou mais músicas ao repertório.
 * Corresponde ao: PATCH /artists/repertoire/add
 */
export const addSongsToRepertoire = async (artistId, songIds) => {
    try {
        const response = await api.patch('/artists/repertoire/add', {
            artistId,
            songIds, // Deve ser um array de IDs
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao adicionar músicas:", error);
        throw error.response?.data || new Error(error.message);
    }
};

/**
 * Remove uma ou mais músicas do repertório.
 * Corresponde ao: PATCH /artists/repertoire/remove
 */
export const removeSongsFromRepertoire = async (artistId, songIds) => {
    try {
        const response = await api.patch('/artists/repertoire/remove', {
            artistId,
            songIds, // Deve ser um array de IDs
        });
        return response.data;
    } catch (error) {
        console.error("Erro ao remover músicas:", error);
        throw error.response?.data || new Error(error.message);
    }
};