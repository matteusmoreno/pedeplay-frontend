import api from './api';

export const login = async (email, password) => {
    const response = await api.post('/auth/login', {
        email,
        password,
    });
    return response.data;
};

// Você pode adicionar a função de registro aqui quando criar o endpoint
// export const register = async (userData) => {
//   const response = await api.post('/artists', userData);
//   return response.data;
// };