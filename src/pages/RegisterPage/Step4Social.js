/* * ========================================
 * ARQUIVO: src/pages/RegisterPage/Step4Social.js
 * ========================================
 */
import React from 'react';
import { useFormContext } from 'react-hook-form';
// Importa os ícones
import { FaInstagram, FaFacebook, FaYoutube, FaLinkedin } from 'react-icons/fa';

const Step4Social = () => {
    // Usamos os nomes exatos do DTO SocialLinks
    const { register, formState: { errors } } = useFormContext();

    const getError = (fieldName) => {
        return errors[fieldName] && <span className="error-message">{errors[fieldName].message}</span>;
    };

    return (
        <>
            <div className="form-group">
                <label htmlFor="instagramUrl">Instagram (Opcional)</label>
                <div className="social-input-group">
                    <span className="social-icon"><FaInstagram /></span>
                    <input id="instagramUrl" type="text" {...register('instagramUrl')} placeholder="https://instagram.com/seu_usuario" />
                </div>
                {getError('instagramUrl')}
            </div>

            <div className="form-group">
                <label htmlFor="facebookUrl">Facebook (Opcional)</label>
                <div className="social-input-group">
                    <span className="social-icon"><FaFacebook /></span>
                    <input id="facebookUrl" type="text" {...register('facebookUrl')} placeholder="https://facebook.com/seu_usuario" />
                </div>
                {getError('facebookUrl')}
            </div>

            <div className="form-group">
                <label htmlFor="youtubeUrl">YouTube (Opcional)</label>
                <div className="social-input-group">
                    <span className="social-icon"><FaYoutube /></span>
                    <input id="youtubeUrl" type="text" {...register('youtubeUrl')} placeholder="https://youtube.com/seu_canal" />
                </div>
                {getError('youtubeUrl')}
            </div>

            <div className="form-group">
                <label htmlFor="linkedInUrl">LinkedIn (Opcional)</label>
                <div className="social-input-group">
                    <span className="social-icon"><FaLinkedin /></span>
                    <input id="linkedInUrl" type="text" {...register('linkedInUrl')} placeholder="https://linkedin.com/in/seu_usuario" />
                </div>
                {getError('linkedInUrl')}
            </div>
        </>
    );
};

export default Step4Social;