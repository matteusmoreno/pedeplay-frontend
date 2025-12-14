/* ========================================
 * SONG REQUEST CARD COMPONENT
 * Com funcionalidade de "Ler mais" para mensagens longas
 * ======================================== */
import React, { useState } from 'react';
import './SongRequestCard.css';

const SongRequestCard = ({ request, onUpdateRequestStatus, isPublicView = false }) => {
    const { requestId, songTitle, songArtist, tipAmount, clientMessage, status } = request;
    const [isExpanded, setIsExpanded] = useState(false);

    // Formata o valor da gorjeta
    const formattedTip = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(tipAmount || 0);

    const isPending = status === 'PENDING';
    const isPendingPayment = status === 'PENDING_PAYMENT';

    // Limite de caracteres para mensagem
    const MAX_CHARS = 100;
    const shouldTruncate = clientMessage && clientMessage.length > MAX_CHARS;
    const displayMessage = shouldTruncate && !isExpanded 
        ? clientMessage.slice(0, MAX_CHARS) + '...' 
        : clientMessage;

    // Tradução de status para português
    const getStatusLabel = (status) => {
        const statusMap = {
            'PENDING': 'Pendente',
            'PENDING_PAYMENT': 'Aguardando Pagamento',
            'PLAYED': 'Tocada',
            'CANCELED': 'Cancelada',
            'REJECTED': 'Rejeitada'
        };
        return statusMap[status] || status;
    };

    return (
        <div className={`song-request-card ${status.toLowerCase().replace('_', '-')} ${isPublicView ? 'public-view' : ''}`}>
            <div className="card-header">
                <h3 className="song-title">{songTitle}</h3>
                <span className="song-artist">{songArtist}</span>
            </div>

            {clientMessage && (
                <div className="client-message">
                    <strong>Mensagem:</strong> "{displayMessage}"
                    {shouldTruncate && (
                        <button 
                            className="read-more-btn"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Mostrar menos' : 'Ler mais'}
                        </button>
                    )}
                </div>
            )}

            <div className="card-footer">
                <span className="tip-amount">
                    {tipAmount > 0 ? `Gorjeta: ${formattedTip}` : 'Pedido gratuito'}
                </span>
                <span className="request-status">
                    Status: {getStatusLabel(status)}
                </span>
            </div>

            {/* Aviso especial para pagamento pendente */}
            {isPendingPayment && (
                <div className="payment-warning">
                    ⏳ Aguardando confirmação do pagamento PIX
                </div>
            )}

            {/* --- 3. Condição para esconder botões --- */}
            {/* Só mostra botões se for PENDENTE e NÃO for 'isPublicView' */}
            {isPending && !isPublicView && (
                <div className="card-actions">
                    <button
                        className="btn-success"
                        onClick={() => onUpdateRequestStatus(requestId, 'PLAYED')}>
                        Marcar como Tocada
                    </button>
                    <button
                        className="btn-danger"
                        onClick={() => onUpdateRequestStatus(requestId, 'CANCELED')}>
                        Cancelar Pedido
                    </button>
                </div>
            )}
        </div>
    );
};

export default SongRequestCard;