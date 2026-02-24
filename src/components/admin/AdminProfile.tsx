import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] relative">{children}</div></div>;
};

// Componentes para formulario
const InputField = ({ label, type = 'text', ...props }: any) => (
    <div>
        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">{label}</label>
        <input type={type} className="w-full py-2 px-0 bg-transparent border-b-2 border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert" {...props} />
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

interface AdminProfileProps {
    session: Session;
    onCancel: () => void;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ session, onCancel }) => {
    const [profileData, setProfileData] = useState<any>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [timeEntries, setTimeEntries] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expDesc, setExpDesc] = useState('');
    const [expAmount, setExpAmount] = useState<number>(0);
    const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
    const [expFile, setExpFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // SOLUCIÓN PUNTO 6: Estados para "AÑADIR REGISTRO" (Time Billing)
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [cases, setCases] = useState<any[]>([]);
    const [recClientId, setRecClientId] = useState('');
    const [recCaseId, setRecCaseId] = useState('');
    const [recDesc, setRecDesc] = useState('');
    const [recDate, setRecDate] = useState(new Date().toISOString().split('T')[0]);
    const [recHour, setRecHour] = useState('08:00');
    const [recHours, setRecHours] = useState<number>(1);
    const [recRate, setRecRate] = useState<number>(0);

    const fetchDropdownData = async () => {
        const {data: cl} = await supabase.from('profiles').select('*').eq('rol', 'cliente');
        setClients(cl || []);
        const {data: ca} = await supabase.from('cases').select('*');
        setCases(ca || []);
    };

    const fetchProfileData = useCallback(async () => {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) setProfileData(data);
    }, [session.user.id]);

    const fetchMonthData = useCallback(async () => {
        setLoading(true);
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startStr = startOfMonth.toISOString().split('T')[0];
        const endStr = endOfMonth.toISOString().split('T')[0];

        const { data: times } = await supabase
            .from('time_entries')
            .select('*, cases(titulo)')
            .eq('perfil_id', session.user.id)
            .gte('fecha_tarea', startStr)
            .lte('fecha_tarea', endStr)
            .order('fecha_tarea', { ascending: false });
        setTimeEntries(times || []);

        const { data: exps } = await supabase
            .from('gastos')
            .select('*')
            .eq('perfil_id', session.user.id)
            .gte('fecha', startStr)
            .lte('fecha', endStr)
            .order('fecha', { ascending: false });
        setExpenses(exps || []);

        setLoading(false);
    }, [currentMonth, session.user.id]);

    useEffect(() => { fetchProfileData(); fetchDropdownData(); }, [fetchProfileData]);
    useEffect(() => { fetchMonthData(); }, [fetchMonthData]);

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expDesc || expAmount <= 0) return;
        setActionLoading(true);

        let fileUrl = null;
        if (expFile) {
            const fileName = `${Date.now()}_${expFile.name}`;
            const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, expFile);
            if (!uploadError) {
                const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
                fileUrl = data.publicUrl;
            }
        }

        const { error } = await supabase.from('gastos').insert({
            perfil_id: session.user.id,
            descripcion: expDesc,
            monto: expAmount,
            fecha: expDate,
            comprobante_url: fileUrl
        });

        if (!error) {
            setIsExpenseModalOpen(false);
            setExpDesc(''); setExpAmount(0); setExpFile(null);
            fetchMonthData();
        }
        setActionLoading(false);
    };

    // SOLUCIÓN PUNTO 6: Función para guardar el Registro de Trabajo
    const handleSaveRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recCaseId || !recDesc || recHours <= 0) return;
        setActionLoading(true);

        const { error } = await supabase.from('time_entries').insert({
            perfil_id: session.user.id,
            caso_id: recCaseId,
            descripcion_tarea: recDesc,
            fecha_tarea: recDate,
            hora_inicio: `${recHour}:00`,
            horas: recHours,
            tarifa_personalizada: recRate > 0 ? recRate : null,
            estado: 'pending'
        });

        if (!error) {
            setIsRecordModalOpen(false);
            setRecDesc(''); setRecHours(1); setRecRate(0); setRecClientId(''); setRecCaseId('');
            fetchMonthData();
        } else {
            alert(`Error: ${error.message}`);
        }
        setActionLoading(false);
    };

    const handleDeleteExpense = async (id: string, url: string | null) => {
        if (!confirm("¿Eliminar este gasto?")) return;
        setActionLoading(true);
        if (url) {
            const fileName = url.split('/').pop();
            if (fileName) await supabase.storage.from('comprobantes').remove([fileName]);
        }
        await supabase.from('gastos').delete().eq('id', id);
        fetchMonthData();
        setActionLoading(false);
    };

    const totalHours = timeEntries.reduce((acc, curr) => acc + (curr.horas || 0), 0);
    const totalIncome = timeEntries.reduce((acc, curr) => acc + ((curr.horas || 0) * (curr.tarifa_personalizada || 0)), 0);
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.monto || 0), 0);
    const finalTotal = totalIncome + totalExpenses;
    const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    const filteredCases = cases.filter(c => c.cliente_id === recClientId);

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-mono text-white pb-12">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Mi Perfil</h1>
                <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em]">Volver</button>
            </header>

            {profileData && (
                <div className="bg-zinc-950 border border-zinc-900 p-8 flex flex-col md:flex-row items-center gap-8 mb-8 shadow-2xl shadow-black relative overflow-hidden">
                    <img src={profileData.foto_url || 'https://via.placeholder.com/150'} alt="Perfil" className="w-32 h-32 rounded-full border-4 border-zinc-800 object-cover z-10"/>
                    <div className="text-center md:text-left z-10">
                        <h2 className="text-3xl font-black uppercase tracking-widest">{profileData.primer_nombre} {profileData.primer_apellido}</h2>
                        <p className="text-zinc-500 uppercase tracking-widest mt-1 text-sm">{profileData.rol}</p>
                        <div className="mt-4 flex flex-col gap-1 text-xs text-zinc-400 font-mono">
                            <p>EMAIL: <span className="text-white">{profileData.email}</span></p>
                            <p>CÉDULA: <span className="text-white">{profileData.cedula || 'No registrada'}</span></p>
                            <p>MATRÍCULA: <span className="text-white">{profileData.matricula || 'No registrada'}</span></p>
                        </div>
                    </div>
                </div>
            )}

            {/* BOTONES: AÑADIR GASTO Y AÑADIR REGISTRO */}
            <div className="flex justify-end gap-4 mb-4 animate-in fade-in slide-in-from-right-4 duration-500 delay-200">
                <button onClick={() => setIsExpenseModalOpen(true)} className="bg-white text-black font-bold py-2 px-6 text-[10px] tracking-widest uppercase hover:bg-zinc-300 transition-colors shadow-lg shadow-black/50">
                    + AÑADIR GASTO
                </button>
                <button onClick={() => setIsRecordModalOpen(true)} className="bg-white text-black font-bold py-2 px-6 text-[10px] tracking-widest uppercase hover:bg-zinc-300 transition-colors shadow-lg shadow-black/50">
                    + AÑADIR REGISTRO
                </button>
            </div>

            <div className="bg-black border border-zinc-800 shadow-2xl shadow-black/50 p-8 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-6 mb-6">
                    <button onClick={handlePrevMonth} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronLeftIcon /></button>
                    <h3 className="text-xl font-bold tracking-widest text-zinc-300">{monthName}</h3>
                    <button onClick={handleNextMonth} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronRightIcon /></button>
                </div>

                {loading ? (
                    <p className="text-zinc-500 text-center py-12 animate-pulse uppercase tracking-widest text-xs font-bold">Calculando reporte mensual...</p>
                ) : (
                    <div>
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-6">RESUMEN FINANCIERO</p>
                        <div className="bg-zinc-950 border border-zinc-900 p-6 mb-8">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Horas Trabajadas</p>
                                <p className="text-white font-mono font-bold">{totalHours.toFixed(2)} hrs</p>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Ingresos (Time Billing)</p>
                                <p className="text-white font-mono font-bold">${totalIncome.toFixed(2)}</p>
                            </div>
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Gastos Reembolsables</p>
                                <p className="text-white font-mono font-bold">${totalExpenses.toFixed(2)}</p>
                            </div>
                            <div className="border-t-2 border-dashed border-zinc-800 pt-6 mt-2 flex justify-between items-center">
                                <p className="text-white uppercase tracking-[0.3em] text-sm font-black">TOTAL FINAL</p>
                                <p className="text-green-500 font-black text-3xl tracking-wider">${finalTotal.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4">DETALLE DE GASTOS REEMBOLSABLES</p>
                            {expenses.length === 0 ? (
                                <p className="text-xs text-zinc-600 italic">No has registrado gastos este mes.</p>
                            ) : (
                                <div className={`max-h-60 space-y-2 pr-2 ${scrollbarStyle}`}>
                                    {expenses.map(exp => (
                                        <div key={exp.id} className="flex justify-between items-center p-3 bg-zinc-950/50 border border-zinc-900/50 hover:bg-zinc-900 transition-colors group">
                                            <div>
                                                <p className="text-white text-xs font-bold uppercase">{exp.descripcion}</p>
                                                <p className="text-zinc-500 text-[10px] mt-1 font-mono">{exp.fecha}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {exp.comprobante_url && (
                                                    <a href={exp.comprobante_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-[10px] tracking-widest uppercase flex items-center gap-1">
                                                        <DocumentIcon /> Ver Recibo
                                                    </a>
                                                )}
                                                <p className="text-red-400 font-mono text-sm font-bold">${exp.monto.toFixed(2)}</p>
                                                <button onClick={() => handleDeleteExpense(exp.id, exp.comprobante_url)} disabled={actionLoading} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50">
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL PARA CREAR GASTO */}
            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
                <form onSubmit={handleSaveExpense} className="p-8 flex flex-col">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-white">REGISTRAR GASTO</h2>
                    
                    <div className="space-y-6 mb-8">
                        <div>
                            <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Descripción</label>
                            <input type="text" required value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Monto ($)</label>
                                <input type="number" step="0.01" min="0.01" required value={expAmount || ''} onChange={e => setExpAmount(parseFloat(e.target.value))} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500" />
                            </div>
                            <div>
                                <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Fecha</label>
                                <input type="date" required value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500 [&::-webkit-calendar-picker-indicator]:invert" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Factura (Opcional)</label>
                            <div className="flex items-center gap-4 mt-2">
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={e => setExpFile(e.target.files ? e.target.files[0] : null)} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${expFile ? 'text-green-500 border-green-900' : 'text-zinc-500 hover:text-white'}`}>
                                    <PaperClipIcon />
                                </button>
                                <span className="text-xs text-zinc-400 font-mono truncate">{expFile ? expFile.name : 'Ningún archivo'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 border-t border-zinc-900 pt-6">
                        <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="text-zinc-500 text-[10px] font-bold tracking-widest hover:text-white uppercase transition-colors">CANCELAR</button>
                        <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 text-[10px] tracking-widest uppercase hover:bg-zinc-300 transition-colors disabled:opacity-50">GUARDAR</button>
                    </div>
                </form>
            </Modal>

            {/* MODAL PARA CREAR REGISTRO TIME BILLING */}
            <Modal isOpen={isRecordModalOpen} onClose={() => setIsRecordModalOpen(false)}>
                <form onSubmit={handleSaveRecord} className="p-8">
                    <h2 className="text-xl font-bold text-white mb-8 italic tracking-widest uppercase">REGISTRAR TRABAJO</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <InputField label="Fecha" type="date" value={recDate} onChange={(e: any) => setRecDate(e.target.value)} required />
                        <InputField label="Hora de Inicio" type="time" value={recHour} onChange={(e: any) => setRecHour(e.target.value)} required />
                        
                        <SelectField label="Cliente" value={recClientId} onChange={(e: any) => setRecClientId(e.target.value)} options={clients} required />
                        <SelectField label="Caso" value={recCaseId} onChange={(e: any) => setRecCaseId(e.target.value)} options={filteredCases} disabled={!recClientId} required />
                        
                        <div className="md:col-span-2">
                            <InputField label="Descripción Tarea" value={recDesc} onChange={(e: any) => setRecDesc(e.target.value)} required />
                        </div>
                        <InputField label="Horas" type="number" step="0.25" min="0.25" value={recHours} onChange={(e: any) => setRecHours(parseFloat(e.target.value) || 0)} required />
                        <InputField label="Tarifa ($/hr)" type="number" step="1" min="0" value={recRate} onChange={(e: any) => setRecRate(parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="mt-8 flex justify-end gap-4 border-t border-zinc-900 pt-6">
                        <button type="button" onClick={() => setIsRecordModalOpen(false)} className="text-zinc-500 font-bold tracking-widest uppercase text-[10px] hover:text-white">Cancelar</button>
                        <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 uppercase tracking-widest text-[10px] hover:bg-zinc-300 disabled:opacity-50">REGISTRAR</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AdminProfile;