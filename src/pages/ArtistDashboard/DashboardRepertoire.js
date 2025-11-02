/* * ========================================
 * ARQUIVO NOVO: src/pages/ArtistDashboard/DashboardRepertoire.js
 * (Aba "Repertório")
 * ========================================
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getArtistRepertoire, addSongsToRepertoire, removeSongsFromRepertoire } from '../../services/artistService';
import { getAllSongs, createSong } from '../../services/songService';
import { FaPlus, FaTrash, FaSearch } from 'react-icons/fa';

const DashboardRepertoire = ({ artist }) => {
    const { user } = useAuth();
    const [myRepertoire, setMyRepertoire] = useState([]);
    const [allSongs, setAllSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    // Estados para o formulário de "Nova Música"
    const [newTitle, setNewTitle] = useState('');
    const [newArtist, setNewArtist] = useState('');

    // Efeito para carregar o repertório do artista e todas as músicas
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const repertoireData = await getArtistRepertoire(user.id);
                setMyRepertoire(repertoireData);

                const allSongsData = await getAllSongs(0, 100); // Busca as 100 primeiras
                setAllSongs(allSongsData);
            } catch (err) {
                setError(err.message || 'Erro ao carregar dados do repertório.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user.id]);

    // Filtra músicas que já estão no repertório
    const availableSongs = allSongs.filter(
        (song) => !myRepertoire.some((repSong) => repSong.title === song.title && repSong.artistName === song.artistName)
    );

    // Handler para ADICIONAR uma música existente
    const handleAddSong = async (songId) => {
        setMessage(null);
        try {
            await addSongsToRepertoire(user.id, [songId]);
            // Recarrega os dados
            const repertoireData = await getArtistRepertoire(user.id);
            setMyRepertoire(repertoireData);
            setMessage('Música adicionada com sucesso!');
        } catch (err) {
            setError(err.message || 'Erro ao adicionar música.');
        }
    };

    // Handler para REMOVER uma música
    const handleRemoveSong = async (song) => {
        // O backend espera o ID da *música*, não o ID do artista
        // O `getArtistRepertoire` não retorna o ID da música, apenas title/artistName
        // Este é um PONTO DE ATENÇÃO: precisamos buscar o ID da música

        // Solução: O `availableSongs` foi filtrado, então `allSongs` tem os IDs.
        // Vamos encontrar a música em `allSongs` para pegar o ID.
        // NOTA: O backend deveria retornar o ID da música em `repertoire-details` para facilitar.

        const songToFind = allSongs.find(s => s.title === song.title && s.artistName === song.artistName);
        if (!songToFind || !songToFind.id) {
            // Tenta encontrar no myRepertoire (caso o allSongs não tenha vindo)
            const songFromRep = myRepertoire.find(s => s.title === song.title && s.artistName === song.artistName);
            if (!songFromRep || !songFromRep.id) {
                setError('Não foi possível encontrar o ID desta música para remover.');
                return;
            }
            // Se achou no repertório (e o back end retornar o ID), usa ele
            songToFind.id = songFromRep.id;
        }


        setMessage(null);
        try {
            await removeSongsFromRepertoire(user.id, [songToFind.id]);
            // Recarrega
            const repertoireData = await getArtistRepertoire(user.id);
            setMyRepertoire(repertoireData);
            setMessage('Música removida com sucesso!');
        } catch (err) {
            setError(err.message || 'Erro ao remover música.');
        }
    };

    // Handler para CRIAR e ADICIONAR uma nova música
    const handleCreateSong = async (e) => {
        e.preventDefault();
        if (!newTitle || !newArtist) {
            setError('Título e Artista são obrigatórios.');
            return;
        }

        setMessage(null);
        setError(null);

        try {
            // 1. Cria a nova música
            const newSong = await createSong(newTitle, newArtist);

            // 2. Adiciona a nova música ao repertório
            // O backend deve retornar o ID da música criada
            if (!newSong.id) {
                throw new Error("A API de criar música não retornou um ID.");
            }
            await addSongsToRepertoire(user.id, [newSong.id]);

            // 3. Recarrega tudo
            const repertoireData = await getArtistRepertoire(user.id);
            setMyRepertoire(repertoireData);

            const allSongsData = await getAllSongs(0, 100);
            setAllSongs(allSongsData);

            setMessage(`Música "${newSong.title}" criada e adicionada!`);
            setNewTitle('');
            setNewArtist('');
        } catch (err) {
            setError(err.message || 'Erro ao criar nova música.');
        }
    };


    if (isLoading) {
        return <div>Carregando repertório...</div>;
    }

    return (
        <div className="dashboard-tab-content">
            <div className="card-header">
                <h2>Meu Repertório</h2>
            </div>

            {error && <div className="form-message error-message">{error}</div>}
            {message && <div className="form-message success-message">{message}</div>}

            <div className="repertoire-layout">
                {/* Coluna 1: Adicionar Músicas */}
                <div className="repertoire-column">
                    <div className="card">
                        <h3>Criar Nova Música</h3>
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
                            <button type="submit" className="btn-primary">
                                <FaPlus /> Criar e Adicionar
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <h3>Adicionar do Banco de Músicas</h3>
                        <div className="form-group">
                            <label htmlFor="searchSong">Buscar Música <FaSearch /></label>
                            <input
                                id="searchSong"
                                type="text"
                                placeholder="Buscar por título ou artista..."
                            // OBS: A busca real (filtro) não está implementada
                            // ainda, apenas listamos as disponíveis.
                            />
                        </div>
                        <ul className="song-list">
                            {availableSongs.length > 0 ? availableSongs.map(song => (
                                <li key={song.id} className="song-list-item">
                                    <div>
                                        <span className="song-title">{song.title}</span>
                                        <span className="song-artist">{song.artistName}</span>
                                    </div>
                                    <button
                                        className="btn-icon add"
                                        onClick={() => handleAddSong(song.id)}
                                        title="Adicionar ao repertório"
                                    >
                                        <FaPlus />
                                    </button>
                                </li>
                            )) : (
                                <p className="empty-state-small">Nenhuma música nova encontrada.</p>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Coluna 2: Meu Repertório Atual */}
                <div className="repertoire-column">
                    <div className="card">
                        <h3>Músicas no meu Repertório ({myRepertoire.length})</h3>
                        <ul className="song-list">
                            {myRepertoire.length > 0 ? myRepertoire.map(song => (
                                // A key precisa ser única
                                <li key={song.id || `${song.title}-${song.artistName}`} className="song-list-item">
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
                            )) : (
                                <p className="empty-state-small">Seu repertório está vazio.</p>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardRepertoire;