import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getArtistDetails } from '../../services/artistService';
import { getActiveShowByArtist, getArtistRepertoire } from '../../services/showService';
import { getLiveStreamInfo } from '../../services/liveStreamService';
import { useWebSocket } from '../../hooks/useWebSocket';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import MakeRequestForm from '../../components/MakeRequestForm/MakeRequestForm';
import LiveStreamViewer from '../../components/LiveStreamViewer/LiveStreamViewer';
import BookingModal from '../../components/BookingModal/BookingModal';
import './PublicShowPage.css';
import {
    FaUserCircle,
    FaInstagram,
    FaFacebook,
    FaYoutube,
    FaBroadcastTower,
    FaHistory,
    FaMapMarkerAlt,
    FaCalendarCheck,
    FaMusic,
    FaUsers,
    FaFireAlt,
    FaClock,
    FaInfoCircle,
    FaCheckCircle,
    FaTimesCircle
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

    // Estatísticas do show
    const showStats = useMemo(() => {
        if (!activeShow || !activeShow.requests) return {
            total: 0,
            pending: 0,
            played: 0,
            totalTips: 0
        };

        const stats = activeShow.requests.reduce((acc, req) => {
            acc.total++;
            if (req.status === 'PENDING') acc.pending++;
            if (req.status === 'PLAYED') acc.played++;
            acc.totalTips += req.tipAmount || 0;
            return acc;
        }, { total: 0, pending: 0, played: 0, totalTips: 0 });

        return stats;
    }, [activeShow]);

    const hasSocialLinks = artist && artist.socialLinks && Object.values(artist.socialLinks).some(link => link);
    const isLive = activeShow && activeShow.status === 'ACTIVE';

    // Formatadores
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="public-show-page">
                <div className="public-loading">
                    <div className="loading-spinner"></div>
                    <p>Carregando informações do artista...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="public-show-page">
                <div className="public-error">
                    <FaTimesCircle className="error-icon" />
                    <h2>Erro ao Carregar</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="public-show-page">
                <div className="public-error">
                    <FaInfoCircle className="error-icon" />
                    <h2>Artista Não Encontrado</h2>
                    <p>O artista que você está procurando não foi encontrado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="public-show-page">
            <BookingModal
                isOpen={isBookingOpen}
                onClose={() => setIsBookingOpen(false)}
                artistId={artistId}
                artistName={artist.name}
            />

            <div className="public-page-container">
                {/* === HEADER DO ARTISTA === */}
                <header className="show-header">
                    <div className="show-header-background"></div>
                    <div className="show-header-content">
                        <div className="artist-profile">
                            <div className="artist-avatar-wrapper">
                                {artist.profileImageUrl ? (
                                    <img 
                                        src={artist.profileImageUrl} 
                                        alt={artist.name} 
                                        className="artist-avatar-img" 
                                    />
                                ) : (
                                    <div className="artist-avatar-placeholder">
                                        <FaUserCircle />
                                    </div>
                                )}
                                <div className={`status-indicator ${isLive ? 'live' : 'offline'}`}>
                                    <span className="status-dot"></span>
                                </div>
                            </div>

                            <div className="artist-main-info">
                                <h1 className="artist-name">{artist.name}</h1>
                                
                                {artist.address && artist.address.city && (
                                    <p className="artist-location">
                                        <FaMapMarkerAlt />
                                        <span>{artist.address.city}, {artist.address.state}</span>
                                    </p>
                                )}

                                <div className="artist-badges">
                                    <div className={`status-badge ${isLive ? 'live' : 'offline'}`}>
                                        <FaBroadcastTower />
                                        <span>{isLive ? 'AO VIVO AGORA' : 'OFFLINE'}</span>
                                    </div>
                                    {isLive && liveStreamInfo?.currentViewers !== undefined && (
                                        <div className="viewers-badge">
                                            <FaUsers />
                                            <span>{liveStreamInfo.currentViewers} assistindo</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="artist-actions">
                            <button 
                                className="btn-hire-show" 
                                onClick={() => setIsBookingOpen(true)}
                            >
                                <FaCalendarCheck />
                                <span>Contratar Show</span>
                            </button>

                            {hasSocialLinks && (
                                <div className="artist-social">
                                    {artist.socialLinks.instagramUrl && (
                                        <a 
                                            href={artist.socialLinks.instagramUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="social-link"
                                            aria-label="Instagram"
                                        >
                                            <FaInstagram />
                                        </a>
                                    )}
                                    {artist.socialLinks.facebookUrl && (
                                        <a 
                                            href={artist.socialLinks.facebookUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="social-link"
                                            aria-label="Facebook"
                                        >
                                            <FaFacebook />
                                        </a>
                                    )}
                                    {artist.socialLinks.youtubeUrl && (
                                        <a 
                                            href={artist.socialLinks.youtubeUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="social-link"
                                            aria-label="YouTube"
                                        >
                                            <FaYoutube />
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* === BIOGRAFIA (SE HOUVER) === */}
                {artist.biography && (
                    <section className="artist-bio-section">
                        <div className="bio-content">
                            <FaInfoCircle className="bio-icon" />
                            <p>{artist.biography}</p>
                        </div>
                    </section>
                )}

                {/* === ESTATÍSTICAS DO SHOW (SE ATIVO) === */}
                {isLive && (
                    <section className="show-stats-section">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon total">
                                    <FaMusic />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{showStats.total}</span>
                                    <span className="stat-label">Total de Pedidos</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon pending">
                                    <FaClock />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{showStats.pending}</span>
                                    <span className="stat-label">Na Fila</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon played">
                                    <FaCheckCircle />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{showStats.played}</span>
                                    <span className="stat-label">Tocadas</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon tips">
                                    <FaFireAlt />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-value">{formatCurrency(showStats.totalTips)}</span>
                                    <span className="stat-label">Em Gorjetas</span>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* === CONTEÚDO PRINCIPAL === */}
                <div className="show-main-content">
                    {isLive ? (
                        <>
                            {/* Live Stream */}
                            {liveStreamInfo && liveStreamInfo.isActive && (
                                <section className="livestream-card">
                                    <div className="livestream-header">
                                        <h2>
                                            <FaBroadcastTower />
                                            <span>Transmissão ao Vivo</span>
                                        </h2>
                                        <div className="live-indicator">
                                            <span className="live-dot"></span>
                                            <span>AO VIVO</span>
                                        </div>
                                    </div>
                                    <div className="livestream-player">
                                        <LiveStreamViewer
                                            showId={activeShow.id}
                                            userId={viewerId}
                                            onStreamEnd={() => setLiveStreamInfo(null)}
                                        />
                                    </div>
                                </section>
                            )}

                            {/* Formulário de Pedido */}
                            <section className="request-form-card">
                                <MakeRequestForm
                                    artistId={artistId}
                                    showId={activeShow.id}
                                    repertoire={repertoire}
                                    onSubmissionSuccess={refreshShowData}
                                />
                            </section>

                            {/* Fila de Pedidos */}
                            <section className="queue-card">
                                <div className="queue-header">
                                    <div className="queue-title">
                                        <FaHistory />
                                        <h2>Fila de Pedidos</h2>
                                    </div>
                                    <div className="queue-count">
                                        <span className="count-badge">{pendingRequests.length}</span>
                                        <span className="count-label">
                                            {pendingRequests.length === 1 ? 'pedido' : 'pedidos'}
                                        </span>
                                    </div>
                                </div>

                                {pendingRequests.length > 0 ? (
                                    <div className="queue-list">
                                        {pendingRequests.map((req, index) => (
                                            <div key={req.requestId} className="queue-item-wrapper">
                                                <div className="queue-position">
                                                    <span>{index + 1}</span>
                                                </div>
                                                <SongRequestCard
                                                    request={req}
                                                    isPublicView={true}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="queue-empty">
                                        <FaMusic className="empty-icon" />
                                        <h3>Nenhum pedido na fila</h3>
                                        <p>Seja o primeiro a fazer um pedido!</p>
                                    </div>
                                )}
                            </section>
                        </>
                    ) : (
                        <section className="offline-card">
                            <div className="offline-icon-wrapper">
                                <FaBroadcastTower className="offline-icon" />
                            </div>
                            <h2>Show Encerrado</h2>
                            <p className="offline-message">
                                O artista não está recebendo pedidos no momento.
                            </p>
                            <div className="offline-cta">
                                <FaInfoCircle />
                                <p>
                                    Gostou do {artist.name}?<br />
                                    <strong>Solicite um orçamento para o seu evento!</strong>
                                </p>
                                <button 
                                    className="btn-hire-offline" 
                                    onClick={() => setIsBookingOpen(true)}
                                >
                                    <FaCalendarCheck />
                                    <span>Contratar Show</span>
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicShowPage;