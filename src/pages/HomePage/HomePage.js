/* * ========================================
 * ARQUIVO NOVO: src/pages/HomePage/HomePage.js
 * (Página Principal/Landing Page)
 * ========================================
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { FaMusic, FaDollarSign, FaMobileAlt, FaArrowRight } from 'react-icons/fa';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="homepage-container">

            {/* --- Seção Hero --- */}
            <section className="hero-section">
                <div className="container">
                    <h1 className="hero-title">
                        Receba pedidos de música e pix
                        <span className="hero-highlight">ao vivo.</span>
                    </h1>
                    <p className="hero-subtitle">
                        PedePlay é a plataforma definitiva para DJs e artistas que querem
                        interagir com o público e monetizar suas apresentações em tempo real.
                    </p>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-primary btn-large">
                            Comece Grátis Agora <FaArrowRight />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- Seção de Funcionalidades --- */}
            <section className="features-section">
                <div className="container">
                    <h2 className="section-title">Feito para o Artista Moderno</h2>
                    <div className="features-grid">

                        <div className="feature-card">
                            <div className="feature-icon"><FaMobileAlt /></div>
                            <h3 className="feature-title">Sua Página Pública</h3>
                            <p className="feature-description">
                                Crie uma página de show em segundos. Seu público acessa via QR Code, sem precisar baixar apps.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon"><FaMusic /></div>
                            <h3 className="feature-title">Fila de Pedidos</h3>
                            <p className="feature-description">
                                Receba pedidos de música com mensagens e gorjetas em uma fila organizada em tempo real no seu painel.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon"><FaDollarSign /></div>
                            <h3 className="feature-title">Monetização Fácil</h3>
                            <p className="feature-description">
                                Pedidos com gorjeta sobem na fila. Receba o valor total das gorjetas via Pix, sem taxas escondidas.
                            </p>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- Seção de CTA Final --- */}
            <section className="cta-section">
                <div className="container">
                    <h2 className="cta-title">Pronto para elevar seu show?</h2>
                    <p className="cta-subtitle">
                        Junte-se aos artistas que estão transformando a interação com o público.
                    </p>
                    <Link to="/register" className="btn-primary btn-large">
                        Crie sua Conta
                    </Link>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="homepage-footer">
                <div className="container">
                    <p>PedePlay © 2025. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;