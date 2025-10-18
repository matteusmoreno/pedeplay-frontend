import api from './api';

// Pega o show ativo de um artista (para a página pública)
export const getActiveShowByArtist = async (artistId) => {
    const response = await api.get(`/shows/active/${artistId}`);
    return response.data;
};

// Pega o repertório (lista de músicas) de um artista
// Assumindo que você tenha um endpoint para isso.
// Por enquanto, vamos buscar todas as músicas cadastradas.
export const getSongList = async () => {
    const response = await api.get('/songs/all');
    return response.data;
};

// Faz um pedido de música
export const makeSongRequest = async (requestData) => {
    const response = await api.post('/shows/request', requestData);
    return response.data;
};