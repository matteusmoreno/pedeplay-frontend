/* * ========================================
 * ARQUIVO: src/components/MakeRequestForm/MakeRequestForm.js
 * (Chama a função de atualização)
 * ========================================
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { makeSongRequest } from '../../services/showService';
import PixPaymentModal from '../PixPaymentModal/PixPaymentModal';
import './MakeRequestForm.css';
import {
    FaDollarSign,
    FaMusic,
    FaPaperPlane,
    FaGift,
    FaSearch,
    FaCheckCircle
} from 'react-icons/fa';

// 1. Aceitar a nova prop 'onSubmissionSuccess'
const MakeRequestForm = ({ artistId, showId, repertoire, onSubmissionSuccess }) => {
    const [songId, setSongId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);

    const [tipAmount, setTipAmount] = useState('');
    const [clientMessage, setClientMessage] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Estados para controle do pagamento PIX
    const [showPixModal, setShowPixModal] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    const searchRef = useRef(null);

    const filteredRepertoire = useMemo(() => {
        if (!searchTerm) return [];
        return repertoire.filter(song =>
            song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artistName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, repertoire]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setSongId('');
        setShowResults(true);
        setError(null);
    };

    const handleSongSelect = (song) => {
        setSongId(song.id);
        setSearchTerm(`${song.title} - ${song.artistName}`);
        setShowResults(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!songId) {
            setError("Por favor, selecione uma música da lista.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const requestData = {
            artistId: artistId,
            songId: songId,
            tipAmount: tipAmount ? parseFloat(tipAmount) : 0,
            clientMessage: clientMessage,
            clientEmail: clientEmail || null,
        };

        try {
            const response = await makeSongRequest(requestData);
            
            // Verifica se há dados de pagamento PIX na resposta
            if (response.payment && response.payment.paymentId) {
                // Tem pagamento PIX - abre modal
                setPaymentData(response.payment);
                setShowPixModal(true);
                setSuccess('Escaneie o QR Code para confirmar o pagamento.');
            } else {
                // Pedido gratuito - sucesso imediato
                setSuccess('Seu pedido foi enviado com sucesso!');
                
                // Recarrega os dados da fila
                if (onSubmissionSuccess) {
                    onSubmissionSuccess();
                }

                // Limpa o formulário após 2 segundos
                setTimeout(() => {
                    setSongId('');
                    setSearchTerm('');
                    setTipAmount('');
                    setClientMessage('');
                    setClientEmail('');
                    setSuccess(null);
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Erro ao enviar pedido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="make-request-form">

            <div className="form-header">
                <FaPaperPlane />
                <h2>Faça seu Pedido</h2>
            </div>

            <form onSubmit={handleSubmit}>

                <div className="form-group search-song-group" ref={searchRef}>
                    <label htmlFor="songSearch"><FaMusic /> Música</label>

                    <div className="search-input-group">
                        <span className="search-icon"><FaSearch /></span>
                        <input
                            type="text"
                            id="songSearch"
                            placeholder="Buscar por título ou artista..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => setShowResults(true)}
                            autoComplete="off"
                        />
                        {songId && (
                            <span className="search-icon-selected"><FaCheckCircle /></span>
                        )}
                    </div>

                    {showResults && filteredRepertoire.length > 0 && (
                        <div className="song-list-container public-search-results">
                            <ul className="song-list">
                                {filteredRepertoire.map(song => (
                                    <li
                                        key={song.id}
                                        className="song-list-item"
                                        onClick={() => handleSongSelect(song)}
                                    >
                                        <div>
                                            <span className="song-title">{song.title}</span>
                                            <span className="song-artist">{song.artistName}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>


                <div className="form-group">
                    <label htmlFor="tipAmount"><FaGift /> Gorjeta (Opcional)</label>
                    <div className="tip-input-group">
                        <span><FaDollarSign /></span>
                        <input
                            type="number"
                            id="tipAmount"
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            value={tipAmount}
                            onChange={(e) => setTipAmount(e.target.value)}
                        />
                    </div>
                    <small className="tip-info">Pedidos com gorjeta têm prioridade na fila!</small>
                </div>

                {/* Campo de email aparece apenas se houver gorjeta */}
                {tipAmount && parseFloat(tipAmount) > 0 && (
                    <div className="form-group email-group">
                        <label htmlFor="clientEmail">Seu Email (Opcional)</label>
                        <input
                            type="email"
                            id="clientEmail"
                            placeholder="seu@email.com"
                            value={clientEmail}
                            onChange={(e) => setClientEmail(e.target.value)}
                        />
                        <small className="email-info">Para receber confirmação do pagamento</small>
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="clientMessage">Mensagem (Opcional)</label>
                    <textarea
                        id="clientMessage"
                        placeholder="Deixe uma dedicatória ou mensagem para o artista..."
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        rows={3}
                    />
                </div>

                {error && <div className="form-message error-message">{error}</div>}
                {success && <div className="form-message success-message">{success}</div>}

                <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Enviar Pedido'}
                </button>
            </form>

            {/* Modal de Pagamento PIX */}
            <PixPaymentModal
                isOpen={showPixModal}
                onClose={() => {
                    setShowPixModal(false);
                    setPaymentData(null);
                    // Limpa o formulário
                    setSongId('');
                    setSearchTerm('');
                    setTipAmount('');
                    setClientEmail('');
                    setClientMessage('');
                    setSuccess(null);
                    // Recarrega a fila
                    if (onSubmissionSuccess) {
                        onSubmissionSuccess();
                    }
                }}
                paymentData={paymentData}
                tipAmount={parseFloat(tipAmount) || 0}
            />
        </div>
    );
};

export default MakeRequestForm;