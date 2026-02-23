import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

interface WorkerReportData {
    worker: any;
    assignedClientsMap: { [clientId: string]: { client: any; cases: any[] } };
    timeEntries: any[];
}

interface ReportsViewProps {
    onCancel?: () => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ onCancel }) => {
    const [reports, setReports] = useState<{ [workerId: string]: WorkerReportData }>({});
    const [expandedWorkers, setExpandedWorkers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReportData = useCallback(async () => {
        setLoading(true);

        const { data: workers } = await supabase.from('profiles').select('*').in('rol', ['abogado', 'estudiante']).eq('estado_aprobacion', 'aprobado');
        const { data: clients } = await supabase.from('profiles').select('*').eq('rol', 'cliente');
        const { data: cases } = await supabase.from('cases').select('*');
        const { data: assignments } = await supabase.from('asignaciones_casos').select('*');
        const { data: timeEntries } = await supabase.from('time_entries').select('*').order('fecha_tarea', { ascending: false }).order('hora_inicio', { ascending: false });

        if (workers && clients && cases && assignments && timeEntries) {
            const reportMap: { [workerId: string]: WorkerReportData } = {};

            workers.forEach(w => {
                reportMap[w.id] = { worker: w, assignedClientsMap: {}, timeEntries: [] };
            });

            assignments.forEach(a => {
                if (reportMap[a.abogado_id]) {
                    const caso = cases.find(c => c.id === a.case_id);
                    if (caso) {
                        const client = clients.find(cl => cl.id === caso.cliente_id);
                        if (client) {
                            if (!reportMap[a.abogado_id].assignedClientsMap[client.id]) {
                                reportMap[a.abogado_id].assignedClientsMap[client.id] = { client, cases: [] };
                            }
                            reportMap[a.abogado_id].assignedClientsMap[client.id].cases.push(caso);
                        }
                    }
                }
            });

            timeEntries.forEach(te => {
                if (reportMap[te.perfil_id]) {
                    const caso = cases.find(c => c.id === te.caso_id);
                    const client = caso ? clients.find(cl => cl.id === caso.cliente_id) : null;
                    reportMap[te.perfil_id].timeEntries.push({ ...te, caso, client });
                }
            });

            setReports(reportMap);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const toggleExpand = (workerId: string) => {
        setExpandedWorkers(prev => 
            prev.includes(workerId) ? prev.filter(id => id !== workerId) : [...prev, workerId]
        );
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500 font-mono text-white pb-12">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Reportes de Rendimiento</h1>
                
                <div className="flex items-center gap-4">
                    <button onClick={fetchReportData} className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Refrescar Datos
                    </button>
                    {/* BOTÓN VOLVER */}
                    {onCancel && (
                        <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em] border-l border-zinc-800 pl-6">
                            Volver
                        </button>
                    )}
                </div>
            </header>

            {loading ? (
                <p className="text-zinc-500 text-center mt-12 animate-pulse uppercase tracking-widest text-xs font-bold">Generando Reportes...</p>
            ) : Object.values(reports).length === 0 ? (
                <div className="bg-black border border-zinc-900 p-8 text-center text-zinc-500">No hay trabajadores registrados en el sistema.</div>
            ) : (
                <div className="space-y-4">
                    {Object.values(reports).map(({ worker, assignedClientsMap, timeEntries }) => {
                        const isExpanded = expandedWorkers.includes(worker.id);
                        
                        const totalGenerado = timeEntries.reduce((acc, te) => acc + ((te.horas || 0) * (te.tarifa_personalizada || 0)), 0);

                        return (
                            <div key={worker.id} className={`bg-zinc-950 border transition-colors duration-300 ${isExpanded ? 'border-zinc-700 shadow-2xl shadow-black' : 'border-zinc-900 hover:border-zinc-700'}`}>
                                
                                <div onClick={() => toggleExpand(worker.id)} className="flex items-center p-6 cursor-pointer group">
                                    <img src={worker.foto_url || 'https://via.placeholder.com/150'} alt="Perfil" className="w-14 h-14 rounded-full border-2 border-zinc-800 object-cover group-hover:border-zinc-500 transition-colors" />
                                    
                                    <div className="ml-6 flex-grow">
                                        <h2 className="text-xl font-bold uppercase tracking-widest text-white">{worker.primer_nombre} {worker.primer_apellido}</h2>
                                        <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">{worker.rol}</p>
                                    </div>
                                    
                                    <div className="text-right mr-8 hidden md:block">
                                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] mb-1">TOTAL GENERADO</p>
                                        <p className="text-green-500 font-bold tracking-wider">${totalGenerado.toFixed(2)}</p>
                                    </div>

                                    <div className={`text-zinc-600 group-hover:text-white transition-colors ${isExpanded ? 'text-white' : ''}`}>
                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="p-6 border-t border-zinc-900 bg-black animate-in fade-in slide-in-from-top-2 duration-300">
                                        
                                        <div className="mb-10">
                                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4">CLIENTES Y CASOS ASIGNADOS</p>
                                            {Object.values(assignedClientsMap).length === 0 ? (
                                                <p className="text-xs text-zinc-600 italic">Este trabajador no tiene casos asignados.</p>
                                            ) : (
                                                <div className="flex flex-wrap gap-3">
                                                    {Object.values(assignedClientsMap).map((ac: any) => (
                                                        <div key={ac.client.id} className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-md w-full md:w-auto">
                                                            <p className="font-bold text-white uppercase text-xs tracking-widest">CLIENTE: {ac.client.primer_nombre} {ac.client.primer_apellido}</p>
                                                            <p className="text-zinc-500 font-mono text-[10px] mt-1">— CASOS: <span className="text-zinc-300">{ac.cases.map((c: any) => c.titulo).join(', ')}</span></p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4 flex items-center">
                                                <ClockIcon /> REGISTRO DE ACTIVIDADES (TIME BILLING)
                                            </p>
                                            {timeEntries.length === 0 ? (
                                                <div className="p-8 border border-dashed border-zinc-900 text-center text-zinc-600 text-xs tracking-widest uppercase">
                                                    No hay actividades registradas aún.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {timeEntries.map((te: any) => {
                                                        const totalCobrar = (te.horas || 0) * (te.tarifa_personalizada || 0);
                                                        
                                                        return (
                                                            <div key={te.id} className="bg-zinc-950 border border-zinc-900 hover:border-zinc-700 transition-colors p-5 flex flex-col md:flex-row justify-between md:items-center gap-6">
                                                                
                                                                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    
                                                                    <div>
                                                                        <p className="text-zinc-500 font-mono text-[10px] mb-2">{te.fecha_tarea} • {te.hora_inicio}</p>
                                                                        <p className="text-white font-bold text-xs uppercase tracking-widest">CLIENTE: <span className="text-zinc-300">{te.client?.primer_nombre} {te.client?.primer_apellido}</span></p>
                                                                        <p className="text-white font-bold text-xs uppercase tracking-widest mt-1">CASO: <span className="text-zinc-300 font-mono">{te.caso?.titulo}</span></p>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">ACTIVIDAD REALIZADA</p>
                                                                        <p className="text-zinc-300 text-xs line-clamp-3">{te.descripcion_tarea}</p>
                                                                    </div>
                                                                    
                                                                    <div>
                                                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">TIEMPO Y TARIFA</p>
                                                                        <p className="text-zinc-400 text-xs font-mono">TIEMPO: <strong className="text-white">{te.horas} hrs</strong></p>
                                                                        <p className="text-zinc-400 text-xs font-mono mt-1">TARIFA: <strong className="text-white">${te.tarifa_personalizada || 0}/hr</strong></p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex-shrink-0 flex flex-col items-end md:border-l border-zinc-800 md:pl-8 pt-4 md:pt-0 border-t md:border-t-0">
                                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">PRECIO A COBRAR</p>
                                                                    <p className="text-green-500 text-2xl font-black tracking-wider">${totalCobrar.toFixed(2)}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReportsView;