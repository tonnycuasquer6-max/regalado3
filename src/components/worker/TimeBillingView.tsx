import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Case, TimeEntry, Profile } from '../../types';

// --- HOOK DE MEMORIA CACHÉ ---
function useSessionState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });
    useEffect(() => {
        sessionStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);
    return [state, setState];
}

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const toYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-yellow-500 mb-4 mx-auto"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

const InputField: React.FC<any> = ({ label, type = 'text', ...props }) => (
    <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <input type={type} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" {...props} />
    </div>
);

// --- COMPONENTE SELECTOR CUSTOMIZADO ---
const CustomSelect: React.FC<{ label: string; value: string; onChange: (val: string) => void; options: {id: string, label: string}[], disabled?: boolean }> = ({ label, value, onChange, options, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOpt = options.find(o => o.id === value);

    return (
        <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
            <div 
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white uppercase tracking-widest text-[11px] font-bold cursor-pointer flex justify-between items-center transition-all focus-within:border-zinc-500"
            >
                <span className="truncate pr-4 text-zinc-300">
                    {selectedOpt ? selectedOpt.label : 'Seleccionar...'}
                </span>
                <svg className={`fill-current h-4 w-4 text-zinc-500 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[10000]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full left-0 w-full mt-2 bg-black border border-zinc-800 shadow-2xl z-[10001] flex flex-col max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className={`p-4 text-left text-[10px] uppercase tracking-widest font-bold transition-colors ${!value ? 'bg-zinc-900 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-l-2 border-transparent'}`}
                        >
                            Seleccionar...
                        </button>
                        {options.map(opt => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                className={`p-4 text-left text-[10px] uppercase tracking-widest font-bold transition-colors ${value === opt.id ? 'bg-zinc-900 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-zinc-900 border-l-2 border-transparent'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const NumberControl: React.FC<any> = ({ label, value, step, min, onChange, isTime = false, isMoney = false, prefix = '', disabled = false }) => {
    const handleDecrease = () => { if (disabled) return; let newVal = value - step; if (newVal < min) newVal = min; onChange(Math.round(newVal * 10000) / 10000); };
    const handleIncrease = () => { if (disabled) return; let newVal = value + step; onChange(Math.round(newVal * 10000) / 10000); };
    const formatTime = (decimalHours: number) => { const totalMinutes = Math.round(decimalHours * 60); const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return `${h}h ${m}m`; };

    const textColor = isMoney ? 'text-green-400' : 'text-white';
    const borderColor = isMoney ? 'border-green-900/50 focus-within:border-green-500' : 'border-zinc-800 focus-within:border-zinc-500';

    return (
        <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
            <label className={`block text-[10px] font-black mb-2 uppercase tracking-[0.3em] ${isMoney ? 'text-green-700' : 'text-zinc-500'}`}>{label}</label>
            <div className={`flex items-center bg-transparent border-b-2 transition-colors group pb-1 ${borderColor}`}>
                <div className={`flex-grow flex justify-start items-center font-mono text-xl ${textColor}`}>
                    {prefix && <span className="mr-1 opacity-70">{prefix}</span>}
                    <input type="number" value={value === 0 ? '' : value} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)} disabled={disabled} className="w-full bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" step="any" min={min} />
                </div>
                <div className="flex flex-col ml-2 justify-center">
                    <button type="button" onClick={handleIncrease} disabled={disabled} className={`hover:text-white transition-colors flex items-center justify-center p-0.5 ${isMoney ? 'text-green-700 hover:text-green-400' : 'text-zinc-600'}`}><ChevronUpIcon /></button>
                    <button type="button" onClick={handleDecrease} disabled={disabled} className={`hover:text-white transition-colors flex items-center justify-center p-0.5 mt-0.5 ${isMoney ? 'text-green-700 hover:text-green-400' : 'text-zinc-600'}`}><ChevronDownIcon /></button>
                </div>
            </div>
            {isTime && ( <div className="text-xs text-zinc-500 font-mono mt-3 text-left uppercase tracking-widest">equivale a: <span className="text-zinc-300 font-bold ml-1">{formatTime(value)}</span></div> )}
        </div>
    );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return createPortal(
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-2xl relative">
          {children}
        </div>
      </div>,
      document.body
    );
};

const calculateLayout = (entries: TimeEntry[]) => {
    const events = entries.map(e => {
        const [hoursPart, minutesPart] = (e.hora_inicio || '00:00').split(':');
        const h = parseInt(hoursPart || '0');
        const m = parseInt(minutesPart || '0') / 60;
        return { ...e, start: h + m, end: h + m + (e.horas || 0) };
    }).sort((a, b) => a.start - b.start);
    let layout: Record<string, { width: string; left: string }> = {};
    let columns: any[][] = []; let lastEventEnding: number | null = null;
    const packEvents = () => { const numCols = columns.length; columns.forEach((col, colIdx) => { col.forEach(ev => { layout[ev.id] = { width: `${100 / numCols}%`, left: `${(100 / numCols) * colIdx}%` }; }); }); };
    events.forEach(ev => {
        if (lastEventEnding !== null && ev.start >= lastEventEnding) { packEvents(); columns = []; lastEventEnding = null; }
        let placed = false;
        for (let i = 0; i < columns.length; i++) { if (columns[i][columns[i].length - 1].end <= ev.start) { columns[i].push(ev); placed = true; break; } }
        if (!placed) columns.push([ev]);
        if (lastEventEnding === null || ev.end > lastEventEnding) { lastEventEnding = ev.end; }
    });
    if (columns.length > 0) packEvents();
    return layout;
};

const TimeBillingView: React.FC<{ onCancel?: () => void; session: Session }> = ({ onCancel, session }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [clientProfiles, setClientProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useSessionState('worker_tb_modalOpen', false);
  const [selectedSlot, setSelectedSlot] = useSessionState<{ date: string; hour: number } | null>('worker_tb_slot', null);
  const [editingEntry, setEditingEntry] = useSessionState<TimeEntry | null>('worker_tb_editEntry', null);
  const [selectedClientId, setSelectedClientId] = useSessionState<string>('worker_tb_client', '');
  const [selectedCaseId, setSelectedCaseId] = useSessionState<string>('worker_tb_case', '');
  const [taskDescription, setTaskDescription] = useSessionState('worker_tb_desc', '');
  const [hoursWorked, setHoursWorked] = useSessionState<number>('worker_tb_hours', 1);
  const [rate, setRate] = useSessionState<number>('worker_tb_rate', 0);
  const [pagoStatus, setPagoStatus] = useSessionState<'cobrado' | 'por_cobrar'>('worker_tb_pago', 'por_cobrar');

  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const isLimitedAccess = currentUserProfile?.permiso_time_billing === 'acceso_limitado';
  const isEditingExistingAndLimited = isLimitedAccess && editingEntry !== null;

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setCurrentUserProfile(profile);

      const { data: asignaciones } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', session.user.id);
      const assignedCaseIds = asignaciones ? asignaciones.map(a => a.case_id) : [];

      let assignedCases: Case[] = [];
      let assignedClients: Profile[] = [];

      if (assignedCaseIds.length > 0) {
          const { data: fetchedCases } = await supabase.from('cases').select('*').in('id', assignedCaseIds);
          assignedCases = fetchedCases || [];
          
          const clientIds = [...new Set(assignedCases.map(c => c.cliente_id))];
          
          if (clientIds.length > 0) {
              const { data: fetchedClients } = await supabase.from('profiles').select('*').in('id', clientIds);
              assignedClients = fetchedClients || [];
          }
      }

      setCases(assignedCases);
      setClientProfiles(assignedClients);
      
      return profile;
    } catch (err) { return null; } finally { setLoading(false); }
  }, [session.user.id]);

  const fetchWeekEntries = useCallback(async (profile: Profile | null) => {
    if (!profile) return;
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // SOLUCIÓN AL PROBLEMA 1: Ruta explícita para evitar choque de FK
    const { data } = await supabase.from('time_entries')
        .select('*, perfil:profiles!perfil_id(primer_nombre, primer_apellido, rol, color_perfil), caso:cases!caso_id(titulo, cliente_id)')
        .eq('perfil_id', profile.id)
        .gte('fecha_tarea', toYYYYMMDD(startOfWeek))
        .lte('fecha_tarea', toYYYYMMDD(endOfWeek));
        
    setTimeEntries(data || []);
  }, [currentDate]);

  useEffect(() => { fetchInitialData().then((profile) => { if (profile) fetchWeekEntries(profile); }); }, [fetchInitialData, fetchWeekEntries]);

  const changeWeek = (direction: 'prev' | 'next') => { setCurrentDate(prev => { const newDate = new Date(prev); newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7)); return newDate; }); };

  const closeAndClearModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
    setSelectedSlot(null);
    setSelectedClientId('');
    setSelectedCaseId('');
    setTaskDescription('');
    setHoursWorked(1);
    setRate(0);
    setPagoStatus('por_cobrar');
    sessionStorage.removeItem('worker_tb_modalOpen');
    setConfirmSubmitModal(false);
  };

  const openNewEntryModal = (date: string, hour: number) => {
    setEditingEntry(null); setSelectedSlot({ date, hour }); setSelectedClientId(''); setSelectedCaseId(''); setTaskDescription(''); setHoursWorked(1); setRate(0); setPagoStatus('por_cobrar'); setIsModalOpen(true);
  };

  const openEditEntryModal = (entry: any) => {
    setEditingEntry(entry); setSelectedSlot({ date: entry.fecha_tarea, hour: parseInt(entry.hora_inicio.split(':')[0]) }); setSelectedClientId(entry.caso?.cliente_id || ''); setSelectedCaseId(entry.caso_id); setTaskDescription(entry.descripcion_tarea); setHoursWorked(entry.horas); setRate(entry.tarifa_personalizada || 0); setPagoStatus(entry.estado || 'por_cobrar'); setIsModalOpen(true);
  };

  const attemptSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitedAccess && !editingEntry) {
        setConfirmSubmitModal(true);
    } else {
        executeSaveEntry();
    }
  };

  const executeSaveEntry = async () => {
    if (!selectedSlot || !selectedCaseId || !taskDescription || hoursWorked <= 0 || !currentUserProfile) return;
    setActionLoading(true);
    
    const entryData = {
      id: editingEntry?.id,
      perfil_id: currentUserProfile.id,
      caso_id: selectedCaseId,
      descripcion_tarea: taskDescription,
      fecha_tarea: selectedSlot.date,
      hora_inicio: `${String(selectedSlot.hour).padStart(2, '0')}:00:00`,
      horas: hoursWorked,
      tarifa_personalizada: rate > 0 ? rate : null,
      estado: pagoStatus, 
      creado_por: currentUserProfile.id,
    };

    try {
      const { error } = await supabase.from('time_entries').upsert(entryData);
      if (error) throw error;
      closeAndClearModal();
      await fetchWeekEntries(currentUserProfile);
    } catch (error: any) { alert(`Error al guardar: ${error.message}`); } finally { setActionLoading(false); }
  };

  const handleDeleteEntry = () => {
    if (!editingEntry) return;
    const idToDelete = editingEntry.id;
    setConfirmDialog({
        isOpen: true,
        title: '¿ELIMINAR REGISTRO?',
        message: 'Esta acción eliminará permanentemente este registro del Time Billing.',
        onConfirm: async () => {
            setActionLoading(true);
            try {
                const { error } = await supabase.from('time_entries').delete().eq('id', idToDelete);
                if (error) throw error;
                closeAndClearModal();
                await fetchWeekEntries(currentUserProfile);
            } catch (error: any) { alert(`Error: ${error.message}`); } finally { setActionLoading(false); }
        }
    });
  };

  const handleDragStart = (e: React.DragEvent, entry: TimeEntry) => {
      if (isLimitedAccess) {
          e.preventDefault();
          return;
      }
      e.dataTransfer.setData('text/plain', entry.id.toString());
      setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
      setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isLimitedAccess) return;

    const entryId = e.dataTransfer.getData('text/plain');
    if (!entryId) return;

    setTimeEntries(prev => prev.map(entry => entry.id === entryId ? { ...entry, fecha_tarea: date, hora_inicio: `${String(hour).padStart(2, '0')}:00:00` } : entry));
    try {
      const { error } = await supabase.from('time_entries').update({ fecha_tarea: date, hora_inicio: `${String(hour).padStart(2, '0')}:00:00` }).eq('id', entryId);
      if (error) throw error;
      await fetchWeekEntries(currentUserProfile);
    } catch (err: unknown) {
      if (err instanceof Error) alert(`Error al mover: ${err.message}`);
      fetchWeekEntries(currentUserProfile);
    }
  };

  const getTimeBillingBadge = (hours: number) => {
    if (hours >= 1.5) return { label: '100%', color: 'bg-green-600' };
    if (hours >= 1.0) return { label: '75%', color: 'bg-yellow-500 text-black' };
    if (hours >= 0.75) return { label: '50%', color: 'bg-orange-500 text-black' };
    return { label: '25%', color: 'bg-red-500' };
  };

  const selectedCaseObj = cases.find(c => c.id === selectedCaseId);
  const presetRateMatch = selectedCaseObj?.descripcion.match(/Precio:\s*\$([\d.]+)/);
  const suggestedRate = presetRateMatch ? parseFloat(presetRateMatch[1]) : null;
  const presetTimeMatch = selectedCaseObj?.descripcion.match(/Tiempo estimado:\s*([\d.]+)h/);
  const suggestedTime = presetTimeMatch ? parseFloat(presetTimeMatch[1]) : null;

  const filteredCases = cases.filter(c => c.cliente_id === selectedClientId && (c.estado !== 'cerrado' || c.id === selectedCaseId));
  const weekDays = Array.from({ length: 7 }).map((_, i) => { const day = getStartOfWeek(currentDate); day.setDate(day.getDate() + i); return day; });
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <Fragment>
      <style>{` ::-webkit-scrollbar { width: 0px !important; display: none !important; } * { -ms-overflow-style: none !important; scrollbar-width: none !important; } `}</style>

      <div className="bg-black w-full animate-in fade-in duration-500 text-white p-4 font-mono">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Time Billing Semanal</h1>
                {isLimitedAccess && <p className="text-yellow-500 text-[10px] tracking-widest uppercase mt-1">MODO ACCESO LIMITADO</p>}
            </div>
            {onCancel && <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em]">Volver</button>}
        </header>

        <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={() => changeWeek('prev')} className="text-zinc-400 hover:text-white transition-colors font-bold text-sm">‹ Anterior</button>
            <h2 className="text-lg font-bold text-white tracking-wider">{weekDays.length > 0 && `${weekDays[0].toLocaleDateString('es-ES')} - ${weekDays[6].toLocaleDateString('es-ES')}`}</h2>
            <button onClick={() => changeWeek('next')} className="text-zinc-400 hover:text-white transition-colors font-bold text-sm">Siguiente ›</button>
        </div>

        <div className="grid grid-cols-[auto_1fr] gap-0 border-t border-l border-zinc-800 bg-black">
          <div className="grid grid-rows-[auto_1fr]">
            <div className="p-2 border-r border-b border-zinc-800 h-16"></div>
            <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
              {hours.map(hour => <div key={hour} className="text-xs text-zinc-500 text-center p-2 border-r border-b border-zinc-800 flex items-center justify-center font-bold">{String(hour).padStart(2, '0')}:00</div>)}
            </div>
          </div>

          <div className="grid grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const dayStr = toYYYYMMDD(day);
              const dayEntries = timeEntries.filter(entry => entry.fecha_tarea === dayStr);
              const layout = calculateLayout(dayEntries);

              return (
              <div key={dayIndex} className="border-r border-zinc-800 relative">
                <div className="text-center p-2 border-b border-zinc-800 h-16 flex flex-col justify-center">
                  <div className="text-xs uppercase text-zinc-500 font-bold">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold text-white">{day.getDate()}</div>
                </div>
                
                <div className="relative w-full h-full" onDragOver={(e) => { if(!isLimitedAccess) e.preventDefault(); }}>
                  <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
                    {hours.map((hour, hourIndex) => (
                      <div key={hourIndex} className="h-[60px] border-b border-zinc-800 hover:bg-zinc-900/50 cursor-pointer transition-colors" 
                           onClick={() => openNewEntryModal(dayStr, hour)}
                           onDrop={(e) => handleDrop(e, dayStr, hour)}
                           onDragOver={(e) => { if(!isLimitedAccess) e.preventDefault(); }}>
                      </div>
                    ))}
                  </div>

                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {dayEntries.map(entry => {
                        const entryHour = parseInt(entry.hora_inicio.split(':')[0]);
                        const top = (entryHour - 6) * 60;
                        const height = entry.horas * 60;
                        const { width, left } = layout[entry.id];
                        
                        // Utilizamos la nueva ruta segura para evitar errores de null
                        const profileColor = (entry as any).perfil?.color_perfil || '#3b82f6';
                        const caseTitle = (entry as any).caso?.titulo || 'Caso Desconocido';

                        return (
                          <div key={entry.id} 
                               draggable={!isLimitedAccess}
                               onDragStart={(e) => handleDragStart(e, entry)}
                               onDragEnd={handleDragEnd}
                               className={`absolute p-2 bg-black/60 backdrop-blur-md border border-white/10 shadow-xl ${!isLimitedAccess ? 'cursor-move' : 'cursor-pointer'} z-10 hover:bg-black/80 transition-colors overflow-hidden flex flex-col justify-start group ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'} rounded-lg`} 
                               style={{ top: `${top}px`, height: `${height}px`, left: `calc(${left} + 2px)`, width: `calc(${width} - 4px)`, borderLeft: `4px solid ${profileColor}` }} 
                               onClick={(e) => { e.stopPropagation(); openEditEntryModal(entry); }}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-bold text-white text-[10px] uppercase tracking-wider truncate" style={{ color: profileColor }}>{caseTitle}</p>
                              <span className={`text-[8px] px-2 py-1 rounded-full font-black ${getTimeBillingBadge(entry.horas).color}`}>
                                {getTimeBillingBadge(entry.horas).label}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-[9px] leading-tight line-clamp-2">{entry.descripcion_tarea}</p>
                            {entry.estado === 'cobrado' && <span className="mt-1 text-[8px] text-green-400 font-black tracking-widest uppercase">COBRADO</span>}
                          </div>
                        )
                      })}
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen && !!selectedSlot && !confirmSubmitModal} onClose={closeAndClearModal}>
        <form onSubmit={attemptSaveEntry} className="p-8 overflow-y-auto max-h-[85vh]">
            <h2 className="text-xl font-bold text-white mb-8 italic tracking-widest">{editingEntry ? (isEditingExistingAndLimited ? 'VER' : 'EDITAR') : 'REGISTRAR'} TAREA</h2>
            {isEditingExistingAndLimited && (
                <div className="mb-6 p-4 border border-yellow-900/50 bg-yellow-950/20 text-yellow-500 text-xs font-bold uppercase tracking-widest rounded-xl text-center">
                    Modo Vista: Tarea guardada. No tienes permisos para editar.
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InputField label="Fecha" type="date" value={selectedSlot?.date || ''} readOnly disabled={isEditingExistingAndLimited} />
                <div>
                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Trabajador</label>
                    <div className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white opacity-70">
                        {editingEntry ? `${(editingEntry as any).perfil?.primer_nombre} ${(editingEntry as any).perfil?.primer_apellido}` : `${currentUserProfile?.primer_nombre} ${currentUserProfile?.primer_apellido}`}
                    </div>
                </div>
                
                <CustomSelect 
                    label="Cliente" 
                    value={selectedClientId} 
                    onChange={(val: string) => { setSelectedClientId(val); setSelectedCaseId(''); }} 
                    options={clientProfiles.map(c => ({ id: c.id, label: `${c.primer_nombre || ''} ${c.primer_apellido || ''}`.trim() }))} 
                    disabled={isEditingExistingAndLimited} 
                />

                <CustomSelect 
                    label="Caso" 
                    value={selectedCaseId} 
                    onChange={(val: string) => setSelectedCaseId(val)} 
                    options={filteredCases.map(c => ({ id: c.id, label: c.titulo }))} 
                    disabled={!selectedClientId || isEditingExistingAndLimited} 
                />
                
                <div className="md:col-span-2">
                    <InputField label="Descripción Tarea" value={taskDescription} onChange={(e: any) => setTaskDescription(e.target.value)} required disabled={isEditingExistingAndLimited} />
                </div>

                <div>
                  <NumberControl label="Tiempo Invertido" value={hoursWorked} step={0.25} min={0.1} onChange={setHoursWorked} isTime={true} disabled={isEditingExistingAndLimited} />
                  {suggestedTime !== null && !isEditingExistingAndLimited && (
                      <div className="text-[10px] text-blue-400 mt-2 cursor-pointer hover:text-blue-300 font-bold bg-blue-900/20 p-2 rounded border border-blue-900/50" onClick={() => setHoursWorked(suggestedTime)}>
                          Sugerencia del caso: {suggestedTime} hrs (Click para aplicar)
                      </div>
                  )}
                </div>
                
                <div>
                  <NumberControl label="Tarifa a Cobrar" value={rate} step={0.25} min={0} onChange={setRate} prefix="$" isMoney={true} disabled={isEditingExistingAndLimited} />
                  {suggestedRate !== null && !isEditingExistingAndLimited && (
                      <div className="text-[10px] text-green-400 mt-2 cursor-pointer hover:text-green-300 font-bold bg-green-900/20 p-2 rounded border border-green-900/50" onClick={() => setRate(suggestedRate)}>
                          Sugerencia del caso: ${suggestedRate.toFixed(2)} (Click para aplicar)
                      </div>
                  )}
                </div>

                <div className="md:col-span-2 mt-4 pt-4 border-t border-white/5">
                    <label className="block text-zinc-500 text-[10px] font-black mb-3 uppercase tracking-[0.3em]">Estado de Pago</label>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setPagoStatus('cobrado')} disabled={isEditingExistingAndLimited} className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${pagoStatus === 'cobrado' ? 'bg-green-600/80 text-white shadow-lg border border-green-500' : 'bg-black/40 text-zinc-500 hover:bg-white/10 border border-zinc-800'}`}>
                            Cobrado
                        </button>
                        <button type="button" onClick={() => setPagoStatus('por_cobrar')} disabled={isEditingExistingAndLimited} className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed ${pagoStatus === 'por_cobrar' ? 'bg-yellow-600/80 text-white shadow-lg border border-yellow-500' : 'bg-black/40 text-zinc-500 hover:bg-white/10 border border-zinc-800'}`}>
                            Por Cobrar
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-white/10 mt-10 pt-6 bg-transparent">
                <div>
                    {editingEntry && !isEditingExistingAndLimited && (
                        <button type="button" onClick={handleDeleteEntry} className="text-zinc-400 hover:text-red-400 hover:bg-red-900/30 p-3 transition-colors rounded-full" title="Eliminar Registro">
                            <TrashIcon />
                        </button>
                    )}
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={closeAndClearModal} className="font-bold py-2 px-6 text-zinc-400 hover:text-white transition-colors uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/5 rounded-xl">
                        {isEditingExistingAndLimited ? 'Cerrar' : 'Cancelar'}
                    </button>
                    {!isEditingExistingAndLimited && (
                        <button type="submit" disabled={actionLoading} className="bg-blue-600/80 hover:bg-blue-500 backdrop-blur-md shadow-lg text-white font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50 rounded-xl flex items-center gap-2">
                            {actionLoading ? '...' : (editingEntry ? 'GUARDAR CAMBIOS' : 'REGISTRAR TAREA')}
                        </button>
                    )}
                </div>
            </div>
        </form>
      </Modal>

      {/* TARJETA DE CONFIRMACIÓN PARA USUARIOS LIMITADOS ANTES DE GUARDAR */}
      <Modal isOpen={confirmSubmitModal} onClose={() => setConfirmSubmitModal(false)}>
          <div className="p-10 text-center flex flex-col items-center">
              <AlertIcon />
              <h2 className="text-2xl font-black text-white mb-2 italic tracking-widest uppercase">Confirmar Registro</h2>
              <p className="text-yellow-500 font-bold mb-6 uppercase tracking-widest text-xs">Esta información NO será editable después de guardar.</p>
              
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 w-full text-left mb-8 space-y-4">
                  <div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Tarea / Descripción</p>
                      <p className="text-white text-sm">{taskDescription}</p>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-4">
                      <div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Tiempo</p>
                          <p className="text-white font-mono">{hoursWorked} hrs</p>
                      </div>
                      <div className="text-right">
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Tarifa</p>
                          <p className="text-green-400 font-mono font-bold">${rate.toFixed(2)}</p>
                      </div>
                  </div>
              </div>

              <div className="flex justify-center gap-6 w-full">
                  <button onClick={() => setConfirmSubmitModal(false)} className="flex-1 py-4 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors uppercase font-black tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2">
                      <PencilIcon /> Volver y Editar
                  </button>
                  <button onClick={executeSaveEntry} disabled={actionLoading} className="flex-1 bg-green-600/80 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.3)] text-white font-black py-4 hover:bg-green-500 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50 rounded-xl flex items-center justify-center gap-2">
                      {actionLoading ? '...' : <><CheckIcon /> Confirmar y Guardar</>}
                  </button>
              </div>
          </div>
      </Modal>

      <Modal isOpen={confirmDialog.isOpen} onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}>
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold text-white mb-4 italic tracking-widest uppercase">{confirmDialog.title}</h2>
              <p className="text-zinc-400 mb-8">{confirmDialog.message}</p>
              <div className="flex justify-center gap-4">
                  <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest border border-white/10 rounded-xl hover:bg-white/5">Cancelar</button>
                  <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} disabled={actionLoading} className="bg-red-600/80 backdrop-blur-md shadow-lg text-white font-bold py-2 px-6 hover:bg-red-500 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50 rounded-xl">Confirmar</button>
              </div>
          </div>
      </Modal>
    </Fragment>
  );
};

export default TimeBillingView;