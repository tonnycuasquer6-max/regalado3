import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { CaseItem, Profile, CaseUpdate } from '../types';

const CaseStatus = { abierto: 'abierto', pendiente: 'pendiente', cerrado: 'cerrado' };

// (Iconos SVG omitidos por espacio, mantén los mismos que ya tenías en tu archivo original)
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 inline-block mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-2 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;

const Modal: React.FC<{ isOpen: boolean; title: string; onClose: () => void; children: React.ReactNode; size?: 'md' | 'lg' }> = ({ isOpen, title, onClose, children, size = 'md' }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-mono">
            <div className={`bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} overflow-hidden flex flex-col max-h-[90vh] rounded-2xl`}>
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-white italic">{title}</h2>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export const CaseView: React.FC<{ title?: string }> = ({ title = "Casos" }) => {
    const [clientProfile, setClientProfile] = useState<Profile | null>(null);
    const [cases, setCases] = useState<CaseItem[]>([]);
    const [assignedCaseIds, setAssignedCaseIds] = useState<string[]>([]);
    const [petitions, setPetitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // ESTADOS PARA NUEVO CASO
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [caseType, setCaseType] = useState<'custom' | 'preset' | null>(null);
    const [newCaseTitle, setNewCaseTitle] = useState('');
    const [newCaseDescription, setNewCaseDescription] = useState('');
    const [presetSearch, setPresetSearch] = useState('');
    const [presetOption, setPresetOption] = useState<number | null>(null);
    const fixedCostOptions = Array.from({ length: 50 }, (_, i) => i + 1);

    const fetchCases = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No autenticado');
            setClientProfile({ id: user.id, rol: 'trabajador' } as Profile);

            const { data: casesData } = await supabase.from('cases').select('*, cliente:profiles!cliente_id(primer_nombre, primer_apellido)').order('created_at', { ascending: false });
            setCases(casesData || []);

            const { data: assigned } = await supabase.from('asignaciones_casos').select('case_id').eq('abogado_id', user.id);
            setAssignedCaseIds((assigned || []).map(a => a.case_id));

            const { data: reqs } = await supabase.from('peticiones_acceso').select('*').eq('trabajador_id', user.id);
            setPetitions(reqs || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCases(); }, [fetchCases]);

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientProfile) return;
        
        let finalTitle = newCaseTitle;
        let finalDesc = newCaseDescription;
        
        if (caseType === 'preset' && presetOption) {
            const baseHours = 0.5 + presetOption * 0.1;
            const baseRate = 30 + presetOption * 1.5;
            const hours = Math.round(baseHours * 100) / 100;
            const rate = Math.round((baseRate + 5) * 100) / 100;
            
            finalTitle = `Caso Predeterminado #${presetOption}`;
            finalDesc = `Tiempo estimado: ${hours}h\nPrecio: $${rate}`;
        } else if (caseType === 'custom' && (!newCaseTitle.trim() || !newCaseDescription.trim())) {
            alert('Por favor completa el título y descripción del caso');
            return;
        }
        
        setActionLoading(true);
        try {
            const { error } = await supabase.from('cases').insert({
                titulo: finalTitle.trim(),
                descripcion: finalDesc.trim(),
                estado: CaseStatus.pendiente,
                cliente_id: clientProfile.id
            });
            if (error) throw error;
            setNewCaseTitle(''); setNewCaseDescription(''); setCaseType(null); setPresetOption(null); setIsCreateModalOpen(false);
            await fetchCases();
        } catch (error: any) {
            alert(`No se pudo crear el caso: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="font-mono animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 border-b border-zinc-900 pb-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">{title}</h1>
                <div className="flex gap-4">
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600/80 hover:bg-blue-500 rounded-xl px-5 py-2 text-xs uppercase tracking-wider font-black transition-colors backdrop-blur-md shadow-lg">Crear Caso</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-12 text-zinc-500 animate-pulse font-mono">Cargando casos...</div>
            ) : cases.length === 0 ? (
                <div className="bg-black border border-zinc-900 p-8 text-center text-zinc-500 uppercase tracking-widest text-xs">No existen casos registrados en el sistema.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {cases.map(caso => (
                        <div key={caso.id} className="bg-black/40 backdrop-blur-md border border-white/10 p-6 flex flex-col justify-between relative overflow-hidden transition-all rounded-xl shadow-lg hover:border-white/30">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest flex items-center mb-4">{caso.titulo}</h3>
                            <p className="text-xs text-zinc-400 font-mono line-clamp-3 mb-4">{caso.descripcion}</p>
                            <span className="bg-zinc-800 text-white text-[10px] uppercase font-bold tracking-widest py-1 px-3 w-fit rounded-full">{caso.estado}</span>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isCreateModalOpen} title="Crear Nuevo Caso" onClose={() => { setIsCreateModalOpen(false); setCaseType(null); }} size="lg">
                {caseType ? (
                    caseType === 'custom' ? (
                        <form onSubmit={handleCreateCase} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-widest mb-2">Título del Caso</label>
                                <input type="text" value={newCaseTitle} onChange={e => setNewCaseTitle(e.target.value)} placeholder="Ej: Constitución de Empresa" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-widest mb-2">Descripción</label>
                                <textarea value={newCaseDescription} onChange={e => setNewCaseDescription(e.target.value)} placeholder="Describe los detalles del caso..." className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-24 resize-none" required />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setCaseType(null)} className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">Atrás</button>
                                <button type="submit" disabled={actionLoading || !newCaseTitle.trim()} className="flex-1 px-4 py-3 bg-blue-600/80 hover:bg-blue-500 text-white rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">
                                    {actionLoading ? 'Creando...' : 'Crear Caso'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleCreateCase} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-300 uppercase tracking-widest mb-3">Selecciona un Caso Predeterminado</label>
                                <input type="text" placeholder="Buscar por número..." value={presetSearch} onChange={e => setPresetSearch(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-blue-500" />
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                                    {fixedCostOptions.filter(opt => opt.toString().includes(presetSearch)).map(opt => {
                                        const baseHours = 0.5 + opt * 0.1;
                                        const baseRate = 30 + opt * 1.5;
                                        const hours = Math.round(baseHours * 100) / 100;
                                        const rate = Math.round((baseRate + 5) * 100) / 100;
                                        return (
                                            <div key={opt} onClick={() => setPresetOption(opt)} className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${presetOption === opt ? 'border-green-500 bg-green-900/20' : 'border-white/10 bg-black/50 hover:border-white/30'}`}>
                                                <h4 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Caso Predeterminado #{opt}</h4>
                                                <div className="flex justify-between text-xs text-zinc-400">
                                                    <span className="text-green-400 font-bold">Precio Sugerido: ${rate}</span>
                                                    <span>⏱️ {hours}h</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4 border-t border-white/10">
                                <button type="button" onClick={() => setCaseType(null)} className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-zinc-300 rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">Atrás</button>
                                <button type="submit" disabled={actionLoading || !presetOption} className="flex-1 px-4 py-3 bg-green-600/80 hover:bg-green-500 text-white rounded-xl uppercase text-xs font-bold tracking-widest transition-colors">
                                    {actionLoading ? 'Creando...' : 'Crear Caso'}
                                </button>
                            </div>
                        </form>
                    )
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-zinc-300 mb-6">Selecciona el tipo de caso que deseas crear:</p>
                        <button onClick={() => setCaseType('custom')} className="w-full p-6 border border-white/10 hover:border-white/30 bg-black/50 hover:bg-white/5 rounded-xl transition-all text-left flex items-start gap-4">
                            <div>
                                <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-1">Caso Personalizado</h3>
                                <p className="text-zinc-400 text-xs">Crea un caso con tu propio título y descripción manual.</p>
                            </div>
                        </button>
                        <button onClick={() => setCaseType('preset')} className="w-full p-6 border border-white/10 hover:border-green-500/50 bg-black/50 hover:bg-green-900/10 rounded-xl transition-all text-left flex items-start gap-4">
                            <div>
                                <h3 className="font-bold text-white uppercase tracking-widest text-sm mb-1 text-green-400">Casos Predeterminados (Costos Fijos)</h3>
                                <p className="text-zinc-400 text-xs">Elige de una lista de 50 casos con precios y tiempos auto-calculados.</p>
                            </div>
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CaseView;