/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step2Personal.js
 * ========================================
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';

// Nome do componente corrigido para PascalCase
const Step2Personal = () => {
    const { register, formState: { errors } } = useFormContext();

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    return (
        <fieldset>
            <legend>Dados Pessoais</legend>
            <div className="form-group">
                <label htmlFor="name">Nome Artístico</label>
                <input id="name" type="text" {...register('name')} />
                {getError('name')}
            </div>
            <div className="form-group">
                <label htmlFor="biography">Biografia</label>
                <textarea id="biography" {...register('biography')} />
                {getError('biography')}
            </div>
        </fieldset>
    );
};

export default Step2Personal; // Export corrigido