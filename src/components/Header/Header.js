/* * ========================================
 * ARQUIVO: src/components/Header/Header.js
 * (Texto do botão de Login atualizado)
 * ========================================
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Header.css';
import UserMenu from './UserMenu/UserMenu';

const Header = () => {
    const { isAuthenticated } = useAuth();

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="header-logo">
                    PedePlay
                </Link>

                <nav>
                    {isAuthenticated ? (
                        <UserMenu />
                    ) : (
                        /* --- INÍCIO DA CORREÇÃO --- */
                        <Link to="/login" className="btn-primary">
                            Login
                        </Link>
                        /* --- FIM DA CORREÇÃO --- */
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;