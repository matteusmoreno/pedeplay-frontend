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
    FaClock,
    FaPlus,
    FaEdit,
    FaCheckCircle,
    FaTimesCircle,
    FaCalendarDay,
    FaMoneyBillWave,
    FaChartLine,
    FaFilter,
    FaCalendarCheck,
    FaExclamationCircle,
    FaBriefcase,
    FaMoon
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
    const [viewMode, setViewMode] = useState('year'); // 'year' or 'month'
    
    // Time Slot Modal
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [selectedHourSlot, setSelectedHourSlot] = useState(null);
    const [slotPrice, setSlotPrice] = useState('');
    const [slotStatus, setSlotStatus] = useState('AVAILABLE');
    const [isCreating, setIsCreating] = useState(false);
    
    // Apply to Range Modal
    const [showApplyRangeModal, setShowApplyRangeModal] = useState(false);
    const [rangeStartHour, setRangeStartHour] = useState('8');
    const [rangeEndHour, setRangeEndHour] = useState('18');
    const [rangePrice, setRangePrice] = useState('');
    const [rangeStatus, setRangeStatus] = useState('AVAILABLE');
    
    // Confirmation Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState({ title: '', description: '' });
    
    // Filter State
    const [statusFilter, setStatusFilter] = useState('ALL');
    
    // Hour options (00:00 to 23:00)
    const hourOptions = useMemo(() => {
        return Array.from({ length: 24 }, (_, i) => ({
            value: i,
            label: `${String(i).padStart(2, '0')}:00`
        }));
    }, []);

    // Estatísticas da agenda
    const agendaStats = useMemo(() => {
        const now = new Date();
        const futureSlots = availabilities.filter(avail => new Date(avail.startTime) > now);
        
        const available = futureSlots.filter(a => a.availabilityStatus === 'AVAILABLE').length;
        const booked = futureSlots.filter(a => a.availabilityStatus === 'BOOKED').length;
        const unavailable = futureSlots.filter(a => a.availabilityStatus === 'UNAVAILABLE').length;
        
        // Soma apenas os horários BOOKED (já confirmados)
        const totalEarnings = futureSlots
            .filter(a => a.availabilityStatus === 'BOOKED')
            .reduce((sum, a) => sum + (a.price || 0), 0);
        
        // Soma AVAILABLE + BOOKED para projeção total
        const projectedEarnings = futureSlots
            .filter(a => a.availabilityStatus === 'AVAILABLE' || a.availabilityStatus === 'BOOKED')
            .reduce((sum, a) => sum + (a.price || 0), 0);
        
        const avgPrice = futureSlots.length > 0
            ? futureSlots.reduce((sum, a) => sum + (a.price || 0), 0) / futureSlots.length
            : 0;

        return {
            totalSlots: futureSlots.length,
            available,
            booked,
            unavailable,
            totalEarnings,
            projectedEarnings,
            avgPrice
        };
    }, [availabilities]);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const availData = await getAvailabilitiesByArtist(user.id);
            setAvailabilities(availData.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
        } catch (error) {
            addToast('Erro', error.message || 'Erro ao carregar disponibilidades.', 'error');
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
        // Validar preço apenas se não for status UNAVAILABLE
        if (slotStatus !== 'UNAVAILABLE' && (!slotPrice || parseFloat(slotPrice) <= 0)) {
            addToast('Atenção', 'Defina um preço válido para horários disponíveis ou reservados.', 'info');
            return;
        }

        setIsCreating(true);
        try {
            const finalPrice = slotStatus === 'UNAVAILABLE' ? 0 : parseFloat(slotPrice);
            
            // Formatar datas manualmente
            const formatDateTime = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hour = String(date.getHours()).padStart(2, '0');
                return `${year}-${month}-${day}T${hour}:00:00`;
            };
            
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
                
                await createAvailability({
                    artistId: user.id,
                    startTime: formatDateTime(startDate),
                    endTime: formatDateTime(endDate),
                    availabilityStatus: slotStatus,
                    price: finalPrice
                });
                addToast('Sucesso', 'Horário adicionado com sucesso!', 'success');
            } else {
                // Update existing slot - deletar e criar novamente
                await deleteAvailability(selectedHourSlot.id);
                
                const availDate = new Date(selectedHourSlot.startTime);
                const startDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate(), availDate.getHours(), 0, 0);
                const endDate = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate(), availDate.getHours() + 1, 0, 0);
                
                await createAvailability({
                    artistId: user.id,
                    startTime: formatDateTime(startDate),
                    endTime: formatDateTime(endDate),
                    availabilityStatus: slotStatus,
                    price: finalPrice
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

    // Show confirmation modal
    const showConfirmation = (title, description, action) => {
        setConfirmMessage({ title, description });
        setConfirmAction(() => action);
        setShowConfirmModal(true);
    };
    
    // Handle confirmation
    const handleConfirm = () => {
        if (confirmAction) {
            confirmAction();
        }
        setShowConfirmModal(false);
        setConfirmAction(null);
    };
    
    // Delete slot
    const handleDeleteSlotFromModal = () => {
        if (selectedHourSlot?.isNew) return;
        
        showConfirmation(
            'Excluir Horário',
            'Tem certeza que deseja excluir este horário? Esta ação não pode ser desfeita.',
            async () => {
                try {
                    await deleteAvailability(selectedHourSlot.id);
                    addToast('Sucesso', 'Horário excluído com sucesso!', 'success');
                    setShowSlotModal(false);
                    setSelectedHourSlot(null);
                    setSlotPrice('');
                    setSlotStatus('AVAILABLE');
                    fetchData();
                } catch (error) {
                    addToast('Erro', error.message || 'Não foi possível excluir o horário. Tente novamente.', 'error');
                }
            }
        );
    };
    
    // Apply to hour range
    const handleApplyToRange = () => {
        if (rangeStatus !== 'UNAVAILABLE' && (!rangePrice || parseFloat(rangePrice) <= 0)) {
            addToast('Atenção', 'Defina um preço válido para horários disponíveis ou reservados.', 'info');
            return;
        }
        
        const start = parseInt(rangeStartHour);
        const end = parseInt(rangeEndHour);
        
        if (start >= end) {
            addToast('Atenção', 'O horário inicial deve ser menor que o horário final.', 'info');
            return;
        }
        
        const totalHours = end - start;
        showConfirmation(
            'Aplicar ao Período',
            `Isso irá configurar ${totalHours} horário(s) (${start}:00 às ${end}:00) neste dia. Horários já reservados serão mantidos. Deseja continuar?`,
            async () => {
                setIsCreating(true);
                try {
            const finalPrice = rangeStatus === 'UNAVAILABLE' ? 0 : parseFloat(rangePrice);
            const now = new Date();
            let successCount = 0;
            let skippedBooked = 0;
            
            const formatDateTime = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const hour = String(date.getHours()).padStart(2, '0');
                return `${year}-${month}-${day}T${hour}:00:00`;
            };
            
            const start = parseInt(rangeStartHour);
            const end = parseInt(rangeEndHour);
            
            for (let hour = start; hour < end; hour++) {
                const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour, 0, 0);
                const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hour + 1, 0, 0);
                
                // Pular horários no passado
                if (startDate < now) continue;
                
                // Verificar se já existe slot neste horário
                const existingSlot = getSlotForHour(hour);
                
                if (existingSlot) {
                    // Não deletar horários já reservados (BOOKED)
                    if (existingSlot.availabilityStatus === 'BOOKED') {
                        skippedBooked++;
                        continue;
                    }
                    // Deletar horários disponíveis ou indisponíveis para sobrescrever
                    await deleteAvailability(existingSlot.id);
                }
                
                // Criar novo slot
                await createAvailability({
                    artistId: user.id,
                    startTime: formatDateTime(startDate),
                    endTime: formatDateTime(endDate),
                    availabilityStatus: rangeStatus,
                    price: finalPrice
                });
                successCount++;
            }
            
            let message = `${successCount} horário(s) configurado(s) com sucesso!`;
            if (skippedBooked > 0) {
                message += ` ${skippedBooked} horário(s) reservado(s) foram mantidos.`;
            }
            addToast('Sucesso', message, 'success');
            setShowApplyRangeModal(false);
            setRangePrice('');
            setRangeStatus('AVAILABLE');
            setRangeStartHour('8');
            setRangeEndHour('18');
            fetchData();
        } catch (error) {
            addToast('Erro', error.message || 'Não foi possível configurar os horários. Tente novamente.', 'error');
        } finally {
            setIsCreating(false);
        }
            }
        );
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
            {/* === HEADER DA AGENDA === */}
            <div className="agenda-header">
                <div className="agenda-header-content">
                    <div className="agenda-header-info">
                        <div className="agenda-header-icon">
                            <FaCalendarAlt />
                        </div>
                        <div className="agenda-header-text">
                            <h2>Minha Agenda</h2>
                            <p>Gerencie sua disponibilidade e preços por horário</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* === ESTATÍSTICAS === */}
            <div className="agenda-stats-section">
                <div className="stats-grid-agenda">
                    <div className="stat-card-agenda">
                        <div className="stat-icon-agenda total">
                            <FaCalendarDay />
                        </div>
                        <div className="stat-content-agenda">
                            <span className="stat-value-agenda">{agendaStats.totalSlots}</span>
                            <span className="stat-label-agenda">Total de Horários</span>
                        </div>
                    </div>

                    <div className="stat-card-agenda">
                        <div className="stat-icon-agenda available">
                            <FaCheckCircle />
                        </div>
                        <div className="stat-content-agenda">
                            <span className="stat-value-agenda">{agendaStats.available}</span>
                            <span className="stat-label-agenda">Disponíveis</span>
                        </div>
                    </div>

                    <div className="stat-card-agenda">
                        <div className="stat-icon-agenda booked">
                            <FaCalendarCheck />
                        </div>
                        <div className="stat-content-agenda">
                            <span className="stat-value-agenda">{agendaStats.booked}</span>
                            <span className="stat-label-agenda">Reservados</span>
                        </div>
                    </div>

                    <div className="stat-card-agenda">
                        <div className="stat-icon-agenda earnings">
                            <FaMoneyBillWave />
                        </div>
                        <div className="stat-content-agenda">
                            <span className="stat-value-agenda">{formatCurrency(agendaStats.totalEarnings)}</span>
                            <span className="stat-label-agenda">Receita Confirmada</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* === CALENDÁRIO === */}
            <div className="calendar-section">
                <div className="calendar-section-header">
                    <div className="calendar-navigation">
                        <button 
                            className="btn-calendar-nav" 
                            onClick={() => setCurrentYear(prev => prev - 1)}
                            disabled={currentYear <= new Date().getFullYear()}
                            title="Ano anterior"
                        >
                            <FaChevronLeft />
                        </button>
                        <div className="calendar-year-display">
                            <FaCalendarAlt />
                            <span>{currentYear}</span>
                        </div>
                        <button 
                            className="btn-calendar-nav" 
                            onClick={() => setCurrentYear(prev => prev + 1)}
                            title="Próximo ano"
                        >
                            <FaChevronRight />
                        </button>
                    </div>

                    <div className="calendar-legend">
                        <div className="legend-item">
                            <span className="legend-dot available"></span>
                            <span>Disponível</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot booked"></span>
                            <span>Reservado</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot unavailable"></span>
                            <span>Indisponível</span>
                        </div>
                    </div>
                </div>
                
                <div className="year-calendar">
                    {Array.from({ length: 12 }, (_, i) => renderMonthCalendar(i))}
                </div>
            </div>

            {/* === GESTÃO DE HORÁRIOS === */}
            {selectedDate && (
                <div className="time-slot-section">
                    <div className="slot-section-header">
                        <div className="slot-date-info">
                            <FaClock />
                            <div>
                                <h3>Gerenciar Horários</h3>
                                <p>{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                        </div>

                        <button 
                            className="btn-apply-all-day"
                            onClick={() => setShowApplyRangeModal(true)}
                            title="Aplicar preço/status para um período de horários"
                        >
                            <FaClock />
                            <span>Aplicar ao Período</span>
                        </button>
                    </div>
                    
                    <div className="slot-filters-row">
                        <div className="slot-filters">
                            <button 
                                className={`filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('ALL')}
                            >
                                Todos
                            </button>
                            <button 
                                className={`filter-btn ${statusFilter === 'AVAILABLE' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('AVAILABLE')}
                            >
                                <FaCheckCircle /> Disponíveis
                            </button>
                            <button 
                                className={`filter-btn ${statusFilter === 'BOOKED' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('BOOKED')}
                            >
                                <FaCalendarCheck /> Reservados
                            </button>
                            <button 
                                className={`filter-btn ${statusFilter === 'UNAVAILABLE' ? 'active' : ''}`}
                                onClick={() => setStatusFilter('UNAVAILABLE')}
                            >
                                <FaTimesCircle /> Indisponíveis
                            </button>
                        </div>
                    </div>
                    
                    <div className="hours-grid">
                        {hourOptions.map(hour => {
                            const existingSlot = getSlotForHour(hour.value);
                            
                            // Aplicar filtro
                            if (statusFilter !== 'ALL') {
                                if (!existingSlot || existingSlot.availabilityStatus !== statusFilter) {
                                    return null;
                                }
                            }
                            
                            const statusClass = existingSlot?.availabilityStatus.toLowerCase() || '';
                            
                            return (
                                <div
                                    key={hour.value}
                                    className={`hour-slot ${existingSlot ? 'has-slot' : 'empty-slot'} ${statusClass}`}
                                    onClick={() => handleHourClick(hour.value)}
                                >
                                    <div className="hour-slot-header">
                                        <span className="hour-time">{hour.label}</span>
                                        {existingSlot ? (
                                            <FaEdit className="slot-edit-icon" />
                                        ) : (
                                            <FaPlus className="slot-add-icon" />
                                        )}
                                    </div>
                                    
                                    {existingSlot ? (
                                        <div className="slot-details">
                                            <span className="slot-price">{formatCurrency(existingSlot.price)}</span>
                                            <span className={`slot-status-badge ${statusClass}`}>
                                                {getStatusLabel(existingSlot.availabilityStatus)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="slot-empty-state">
                                            <span>Adicionar horário</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {statusFilter !== 'ALL' && hourOptions.every(hour => {
                        const existingSlot = getSlotForHour(hour.value);
                        return !existingSlot || existingSlot.availabilityStatus !== statusFilter;
                    }) && (
                        <div className="no-slots-message">
                            <FaCalendarAlt />
                            <p>Nenhum horário {getStatusLabel(statusFilter).toLowerCase()} nesta data</p>
                        </div>
                    )}
                </div>
            )}

            {/* === MODAL DE GESTÃO DE HORÁRIO === */}
            {showSlotModal && (
                <div className="modal-overlay-agenda" onClick={() => setShowSlotModal(false)}>
                    <div className="modal-content-agenda" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-agenda">
                            <div className="modal-title-agenda">
                                <FaClock />
                                <div>
                                    <h3>{selectedHourSlot?.isNew ? 'Adicionar' : 'Editar'} Horário</h3>
                                    <p>{hourOptions.find(h => h.value === (selectedHourSlot?.hour ?? new Date(selectedHourSlot?.startTime).getHours()))?.label}</p>
                                </div>
                            </div>
                            <button className="modal-close-agenda" onClick={() => setShowSlotModal(false)}>
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body-agenda">
                            {slotStatus !== 'UNAVAILABLE' && (
                                <div className="form-group-agenda">
                                    <label className="form-label-agenda">
                                        <FaMoneyBillWave />
                                        <span>Preço do Horário</span>
                                    </label>
                                    <div className="input-wrapper-agenda">
                                        <span className="input-prefix">R$</span>
                                        <input
                                            type="text"
                                            value={slotPrice}
                                            onChange={e => {
                                                const value = e.target.value.replace(/[^0-9.,]/g, '');
                                                setSlotPrice(value);
                                            }}
                                            placeholder="0,00"
                                            className="modal-input-agenda"
                                        />
                                    </div>
                                    <small className="form-hint">Defina o valor para este horário específico</small>
                                </div>
                            )}
                            
                            <div className="form-group-agenda">
                                <label className="form-label-agenda">
                                    <FaFilter />
                                    <span>Status de Disponibilidade</span>
                                </label>
                                <div className="status-options-agenda">
                                    <button
                                        className={`status-btn-agenda available ${slotStatus === 'AVAILABLE' ? 'active' : ''}`}
                                        onClick={() => setSlotStatus('AVAILABLE')}
                                    >
                                        <FaCheckCircle />
                                        <div>
                                            <span className="status-name">Disponível</span>
                                            <small>Aceita reservas</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`status-btn-agenda unavailable ${slotStatus === 'UNAVAILABLE' ? 'active' : ''}`}
                                        onClick={() => setSlotStatus('UNAVAILABLE')}
                                    >
                                        <FaTimesCircle />
                                        <div>
                                            <span className="status-name">Indisponível</span>
                                            <small>Não aceita reservas</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`status-btn-agenda booked ${slotStatus === 'BOOKED' ? 'active' : ''}`}
                                        onClick={() => setSlotStatus('BOOKED')}
                                    >
                                        <FaCalendarCheck />
                                        <div>
                                            <span className="status-name">Reservado</span>
                                            <small>Já está reservado</small>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer-agenda">
                            {!selectedHourSlot?.isNew && (
                                <button className="btn-delete-agenda" onClick={handleDeleteSlotFromModal}>
                                    <FaTrash />
                                    <span>Excluir Horário</span>
                                </button>
                            )}
                            <div className="modal-actions-right">
                                <button className="btn-cancel-agenda" onClick={() => setShowSlotModal(false)}>
                                    Cancelar
                                </button>
                                <button 
                                    className="btn-save-agenda" 
                                    onClick={handleSaveSlot} 
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Salvando...' : (selectedHourSlot?.isNew ? 'Adicionar' : 'Salvar Alterações')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* === MODAL APLICAR AO PERÍODO === */}
            {showApplyRangeModal && (
                <div className="modal-overlay-agenda" onClick={() => setShowApplyRangeModal(false)}>
                    <div className="modal-content-agenda" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-agenda">
                            <div className="modal-title-agenda">
                                <FaClock />
                                <div>
                                    <h3>Aplicar ao Período</h3>
                                    <p>{selectedDate?.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                            </div>
                            <button className="modal-close-agenda" onClick={() => setShowApplyRangeModal(false)}>
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-body-agenda">
                            <div className="form-group-agenda">
                                <label className="form-label-agenda">
                                    <FaClock />
                                    <span>Período de Horários</span>
                                </label>
                                <div className="range-inputs">
                                    <div className="range-input-group">
                                        <label>De:</label>
                                        <select 
                                            value={rangeStartHour} 
                                            onChange={(e) => setRangeStartHour(e.target.value)}
                                            className="range-select"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={h.value} value={h.value}>{h.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <span className="range-separator">até</span>
                                    <div className="range-input-group">
                                        <label>Até:</label>
                                        <select 
                                            value={rangeEndHour} 
                                            onChange={(e) => setRangeEndHour(e.target.value)}
                                            className="range-select"
                                        >
                                            {hourOptions.map(h => (
                                                <option key={h.value} value={h.value}>{h.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="quick-ranges">
                                    <button 
                                        className="quick-range-btn"
                                        onClick={() => {
                                            setRangeStartHour('0');
                                            setRangeEndHour('24');
                                        }}
                                    >
                                        <FaCalendarDay /> Dia Todo
                                    </button>
                                    <button 
                                        className="quick-range-btn"
                                        onClick={() => {
                                            setRangeStartHour('8');
                                            setRangeEndHour('18');
                                        }}
                                    >
                                        <FaBriefcase /> Comercial
                                    </button>
                                    <button 
                                        className="quick-range-btn"
                                        onClick={() => {
                                            setRangeStartHour('18');
                                            setRangeEndHour('24');
                                        }}
                                    >
                                        <FaMoon /> Noturno
                                    </button>
                                </div>
                            </div>
                            
                            <div className="form-group-agenda">
                                <label className="form-label-agenda">
                                    <FaFilter />
                                    <span>Status dos Horários</span>
                                </label>
                                <div className="status-options-agenda">
                                    <button
                                        className={`status-btn-agenda available ${rangeStatus === 'AVAILABLE' ? 'active' : ''}`}
                                        onClick={() => setRangeStatus('AVAILABLE')}
                                    >
                                        <FaCheckCircle />
                                        <div>
                                            <span className="status-name">Disponível</span>
                                            <small>Aceita reservas</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`status-btn-agenda unavailable ${rangeStatus === 'UNAVAILABLE' ? 'active' : ''}`}
                                        onClick={() => setRangeStatus('UNAVAILABLE')}
                                    >
                                        <FaTimesCircle />
                                        <div>
                                            <span className="status-name">Indisponível</span>
                                            <small>Não aceita reservas</small>
                                        </div>
                                    </button>
                                    <button
                                        className={`status-btn-agenda booked ${rangeStatus === 'BOOKED' ? 'active' : ''}`}
                                        onClick={() => setRangeStatus('BOOKED')}
                                    >
                                        <FaCalendarCheck />
                                        <div>
                                            <span className="status-name">Reservado</span>
                                            <small>Já está reservado</small>
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            {rangeStatus !== 'UNAVAILABLE' && (
                                <div className="form-group-agenda">
                                    <label className="form-label-agenda">
                                        <FaMoneyBillWave />
                                        <span>Preço dos Horários</span>
                                    </label>
                                    <div className="input-wrapper-agenda">
                                        <span className="input-prefix">R$</span>
                                        <input
                                            type="text"
                                            value={rangePrice}
                                            onChange={e => {
                                                const value = e.target.value.replace(/[^0-9.,]/g, '');
                                                setRangePrice(value);
                                            }}
                                            placeholder="0,00"
                                            className="modal-input-agenda"
                                        />
                                    </div>
                                    <small className="form-hint">Este valor será aplicado a todos os horários do período selecionado</small>
                                </div>
                            )}
                            
                            <div className="warning-box">
                                <FaExclamationCircle />
                                <div>
                                    <strong>Atenção!</strong>
                                    <p>Isso irá configurar todos os horários vazios do período selecionado e sobrescrever horários disponíveis ou indisponíveis. <strong>Horários já reservados serão mantidos</strong> e não podem ser alterados.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-footer-agenda">
                            <div className="modal-actions-right" style={{ width: '100%', justifyContent: 'flex-end' }}>
                                <button className="btn-cancel-agenda" onClick={() => setShowApplyRangeModal(false)}>
                                    Cancelar
                                </button>
                                <button 
                                    className="btn-save-agenda" 
                                    onClick={handleApplyToRange} 
                                    disabled={isCreating}
                                >
                                    {isCreating ? 'Aplicando...' : 'Aplicar ao Período'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* === MODAL DE CONFIRMAÇÃO === */}
            {showConfirmModal && (
                <div className="modal-overlay-confirm" onClick={() => setShowConfirmModal(false)}>
                    <div className="modal-content-confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header-confirm">
                            <div className="confirm-icon">
                                <FaExclamationCircle />
                            </div>
                            <h3>{confirmMessage.title}</h3>
                        </div>
                        
                        <div className="modal-body-confirm">
                            <p>{confirmMessage.description}</p>
                        </div>
                        
                        <div className="modal-footer-confirm">
                            <button className="btn-cancel-confirm" onClick={() => setShowConfirmModal(false)}>
                                Cancelar
                            </button>
                            <button className="btn-confirm" onClick={handleConfirm}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardAgenda;