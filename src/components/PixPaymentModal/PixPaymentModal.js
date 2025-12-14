import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import './PixPaymentModal.css';
import { FaCopy, FaCheckCircle, FaQrcode, FaClock, FaSpinner, FaMobileAlt, FaInfoCircle } from 'react-icons/fa';
import { useWebSocket } from '../../hooks/useWebSocket';

const PixPaymentModal = ({ isOpen, onClose, paymentData, tipAmount, onPaymentConfirmed, artistId, showId }) => {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(1800); // 30 minutos em segundos
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const [activeTab, setActiveTab] = useState('qrcode'); // 'qrcode' ou 'copypaste'

    // WebSocket para escutar atualizações em tempo real
    const { lastMessage } = useWebSocket(artistId);

    useEffect(() => {
        if (!isOpen) {
            // Reset states quando modal fecha
            setPaymentConfirmed(false);
            setTimeLeft(1800);
            return;
        }

        // Calcula tempo restante baseado na data de expiração do backend
        if (paymentData?.expirationDate) {
            const expirationTime = new Date(paymentData.expirationDate).getTime();
            const now = new Date().getTime();
            const secondsLeft = Math.max(0, Math.floor((expirationTime - now) / 1000));
            setTimeLeft(secondsLeft);
        }

        // Timer de expiração
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, paymentData]);

    // Escuta atualizações via WebSocket para detectar confirmação de pagamento
    useEffect(() => {
        if (!isOpen || !lastMessage || !paymentData?.paymentId) return;

        console.log('📩 [PixPaymentModal] Mensagem WebSocket recebida:', lastMessage);

        // Verifica se é uma notificação de novo pedido ou atualização de status
        const messageType = lastMessage.type;
        
        if (messageType === 'NEW_REQUEST' || messageType === 'new-song-request') {
            // Novo pedido foi confirmado (significa que o pagamento foi aprovado)
            console.log('✅ [PixPaymentModal] Novo pedido detectado - Pagamento confirmado!');
            setPaymentConfirmed(true);
            
            // Fecha automaticamente após 3 segundos
            setTimeout(() => {
                if (onPaymentConfirmed) onPaymentConfirmed();
                onClose();
            }, 3000);
        }

        if (messageType === 'REQUEST_STATUS_UPDATE' || messageType === 'request-status-updated') {
            const newStatus = lastMessage.newStatus || lastMessage.status;
            console.log('📝 [PixPaymentModal] Status atualizado:', newStatus);
            
            // Se mudou de PENDING_PAYMENT para PENDING = pagamento aprovado
            if (newStatus === 'PENDING') {
                console.log('✅ [PixPaymentModal] Pagamento confirmado via atualização de status!');
                setPaymentConfirmed(true);
                
                setTimeout(() => {
                    if (onPaymentConfirmed) onPaymentConfirmed();
                    onClose();
                }, 3000);
            }
        }
    }, [lastMessage, isOpen, paymentData, onPaymentConfirmed, onClose]);

    // Polling como fallback (verifica a cada 5 segundos se o pedido apareceu na fila)
    useEffect(() => {
        if (!isOpen || !showId || !paymentData?.paymentId) return;

        const checkPaymentStatus = async () => {
            try {
                // Importa o serviço dinamicamente para evitar circular dependency
                const { getShowDetails } = await import('../../services/showService');
                const show = await getShowDetails(showId);
                
                // Procura o pedido com o paymentId atual
                const request = show.requests?.find(req => 
                    req.paymentId === String(paymentData.paymentId)
                );

                if (request) {
                    console.log('🔍 [PixPaymentModal] Pedido encontrado via polling:', request);
                    
                    // Se o status mudou de PENDING_PAYMENT para PENDING
                    if (request.status === 'PENDING') {
                        console.log('✅ [PixPaymentModal] Pagamento confirmado via polling!');
                        setPaymentConfirmed(true);
                        
                        setTimeout(() => {
                            if (onPaymentConfirmed) onPaymentConfirmed();
                            onClose();
                        }, 3000);
                    }
                }
            } catch (error) {
                console.error('❌ [PixPaymentModal] Erro ao verificar status:', error);
            }
        };

        // Verifica a cada 5 segundos
        const pollingInterval = setInterval(checkPaymentStatus, 5000);

        // Primeira verificação imediata
        checkPaymentStatus();

        return () => clearInterval(pollingInterval);
    }, [isOpen, showId, paymentData, onPaymentConfirmed, onClose]);

    const handleCopyPixCode = () => {
        if (paymentData?.qrCodeCopyPaste) {
            navigator.clipboard.writeText(paymentData.qrCodeCopyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isOpen || !paymentData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="pix-payment-modal">
                {!paymentConfirmed ? (
                    <>
                        {/* Header simplificado */}
                        <div className="pix-header">
                            <h3>Pagamento PIX</h3>
                            <div className="payment-amount">
                                R$ {tipAmount.toFixed(2).replace('.', ',')}
                            </div>
                            <div className="timer-info">
                                <FaClock /> {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Conteúdo principal */}
                        <div className="pix-content">
                            {/* QR Code sempre visível */}
                            {paymentData.qrCodeBase64 && (
                                <div className="qr-section">
                                    <p className="instruction">Escaneie com o app do seu banco</p>
                                    <div className="qr-code-box">
                                        <img
                                            src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                                            alt="QR Code PIX"
                                            className="qr-image"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Botão de copiar */}
                            {paymentData.qrCodeCopyPaste && (
                                <button
                                    onClick={handleCopyPixCode}
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                >
                                    {copied ? (
                                        <>
                                            <FaCheckCircle /> Código Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <FaCopy /> Copiar Código Pix
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Status */}
                            <div className="status-bar">
                                <FaSpinner className="spinner" />
                                <span>Aguardando pagamento...</span>
                            </div>
                        </div>

                        {/* Botão cancelar */}
                        <button onClick={onClose} className="btn-cancel">
                            Cancelar
                        </button>
                    </>
                ) : (
                    <div className="payment-success">
                        <div className="success-icon-wrapper">
                            <FaCheckCircle className="success-icon" />
                        </div>
                        <h3>Pagamento Confirmado!</h3>
                        <p>Seu pedido está na fila</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PixPaymentModal;
