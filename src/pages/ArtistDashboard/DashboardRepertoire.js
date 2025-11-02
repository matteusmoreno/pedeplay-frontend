/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardRepertoire.js
 * (Aba "Repertório")
 * ========================================
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getArtistRepertoire, addSongsToRepertoire, removeSongsFromRepertoire } from '../../services/artistService';
import { getAllSongs, createSong } from '../../services/songService';
import { FaPlus, FaTrash, FaSearch, FaChevronDown } from 'react-icons/fa';

// Componente Accordion
const AccordionSection = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
            <button type="button" className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="accordion-title">
                    {icon}
                    <span>{title}</span>
                </div>
                <FaChevronDown className="accordion-icon" />
            </button>
            <div className="accordion-content">
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

            {/* --- 1. CARD DE EXIBIÇÃO --- */}
            <div className="repertoire-info-card card">
                <div className="card-header-simple">
                    <h3>Meu Repertório ({myRepertoire.length})</h3>
                    <span className="repertoire-count">
                        Plano {artist.subscription?.planType || 'FREE'}: {myRepertoire.length} / {artist.subscription?.planType === 'FREE' ? '300' : 'Ilimitado'}
                    </span>
                </div>
                <div className="song-list-container">
                    <ul className="song-list">
                        {myRepertoire.length > 0 ? (
                            myRepertoire.map(song => (
                                <li key={song.id} className="song-list-item">
                                    <div>
                                        <span className="song-title">{song.title}</span>
                                        <span className="song-artist">{song.artistName}</span>
                                    </div>
                                    <button
                                        className="btn-icon remove"
                                        onClick={() => handleRemoveSong(song)}
                                        title="Remover do repertório"
                                    >
                                        <FaTrash />
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p className="empty-state-small">Seu repertório está vazio. Adicione músicas abaixo.</p>
                        )}
                    </ul>
                </div>
            </div>

            {/* Mensagens de Sucesso/Erro */}
            {message.text && (
                <div className={`form-message ${message.type}-message`}>{message.text}</div>
            )}

            {/* --- 2. SEÇÕES DE AÇÃO (ACCORDION) --- */}
            <div className="repertoire-actions-form card">

                {/* --- INÍCIO DA CORREÇÃO --- */}
                {/* Alterado 'defaultOpen={true}' para 'defaultOpen={false}' (ou removido) */}
                <AccordionSection title="Adicionar do Banco de Músicas" icon={<FaSearch />} defaultOpen={false}>
                    {/* --- FIM DA CORREÇÃO --- */}

                    <div className="form-group">
                        <label htmlFor="searchSong">Buscar Música</label>
                        <div className="search-input-group">
                            <span className="search-icon"><FaSearch /></span>
                            <input
                                id="searchSong"
                                type="text"
                                placeholder="Buscar por título ou artista..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="song-list-container short-list">
                        <ul className="song-list">
                            {availableSongs.length > 0 ? (
                                availableSongs.map(song => (
                                    <li key={song.id} className="song-list-item">
                                        <div>
                                            <span className="song-title">{song.title}</span>
                                            <span className="song-artist">{song.artistName}</span>
                                        </div>
                                        <button
                                            className="btn-icon add"
                                            onClick={() => handleAddSong(song)}
                                            title="Adicionar ao repertório"
                                        >
                                            <FaPlus />
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <p className="empty-state-small">
                                    {searchTerm ? 'Nenhuma música encontrada.' : 'Todas as músicas já estão no seu repertório.'}
                                </p>
                            )}
                        </ul>
                    </div>
                </AccordionSection>

                {/* A seção de "Criar" é seu próprio formulário */}
                <AccordionSection title="Criar Nova Música" icon={<FaPlus />}>
                    <form onSubmit={handleCreateSong} className="repertoire-form">
                        <div className="form-group">
                            <label htmlFor="newTitle">Título da Música</label>
                            <input
                                id="newTitle"
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Ex: Garota de Ipanema"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="newArtist">Artista Original</label>
                            <input
                                id="newArtist"
                                type="text"
                                value={newArtist}
                                onChange={(e) => setNewArtist(e.target.value)}
                                placeholder="Ex: Tom Jobim"
                            />
                        </div>
                        <button type="submit" className="btn-primary" disabled={isCreating}>
                            <FaPlus /> {isCreating ? 'Criando...' : 'Criar e Adicionar'}
                        </button>
                    </form>
                </AccordionSection>
            </div>
        </div>
    );
};

export default DashboardRepertoire;