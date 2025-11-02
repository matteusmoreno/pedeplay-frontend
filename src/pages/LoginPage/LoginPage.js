/* * ========================================
 * ARQUIVO: src/pages/LoginPage/LoginPage.js
 * ========================================
 */
import React, { useState } from 'react';
// 1. Importe o Link
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(email, password);
            navigate('/dashboard'); // Redireciona após login
        } catch (err) {
            setError('Falha no login. Verifique seu email e senha.');
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card">
                <h2>Login do Artista</h2>

                <form onSubmit={handleSubmit}>
                    {error && <div className="login-error">{error}</div>}

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary">Entrar</button>
                </form>

                <div className="register-link">
                    {/* 2. Substitua a tag <a> por <Link> */}
                    <p>Não tem uma conta? <Link to="/register">Cadastre-se</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;