import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ReportsView from './admin/ReportsView';
import ListaPerfiles from './admin/ListaPerfiles';

// --- Iconos ---
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UserIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-mono">
            <div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] rounded-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">X</button>
                {children}
            </div>
        </div>
    );
};

// --- COMPONENTE INTERNO DE PAGOS ---
const PagosView: React.FC = () => {
    const [pagos, setPagos] = useState<any[]>([]);
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; pagoId: string }>({ isOpen: false, pagoId: '' });
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPagos = async () => {
        const { data, error } = await supabase.from('pagos').select('*').order('created_at', { ascending: false }).limit(100);
        if (!error && data) setPagos(data);
    };

    useEffect(() => { fetchPagos(); }, []);

    const handleUpdateStatus = async (id: string, newStatus: string, motivo: string | null = null) => {
        setActionLoading(true);
        const { error } = await supabase.from('pagos').update({ estado: newStatus, motivo_rechazo: motivo }).eq('id', id);
        if (!error) {
            setPagos(prev => prev.map(p => p.id === id ? { ...p, estado: newStatus, motivo_rechazo: motivo } : p));
            if (newStatus === 'rechazado') {
                setRejectModal({ isOpen: false, pagoId: '' });
                setMotivoRechazo('');
            }
        } else {
            alert(`Error al actualizar: ${error.message}`);
        }
        setActionLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-500 font-mono text-white">
            <header className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-900">
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Línea de Tiempo de Pagos</h1>
                <button onClick={fetchPagos} className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
                    Refrescar
                </button>
            </header>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                {pagos.length === 0 ? (
                    <p className="text-zinc-500 text-center py-10">No se han registrado pagos en el sistema.</p>
                ) : (
                    pagos.map((pago) => {
                        const isPending = pago.estado === 'pendiente' || !pago.estado;
                        const isApproved = pago.estado === 'aprobado';
                        const isRejected = pago.estado === 'rechazado';

                        const dotColor = isApproved ? 'bg-green-500' : isRejected ? 'bg-red-500' : 'bg-yellow-500';
                        const borderColor = isApproved ? 'border-green-900/50' : isRejected ? 'border-red-900/50' : 'border-yellow-900/50';
                        const bgColor = isApproved ? 'bg-green-950/10' : isRejected ? 'bg-red-950/10' : 'bg-yellow-950/10';

                        return (
                            <div key={pago.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-black ${dotColor} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                                    {isApproved ? <CheckIcon /> : isRejected ? <XMarkIcon /> : <span className="text-black font-bold">!</span>}
                                </div>
                                <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm shadow-xl`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] text-zinc-500 font-mono">{new Date(pago.created_at).toLocaleString()}</p>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${isApproved ? 'bg-green-900/50 text-green-400' : isRejected ? 'bg-red-900/50 text-red-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                            {pago.estado || 'Pendiente'}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-white text-lg uppercase tracking-wider mb-1">{pago.descripcion || 'Pago del Cliente'}</h3>
                                    <p className="text-2xl font-black text-white font-mono tracking-widest mb-4">${pago.monto || '0.00'}</p>
                                    
                                    {(pago.comprobante_url) && (
                                        <a href={pago.comprobante_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-black/50 border border-white/10 px-3 py-1.5 mb-4 text-blue-400 hover:bg-white/5 uppercase tracking-widest transition-colors rounded-lg">
                                            <DocumentIcon /> Ver Comprobante
                                        </a>
                                    )}

                                    {isRejected && pago.motivo_rechazo && (
                                        <div className="mt-2 mb-4 bg-red-950/30 border border-red-900 p-3 text-xs text-red-400 rounded-lg">
                                            <strong className="uppercase text-[10px] tracking-widest block mb-1">Motivo de Rechazo:</strong>{pago.motivo_rechazo}
                                        </div>
                                    )}

                                    {isPending && (
                                        <div className="flex gap-2 pt-4 border-t border-white/5">
                                            <button onClick={() => handleUpdateStatus(pago.id, 'aprobado')} disabled={actionLoading} className="flex-1 bg-green-600/80 hover:bg-green-500 text-white text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest disabled:opacity-50">
                                                Aprobar
                                            </button>
                                            <button onClick={() => setRejectModal({ isOpen: true, pagoId: pago.id })} disabled={actionLoading} className="flex-1 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest disabled:opacity-50">
                                                Rechazar
                                            </button>
                                        </div>
                                    )}
                                    {isApproved && (
                                         <div className="flex gap-2 pt-4 border-t border-white/5">
                                            <button onClick={() => handleUpdateStatus(pago.id, 'pendiente')} disabled={actionLoading} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest disabled:opacity-50">
                                                Revertir a Pendiente
                                            </button>
                                         </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <Modal isOpen={rejectModal.isOpen} onClose={() => { setRejectModal({ isOpen: false, pagoId: '' }); setMotivoRechazo(''); }}>
                <div className="p-8">
                    <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-red-500">Motivo de Rechazo</h2>
                    <p className="text-zinc-400 text-xs mb-4">El cliente verá este motivo en su portal de pagos.</p>
                    <div className="mb-8">
                        <label className="block text-zinc-500 text-[10px] font-black mb-2 uppercase tracking-[0.3em]">Motivo detallado</label>
                        <input type="text" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} required className="w-full py-3 px-4 bg-black/50 rounded-xl border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors" placeholder="Ej: La transferencia rebotó..." />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={() => { setRejectModal({ isOpen: false, pagoId: '' }); setMotivoRechazo(''); }} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                        <button type="button" onClick={() => handleUpdateStatus(rejectModal.pagoId, 'rechazado', motivoRechazo)} disabled={!motivoRechazo.trim() || actionLoading} className="bg-red-600/80 hover:bg-red-500 rounded-xl shadow-lg text-white font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Rechazar Pago</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// --- MAIN CONTADORA COMPONENT ---
const Contador = () => {
    const [activeView, setActiveView] = useState(() => sessionStorage.getItem('contadoraActiveView') || 'HOME');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        sessionStorage.setItem('contadoraActiveView', activeView);
        supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email || ''));
    }, [activeView]);

    const handleNavigate = (view: string) => {
        setActiveView(view);
        setMobileMenuOpen(false);
        setProfileMenuOpen(false);
    };

    const handleLogout = async () => {
        localStorage.removeItem('deviceToken');
        await supabase.auth.signOut();
    };

    const renderContent = () => {
        switch (activeView) {
            case 'REPORTES': return <ReportsView onCancel={() => handleNavigate('HOME')} />;
            case 'PERFILES': return <ListaPerfiles role="cliente" isContador={true} onCancel={() => handleNavigate('HOME')} />;
            case 'PAGOS': return <PagosView />;
            default: return null;
        }
    };

    return (
        <div className="bg-black min-h-screen text-white flex flex-col font-sans relative">
            <style>{`
                ::-webkit-scrollbar { width: 0 !important; height: 0 !important; background: transparent !important; display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}</style>

            {/* HEADER CRISTAL ESTÁTICO (Sticky) */}
            <header className="flex justify-between items-center p-6 bg-black/80 backdrop-blur-md sticky top-0 border-b border-white/10 z-[90]">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
                    <MenuIcon />
                </button>
                
                <div className="font-serif font-bold text-2xl tracking-widest cursor-pointer hover:text-zinc-300 transition-colors hidden md:block w-32" onClick={() => handleNavigate('HOME')}>
                    R & R
                </div>

                <nav className="hidden md:flex flex-grow justify-center gap-6 lg:gap-10 items-center relative z-40">
                    <button onClick={() => handleNavigate('REPORTES')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'REPORTES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Reportes</button>
                    <button onClick={() => handleNavigate('PERFILES')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'PERFILES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Perfiles (Clientes)</button>
                    <button onClick={() => handleNavigate('PAGOS')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'PAGOS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Línea de Pagos</button>
                </nav>

                <div className="flex items-center justify-end gap-6 w-32 relative">
                    <div className="relative">
                        <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden bg-black/50 ${profileMenuOpen ? 'border-white' : 'border-zinc-700 hover:border-white'}`}>
                            <UserIcon className="w-6 h-6 text-zinc-400 pointer-events-none" />
                        </button>

                        {profileMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-[95]" onClick={() => setProfileMenuOpen(false)} />
                                <div className="absolute right-0 mt-6 w-64 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black rounded-2xl py-2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 overflow-hidden font-mono">
                                    <div className="p-5 border-b border-white/5">
                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-2 font-black">Sesión activa</p>
                                        <p className="text-sm font-bold text-white truncate mb-1">{userEmail}</p>
                                        <p className="text-[10px] text-green-400 uppercase tracking-[0.2em] font-black">Contabilidad</p>
                                    </div>
                                    <button onClick={handleLogout} className="w-full text-left px-5 py-4 text-xs font-bold uppercase tracking-widest text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors">Cerrar Sesión</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex flex-col font-mono p-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex justify-between items-center mb-12">
                        <div className="font-serif font-bold text-2xl tracking-widest">R & R</div>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-zinc-500 hover:text-white font-bold tracking-widest text-sm">CERRAR X</button>
                    </div>
                    <div className="flex flex-col gap-6 text-left overflow-y-auto">
                        <button onClick={() => handleNavigate('HOME')} className={`text-xl font-bold text-left ${activeView === 'HOME' ? 'text-white' : 'text-zinc-400'}`}>Inicio</button>
                        <div className="mt-4 border-t border-zinc-800 pt-6 flex flex-col gap-6">
                            <button onClick={() => handleNavigate('REPORTES')} className={`text-xl font-bold text-left ${activeView === 'REPORTES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Reportes</button>
                            <button onClick={() => handleNavigate('PERFILES')} className={`text-xl font-bold text-left ${activeView === 'PERFILES' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Perfiles de Clientes</button>
                            <button onClick={() => handleNavigate('PAGOS')} className={`text-xl font-bold text-left ${activeView === 'PAGOS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Línea de Pagos</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow relative p-4 sm:p-8 w-full max-w-7xl mx-auto">
                <div className={`${activeView === 'HOME' ? 'block' : 'hidden'} relative`}> 
                    <div className="flex items-center justify-center h-[60vh] pointer-events-none">
                        <div className="text-center font-bold text-5xl md:text-7xl font-serif tracking-widest">
                            <h1 className="text-white drop-shadow-2xl">Regalado & Regalado</h1>
                        </div>
                    </div>
                </div>
                <div className={`${activeView === 'REPORTES' ? 'block' : 'hidden'}`}><ReportsView onCancel={() => handleNavigate('HOME')} /></div>
                <div className={`${activeView === 'PERFILES' ? 'block' : 'hidden'}`}><ListaPerfiles role="cliente" isContador={true} onCancel={() => handleNavigate('HOME')} /></div>
                <div className={`${activeView === 'PAGOS' ? 'block' : 'hidden'}`}><PagosView /></div>
            </main>
        </div>
    );
};

export default Contador;