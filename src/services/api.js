import axios from 'axios';

// ATENÇÃO: Seu backend está rodando na porta 8182
const API_URL = 'http://localhost:8182';

const api = axios.create({
    baseURL: API_URL,
});

// Interceptor para adicionar o token JWT a cada requisição
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;