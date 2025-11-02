import { useContext } from 'react';
// --- INÍCIO DA CORREÇÃO ---
// Remove as chaves {} para importar o 'default' export
import AuthContext from '../context/AuthContext';
// --- FIM DA CORREÇÃO ---

export const useAuth = () => {
    return useContext(AuthContext);
};