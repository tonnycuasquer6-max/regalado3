import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';

const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;
const ChevronUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 pointer-events-none"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

interface WorkerReportData {
    worker: any;
    timeEntries: any[];
    expenses: any[];
}

interface ReportsViewProps {
    onCancel?: () => void;
}

const ReportsView: React.FC<ReportsViewProps> = ({ onCancel }) => {
    const [reports, setReports] = useState<{ [workerId: string]: WorkerReportData }>({});
    const [clientsDict, setClientsDict] = useState<Record<string, any>>({});
    const [expandedWorkers, setExpandedWorkers] = useState<string[]>([]);
    const [showRecords, setShowRecords] = useState<Record<string, boolean>>({});
    
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const fetchReportData = useCallback(async () => {
        setLoading(true);

        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startStr = startOfMonth.toISOString().split('T')[0];
        const endStr = endOfMonth.toISOString().split('T')[0];

        const { data: workers } = await supabase.from('profiles').select('*').in('categoria_usuario', ['abogado', 'estudiante']).eq('estado_aprobacion', 'aprobado');
        
        const { data: clientsData } = await supabase.from('profiles').select('id, primer_nombre, primer_apellido').eq('rol', 'cliente');
        const cDict: Record<string, any> = {};
        clientsData?.forEach(c => { cDict[c.id] = c; });
        setClientsDict(cDict);

        // AHORA TRAEMOS TAMBIÉN EL ESTADO DEL CONTADOR
        const { data: timeEntries } = await supabase.from('time_entries').select('*, caso:cases(titulo, cliente_id)').gte('fecha_tarea', startStr).lte('fecha_tarea', endStr).order('fecha_tarea', { ascending: false });

        let expensesData: any[] = [];
        try {
            const { data: exps } = await supabase.from('gastos').select('*').gte('fecha', startStr).lte('fecha', endStr);
            if (exps) expensesData = exps;
        } catch (e) { console.error("Sin gastos:", e); }

        if (workers) {
            const reportMap: { [workerId: string]: WorkerReportData } = {};

            workers.forEach(w => {
                reportMap[w.id] = { worker: w, timeEntries: [], expenses: [] };
            });

            timeEntries?.forEach(te => {
                if (reportMap[te.perfil_id]) reportMap[te.perfil_id].timeEntries.push(te);
            });

            expensesData?.forEach(ex => {
                if (reportMap[ex.perfil_id]) reportMap[ex.perfil_id].expenses.push(ex);
            });

            setReports(reportMap);
        }
        
        setLoading(false);
    }, [currentMonth]);

    useEffect(() => {
        fetchReportData();
    }, [fetchReportData]);

    const handlePrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

    const toggleExpand = (workerId: string) => setExpandedWorkers(prev => prev.includes(workerId) ? prev.filter(id => id !== workerId) : [...prev, workerId]);
    const toggleRecords = (workerId: string) => setShowRecords(prev => ({ ...prev, [workerId]: !prev[workerId] }));

    const monthName = currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();

    // CALCULO GLOBAL DE TOTALES
    let totalGlobalConfirmed = 0;
    let totalGlobalPending = 0;
    
    Object.values(reports).forEach(({ timeEntries }) => {
        timeEntries.forEach(te => {
            const isConfirmed = te.estado === 'cobrado' && te.estado_pago_contador === 'aprobado';
            const amount = (te.horas || 0) * (te.tarifa_personalizada || 0);
            if (isConfirmed) totalGlobalConfirmed += amount;
            else totalGlobalPending += amount;
        });
    });

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in duration-500 font-mono text-white pb-12 relative">
            
            {/* ESTILO GLOBAL PARA DESAPARECER LA BARRA DE SCROLL */}
            <style>{`
                ::-webkit-scrollbar {
                    width: 0px !important;
                    height: 0px !important;
                    background: transparent !important;
                    display: none !important;
                }
                * {
                    -ms-overflow-style: none !important;
                    scrollbar-width: none !important;
                }
            `}</style>

            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic text-white">Reportes de Rendimiento</h1>
                <div className="flex items-center gap-4">
                    <button onClick={fetchReportData} className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Refrescar
                    </button>
                    {onCancel && (
                        <button onClick={onCancel} className="text-zinc-400 hover:text-white font-black py-2 px-6 transition-colors uppercase text-[10px] tracking-[0.3em] border-l border-zinc-800 pl-6">
                            Volver
                        </button>
                    )}
                </div>
            </header>

            <div className="flex items-center justify-between border-b border-zinc-900 pb-6 mb-8">
                <button onClick={handlePrevMonth} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronLeftIcon /></button>
                <h3 className="text-xl font-bold tracking-widest text-zinc-300">{monthName}</h3>
                <button onClick={handleNextMonth} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-950 border border-zinc-900 rounded-full"><ChevronRightIcon /></button>
            </div>

            {loading ? (
                <p className="text-zinc-500 text-center mt-12 animate-pulse uppercase tracking-widest text-xs font-bold">Generando Reportes...</p>
            ) : Object.values(reports).length === 0 ? (
                <div className="bg-black border border-zinc-900 p-8 text-center text-zinc-500">No hay trabajadores registrados en el sistema.</div>
            ) : (
                <>
                    {/* PANEL GLOBAL DE INGRESOS */}
                    <div className="bg-black border border-zinc-800 p-8 mb-8 flex justify-around divide-x divide-zinc-800 text-center shadow-2xl">
                        <div className="w-1/2 px-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-2">Ingresos Generados (A Confirmar)</p>
                            <p className="text-3xl font-black text-yellow-500 tracking-wider">${totalGlobalPending.toFixed(2)}</p>
                        </div>
                        <div className="w-1/2 px-4">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-2">Ingresos Confirmados por Contaduría</p>
                            <p className="text-3xl font-black text-green-500 tracking-wider">${totalGlobalConfirmed.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {Object.values(reports).map(({ worker, timeEntries, expenses }) => {
                            const isExpanded = expandedWorkers.includes(worker.id);
                            const isShowingRecords = showRecords[worker.id];
                            
                            const totalHours = timeEntries.reduce((acc, curr) => acc + (curr.horas || 0), 0);
                            const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.monto || 0), 0);

                            // LÓGICA DE CONTABILIDAD PARA ESTE TRABAJADOR
                            let workerConfirmedIncome = 0;
                            let workerPendingIncome = 0;
                            timeEntries.forEach(te => {
                                const amount = (te.horas || 0) * (te.tarifa_personalizada || 0);
                                if (te.estado === 'cobrado' && te.estado_pago_contador === 'aprobado') {
                                    workerConfirmedIncome += amount;
                                } else {
                                    workerPendingIncome += amount;
                                }
                            });

                            return (
                                <div key={worker.id} className={`bg-zinc-950 border transition-all duration-300 ${isExpanded ? 'border-zinc-700 shadow-2xl shadow-black' : 'border-zinc-900 hover:border-zinc-700'}`}>
                                    
                                    <div onClick={() => toggleExpand(worker.id)} className="flex items-center p-6 cursor-pointer group">
                                        <div className="relative w-14 h-14 flex-shrink-0">
                                            <img src={worker.foto_url || 'https://via.placeholder.com/150'} alt="Perfil" className="w-full h-full rounded-full border-2 border-zinc-800 object-cover group-hover:border-zinc-500 transition-colors" />
                                            {worker.color_perfil && (
                                                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black" style={{ backgroundColor: worker.color_perfil }}></span>
                                            )}
                                        </div>
                                        
                                        <div className="ml-6 flex-grow">
                                            <h2 className="text-xl font-bold uppercase tracking-widest text-white">{worker.primer_nombre} {worker.primer_apellido}</h2>
                                            <p className="text-zinc-500 text-[10px] mt-1 uppercase tracking-widest">
                                                {worker.rol} | MATRÍCULA: <span className="text-zinc-400">{worker.matricula_nro || 'N/A'}</span>
                                            </p>
                                        </div>
                                        
                                        <div className="text-right mr-8 hidden md:block">
                                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] mb-1">CONFIRMADO</p>
                                            <p className="text-green-500 font-bold tracking-wider">${workerConfirmedIncome.toFixed(2)}</p>
                                        </div>

                                        <div className={`text-zinc-600 group-hover:text-white transition-colors ${isExpanded ? 'text-white' : ''}`}>
                                            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-8 border-t border-zinc-900 bg-black animate-in fade-in slide-in-from-top-2 duration-300">
                                            
                                            <div className="flex justify-between items-center mb-6">
                                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em]">RESUMEN FINANCIERO DEL MES</p>
                                                
                                                <button onClick={() => toggleRecords(worker.id)} className="bg-zinc-800 text-white font-bold py-2 px-6 text-[10px] tracking-widest uppercase hover:bg-zinc-700 transition-colors shadow-lg shadow-black/50">
                                                    {isShowingRecords ? 'OCULTAR REGISTROS' : 'VER REGISTROS'}
                                                </button>
                                            </div>
                                            
                                            <div className="bg-zinc-950 border border-zinc-900 p-6 mb-8">
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Total Horas Trabajadas</p>
                                                    <p className="text-white font-mono font-bold">{totalHours.toFixed(2)} hrs</p>
                                                </div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="text-zinc-400 uppercase tracking-widest text-xs font-bold">Gastos Reembolsables</p>
                                                    <p className="text-white font-mono font-bold">${totalExpenses.toFixed(2)}</p>
                                                </div>
                                                <div className="border-t-2 border-dashed border-zinc-800 pt-6 mt-4 flex justify-between items-center">
                                                    <p className="text-zinc-400 uppercase tracking-[0.2em] text-xs font-black">POR CONFIRMAR (AMARILLO)</p>
                                                    <p className="text-yellow-500 font-black text-xl tracking-wider">${workerPendingIncome.toFixed(2)}</p>
                                                </div>
                                                <div className="border-t-2 border-dashed border-zinc-800 pt-4 mt-4 flex justify-between items-center">
                                                    <p className="text-white uppercase tracking-[0.3em] text-sm font-black">TOTAL COBRADO (VERDE)</p>
                                                    <p className="text-green-500 font-black text-3xl tracking-wider">${workerConfirmedIncome.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {isShowingRecords && (
                                                <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] mb-4">REGISTRO DE ACTIVIDADES (TIME BILLING)</p>
                                                    {timeEntries.length === 0 ? (
                                                        <div className="p-8 border border-dashed border-zinc-900 text-center text-zinc-600 text-xs tracking-widest uppercase">
                                                            Este trabajador no tiene actividades registradas en este mes.
                                                        </div>
                                                    ) : (
                                                        <div className={`max-h-[500px] space-y-3 pr-2 ${scrollbarStyle}`}>
                                                            {timeEntries.map(te => {
                                                                const isConfirmed = te.estado === 'cobrado' && te.estado_pago_contador === 'aprobado';
                                                                const isRejected = te.estado_pago_contador === 'rechazado';
                                                                
                                                                const totalCobrar = (te.horas || 0) * (te.tarifa_personalizada || 0);
                                                                const cliente = clientsDict[te.caso?.cliente_id] || {};
                                                                
                                                                return (
                                                                    <div key={te.id} className={`bg-zinc-950 border ${isConfirmed ? 'border-green-900/50' : isRejected ? 'border-red-900/50' : 'border-yellow-900/50'} p-5 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden`}>
                                                                        <div className={`absolute top-0 left-0 w-1 h-full ${isConfirmed ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                                                                        
                                                                        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 pl-2">
                                                                            <div>
                                                                                <p className="text-zinc-500 font-mono text-[10px] mb-2">{te.fecha_tarea} • {te.hora_inicio}</p>
                                                                                <p className="text-white font-bold text-xs uppercase tracking-widest">CLIENTE: <span className="text-zinc-300">{cliente.primer_nombre || 'N/A'} {cliente.primer_apellido || ''}</span></p>
                                                                                <p className="text-white font-bold text-xs uppercase tracking-widest mt-1">CASO: <span className="text-zinc-300 font-mono">{te.caso?.titulo || 'Desconocido'}</span></p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">ACTIVIDAD REALIZADA</p>
                                                                                <p className="text-zinc-300 text-xs line-clamp-3">{te.descripcion_tarea}</p>
                                                                                {isRejected && te.comentario_contador && (
                                                                                    <p className="text-red-400 text-[10px] mt-2 font-bold uppercase tracking-widest">NOTA CONTADOR: {te.comentario_contador}</p>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-1">TIEMPO Y TARIFA</p>
                                                                                <p className="text-zinc-400 text-xs font-mono">TIEMPO: <strong className="text-white">{te.horas} hrs</strong></p>
                                                                                <p className="text-zinc-400 text-xs font-mono mt-1">TARIFA: <strong className="text-white">${te.tarifa_personalizada || 0}/hr</strong></p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex-shrink-0 flex flex-col items-end md:border-l border-zinc-800 md:pl-8 pt-4 md:pt-0 border-t md:border-t-0">
                                                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-black mb-1">ESTADO PAGO</p>
                                                                            {isConfirmed ? (
                                                                                <p className="text-green-500 text-xl font-black tracking-wider flex items-center gap-1">
                                                                                    ${totalCobrar.toFixed(2)} <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                                                                                </p>
                                                                            ) : isRejected ? (
                                                                                <p className="text-red-500 text-xl font-black tracking-wider line-through decoration-red-500/50">${totalCobrar.toFixed(2)}</p>
                                                                            ) : (
                                                                                <p className="text-yellow-500 text-xl font-black tracking-wider">${totalCobrar.toFixed(2)}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default ReportsView;