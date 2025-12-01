import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import {
    createAvailability,
    getAvailabilitiesByArtist,
    deleteAvailability
} from '../../services/availabilityService';
import {
    FaTrash,
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
    FaClock
} from 'react-icons/fa';
import './DashboardAgenda.css';

const DashboardAgenda = () => {
    const { user } = useAuth();
    const { addToast } = useNotification();
    const [availabilities, setAvailabilities] = useState([]);
    const [loading, setLoading] = useState(true);

    // Calendar State
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    
    // Time Slot Modal
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [selectedHourSlot, setSelectedHourSlot] = useState(null);
    const [slotPrice, setSlotPrice] = useState('');
    const [slotStatus, setSlotStatus] = useState('AVAILABLE');
    const [isCreating, setIsCreating] = useState(false);
    
    // Hour options (00:00 to 23:00)
    const hourOptions = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => ({
            value: i,
            label: `${String(i).padStart(2, '0')}:00`
        }));
    }, []);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const availData = await getAvailabilitiesByArtist(user.id);
            setAvailabilities(availData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
        } catch (error) {
            console.error(error);
            addToast('Erro', 'Falha ao carregar dados da agenda.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.id, addToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Get days with availability for a specific month
    const getDaysWithAvailability = useCallback((year, month) => {
        return availabilities
            .filter(avail => {
                const date = new Date(avail.startTime);
                return date.getFullYear() === year && date.getMonth() === month;
            })
            .map(avail => new Date(avail.startTime).getDate());
    }, [availabilities]);

    // Get availability for selected date
    const getAvailabilityForDate = useCallback(() => {
        if (!selectedDate) return [];
        return availabilities.filter(avail => {
            const date = new Date(avail.startTime);
            return date.toDateString() === selectedDate.toDateString();
        }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }, [selectedDate, availabilities]);

    // Get existing slot for a specific hour
    const getSlotForHour = useCallback((hour) => {
        if (!selectedDate) return null;
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        return availabilities.find(avail => {
            const availDate = new Date(avail.startTime);
            const availYear = availDate.getFullYear();
            const availMonth = String(availDate.getMonth() + 1).padStart(2, '0');
            const availDay = String(availDate.getDate()).padStart(2, '0');
            const availDateStr = `${availYear}-${availMonth}-${availDay}`;
            const availHour = availDate.getHours();
            return availDateStr === dateStr && availHour === hour;
        });
    }, [selectedDate, availabilities]);

    // Open modal to manage hour slot
    const handleHourClick = (hour) => {
        const existingSlot = getSlotForHour(hour);
        
        if (existingSlot) {
            setSelectedHourSlot(existingSlot);
            setSlotPrice(existingSlot.price.toString());
            setSlotStatus(existingSlot.availabilityStatus);
        } else {
            setSelectedHourSlot({ hour, isNew: true });
            setSlotPrice('');
            setSlotStatus('AVAILABLE');
        }
        setShowSlotModal(true);
    };

    // Save or update slot
    const handleSaveSlot = async () => {
        if (!slotPrice || parseFloat(slotPrice) <= 0) {
            addToast('Atenção', 'Defina um preço válido.', 'info');
            return;
        }

        setIsCreating(true);
        try {
            if (selectedHourSlot.isNew) {
                // Create new slot
                const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHourSlot.hour, 0, 0);
                const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), selectedHourSlot.hour + 1, 0, 0);
                
                // Validar se o horário está no futuro
                const now = new Date();
                if (startDate < now) {
                    addToast('Atenção', 'O horário deve estar no futuro.', 'info');
                    setIsCreating(false);
                    return;
                }
                
                // Formatar datas manualmente
                const formatDateTime = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hour = String(date.getHours()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hour}:00:00`;
                };
                
                await createAvailability({
                    artistId: user.id,
                    startTime: formatDateTime(startDate),
                    endTime: formatDateTime(endDate),
                    availabilityStatus: slotStatus,
                    price: parseFloat(slotPrice)
                });
                addToast('Sucesso', 'Horário adicionado com sucesso!', 'success');
            } else {
                // Update existing slot - deletar e criar novamente
                await deleteAvailability(selectedHourSlot.id);
                
                const availDate = new Date(selectedHourSlot.startTime);
                const startDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate(), availDate.getHours(), 0, 0);
                const endDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate(), availDate.getHours() + 1, 0, 0);
                
                // Formatar datas manualmente
                const formatDateTime = (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hour = String(date.getHours()).padStart(2, '0');
                    return `${year}-${month}-${day}T${hour}:00:00`;
                };
                
                await createAvailability({
                    artistId: user.id,
                    startTime: formatDateTime(startDate),
                    endTime: formatDateTime(endDate),
                    availabilityStatus: slotStatus,
                    price: parseFloat(slotPrice)
                });
                addToast('Sucesso', 'Horário atualizado com sucesso!', 'success');
            }
            
            setShowSlotModal(false);
            setSelectedHourSlot(null);
            setSlotPrice('');
            setSlotStatus('AVAILABLE');
            fetchData();
        } catch (error) {
            addToast('Erro', error.message || 'Erro ao salvar horário.', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    // Delete slot
    const handleDeleteSlotFromModal = async () => {
        if (!selectedHourSlot.isNew && window.confirm('Deseja realmente excluir este horário?')) {
            try {
                await deleteAvailability(selectedHourSlot.id);
                addToast('Sucesso', 'Horário excluído.', 'success');
                setShowSlotModal(false);
                setSelectedHourSlot(null);
                fetchData();
            } catch (error) {
                addToast('Erro', error.message || 'Erro ao excluir.', 'error');
            }
        }
    };

    // Status translation
    const getStatusLabel = (status) => {
        const labels = {
            'AVAILABLE': 'Disponível',
            'UNAVAILABLE': 'Indisponível',
            'BOOKED': 'Reservado'
        };
        return labels[status] || status;
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Render calendar for a specific month
    const renderMonthCalendar = (monthIndex) => {
        const firstDay = new Date(currentYear, monthIndex, 1);
        const lastDay = new Date(currentYear, monthIndex + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const daysWithAvail = getDaysWithAvailability(currentYear, monthIndex);
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        
        const days = [];
        
        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, monthIndex, day);
            const isPast = date < new Date().setHours(0, 0, 0, 0);
            const hasAvailability = daysWithAvail.includes(day);
            const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
            
            days.push(
                <div
                    key={day}
                    className={`calendar-day ${isPast ? 'past' : ''} ${hasAvailability ? 'has-availability' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                        if (!isPast) {
                            setSelectedDate(date);
                            setSelectedMonth(monthIndex);
                        }
                    }}
                >
                    <span className="day-number">{day}</span>
                    {hasAvailability && <span className="availability-dot"></span>}
                </div>
            );
        }
        
        return (
            <div className="month-card">
                <div className="month-header">{monthNames[monthIndex]}</div>
                <div className="weekdays">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                    ))}
                </div>
                <div className="calendar-grid">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="agenda-container">
            {/* Year Calendar Section */}
            <div className="calendar-section">
                <div className="calendar-header">
                    <button 
                        className="btn-icon-nav" 
                        onClick={() => setCurrentYear(prev => prev - 1)}
                        disabled={currentYear <= new Date().getFullYear()}
                        title="Ano anterior"
                        style={{ opacity: currentYear <= new Date().getFullYear() ? 0.3 : 1, cursor: currentYear <= new Date().getFullYear() ? 'not-allowed' : 'pointer' }}
                    >
                        <FaChevronLeft />
                    </button>
                    <h2><FaCalendarAlt /> Calendário {currentYear}</h2>
                    <button 
                        className="btn-icon-nav" 
                        onClick={() => setCurrentYear(prev => prev + 1)}
                        title="Próximo ano"
                    >
                        <FaChevronRight />
                    </button>
                </div>
                
                <div className="year-calendar">
                    {Array.from({ length: 12 }, (_, i) => renderMonthCalendar(i))}
                </div>
            </div>

            {/* Time Slot Management */}
            {selectedDate && (
                <div className="time-slot-section">
                    <div className="slot-management-header">
                        <h3><FaClock /> Gerenciar Horários - {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    </div>
                    
                    <div className="hours-grid">
                        {hourOptions.map(hour => {
                            const existingSlot = getSlotForHour(hour.value);
                            
                            return (
                                <div
                                    key={hour.value}
                                    className={`hour-slot ${existingSlot ? 'has-slot' : ''} ${existingSlot?.availabilityStatus.toLowerCase() || ''}`}
                                    onClick={() => handleHourClick(hour.value)}
                                >
                                    <div className="hour-time">{hour.label}</div>
                                    {existingSlot && (
                                        <>
                                            <span className="slot-price-mini">{formatCurrency(existingSlot.price)}</span>
                                            <span className="slot-status-mini">{getStatusLabel(existingSlot.availabilityStatus)}</span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Slot Management Modal */}
            {showSlotModal && (
                <div className="modal-overlay" onClick={() => setShowSlotModal(false)}>
                    <div className="modal-content slot-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <FaClock /> {selectedHourSlot?.isNew ? 'Adicionar' : 'Editar'} Horário - {hourOptions.find(h => h.value === (selectedHourSlot?.hour ?? new Date(selectedHourSlot?.startTime).getHours()))?.label}
                            </h3>
                            <button className="modal-close" onClick={() => setShowSlotModal(false)}>×</button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Preço (R$)</label>
                                <input
                                    type="number"
                                    value={slotPrice}
                                    onChange={e => setSlotPrice(e.target.value)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    className="modal-input"
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Status</label>
                                <div className="status-options">
                                    <button
                                        className={`status-btn available ${slotStatus === 'AVAILABLE' ? 'active' : ''}`}
                                        onClick={() => setSlotStatus('AVAILABLE')}
                                    >
                                        Disponível
                                    </button>
                                    <button
                                        className={`status-btn unavailable ${slotStatus === 'UNAVAILABLE' ? 'active' : ''}`}
                                        onClick={() => setSlotStatus('UNAVAILABLE')}
                                    >
                                        Indisponível
                                    </button>
                                    <button
                                        className={`status-btn booked ${slotStatus === 'BOOKED' ? 'active' : ''}`}
                                        onClick={() => setSlotStatus('BOOKED')}
                                    >
                                        Reservado
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer">
                            {!selectedHourSlot?.isNew && (
                                <button className="btn-danger" onClick={handleDeleteSlotFromModal}>
                                    <FaTrash /> Excluir
                                </button>
                            )}
                            <button className="btn-secondary" onClick={() => setShowSlotModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-primary" onClick={handleSaveSlot} disabled={isCreating}>
                                {isCreating ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardAgenda;