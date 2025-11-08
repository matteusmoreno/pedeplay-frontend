/* * ========================================
 * ARQUIVO: src/components/Header/UserMenu/UserMenu.js
 * (Modificado para abrir link público em nova aba e fechar menu no dashboard)
 * ========================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import './UserMenu.css';
import { FaUserCircle, FaExternalLinkAlt, FaSignOutAlt, FaChevronDown, FaTachometerAlt } from 'react-icons/fa';

const UserMenu = () => {
    const { logout, user, artistData } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Hook para fechar o menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // artistData pode demorar um pouco para carregar, então temos fallbacks
    const displayName = artistData?.name || user?.email;
    const profileImage = artistData?.profileImageUrl;

    return (
        <div className="user-menu-container" ref={menuRef}>
            <button className="user-menu-button" onClick={() => setIsOpen(!isOpen)}>
                <div className="user-avatar">
                    {profileImage ? (
                        <img src={profileImage} alt="Avatar" />
                    ) : (
                        <FaUserCircle />
                    )}
                </div>
                <span className="user-menu-name">{displayName}</span>
                <FaChevronDown className={`user-menu-chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="user-menu-dropdown">
                    <div className="dropdown-header">
                        <p className="dropdown-name">{artistData?.name || 'Artista'}</p>
                        <p className="dropdown-email">{user?.email}</p>
                    </div>

                    {/* --- INÍCIO DA CORREÇÃO (Dashboard) --- */}
                    <Link
                        to="/dashboard"
                        className="dropdown-item"
                        onClick={() => setIsOpen(false)} // Fecha o menu ao clicar
                    >
                        <FaTachometerAlt />
                        <span>Painel do Artista</span>
                    </Link>
                    {/* --- FIM DA CORREÇÃO --- */}

                    {/* --- INÍCIO DA CORREÇÃO (Página Pública) --- */}
                    <Link
                        to={`/show/${user?.id}`}
                        className="dropdown-item"
                        target="_blank" // Abre em nova aba
                        rel="noopener noreferrer"
                        onClick={() => setIsOpen(false)} // Opcional: fechar ao clicar também
                    >
                        <FaExternalLinkAlt />
                        <span>Minha Página Pública</span>
                    </Link>
                    {/* --- FIM DA CORREÇÃO --- */}

                    <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                        <FaSignOutAlt />
                        <span>Sair</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserMenu;