import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { supabase } from '../../services/supabaseClient';

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const PaperClipIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-mono"><div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">{children}</div></div>;
};

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
            {options?.map((opt: any) => (
                <option key={opt.id} value={opt.id} className="bg-black">{opt.titulo || `${opt.primer_nombre || ''} ${opt.primer_apellido || ''}`.trim()}</option>
            ))}
        </select>
    </div>
);

const NumberControl = ({ label, value, step, min, onChange, isMoney = false, prefix = '' }: any) => {
    const handleDecrease = () => { let newVal = value - step; if (newVal < min) newVal = min; onChange(Math.round(newVal * 10000) / 10000); };
    const handleIncrease = () => { let newVal = value + step; onChange(Math.round(newVal * 10000) / 10000); };

    const textColor = isMoney ? 'text-green-400' : 'text-white';
    const borderColor = isMoney ? 'border-green-900/50 focus-within:border-green-500' : 'border-zinc-800 focus-within:border-zinc-500';
    const labelColor = isMoney ? 'text-green-700' : 'text-zinc-500';

    return (
        <div>
            <label className={`block text-[10px] font-black mb-2 uppercase tracking-[0.3em] ${labelColor}`}>{label}</label>
            <div className={`flex items-center bg-transparent border-b transition-colors group py-1 ${borderColor}`}>
                <div className={`flex-grow flex justify-start items-center font-mono text-base ${textColor}`}>
                    {prefix && <span className="mr-1 opacity-70">{prefix}</span>}
                    <input 
                        type="number" value={value.toFixed(2)} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                        className="w-full bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        step="any" min={min} 
                    />
                </div>
                <div className="flex flex-col ml-2 justify-center">
                    <button type="button" onClick={handleIncrease} className={`hover:text-white transition-colors flex items-center justify-center p-0.5 ${isMoney ? 'text-green-700 hover:text-green-400' : 'text-zinc-600'}`}><ChevronUpIcon /></button>
                    <button type="button" onClick={handleDecrease} className={`hover:text-white transition-colors flex items-center justify-center p-0.5 mt-0.5 ${isMoney ? 'text-green-700 hover:text-green-400' : 'text-zinc-600'}`}><ChevronDownIcon /></button>
                </div>
            </div>
        </div>
    );
};

const ExpensesView: React.FC = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [expenses, setExpenses] = useState<any[]>([]);
    
    const [clientsDict, setClientsDict] = useState<Record<string, any>>({});
    const [casesDict, setCasesDict] = useState<Record<string, any>>({});
    const [userProfile, setUserProfile] = useState<any>(null);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expDesc, setExpDesc] = useState('');
    const [expAmount, setExpAmount] = useState<number>(0);
    const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
    const [expFile, setExpFile] = useState<File | null>(null);
    const [expClientId, setExpClientId] = useState('');
    const [expCaseId, setExpCaseId] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchInitialData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (profile) setUserProfile(profile);

            const { data: clients } = await supabase.from('profiles').select('id, primer_nombre, primer_apellido').eq('rol', 'cliente');
            const cDict: Record<string, any> = {};
            clients?.forEach(c => { cDict[c.id] = c; });
            setClientsDict(cDict);

            const { data: allCases } = await supabase.from('cases').select('*');
            const caDict: Record<string, any> = {};
            allCases?.forEach(c => { caDict[c.id] = c; });
            setCasesDict(caDict);

        } catch(e) { console.error(e); }
    }, []);

    const fetchMonthData = useCallback(async () => {
        setLoading(true);
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startStr = startOfMonth.toISOString().split('T')[0];
        const endStr = endOfMonth.toISOString().split('T')[0];

        try {
            if (!userProfile) return;
            const { data: exps } = await supabase.from('gastos').select('*').eq('perfil_id', userProfile.id).gte('fecha', startStr).lte('fecha', endStr).order('fecha', { ascending: false });
            setExpenses(exps || []);
        } catch(e) { console.error(e); setExpenses([]); }

        setLoading(false);
    }, [currentMonth, userProfile]);

    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);
    useEffect(() => { if(userProfile) fetchMonthData(); }, [fetchMonthData, userProfile]);

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!expDesc || expAmount <= 0 || !expClientId || !expCaseId || !userProfile) {
            alert("Por favor completa todos los campos.\nAsegúrate de seleccionar un Cliente, un Caso Abierto, una Descripción y un Monto mayor a $0.");
            return;
        }

        setActionLoading(true);

        let fileUrl = null;
        if (expFile) {
            const fileName = `${Date.now()}_${expFile.name}`;
            const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, expFile);
            if (!uploadError) {
                const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
                fileUrl = data.publicUrl;
            } else {
                alert(`Error al subir el archivo: ${uploadError.message}`);
                setActionLoading(false);
                return;
            }
        }

        const { error } = await supabase.from('gastos').insert({
            perfil_id: userProfile.id,
            trabajador_id: userProfile.id,
            cliente_id: expClientId,
            caso_id: expCaseId,
            descripcion: expDesc,
            monto: expAmount,
            fecha: expDate,
            comprobante_url: fileUrl
        });

        if (!error) {
            setIsExpenseModalOpen(false);
            setExpDesc(''); setExpAmount(0); setExpFile(null); setExpClientId(''); setExpCaseId('');
            fetchMonthData();
        } else {
            alert(`Error de base de datos: ${error.message}`);
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

    const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
    const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.monto || 0), 0);

    const clientOptions = Object.values(clientsDict);
    const filteredCases = Object.values(casesDict).filter(c => c.cliente_id === expClientId && c.estado === 'abierto');

    return (
        <Fragment>
            <style>{`
                ::-webkit-scrollbar { width: 0px !important; height: 0px !important; background: transparent !important; display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}</style>

            <div className="w-full animate-in fade-in duration-500 font-mono text-white pb-12 relative max-w-4xl mx-auto">
                <header className="flex items-center justify-between mb-8 border-b border-zinc-900 pb-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter italic">Gastos Reembolsables</h1>
                        <p className="text-zinc-500 text-xs tracking-widest mt-1">Registra y administra tus gastos vinculados</p>
                    </div>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="bg-white text-black font-bold py-2 px-6 text-[10px] tracking-widest uppercase hover:bg-zinc-300 transition-colors shadow-lg shadow-black/50">
                        + AÑADIR GASTO
                    </button>
                </header>

                <div className="sticky top-20 z-40 bg-black/95 backdrop-blur-md border border-zinc-800 p-4 mb-6 flex items-center justify-between shadow-2xl shadow-black/50">
                    <button onClick={handlePrevMonth} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronLeftIcon /></button>
                    <div className="text-center">
                        <h3 className="text-xl font-bold tracking-widest text-zinc-300">{monthName}</h3>
                        <p className="text-[10px] text-zinc-500 tracking-widest uppercase mt-1">Total del mes: <span className="text-red-400 font-bold">${totalExpenses.toFixed(2)}</span></p>
                    </div>
                    <button onClick={handleNextMonth} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronRightIcon /></button>
                </div>

                <div className="bg-black border border-zinc-800 shadow-2xl shadow-black/50 p-8">
                    {loading ? (
                        <p className="text-zinc-500 text-center py-12 animate-pulse uppercase tracking-widest text-xs font-bold">Cargando registros...</p>
                    ) : expenses.length === 0 ? (
                        <div className="p-8 border border-dashed border-zinc-900 text-center text-zinc-600 text-xs tracking-widest uppercase">
                            No has registrado gastos en este mes.
                        </div>
                    ) : (
                        <div className={`space-y-4 ${scrollbarStyle}`}>
                            {expenses.map(exp => {
                                const cliente = clientsDict[exp.cliente_id] || {};
                                const caso = casesDict[exp.caso_id] || {};

                                return (
                                    <div key={exp.id} className="flex flex-col md:flex-row justify-between md:items-center p-6 bg-zinc-950 border border-zinc-900 gap-6 transition-colors hover:border-zinc-700">
                                        <div className="flex-grow">
                                            <p className="text-zinc-500 text-[10px] font-mono mb-2">{exp.fecha}</p>
                                            <p className="text-white font-bold text-xs uppercase tracking-widest">CLIENTE: <span className="text-zinc-300">{cliente.primer_nombre || 'N/A'} {cliente.primer_apellido || ''}</span></p>
                                            <p className="text-white font-bold text-xs uppercase tracking-widest mt-1">CASO: <span className="text-zinc-300 font-mono">{caso.titulo || 'Desconocido'}</span></p>
                                            <p className="text-zinc-400 text-sm mt-3 uppercase font-bold">{exp.descripcion}</p>
                                        </div>
                                        <div className="flex items-center gap-6 justify-between md:justify-end border-t md:border-t-0 border-zinc-800 md:border-l pl-0 md:pl-8 pt-4 md:pt-0">
                                            {exp.comprobante_url && (
                                                <a href={exp.comprobante_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-[10px] tracking-widest uppercase flex items-center gap-1">
                                                    <DocumentIcon /> Recibo
                                                </a>
                                            )}
                                            <div className="text-right">
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">MONTO REEMBOLSABLE</p>
                                                <p className="text-red-400 font-mono text-2xl font-black">${exp.monto.toFixed(2)}</p>
                                            </div>
                                            <button onClick={() => handleDeleteExpense(exp.id, exp.comprobante_url)} disabled={actionLoading} className="text-zinc-600 hover:text-red-500 transition-colors disabled:opacity-50">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)}>
                    <form onSubmit={handleSaveExpense} className="p-8 flex flex-col overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-white">REGISTRAR GASTO</h2>

                        <div className="space-y-6 mb-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Trabajador</label>
                                    <input type="text" readOnly value={`${userProfile?.primer_nombre || ''} ${userProfile?.primer_apellido || ''}`} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 opacity-70 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Fecha</label>
                                    <input type="date" required value={expDate} onChange={(e: any) => setExpDate(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500 [&::-webkit-calendar-picker-indicator]:invert" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Cliente</label>
                                    <select required value={expClientId} onChange={(e: any) => setExpClientId(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500">
                                        <option value="" className="bg-black">Seleccionar...</option>
                                        {clientOptions.map((opt: any) => <option key={opt.id} value={opt.id} className="bg-black">{opt.primer_nombre} {opt.primer_apellido}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Caso</label>
                                    <select required disabled={!expClientId} value={expCaseId} onChange={(e: any) => setExpCaseId(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500 disabled:opacity-50">
                                        <option value="" className="bg-black">Seleccionar...</option>
                                        {filteredCases.map((opt: any) => <option key={opt.id} value={opt.id} className="bg-black">{opt.titulo}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Descripción (Qué se compró / pagó)</label>
                                <input type="text" required value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full bg-transparent border-b border-zinc-800 text-white py-2 focus:outline-none focus:border-zinc-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-6 items-start">
                                <NumberControl
                                    label="Monto Reembolsable ($)"
                                    value={expAmount}
                                    step={0.25}
                                    min={0.01}
                                    onChange={setExpAmount}
                                    isMoney={true}
                                />
                                <div>
                                    <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Factura (Opcional)</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf" onChange={(e: any) => setExpFile(e.target.files ? e.target.files[0] : null)} />
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-3 border border-zinc-800 transition-colors ${expFile ? 'text-green-500 border-green-900' : 'text-zinc-500 hover:text-white'}`}>
                                            <PaperClipIcon />
                                        </button>
                                        <span className="text-xs text-zinc-400 font-mono truncate">{expFile ? expFile.name : 'Opcional'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 border-t border-zinc-900 pt-6">
                            <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="text-zinc-500 text-[10px] font-bold tracking-widest hover:text-white uppercase transition-colors">CANCELAR</button>
                            <button type="submit" disabled={actionLoading} className="bg-white text-black font-bold py-2 px-6 text-[10px] tracking-widest uppercase hover:bg-zinc-300 transition-colors disabled:opacity-50">GUARDAR GASTO</button>
                        </div>
                    </form>
                </Modal>
            </div>
        </Fragment>
    );
};

export default ExpensesView;