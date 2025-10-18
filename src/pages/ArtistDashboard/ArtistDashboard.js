import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { startShow, endShow, updateRequestStatus } from '../../services/artistService';
import { getActiveShowByArtist } from '../../services/showService';
import SongRequestCard from '../../components/SongRequestCard/SongRequestCard';
import './ArtistDashboard.css';

const ArtistDashboard = () => {
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
            try {
                const showData = await getActiveShowByArtist(user.id);
                if (showData) {
                    setActiveShow(showData);
                    setRequests(showData.requests || []);
                }
            } catch (err) {
                // Não é um erro se não houver show ativo, apenas loga
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
                // Adiciona o novo pedido no topo da lista
                setRequests((prevRequests) => [msg.data, ...prevRequests]);
            }
            if (msg.type === 'REQUEST_STATUS_UPDATED') {
                // Atualiza o status de um pedido existente
                setRequests((prevRequests) =>
                    prevRequests.map((req) =>
                        req.requestId === msg.requestId
                            ? { ...req, status: msg.newStatus }
                            : req
                    )
                );
            }
        });
    }, [messages]); // Executa toda vez que 'messages' mudar

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
            // A atualização via WebSocket já vai atualizar a UI,
            // mas chamamos a API para persistir a mudança.
            await updateRequestStatus(activeShow.id, requestId, newStatus);

            // Opcional: Atualização otimista da UI (caso o WebSocket falhe)
            setRequests((prevRequests) =>
                prevRequests.map((req) =>
                    req.requestId === requestId
                        ? { ...req, status: newStatus }
                        : req
                )
            );

        } catch (err) {
            console.error("Erro ao atualizar status:", err);
            setError('Falha ao atualizar o pedido.');
        }
    };

    if (isLoading && !activeShow) {
        return <div>Carregando dashboard...</div>;
    }

    // Ordena os pedidos: PENDENTES primeiro, depois por data
    const sortedRequests = [...requests].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        // Se ambos são PENDING, o mais antigo (com gorjeta) vem primeiro
        if (a.status === 'PENDING' && b.status === 'PENDING') {
            // Prioriza gorjeta
            if (a.tipAmount > b.tipAmount) return -1;
            if (a.tipAmount < b.tipAmount) return 1;
            // Se a gorjeta for igual, prioriza o mais antigo
            return new Date(a.receivedAt) - new Date(b.receivedAt);
        }
        // Para outros status, o mais recente primeiro
        return new Date(b.receivedAt) - new Date(a.receivedAt);
    });

    return (
        <div className="dashboard">
            <div className="dashboard-header card">
                <h1>Meu Dashboard</h1>
                {error && <p className="dashboard-error">{error}</p>}
                {activeShow ? (
                    <div className="show-controls">
                        <p className="show-status active">
                            Show Ativo! (Conexão: {isConnected ? 'Online' : 'Offline'})
                        </p>
                        <button className="btn-danger" onClick={handleEndShow} disabled={isLoading}>
                            Encerrar Show
                        </button>
                    </div>
                ) : (
                    <div className="show-controls">
                        <p className="show-status inactive">Nenhum show ativo.</p>
                        <button className="btn-primary" onClick={handleStartShow} disabled={isLoading}>
                            Iniciar Novo Show
                        </button>
                    </div>
                )}
            </div>

            {activeShow && (
                <div className="requests-list">
                    <h2>Pedidos Recebidos</h2>
                    {requests.length === 0 ? (
                        <p>Aguardando pedidos...</p>
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

export default ArtistDashboard;