import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaEnvelope, 
    FaLock, 
    FaArrowRight,
    FaMusic,
    FaCalendarAlt,
    FaChartLine,
    FaUsers
} from 'react-icons/fa';
import { useAuth } from '../../hooks/useAuth';
import { login as apiLogin } from '../../services/authService';
import './LoginPage.css';

const schema = yup.object().shape({
    email: yup.string().email('Email inválido').required('O email é obrigatório'),
    password: yup.string().required('A senha é obrigatória'),
});

const LoginPage = () => {
    const { login: contextLogin } = useAuth();
    const navigate = useNavigate();
    const [apiError, setApiError] = useState(null);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: yupResolver(schema),
    });

    const onSubmit = async (data) => {
        setApiError(null);
        localStorage.removeItem('token');
        
        try {
            const token = await apiLogin(data.email, data.password);
            await contextLogin(token);
            setTimeout(() => {
                navigate('/dashboard');
            }, 100);
        } catch (error) {
            setApiError(error.message || 'Email ou senha inválidos.');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                {/* Left Side - Form */}
                <div className="login-form-section">
                    <div className="login-header">
                        <Link to="/" className="login-logo">
                            PedePlay
                        </Link>
                    </div>

                    <div className="login-content">
                        <div className="login-title-section">
                            <h1 className="login-title">Bem-vindo de volta!</h1>
                            <p className="login-subtitle">
                                Entre com suas credenciais para acessar seu dashboard
                            </p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
                            {apiError && (
                                <div className="alert alert-error">
                                    {apiError}
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <div className="input-with-icon">
                                    <FaEnvelope className="input-icon" />
                                    <input 
                                        id="email" 
                                        type="email" 
                                        placeholder="seu@email.com"
                                        {...register('email')} 
                                    />
                                </div>
                                {errors.email && (
                                    <span className="field-error">{errors.email.message}</span>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Senha</label>
                                <div className="input-with-icon">
                                    <FaLock className="input-icon" />
                                    <input 
                                        id="password" 
                                        type="password" 
                                        placeholder="••••••••"
                                        {...register('password')} 
                                    />
                                </div>
                                {errors.password && (
                                    <span className="field-error">{errors.password.message}</span>
                                )}
                            </div>

                            <button 
                                type="submit" 
                                className="btn-login" 
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Entrando...' : 'Entrar'}
                                <FaArrowRight />
                            </button>
                        </form>

                        <div className="login-footer">
                            <p>
                                Ainda não tem uma conta? 
                                <Link to="/register" className="register-link">
                                    Cadastre-se gratuitamente
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Illustration */}
                <div className="login-illustration-section">
                    <div className="illustration-content">
                        <h2 className="illustration-title">
                            Gerencie sua carreira musical
                        </h2>
                        <p className="illustration-subtitle">
                            Acesse todas as ferramentas que você precisa em um só lugar
                        </p>

                        <div className="features-list">
                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaCalendarAlt />
                                </div>
                                <div className="feature-text">
                                    <h4>Gestão de Agenda</h4>
                                    <p>Controle total da sua disponibilidade</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaMusic />
                                </div>
                                <div className="feature-text">
                                    <h4>Pedidos ao Vivo</h4>
                                    <p>Interaja com seu público em tempo real</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaChartLine />
                                </div>
                                <div className="feature-text">
                                    <h4>Dashboard Completo</h4>
                                    <p>Acompanhe métricas e estatísticas</p>
                                </div>
                            </div>

                            <div className="feature-item">
                                <div className="feature-icon">
                                    <FaUsers />
                                </div>
                                <div className="feature-text">
                                    <h4>Propostas e Contratos</h4>
                                    <p>Gerencie seus eventos facilmente</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;