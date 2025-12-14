import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import './PixPaymentModal.css';
import { FaCopy, FaCheckCircle, FaQrcode, FaClock, FaSpinner } from 'react-icons/fa';

const PixPaymentModal = ({ isOpen, onClose, paymentData, tipAmount, onPaymentConfirmed }) => {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutos em segundos
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset states quando modal fecha
            setPaymentConfirmed(false);
            setTimeLeft(600);
            return;
        }

        // Timer de expiração (10 minutos)
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
    }, [isOpen]);

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
                <div className="pix-header">
                    <FaQrcode className="pix-icon" />
                    <h2>Pagamento via PIX</h2>
                    <div className="payment-amount">
                        R$ {tipAmount.toFixed(2).replace('.', ',')}
                    </div>
                </div>

                {!paymentConfirmed ? (
                    <>
                        <div className="timer-section">
                            <FaClock />
                            <span>Tempo restante: {formatTime(timeLeft)}</span>
                        </div>

                        {paymentData.qrCodeBase64 && (
                            <div className="qr-code-section">
                                <div className="qr-code-container">
                                    <img
                                        src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                                        alt="QR Code PIX"
                                        className="qr-code-image"
                                    />
                                </div>
                                <p className="qr-instruction">
                                    Escaneie o QR Code com o app do seu banco
                                </p>
                            </div>
                        )}

                        <div className="divider">
                            <span>ou</span>
                        </div>

                        {paymentData.qrCodeCopyPaste && (
                            <div className="copy-paste-section">
                                <p className="copy-instruction">
                                    Copie o código PIX e cole no seu app de pagamento
                                </p>
                                <div className="pix-code-container">
                                    <input
                                        type="text"
                                        value={paymentData.qrCodeCopyPaste}
                                        readOnly
                                        className="pix-code-input"
                                    />
                                    <button
                                        onClick={handleCopyPixCode}
                                        className={`copy-button ${copied ? 'copied' : ''}`}
                                    >
                                        {copied ? (
                                            <>
                                                <FaCheckCircle /> Copiado!
                                            </>
                                        ) : (
                                            <>
                                                <FaCopy /> Copiar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="payment-status">
                            <FaSpinner className="spinner" />
                            <p>Aguardando confirmação do pagamento...</p>
                            <small>
                                Seu pedido será enviado automaticamente após a confirmação
                            </small>
                        </div>

                        <div className="info-box">
                            <p>
                                <strong>Importante:</strong> Após realizar o pagamento, mantenha esta
                                janela aberta. A confirmação pode levar alguns segundos.
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="payment-confirmed">
                        <FaCheckCircle className="success-icon" />
                        <h3>Pagamento Confirmado!</h3>
                        <p>Seu pedido foi enviado com sucesso para o artista.</p>
                    </div>
                )}

                <button 
                    onClick={() => {
                        if (paymentConfirmed && onPaymentConfirmed) {
                            onPaymentConfirmed();
                        }
                        onClose();
                    }} 
                    className="close-button"
                >
                    {paymentConfirmed ? 'Fechar' : 'Cancelar Pagamento'}
                </button>
            </div>
        </Modal>
    );
};

export default PixPaymentModal;
