/* * ========================================
 * ARQUIVO: src/components/SongRequestCard/SongRequestCard.js
 * (Adicionada prop 'isPublicView')
 * ========================================
 */
import React from 'react';
import './SongRequestCard.css';

// --- 1. Adicionada prop 'isPublicView' ---
const SongRequestCard = ({ request, onUpdateRequestStatus, isPublicView = false }) => {

    const { requestId, songTitle, songArtist, tipAmount, clientMessage, status } = request;

    // Formata o valor da gorjeta
    const formattedTip = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(tipAmount || 0);

    const isPending = status === 'PENDING';

    return (
        // --- 2. Adiciona classe 'public-view' se for o caso ---
        <div className={`song-request-card ${status.toLowerCase()} ${isPublicView ? 'public-view' : ''}`}>
            <div className="card-header">
                <h3 className="song-title">{songTitle}</h3>
                <span className="song-artist">{songArtist}</span>
            </div>

            {clientMessage && (
                <p className="client-message">
                    <strong>Mensagem:</strong> "{clientMessage}"
                </p>
            )}

            <div className="card-footer">
                <span className="tip-amount">
                    {tipAmount > 0 ? `Gorjeta: ${formattedTip}` : 'Pedido gratuito'}
                </span>
                <span className="request-status">
                    Status: {status}
                </span>
            </div>

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