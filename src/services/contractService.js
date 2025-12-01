/* * ========================================
 * ARQUIVO NOVO: src/services/contractService.js
 * ========================================
 */
import api from './api';

export const createContract = async (contractData) => {
    try {
        // contractData deve conter { contract: { availabilityIds: [] }, customer: { ... } }
        const response = await api.post('/contracts/create', contractData);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const getArtistContracts = async (artistId) => {
    try {
        const response = await api.get(`/contracts/find-all-contracts-by-artist-id?artistId=${artistId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const confirmContract = async (contractId) => {
    try {
        await api.patch(`/contracts/confirm/${contractId}`);
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const rejectContract = async (contractId) => {
    try {
        await api.patch(`/contracts/reject/${contractId}`);
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};