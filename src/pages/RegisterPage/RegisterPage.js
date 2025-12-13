import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { 
    FaUserCircle, 
    FaUser, 
    FaMapMarkerAlt, 
    FaShareAlt,
    FaCheckCircle,
    FaArrowRight,
    FaArrowLeft 
} from 'react-icons/fa';
import { registerArtist } from '../../services/artistService';
import { login as apiLogin } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import './RegisterPage.css';

// Importando os componentes de etapa
import Step1Account from './Step1Account';
import Step2Personal from './Step2Personal';
import Step3Address from './Step3Address';
import Step4Social from './Step4Social';

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

// Configuração das etapas
const steps = [
    { 
        number: 1, 
        title: 'Crie sua Conta', 
        subtitle: 'Configure suas credenciais de acesso',
        icon: FaUserCircle 
    },
    { 
        number: 2, 
        title: 'Informações Pessoais', 
        subtitle: 'Conte-nos mais sobre você',
        icon: FaUser 
    },
    { 
        number: 3, 
        title: 'Seu Endereço', 
        subtitle: 'Onde você está localizado',
        icon: FaMapMarkerAlt 
    },
    { 
        number: 4, 
        title: 'Redes Sociais', 
        subtitle: 'Conecte suas redes (opcional)',
        icon: FaShareAlt 
    }
];

const RegisterPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [apiError, setApiError] = useState(null);
    const [apiSuccess, setApiSuccess] = useState(null);
    const navigate = useNavigate();
    const { login: contextLogin } = useAuth();

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
            await registerArtist(data);
            const token = await apiLogin(data.email, data.password);
            contextLogin(token);
            setApiSuccess('Cadastro realizado com sucesso! Redirecionando...');
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (error) {
            setApiError(error.message || 'Erro no cadastro.');
        }
    };

    const currentStepData = steps[currentStep - 1];

    return (
        <div className="register-page">
            <div className="register-container">
                {/* Header com Logo */}
                <div className="register-header">
                    <Link to="/" className="register-logo">
                        Contrrat
                    </Link>
                    <div className="register-login-link">
                        Já tem uma conta? <Link to="/login">Entrar</Link>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="register-progress">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                    </div>
                    <div className="progress-text">
                        Etapa {currentStep} de 4
                    </div>
                </div>

                {/* Steps Indicator */}
                <div className="steps-indicator">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.number;
                        const isCompleted = currentStep > step.number;
                        
                        return (
                            <div 
                                key={step.number}
                                className={`step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                            >
                                <div className="step-indicator-icon">
                                    {isCompleted ? <FaCheckCircle /> : <Icon />}
                                </div>
                                <div className="step-indicator-text">
                                    <div className="step-indicator-title">{step.title}</div>
                                    <div className="step-indicator-subtitle">{step.subtitle}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Form Card */}
                <div className="register-card">
                    <div className="register-card-header">
                        <h2 className="register-card-title">{currentStepData.title}</h2>
                        <p className="register-card-subtitle">{currentStepData.subtitle}</p>
                    </div>

                    <FormProvider {...methods}>
                        <form onSubmit={handleSubmit(onSubmit)} className="register-form">
                            {apiError && (
                                <div className="alert alert-error">
                                    {apiError}
                                </div>
                            )}
                            {apiSuccess && (
                                <div className="alert alert-success">
                                    <FaCheckCircle /> {apiSuccess}
                                </div>
                            )}

                            <div className="form-content">
                                {currentStep === 1 && <Step1Account />}
                                {currentStep === 2 && <Step2Personal />}
                                {currentStep === 3 && <Step3Address />}
                                {currentStep === 4 && <Step4Social />}
                            </div>

                            <div className="form-navigation">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        className="btn-back"
                                        onClick={handleBack}
                                        disabled={isSubmitting}
                                    >
                                        <FaArrowLeft /> Voltar
                                    </button>
                                )}

                                <div className="spacer" />

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        className="btn-next"
                                        onClick={handleNext}
                                        disabled={isSubmitting}
                                    >
                                        Próximo <FaArrowRight />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={isSubmitting || apiSuccess}
                                    >
                                        {isSubmitting ? 'Finalizando...' : 'Criar Conta'} <FaCheckCircle />
                                    </button>
                                )}
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;