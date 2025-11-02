/* * ========================================
 * ARQUIVO: src/pages/LoginPage/LoginPage.js
 * (Redirecionamento corrigido para /)
 * ========================================
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
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
        try {
            const token = await apiLogin(data.email, data.password);
            contextLogin(token);

            // --- INÍCIO DA CORREÇÃO ---
            // Redireciona para a HomePage (/) em vez do Dashboard
            navigate('/');
            // --- FIM DA CORREÇÃO ---

        } catch (error) {
            setApiError(error.message || 'Email ou senha inválidos.');
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card">
                <h2>Login do Artista</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    {apiError && <div className="form-message error-message">{apiError}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" {...register('email')} />
                        {errors.email && <span className="error-message">{errors.email.message}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input id="password" type="password" {...register('password')} />
                        {errors.password && <span className="error-message">{errors.password.message}</span>}
                    </div>

                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                <div className="register-link">
                    <p>Ainda não tem uma conta? <Link to="/register">Cadastre-se</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;