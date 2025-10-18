import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';

const Header = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="header-logo">
                    PedePlay
                </Link>
                <nav>
                    {isAuthenticated ? (
                        <>
                            <span className="header-welcome">Olá, {user?.email}</span>
                            {/* Link para a página pública do artista */}
                            <Link to={`/show/${user?.id}`} className="header-link">
                                Minha Página Pública
                            </Link>
                            <button onClick={handleLogout} className="btn-secondary">
                                Sair
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="header-link">
                            Login do Artista
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;