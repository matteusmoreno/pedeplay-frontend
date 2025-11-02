/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/RegisterPage.js
 * ========================================
 */
import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { registerArtist } from '../../services/artistService';
import './RegisterPage.css';

// Importando os componentes de etapa com nomes corrigidos
import RegisterSteps from './RegisterSteps';
import Step1Account from './Step1Account';
import Step2Personal from './Step2Personal';
import Step3Address from './Step3Address';
import Step4Social from './Step4Social';

// Esquema de validação com Yup (agora completo)
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
    // Etapa 3
    cep: yup.string().required('O CEP é obrigatório').matches(/^[0-9]{8}$/, 'CEP inválido (apenas 8 números)'),
    street: yup.string().required('Rua é obrigatória'),
    neighborhood: yup.string().required('Bairro é obrigatório'),
    city: yup.string().required('Cidade é obrigatória'),
    state: yup.string().required('Estado é obrigatório'),
    number: yup.string().required('O número é obrigatório'),
    complement: yup.string(),

    // Etapa 4: Usando os nomes exatos do DTO
    //
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

const RegisterPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [apiError, setApiError] = useState(null);
    const [apiSuccess, setApiSuccess] = useState(null);
    const navigate = useNavigate();

    const methods = useForm({
        resolver: yupResolver(schema),
        mode: 'onTouched' // Valida ao sair do campo
    });

    const { handleSubmit, trigger, formState: { isSubmitting } } = methods;

    // --- INÍCIO DA CORREÇÃO (Failsafe) ---
    // 1. A função agora aceita o evento 'e'
    const handleNext = async (e) => {
        // 2. Previne qualquer comportamento padrão de 'submit' que possa estar ocorrendo
        if (e) {
            e.preventDefault();
        }

        // Valida apenas os campos da etapa atual
        const fieldsToValidate = fieldsByStep[currentStep];
        const isValid = await trigger(fieldsToValidate);

        if (isValid) {
            setCurrentStep((prev) => prev + 1);
        }
    };
    // --- FIM DA CORREÇÃO ---

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const onSubmit = async (data) => {
        setApiError(null);
        setApiSuccess(null);
        try {
            // A função registerArtist fará a chamada para POST /artists
            await registerArtist(data);
            setApiSuccess('Cadastro realizado com sucesso! Redirecionando para o login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error) {
            setApiError(error);
        }
    };

    return (
        <div className="register-container">
            <div className="card register-card">
                <h2>Cadastro de Artista</h2>

                <RegisterSteps currentStep={currentStep} />

                {apiError && (
                    <div className="form-message error-message">
                        {apiError.message || 'Erro no cadastro.'}
                    </div>
                )}
                {apiSuccess && <div className="form-message success-message">{apiSuccess}</div>}

                {/* O FormProvider passa o 'methods' para todos os componentes filhos */}
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)}>

                        {/* Renderização condicional da Etapa (Nomes JSX corrigidos) */}
                        {currentStep === 1 && <Step1Account />}
                        {currentStep === 2 && <Step2Personal />}
                        {currentStep === 3 && <Step3Address />}
                        {currentStep === 4 && <Step4Social />}

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
                                    // 3. Passamos o evento 'e' para a função handleNext
                                    onClick={(e) => handleNext(e)}
                                    disabled={isSubmitting}
                                >
                                    Próximo
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting}
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
    );
};

export default RegisterPage;