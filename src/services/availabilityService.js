/* * ========================================
 * ARQUIVO NOVO: src/services/availabilityService.js
 * ========================================
 */
import api from './api';

export const createAvailability = async (data) => {
    try {
        const response = await api.post('/availabilities/create', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const getAvailabilitiesByArtist = async (artistId) => {
    try {
        const response = await api.get(`/availabilities/get-all-by-artist/${artistId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const getAvailableSlotsByArtist = async (artistId) => {
    try {
        const response = await api.get(`/availabilities/available-by-artist/${artistId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const deleteAvailability = async (id) => {
    try {
        await api.delete(`/availabilities/delete/${id}`);
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};

export const createMultipleAvailabilities = async (dataArray) => {
    try {
        const response = await api.post('/availabilities/create-multiple', dataArray);
        return response.data;
    } catch (error) {
        throw error.response?.data || new Error(error.message);
    }
};