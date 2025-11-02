/* * ========================================
 * ARQUIVO: src/pages/PublicShowPage/PublicShowPage.js
 * ========================================
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// Importações corrigidas
import { getShowDetails, getArtistRepertoire } from '../../services/showService';
// A importação 'useWebSocket' foi removida para corrigir o aviso,
// já que ela não estava sendo utilizada no código.
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import MakeRequestForm from '../../components/MakeRequestForm/MakeRequestForm';
import './PublicShowPage.css';

const PublicShowPage = () => {
    const { showId } = useParams();
    const [artistName, setArtistName] = useState('');
    const [repertoire, setRepertoire] = useState([]);
    const [songRequests, setSongRequests] = useState([]);
    const [error, setError] = useState('');

    // A lógica do useWebSocket() foi removida por enquanto.

    useEffect(() => {
        const fetchShowData = async () => {
            try {
                // Agora esta função existe no service
                const showDetails = await getShowDetails(showId);
                setArtistName(showDetails.artistName);
                setSongRequests(showDetails.songRequests);

                // E esta também
                const repertoireData = await getArtistRepertoire(showDetails.artistId);
                setRepertoire(repertoireData.repertoire);
            } catch (err) {
                setError('Erro ao carregar dados do show. Verifique o link ou tente mais tarde.');
            }
        };

        fetchShowData();
    }, [showId]);

    // ... (funções handleNewSongRequest e handleStatusUpdate, se existirem)

    if (error) {
        return <div className="container error-container">{error}</div>;
    }

    return (
        <div className="public-show-container">
            <header className="show-header">
                <h1>{artistName || 'Carregando...'}</h1>
                <p>Faça seu pedido de música!</p>
            </header>

            <MakeRequestForm repertoire={repertoire} showId={showId} />

            <section className="song-requests-list">
                <h2>Pedidos na fila</h2>
                {songRequests.length === 0 ? (
                    <p>Ainda não há pedidos. Seja o primeiro!</p>
                ) : (
                    songRequests.map(request => (
                        <SongRequestCard key={request.id} request={request} />
                    ))
                )}
            </section>
        </div>
    );
};

export default PublicShowPage;