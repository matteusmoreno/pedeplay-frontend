/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardHome.js
 * (Substituindo Notificação Nativa por Toast Customizado)
 * ========================================
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { startShow, endShow, updateRequestStatus } from '../../services/artistService';
import { getActiveShowByArtist, getPastShowsByArtist } from '../../services/showService';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import Modal from '../../components/Modal/Modal';
import LiveStreamFloating from '../../components/LiveStreamBroadcaster/LiveStreamFloating';
import {
    FaPlay,
    FaStop,
    FaSatelliteDish,
    FaClock,
    FaMusic,
    FaGift,
    FaCalendarCheck,
    FaRedoAlt,
    FaChevronDown,
    FaCheckCircle,
    FaTimesCircle,
    FaVideo,
    FaBroadcastTower,
    FaUsers,
    FaFireAlt,
    FaChartLine,
    FaHistory,
    FaExternalLinkAlt,
    FaInfoCircle
} from 'react-icons/fa';
import './DashboardHome.css';
import { useNotification } from '../../context/NotificationContext';

// --- Funções Helper (Inalteradas) ---
const formatDuration = (startTime) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - start);

    const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
    const seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
};
const formatDurationFromSeconds = (totalSeconds) => {
    if (!totalSeconds) return "N/A";
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
};
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
// --- Fim Funções Helper ---


const DashboardHome = ({ artist }) => {
    const { user, activeShow, setActiveShow } = useAuth();
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDuration, setShowDuration] = useState("00:00:00");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pastShows, setPastShows] = useState([]);
    const [isLoadingPastShows, setIsLoadingPastShows] = useState(true);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [requestTab, setRequestTab] = useState('PENDING');
    const [isLiveStreamOpen, setIsLiveStreamOpen] = useState(false);
    const [showStats, setShowStats] = useState({
        avgTipAmount: 0,
        topTipper: null,
        mostRequestedSong: null
    });

    // --- Lógica de Áudio (Inalterada) ---
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
    const notificationSound = useRef(null);
    useEffect(() => {
        notificationSound.current = new Audio('/notification.mp3');
    }, []);
    const unlockAudio = useCallback(() => {
        if (isAudioUnlocked || !notificationSound.current) return;
        console.log("Tentando desbloquear o áudio...");
        notificationSound.current.play()
            .then(() => {
                notificationSound.current.pause();
                notificationSound.current.currentTime = 0;
                setIsAudioUnlocked(true);
                console.log("Áudio desbloqueado com sucesso.");
            })
            .catch(e => {
                console.warn("Interação de áudio falhou.", e);
            });
    }, [isAudioUnlocked]);
    useEffect(() => {
        if (isAudioUnlocked) return;
        
        const unlock = () => {
            unlockAudio();
        };
        
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        
        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
        };
    }, [isAudioUnlocked]);
    // --- Fim Lógica de Áudio ---

    // --- 2. Inicializar o hook de Notificação ---
    const { addToast } = useNotification();


    const { lastMessage, isConnected } = useWebSocket(activeShow ? user.id : null);
    const processedMessageId = useRef(null);


    // Hooks useMemo (Inalterados)
    const pendingRequests = useMemo(() => {
        return requests
            .filter(req => req.status === 'PENDING')
            .sort((a, b) => {
                if (a.tipAmount > b.tipAmount) return -1;
                if (a.tipAmount < b.tipAmount) return 1;
                return new Date(a.receivedAt) - new Date(a.receivedAt);
            });
    }, [requests]);

    const playedRequests = useMemo(() => {
        return requests
            .filter(req => req.status === 'PLAYED')
            .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    }, [requests]);

    const canceledRequests = useMemo(() => {
        return requests
            .filter(req => req.status === 'CANCELED')
            .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
    }, [requests]);

    // Estatísticas avançadas do show
    useEffect(() => {
        if (!activeShow || !requests.length) return;

        const tipsReceived = requests.filter(req => req.tipAmount > 0);
        const avgTip = tipsReceived.length > 0
            ? tipsReceived.reduce((sum, req) => sum + req.tipAmount, 0) / tipsReceived.length
            : 0;

        const topTipper = tipsReceived.length > 0
            ? tipsReceived.reduce((prev, current) => (prev.tipAmount > current.tipAmount) ? prev : current)
            : null;

        const songCount = {};
        requests.forEach(req => {
            songCount[req.songTitle] = (songCount[req.songTitle] || 0) + 1;
        });
        const mostRequested = Object.keys(songCount).length > 0
            ? Object.keys(songCount).reduce((a, b) => songCount[a] > songCount[b] ? a : b)
            : null;

        setShowStats({
            avgTipAmount: avgTip,
            topTipper: topTipper,
            mostRequestedSong: mostRequested
        });
    }, [activeShow, requests]);


    const fetchPastShows = useCallback(async () => {
        setIsLoadingPastShows(true);
        try {
            const pastShowsData = await getPastShowsByArtist(user.id, 0, 5);
            setPastShows(pastShowsData);
        } catch (err) {
            console.error("Erro ao buscar histórico:", err);
        } finally {
            setIsLoadingPastShows(false);
        }
    }, [user.id]);

    // useEffect de carregamento inicial (Inalterado)
    useEffect(() => {
        const fetchActiveShow = async () => {
            if (!user.id) return;
            setIsLoading(true);
            try {
                const showData = await getActiveShowByArtist(user.id);
                if (showData) {
                    setActiveShow(showData);
                    setRequests(showData.requests || []);
                } else {
                    setActiveShow(null);
                    fetchPastShows();
                }
            } catch (err) {
                console.info("Nenhum show ativo encontrado.");
                setActiveShow(null);
                fetchPastShows();
            } finally {
                setIsLoading(false);
            }
        };

        fetchActiveShow();
    }, [user.id, setActiveShow, fetchPastShows]);

    // Efeito para o Timer (Inalterado)
    useEffect(() => {
        let timerId = null;
        if (activeShow) {
            timerId = setInterval(() => {
                setShowDuration(formatDuration(activeShow.startTime));
            }, 1000);
        }
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [activeShow]);


    // 🔥 PROCESSA MENSAGENS WEBSOCKET EM TEMPO REAL
    useEffect(() => {
        if (!lastMessage) return;

        console.log('📨 Dashboard WebSocket:', lastMessage);

        let messageId;
        let messageType = lastMessage.type;

        // Compatibilidade com ambos formatos de mensagem
        if (messageType === 'NEW_SONG_REQUEST' || messageType === 'new-song-request') {
            messageId = lastMessage.data?.requestId || lastMessage.requestId;
        } else if (messageType === 'REQUEST_STATUS_UPDATED' || messageType === 'request-status-updated') {
            messageId = (lastMessage.requestId || '') + (lastMessage.newStatus || lastMessage.status || '');
        } else {
            console.log('📩 Mensagem não tratada:', messageType);
            return;
        }

        if (processedMessageId.current === messageId) {
            console.log('⏭️ Mensagem já processada:', messageId);
            return;
        }

        if (messageType === 'NEW_SONG_REQUEST' || messageType === 'new-song-request') {
            console.log('🎵 Processando novo pedido:', lastMessage);
            
            // Toca o som
            if (notificationSound.current) {
                notificationSound.current.play().catch(e => console.warn("Notificação de áudio bloqueada.", e));
            }

            // Extrai dados da mensagem (compatível com ambos formatos)
            const requestData = lastMessage.data || lastMessage;
            const songTitle = requestData.songTitle;
            const tip = requestData.tipAmount || 0;
            const requestId = requestData.requestId;

            const bodyMessage = tip > 0
                ? `Com gorjeta de ${formatCurrency(tip)}!`
                : 'Pedido gratuito.';

            addToast(`Novo Pedido: ${songTitle}`, bodyMessage, 'success');

            // Recarrega show completo para garantir sincronização
            getActiveShowByArtist(user.id).then(showData => {
                if (showData) {
                    console.log('✅ Show atualizado com novo pedido');
                    setActiveShow(showData);
                    setRequests(showData.requests || []);
                }
            }).catch(err => {
                console.error('❌ Erro ao recarregar show:', err);
            });

        } else if (messageType === 'REQUEST_STATUS_UPDATED' || messageType === 'request-status-updated') {
            console.log('✏️ Processando atualização de status:', lastMessage);
            
            const requestId = lastMessage.requestId;
            const newStatus = lastMessage.newStatus || lastMessage.status;

            setRequests(prevRequests =>
                prevRequests.map(req =>
                    req.requestId === requestId
                        ? { ...req, status: newStatus }
                        : req
                )
            );
        }

        processedMessageId.current = messageId;
    }, [lastMessage, setActiveShow, addToast, user.id]);

    const handleStartShow = async () => {
        // A lógica de desbloqueio de áudio agora é global
        setIsLoading(true);
        setError(null);
        try {
            const showData = await startShow(user.id);
            setActiveShow(showData);
            setRequests(showData.requests || []);
            setShowDuration("00:00:00");
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao iniciar o show.');
        } finally {
            setIsLoading(false);
        }
    };

    // ... (O restante do arquivo permanece igual) ...

    const handleEndShow = () => {
        setIsModalOpen(true);
    };

    const confirmEndShow = async () => {
        setIsModalOpen(false);
        setIsLoading(true);
        setError(null);
        try {
            await endShow(activeShow.id);
            setActiveShow(null);
            setRequests([]);
            setShowDuration("00:00:00");
            fetchPastShows();
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao encerrar o show.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRequest = async (requestId, newStatus) => {
        try {
            const newRequests = requests.map((req) =>
                req.requestId === requestId
                    ? { ...req, status: newStatus }
                    : req
            );
            setRequests(newRequests);

            await updateRequestStatus(activeShow.id, requestId, newStatus);

            if (newStatus === 'PLAYED') {
                setActiveShow(prevShow => ({
                    ...prevShow,
                }));
            }

        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            setError('Falha ao atualizar o pedido. Tente novamente.');
            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.requestId === requestId
                        ? { ...req, status: 'PENDING' }
                        : req
                )
            );
        }
    };

    const handleRequestTabClick = (tab) => {
        setRequestTab(tab);
    };


    if (isLoading) {
        return <div className="loading-full-page">Carregando...</div>;
    }

    const renderRequestList = () => {
        let listToRender = [];
        let emptyMessage = "Nenhum pedido encontrado.";

        switch (requestTab) {
            case 'PENDING':
                listToRender = pendingRequests;
                emptyMessage = "Aguardando pedidos...";
                break;
            case 'PLAYED':
                listToRender = playedRequests;
                emptyMessage = "Nenhuma música foi marcada como 'tocada'.";
                break;
            case 'CANCELED':
                listToRender = canceledRequests;
                emptyMessage = "Nenhum pedido cancelado.";
                break;
            default:
                listToRender = [];
        }

        if (listToRender.length === 0) {
            return <p className="empty-state">{emptyMessage}</p>;
        }

        return listToRender.map((req) => (
            <SongRequestCard
                key={req.requestId}
                request={req}
                onUpdateRequestStatus={handleUpdateRequest}
            />
        ));
    };


    return (
        <div className="show-mode-container">
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmEndShow}
                title="Encerrar Show"
            >
                <p>Tem certeza que deseja encerrar o show atual?</p>
                <p>Esta ação não pode ser desfeita e o show será movido para o seu histórico.</p>
            </Modal>

            {/* === HEADER DO MODO SHOW === */}
            <div className="show-mode-header">
                <div className="show-header-content">
                    <div className="show-header-info">
                        <div className="show-header-icon">
                            <FaBroadcastTower />
                        </div>
                        <div className="show-header-text">
                            <h2>Modo Show</h2>
                            <p>
                                {activeShow
                                    ? 'Gerenciando seu show ao vivo'
                                    : 'Inicie um show para receber pedidos e gorjetas em tempo real'}
                            </p>
                        </div>
                    </div>

                    <div className="show-header-actions">
                        {activeShow ? (
                            <>
                                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                                    <span className="status-dot"></span>
                                    <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
                                </div>
                                <button 
                                    className="btn-livestream" 
                                    onClick={() => setIsLiveStreamOpen(true)}
                                >
                                    <FaVideo />
                                    <span>Transmitir</span>
                                </button>
                                <button 
                                    className="btn-end-show" 
                                    onClick={handleEndShow} 
                                    disabled={isLoading}
                                >
                                    <FaStop />
                                    <span>Encerrar</span>
                                </button>
                            </>
                        ) : (
                            <button 
                                className="btn-start-show" 
                                onClick={handleStartShow} 
                                disabled={isLoading}
                            >
                                <FaPlay />
                                <span>Iniciar Novo Show</span>
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="show-error-alert">
                        <FaInfoCircle />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {/* === ESTATÍSTICAS DO SHOW ATIVO === */}
            {activeShow && (
                <>
                    <div className="show-stats-primary">
                        <div className="stat-card-large timer">
                            <div className="stat-icon">
                                <FaClock />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-large">{showDuration}</span>
                                <span className="stat-label">Tempo ao Vivo</span>
                                <span className="stat-sublabel">Show em andamento</span>
                            </div>
                        </div>

                        <div className="stat-card-large">
                            <div className="stat-icon total">
                                <FaMusic />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-large">{activeShow.totalRequests}</span>
                                <span className="stat-label">Total de Pedidos</span>
                                <span className="stat-sublabel">
                                    {pendingRequests.length} na fila
                                </span>
                            </div>
                        </div>

                        <div className="stat-card-large">
                            <div className="stat-icon tips">
                                <FaGift />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value-large">{formatCurrency(activeShow.totalTipsValue)}</span>
                                <span className="stat-label">Total em Gorjetas</span>
                                <span className="stat-sublabel">
                                    Média: {formatCurrency(showStats.avgTipAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Estatísticas Secundárias */}
                    <div className="show-stats-secondary">
                        <div className="stat-item">
                            <div className="stat-item-icon">
                                <FaCheckCircle />
                            </div>
                            <div className="stat-item-info">
                                <span className="stat-item-value">{playedRequests.length}</span>
                                <span className="stat-item-label">Músicas Tocadas</span>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-item-icon">
                                <FaFireAlt />
                            </div>
                            <div className="stat-item-info">
                                <span className="stat-item-label">Maior Gorjeta</span>
                                <span className="stat-item-value" title={showStats.topTipper ? `${showStats.topTipper.requesterName} - ${formatCurrency(showStats.topTipper.tipAmount)}` : 'Nenhuma gorjeta ainda'}>
                                    {showStats.topTipper 
                                        ? formatCurrency(showStats.topTipper.tipAmount)
                                        : '-'}
                                </span>
                                {showStats.topTipper && (
                                    <span className="stat-item-sublabel">
                                        {showStats.topTipper.requesterName}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-item-icon">
                                <FaChartLine />
                            </div>
                            <div className="stat-item-info">
                                <span className="stat-item-value">
                                    {showStats.mostRequestedSong || '-'}
                                </span>
                                <span className="stat-item-label">Mais Pedida</span>
                            </div>
                        </div>

                        <div className="stat-item">
                            <div className="stat-item-icon">
                                <FaTimesCircle />
                            </div>
                            <div className="stat-item-info">
                                <span className="stat-item-value">{canceledRequests.length}</span>
                                <span className="stat-item-label">Cancelados</span>
                            </div>
                        </div>
                    </div>

                    {/* Link Público do Show */}
                    <div className="show-public-link">
                        <FaExternalLinkAlt />
                        <div className="link-info">
                            <span className="link-label">Link Público do Show</span>
                            <a 
                                href={`${window.location.origin}/show/${user.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link-url"
                            >
                                {window.location.origin}/show/{user.id}
                            </a>
                        </div>
                        <button 
                            className="btn-copy-link"
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/show/${user.id}`);
                                addToast('Link copiado!', 'Link público copiado para a área de transferência', 'success');
                            }}
                        >
                            Copiar Link
                        </button>
                    </div>
                </>
            )}

            {/* === LISTA DE PEDIDOS === */}
            {activeShow && (
                <div className="requests-section">
                    <div className="requests-header">
                        <h3>
                            <FaMusic />
                            <span>Gerenciar Pedidos</span>
                        </h3>
                    </div>

                    <div className="requests-tabs-container">
                        <div className="requests-tabs">
                            <button
                                className={`requests-tab ${requestTab === 'PENDING' ? 'active' : ''}`}
                                onClick={() => handleRequestTabClick('PENDING')}
                            >
                                <FaClock />
                                <span>Fila de Espera</span>
                                <span className="tab-badge">{pendingRequests.length}</span>
                            </button>
                            <button
                                className={`requests-tab ${requestTab === 'PLAYED' ? 'active' : ''}`}
                                onClick={() => handleRequestTabClick('PLAYED')}
                            >
                                <FaCheckCircle />
                                <span>Tocadas</span>
                                <span className="tab-badge">{playedRequests.length}</span>
                            </button>
                            <button
                                className={`requests-tab ${requestTab === 'CANCELED' ? 'active' : ''}`}
                                onClick={() => handleRequestTabClick('CANCELED')}
                            >
                                <FaTimesCircle />
                                <span>Canceladas</span>
                                <span className="tab-badge">{canceledRequests.length}</span>
                            </button>
                        </div>

                        <div className="requests-content">
                            {renderRequestList()}
                        </div>
                    </div>
                </div>
            )}

            {/* === HISTÓRICO DE SHOWS (QUANDO NÃO HÁ SHOW ATIVO) === */}
            {!activeShow && (
                <div className="history-section">
                    <div className="history-header">
                        <div className="history-title">
                            <FaHistory />
                            <h3>Histórico de Shows</h3>
                            <button
                                className="btn-refresh"
                                onClick={fetchPastShows}
                                disabled={isLoadingPastShows}
                                type="button"
                                title="Atualizar histórico"
                            >
                                <FaRedoAlt />
                            </button>
                        </div>
                        <button
                            className="btn-toggle-history"
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            type="button"
                        >
                            <span>{isHistoryOpen ? 'Recolher' : 'Expandir'}</span>
                            <FaChevronDown className={isHistoryOpen ? 'rotated' : ''} />
                        </button>
                    </div>

                    <div className={`history-content ${isHistoryOpen ? 'expanded' : 'collapsed'}`}>
                        {isLoadingPastShows ? (
                            <div className="history-loading">
                                <div className="loading-spinner-small"></div>
                                <p>Carregando histórico...</p>
                            </div>
                        ) : pastShows.length === 0 ? (
                            <div className="history-empty">
                                <FaMusic className="empty-icon" />
                                <h4>Nenhum Show Realizado</h4>
                                <p>Seus shows anteriores aparecerão aqui</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {pastShows.map(show => (
                                    <div key={show.id} className="history-card">
                                        <div className="history-card-header">
                                            <div className="history-date">
                                                <FaCalendarCheck />
                                                <span>{formatDateTime(show.startTime)}</span>
                                            </div>
                                            <div className="history-duration">
                                                <FaClock />
                                                <span>{formatDurationFromSeconds(show.durationInSeconds)}</span>
                                            </div>
                                        </div>
                                        <div className="history-card-stats">
                                            <div className="history-stat">
                                                <FaMusic />
                                                <span>{show.totalRequests}</span>
                                                <small>pedidos</small>
                                            </div>
                                            <div className="history-stat">
                                                <FaGift />
                                                <span>{formatCurrency(show.totalTipsValue)}</span>
                                                <small>gorjetas</small>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Componente Flutuante de Live Stream */}
            <LiveStreamFloating
                isOpen={isLiveStreamOpen && activeShow}
                onClose={() => setIsLiveStreamOpen(false)}
                showId={activeShow?.id}
                artistId={user?.id}
            />
        </div>
    );
};

export default DashboardHome;