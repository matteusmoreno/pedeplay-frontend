import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getActiveShowByArtist } from '../../services/showService';
import MakeRequestForm from '../../components/MakeRequestForm/MakeRequestForm';
import './PublicShowPage.css';

const PublicShowPage = () => {
    const { artistId } = useParams(); // Pega o artistId da URL
    const [activeShow, setActiveShow] = useState(null);
    const [artistName, setArtistName] = useState("Artista"); // Você pode buscar o nome do artista
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchShow = async () => {
            if (!artistId) {
                setError("ID do artista não fornecido.");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);
            try {
                const showData = await getActiveShowByArtist(artistId);
                setActiveShow(showData);
                // Idealmente, o 'showData' ou um endpoint '/artists/{artistId}' 
                // forneceria o nome do artista.
                // setArtistName(showData.artistName); 
            } catch (err) {
                console.error(err);
                setError("O artista não está com um show ativo no momento.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchShow();
    }, [artistId]);

    if (isLoading) {
        return <div className="public-page-message">Carregando show do artista...</div>;
    }

    if (error) {
        return <div className="public-page-message error">{error}</div>;
    }

    return (
        <div className="public-show-page">
            <div className="artist-info-header card">
                <h1>{artistName}</h1>
                <p>Peça sua música e mande sua mensagem!</p>
            </div>

            <MakeRequestForm artistId={artistId} showId={activeShow.id} />
        </div>
    );
};

export default PublicShowPage;