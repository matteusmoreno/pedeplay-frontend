import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistDetails } from '../../services/artistService';
import { getActiveShowByArtist, getArtistRepertoire } from '../../services/showService';
import { getLiveStreamInfo } from '../../services/liveStreamService';
import { useWebSocket } from '../../hooks/useWebSocket';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import MakeRequestForm from '../../components/MakeRequestForm/MakeRequestForm';
import LiveStreamViewer from '../../components/LiveStreamViewer/LiveStreamViewer';
import BookingModal from '../../components/BookingModal/BookingModal'; // <-- NOVO COMPONENTE
import './PublicShowPage.css';
import {
    FaUserCircle,
    FaInstagram,
    FaFacebook,
    FaYoutube,
    FaBroadcastTower,
    FaHistory,
    FaMapMarkerAlt,
    FaCalendarCheck // <-- Ícone adicionado
} from 'react-icons/fa';

const PublicShowPage = () => {
    const { showId: artistId } = useParams();

    const [artist, setArtist] = useState(null);
    const [activeShow, setActiveShow] = useState(null);
    const [repertoire, setRepertoire] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [liveStreamInfo, setLiveStreamInfo] = useState(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false); // <-- Estado do Modal

    const [viewerId] = useState(() => {
        const storageKey = `pedeplay-viewer-${artistId}`;
        let existingId = sessionStorage.getItem(storageKey);

        if (!existingId) {
            existingId = `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem(storageKey, existingId);
        }

        return existingId;
    });

    // Refs para evitar loops no useEffect
    const activeShowRef = React.useRef(activeShow);
    const artistIdRef = React.useRef(artistId);

    // Atualiza refs quando valores mudam
    React.useEffect(() => {
        activeShowRef.current = activeShow;
        artistIdRef.current = artistId;
    }, [activeShow, artistId]);

    // WebSocket para atualizações em tempo real
    const { lastMessage, isConnected: wsConnected } = useWebSocket(artistId);

    // Busca inicial: apenas artista e show ativo
    const fetchInitialData = useCallback(async () => {
        if (!artistId) {
            setError('ID do artista não fornecido.');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);

            // Busca dados do artista
            const artistDetails = await getArtistDetails(artistId);
            setArtist(artistDetails);

            // Busca show ativo (apenas uma vez no início)
            const activeShowData = await getActiveShowByArtist(artistId);

            if (activeShowData && activeShowData.status === 'ACTIVE') {
                console.log('✅ Show ativo encontrado:', activeShowData.id);
                setActiveShow(activeShowData);

                // Busca repertório
                const repertoireData = await getArtistRepertoire(artistId);
                setRepertoire(repertoireData || []);

                // Busca live stream (apenas se houver show ativo)
                const liveStream = await getLiveStreamInfo(activeShowData.id);
                if (liveStream?.isActive) {
                    console.log('📹 Live stream ativa encontrada');
                    setLiveStreamInfo(liveStream);
                }
            } else {
                console.log('⏸️  Nenhum show ativo - modo aguardando');
                setActiveShow(null);
            }

        } catch (err) {
            console.error("❌ Erro ao carregar dados iniciais:", err);
            setError('Não foi possível carregar a página deste artista.');
        } finally {
            setIsLoading(false);
        }
    }, [artistId]);

    // Atualiza apenas a fila de pedidos (chamado quando há mudanças)
    const refreshShowData = useCallback(async () => {
        if (!activeShow) return;

        try {
            console.log('🔄 Atualizando dados do show...');
            const activeShowData = await getActiveShowByArtist(artistId);

            if (activeShowData && activeShowData.status === 'ACTIVE') {
                setActiveShow(activeShowData);
            } else {
                // Show foi encerrado
                setActiveShow(null);
                setRepertoire([]);
                setLiveStreamInfo(null);
            }
        } catch (err) {
            console.error("❌ Erro ao atualizar show:", err);
        }
    }, [activeShow, artistId]);

    // Carrega dados apenas uma vez no início
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // 🔥 PROCESSA MENSAGENS WEBSOCKET EM TEMPO REAL
    useEffect(() => {
        if (!lastMessage) return;

        console.log('📨 [PublicShowPage] WebSocket recebeu:', lastMessage.type, lastMessage);

        const messageType = lastMessage.type;

        const handleShowStarted = async () => {
            console.log('🎬 Show iniciou via WebSocket!');
            try {
                const activeShowData = await getActiveShowByArtist(artistIdRef.current);
                if (activeShowData && activeShowData.status === 'ACTIVE') {
                    setActiveShow(activeShowData);
                    const repertoireData = await getArtistRepertoire(artistIdRef.current);
                    setRepertoire(repertoireData || []);
                }
            } catch (err) {
                console.error('❌ Erro ao buscar show iniciado:', err);
            }
        };

        const handleLiveStreamStarted = async () => {
            console.log('📹 Transmissão iniciou via WebSocket!');
            const currentShow = activeShowRef.current;
            console.log('📋 Show atual:', currentShow?.id);
            if (currentShow) {
                try {
                    console.log('🔍 Buscando informações da livestream...');
                    const liveStream = await getLiveStreamInfo(currentShow.id);
                    console.log('📦 Livestream info:', liveStream);
                    if (liveStream?.isActive) {
                        console.log('✅ Livestream ativa! Exibindo player.');
                        setLiveStreamInfo(liveStream);
                    } else {
                        console.log('⚠️ Livestream não está ativa');
                    }
                } catch (err) {
                    console.error('❌ Erro ao buscar livestream:', err);
                }
            } else {
                console.log('⚠️ Nenhum show ativo para iniciar livestream');
            }
        };

        const handleNewSongRequest = async () => {
            console.log('🎵 Novo pedido via WebSocket - ID:', lastMessage.requestId);
            const currentShow = activeShowRef.current;
            if (currentShow) {
                try {
                    console.log('🔄 Buscando show atualizado para ver novo pedido...');
                    const activeShowData = await getActiveShowByArtist(artistIdRef.current);
                    if (activeShowData && activeShowData.status === 'ACTIVE') {
                        console.log('✅ Show atualizado! Total de pedidos:', activeShowData.requests?.length);
                        setActiveShow(activeShowData);
                    }
                } catch (err) {
                    console.error('❌ Erro ao atualizar pedidos:', err);
                }
            } else {
                console.log('⚠️ Não há show ativo para atualizar pedidos');
            }
        };

        const handleRequestStatusUpdated = () => {
            console.log('✏️ [PublicShowPage] Status do pedido atualizado via WebSocket', lastMessage);
            const currentShow = activeShowRef.current;

            if (!currentShow) {
                console.log('⚠️ [PublicShowPage] Sem show ativo');
                return;
            }

            if (!lastMessage.requestId) {
                console.log('⚠️ [PublicShowPage] requestId inválido na mensagem:', lastMessage);
                return;
            }

            const requestId = lastMessage.requestId;
            const newStatus = lastMessage.newStatus || lastMessage.status;

            console.log(`📝 [PublicShowPage] Pedido ${requestId} mudou para: ${newStatus}`);

            // Se foi marcado como PLAYED ou SKIPPED, remove da fila visualmente
            if (newStatus === 'PLAYED' || newStatus === 'SKIPPED') {
                console.log(`🗑️ [PublicShowPage] Removendo pedido ${requestId} da fila (${newStatus})`);
                setActiveShow(prev => {
                    const updatedRequests = prev.requests.filter(req => req.requestId !== requestId);
                    return {
                        ...prev,
                        requests: updatedRequests
                    };
                });
            } else {
                // Para outros status, atualiza o status do pedido
                console.log(`♻️ [PublicShowPage] Atualizando status do pedido ${requestId} para ${newStatus}`);
                setActiveShow(prev => ({
                    ...prev,
                    requests: prev.requests.map(req =>
                        req.requestId === requestId
                            ? { ...req, status: newStatus }
                            : req
                    )
                }));
            }
        };

        switch (messageType) {
            case 'show-started':
                handleShowStarted();
                break;

            case 'show-ended':
                console.log('🛑 Show encerrou via WebSocket!');
                setActiveShow(null);
                setRepertoire([]);
                setLiveStreamInfo(null);
                break;

            case 'new-song-request':
            case 'NEW_SONG_REQUEST':
                handleNewSongRequest();
                break;

            case 'request-status-updated':
            case 'REQUEST_STATUS_UPDATED':
                handleRequestStatusUpdated();
                break;

            case 'livestream-started':
                handleLiveStreamStarted();
                break;

            case 'livestream-ended':
                console.log('📴 Transmissão encerrada via WebSocket!');
                setLiveStreamInfo(null);
                break;

            case 'viewer-count-updated':
                if (lastMessage.count !== undefined) {
                    setLiveStreamInfo(prev => {
                        if (!prev) return prev; // Não atualiza se não há livestream
                        return {
                            ...prev,
                            currentViewers: lastMessage.count
                        };
                    });
                }
                break;

            default:
                console.log('📩 Mensagem WebSocket:', messageType);
        }
    }, [lastMessage]);

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

    if (isLoading) return <div className="public-page-message">Carregando...</div>;
    if (error) return <div className="public-page-message error">{error}</div>;
    if (!artist) return <div className="public-page-message error">Artista não encontrado.</div>;

    return (
        <div className="public-show-page">
            {/* --- Modal de Contratação --- */}
            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                artistId={artistId}
                artistName={artist.name}
            />

            <div className="public-page-layout">
                {/* --- Coluna 1: Artista --- */}
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

                        {artist.address && artist.address.city && (
                            <p className="artist-location">
                                <FaMapMarkerAlt />
                                {artist.address.city}, {artist.address.state}
                            </p>
                        )}

                        <div className={`live-status-badge ${isLive ? 'live' : 'offline'}`}>
                            <FaBroadcastTower />
                            <span>{isLive ? 'AO VIVO' : 'OFFLINE'}</span>
                        </div>

                        {/* --- BOTÃO DE CONTRATAR (NOVO) --- */}
                        <button className="btn-primary btn-hire" onClick={() => setIsBookingOpen(true)}>
                            <FaCalendarCheck /> Contratar Show
                        </button>
                        {/* -------------------------------- */}

                        {artist.biography && (
                            <p className="artist-bio">{artist.biography}</p>
                        )}

                        {hasSocialLinks && (
                            <div className="artist-social-links">
                                {artist.socialLinks.instagramUrl && <a href={artist.socialLinks.instagramUrl} target="_blank" rel="noreferrer"><FaInstagram /></a>}
                                {artist.socialLinks.facebookUrl && <a href={artist.socialLinks.facebookUrl} target="_blank" rel="noreferrer"><FaFacebook /></a>}
                                {artist.socialLinks.youtubeUrl && <a href={artist.socialLinks.youtubeUrl} target="_blank" rel="noreferrer"><FaYoutube /></a>}
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- Coluna 2: Conteúdo --- */}
                <main className="layout-column content-column">
                    {isLive ? (
                        <>
                            {liveStreamInfo && liveStreamInfo.isActive && (
                                <div className="card livestream-section">
                                    <h2>📺 Transmissão ao Vivo</h2>
                                    <LiveStreamViewer
                                        showId={activeShow.id}
                                        userId={viewerId}
                                        onStreamEnd={() => setLiveStreamInfo(null)}
                                    />
                                </div>
                            )}

                            <MakeRequestForm
                                artistId={artistId}
                                showId={activeShow.id}
                                repertoire={repertoire}
                                onSubmissionSuccess={refreshShowData}
                            />

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
                                    <p className="queue-empty-message">Ainda não há pedidos. Seja o primeiro!</p>
                                )}
                            </section>
                        </>
                    ) : (
                        <div className="offline-message-card card">
                            <h3>Show Encerrado</h3>
                            <p>O artista não está recebendo pedidos no momento.</p>
                            <p style={{ marginTop: '1rem' }}>Gostou do artista? <br /><strong>Solicite um orçamento para o seu evento clicando em "Contratar Show".</strong></p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default PublicShowPage;