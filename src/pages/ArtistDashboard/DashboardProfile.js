/* * ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardProfile.js
 * (Aba "Perfil") - CORRIGIDO
 * ========================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { updateArtistDetails, uploadProfileImage } from '../../services/artistService';
import {
    FaUserCircle,
    FaUpload,
    FaInstagram,
    FaFacebook,
    FaYoutube,
    FaLinkedin,
    FaEnvelope,
    FaIdCard,
    FaCalendarAlt,
    FaChevronDown,
    FaMapMarkerAlt,
    FaShareAlt,
    FaUser // <--- CORREÇÃO: Ícone adicionado aqui
} from 'react-icons/fa';

// --- Schema de Validação para UPDATE ---
const updateProfileSchema = yup.object().shape({
    name: yup.string(),
    biography: yup.string(),
    email: yup.string().email('Email inválido'),

    cep: yup.string().matches(/^(\d{5}-\d{3}|\d{8})?$/, 'Formato de CEP inválido.'),

    street: yup.string().when('cep', {
        is: (val) => val && val.length > 0,
        then: schema => schema.required('Rua é obrigatória'),
        otherwise: schema => schema.notRequired()
    }),
    neighborhood: yup.string().when('cep', {
        is: (val) => val && val.length > 0,
        then: schema => schema.required('Bairro é obrigatório'),
        otherwise: schema => schema.notRequired()
    }),
    city: yup.string().when('cep', {
        is: (val) => val && val.length > 0,
        then: schema => schema.required('Cidade é obrigatória'),
        otherwise: schema => schema.notRequired()
    }),
    state: yup.string().when('cep', {
        is: (val) => val && val.length > 0,
        then: schema => schema.required('Estado é obrigatório'),
        otherwise: schema => schema.notRequired()
    }),
    number: yup.string().when('cep', {
        is: (val) => val && val.length > 0,
        then: schema => schema.required('Número é obrigatório'),
        otherwise: schema => schema.notRequired()
    }),
    complement: yup.string(),

    socialLinks: yup.object().shape({
        instagramUrl: yup.string().url('URL inválida').nullable(),
        facebookUrl: yup.string().url('URL inválida').nullable(),
        youtubeUrl: yup.string().url('URL inválida').nullable(),
        linkedInUrl: yup.string().url('URL inválida').nullable(),
    })
});

// Componente reutilizável para a "Sanfona" (Accordion)
const AccordionSection = ({ title, icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
            <button type="button" className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="accordion-title">
                    {icon}
                    <span>{title}</span>
                </div>
                <FaChevronDown className="accordion-icon" />
            </button>
            <div className="accordion-content">
                {children}
            </div>
        </div>
    );
};

// Função para formatar o CEP (máscara)
const formatCEP = (value) => {
    if (!value) return "";
    value = value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    return value;
};

// Função para formatar datas
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};


const DashboardProfile = ({ artist, onUpdate }) => {
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileImageUrl, setProfileImageUrl] = useState(artist.profileImageUrl);
    const [isCepLoading, setIsCepLoading] = useState(false);
    const [cepError, setCepError] = useState(null);

    const [addressFound, setAddressFound] = useState(true);

    const fileInputRef = useRef(null);

    const { register, handleSubmit, reset, setValue, watch, trigger, clearErrors, formState: { errors } } = useForm({
        resolver: yupResolver(updateProfileSchema),
        defaultValues: artist
    });

    const cepValue = watch('cep');

    useEffect(() => {
        const formattedCep = formatCEP(artist.address?.cep);
        reset({
            ...artist,
            cep: formattedCep,
            street: artist.address?.street,
            neighborhood: artist.address?.neighborhood,
            city: artist.address?.city,
            state: artist.address?.state,
            number: artist.address?.number,
            complement: artist.address?.complement
        });
        setProfileImageUrl(artist.profileImageUrl);
        if (artist.address?.cep) {
            setAddressFound(true);
        } else {
            // Se não tem CEP, começa com os campos ocultos
            setAddressFound(false);
        }
    }, [artist, reset]);

    const getError = (fieldName) => {
        const fieldError = fieldName.split('.').reduce((acc, part) => acc && acc[part], errors);
        return fieldError && <span className="error-message">{fieldError.message}</span>;
    };

    const handleCepChange = (e) => {
        const formattedCep = formatCEP(e.target.value);
        setValue('cep', formattedCep, { shouldValidate: true });
        if (cepError) setCepError(null);
        setAddressFound(false);
        setValue('street', '');
        setValue('neighborhood', '');
        setValue('city', '');
        setValue('state', '');
    };

    const handleCepSearch = async () => {
        setCepError(null);
        const isValid = await trigger('cep');
        if (!isValid) {
            setAddressFound(false);
            return;
        }

        const cep = cepValue.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setIsCepLoading(true);
        try {
            const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.data.erro) {
                setCepError('CEP não encontrado.');
                setAddressFound(false);
            } else {
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

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const dataToUpdate = {
                id: artist.id,
                name: data.name,
                biography: data.biography,
                email: data.email,
                cep: data.cep?.replace(/\D/g, '') || null,
                number: data.number,
                complement: data.complement,
                socialLinks: data.socialLinks
            };

            await updateArtistDetails(dataToUpdate);
            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            onUpdate();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Erro ao atualizar o perfil.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const updatedArtist = await uploadProfileImage(artist.id, file);
            setProfileImageUrl(updatedArtist.profileImageUrl);
            setMessage({ type: 'success', text: 'Foto de perfil atualizada!' });
            onUpdate();
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Erro ao enviar a imagem.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasSocialLinks = artist.socialLinks && Object.values(artist.socialLinks).some(link => link);

    return (
        <div className="dashboard-tab-content profile-tab">

            {/* --- 1. CARD DE INFORMAÇÕES (READ-ONLY) --- */}
            <div className="profile-info-card">
                <div className="profile-info-avatar">
                    <div className="avatar-upload-container">
                        {profileImageUrl ? (
                            <img src={profileImageUrl} alt="Foto de Perfil" className="profile-avatar-image" />
                        ) : (
                            <FaUserCircle className="profile-avatar-placeholder" />
                        )}
                        <button
                            type="button"
                            className="btn-overlay"
                            onClick={() => fileInputRef.current.click()}
                            disabled={isSubmitting}
                        >
                            <FaUpload /> Alterar Foto
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/png, image/jpeg"
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
                <div className="profile-info-details">
                    <h2 className="profile-info-name">{artist.name}</h2>
                    <p className="profile-info-item">
                        <FaEnvelope /> {artist.email}
                    </p>
                    <p className="profile-info-item">
                        <FaIdCard /> Plano: <span className="plan-badge">{artist.subscription?.planType || 'FREE'}</span>
                    </p>
                    <p className="profile-info-item">
                        <FaCalendarAlt /> Membro desde: {formatDate(artist.createdAt)}
                    </p>

                    {hasSocialLinks && (
                        <div className="profile-social-links">
                            {artist.socialLinks.instagramUrl && (
                                <a href={artist.socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
                            )}
                            {artist.socialLinks.facebookUrl && (
                                <a href={artist.socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer"><FaFacebook /></a>
                            )}
                            {artist.socialLinks.youtubeUrl && (
                                <a href={artist.socialLinks.youtubeUrl} target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
                            )}
                            {artist.socialLinks.linkedInUrl && (
                                <a href={artist.socialLinks.linkedInUrl} target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {message.text && (
                <div className={`form-message ${message.type}-message`}>{message.text}</div>
            )}

            {/* --- 2. SEÇÕES DE EDIÇÃO (ACCORDION) --- */}
            <form onSubmit={handleSubmit(onSubmit)} className="profile-form">

                <AccordionSection title="Dados Pessoais" icon={<FaUser />}>
                    <div className="form-group">
                        <label htmlFor="name">Nome Artístico</label>
                        <input id="name" type="text" {...register('name')} />
                        {getError('name')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email de Login</label>
                        <input id="email" type="email" {...register('email')} />
                        {getError('email')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="biography">Biografia</label>
                        <textarea id="biography" {...register('biography')} />
                        {getError('biography')}
                    </div>
                </AccordionSection>

                <AccordionSection title="Endereço" icon={<FaMapMarkerAlt />}>
                    <div className="form-group">
                        <label htmlFor="cep">CEP</label>
                        <div className="cep-input-group">
                            <div className="form-group">
                                <input
                                    id="cep"
                                    type="text"
                                    {...register('cep', { onChange: handleCepChange })}
                                    maxLength={9}
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
                        {getError('cep')}
                        {cepError && <span className="error-message">{cepError}</span>}
                        {isCepLoading && <span className="loading-message">Buscando...</span>}
                    </div>

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
                                <input id="complement" type="text" {...register('complement')} />
                                {getError('complement')}
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                <AccordionSection title="Redes Sociais" icon={<FaShareAlt />}>
                    <div className="form-group">
                        <label htmlFor="socialLinks.instagramUrl">Instagram</label>
                        <div className="social-input-group">
                            <span className="social-icon"><FaInstagram /></span>
                            <input id="socialLinks.instagramUrl" type="text" {...register('socialLinks.instagramUrl')} placeholder="https://instagram.com/seu_usuario" />
                        </div>
                        {getError('socialLinks.instagramUrl')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="socialLinks.facebookUrl">Facebook</label>
                        <div className="social-input-group">
                            <span className="social-icon"><FaFacebook /></span>
                            <input id="socialLinks.facebookUrl" type="text" {...register('socialLinks.facebookUrl')} placeholder="https://facebook.com/seu_usuario" />
                        </div>
                        {getError('socialLinks.facebookUrl')}
                    </div>
                    <div className="form-group">
                        <label htmlFor="socialLinks.youtubeUrl">YouTube</label>
                        <div className="social-input-group">
                            <span className="social-icon"><FaYoutube /></span>
                            <input id="socialLinks.youtubeUrl" type="text" {...register('socialLinks.youtubeUrl')} placeholder="https://youtube.com/seu_canal" />
                        </div>
                        {getError('socialLinks.youtubeUrl')}
                    </div>
                </AccordionSection>

                <button type="submit" className="btn-primary btn-submit-profile" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        </div>
    );
};

export default DashboardProfile;