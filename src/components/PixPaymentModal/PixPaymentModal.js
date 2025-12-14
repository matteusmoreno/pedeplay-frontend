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
                        {/* Header com valor */}
                        <div className="pix-header">
                            <div className="pix-logo">
                                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath fill='%2300b894' d='M242.4 292.5C247.8 287.1 257.1 287.1 262.5 292.5L339.5 369.5C353.7 383.7 372.6 391.5 392.6 391.5H407.7L310.6 488.6C280.3 518.1 231.1 518.1 200.8 488.6L103.3 391.5H112.6C132.6 391.5 151.5 383.7 165.7 369.5L242.4 292.5zM262.5 218.9C257.1 224.3 247.8 224.3 242.4 218.9L165.7 142.1C151.5 127.9 132.6 120.1 112.6 120.1H103.3L200.7 22.76C231.1-7.586 280.3-7.586 310.6 22.76L407.7 120.1H392.6C372.6 120.1 353.7 127.9 339.5 142.1L262.5 218.9zM112.6 142.1C126.4 142.1 139.1 148.3 149.7 158.1L226.4 236.1C239.9 250.1 255.5 257.1 271.1 257.1C288.5 257.1 304.1 250.1 317.6 236.1L394.3 158.1C404.9 148.3 417.6 142.1 431.4 142.1H496C504.8 142.1 512 149.2 512 158V352C512 360.8 504.8 368 496 368H431.4C417.6 368 404.9 361.7 394.3 351.9L317.6 274.9C304.1 261.9 288.5 254.1 271.1 254.1C255.5 254.1 239.9 261.9 226.4 274.9L149.7 351.9C139.1 361.7 126.4 368 112.6 368H16C7.164 368 0 360.8 0 352V158C0 149.2 7.164 142.1 16 142.1H112.6z'/%3E%3C/svg%3E" alt="PIX" className="pix-brand" />
                                <span className="pix-title">Pagar com PIX</span>
                            </div>
                            <div className="payment-value">
                                <span className="currency">R$</span>
                                <span className="amount">{tipAmount.toFixed(2).replace('.', ',')}</span>
                            </div>
                            <div className="timer-badge">
                                <FaClock />
                                <span>{formatTime(timeLeft)}</span>
                            </div>
                        </div>

                        {/* Tabs de seleção */}
                        <div className="payment-tabs">
                            <button 
                                className={`tab ${activeTab === 'qrcode' ? 'active' : ''}`}
                                onClick={() => setActiveTab('qrcode')}
                            >
                                <FaQrcode />
                                <span>QR Code</span>
                            </button>
                            <button 
                                className={`tab ${activeTab === 'copypaste' ? 'active' : ''}`}
                                onClick={() => setActiveTab('copypaste')}
                            >
                                <FaCopy />
                                <span>Pix Copia e Cola</span>
                            </button>
                        </div>

                        {/* Conteúdo das tabs */}
                        <div className="tab-content">
                            {activeTab === 'qrcode' && paymentData.qrCodeBase64 && (
                                <div className="qr-code-section">
                                    <div className="instruction-card">
                                        <FaMobileAlt className="instruction-icon" />
                                        <p>Abra o app do seu banco e escaneie o QR Code</p>
                                    </div>
                                    <div className="qr-code-wrapper">
                                        <div className="qr-code-container">
                                            <img
                                                src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                                                alt="QR Code PIX"
                                                className="qr-code-image"
                                            />
                                            <div className="qr-code-overlay">
                                                <div className="qr-corner qr-corner-tl"></div>
                                                <div className="qr-corner qr-corner-tr"></div>
                                                <div className="qr-corner qr-corner-bl"></div>
                                                <div className="qr-corner qr-corner-br"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'copypaste' && paymentData.qrCodeCopyPaste && (
                                <div className="copy-paste-section">
                                    <div className="instruction-card">
                                        <FaCopy className="instruction-icon" />
                                        <p>Copie o código e cole no app do seu banco em "Pix Copia e Cola"</p>
                                    </div>
                                    <div className="pix-code-wrapper">
                                        <div className="pix-code-display">
                                            <code>{paymentData.qrCodeCopyPaste.substring(0, 60)}...</code>
                                        </div>
                                        <button
                                            onClick={handleCopyPixCode}
                                            className={`copy-button-large ${copied ? 'copied' : ''}`}
                                        >
                                            {copied ? (
                                                <>
                                                    <FaCheckCircle className="icon" />
                                                    <span>Código Copiado!</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FaCopy className="icon" />
                                                    <span>Copiar Código PIX</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status de aguardando pagamento */}
                        <div className="payment-status">
                            <div className="status-icon">
                                <FaSpinner className="spinner" />
                            </div>
                            <div className="status-text">
                                <p className="status-title">Aguardando pagamento</p>
                                <p className="status-subtitle">
                                    Após o pagamento, seu pedido será confirmado automaticamente
                                </p>
                            </div>
                        </div>

                        {/* Info box */}
                        <div className="info-box">
                            <FaInfoCircle />
                            <p>Não feche esta janela até a confirmação do pagamento</p>
                        </div>

                        {/* Botão cancelar */}
                        <button onClick={onClose} className="cancel-button">
                            Cancelar Pagamento
                        </button>
                    </>
                ) : (
                    <div className="payment-confirmed">
                        <div className="success-animation">
                            <FaCheckCircle className="success-icon" />
                            <div className="success-ring"></div>
                        </div>
                        <h3>Pagamento Confirmado!</h3>
                        <p>Seu pedido foi enviado com sucesso e está na fila do artista.</p>
                        <button 
                            onClick={() => {
                                if (onPaymentConfirmed) onPaymentConfirmed();
                                onClose();
                            }} 
                            className="success-button"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PixPaymentModal;
