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

export const registerArtist = async (artistData) => {
    try {
        // O backend espera o objeto socialLinks aninhado
        //
        const dataToPost = {
            name: artistData.name,
            email: artistData.email,
            password: artistData.password,
            biography: artistData.biography,
            cep: artistData.cep.replace(/\D/g, ''), // Garante que só números sejam enviados
            number: artistData.number,
            complement: artistData.complement,
            
            // --- INÍCIO DA CORREÇÃO ---
            // Montando o objeto socialLinks exatamente como o DTO do backend
            socialLinks: {
                instagramUrl: artistData.instagramUrl || null,
                facebookUrl: artistData.facebookUrl || null,
                youtubeUrl: artistData.youtubeUrl || null,
                linkedInUrl: artistData.linkedInUrl || null
            }
            // --- FIM DA CORREÇÃO ---
        };

        const response = await api.post('/artists', dataToPost);
        return response.data;
    } catch (error) {
        // Repassa o erro para o componente tratar
        const errorData = error.response?.data;
        if (errorData && errorData.message) {
            throw new Error(errorData.message);
        }
        throw new Error(error.message || 'Erro desconhecido no servidor.');
    }
};