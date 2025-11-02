/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/ArtistDashboard.js
 * (Controlador das Abas) - CORRIGIDO
 * ========================================
 */
import React, { useState, useEffect, useCallback } from 'react'; // 1. Importar useCallback
import { useAuth } from '../../hooks/useAuth';
import { getArtistDetails } from '../../services/artistService';
import './ArtistDashboard.css';
import { FaBroadcastTower, FaUser, FaMusic } from 'react-icons/fa';

// Importa os novos componentes de abas
import DashboardHome from './DashboardHome';
import DashboardProfile from './DashboardProfile';
import DashboardRepertoire from './DashboardRepertoire';

const ArtistDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('home');
    const [artistData, setArtistData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- INÍCIO DA CORREÇÃO (exhaustive-deps) ---
    // 2. Envolvemos a função fetchArtistData em useCallback
    const fetchArtistData = useCallback(async () => {
        if (!user?.id) {
            setError("Usuário não encontrado.");
            setIsLoading(false);
            return;
        }

        // Reseta o estado de carregamento para novas buscas
        setIsLoading(true);
        try {
            const data = await getArtistDetails(user.id);
            setArtistData(data);
        } catch (err) {
            setError(err.message || "Não foi possível carregar os dados do artista.");
        } finally {
            setIsLoading(false);
        }
    }, [user.id]); // 3. A dependência do useCallback é user.id
    // --- FIM DA CORREÇÃO ---

    // Busca os dados do artista ao carregar o dashboard
    useEffect(() => {
        // 4. Chamamos a função
        fetchArtistData();
    }, [fetchArtistData]); // 5. Adicionamos a função ao array de dependências

    // Renderiza o conteúdo da aba selecionada
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
                // Passa a função de recarregar os dados
                return <DashboardProfile artist={artistData} onUpdate={fetchArtistData} />;
            case 'repertoire':
                return <DashboardRepertoire artist={artistData} />;
            default:
                return <DashboardHome artist={artistData} />;
        }
    };

    return (
        <div className="dashboard-layout">
            {/* Menu Lateral de Navegação */}
            <nav className="dashboard-nav">
                <div className="dashboard-nav-header">
                    <h3>Painel do Artista</h3>
                </div>
                <ul>
                    <li className={activeTab === 'home' ? 'active' : ''}>
                        <button onClick={() => setActiveTab('home')}>
                            <FaBroadcastTower />
                            <span>Ao Vivo</span>
                        </button>
                    </li>
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
                </ul>
            </nav>

            {/* Conteúdo Principal da Aba */}
            <main className="dashboard-main-content">
                {renderTabContent()}
            </main>
        </div>
    );
};

export default ArtistDashboard;