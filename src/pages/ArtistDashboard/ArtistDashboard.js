import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import './ArtistDashboard.css';
import { FaBroadcastTower, FaUser, FaMusic, FaDollarSign, FaCalendarAlt, FaFileContract } from 'react-icons/fa';

// Importa os componentes de abas
import DashboardHome from './DashboardHome';
import DashboardProfile from './DashboardProfile';
import DashboardRepertoire from './DashboardRepertoire';
import DashboardFinances from './DashboardFinances';
import DashboardAgenda from './DashboardAgenda';
import DashboardProposals from './DashboardProposals';

const ArtistDashboard = () => {
    const { artistData, loading, user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    if (!user) {
        return <div className="loading-full-page">Usuário não encontrado.</div>;
    }

    const renderTabContent = () => {
        if (loading) {
            return <div className="loading-full-page">Carregando...</div>;
        }

        if (!artistData) {
            return <div className="error-full-page">Não foi possível carregar os dados do artista.</div>;
        }

        switch (activeTab) {
            case 'home':
                return <DashboardHome artist={artistData} />;
            case 'profile':
                return <DashboardProfile artist={artistData} onUpdate={() => { }} />;
            case 'repertoire':
                return <DashboardRepertoire artist={artistData} />;
            case 'finances':
                return <DashboardFinances artist={artistData} />;
            case 'agenda':
                return <DashboardAgenda artist={artistData} />;
            case 'proposals':
                return <DashboardProposals artist={artistData} />;
            default:
                return <DashboardProfile artist={artistData} onUpdate={() => { }} />;
        }
    };

    return (
        <div className="dashboard-layout">
            <nav className="dashboard-nav">
                <div className="dashboard-nav-header">
                    <h3>Painel do Artista</h3>
                </div>
                <ul>
                    <li className={activeTab === 'profile' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('profile')}>
                            <FaUser />
                            <span>Meu Perfil</span>
                        </button>
                    </li>
                    <li className={activeTab === 'repertoire' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('repertoire')}>
                            <FaMusic />
                            <span>Repertório</span>
                        </button>
                    </li>
                    <li className={activeTab === 'finances' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('finances')}>
                            <FaDollarSign />
                            <span>Finanças</span>
                        </button>
                    </li>
                    <li className={activeTab === 'home' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('home')}>
                            <FaBroadcastTower />
                            <span>Modo Show</span>
                        </button>
                    </li>
                    <li className={activeTab === 'agenda' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('agenda')}>
                            <FaCalendarAlt />
                            <span>Agenda</span>
                        </button>
                    </li>
                    <li className={activeTab === 'proposals' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('proposals')}>
                            <FaFileContract />
                            <span>Propostas</span>
                        </button>
                    </li>
                </ul>
            </nav>

            <main className="dashboard-main-content">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default ArtistDashboard;