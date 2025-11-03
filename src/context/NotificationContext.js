/* * ========================================
 * ARQUIVO NOVO: src/context/NotificationContext.js
 * ========================================
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ToastNotification/Toast';

// 1. Cria o Contexto
const NotificationContext = createContext(null);

// 2. Cria o Provedor
export const NotificationProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    // Função para adicionar um novo toast
    // (title = título, message = corpo, type = 'success', 'error' ou 'info')
    const addToast = useCallback((title, message, type = 'info') => {
        const id = Date.now() + Math.random();
        setToasts((prevToasts) => [
            ...prevToasts,
            { id, title, message, type }
        ]);
    }, []);

    // Função para remover um toast
    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter(toast => toast.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ addToast, removeToast }}>
            {children}
            {/* O Container que vai renderizar os toasts na tela */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

// 3. Hook customizado para usar o contexto facilmente
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};