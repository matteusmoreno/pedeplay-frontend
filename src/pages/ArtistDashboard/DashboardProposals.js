import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import {
    getArtistContracts,
    confirmContract,
    rejectContract
} from '../../services/contractService';
import {
    FaUser,
    FaCheck,
    FaTimes,
    FaWhatsapp,
    FaMoneyBillWave,
    FaEnvelope,
    FaCalendarDay,
    FaFilter,
    FaClock,
    FaMapMarkerAlt,
    FaMusic,
    FaCheckCircle,
    FaTimesCircle,
    FaBan
} from 'react-icons/fa';
import './DashboardProposals.css';

const DashboardProposals = () => {
    const { user } = useAuth();
    const { addToast } = useNotification();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');

    const fetchContracts = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const contractsData = await getArtistContracts(user.id);
            setContracts(contractsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error(error);
            addToast('Erro', 'Falha ao carregar propostas.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.id, addToast]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    const handleContractAction = async (contractId, action) => {
        try {
            if (action === 'confirm') {
                await confirmContract(contractId);
                addToast('Confirmado', 'Show confirmado com sucesso!', 'success');
            } else {
                if (!window.confirm('Deseja realmente rejeitar esta proposta?')) return;
                await rejectContract(contractId);
                addToast('Rejeitado', 'Proposta rejeitada.', 'info');
            }
            fetchContracts();
        } catch (error) {
            addToast('Erro', error.message, 'error');
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const formatDateTime = (iso) => {
        const d = new Date(iso);
        return {
            date: d.toLocaleDateString('pt-BR'),
            time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            fullDate: d.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        };
    };

    const getStatusLabel = (status) => {
        const labels = {
            'PENDING_CONFIRMATION': 'Aguardando Confirmação',
            'CONFIRMED': 'Confirmado',
            'REJECTED': 'Rejeitado',
            'COMPLETED': 'Concluído',
            'CANCELED': 'Cancelado'
        };
        return labels[status] || status;
    };

    const filteredContracts = contracts.filter(contract => {
        if (filterStatus === 'ALL') return true;
        return contract.status === filterStatus;
    });

    const contractStats = {
        total: contracts.length,
        pending: contracts.filter(c => c.status === 'PENDING_CONFIRMATION').length,
        confirmed: contracts.filter(c => c.status === 'CONFIRMED').length,
        rejected: contracts.filter(c => c.status === 'REJECTED').length,
        completed: contracts.filter(c => c.status === 'COMPLETED').length
    };

    return (
        <div className="proposals-container">
            {/* Header com Estatísticas */}
            <div className="proposals-header">
                <div className="proposals-header-content">
                    <div className="proposals-header-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="proposals-header-text">
                        <h2>Propostas de Show</h2>
                        <p>Gerencie solicitações de contratação</p>
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="proposals-stats-grid">
                <div className="proposals-stat-card proposals-stat-total">
                    <div className="proposals-stat-icon">
                        <FaMoneyBillWave />
                    </div>
                    <div className="proposals-stat-content">
                        <span className="proposals-stat-number">{contractStats.total}</span>
                        <span className="proposals-stat-label">Total</span>
                    </div>
                </div>
                <div className="proposals-stat-card proposals-stat-pending">
                    <div className="proposals-stat-icon">
                        <FaClock />
                    </div>
                    <div className="proposals-stat-content">
                        <span className="proposals-stat-number">{contractStats.pending}</span>
                        <span className="proposals-stat-label">Pendentes</span>
                    </div>
                </div>
                <div className="proposals-stat-card proposals-stat-confirmed">
                    <div className="proposals-stat-icon">
                        <FaCheckCircle />
                    </div>
                    <div className="proposals-stat-content">
                        <span className="proposals-stat-number">{contractStats.confirmed}</span>
                        <span className="proposals-stat-label">Confirmados</span>
                    </div>
                </div>
                <div className="proposals-stat-card proposals-stat-rejected">
                    <div className="proposals-stat-icon">
                        <FaTimesCircle />
                    </div>
                    <div className="proposals-stat-content">
                        <span className="proposals-stat-number">{contractStats.rejected}</span>
                        <span className="proposals-stat-label">Recusados</span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="proposals-filters">
                <div className="proposals-filters-label">
                    <FaFilter />
                    <span>Filtrar por:</span>
                </div>
                <div className="proposals-filters-buttons">
                    <button
                        className={`proposals-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('ALL')}
                    >
                        Todas ({contractStats.total})
                    </button>
                    <button
                        className={`proposals-filter-btn ${filterStatus === 'PENDING_CONFIRMATION' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('PENDING_CONFIRMATION')}
                    >
                        Pendentes ({contractStats.pending})
                    </button>
                    <button
                        className={`proposals-filter-btn ${filterStatus === 'CONFIRMED' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('CONFIRMED')}
                    >
                        Confirmados ({contractStats.confirmed})
                    </button>
                    <button
                        className={`proposals-filter-btn ${filterStatus === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('REJECTED')}
                    >
                        Recusados ({contractStats.rejected})
                    </button>
                    <button
                        className={`proposals-filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('COMPLETED')}
                    >
                        Concluídos ({contractStats.completed})
                    </button>
                </div>
            </div>

            {/* Lista de Propostas */}
            {loading ? (
                <div className="proposals-loading">
                    <FaClock className="proposals-loading-icon" />
                    <p>Carregando propostas...</p>
                </div>
            ) : (
                <div className="proposals-list">
                    {filteredContracts.length === 0 ? (
                        <div className="proposals-empty">
                            <FaMoneyBillWave className="proposals-empty-icon" />
                            <h3>Nenhuma proposta encontrada</h3>
                            <p>
                                {filterStatus === 'ALL'
                                    ? 'Você ainda não recebeu nenhuma proposta de show.'
                                    : `Você não tem propostas com o status "${getStatusLabel(filterStatus)}".`}
                            </p>
                        </div>
                    ) : (
                        filteredContracts.map(contract => {
                            const { date, time } = formatDateTime(contract.createdAt);
                            const statusIcon = {
                                'PENDING_CONFIRMATION': <FaClock />,
                                'CONFIRMED': <FaCheckCircle />,
                                'REJECTED': <FaBan />,
                                'COMPLETED': <FaCheck />,
                                'CANCELED': <FaTimes />
                            };

                            return (
                                <div key={contract.id} className={`proposals-card proposals-card-${contract.status.toLowerCase()}`}>
                                    <div className="proposals-card-status">
                                        {statusIcon[contract.status]}
                                        <span>{getStatusLabel(contract.status)}</span>
                                    </div>

                                    <div className="proposals-card-header">
                                        <div className="proposals-customer">
                                            <div className="proposals-customer-avatar">
                                                <FaUser />
                                            </div>
                                            <div className="proposals-customer-info">
                                                <h3>{contract.customer.name}</h3>
                                                <div className="proposals-customer-contacts">
                                                    <span><FaWhatsapp /> {contract.customer.phoneNumber}</span>
                                                    <span><FaEnvelope /> {contract.customer.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="proposals-card-value">
                                            <span className="proposals-value-label">Valor</span>
                                            <span className="proposals-value-amount">{formatCurrency(contract.totalPrice)}</span>
                                        </div>
                                    </div>

                                    <div className="proposals-card-details">
                                        <div className="proposals-detail-item">
                                            <FaCalendarDay />
                                            <div>
                                                <span className="proposals-detail-label">Solicitado em</span>
                                                <span className="proposals-detail-value">{date} às {time}</span>
                                            </div>
                                        </div>
                                        {contract.eventLocation && (
                                            <div className="proposals-detail-item">
                                                <FaMapMarkerAlt />
                                                <div>
                                                    <span className="proposals-detail-label">Local</span>
                                                    <span className="proposals-detail-value">{contract.eventLocation}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {contract.status === 'PENDING_CONFIRMATION' && (
                                        <div className="proposals-card-actions">
                                            <button
                                                className="proposals-btn proposals-btn-accept"
                                                onClick={() => handleContractAction(contract.id, 'confirm')}
                                            >
                                                <FaCheck /> Aceitar
                                            </button>
                                            <button
                                                className="proposals-btn proposals-btn-reject"
                                                onClick={() => handleContractAction(contract.id, 'reject')}
                                            >
                                                <FaTimes /> Recusar
                                            </button>
                                        </div>
                                    )}

                                    {contract.status === 'REJECTED' && (
                                        <div className="proposals-card-rejected-info">
                                            <FaBan />
                                            <span>Esta proposta foi recusada</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardProposals;
