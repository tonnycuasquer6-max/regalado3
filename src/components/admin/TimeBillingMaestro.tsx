import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Case, TimeEntry, Profile } from '../../types';
import { TrashIcon } from '../shared/Icons';

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

const InputField = ({ label, type = 'text', ...props }: any) => (
    <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <input type={type} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" {...props} />
    </div>
);

const SelectField = ({ label, options, ...props }: any) => (
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

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">{children}</div></div>;
};

// SOLUCIÓN PUNTO 5: Algoritmo para calcular la cascada horizontal de tareas superpuestas
const calculateLayout = (entries: any[]) => {
    const events = entries.map(e => {
        const h = parseInt(e.hora_inicio.split(':')[0] || '0');
        const m = parseInt(e.hora_inicio.split(':')[1] || '0') / 60;
        return { ...e, start: h + m, end: h + m + e.horas };
    }).sort((a, b) => a.start - b.start);

    let layout: any = {};
    let columns: any[][] = [];
    let lastEventEnding: number | null = null;

    const packEvents = () => {
        const numCols = columns.length;
        columns.forEach((col, colIdx) => {
            col.forEach(ev => {
                layout[ev.id] = { width: `${100 / numCols}%`, left: `${(100 / numCols) * colIdx}%` };
            });
        });
    };

    events.forEach(ev => {
        if (lastEventEnding !== null && ev.start >= lastEventEnding) {
            packEvents();
            columns = [];
            lastEventEnding = null;
        }
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
            if (columns[i][columns[i].length - 1].end <= ev.start) {
                columns[i].push(ev);
                placed = true;
                break;
            }
        }
        if (!placed) columns.push([ev]);
        if (lastEventEnding === null || ev.end > lastEventEnding) {
            lastEventEnding = ev.end;
        }
    });
    if (columns.length > 0) packEvents();
    return layout;
};

const TimeBillingMaestro: React.FC<{ onCancel?: () => void }> = ({ onCancel }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [clientProfiles, setClientProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);
  const [editingEntry, setEditingEntry] = useState<any | null>(null);
  
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursWorked, setHoursWorked] = useState<number>(1);
  const [rate, setRate] = useState<number>(0);

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUserProfile(profile);

      const { data: clients } = await supabase.from('profiles').select('*').eq('rol', 'cliente');
      setClientProfiles(clients || []);

      const { data: allCases } = await supabase.from('cases').select('*');
      setCases(allCases || []);
      
      return profile;
    } catch (err) { return null; } finally { setLoading(false); }
  }, []);

  const fetchWeekEntries = useCallback(async (profile: any) => {
    if (!profile) return;
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    let query = supabase.from('time_entries').select('*, profiles(primer_nombre, primer_apellido, rol, color_perfil), cases(titulo, cliente_id)').gte('fecha_tarea', toYYYYMMDD(startOfWeek)).lte('fecha_tarea', toYYYYMMDD(endOfWeek));
    
    if (profile.rol !== 'admin') {
        query = query.eq('perfil_id', profile.id);
    }

    const { data } = await query;
    setTimeEntries(data || []);
  }, [currentDate]);

  useEffect(() => {
    fetchInitialData().then((profile) => {
        if (profile) fetchWeekEntries(profile);
    });
  }, [fetchInitialData, fetchWeekEntries]);

  const changeWeek = (direction: 'prev' | 'next') => {
      setCurrentDate(prev => {
          const newDate = new Date(prev);
          newDate.setDate(prev.getDate() + (direction === 'prev' ? -7 : 7));
          return newDate;
      });
  };

  const openNewEntryModal = (date: string, hour: number) => {
    setEditingEntry(null);
    setSelectedSlot({ date, hour });
    setSelectedClientId('');
    setSelectedCaseId('');
    setTaskDescription('');
    setHoursWorked(1);
    setRate(0);
    setIsModalOpen(true);
  };

  const openEditEntryModal = (entry: any) => {
    setEditingEntry(entry);
    setSelectedSlot({ date: entry.fecha_tarea, hour: parseInt(entry.hora_inicio.split(':')[0]) });
    setSelectedClientId(entry.cases?.cliente_id || '');
    setSelectedCaseId(entry.caso_id);
    setTaskDescription(entry.descripcion_tarea);
    setHoursWorked(entry.horas);
    setRate(entry.tarifa_personalizada || 0);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedCaseId || !taskDescription || hoursWorked <= 0 || !currentUserProfile) return;

    setActionLoading(true);
    const finalPerfilId = editingEntry ? editingEntry.perfil_id : currentUserProfile.id;

    const entryData = {
      id: editingEntry?.id,
      perfil_id: finalPerfilId, 
      caso_id: selectedCaseId,
      descripcion_tarea: taskDescription,
      fecha_tarea: selectedSlot.date,
      hora_inicio: `${String(selectedSlot.hour).padStart(2, '0')}:00:00`,
      horas: hoursWorked,
      tarifa_personalizada: rate > 0 ? rate : null,
      estado: 'pending',
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

  const filteredCases = cases.filter(c => c.cliente_id === selectedClientId);
  const weekDays = Array.from({ length: 7 }).map((_, i) => { const day = getStartOfWeek(currentDate); day.setDate(day.getDate() + i); return day; });
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <Fragment>
      <div className="bg-black w-full animate-in fade-in duration-500 text-white p-4 font-mono">
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
            <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Time Billing Semanal</h1>
            {onCancel && <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em]">Volver</button>}
        </header>

        <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={() => changeWeek('prev')} className="text-zinc-400 hover:text-white transition-colors font-bold text-sm">‹ Semana Anterior</button>
            <h2 className="text-lg font-bold text-white tracking-wider">{weekDays.length > 0 && `${weekDays[0].toLocaleDateString('es-ES')} - ${weekDays[6].toLocaleDateString('es-ES')}`}</h2>
            <button onClick={() => changeWeek('next')} className="text-zinc-400 hover:text-white transition-colors font-bold text-sm">Semana Siguiente ›</button>
        </div>

        {loading && <p className="text-center text-zinc-500 mb-4">Cargando actividades...</p>}

        <div className="grid grid-cols-[auto_1fr] gap-0 border-t border-l border-zinc-800 bg-black">
          <div className="grid grid-rows-[auto_1fr]">
            <div className="p-2 border-r border-b border-zinc-800 h-16"></div>
            <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
              {hours.map(hour => (
                <div key={hour} className="text-xs text-zinc-500 text-center p-2 border-r border-b border-zinc-800 flex items-center justify-center font-bold">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const dayStr = toYYYYMMDD(day);
              const dayEntries = timeEntries.filter(entry => entry.fecha_tarea === dayStr);
              // Lógica de cálculo de superposición (Cascada)
              const layout = calculateLayout(dayEntries);

              return (
              <div key={dayIndex} className="border-r border-zinc-800">
                <div className="text-center p-2 border-b border-zinc-800 h-16 flex flex-col justify-center">
                  <div className="text-xs uppercase text-zinc-500 font-bold">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                  <div className="text-lg font-bold text-white">{day.getDate()}</div>
                </div>
                
                <div className="relative">
                  <div className="grid" style={{ gridTemplateRows: `repeat(${hours.length}, minmax(60px, auto))` }}>
                    {hours.map((hour, hourIndex) => (
                      <div key={hourIndex} className="h-[60px] border-b border-zinc-800 hover:bg-zinc-900/50 cursor-pointer transition-colors" onClick={() => openNewEntryModal(dayStr, hour)}></div>
                    ))}
                  </div>

                  {/* SOLUCIÓN PUNTO 4: Diseño Transparente y Color Unico */}
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {dayEntries.map(entry => {
                        const entryHour = parseInt(entry.hora_inicio.split(':')[0]);
                        const top = (entryHour - 6) * 60;
                        const height = entry.horas * 60;
                        const { width, left } = layout[entry.id];
                        
                        // Color Dinámico: Blanco si es admin, el de su perfil, o azul por defecto.
                        const profileColor = entry.profiles?.color_perfil || (entry.profiles?.rol === 'admin' ? '#ffffff' : '#3b82f6');

                        return (
                          <div key={entry.id} 
                               className="absolute p-2 bg-black/60 backdrop-blur-md border border-zinc-800 shadow-xl z-10 pointer-events-auto hover:bg-zinc-900 transition-colors overflow-hidden flex flex-col justify-start group" 
                               style={{ 
                                   top: `${top}px`, 
                                   height: `${height}px`, 
                                   left: `calc(${left} + 2px)`, 
                                   width: `calc(${width} - 4px)`, 
                                   borderLeft: `4px solid ${profileColor}` // Franja Izquierda
                               }} 
                               onClick={(e) => { e.stopPropagation(); openEditEntryModal(entry); }}>
                            
                            <p className="font-bold text-white text-[10px] uppercase tracking-wider truncate mb-1" style={{ color: profileColor }}>{entry.cases?.titulo}</p>
                            <p className="text-zinc-300 text-[9px] leading-tight line-clamp-2">{entry.descripcion_tarea}</p>
                            <p className="text-zinc-500 text-[8px] uppercase tracking-widest mt-auto pt-1 truncate opacity-50 group-hover:opacity-100">{entry.profiles?.primer_nombre}</p>
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

      {/* MODAL DE EDICIÓN (No cambia) */}
      <Modal isOpen={isModalOpen && !!selectedSlot} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSaveEntry}>
            <div className="p-8">
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
                        <InputField label="Descripción Tarea" value={taskDescription} onChange={(e: any) => setTaskDescription(e.target.value)} required />
                    </div>
                    <InputField label="Horas" type="number" step="0.25" min="0.25" value={hoursWorked} onChange={(e: any) => setHoursWorked(parseFloat(e.target.value) || 0)} required />
                    <InputField label="Tarifa ($/hr)" type="number" step="1" min="0" value={rate} onChange={(e: any) => setRate(parseFloat(e.target.value) || 0)} />
                </div>
            </div>
            <div className="p-4 bg-zinc-900/50 flex justify-between items-center border-t border-zinc-800">
                <div>
                    {editingEntry && (
                        <button type="button" onClick={handleDeleteEntry} className="text-zinc-600 hover:text-red-500 hover:bg-red-950/30 p-3 transition-colors rounded-full" title="Eliminar Registro">
                            <TrashIcon />
                        </button>
                    )}
                </div>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="font-bold py-2 px-6 text-zinc-400 hover:text-white transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button type="submit" disabled={actionLoading} className="bg-white text-black hover:bg-zinc-200 font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">
                        {actionLoading ? '...' : (editingEntry ? 'GUARDAR CAMBIOS' : 'REGISTRAR')}
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
                  <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest">Cancelar</button>
                  <button onClick={() => { confirmDialog.onConfirm(); setConfirmDialog({ ...confirmDialog, isOpen: false }); }} disabled={actionLoading} className="bg-red-900 text-white font-bold py-2 px-6 hover:bg-red-800 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Confirmar</button>
              </div>
          </div>
      </Modal>
    </Fragment>
  );
};

export default TimeBillingMaestro;