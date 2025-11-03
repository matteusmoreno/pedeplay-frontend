/* * ========================================
 * ARQUIVO: src/pages/PublicShowPage/PublicShowPage.js
 * (Layout de 2 colunas REFORMULADO para melhor UX)
 * ========================================
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistDetails } from '../../services/artistService';
import { getActiveShowByArtist, getArtistRepertoire } from '../../services/showService';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import MakeRequestForm from '../../components/MakeRequestForm/MakeRequestForm';
import './PublicShowPage.css';
// --- 1. Adicionar FaHistory e FaMapMarkerAlt ---
import {
    FaUserCircle,
    FaInstagram,
    FaFacebook,
    FaYoutube,
    FaBroadcastTower,
    FaHistory,
    FaMapMarkerAlt // <-- ADICIONADO
} from 'react-icons/fa';

const PublicShowPage = () => {
    const { showId: artistId } = useParams();

    const [artist, setArtist] = useState(null);
    const [activeShow, setActiveShow] = useState(null);
    const [repertoire, setRepertoire] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPageData = useCallback(async () => {
        if (!artistId) {
            setError('ID do artista não fornecido.');
            setIsLoading(false);
            return;
        }

        try {
            // Só busca o artista se ainda não o tiver
            if (!artist) {
                setIsLoading(true);
                const artistDetails = await getArtistDetails(artistId);
                setArtist(artistDetails);
            }

            const activeShowData = await getActiveShowByArtist(artistId);

            if (activeShowData && activeShowData.status === 'ACTIVE') {
                setActiveShow(activeShowData);

                // Só busca o repertório se ainda não o tiver
                if (repertoire.length === 0) {
                    const repertoireData = await getArtistRepertoire(artistId);
                    setRepertoire(repertoireData || []);
                }
            } else {
                setActiveShow(null);
                setRepertoire([]);
            }

        } catch (err) {
            console.error("Erro ao carregar dados da página:", err);
            setError('Não foi possível carregar a página deste artista.');
        } finally {
            setIsLoading(false);
        }
    }, [artistId, artist, repertoire.length]); // Dependências atualizadas

    useEffect(() => {
        fetchPageData();
    }, [fetchPageData]);

    const pendingRequests = useMemo(() => {
        if (!activeShow || !activeShow.requests) return [];
        return activeShow.requests
            .filter(req => req.status === 'PENDING')
            .sort((a, b) => {
                if (a.tipAmount > b.tipAmount) return -1;
                if (a.tipAmount < b.tipAmount) return 1;
                return new Date(a.receivedAt) - new Date(b.receivedAt);
            });
    }, [activeShow]);

    const hasSocialLinks = artist && artist.socialLinks && Object.values(artist.socialLinks).some(link => link);
    const isLive = activeShow && activeShow.status === 'ACTIVE';

    if (isLoading) {
        return <div className="public-page-message">Carregando...</div>;
    }

    if (error) {
        return <div className="public-page-message error">{error}</div>;
    }

    if (!artist) {
        return <div className="public-page-message error">Artista não encontrado.</div>;
    }

    return (
        <div className="public-show-page">

            {/* --- INÍCIO DA REFORMULAÇÃO --- */}
            <div className="public-page-layout">

                {/* --- Coluna 1: Informações do Artista (Sticky) --- */}
                <aside className="layout-column artist-info-column card">
                    <div className="artist-avatar">
                        {artist.profileImageUrl ? (
                            <img src={artist.profileImageUrl} alt={artist.name} className="profile-avatar-image" />
                        ) : (
                            <FaUserCircle className="profile-avatar-placeholder" />
                        )}
                    </div>
                    <div className="artist-info">
                        <h1 className="artist-name">{artist.name}</h1>

                        {/* --- NOVO: Localização --- */}
                        {artist.address && artist.address.city && (
                            <p className="artist-location">
                                <FaMapMarkerAlt />
                                {artist.address.city}, {artist.address.state}
                            </p>
                        )}
                        {/* --- FIM: Localização --- */}

                        <div className={`live-status-badge ${isLive ? 'live' : 'offline'}`}>
                            <FaBroadcastTower />
                            <span>{isLive ? 'AO VIVO' : 'OFFLINE'}</span>
                        </div>

                        {artist.biography && (
                            <p className="artist-bio">{artist.biography}</p>
                        )}

                        {hasSocialLinks && (
                            <div className="artist-social-links">
                                {artist.socialLinks.instagramUrl && (
                                    <a href={artist.socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                                )}
                                {artist.socialLinks.facebookUrl && (
                                    <a href={artist.socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                                )}
                                {artist.socialLinks.youtubeUrl && (
                                    <a href={artist.socialLinks.youtubeUrl} target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
                                )}
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- Coluna 2: Conteúdo Principal (Formulário e Fila) --- */}
                <main className="layout-column content-column">
                    {isLive ? (
                        <>
                            {/* 1. Formulário de Pedido */}
                            <MakeRequestForm
                                artistId={artistId}
                                showId={activeShow.id}
                                repertoire={repertoire}
                                onSubmissionSuccess={fetchPageData}
                            />

                            {/* 2. Fila de Pedidos */}
                            <section className="song-queue-section card">
                                <div className="form-header">
                                    <FaHistory />
                                    <h2>Pedidos na Fila</h2>
                                </div>

                                {pendingRequests.length > 0 ? (
                                    <div className="queue-list-container">
                                        {pendingRequests.map(req => (
                                            <SongRequestCard
                                                key={req.requestId}
                                                request={req}
                                                isPublicView={true}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="queue-empty-message">
                                        Ainda não há pedidos. Seja o primeiro!
                                    </p>
                                )}
                            </section>
                        </>
                    ) : (
                        // Mensagem de Artista Offline
                        <div className="offline-message-card card">
                            <h3>Show Encerrado</h3>
                            <p>O artista não está recebendo pedidos no momento. Volte mais tarde!</p>
                        </div>
                    )}
                </main>

            </div>
            {/* --- FIM DA REFORMULAÇÃO --- */}
        </div>
    );
};

export default PublicShowPage;