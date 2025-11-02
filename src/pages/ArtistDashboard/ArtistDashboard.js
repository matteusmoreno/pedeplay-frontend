/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/ArtistDashboard.js
 * (Controlador das Abas)
 * ========================================
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getArtistDetails } from '../../services/artistService';
import './ArtistDashboard.css';
// --- 1. Adicionar FaDollarSign ---
import { FaBroadcastTower, FaUser, FaMusic, FaDollarSign } from 'react-icons/fa';

// Importa os componentes de abas
import DashboardHome from './DashboardHome';
import DashboardProfile from './DashboardProfile';
import DashboardRepertoire from './DashboardRepertoire';
// --- 2. Importar o novo componente ---
import DashboardFinances from './DashboardFinances';

const ArtistDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [artistData, setArtistData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchArtistData = useCallback(async () => {
        if (!user?.id) {
            setError("Usuário não encontrado.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await getArtistDetails(user.id);
            setArtistData(data);
        } catch (err) {
            setError(err.message || "Não foi possível carregar os dados do artista.");
        } finally {
            setIsLoading(false);
        }
    }, [user.id]);

    useEffect(() => {
        fetchArtistData();
    }, [fetchArtistData]);

    const renderTabContent = () => {
        if (isLoading) {
            return <div className="loading-full-page">Carregando...</div>;
        }
        if (error) {
            return <div className="error-full-page">{error}</div>;
        }
        if (!artistData) {
            return <div className="loading-full-page">Nenhum dado de artista encontrado.</div>;
        }

        switch (activeTab) {
            case 'home':
                return <DashboardHome artist={artistData} />;
            case 'profile':
                return <DashboardProfile artist={artistData} onUpdate={fetchArtistData} />;
            case 'repertoire':
                return <DashboardRepertoire artist={artistData} />;
            // --- 3. Adicionar o case para 'finances' ---
            case 'finances':
                return <DashboardFinances artist={artistData} />;
            default:
                return <DashboardProfile artist={artistData} onUpdate={fetchArtistData} />;
        }
    };

    return (
        <div className="dashboard-layout">
            <nav className="dashboard-nav">
                <div className="dashboard-nav-header">
                    <h3>Painel do Artista</h3>
                </div>
                <ul>
                    {/* --- 4. Reordenar e adicionar a nova aba --- */}
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
                    {/* --- FIM DA CORREÇÃO --- */}
                </ul>
            </nav>

            <main className="dashboard-main-content">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default ArtistDashboard;