/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step4Social.js
 * ========================================
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';

const Step4Social = () => {
    // Usamos os nomes exatos do DTO SocialLinks
    const { register, formState: { errors } } = useFormContext();

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    return (
        <fieldset>
            <legend>Links Sociais (Opcional)</legend>

            <div className="form-group">
                <label htmlFor="instagramUrl">Instagram</label>
                <input id="instagramUrl" type="text" {...register('instagramUrl')} placeholder="https://instagram.com/seu_usuario" />
                {getError('instagramUrl')}
            </div>

            <div className="form-group">
                <label htmlFor="facebookUrl">Facebook</label>
                <input id="facebookUrl" type="text" {...register('facebookUrl')} placeholder="https://facebook.com/seu_usuario" />
                {getError('facebookUrl')}
            </div>

            <div className="form-group">
                <label htmlFor="youtubeUrl">YouTube</label>
                <input id="youtubeUrl" type="text" {...register('youtubeUrl')} placeholder="https://youtube.com/seu_canal" />
                {getError('youtubeUrl')}
            </div>

            <div className="form-group">
                <label htmlFor="linkedInUrl">LinkedIn</label>
                <input id="linkedInUrl" type="text" {...register('linkedInUrl')} placeholder="https://linkedin.com/in/seu_usuario" />
                {getError('linkedInUrl')}
            </div>

        </fieldset>
    );
};

export default Step4Social;