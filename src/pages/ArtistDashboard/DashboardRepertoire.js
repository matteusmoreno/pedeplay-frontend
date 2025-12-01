/* ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardRepertoire.js
 * Repertório do Artista - Design Aprimorado
 * ========================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getArtistRepertoire, addSongsToRepertoire, removeSongsFromRepertoire } from '../../services/artistService';
import { getAllSongs, createSong } from '../../services/songService';
import { FaPlus, FaTrash, FaSearch, FaChevronDown, FaMusic, FaMicrophone, FaTimes, FaCheck } from 'react-icons/fa';
import './DashboardRepertoire.css';

// Componente Accordion
const AccordionSection = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`repertoire-accordion ${isOpen ? 'open' : ''}`}>
            <button type="button" className="repertoire-accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="repertoire-accordion-title">
                    {icon}
                    <span>{title}</span>
                </div>
                <FaChevronDown className="repertoire-accordion-icon" />
            </button>
            <div className="repertoire-accordion-content">
                {children}
            </div>
        </div>
    );
};

const DashboardRepertoire = ({ artist }) => {
    const { user } = useAuth();
    const [myRepertoire, setMyRepertoire] = useState([]);
    const [allSongs, setAllSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newTitle, setNewTitle] = useState('');
    const [newArtist, setNewArtist] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Auto-dismiss alert após 5 segundos
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Função para carregar todos os dados
    const loadData = async () => {
        try {
            const [repertoireData, allSongsData] = await Promise.all([
                getArtistRepertoire(user.id),
                getAllSongs(0, 500) // Limite de 500
            ]);
            setMyRepertoire(repertoireData);
            setAllSongs(allSongsData);
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Erro ao carregar dados.' });
        } finally {
            setIsLoading(false);
        }
    };

    // Carrega dados no início
    useEffect(() => {
        loadData();
    }, [user.id]);

    // Mapeia IDs do repertório para filtragem rápida
    const repertoireIds = useMemo(() =>
        new Set(myRepertoire.map(song => song.id)),
        [myRepertoire]);

    // Filtra músicas disponíveis para adicionar
    const availableSongs = useMemo(() => {
        return allSongs.filter(song =>
            !repertoireIds.has(song.id) &&
            (song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                song.artistName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [allSongs, repertoireIds, searchTerm]);

    // Handler para ADICIONAR
    const handleAddSong = async (songToAdd) => {
        setMessage({ type: '', text: '' });
        try {
            await addSongsToRepertoire(user.id, [songToAdd.id]);
            setMyRepertoire(prev => [...prev, songToAdd]);
            setMessage({ type: 'success', text: `"${songToAdd.title}" adicionada!` });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Erro ao adicionar música.' });
        }
    };

    // Handler para REMOVER
    const handleRemoveSong = async (songToRemove) => {
        setMessage({ type: '', text: '' });
        try {
            await removeSongsFromRepertoire(user.id, [songToRemove.id]);
            setMyRepertoire(prev => prev.filter(song => song.id !== songToRemove.id));
            setMessage({ type: 'success', text: `"${songToRemove.title}" removida!` });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Erro ao remover música.' });
        }
    };

    // Handler para CRIAR E ADICIONAR
    const handleCreateSong = async (e) => {
        e.preventDefault();
        if (!newTitle || !newArtist) {
            setMessage({ type: 'error', text: 'Título e Artista são obrigatórios.' });
            return;
        }

        setIsCreating(true);
        setMessage({ type: '', text: '' });

        try {
            const newSong = await createSong(newTitle, newArtist);
            if (!newSong || !newSong.id) {
                throw new Error("API não retornou a nova música com ID.");
            }
            await addSongsToRepertoire(user.id, [newSong.id]);

            setMyRepertoire(prev => [...prev, newSong]);
            setAllSongs(prev => [...prev, newSong]);

            setMessage({ type: 'success', text: `Música "${newSong.title}" criada e adicionada!` });
            setNewTitle('');
            setNewArtist('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Erro ao criar nova música.' });
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return <div className="loading-full-page">Carregando repertório...</div>;
    }

    return (
        <div className="dashboard-tab-content repertoire-tab">
            {/* Header com Estatísticas */}
            <div className="repertoire-header">
                <div className="repertoire-header-content">
                    <div className="repertoire-header-icon">
                        <FaMusic />
                    </div>
                    <div className="repertoire-header-text">
                        <h2>Meu Repertório</h2>
                        <p>Gerencie as músicas que você toca</p>
                    </div>
                </div>
                <div className="repertoire-stats">
                    <div className="repertoire-stat-card">
                        <span className="repertoire-stat-number">{myRepertoire.length}</span>
                        <span className="repertoire-stat-label">Músicas</span>
                    </div>
                    <div className="repertoire-stat-card">
                        <span className="repertoire-stat-number">
                            {artist.subscription?.planType === 'FREE' ? '300' : '∞'}
                        </span>
                        <span className="repertoire-stat-label">Limite</span>
                    </div>
                </div>
            </div>

            {/* Mensagens de Sucesso/Erro */}
            {message.text && (
                <div className={`repertoire-alert repertoire-alert-${message.type}`}>
                    {message.type === 'success' ? <FaCheck /> : <FaTimes />}
                    <span>{message.text}</span>
                    <button 
                        className="repertoire-alert-close" 
                        onClick={() => setMessage({ type: '', text: '' })}
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* Lista do Repertório */}
            <div className="repertoire-main-card">
                <div className="repertoire-card-header">
                    <h3><FaMusic /> Músicas no Repertório</h3>
                    <input
                        type="text"
                        className="repertoire-quick-search"
                        placeholder="Buscar no repertório..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="repertoire-songs-grid">
                    {myRepertoire.length > 0 ? (
                        myRepertoire
                            .filter(song => 
                                song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                song.artistName.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map(song => (
                                <div key={song.id} className="repertoire-song-card">
                                    <div className="repertoire-song-icon">
                                        <FaMicrophone />
                                    </div>
                                    <div className="repertoire-song-info">
                                        <span className="repertoire-song-title">{song.title}</span>
                                        <span className="repertoire-song-artist">{song.artistName}</span>
                                    </div>
                                    <button
                                        className="repertoire-remove-btn"
                                        onClick={() => handleRemoveSong(song)}
                                        title="Remover do repertório"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))
                    ) : (
                        <div className="repertoire-empty-state">
                            <FaMusic className="repertoire-empty-icon" />
                            <h3>Repertório Vazio</h3>
                            <p>Comece adicionando músicas do banco de dados ou criando novas</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Ações - Adicionar e Criar */}
            <div className="repertoire-actions-container">
                <AccordionSection title="Adicionar do Banco de Músicas" icon={<FaSearch />} defaultOpen={false}>
                    <div className="repertoire-search-section">
                        <div className="repertoire-search-input-wrapper">
                            <FaSearch className="repertoire-search-icon" />
                            <input
                                type="text"
                                className="repertoire-search-input"
                                placeholder="Buscar por título ou artista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="repertoire-available-list">
                            {availableSongs.length > 0 ? (
                                availableSongs.map(song => (
                                    <div key={song.id} className="repertoire-available-song">
                                        <div className="repertoire-available-info">
                                            <FaMicrophone className="repertoire-available-icon" />
                                            <div>
                                                <span className="repertoire-available-title">{song.title}</span>
                                                <span className="repertoire-available-artist">{song.artistName}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="repertoire-add-btn"
                                            onClick={() => handleAddSong(song)}
                                            title="Adicionar ao repertório"
                                        >
                                            <FaPlus /> Adicionar
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="repertoire-no-results">
                                    <FaSearch className="repertoire-no-results-icon" />
                                    <p>{searchTerm ? 'Nenhuma música encontrada.' : 'Todas as músicas já estão no seu repertório.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title="Criar Nova Música" icon={<FaPlus />} defaultOpen={false}>
                    <form onSubmit={handleCreateSong} className="repertoire-create-form">
                        <div className="repertoire-form-grid">
                            <div className="repertoire-form-group">
                                <label htmlFor="newTitle">Título da Música</label>
                                <input
                                    id="newTitle"
                                    type="text"
                                    className="repertoire-input"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Ex: Garota de Ipanema"
                                />
                            </div>
                            <div className="repertoire-form-group">
                                <label htmlFor="newArtist">Artista Original</label>
                                <input
                                    id="newArtist"
                                    type="text"
                                    className="repertoire-input"
                                    value={newArtist}
                                    onChange={(e) => setNewArtist(e.target.value)}
                                    placeholder="Ex: Tom Jobim"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            className="repertoire-create-btn" 
                            disabled={isCreating || !newTitle || !newArtist}
                        >
                            {isCreating ? (
                                <>
                                    <span className="repertoire-spinner"></span>
                                    Criando...
                                </>
                            ) : (
                                <>
                                    <FaPlus /> Criar e Adicionar
                                </>
                            )}
                        </button>
                    </form>
                </AccordionSection>
            </div>
        </div>
    );
};

export default DashboardRepertoire;