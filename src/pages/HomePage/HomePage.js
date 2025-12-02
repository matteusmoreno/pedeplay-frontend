import React from 'react';
import { Link } from 'react-router-dom';
import { 
    FaMusic, 
    FaDollarSign, 
    FaCalendarAlt, 
    FaQrcode,
    FaVideo,
    FaChartLine,
    FaHandshake,
    FaClock,
    FaMobileAlt,
    FaArrowRight,
    FaCheckCircle,
    FaStar,
    FaUsers
} from 'react-icons/fa';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="homepage-container">

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="container hero-content">
                    <div className="hero-badge">
                        <FaStar /> Plataforma Completa para Artistas
                    </div>
                    <h1 className="hero-title">
                        Gerencie sua carreira musical
                        <span className="hero-highlight">em um só lugar</span>
                    </h1>
                    <p className="hero-subtitle">
                        Da gestão de agenda e propostas até pedidos ao vivo e transmissões. 
                        PedePlay é a solução completa para artistas modernos que querem 
                        profissionalizar sua carreira e monetizar seu talento.
                    </p>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <FaUsers />
                            <div>
                                <strong>+1000</strong>
                                <span>Artistas</span>
                            </div>
                        </div>
                        <div className="hero-stat">
                            <FaMusic />
                            <div>
                                <strong>+50k</strong>
                                <span>Pedidos</span>
                            </div>
                        </div>
                        <div className="hero-stat">
                            <FaDollarSign />
                            <div>
                                <strong>R$ 500k</strong>
                                <span>Processados</span>
                            </div>
                        </div>
                    </div>
                    <div className="hero-actions">
                        <Link to="/register" className="btn-primary btn-large">
                            Começar Gratuitamente <FaArrowRight />
                        </Link>
                        <Link to="/login" className="btn-secondary btn-large">
                            Já tenho conta
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Tudo que você precisa para profissionalizar sua carreira</h2>
                        <p className="section-subtitle">
                            Uma plataforma completa com ferramentas essenciais para artistas que levam sua carreira a sério
                        </p>
                    </div>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon calendar">
                                <FaCalendarAlt />
                            </div>
                            <h3 className="feature-title">Gestão de Agenda</h3>
                            <p className="feature-description">
                                Controle total sobre sua disponibilidade. Defina horários disponíveis, 
                                bloqueie períodos ocupados e gerencie sua agenda de forma profissional.
                            </p>
                            <ul className="feature-list">
                                <li><FaCheckCircle /> Calendário anual completo</li>
                                <li><FaCheckCircle /> Controle por hora</li>
                                <li><FaCheckCircle /> Definição de preços</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon proposals">
                                <FaHandshake />
                            </div>
                            <h3 className="feature-title">Propostas e Contratos</h3>
                            <p className="feature-description">
                                Receba propostas diretamente na plataforma. Aceite ou recuse eventos, 
                                gerencie contratos e mantenha todo o histórico organizado.
                            </p>
                            <ul className="feature-list">
                                <li><FaCheckCircle /> Sistema de propostas</li>
                                <li><FaCheckCircle /> Gestão de contratos</li>
                                <li><FaCheckCircle /> Histórico completo</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon live">
                                <FaMusic />
                            </div>
                            <h3 className="feature-title">Pedidos ao Vivo</h3>
                            <p className="feature-description">
                                Receba pedidos de música durante suas apresentações. Fila organizada 
                                em tempo real, mensagens do público e gorjetas integradas.
                            </p>
                            <ul className="feature-list">
                                <li><FaCheckCircle /> Fila em tempo real</li>
                                <li><FaCheckCircle /> Sistema de gorjetas</li>
                                <li><FaCheckCircle /> Interação com público</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon streaming">
                                <FaVideo />
                            </div>
                            <h3 className="feature-title">Transmissão ao Vivo</h3>
                            <p className="feature-description">
                                Transmita seus shows ao vivo com qualidade profissional. Alcance 
                                mais público e monetize suas apresentações online.
                            </p>
                            <ul className="feature-list">
                                <li><FaCheckCircle /> Streaming HD</li>
                                <li><FaCheckCircle /> Chat integrado</li>
                                <li><FaCheckCircle /> Visualizadores em tempo real</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon qrcode">
                                <FaQrcode />
                            </div>
                            <h3 className="feature-title">Página Pública com QR Code</h3>
                            <p className="feature-description">
                                Crie sua página de show personalizada. Seu público acessa via QR Code 
                                sem precisar baixar apps ou fazer cadastros.
                            </p>
                            <ul className="feature-list">
                                <li><FaCheckCircle /> Acesso instantâneo</li>
                                <li><FaCheckCircle /> QR Code personalizado</li>
                                <li><FaCheckCircle /> Sem instalação</li>
                            </ul>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon analytics">
                                <FaChartLine />
                            </div>
                            <h3 className="feature-title">Dashboard e Estatísticas</h3>
                            <p className="feature-description">
                                Acompanhe métricas importantes: receita confirmada, shows agendados, 
                                pedidos recebidos e muito mais em um painel completo.
                            </p>
                            <ul className="feature-list">
                                <li><FaCheckCircle /> Métricas em tempo real</li>
                                <li><FaCheckCircle /> Relatórios financeiros</li>
                                <li><FaCheckCircle /> Análise de performance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
                <div className="container">
                    <h2 className="section-title">Como funciona?</h2>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <h3>Crie sua conta</h3>
                            <p>Cadastre-se gratuitamente e configure seu perfil de artista em minutos</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <h3>Configure sua agenda</h3>
                            <p>Defina seus horários disponíveis, preços e prepare-se para receber propostas</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <h3>Crie seu show</h3>
                            <p>Gere o QR Code da sua apresentação e compartilhe com o público</p>
                        </div>
                        <div className="step-card">
                            <div className="step-number">4</div>
                            <h3>Receba pedidos</h3>
                            <p>Interaja com o público, receba pedidos e gorjetas em tempo real</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="benefits-section">
                <div className="container">
                    <div className="benefits-content">
                        <div className="benefits-text">
                            <h2 className="section-title">Por que escolher o PedePlay?</h2>
                            <div className="benefits-list">
                                <div className="benefit-item">
                                    <FaCheckCircle />
                                    <div>
                                        <h4>100% Gratuito</h4>
                                        <p>Sem mensalidades, taxas escondidas ou custos de implementação</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <FaCheckCircle />
                                    <div>
                                        <h4>Fácil de Usar</h4>
                                        <p>Interface intuitiva e moderna, sem curva de aprendizado</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <FaCheckCircle />
                                    <div>
                                        <h4>Tempo Real</h4>
                                        <p>Todas as interações acontecem instantaneamente via WebSocket</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <FaCheckCircle />
                                    <div>
                                        <h4>Profissional</h4>
                                        <p>Ferramentas completas para elevar sua carreira ao próximo nível</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <FaCheckCircle />
                                    <div>
                                        <h4>Sem Barreiras</h4>
                                        <p>Público acessa via QR Code sem apps ou cadastros complicados</p>
                                    </div>
                                </div>
                                <div className="benefit-item">
                                    <FaCheckCircle />
                                    <div>
                                        <h4>Suporte Dedicado</h4>
                                        <p>Equipe pronta para ajudar você a ter sucesso na plataforma</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="benefits-visual">
                            <div className="benefits-card">
                                <FaMobileAlt className="benefits-icon" />
                                <h3>Artistas Satisfeitos</h3>
                                <div className="rating">
                                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                                </div>
                                <p className="rating-text">4.9/5.0 avaliação média</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Pronto para profissionalizar sua carreira?</h2>
                        <p className="cta-subtitle">
                            Junte-se a centenas de artistas que já estão usando o PedePlay para 
                            gerenciar sua agenda, receber propostas e interagir com o público.
                        </p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn-primary btn-large">
                                Criar Minha Conta Grátis <FaArrowRight />
                            </Link>
                        </div>
                        <p className="cta-note">
                            <FaClock /> Configure sua conta em menos de 5 minutos
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="homepage-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <h3>PedePlay</h3>
                            <p>A plataforma completa para artistas modernos</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Produto</h4>
                                <Link to="/register">Criar Conta</Link>
                                <Link to="/login">Entrar</Link>
                            </div>
                            <div className="footer-column">
                                <h4>Contato</h4>
                                <a href="mailto:contato@pedeplay.com">contato@pedeplay.com</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>PedePlay © 2025. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;