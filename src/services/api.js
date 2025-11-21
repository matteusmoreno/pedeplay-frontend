import axios from 'axios';

const API_URL = 'http://localhost:8383';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: false, // Não enviar cookies automaticamente
    headers: {
        'Content-Type': 'application/json',
    }
});

// Interceptor para adicionar o token JWT a cada requisição
api.interceptors.request.use(
    (config) => {
        // Não adicionar token em rotas de autenticação
        const isAuthRoute = config.url.includes('/auth/login') || config.url.includes('/auth/register');
        
        if (!isAuthRoute) {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        } else {
            // Garante que não há Authorization header em rotas de auth
            delete config.headers['Authorization'];
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para lidar com erros de autenticação
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Se receber 401 (não autorizado) ou 403 (token expirado)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // Limpa o token inválido
            localStorage.removeItem('token');
            delete api.defaults.headers.Authorization;
            
            // Se não estiver na página de login, redireciona
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;