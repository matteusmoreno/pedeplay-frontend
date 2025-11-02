/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/RegisterSteps.js
 * ========================================
 */
import React from 'react';

const steps = [
    { id: 1, label: 'Acesso' },
    { id: 2, label: 'Pessoal' },
    { id: 3, label: 'Endereço' },
    { id: 4, label: 'Social' }
];

const RegisterSteps = ({ currentStep }) => {
    return (
        <ul className="register-steps">
            {steps.map((step) => (
                <li
                    key={step.id}
                    // Classes mais limpas para o novo CSS
                    className={`step-item ${step.id === currentStep ? 'active' : ''} ${step.id < currentStep ? 'completed' : ''}`}
                >
                    <div className="step-number">
                        {step.id < currentStep ? '✓' : step.id}
                    </div>
                    <div className="step-label">{step.label}</div>
                </li>
            ))}
        </ul>
    );
};

export default RegisterSteps;