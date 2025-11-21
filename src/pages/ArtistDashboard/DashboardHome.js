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
    FaVideo
} from 'react-icons/fa';
// --- 1. Importar o novo hook ---
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
        <div className={`dashboard-tab-content ${activeShow ? 'show-is-active' : ''}`}>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmEndShow}
                title="Encerrar Show"
            >
                <p>Tem certeza que deseja encerrar o show atual?</p>
                <p>Esta ação não pode ser desfeita e o show será movido para o seu histórico.</p>
            </Modal>

            <div className="card-header modo-show-header">
                <div className="modo-show-title">
                    <h2>Modo Show</h2>
                    {!activeShow && (
                        <p className="show-explanation-text">
                            Ao "Iniciar Novo Show", você ativa sua página pública e habilita o recebimento de pedidos de música e gorjetas em tempo real. Use esta função apenas quando estiver ao vivo.
                        </p>
                    )}
                </div>

                {error && <p className="dashboard-error">{error}</p>}

                {activeShow ? (
                    <div className="show-controls">
                        <div className={`show-status ${isConnected ? 'active' : 'inactive'}`}>
                            <FaSatelliteDish />
                            {isConnected ? 'CONECTADO' : 'OFFLINE'}
                        </div>
                        <button 
                            className="btn-livestream" 
                            onClick={() => setIsLiveStreamOpen(true)}
                        >
                            <FaVideo /> Transmitir ao Vivo
                        </button>
                        <button className="btn-danger" onClick={handleEndShow} disabled={isLoading}>
                            <FaStop /> Encerrar Show
                        </button>
                    </div>
                ) : (
                    <div className="show-controls">
                        <button className="btn-primary" onClick={handleStartShow} disabled={isLoading}>
                            <FaPlay /> Iniciar Novo Show
                        </button>
                    </div>
                )}
            </div>

            {activeShow && (
                <div className="show-stats-grid">
                    <div className="stat-card timer">
                        <FaClock />
                        <div className="stat-info">
                            <span className="stat-value">{showDuration}</span>
                            <span className="stat-label">Tempo de Show</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FaMusic />
                        <div className="stat-info">
                            <span className="stat-value">{activeShow.totalRequests}</span>
                            <span className="stat-label">Pedidos Recebidos</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <FaGift />
                        <div className="stat-info">
                            <span className="stat-value">{formatCurrency(activeShow.totalTipsValue)}</span>
                            <span className="stat-label">Total em Gorjetas</span>
                        </div>
                    </div>
                </div>
            )}

            {activeShow && (
                <div className="requests-list-container">
                    <div className="requests-tabs">
                        <button
                            className={`requests-tab-btn ${requestTab === 'PENDING' ? 'active' : ''}`}
                            onClick={() => handleRequestTabClick('PENDING')}
                        >
                            <FaMusic />
                            <span>Fila</span>
                            <span className="tab-counter">{pendingRequests.length}</span>
                        </button>
                        <button
                            className={`requests-tab-btn ${requestTab === 'PLAYED' ? 'active' : ''}`}
                            onClick={() => handleRequestTabClick('PLAYED')}
                        >
                            <FaCheckCircle />
                            <span>Tocadas</span>
                            <span className="tab-counter">{playedRequests.length}</span>
                        </button>
                        <button
                            className={`requests-tab-btn ${requestTab === 'CANCELED' ? 'active' : ''}`}
                            onClick={() => handleRequestTabClick('CANCELED')}
                        >
                            <FaTimesCircle />
                            <span>Canceladas</span>
                            <span className="tab-counter">{canceledRequests.length}</span>
                        </button>
                    </div>

                    <div className="requests-list">
                        {renderRequestList()}
                    </div>
                </div>
            )}

            {!activeShow && (
                <div className={`past-shows-section card ${isHistoryOpen ? 'open' : ''}`}>
                    <div className="accordion-header">
                        <button 
                            type="button" 
                            className="accordion-title-btn"
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        >
                            <div className="accordion-title">
                                <FaCalendarCheck />
                                <span>Histórico de Shows</span>
                            </div>
                            <FaChevronDown className="accordion-icon" />
                        </button>
                        <div className="past-shows-actions">
                            <button
                                className="btn-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchPastShows();
                                }}
                                disabled={isLoadingPastShows}
                                type="button"
                            >
                                <FaRedoAlt />
                            </button>
                        </div>
                    </div>

                    <div className="accordion-content">
                        {isLoadingPastShows ? (
                            <p>Carregando histórico...</p>
                        ) : pastShows.length === 0 ? (
                            <p className="empty-state-small">Nenhum show anterior encontrado.</p>
                        ) : (
                            <div className="past-shows-list-container">
                                <ul className="past-shows-list">
                                    {pastShows.map(show => (
                                        <li key={show.id} className="past-show-item">
                                            <div className="past-show-info">
                                                <span className="past-show-date">{formatDateTime(show.startTime)}</span>
                                                <span className="past-show-stats">
                                                    Duração: {formatDurationFromSeconds(show.durationInSeconds)}
                                                </span>
                                            </div>
                                            <div className="past-show-metrics">
                                                <span>{show.totalRequests} Pedidos</span>
                                                <span>{formatCurrency(show.totalTipsValue)}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
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