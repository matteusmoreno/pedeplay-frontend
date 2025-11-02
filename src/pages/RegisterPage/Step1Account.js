/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step1Account.js
 * ========================================
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';
// 1. Importar o novo componente
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter/PasswordStrengthMeter';

const Step1Account = () => {
    // 2. Extrair 'watch' do hook
    const { register, formState: { errors }, watch } = useFormContext();

    // 3. 'watch' nos permite "observar" o valor do campo de senha em tempo real
    const password = watch('password');

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    return (
        <fieldset>
            <legend>Dados de Acesso</legend>
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" {...register('email')} />
                {getError('email')}
            </div>
            <div className="form-group">
                <label htmlFor="password">Senha</label>
                <input id="password" type="password" {...register('password')} />
                {/* 4. Adicionar o medidor e passar a senha */}
                <PasswordStrengthMeter password={password} />
                {getError('password')}
            </div>
            <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Senha</label>
                <input id="confirmPassword" type="password" {...register('confirmPassword')} />
                {getError('confirmPassword')}
            </div>
        </fieldset>
    );
};

export default Step1Account;