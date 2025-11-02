/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step3Address.js
 * ========================================
 */
import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import axios from 'axios';

// Função para formatar o CEP
const formatCEP = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
    value = value.replace(/^(\d{5})(\d)/, '$1-$2'); // Adiciona o hífen
    return value;
};

const Step3Address = () => {
    const { register, formState: { errors }, setValue, watch, clearErrors, trigger } = useFormContext();
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState(null); // Apenas para erros da API
    const [addressFound, setAddressFound] = useState(false);

    const cepValue = watch('cep');

    // Função que busca o erro do Yup
    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    // Função 'onChange' para o input de CEP
    const handleCepChange = (e) => {
        const formattedCep = formatCEP(e.target.value);
        setValue('cep', formattedCep, { shouldValidate: true });

        // Limpa o erro da API se o usuário começar a digitar novamente
        if (cepError) setCepError(null);
    };

    // Função do botão "Buscar"
    const handleCepSearch = async () => {
        setCepError(null); // Limpa erros antigos da API

        // Dispara a validação do Yup primeiro
        const isValid = await trigger('cep');

        // Se a validação do Yup falhar (formato, etc.), não faz a busca.
        // O `getError('cep')` vai mostrar a mensagem do Yup.
        if (!isValid) {
            return;
        }

        // Se for válido, limpa o CEP para a busca
        const cep = cepValue.replace(/\D/g, '');

        setIsCepLoading(true);
        setAddressFound(false);

        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.data.erro) {
                // Erro da API: CEP não encontrado
                setCepError('CEP não encontrado.');
                setAddressFound(false);
            } else {
                // Sucesso
                setValue('street', response.data.logradouro, { shouldValidate: true });
                setValue('neighborhood', response.data.bairro, { shouldValidate: true });
                setValue('city', response.data.localidade, { shouldValidate: true });
                setValue('state', response.data.uf, { shouldValidate: true });

                clearErrors(['street', 'neighborhood', 'city', 'state']);
                setAddressFound(true);

                setTimeout(() => document.getElementById('number')?.focus(), 100);
            }
        } catch (error) {
            setCepError('Erro ao buscar CEP. Verifique sua conexão.');
            setAddressFound(false);
        }
        setIsCepLoading(false);
    };

    return (
        <>
            <div className="form-group">
                <label htmlFor="cep">CEP</label>
                <div className="cep-input-group">
                    <div className="form-group">
                        <input
                            id="cep"
                            type="text"
                            {...register('cep')}
                            onChange={handleCepChange}
                            value={cepValue || ''}
                            maxLength={9} // 5 dígitos + hífen + 3 dígitos
                            placeholder="00000-000"
                        />
                    </div>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCepSearch}
                        disabled={isCepLoading}
                    >
                        {isCepLoading ? '...' : 'Buscar'}
                    </button>
                </div>

                {/* * Agora mostramos o erro do Yup (formato) OU o erro da API (não encontrado).
                  * Nunca os dois ao mesmo tempo.
                */}
                {getError('cep')}
                {cepError && <span className="error-message">{cepError}</span>}

                {isCepLoading && <span className="loading-message">Buscando endereço...</span>}
            </div>

            {/* Campos de endereço que aparecem após a busca */}
            <div className={`address-details ${addressFound ? 'visible' : ''}`}>
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

                <div className="address-fields-grid">
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
                </div>

                <div className="address-fields-grid-auto">
                    <div className="form-group">
                        <label htmlFor="number">Número</label>
                        <input id="number" type="text" {...register('number')} />
                        {getError('number')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="complement">Complemento</label>
                        <input id="complement" type="text" {...register('complement')} placeholder="Apto, Bloco, etc." />
                        {getError('complement')}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Step3Address;