import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Case, TimeEntry, Profile } from '../../types';

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

const InputField: React.FC<any> = ({ label, type = 'text', ...props }) => (
    <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <input type={type} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" {...props} />
    </div>
);

const SelectField: React.FC<any> = ({ label, options, ...props }) => (
     <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <select className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors disabled:opacity-50" {...props}>
            <option value="" className="bg-black">Seleccionar...</option>
            {options.map((opt: any) => (
                <option key={opt.id} value={opt.id} className="bg-black">{opt.titulo || `${opt.primer_nombre || ''} ${opt.primer_apellido || ''}`.trim()}</option>
            ))}
        </select>
    </div>
);

const NumberControl: React.FC<any> = ({ label, value, step, min, onChange, isTime = false, isMoney = false, prefix = '' }) => {
    const handleDecrease = () => { let newVal = value - step; if (newVal < min) newVal = min; onChange(Math.round(newVal * 10000) / 10000); };
    const handleIncrease = () => { let newVal = value + step; onChange(Math.round(newVal * 10000) / 10000); };
    const formatTime = (decimalHours: number) => { const totalMinutes = Math.round(decimalHours * 60); const h = Math.floor(totalMinutes / 60); const m = totalMinutes % 60; return `${h}h ${m}m`; };

    const textColor = isMoney ? 'text-green-400' : 'text-white';
    const borderColor = isMoney ? 'border-green-900/50 focus-within:border-green-500' : 'border-zinc-800 focus-within:border-zinc-500';

    return (
        <div>
            <label className={`block text-[10px] font-black mb-2 uppercase tracking-[0.3em] ${isMoney ? 'text-green-700' : 'text-zinc-500'}`}>{label}</label>
            <div className={`flex items-center bg-transparent border-b-2 transition-colors group pb-1 ${borderColor}`}>
                <div className={`flex-grow flex justify-start items-center font-mono text-xl ${textColor}`}>
                    {prefix && <span className="mr-1 opacity-70">{prefix}</span>}
                    <input type="number" value={value === 0 ? '' : value} onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : 0)} className="w-full bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" step="any" min={min} />
                </div>
                <div className="flex flex-col ml-2 justify-center">
                    <button type="button" onClick={handleIncrease} className={`hover:text-white transition-colors flex items-center justify-center p-0.5 ${isMoney ? 'text-green-700 hover:text-green-400' : 'text-zinc-600'}`}><ChevronUpIcon /></button>
                    <button type="button" onClick={handleDecrease} className={`hover:text-white transition-colors flex items-center justify-center p-0.5 mt-0.5 ${isMoney ? 'text-green-700 hover:text-green-400' : 'text-zinc-600'}`}><ChevronDownIcon /></button>
                </div>
            </div>
            {isTime && ( <div className="text-xs text-zinc-500 font-mono mt-3 text-left uppercase tracking-widest">equivale a: <span className="text-zinc-300 font-bold ml-1">{formatTime(value)}</span></div> )}
        </div>
    );
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-2xl">
          {children}
        </div>
      </div>
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
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursWorked, setHoursWorked] = useState<number>(1);
  const [rate, setRate] = useState<number>(0);
  const [billingMode, setBillingMode] = useState<'descripcion' | 'costos_fijos'>('descripcion');
  const [fixedCostOption, setFixedCostOption] = useState<number | null>(null);
  const [fixedCostSearch, setFixedCostSearch] = useState('');
  const fixedCostOptions = Array.from({ length: 50 }, (_, i) => i + 1);
  
  const [pagoStatus, setPagoStatus] = useState<'cobrado' | 'por_cobrar'>('por_cobrar');

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setCurrentUserProfile(profile);

      const { data: clients } = await supabase.from('profiles').select('*').eq('rol', 'cliente');
      setClientProfiles(clients || []);

      const { data: allCases } = await supabase.from('cases').select('*');
      setCases(allCases || []);
      
      return profile;
    } catch (err) { return null; } finally { setLoading(false); }
  }, [session.user.id]);

  const fetchWeekEntries = useCallback(async (profile: Profile | null) => {
    if (!profile) return;
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const { data } = await supabase.from('time_entries')
        .select('*, profiles(primer_nombre, primer_apellido, rol, color_perfil), cases(titulo, cliente_id)')
        .eq('perfil_id', profile.id)
        .gte('fecha_tarea', toYYYYMMDD(startOfWeek))
        .lte('fecha_tarea', toYYYYMMDD(endOfWeek));
        
    setTimeEntries(data || []);
  }, [currentDate]);

  useEffect(() => { fetchInitialData().then((profile) => { if (profile) fetchWeekEntries(profile); }); }, [fetchInitialData, fetchWeekEntries]);

  const changeWeek = (direction: 'prev' | 'next') => { setCurrentDate(prev => { const newDate = new Date(prev); newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7)); return newDate; }); };

  const openNewEntryModal = (date: string, hour: number) => {
    setEditingEntry(null); setSelectedSlot({ date, hour }); setSelectedClientId(''); setSelectedCaseId(''); setTaskDescription(''); setHoursWorked(1); setRate(0); setPagoStatus('por_cobrar'); setIsModalOpen(true);
    setBillingMode('descripcion'); setFixedCostOption(null); setFixedCostSearch('');
  };

  const openEditEntryModal = (entry: any) => {
    setEditingEntry(entry); setSelectedSlot({ date: entry.fecha_tarea, hour: parseInt(entry.hora_inicio.split(':')[0]) }); setSelectedClientId(entry.cases?.cliente_id || ''); setSelectedCaseId(entry.caso_id); setTaskDescription(entry.descripcion_tarea); setHoursWorked(entry.horas); setRate(entry.tarifa_personalizada || 0); setPagoStatus(entry.estado || 'por_cobrar'); setIsModalOpen(true);
    setBillingMode('descripcion'); setFixedCostOption(null); setFixedCostSearch('');
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDescription = billingMode === 'costos_fijos' ? `Costo fijo #${fixedCostOption || '1'}` : taskDescription;

    if (!selectedSlot || !selectedCaseId || !finalDescription || hoursWorked <= 0 || !currentUserProfile) return;
    setActionLoading(true);
    
    const entryData = {
      id: editingEntry?.id,
      perfil_id: currentUserProfile.id,
      caso_id: selectedCaseId,
      descripcion_tarea: finalDescription,
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
      setIsModalOpen(false);
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
                setIsModalOpen(false);
                setEditingEntry(null);
                await fetchWeekEntries(currentUserProfile);
            } catch (error: any) { alert(`Error: ${error.message}`); } finally { setActionLoading(false); }
        }
    });
  };

  // --- LÓGICA DE DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, entry: TimeEntry) => {
      e.dataTransfer.setData('text/plain', entry.id.toString());
      setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
      setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, date: string, hour: number) => {
    e.preventDefault();
    setIsDragging(false);
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

  // --- SUGERENCIAS ---
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
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Time Billing Semanal</h1>
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
                
                <div className="relative w-full h-full" onDragOver={(e) => e.preventDefault()}>
                  <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
                    {hours.map((hour, hourIndex) => (
                      <div key={hourIndex} className="h-[60px] border-b border-zinc-800 hover:bg-zinc-900/50 cursor-pointer transition-colors" 
                           onClick={() => openNewEntryModal(dayStr, hour)}
                           onDrop={(e) => handleDrop(e, dayStr, hour)}
                           onDragOver={(e) => e.preventDefault()}>
                      </div>
                    ))}
                  </div>

                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {dayEntries.map(entry => {
                        const entryHour = parseInt(entry.hora_inicio.split(':')[0]);
                        const top = (entryHour - 6) * 60;
                        const height = entry.horas * 60;
                        const { width, left } = layout[entry.id];
                        const profileColor = entry.profiles?.color_perfil || '#3b82f6';

                        return (
                          <div key={entry.id} 
                               draggable={true}
                               onDragStart={(e) => handleDragStart(e, entry)}
                               onDragEnd={handleDragEnd}
                               className={`absolute p-2 bg-black/60 backdrop-blur-md border border-white/10 shadow-xl cursor-move z-10 hover:bg-black/80 transition-colors overflow-hidden flex flex-col justify-start group ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'} rounded-lg`} 
                               style={{ top: `${top}px`, height: `${height}px`, left: `calc(${left} + 2px)`, width: `calc(${width} - 4px)`, borderLeft: `4px solid ${profileColor}` }} 
                               onClick={(e) => { e.stopPropagation(); openEditEntryModal(entry); }}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-bold text-white text-[10px] uppercase tracking-wider truncate" style={{ color: profileColor }}>{entry.cases?.titulo}</p>
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

      <Modal isOpen={isModalOpen && !!selectedSlot} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSaveEntry} className="p-8 overflow-y-auto max-h-[85vh]">
            <h2 className="text-xl font-bold text-white mb-8 italic tracking-widest">{editingEntry ? 'EDITAR' : 'REGISTRAR'} TAREA</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <InputField label="Fecha" type="date" value={selectedSlot?.date || ''} readOnly />
                <div>
                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Trabajador</label>
                    <div className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white opacity-70">
                        {editingEntry ? `${editingEntry.profiles?.primer_nombre} ${editingEntry.profiles?.primer_apellido}` : `${currentUserProfile?.primer_nombre} ${currentUserProfile?.primer_apellido}`}
                    </div>
                </div>
                
                <SelectField label="Cliente" value={selectedClientId} onChange={(e: any) => setSelectedClientId(e.target.value)} options={clientProfiles} required />
                <SelectField label="Caso" value={selectedCaseId} onChange={(e: any) => setSelectedCaseId(e.target.value)} options={filteredCases} disabled={!selectedClientId} required />
                
                <div className="md:col-span-2">
                    <div className="mb-4 p-3 border border-white/10 rounded-xl bg-black/40 backdrop-blur-md text-xs text-zinc-400">
                      Ejemplo de presupuesto express: 50 x 2 (10.000 km) = neto $4,500.
                      <button type="button" onClick={() => {
                        setBillingMode('costos_fijos');
                        setFixedCostOption(50);
                        setHoursWorked(2);
                        setRate(2250);
                        setTaskDescription('Tiempo extra por kilometraje 10.000');
                      }} className="ml-2 text-blue-400 hover:text-blue-300">usar ejemplo</button>
                    </div>
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => setBillingMode('descripcion')} className={`px-4 py-2 rounded-xl transition-all ${billingMode === 'descripcion' ? 'bg-blue-600/80 backdrop-blur-md text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                        DESCRIPCIÓN
                      </button>
                      <button type="button" onClick={() => setBillingMode('costos_fijos')} className={`px-4 py-2 rounded-xl transition-all ${billingMode === 'costos_fijos' ? 'bg-blue-600/80 backdrop-blur-md text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                        COSTOS FIJOS
                      </button>
                    </div>

                    {billingMode === 'costos_fijos' ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={fixedCostSearch}
                          onChange={(e) => setFixedCostSearch(e.target.value)}
                          placeholder="Buscar costo fijo..."
                          className="w-full bg-transparent border-b-2 border-zinc-800 text-white py-2 px-1 focus:outline-none focus:border-zinc-500 transition-colors"
                        />
                        <select
                          value={fixedCostOption || ''}
                          onChange={(e) => {
                            const selected = Number(e.target.value);
                            const baseHours = 0.5 + selected * 0.1;
                            const baseRate = 30 + selected * 1.5;
                            setFixedCostOption(selected);
                            setHoursWorked(Math.round(baseHours * 100) / 100);
                            setRate(Math.round((baseRate + (Math.random() * 20 - 10)) * 100) / 100);
                            setTaskDescription(`Costo fijo #${selected}`);
                          }}
                          className="w-full bg-black/80 border border-white/10 text-white py-3 px-4 rounded-xl focus:outline-none focus:border-white/30 transition-colors shadow-inner"
                          required
                        >
                          <option value="">Selecciona costo fijo...</option>
                          {fixedCostOptions
                            .filter((opt) => opt.toString().includes(fixedCostSearch))
                            .map((opt) => (
                              <option key={opt} value={opt}>Costo fijo {opt}</option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <InputField label="Descripción Tarea" value={taskDescription} onChange={(e: any) => setTaskDescription(e.target.value)} required />
                    )}
                </div>

                <div>
                  <NumberControl label="Tiempo Invertido" value={hoursWorked} step={0.25} min={0.1} onChange={setHoursWorked} isTime={true} />
                  {suggestedTime !== null && (
                      <div className="text-[10px] text-blue-400 mt-2 cursor-pointer hover:text-blue-300 font-bold bg-blue-900/20 p-2 rounded border border-blue-900/50" onClick={() => setHoursWorked(suggestedTime)}>
                          Sugerencia del caso: {suggestedTime} hrs (Click para aplicar)
                      </div>
                  )}
                </div>
                
                <div>
                  <NumberControl label="Tarifa a Cobrar" value={rate} step={0.25} min={0} onChange={setRate} prefix="$" isMoney={true} />
                  {suggestedRate !== null && (
                      <div className="text-[10px] text-green-400 mt-2 cursor-pointer hover:text-green-300 font-bold bg-green-900/20 p-2 rounded border border-green-900/50" onClick={() => setRate(suggestedRate)}>
                          Sugerencia del caso: ${suggestedRate.toFixed(2)} (Click para aplicar)
                      </div>
                  )}
                </div>

                <div className="md:col-span-2 mt-4 pt-4 border-t border-white/5">
                    <label className="block text-zinc-500 text-[10px] font-black mb-3 uppercase tracking-[0.3em]">Estado de Pago</label>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setPagoStatus('cobrado')} className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all ${pagoStatus === 'cobrado' ? 'bg-green-600/80 text-white shadow-lg border border-green-500' : 'bg-black/40 text-zinc-500 hover:bg-white/10 border border-zinc-800'}`}>
                            Cobrado
                        </button>
                        <button type="button" onClick={() => setPagoStatus('por_cobrar')} className={`flex-1 py-3 rounded-xl font-bold text-xs tracking-widest uppercase transition-all ${pagoStatus === 'por_cobrar' ? 'bg-yellow-600/80 text-white shadow-lg border border-yellow-500' : 'bg-black/40 text-zinc-500 hover:bg-white/10 border border-zinc-800'}`}>
                            Por Cobrar
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between items-center border-t border-white/10 mt-10 pt-6 bg-transparent">
                <div>
                    {editingEntry && (
                        <button type="button" onClick={handleDeleteEntry} className="text-zinc-400 hover:text-red-400 hover:bg-red-900/30 p-3 transition-colors rounded-full" title="Eliminar Registro">
                            <TrashIcon />
                        </button>
                    )}
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="font-bold py-2 px-6 text-zinc-400 hover:text-white transition-colors uppercase text-[10px] tracking-widest border border-white/10 hover:bg-white/5 rounded-xl">Cancelar</button>
                    <button type="submit" disabled={actionLoading} className="bg-blue-600/80 hover:bg-blue-500 backdrop-blur-md shadow-lg text-white font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50 rounded-xl">
                        {actionLoading ? '...' : (editingEntry ? 'GUARDAR CAMBIOS' : 'REGISTRAR TAREA')}
                    </button>
                </div>
            </div>
        </form>
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