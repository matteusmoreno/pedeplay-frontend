/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardFinances.js
 * (Aba "Finanças") - Correção de Alinhamento
 * ========================================
 */
import React from 'react';
import { FaDollarSign, FaHistory, FaChartLine } from 'react-icons/fa';

// Helper para formatar moeda (copiado do DashboardHome)
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
};

const DashboardFinances = ({ artist }) => {

    // O saldo vem dos detalhes do artista (artist.balance)
    const currentBalance = artist.balance || 0;

    return (
        <div className="dashboard-tab-content finances-tab">

            {/* 1. Card de Saldo Atual */}
            <div className="card-header">
                <h2>Finanças</h2>
            </div>

            <div className="show-stats-grid">
                <div className="stat-card balance">
                    <FaDollarSign />
                    <div className="stat-info">
                        <span className="stat-value">{formatCurrency(currentBalance)}</span>
                        <span className="stat-label">Saldo Disponível</span>
                    </div>
                </div>

                {/* Card de Saque (desabilitado por enquanto) */}
                <div className="stat-card withdraw-card">
                    <button className="btn-primary" disabled={true}>
                        Solicitar Saque
                    </button>
                    <span className="stat-label">Valor mínimo para saque: R$ 50,00</span>
                </div>
            </div>

            {/* --- Seção do Gráfico --- */}
            <div className="finances-chart-card card">
                <div className="card-header-simple">
                    {/* --- INÍCIO DA CORREÇÃO DE HTML --- */}
                    <h3>
                        <FaChartLine />
                        <span>Evolução de Ganhos</span>
                    </h3>
                    {/* --- FIM DA CORREÇÃO DE HTML --- */}
                </div>
                <div className="chart-placeholder">
                    <p className="empty-state-small">
                        O gráfico com a evolução de seus ganhos diários aparecerá aqui em breve.
                    </p>
                </div>
            </div>


            {/* 2. Histórico de Transações (Card) */}
            <div className="transactions-card card">
                <div className="card-header-simple">
                    {/* --- INÍCIO DA CORREÇÃO DE HTML --- */}
                    <h3>
                        <FaHistory />
                        <span>Histórico de Transações</span>
                    </h3>
                    {/* --- FIM DA CORREÇÃO DE HTML --- */}
                </div>
                <div className="song-list-container">
                    {/* NOTA: O backend ainda não tem um endpoint para listar
                      as transações. Quando tiver, podemos implementar aqui.
                    */}
                    <p className="empty-state-small">
                        Histórico de transações (gorjetas e saques) aparecerá aqui em breve.
                    </p>

                    {/* Exemplo de como será a lista (comentado):
                    <ul className="transactions-list">
                        <li className="transaction-item success">
                            <div className="transaction-info">
                                <span className="transaction-desc">Gorjeta (Pedido de Música)</span>
                                <span className="transaction-date">02/11/2025 às 14:30</span>
                            </div>
                            <span className="transaction-amount">+ R$ 5,00</span>
                        </li>
                        <li className="transaction-item danger">
                            <div className="transaction-info">
                                <span className="transaction-desc">Taxa de Saque</span>
                                <span className="transaction-date">01/11/2025 às 10:00</span>
                            </div>
                            <span className="transaction-amount">- R$ 1,50</span>
                        </li>
                    </ul>
                    */}
                </div>
            </div>
        </div>
    );
};

export default DashboardFinances;