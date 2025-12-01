import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../Modal/Modal';
import { getAvailableSlotsByArtist } from '../../services/availabilityService';
import { createContract } from '../../services/contractService';
import { 
    FaCalendarCheck, 
    FaUser, 
    FaPhone, 
    FaEnvelope, 
    FaIdCard, 
    FaClock,
    FaChevronLeft,
    FaChevronRight,
    FaCalendarAlt,
    FaMoneyBillWave,
    FaCheckCircle
} from 'react-icons/fa';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, artistId, artistName }) => {
    const [step, setStep] = useState(1); // 1: Calendário, 2: Horários, 3: Dados do Cliente
    const [slots, setSlots] = useState([]);
    const [selectedSlots, setSelectedSlots] = useState([]); // Array de IDs
    const [selectedDate, setSelectedDate] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Customer Form
    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        documentNumber: ''
    });

    // Carrega slots ao abrir
    useEffect(() => {
        if (isOpen && artistId) {
            setLoadingSlots(true);
            getAvailableSlotsByArtist(artistId)
                .then(data => {
                    const sorted = data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                    setSlots(sorted);
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingSlots(false));
        } else {
            // Reset ao fechar
            setStep(1);
            setSelectedSlots([]);
            setSelectedDate(null);
            setCurrentMonth(new Date());
            setSuccess(false);
            setError(null);
            setCustomerData({
                name: '',
                email: '',
                phoneNumber: '',
                documentNumber: ''
            });
        }
    }, [isOpen, artistId]);

    // Get days with available slots for current month
    const daysWithSlots = useMemo(() => {
        const days = new Set();
        slots.forEach(slot => {
            // Parse startTime string (formato: YYYY-MM-DDTHH:MM:SS)
            const datePart = slot.startTime.split('T')[0]; // "2025-12-29"
            const [year, month, day] = datePart.split('-').map(Number);
            
            if (month - 1 === currentMonth.getMonth() && 
                year === currentMonth.getFullYear()) {
                days.add(day);
            }
        });
        return days;
    }, [slots, currentMonth]);

    // Get slots for selected date
    const slotsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        const selectedDay = selectedDate.getDate();
        const selectedMonth = selectedDate.getMonth();
        const selectedYear = selectedDate.getFullYear();
        
        return slots.filter(slot => {
            const datePart = slot.startTime.split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            
            return day === selectedDay && 
                   month - 1 === selectedMonth && 
                   year === selectedYear;
        });
    }, [selectedDate, slots]);

    // Navigate months
    const goToPreviousMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() - 1);
        if (newMonth >= new Date()) {
            setCurrentMonth(newMonth);
        }
    };

    const goToNextMonth = () => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + 1);
        setCurrentMonth(newMonth);
    };

    // Render calendar
    const renderCalendar = useCallback(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const days = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Empty cells
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isPast = date < today;
            const hasSlots = daysWithSlots.has(day);
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isPast ? 'past' : ''} ${hasSlots ? 'has-slots' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                        if (!isPast && hasSlots) {
                            setSelectedDate(date);
                            setStep(2);
                        }
                    }}
                >
                    <span className="day-number">{day}</span>
                    {hasSlots && <span className="slot-indicator"></span>}
                </div>
            );
        }

        return days;
    }, [currentMonth, daysWithSlots, selectedDate]);

    const handleSlotToggle = (slotId) => {
        if (selectedSlots.includes(slotId)) {
            setSelectedSlots(prev => prev.filter(id => id !== slotId));
        } else {
            setSelectedSlots(prev => [...prev, slotId]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setError(null);
        if (!customerData.name || !customerData.email || !customerData.phoneNumber || !customerData.documentNumber) {
            setError('Por favor, preencha todos os dados.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                contract: {
                    availabilityIds: selectedSlots
                },
                customer: customerData
            };

            await createContract(payload);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Erro ao solicitar contrato.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDateTime = (iso) => {
        const d = new Date(iso);
        return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    // Cálculo do total
    const totalValue = selectedSlots.reduce((acc, id) => {
        const slot = slots.find(s => s.id === id);
        return acc + (slot ? slot.price : 0);
    }, 0);

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const isPreviousMonthDisabled = currentMonth <= new Date();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={success ? "Solicitação Enviada!" : `Contratar ${artistName}`}
            size="large"
            showActions={false}
        >
            <div className="booking-modal-container">
                {success ? (
                    <div className="booking-success">
                        <div className="success-icon"><FaCheckCircle /></div>
                        <h3>Pedido Recebido!</h3>
                        <p>O artista <strong>{artistName}</strong> recebeu sua solicitação de show.</p>
                        <p>Você receberá um email assim que ele confirmar a data.</p>
                        <button className="btn-primary" onClick={onClose}>Fechar</button>
                    </div>
                ) : (
                    <>
                        {/* STEPS INDICATOR */}
                        <div className="booking-steps">
                            <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>
                                <div className="step-number">1</div>
                                <span className="step-label">Escolher Data</span>
                            </div>
                            <div className="step-line"></div>
                            <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>
                                <div className="step-number">2</div>
                                <span className="step-label">Selecionar Horários</span>
                            </div>
                            <div className="step-line"></div>
                            <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>
                                <div className="step-number">3</div>
                                <span className="step-label">Confirmar Dados</span>
                            </div>
                        </div>

                        {/* STEP 1: Calendário */}
                        {step === 1 && (
                            <div className="step-content calendar-step">
                                <div className="calendar-header">
                                    <button 
                                        className="nav-month-btn" 
                                        onClick={goToPreviousMonth}
                                        disabled={isPreviousMonthDisabled}
                                    >
                                        <FaChevronLeft />
                                    </button>
                                    <h4>
                                        <FaCalendarAlt /> {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                    </h4>
                                    <button className="nav-month-btn" onClick={goToNextMonth}>
                                        <FaChevronRight />
                                    </button>
                                </div>

                                {loadingSlots ? (
                                    <div className="loading-calendar">Carregando disponibilidade...</div>
                                ) : (
                                    <>
                                        <div className="calendar-weekdays">
                                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                                <div key={day} className="weekday">{day}</div>
                                            ))}
                                        </div>
                                        <div className="calendar-grid">
                                            {renderCalendar()}
                                        </div>
                                        <div className="calendar-legend">
                                            <div className="legend-item">
                                                <span className="legend-dot available"></span>
                                                <span>Datas disponíveis</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* STEP 2: Seleção de Horários */}
                        {step === 2 && (
                            <div className="step-content slots-step">
                                <div className="selected-date-header">
                                    <FaCalendarAlt />
                                    <h4>{selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h4>
                                </div>

                                <p className="step-instruction">Selecione os horários que deseja reservar:</p>

                                <div className="time-slots-grid">
                                    {slotsForSelectedDate.map(slot => {
                                        const startTime = new Date(slot.startTime);
                                        const isSelected = selectedSlots.includes(slot.id);
                                        
                                        return (
                                            <div
                                                key={slot.id}
                                                className={`time-slot-card ${isSelected ? 'selected' : ''}`}
                                                onClick={() => handleSlotToggle(slot.id)}
                                            >
                                                {isSelected && <FaCheckCircle className="check-icon" />}
                                                <div className="slot-time">
                                                    <FaClock />
                                                    <span>{startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <div className="slot-price">
                                                    <FaMoneyBillWave />
                                                    <span>{formatCurrency(slot.price)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="booking-summary">
                                    <div className="summary-info">
                                        <span>Horários selecionados: <strong>{selectedSlots.length}</strong></span>
                                        <span className="total-value">Total: <strong>{formatCurrency(totalValue)}</strong></span>
                                    </div>
                                </div>

                                <div className="booking-footer">
                                    <button className="btn-outline" onClick={() => setStep(1)}>
                                        <FaChevronLeft /> Voltar
                                    </button>
                                    <button
                                        className="btn-primary"
                                        disabled={selectedSlots.length === 0}
                                        onClick={() => setStep(3)}
                                    >
                                        Continuar <FaChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: Dados do Cliente */}
                        {step === 3 && (
                            <div className="step-content customer-data-step">
                                <h4>Finalize sua solicitação</h4>
                                <p className="step-instruction">Preencha seus dados para que o artista possa entrar em contato:</p>

                                <div className="booking-form">
                                    <div className="form-group">
                                        <label><FaUser /> Nome Completo</label>
                                        <input 
                                            type="text" 
                                            name="name" 
                                            value={customerData.name} 
                                            onChange={handleInputChange}
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><FaEnvelope /> Email</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={customerData.email} 
                                            onChange={handleInputChange}
                                            placeholder="seu.email@exemplo.com"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><FaPhone /> WhatsApp/Telefone</label>
                                        <input 
                                            type="text" 
                                            name="phoneNumber" 
                                            value={customerData.phoneNumber} 
                                            onChange={handleInputChange} 
                                            placeholder="(00) 00000-0000" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label><FaIdCard /> CPF/CNPJ</label>
                                        <input 
                                            type="text" 
                                            name="documentNumber" 
                                            value={customerData.documentNumber} 
                                            onChange={handleInputChange}
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </div>

                                <div className="booking-summary">
                                    <h5>Resumo da Solicitação</h5>
                                    <div className="summary-details">
                                        <div className="summary-row">
                                            <span>Data:</span>
                                            <strong>{selectedDate?.toLocaleDateString('pt-BR')}</strong>
                                        </div>
                                        <div className="summary-row">
                                            <span>Horários:</span>
                                            <strong>{selectedSlots.length}</strong>
                                        </div>
                                        <div className="summary-row total">
                                            <span>Valor Total:</span>
                                            <strong>{formatCurrency(totalValue)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="error-message">{error}</div>}

                                <div className="booking-footer">
                                    <button className="btn-outline" onClick={() => setStep(2)}>
                                        <FaChevronLeft /> Voltar
                                    </button>
                                    <button
                                        className="btn-primary btn-submit"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Enviando...' : <><FaCalendarCheck /> Solicitar Contrato</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default BookingModal;