/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardHome.js
 * (Correção dos Erros de Hooks e ESLint)
 * ========================================
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo importado
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { startShow, endShow, updateRequestStatus } from '../../services/artistService';
import { getActiveShowByArtist, getPastShowsByArtist } from '../../services/showService';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import Modal from '../../components/Modal/Modal';
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
    FaTimesCircle
} from 'react-icons/fa';

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

    const { messages, isConnected } = useWebSocket(activeShow ? user.id : null);

    // --- INÍCIO DA CORREÇÃO 1: Mover Hooks para o topo ---
    // Os Hooks useMemo devem ser chamados incondicionalmente no topo.
    const pendingRequests = useMemo(() => {
        return requests
            .filter(req => req.status === 'PENDING')
            .sort((a, b) => {
                if (a.tipAmount > b.tipAmount) return -1;
                if (a.tipAmount < b.tipAmount) return 1;
                return new Date(a.receivedAt) - new Date(b.receivedAt); // Mais antigo primeiro
            });
    }, [requests]);

    const playedRequests = useMemo(() => {
        return requests
            .filter(req => req.status === 'PLAYED')
            .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)); // Mais recente primeiro
    }, [requests]);

    const canceledRequests = useMemo(() => {
        return requests
            .filter(req => req.status === 'CANCELED')
            .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)); // Mais recente primeiro
    }, [requests]);
    // --- FIM DA CORREÇÃO 1 ---


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

    // Efeito para o WebSocket (Inalterado)
    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.type === 'NEW_SONG_REQUEST') {
                setRequests((prevRequests) => [msg.data, ...prevRequests]);
                setActiveShow(prevShow => ({
                    ...prevShow,
                    totalRequests: (prevShow.totalRequests || 0) + 1,
                    totalTipsValue: (prevShow.totalTipsValue || 0) + (msg.data.tipAmount || 0)
                }));
            }
            if (msg.type === 'REQUEST_STATUS_UPDATED') {
                setRequests((prevRequests) =>
                    prevRequests.map((req) =>
                        req.requestId === msg.requestId
                            ? { ...req, status: msg.newStatus }
                            : req
                    )
                );
            }
        });
    }, [messages, setActiveShow]);

    const handleStartShow = async () => {
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
            // --- INÍCIO DA CORREÇÃO 2: Remover 'originalRequests' ---
            // const originalRequests = requests; // Variável não utilizada
            // --- FIM DA CORREÇÃO 2 ---

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
                            onClick={() => setRequestTab('PENDING')}
                        >
                            <FaMusic />
                            <span>Fila</span>
                            <span className="tab-counter">{pendingRequests.length}</span>
                        </button>
                        <button
                            className={`requests-tab-btn ${requestTab === 'PLAYED' ? 'active' : ''}`}
                            onClick={() => setRequestTab('PLAYED')}
                        >
                            <FaCheckCircle />
                            <span>Tocadas</span>
                            <span className="tab-counter">{playedRequests.length}</span>
                        </button>
                        <button
                            className={`requests-tab-btn ${requestTab === 'CANCELED' ? 'active' : ''}`}
                            onClick={() => setRequestTab('CANCELED')}
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
                    <button type="button" className="accordion-header" onClick={() => setIsHistoryOpen(!isHistoryOpen)}>
                        <div className="accordion-title">
                            <FaCalendarCheck />
                            <span>Histórico de Shows</span>
                        </div>
                        <div className="past-shows-actions">
                            <button
                                className="btn-icon"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fetchPastShows();
                                }}
                                disabled={isLoadingPastShows}
                            >
                                <FaRedoAlt />
                            </button>
                            <FaChevronDown className="accordion-icon" />
                        </div>
                    </button>

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
        </div>
    );
};

export default DashboardHome;