import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
    FaCalendarAlt, 
    FaHandshake, 
    FaVideo,
    FaBars,
    FaTimes 
} from 'react-icons/fa';
import './Header.css';
import UserMenu from './UserMenu/UserMenu';

const Header = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isHomePage = location.pathname === '/';
    const isDashboard = location.pathname.startsWith('/dashboard');

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            window.location.href = `/#${sectionId}`;
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setMobileMenuOpen(false);
    };

    return (
        <header className={`header ${isDashboard ? 'header-dashboard' : ''}`}>
            <div className="header-container">
                <Link to="/" className="header-logo">
                    <span className="logo-text">Contrrat</span>
                </Link>

                {!isDashboard && (
                    <>
                        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
                            {!isAuthenticated && isHomePage && (
                                <div className="nav-links">
                                    <button 
                                        onClick={() => scrollToSection('features')} 
                                        className="nav-link"
                                    >
                                        <FaCalendarAlt />
                                        <span>Funcionalidades</span>
                                    </button>
                                    <button 
                                        onClick={() => scrollToSection('how-it-works')} 
                                        className="nav-link"
                                    >
                                        <FaHandshake />
                                        <span>Como Funciona</span>
                                    </button>
                                    <button 
                                        onClick={() => scrollToSection('benefits')} 
                                        className="nav-link"
                                    >
                                        <FaVideo />
                                        <span>Benefícios</span>
                                    </button>
                                </div>
                            )}

                            <div className="nav-actions">
                                {isAuthenticated ? (
                                    <UserMenu />
                                ) : (
                                    <>
                                        <Link to="/login" className="btn-secondary-outline">
                                            Entrar
                                        </Link>
                                        <Link to="/register" className="btn-primary">
                                            Começar Grátis
                                        </Link>
                                    </>
                                )}
                            </div>
                        </nav>

                        <button 
                            className="mobile-menu-toggle"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Menu"
                        >
                            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </>
                )}

                {isDashboard && (
                    <nav className="header-nav">
                        <UserMenu />
                    </nav>
                )}
            </div>
        </header>
    );
};

export default Header;