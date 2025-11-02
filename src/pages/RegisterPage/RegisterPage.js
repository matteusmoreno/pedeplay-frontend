/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/RegisterPage.js
 * (Adicionado login automático pós-cadastro)
 * ========================================
 */
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { registerArtist } from '../../services/artistService';
import './RegisterPage.css';

// --- INÍCIO DA CORREÇÃO 1: Importar serviços de login ---
import { login as apiLogin } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
// --- FIM DA CORREÇÃO 1 ---

// Importando os componentes de etapa
import RegisterSteps from './RegisterSteps';
import Step1Account from './Step1Account';
import Step2Personal from './Step2Personal';
import Step3Address from './Step3Address';
import Step4Social from './Step4Social';
import StepIllustration from './StepIllustration/StepIllustration';

// Esquema de validação com Yup
const schema = yup.object().shape({
    // Etapa 1
    email: yup.string().email('Email inválido').required('O email é obrigatório'),
    password: yup.string().min(6, 'A senha deve ter no mínimo 6 caracteres').required('A senha é obrigatória'),
    confirmPassword: yup.string()
        .oneOf([yup.ref('password'), null], 'As senhas devem ser iguais')
        .required('Confirme sua senha'),
    // Etapa 2
    name: yup.string().required('O nome é obrigatório'),
    biography: yup.string().required('A biografia é obrigatória'),

    cep: yup.string()
        .required('O CEP é obrigatório')
        .matches(/^(\d{5}-\d{3}|\d{8})$/, 'Formato de CEP inválido.'),

    street: yup.string().required('Rua é obrigatória'),
    neighborhood: yup.string().required('Bairro é obrigatória'),
    city: yup.string().required('Cidade é obrigatória'),
    state: yup.string().required('Estado é obrigatória'),
    number: yup.string().required('O número é obrigatório'),
    complement: yup.string(),

    // Etapa 4
    instagramUrl: yup.string().transform(value => (value === '' ? undefined : value)).url('URL inválida').nullable(),
    facebookUrl: yup.string().transform(value => (value === '' ? undefined : value)).url('URL inválida').nullable(),
    youtubeUrl: yup.string().transform(value => (value === '' ? undefined : value)).url('URL inválida').nullable(),
    linkedInUrl: yup.string().transform(value => (value === '' ? undefined : value)).url('URL inválida').nullable(),
});

// Definição dos campos por etapa (para validação parcial)
const fieldsByStep = {
    1: ['email', 'password', 'confirmPassword'],
    2: ['name', 'biography'],
    3: ['cep', 'street', 'neighborhood', 'city', 'state', 'number'],
    4: ['instagramUrl', 'facebookUrl', 'youtubeUrl', 'linkedInUrl']
};

// Títulos para cada etapa
const stepTitles = {
    1: 'Crie sua Conta',
    2: 'Informações Pessoais',
    3: 'Seu Endereço',
    4: 'Redes Sociais'
};

const RegisterPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [apiError, setApiError] = useState(null);
    const [apiSuccess, setApiSuccess] = useState(null);
    const navigate = useNavigate();

    // --- INÍCIO DA CORREÇÃO 2: Obter o 'login' do contexto ---
    const { login: contextLogin } = useAuth();
    // --- FIM DA CORREÇÃO 2 ---

    const methods = useForm({
        resolver: yupResolver(schema),
        mode: 'onTouched'
    });

    const { handleSubmit, trigger, formState: { isSubmitting } } = methods;

    const handleNext = async (e) => {
        if (e) e.preventDefault();
        const fieldsToValidate = fieldsByStep[currentStep];
        const isValid = await trigger(fieldsToValidate, { shouldFocus: true });

        if (isValid) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const onSubmit = async (data) => {
        setApiError(null);
        setApiSuccess(null);
        try {
            // 1. Cria o artista
            await registerArtist(data);

            // --- INÍCIO DA CORREÇÃO 3: Fazer login automático ---

            // 2. Faz o login com os dados recém-cadastrados
            const token = await apiLogin(data.email, data.password);

            // 3. Define o estado de autenticação no contexto
            contextLogin(token);

            setApiSuccess('Cadastro realizado com sucesso! Redirecionando...');

            // 4. Redireciona para a HomePage (/)
            setTimeout(() => {
                navigate('/');
            }, 2000); // Um pequeno delay para o usuário ler a mensagem

            // --- FIM DA CORREÇÃO 3 ---

        } catch (error) {
            setApiError(error.message || 'Erro no cadastro.');
        }
    };

    return (
        <div className="register-container">
            <div className="register-layout-card">

                {/* Coluna da Esquerda: Ilustração e Etapas */}
                <div className="register-sidebar">
                    <RegisterSteps currentStep={currentStep} />
                    <StepIllustration currentStep={currentStep} />
                </div>

                {/* Coluna da Direita: Formulário */}
                <div className="register-content">
                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <h2 className="register-title">{stepTitles[currentStep]}</h2>

                            {apiError && (
                                <div className="form-message error-message">
                                    {apiError}
                                </div>
                            )}
                            {apiSuccess && <div className="form-message success-message">{apiSuccess}</div>}

                            <div className="step-fieldset">
                                {currentStep === 1 && <Step1Account />}
                                {currentStep === 2 && <Step2Personal />}
                                {currentStep === 3 && <Step3Address />}
                                {currentStep === 4 && <Step4Social />}
                            </div>

                            {/* Navegação */}
                            <div className="register-navigation">
                                <button
                                    type="button"
                                    className="btn-outline"
                                    onClick={handleBack}
                                    disabled={currentStep === 1 || isSubmitting}
                                >
                                    Voltar
                                </button>

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                    >
                                        Próximo
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isSubmitting || apiSuccess} // Desabilita após o sucesso
                                    >
                                        {isSubmitting ? 'Finalizando...' : 'Finalizar Cadastro'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </FormProvider>

                    <div className="login-link">
                        <p>Já tem uma conta? <Link to="/login">Faça Login</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;