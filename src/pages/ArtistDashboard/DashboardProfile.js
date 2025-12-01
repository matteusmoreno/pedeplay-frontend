/* ========================================
 * ARQUIVO: src/pages/ArtistDashboard/DashboardProfile.js
 * Perfil do Artista - Versão Aprimorada
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
    FaUser,
    FaEdit,
    FaSave,
    FaTimes,
    FaCheck,
    FaCamera,
    FaPhone,
    FaCrown
} from 'react-icons/fa';
import './DashboardProfile.css';

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
    const [imageUploadProgress, setImageUploadProgress] = useState(0);
    
    // Estados para seções retráteis
    const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(true);
    const [isAddressOpen, setIsAddressOpen] = useState(false);
    const [isSocialOpen, setIsSocialOpen] = useState(false);

    const fileInputRef = useRef(null);
    const alertTimeoutRef = useRef(null);

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
            setAddressFound(false);
        }
    }, [artist, reset]);

    // Auto-dismiss do alerta após 5 segundos
    useEffect(() => {
        if (message.text) {
            // Limpa timeout anterior se existir
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
            
            // Define novo timeout
            alertTimeoutRef.current = setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 5000);
        }
        
        // Cleanup
        return () => {
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
        };
    }, [message]);

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

        // Validação de tamanho (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
            return;
        }

        // Validação de tipo
        if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setMessage({ type: 'error', text: 'Apenas arquivos JPG, JPEG ou PNG são permitidos.' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ type: '', text: '' });
        setImageUploadProgress(0);

        try {
            // Simula progresso de upload
            const progressInterval = setInterval(() => {
                setImageUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const updatedArtist = await uploadProfileImage(artist.id, file);
            clearInterval(progressInterval);
            setImageUploadProgress(100);
            
            setTimeout(() => {
                setProfileImageUrl(updatedArtist.profileImageUrl);
                setMessage({ type: 'success', text: 'Foto de perfil atualizada com sucesso!' });
                setImageUploadProgress(0);
                onUpdate();
            }, 500);
        } catch (error) {
            setImageUploadProgress(0);
            setMessage({ type: 'error', text: error.message || 'Erro ao enviar a imagem.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasSocialLinks = artist.socialLinks && Object.values(artist.socialLinks).some(link => link);

    const closeAlert = () => {
        if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
        }
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="dashboard-tab-content profile-tab">
            
            {/* Header Section */}
            <div className="profile-header">
                <h1 className="profile-main-title">Meu Perfil</h1>
                <p className="profile-subtitle">Gerencie suas informações pessoais e profissionais</p>
            </div>

            {/* Mensagens de Feedback */}
            {message.text && (
                <div className={`profile-alert profile-alert-${message.type}`}>
                    <div className="profile-alert-icon">
                        {message.type === 'success' ? <FaCheck /> : <FaTimes />}
                    </div>
                    <div className="profile-alert-content">
                        <p>{message.text}</p>
                    </div>
                    <button 
                        type="button" 
                        className="profile-alert-close"
                        onClick={closeAlert}
                        aria-label="Fechar alerta"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* --- 1. CARD DE PERFIL PRINCIPAL --- */}
            <div className="profile-hero-card">
                <div className="profile-hero-content">
                    {/* Avatar Section */}
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-wrapper">
                            {profileImageUrl ? (
                                <img src={profileImageUrl} alt="Foto de Perfil" className="profile-avatar" />
                            ) : (
                                <div className="profile-avatar-empty">
                                    <FaUserCircle />
                                </div>
                            )}
                            <button
                                type="button"
                                className="profile-avatar-change-btn"
                                onClick={() => fileInputRef.current.click()}
                                disabled={isSubmitting}
                                title="Alterar foto de perfil"
                            >
                                <FaCamera />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/png, image/jpeg, image/jpg"
                                style={{ display: 'none' }}
                            />
                        </div>
                        {imageUploadProgress > 0 && (
                            <div className="profile-avatar-progress">
                                <div 
                                    className="profile-avatar-progress-bar" 
                                    style={{ width: `${imageUploadProgress}%` }}
                                ></div>
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="profile-hero-info">
                        <div className="profile-hero-name-section">
                            <h2 className="profile-hero-name">{artist.name}</h2>
                            {artist.subscription?.planType && artist.subscription.planType !== 'FREE' && (
                                <span className="profile-plan-badge premium">
                                    <FaCrown /> {artist.subscription.planType}
                                </span>
                            )}
                            {artist.subscription?.planType === 'FREE' && (
                                <span className="profile-plan-badge free">FREE</span>
                            )}
                        </div>

                        {artist.biography && (
                            <p className="profile-hero-bio">{artist.biography}</p>
                        )}

                        <div className="profile-hero-stats">
                            <div className="profile-stat-item">
                                <FaEnvelope className="profile-stat-icon" />
                                <div className="profile-stat-details">
                                    <span className="profile-stat-label">Email</span>
                                    <span className="profile-stat-value">{artist.email}</span>
                                </div>
                            </div>
                            <div className="profile-stat-item">
                                <FaCalendarAlt className="profile-stat-icon" />
                                <div className="profile-stat-details">
                                    <span className="profile-stat-label">Membro desde</span>
                                    <span className="profile-stat-value">{formatDate(artist.createdAt)}</span>
                                </div>
                            </div>
                            {artist.address?.city && (
                                <div className="profile-stat-item">
                                    <FaMapMarkerAlt className="profile-stat-icon" />
                                    <div className="profile-stat-details">
                                        <span className="profile-stat-label">Localização</span>
                                        <span className="profile-stat-value">{artist.address.city}, {artist.address.state}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {hasSocialLinks && (
                            <div className="profile-social-section">
                                <p className="profile-social-title">Redes Sociais</p>
                                <div className="profile-social-links">
                                    {artist.socialLinks.instagramUrl && (
                                        <a href={artist.socialLinks.instagramUrl} target="_blank" rel="noopener noreferrer" className="profile-social-link instagram">
                                            <FaInstagram />
                                        </a>
                                    )}
                                    {artist.socialLinks.facebookUrl && (
                                        <a href={artist.socialLinks.facebookUrl} target="_blank" rel="noopener noreferrer" className="profile-social-link facebook">
                                            <FaFacebook />
                                        </a>
                                    )}
                                    {artist.socialLinks.youtubeUrl && (
                                        <a href={artist.socialLinks.youtubeUrl} target="_blank" rel="noopener noreferrer" className="profile-social-link youtube">
                                            <FaYoutube />
                                        </a>
                                    )}
                                    {artist.socialLinks.linkedInUrl && (
                                        <a href={artist.socialLinks.linkedInUrl} target="_blank" rel="noopener noreferrer" className="profile-social-link linkedin">
                                            <FaLinkedin />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 2. SEÇÕES DE EDIÇÃO --- */}
            <form onSubmit={handleSubmit(onSubmit)} className="profile-edit-form">

                {/* Informações Básicas */}
                <div className="profile-section-card">
                    <button 
                        type="button"
                        className="profile-section-header"
                        onClick={() => setIsBasicInfoOpen(!isBasicInfoOpen)}
                    >
                        <div className="profile-section-title">
                            <FaUser className="profile-section-icon" />
                            <h3>Informações Básicas</h3>
                        </div>
                        <FaChevronDown className={`profile-section-chevron ${isBasicInfoOpen ? 'open' : ''}`} />
                    </button>

                    <div className={`profile-section-content ${isBasicInfoOpen ? 'open' : ''}`}>
                        <div className="profile-form-row">
                            <div className="profile-form-group">
                                <label htmlFor="name" className="profile-label">
                                    Nome Artístico <span className="profile-label-required">*</span>
                                </label>
                                <input 
                                    id="name" 
                                    type="text" 
                                    className="profile-input" 
                                    placeholder="Digite seu nome artístico"
                                    {...register('name')} 
                                />
                                {getError('name')}
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="email" className="profile-label">
                                    Email de Login <span className="profile-label-required">*</span>
                                </label>
                                <input 
                                    id="email" 
                                    type="email" 
                                    className="profile-input" 
                                    placeholder="seu@email.com"
                                    {...register('email')} 
                                />
                                {getError('email')}
                            </div>
                        </div>

                        <div className="profile-form-group">
                            <label htmlFor="biography" className="profile-label">
                                Biografia
                            </label>
                            <textarea 
                                id="biography" 
                                className="profile-textarea" 
                                placeholder="Conte um pouco sobre você, sua carreira e estilo musical..."
                                rows="4"
                                {...register('biography')} 
                            />
                            {getError('biography')}
                            <span className="profile-input-hint">
                                Uma boa biografia ajuda a criar conexão com seu público
                            </span>
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="profile-section-card">
                    <button 
                        type="button"
                        className="profile-section-header"
                        onClick={() => setIsAddressOpen(!isAddressOpen)}
                    >
                        <div className="profile-section-title">
                            <FaMapMarkerAlt className="profile-section-icon" />
                            <h3>Endereço</h3>
                        </div>
                        <FaChevronDown className={`profile-section-chevron ${isAddressOpen ? 'open' : ''}`} />
                    </button>

                    <div className={`profile-section-content ${isAddressOpen ? 'open' : ''}`}>
                        <div className="profile-form-group">
                            <label htmlFor="cep" className="profile-label">CEP</label>
                            <div className="profile-cep-group">
                                <input
                                    id="cep"
                                    type="text"
                                    className="profile-input"
                                    {...register('cep', { onChange: handleCepChange })}
                                    maxLength={9}
                                    placeholder="00000-000"
                                />
                                <button
                                    type="button"
                                    className="profile-btn-cep"
                                    onClick={handleCepSearch}
                                    disabled={isCepLoading}
                                >
                                    {isCepLoading ? 'Buscando...' : 'Buscar CEP'}
                                </button>
                            </div>
                            {getError('cep')}
                            {cepError && <span className="error-message">{cepError}</span>}
                        </div>

                        <div className={`profile-address-details ${addressFound ? 'visible' : ''}`}>
                            <div className="profile-form-row">
                                <div className="profile-form-group profile-form-group-large">
                                    <label htmlFor="street" className="profile-label">Rua</label>
                                    <input id="street" type="text" className="profile-input" {...register('street')} readOnly />
                                    {getError('street')}
                                </div>
                                <div className="profile-form-group">
                                    <label htmlFor="number" className="profile-label">Número</label>
                                    <input id="number" type="text" className="profile-input" placeholder="123" {...register('number')} />
                                    {getError('number')}
                                </div>
                            </div>

                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label htmlFor="neighborhood" className="profile-label">Bairro</label>
                                    <input id="neighborhood" type="text" className="profile-input" {...register('neighborhood')} readOnly />
                                    {getError('neighborhood')}
                                </div>
                                <div className="profile-form-group">
                                    <label htmlFor="complement" className="profile-label">Complemento</label>
                                    <input id="complement" type="text" className="profile-input" placeholder="Apto, Bloco..." {...register('complement')} />
                                    {getError('complement')}
                                </div>
                            </div>

                            <div className="profile-form-row">
                                <div className="profile-form-group">
                                    <label htmlFor="city" className="profile-label">Cidade</label>
                                    <input id="city" type="text" className="profile-input" {...register('city')} readOnly />
                                    {getError('city')}
                                </div>
                                <div className="profile-form-group profile-form-group-small">
                                    <label htmlFor="state" className="profile-label">Estado</label>
                                    <input id="state" type="text" className="profile-input" {...register('state')} readOnly />
                                    {getError('state')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Redes Sociais */}
                <div className="profile-section-card">
                    <button 
                        type="button"
                        className="profile-section-header"
                        onClick={() => setIsSocialOpen(!isSocialOpen)}
                    >
                        <div className="profile-section-title">
                            <FaShareAlt className="profile-section-icon" />
                            <h3>Redes Sociais</h3>
                        </div>
                        <FaChevronDown className={`profile-section-chevron ${isSocialOpen ? 'open' : ''}`} />
                    </button>

                    <div className={`profile-section-content ${isSocialOpen ? 'open' : ''}`}>
                        <div className="profile-form-row">
                            <div className="profile-form-group">
                                <label htmlFor="socialLinks.instagramUrl" className="profile-label">
                                    <FaInstagram /> Instagram
                                </label>
                                <input 
                                    id="socialLinks.instagramUrl" 
                                    type="text" 
                                    className="profile-input" 
                                    placeholder="https://instagram.com/seu_usuario"
                                    {...register('socialLinks.instagramUrl')} 
                                />
                                {getError('socialLinks.instagramUrl')}
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="socialLinks.facebookUrl" className="profile-label">
                                    <FaFacebook /> Facebook
                                </label>
                                <input 
                                    id="socialLinks.facebookUrl" 
                                    type="text" 
                                    className="profile-input" 
                                    placeholder="https://facebook.com/seu_usuario"
                                    {...register('socialLinks.facebookUrl')} 
                                />
                                {getError('socialLinks.facebookUrl')}
                            </div>
                        </div>

                        <div className="profile-form-row">
                            <div className="profile-form-group">
                                <label htmlFor="socialLinks.youtubeUrl" className="profile-label">
                                    <FaYoutube /> YouTube
                                </label>
                                <input 
                                    id="socialLinks.youtubeUrl" 
                                    type="text" 
                                    className="profile-input" 
                                    placeholder="https://youtube.com/seu_canal"
                                    {...register('socialLinks.youtubeUrl')} 
                                />
                                {getError('socialLinks.youtubeUrl')}
                            </div>

                            <div className="profile-form-group">
                                <label htmlFor="socialLinks.linkedInUrl" className="profile-label">
                                    <FaLinkedin /> LinkedIn
                                </label>
                                <input 
                                    id="socialLinks.linkedInUrl" 
                                    type="text" 
                                    className="profile-input" 
                                    placeholder="https://linkedin.com/in/seu_perfil"
                                    {...register('socialLinks.linkedInUrl')} 
                                />
                                {getError('socialLinks.linkedInUrl')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botão de Salvar */}
                <div className="profile-form-actions">
                    <button type="submit" className="profile-btn-save" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <span className="profile-btn-spinner"></span>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <FaSave /> Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DashboardProfile;