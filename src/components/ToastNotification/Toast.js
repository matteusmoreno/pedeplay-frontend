/* * ========================================
 * ARQUIVO NOVO: src/components/ToastNotification/Toast.js
 * ========================================
 */
import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import './Toast.css';

// Mapeia o tipo da notificação para um ícone e cor
const toastTypes = {
    success: {
        icon: <FaCheckCircle />,
        className: 'success',
    },
    error: {
        icon: <FaExclamationCircle />,
        className: 'error',
    },
    info: {
        icon: <FaInfoCircle />,
        className: 'info',
    }
};

const Toast = ({ toast, onClose }) => {
    const { title, message, type } = toast;
    const [isFadingOut, setIsFadingOut] = useState(false);

    // Efeito para fechar o toast automaticamente após 5 segundos
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFadingOut(true);
            // Espera a animação de fade-out (300ms) para remover
            setTimeout(onClose, 300);
        }, 5000); // 5 segundos

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    // Função para fechar manualmente
    const handleClose = () => {
        setIsFadingOut(true);
        setTimeout(onClose, 300);
    };

    const { icon, className } = toastTypes[type] || toastTypes.info;

    return (
        <div className={`toast-item ${className} ${isFadingOut ? 'fade-out' : 'fade-in'}`}>
            <div className="toast-icon">
                {icon}
            </div>
            <div className="toast-content">
                <h4 className="toast-title">{title}</h4>
                <p className="toast-message">{message}</p>
            </div>
            <button className="toast-close-btn" onClick={handleClose}>
                <FaTimes />
            </button>
        </div>
    );
};

export default Toast;