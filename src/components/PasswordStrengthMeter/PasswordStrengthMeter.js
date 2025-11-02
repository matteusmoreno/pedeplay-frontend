/* * ========================================
 * ARQUIVO: src/components/PasswordStrengthMeter/PasswordStrengthMeter.js
 * ========================================
 */
import React from 'react';
import zxcvbn from 'zxcvbn';
import './PasswordStrengthMeter.css';

const PasswordStrengthMeter = ({ password }) => {

    // --- INÍCIO DA CORREÇÃO ---
    // 1. Verificamos se 'password' existe antes de chamar a biblioteca
    // Se não existir, criamos um resultado padrão com score 0
    const testResult = password ? zxcvbn(password) : { score: 0 };
    // --- FIM DA CORREÇÃO ---

    // 2. O zxcvbn retorna um 'score' de 0 (péssima) a 4 (ótima)
    const score = testResult.score;

    // 3. Define o texto de feedback (opcional, mas bom para UX)
    const getFeedbackText = () => {
        // Esta verificação agora funciona corretamente
        if (!password) {
            return '';
        }
        if (score <= 1) {
            return 'Muito fraca';
        } else if (score === 2) {
            return 'Fraca';
        } else if (score === 3) {
            return 'Razoável';
        } else {
            return 'Forte';
        }
    };

    return (
        <div className="password-strength-container">
            <div className="password-strength-bar">
                {/* Renderiza 4 segmentos da barra.
                  A classe 'active' e 'strength-x' é aplicada dinamicamente.
                */}
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className={`strength-segment ${score > index ? `active strength-${score}` : ''}`}
                    ></div>
                ))}
            </div>
            <span className={`strength-feedback strength-text-${score}`}>
                {getFeedbackText()}
            </span>
        </div>
    );
};

export default PasswordStrengthMeter;