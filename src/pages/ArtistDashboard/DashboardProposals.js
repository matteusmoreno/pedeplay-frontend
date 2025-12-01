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
    FaClock
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
        completed: contracts.filter(c => c.status === 'COMPLETED').length
    };

    return (
        <div className="proposals-container">
            <div className="proposals-header">
                <div className="header-title">
                    <h2><FaMoneyBillWave /> Propostas de Show</h2>
                    <p>Gerencie as solicitações de contratação para seus shows</p>
                </div>

                <div className="proposals-stats">
                    <div className="stat-card">
                        <span className="stat-number">{contractStats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                    <div className="stat-card pending">
                        <span className="stat-number">{contractStats.pending}</span>
                        <span className="stat-label">Pendentes</span>
                    </div>
                    <div className="stat-card confirmed">
                        <span className="stat-number">{contractStats.confirmed}</span>
                        <span className="stat-label">Confirmados</span>
                    </div>
                    <div className="stat-card completed">
                        <span className="stat-number">{contractStats.completed}</span>
                        <span className="stat-label">Concluídos</span>
                    </div>
                </div>
            </div>

            <div className="proposals-filters">
                <FaFilter />
                <button
                    className={`filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('ALL')}
                >
                    Todas
                </button>
                <button
                    className={`filter-btn ${filterStatus === 'PENDING_CONFIRMATION' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('PENDING_CONFIRMATION')}
                >
                    Pendentes
                </button>
                <button
                    className={`filter-btn ${filterStatus === 'CONFIRMED' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('CONFIRMED')}
                >
                    Confirmados
                </button>
                <button
                    className={`filter-btn ${filterStatus === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => setFilterStatus('COMPLETED')}
                >
                    Concluídos
                </button>
            </div>

            {loading ? (
                <div className="loading-state">
                    <FaClock />
                    <p>Carregando propostas...</p>
                </div>
            ) : (
                <div className="proposals-grid">
                    {filteredContracts.length === 0 ? (
                        <div className="empty-state">
                            <FaMoneyBillWave />
                            <h3>Nenhuma proposta encontrada</h3>
                            <p>
                                {filterStatus === 'ALL'
                                    ? 'Você ainda não recebeu nenhuma proposta de show.'
                                    : `Você não tem propostas com o status "${getStatusLabel(filterStatus)}".`}
                            </p>
                        </div>
                    ) : (
                        filteredContracts.map(contract => {
                            const { fullDate } = formatDateTime(contract.createdAt);
                            return (
                                <div key={contract.id} className={`proposal-card ${contract.status.toLowerCase()}`}>
                                    <div className="proposal-status-indicator">
                                        <span className="status-badge">{getStatusLabel(contract.status)}</span>
                                    </div>

                                    <div className="proposal-header">
                                        <div className="customer-info">
                                            <div className="customer-avatar">
                                                <FaUser />
                                            </div>
                                            <div className="customer-details">
                                                <h3>{contract.customer.name}</h3>
                                                <div className="customer-contact">
                                                    <span><FaWhatsapp /> {contract.customer.phoneNumber}</span>
                                                    <span><FaEnvelope /> {contract.customer.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="proposal-value">
                                            <span className="value-label">Valor</span>
                                            <span className="value-amount">{formatCurrency(contract.totalPrice)}</span>
                                        </div>
                                    </div>

                                    <div className="proposal-info">
                                        <div className="info-item">
                                            <FaCalendarDay />
                                            <div>
                                                <span className="info-label">Data da Solicitação</span>
                                                <span className="info-value">{fullDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {contract.status === 'PENDING_CONFIRMATION' && (
                                        <div className="proposal-actions">
                                            <button
                                                className="btn-action btn-confirm"
                                                onClick={() => handleContractAction(contract.id, 'confirm')}
                                            >
                                                <FaCheck /> Aceitar Proposta
                                            </button>
                                            <button
                                                className="btn-action btn-reject"
                                                onClick={() => handleContractAction(contract.id, 'reject')}
                                            >
                                                <FaTimes /> Recusar
                                            </button>
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
