/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step1Account.js
 * ========================================
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter';

const Step1Account = () => {
    const { register, formState: { errors }, watch } = useFormContext();
    const password = watch('password');

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    return (
        <>
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" {...register('email')} placeholder="seu@email.com" />
                {getError('email')}
            </div>
            <div className="form-group">
                <label htmlFor="password">Senha</label>
                <input id="password" type="password" {...register('password')} placeholder="Mínimo 6 caracteres" />
                <PasswordStrengthMeter password={password} />
                {getError('password')}
            </div>
            <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Senha</label>
                <input id="confirmPassword" type="password" {...register('confirmPassword')} placeholder="Repita a senha" />
                {getError('confirmPassword')}
            </div>
        </>
    );
};

export default Step1Account;