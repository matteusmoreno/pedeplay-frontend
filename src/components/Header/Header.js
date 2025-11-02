/* * ========================================
 * ARQUIVO: src/components/Header/Header.js
 * (Refatorado para usar UserMenu)
 * ========================================
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';
import UserMenu from './UserMenu/UserMenu'; // <-- 1. Importar o novo componente

const Header = () => {
    // 2. 'artistData' agora está disponível no contexto
    const { isAuthenticated } = useAuth();

    return (
        <header className="header">
            <div className="header-container">
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="header-logo">
                    PedePlay
                </Link>
                <nav>
                    {/* --- INÍCIO DA CORREÇÃO --- */}
                    {isAuthenticated ? (
                        <UserMenu /> // 3. Substituir links soltos pelo UserMenu
                    ) : (
                        <Link to="/login" className="btn-primary"> {/* Mudei para btn-primary */}
                            Login do Artista
                        </Link>
                    )}
                    {/* --- FIM DA CORREÇÃO --- */}
                </nav>
            </div>
        </header>
    );
};

export default Header;