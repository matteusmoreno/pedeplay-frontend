/* ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardFinances.js
 * Finanças do Artista - Design Aprimorado
 * ========================================
 */
import React, { useState } from 'react';
import { FaDollarSign, FaHistory, FaChartLine, FaWallet, FaArrowUp, FaArrowDown, FaInfoCircle, FaClock } from 'react-icons/fa';
import './DashboardFinances.css';

// Helper para formatar moeda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
};

const DashboardFinances = ({ artist }) => {
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const currentBalance = artist.balance || 0;
    const minWithdraw = 50;
    const canWithdraw = currentBalance >= minWithdraw;

    const mockTransactions = [];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="dashboard-tab-content finances-tab">
            {/* Header com Resumo Financeiro */}
            <div className="finances-header">
                <div className="finances-header-content">
                    <div className="finances-header-icon">
                        <FaWallet />
                    </div>
                    <div className="finances-header-text">
                        <h2>Finanças</h2>
                        <p>Gerencie seus ganhos e saques</p>
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="finances-stats-grid">
                {/* Saldo Disponível */}
                <div className="finances-stat-card finances-balance">
                    <div className="finances-stat-icon">
                        <FaDollarSign />
                    </div>
                    <div className="finances-stat-content">
                        <span className="finances-stat-label">Saldo Disponível</span>
                        <span className="finances-stat-value">{formatCurrency(currentBalance)}</span>
                        <span className="finances-stat-info">
                            <FaInfoCircle /> Disponível para saque
                        </span>
                    </div>
                </div>

                {/* Ganhos do Mês */}
                <div className="finances-stat-card finances-earnings">
                    <div className="finances-stat-icon">
                        <FaArrowUp />
                    </div>
                    <div className="finances-stat-content">
                        <span className="finances-stat-label">Ganhos do Mês</span>
                        <span className="finances-stat-value">{formatCurrency(0)}</span>
                        <span className="finances-stat-info">
                            <FaClock /> Dezembro 2025
                        </span>
                    </div>
                </div>

                {/* Saques Realizados */}
                <div className="finances-stat-card finances-withdrawals">
                    <div className="finances-stat-icon">
                        <FaArrowDown />
                    </div>
                    <div className="finances-stat-content">
                        <span className="finances-stat-label">Saques Realizados</span>
                        <span className="finances-stat-value">{formatCurrency(0)}</span>
                        <span className="finances-stat-info">
                            <FaClock /> Dezembro 2025
                        </span>
                    </div>
                </div>
            </div>

            {/* Card de Saque */}
            <div className="finances-withdraw-card">
                <div className="finances-withdraw-info">
                    <h3><FaWallet /> Solicitar Saque</h3>
                    <p>Valor mínimo: {formatCurrency(minWithdraw)}</p>
                    {!canWithdraw && (
                        <div className="finances-withdraw-warning">
                            <FaInfoCircle />
                            <span>Você precisa ter pelo menos {formatCurrency(minWithdraw)} para solicitar um saque</span>
                        </div>
                    )}
                </div>
                <button 
                    className="finances-withdraw-btn" 
                    disabled={!canWithdraw}
                    onClick={() => setShowWithdrawModal(true)}
                >
                    <FaDollarSign /> Solicitar Saque
                </button>
            </div>

            {/* Gráfico de Ganhos */}
            <div className="finances-chart-card">
                <div className="finances-chart-header">
                    <h3><FaChartLine /> Evolução de Ganhos</h3>
                </div>
                <div className="finances-chart-placeholder">
                    <FaChartLine className="finances-chart-icon" />
                    <p>Gráfico com a evolução dos seus ganhos diários</p>
                    <span>Em breve</span>
                </div>
            </div>

            {/* Histórico de Transações */}
            <div className="finances-transactions-card">
                <div className="finances-transactions-header">
                    <h3><FaHistory /> Histórico de Transações</h3>
                    <span className="finances-transactions-count">{mockTransactions.length} transações</span>
                </div>
                <div className="finances-transactions-list">
                    {mockTransactions.length > 0 ? (
                        mockTransactions.map(transaction => (
                            <div key={transaction.id} className={`finances-transaction-item finances-transaction-${transaction.type}`}>
                                <div className="finances-transaction-icon">
                                    {transaction.type === 'income' ? <FaArrowUp /> : <FaArrowDown />}
                                </div>
                                <div className="finances-transaction-info">
                                    <span className="finances-transaction-desc">{transaction.description}</span>
                                    <span className="finances-transaction-date">{formatDate(transaction.date)}</span>
                                </div>
                                <span className="finances-transaction-amount">
                                    {transaction.type === 'income' ? '+ ' : '- '}
                                    {formatCurrency(transaction.amount)}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="finances-empty-state">
                            <FaHistory className="finances-empty-icon" />
                            <h3>Nenhuma Transação</h3>
                            <p>Suas transações aparecerão aqui</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardFinances;