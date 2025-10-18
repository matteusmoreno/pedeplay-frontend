import React, { useState, useEffect } from 'react';
import { getSongList, makeSongRequest } from '../../services/showService';
import './MakeRequestForm.css';

const MakeRequestForm = ({ artistId, showId }) => {
    const [songId, setSongId] = useState('');
    const [tipAmount, setTipAmount] = useState('');
    const [clientMessage, setClientMessage] = useState('');

    const [songList, setSongList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Carrega a lista de músicas (repertório)
    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const data = await getSongList();
                setSongList(data);
            } catch (err) {
                console.error("Erro ao buscar músicas:", err);
            }
        };
        fetchSongs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!songId) {
            setError("Por favor, selecione uma música.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const requestData = {
            artistId: artistId,
            songId: songId,
            tipAmount: tipAmount ? parseFloat(tipAmount) : 0, // Envia 0 se estiver vazio
            clientMessage: clientMessage,
        };

        try {
            await makeSongRequest(requestData);
            setSuccess('Seu pedido foi enviado com sucesso!');
            // Limpa o formulário
            setSongId('');
            setTipAmount('');
            setClientMessage('');
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao enviar pedido.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card make-request-form">
            <h2>Faça seu Pedido</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="song">Música</label>
                    <select
                        id="song"
                        value={songId}
                        onChange={(e) => setSongId(e.target.value)}
                        required
                    >
                        <option value="" disabled>Selecione uma música do repertório</option>
                        {songList.map((song) => (
                            // O 'id' no backend é um ObjectId, mas o service/controller deve expor como string
                            <option key={song.id} value={song.id}>
                                {song.title} - {song.artistName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="tipAmount">Gorjeta (Opcional)</label>
                    <div className="tip-input-group">
                        <span>R$</span>
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
                </div>

                <div className="form-group">
                    <label htmlFor="clientMessage">Mensagem (Opcional)</label>
                    <textarea
                        id="clientMessage"
                        placeholder="Deixe uma dedicatória ou mensagem para o artista..."
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                    />
                </div>

                {error && <p className="message error">{error}</p>}
                {success && <p className="message success">{success}</p>}

                <button type="submit" className="btn-primary" disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Enviar Pedido'}
                </button>
            </form>
        </div>
    );
};

export default MakeRequestForm;