import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Pega a página de origem (se ele foi redirecionado para o login)
    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await login(email, password);
            // Redireciona para o dashboard ou para a página que ele tentou acessar
            navigate(from, { replace: true });
        } catch (err) {
            console.error(err);
            setError('Credenciais inválidas. Verifique seu e-mail e senha.');
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card">
                <h2>Login do Artista</h2>
                <form onSubmit={handleSubmit}>
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

                    {error && <p className="login-error">{error}</p>}

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
                {/* Você pode adicionar um link para o registro aqui:
          <p className="register-link">
            Não tem uma conta? <a href="/register">Cadastre-se</a>
          </p> 
        */}
            </div>
        </div>
    );
};

export default LoginPage;