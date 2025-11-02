/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step2Personal.js
 * ========================================
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';

const Step2Personal = () => {
    const { register, formState: { errors } } = useFormContext();

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    return (
        <>
            <div className="form-group">
                <label htmlFor="name">Nome Artístico</label>
                <input id="name" type="text" {...register('name')} placeholder="Ex: DJ Batidão" />
                {getError('name')}
            </div>
            <div className="form-group">
                <label htmlFor="biography">Biografia</label>
                <textarea id="biography" {...register('biography')} placeholder="Fale um pouco sobre você, seu estilo musical, e sua carreira..." />
                {getError('biography')}
            </div>
        </>
    );
};

export default Step2Personal;