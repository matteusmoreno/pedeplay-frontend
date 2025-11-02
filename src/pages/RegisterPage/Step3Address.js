/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step3Address.js
 * ========================================
 */
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import axios from 'axios';

// Nome do componente corrigido para PascalCase
const Step3Address = () => {
    const { register, formState: { errors }, setValue } = useFormContext();
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState(null);

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    // Função para buscar o CEP e preencher os campos
    const handleCepBlur = async (e) => {
        const cep = e.target.value.replace(/\D/g, ''); // Remove não-números
        if (cep.length === 8) {
            setIsCepLoading(true);
            setCepError(null);
            try {
                // Busca na API ViaCEP
                const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
                if (response.data.erro) {
                    setCepError('CEP não encontrado.');
                } else {
                    // Preenche os campos do formulário com os dados do ViaCEP
                    setValue('street', response.data.logradouro, { shouldValidate: true });
                    setValue('neighborhood', response.data.bairro, { shouldValidate: true });
                    setValue('city', response.data.localidade, { shouldValidate: true });
                    setValue('state', response.data.uf, { shouldValidate: true });
                    // Foca no campo "número"
                    document.getElementById('number').focus();
                }
            } catch (error) {
                setCepError('Erro ao buscar CEP. Verifique sua conexão.');
            }
            setIsCepLoading(false);
        }
    };

    return (
        <fieldset>
            <legend>Endereço</legend>
            <div className="form-group">
                <label htmlFor="cep">CEP (apenas números)</label>
                <input id="cep" type="text" {...register('cep')} onBlur={handleCepBlur} />
                {isCepLoading && <span className="loading-message">Buscando CEP...</span>}
                {cepError && <span className="error-message">{cepError}</span>}
                {getError('cep')}
            </div>
            <div className="form-group">
                <label htmlFor="street">Rua</label>
                <input id="street" type="text" {...register('street')} readOnly />
                {getError('street')}
            </div>
            <div className="form-group">
                <label htmlFor="neighborhood">Bairro</label>
                <input id="neighborhood" type="text" {...register('neighborhood')} readOnly />
                {getError('neighborhood')}
            </div>
            <div className="form-group">
                <label htmlFor="city">Cidade</label>
                <input id="city" type="text" {...register('city')} readOnly />
                {getError('city')}
            </div>
            <div className="form-group">
                <label htmlFor="state">Estado</label>
                <input id="state" type="text" {...register('state')} readOnly />
                {getError('state')}
            </div>
            <div className="form-group">
                <label htmlFor="number">Número</label>
                <input id="number" type="text" {...register('number')} />
                {getError('number')}
            </div>
            <div className="form-group">
                <label htmlFor="complement">Complemento</label>
                <input id="complement" type="text" {...register('complement')} />
                {getError('complement')}
            </div>
        </fieldset>
    );
};

export default Step3Address; // Export corrigido