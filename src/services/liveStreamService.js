import api from './api';

/**
 * Inicia uma transmissão ao vivo
 */
export const startLiveStream = async (showId, streamQuality = 'HD') => {
    try {
        console.log('📡 Enviando request para iniciar live stream:', { showId, streamQuality });
        const response = await api.post('/livestreams/start', {
            showId,
            streamQuality
        });
        console.log('✅ Live stream iniciada:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Erro ao iniciar live stream:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Erro ao iniciar live stream');
    }
};

/**
 * Encerra uma transmissão ao vivo
 */
export const stopLiveStream = async (showId) => {
    try {
        const response = await api.post(`/livestreams/stop/${showId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Erro ao encerrar live stream');
    }
};

/**
 * Obtém informações sobre uma live stream ativa
 */
export const getLiveStreamInfo = async (showId) => {
    try {
        const response = await api.get(`/livestreams/${showId}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null; // Nenhuma live stream ativa
        }
        throw new Error(error.response?.data?.message || 'Erro ao buscar informações da live stream');
    }
};

/**
 * Registra um viewer na live stream
 */
export const registerViewer = async (showId, userId) => {
    try {
        await api.post(`/livestreams/${showId}/register?userId=${userId}`);
    } catch (error) {
        console.error('Erro ao registrar viewer:', error);
    }
};

/**
 * Verifica se um artista tem live stream ativa
 */
export const hasActiveLiveStream = async (artistId) => {
    try {
        const response = await api.get(`/livestreams/artist/${artistId}/active`);
        return response.data.hasActiveLiveStream;
    } catch (error) {
        console.error('Erro ao verificar live stream ativa:', error);
        return false;
    }
};
