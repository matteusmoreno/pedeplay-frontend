import api from './api';

// Inicia o show
export const startShow = async (artistId) => {
    const response = await api.post(`/shows/start/${artistId}`);
    return response.data;
};

// Termina o show
export const endShow = async (showId) => {
    const response = await api.patch(`/shows/end/${showId}`);
    return response.data;
};

// Atualiza o status de um pedido
export const updateRequestStatus = async (showId, requestId, status) => {
    const response = await api.patch(
        `/shows/${showId}/requests/${requestId}/status`,
        { status }
    );
    return response.data;
};