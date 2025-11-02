/* * ========================================
 * ARQUIVO NOVO: src/pages/RegisterPage/StepIllustration/StepIllustration.js
 * ========================================
 */
import React from 'react';
import { FaLock, FaUserAlt, FaMapMarkedAlt, FaShareAlt } from 'react-icons/fa';
import './StepIllustration.css';

// Mapeia cada etapa para seu ícone e texto
const illustrations = {
    1: {
        icon: <FaLock />,
        title: 'Crie sua Conta',
        description: 'Comece com seu e-mail e uma senha segura. Este será seu acesso principal à plataforma.'
    },
    2: {
        icon: <FaUserAlt />,
        title: 'Seu Perfil de Artista',
        description: 'Nos conte quem você é. Seu nome artístico e biografia ajudam os fãs a te encontrarem.'
    },
    3: {
        icon: <FaMapMarkedAlt />,
        title: 'Endereço',
        description: 'Usamos seu CEP para localizar seu endereço. Precisamos disso para fins de faturamento e verificação.'
    },
    4: {
        icon: <FaShareAlt />,
        title: 'Conecte-se',
        description: 'Adicione suas redes sociais para que seus fãs possam te seguir e saber mais sobre seu trabalho.'
    }
};

const StepIllustration = ({ currentStep }) => {
    // Seleciona a ilustração correta ou usa a primeira como padrão
    const { icon, title, description } = illustrations[currentStep] || illustrations[1];

    return (
        <div className="step-illustration">
            <div className="step-icon">{icon}</div>
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
};

export default StepIllustration;