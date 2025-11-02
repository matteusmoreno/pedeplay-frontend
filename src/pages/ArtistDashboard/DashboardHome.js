/* * ========================================
 * ARQUIVO NOVO: src/pages/ArtistDashboard/DashboardHome.js
 * (Aba "Ao Vivo")
 * ========================================
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { startShow, endShow, updateRequestStatus } from '../../services/artistService';
import { getActiveShowByArtist } from '../../services/showService';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import { FaPlay, FaStop, FaSatelliteDish } from 'react-icons/fa';

// Recebe os dados do artista como prop do painel principal
const DashboardHome = ({ artist }) => {
    const { user } = useAuth();
    const [activeShow, setActiveShow] = useState(null);
    const [requests, setRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Conecta ao WebSocket
    const { messages, isConnected } = useWebSocket(activeShow ? user.id : null);

    // Efeito para buscar o show ativo ao carregar a página
    useEffect(() => {
        const fetchActiveShow = async () => {
            if (!user.id) return;
            try {
                const showData = await getActiveShowByArtist(user.id);
                if (showData) {
                    setActiveShow(showData);
                    setRequests(showData.requests || []);
                }
            } catch (err) {
                console.info("Nenhum show ativo encontrado.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchActiveShow();
    }, [user.id]);

    // Efeito para lidar com novas mensagens do WebSocket
    useEffect(() => {
        messages.forEach((msg) => {
            if (msg.type === 'NEW_SONG_REQUEST') {
                setRequests((prevRequests) => [msg.data, ...prevRequests]);
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
    }, [messages]);

    const handleStartShow = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const showData = await startShow(user.id);
            setActiveShow(showData);
            setRequests(showData.requests || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao iniciar o show.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndShow = async () => {
        if (!window.confirm("Tem certeza que deseja encerrar o show?")) return;

        setIsLoading(true);
        setError(null);
        try {
            await endShow(activeShow.id);
            setActiveShow(null);
            setRequests([]);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao encerrar o show.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRequest = async (requestId, newStatus) => {
        try {
            // Chamada otimista - atualiza a UI primeiro
            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.requestId === requestId
                        ? { ...req, status: newStatus }
                        : req
                )
            );
            // Em seguida, chama a API
            await updateRequestStatus(activeShow.id, requestId, newStatus);
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            setError('Falha ao atualizar o pedido. Tente novamente.');
            // Reverte a UI em caso de erro
            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.requestId === requestId
                        ? { ...req, status: 'PENDING' } // Reverte para o estado anterior
                        : req
                )
            );
        }
    };

    if (isLoading && !activeShow) {
        return <div>Carregando...</div>;
    }

    // Ordena os pedidos: PENDENTES primeiro, depois por data
    const sortedRequests = [...requests].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        if (a.status === 'PENDING' && b.status === 'PENDING') {
            if (a.tipAmount > b.tipAmount) return -1;
            if (a.tipAmount < b.tipAmount) return 1;
            return new Date(a.receivedAt) - new Date(a.receivedAt);
        }
        return new Date(b.receivedAt) - new Date(a.receivedAt);
    });

    return (
        <div className="dashboard-tab-content">
            <div className="card-header">
                <h2>Gerenciamento ao Vivo</h2>
                {error && <p className="dashboard-error">{error}</p>}

                {activeShow ? (
                    <div className="show-controls">
                        <div className={`show-status ${isConnected ? 'active' : 'inactive'}`}>
                            <FaSatelliteDish />
                            {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
                        </div>
                        <button className="btn-danger" onClick={handleEndShow} disabled={isLoading}>
                            <FaStop /> Encerrar Show
                        </button>
                    </div>
                ) : (
                    <div className="show-controls">
                        <div className="show-status inactive">
                            Show Inativo
                        </div>
                        <button className="btn-primary" onClick={handleStartShow} disabled={isLoading}>
                            <FaPlay /> Iniciar Novo Show
                        </button>
                    </div>
                )}
            </div>

            {activeShow && (
                <div className="requests-list">
                    <h3>Fila de Pedidos</h3>
                    {requests.length === 0 ? (
                        <p className="empty-state">Aguardando o primeiro pedido...</p>
                    ) : (
                        sortedRequests.map((req) => (
                            <SongRequestCard
                                key={req.requestId}
                                request={req}
                                onUpdateRequestStatus={handleUpdateRequest}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardHome;