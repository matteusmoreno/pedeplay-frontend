/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/ArtistDashboard.js
 * (Refatorado para usar dados do Contexto)
 * ========================================
 */
import React, { useState } from 'react'; // Removido useEffect e useCallback
import { useAuth } from '../../hooks/useAuth';
// import { getArtistDetails } from '../../services/artistService'; // <-- REMOVIDO
import './ArtistDashboard.css';
import { FaBroadcastTower, FaUser, FaMusic, FaDollarSign } from 'react-icons/fa';

// Importa os componentes de abas
import DashboardHome from './DashboardHome';
import DashboardProfile from './DashboardProfile';
import DashboardRepertoire from './DashboardRepertoire';
import DashboardFinances from './DashboardFinances';

const ArtistDashboard = () => {
    // --- INÍCIO DA CORREÇÃO ---
    // Buscar 'artistData', 'loading' e 'error' diretamente do contexto
    const { artistData, loading, user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');

    // O 'user' do token é verificado primeiro
    if (!user) {
        return <div className="loading-full-page">Usuário não encontrado.</div>;
    }

    // --- FIM DA CORREÇÃO ---


    const renderTabContent = () => {
        // Usa o 'loading' do contexto (que espera o fetch do artista)
        if (loading) {
            return <div className="loading-full-page">Carregando...</div>;
        }

        // Se o fetch do artista falhou no contexto, exibe erro
        if (!artistData) {
            return <div className="error-full-page">Não foi possível carregar os dados do artista.</div>;
        }

        switch (activeTab) {
            case 'home':
                return <DashboardHome artist={artistData} />;
            case 'profile':
                // O fetchArtistData do contexto não está aqui,
                // mas o 'onUpdate' no DashboardProfile vai precisar chamar algo.
                // Por enquanto, vamos manter simples.
                return <DashboardProfile artist={artistData} onUpdate={() => { }} />; // TODO: Melhorar onUpdate
            case 'repertoire':
                return <DashboardRepertoire artist={artistData} />;
            case 'finances':
                return <DashboardFinances artist={artistData} />;
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
                    <li className={activeTab === 'finances' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('finances')}>
                            <FaDollarSign />
                            <span>Finanças</span>
                        </button>
                    </li>
                    <li className={activeTab === 'repertoire' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('repertoire')}>
                            <FaMusic />
                            <span>Repertório</span>
                        </button>
                    </li>
                    <li className={activeTab === 'home' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('home')}>
                            <FaBroadcastTower />
                            <span>Modo Show</span>
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