import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import ReportsView from './admin/ReportsView';
import ListaPerfiles from './admin/ListaPerfiles';

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

// --- Iconos ---
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UserIcon = ({ className = 'w-5 h-5' }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const DocumentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

const scrollbarStyle = "overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700 transition-colors";

// --- VISTA CHAT CONTADORA ---
const ContadorChatView: React.FC<{ session: Session }> = ({ session }) => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [selectedContact, setSelectedContact] = useSessionState<any>('c_chat_contact', null);
    const [message, useMessage] = useSessionState('c_chat_msg', '');
    const [messages, setMessages] = useState<any[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

    useEffect(() => {
        const fetchChatData = async () => {
            const { data } = await supabase.from('profiles').select('*').neq('id', session.user.id).in('categoria_usuario', ['administrador', 'abogado', 'estudiante', 'asociado', 'cliente']);
            if (data) setContacts(data.filter(p => p.estado_aprobacion === 'aprobado'));
        };
        fetchChatData();
    }, [session.user.id]);

    const fetchMessages = useCallback(async () => {
        if (!selectedContact) return;
        const { data } = await supabase.from('chat_messages')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${session.user.id})`)
            .is('case_id', null)
            .order('created_at', { ascending: true });
        if (data) { setMessages(data); scrollToBottom(); }
    }, [selectedContact, session.user.id]);

    useEffect(() => {
        fetchMessages();
        if (selectedContact) {
            const channel = supabase.channel('chat_updates_contador').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
                const newMsg = payload.new;
                const isCurrentChat = (newMsg.sender_id === session.user.id && newMsg.receiver_id === selectedContact.id) || (newMsg.sender_id === selectedContact.id && newMsg.receiver_id === session.user.id);
                if (isCurrentChat && newMsg.case_id === null) { setMessages(prev => [...prev, newMsg]); scrollToBottom(); }
            }).subscribe();
            return () => { supabase.removeChannel(channel); };
        }
    }, [fetchMessages, selectedContact, session.user.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedContact) return;
        const msgText = message.trim();
        useMessage('');
        await supabase.from('chat_messages').insert([{ sender_id: session.user.id, receiver_id: selectedContact.id, case_id: null, message: msgText }]);
    };

    return (
        <div className="animate-in fade-in duration-500 font-mono w-full max-w-6xl mx-auto h-[75vh] flex flex-col md:flex-row border border-white/10 bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-black/40">
                <div className="p-4 border-b border-white/10"><h2 className="text-sm font-black uppercase tracking-widest text-zinc-300">Contactos</h2></div>
                <div className={`flex-grow overflow-y-auto ${scrollbarStyle}`}>
                    {contacts.map(user => (
                        <button key={user.id} onClick={() => setSelectedContact(user)} className={`w-full text-left p-4 border-b border-white/5 flex items-center gap-4 transition-colors ${selectedContact?.id === user.id ? 'bg-white/10 border-l-2 border-white' : 'hover:bg-white/5 border-l-2 border-transparent'}`}>
                            <div className="w-12 h-12 rounded-full border border-white/20 overflow-hidden flex-shrink-0 bg-black">
                                {user.foto_url ? <img src={user.foto_url} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6 m-auto mt-3 text-zinc-500"/>}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-widest">{user.primer_nombre} {user.primer_apellido}</p>
                                <p className="text-[9px] text-blue-400 uppercase tracking-widest mt-1">{user.rol}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow flex flex-col bg-black/20 relative">
                {!selectedContact ? (
                    <div className="flex-grow flex items-center justify-center p-8 text-center"><p className="text-zinc-500 uppercase tracking-widest text-sm font-bold">Selecciona un contacto para iniciar</p></div>
                ) : (
                    <>
                        <div className="p-4 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden flex-shrink-0 bg-black">
                                {selectedContact.foto_url ? <img src={selectedContact.foto_url} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4 m-auto mt-2 text-zinc-500"/>}
                            </div>
                            <div>
                                <h3 className="font-bold uppercase tracking-widest text-sm text-white">{selectedContact.primer_nombre} {selectedContact.primer_apellido}</h3>
                                <p className="text-[8px] text-zinc-400 uppercase tracking-widest">{selectedContact.rol}</p>
                            </div>
                        </div>

                        <div className={`flex-grow p-8 flex flex-col overflow-y-auto ${scrollbarStyle}`}>
                            <div className="animate-in fade-in duration-300 flex flex-col w-full min-h-full gap-4">
                                {messages.length === 0 ? (
                                    <p className="text-zinc-500 text-xs italic text-center my-auto bg-black/40 backdrop-blur-md py-4 px-6 rounded-xl border border-white/5 w-fit mx-auto">Envía el primer mensaje para iniciar la conversación.</p>
                                ) : (
                                    messages.map(msg => {
                                        const isMe = msg.sender_id === session.user.id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col gap-1 max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                                <div className={`p-3 rounded-2xl backdrop-blur-md shadow-lg ${isMe ? 'bg-blue-600/80 border border-blue-500/50 rounded-tr-none text-white' : 'bg-black/60 border border-white/10 rounded-tl-none text-zinc-200'}`}>
                                                    <p className="text-sm">{msg.message}</p>
                                                </div>
                                                <p className="text-[8px] text-zinc-500 font-mono">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        )
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-2 rounded-full pr-4 focus-within:border-white/30 transition-colors shadow-inner">
                                <input type="text" value={message} onChange={e => useMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-grow bg-transparent text-white text-sm focus:outline-none px-4 py-2" />
                                <button type="submit" disabled={!message.trim()} className="text-white hover:text-blue-400 transition-colors p-2 bg-white/10 hover:bg-white/20 rounded-full disabled:opacity-50"><SendIcon /></button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE INTERNO DE PAGOS ---
const RevisionPagosView: React.FC = () => {
    const [pagos, setPagos] = useState<any[]>([]);
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; pagoId: string }>({ isOpen: false, pagoId: '' });
    const [motivoRechazo, setMotivoRechazo] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchPagos = async () => {
        const { data, error } = await supabase.from('pagos').select('*, perfiles:profiles!cliente_id(primer_nombre, primer_apellido), casos:cases!caso_id(titulo)').order('created_at', { ascending: false }).limit(100);
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
                <h1 className="text-3xl font-black uppercase tracking-tighter italic">Revisión de Pagos</h1>
                <button onClick={fetchPagos} className="text-zinc-500 hover:text-white transition-colors text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">Refrescar</button>
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
                                    <h3 className="font-bold text-white text-lg uppercase tracking-wider mb-1">{pago.perfiles?.primer_nombre} {pago.perfiles?.primer_apellido}</h3>
                                    <p className="text-zinc-400 text-xs mb-1">CASO: {pago.casos?.titulo}</p>
                                    <p className="text-zinc-500 text-[10px] mb-4">{pago.descripcion}</p>
                                    <p className="text-2xl font-black text-white font-mono tracking-widest mb-4">${pago.monto || '0.00'}</p>
                                    
                                    {(pago.comprobante_url) && (
                                        <a href={pago.comprobante_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-[10px] bg-black/50 border border-white/10 px-3 py-1.5 mb-4 text-blue-400 hover:bg-white/5 uppercase tracking-widest transition-colors rounded-lg">
                                            <DocumentIcon /> Ver Comprobante del Cliente
                                        </a>
                                    )}

                                    {isRejected && pago.motivo_rechazo && (
                                        <div className="mt-2 mb-4 bg-red-950/30 border border-red-900 p-3 text-xs text-red-400 rounded-lg">
                                            <strong className="uppercase text-[10px] tracking-widest block mb-1">Motivo de Rechazo:</strong>{pago.motivo_rechazo}
                                        </div>
                                    )}

                                    {isPending && (
                                        <div className="flex gap-2 pt-4 border-t border-white/5">
                                            <button onClick={() => handleUpdateStatus(pago.id, 'aprobado')} disabled={actionLoading} className="flex-1 bg-green-600/80 hover:bg-green-500 text-white text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest disabled:opacity-50">Aprobar</button>
                                            <button onClick={() => setRejectModal({ isOpen: true, pagoId: pago.id })} disabled={actionLoading} className="flex-1 bg-red-600/80 hover:bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest disabled:opacity-50">Rechazar</button>
                                        </div>
                                    )}
                                    {isApproved && (
                                         <div className="flex gap-2 pt-4 border-t border-white/5">
                                            <button onClick={() => handleUpdateStatus(pago.id, 'pendiente')} disabled={actionLoading} className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest disabled:opacity-50">Revertir a Pendiente</button>
                                         </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {rejectModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-mono">
                    <div className="bg-black border border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] rounded-2xl relative p-8">
                        <h2 className="text-xl font-bold mb-6 italic tracking-widest uppercase text-red-500">Motivo de Rechazo</h2>
                        <p className="text-zinc-400 text-xs mb-4">El cliente verá este motivo en su portal de pagos.</p>
                        <input type="text" value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} required className="w-full py-3 px-4 bg-black/50 rounded-xl border border-zinc-800 text-white focus:outline-none focus:border-zinc-500 transition-colors mb-6" placeholder="Ej: La transferencia rebotó..." />
                        <div className="flex justify-end gap-4">
                            <button type="button" onClick={() => { setRejectModal({ isOpen: false, pagoId: '' }); setMotivoRechazo(''); }} className="py-2 px-6 text-zinc-400 hover:text-white transition-colors font-bold uppercase text-[10px] tracking-widest">Cancelar</button>
                            <button type="button" onClick={() => handleUpdateStatus(rejectModal.pagoId, 'rechazado', motivoRechazo)} disabled={!motivoRechazo.trim() || actionLoading} className="bg-red-600/80 hover:bg-red-500 rounded-xl shadow-lg text-white font-bold py-2 px-6 transition-colors uppercase tracking-widest text-[10px] disabled:opacity-50">Rechazar Pago</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN CONTADORA COMPONENT ---
const ContadorDashboard = () => {
    const [activeView, setActiveView] = useSessionState('contadoraActiveView', 'HOME');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                setSession(data.session);
                setUserEmail(data.session.user?.email || '');
            }
        });
    }, []);

    const handleNavigate = (view: string) => {
        setActiveView(view);
        setMobileMenuOpen(false);
        setProfileMenuOpen(false);
    };

    const handleLogout = async () => {
        localStorage.removeItem('deviceToken');
        await supabase.auth.signOut();
    };

    if (!session) return <div className="min-h-screen bg-black flex justify-center items-center font-mono text-white animate-pulse">Cargando Sistema Contable...</div>;

    return (
        <div className="bg-black min-h-screen text-white flex flex-col font-sans relative">
            <style>{`
                ::-webkit-scrollbar { width: 0 !important; height: 0 !important; background: transparent !important; display: none !important; }
                * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}</style>

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
                    <button onClick={() => handleNavigate('PAGOS')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'PAGOS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Revisión de Pagos</button>
                    <button onClick={() => handleNavigate('CHAT')} className={`text-sm lg:text-base font-bold transition-colors ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Chat</button>
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
                            <button onClick={() => handleNavigate('PAGOS')} className={`text-xl font-bold text-left ${activeView === 'PAGOS' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Revisión de Pagos</button>
                            <button onClick={() => handleNavigate('CHAT')} className={`text-xl font-bold text-left ${activeView === 'CHAT' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}>Chat</button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-grow relative p-4 sm:p-8 w-full max-w-7xl mx-auto flex flex-col">
                <div className={`${activeView === 'HOME' ? 'flex' : 'hidden'} relative flex-grow items-center justify-center pointer-events-none`}> 
                    <div className="flex items-center justify-center h-[60vh] pointer-events-none">
                        <div className="text-center font-bold text-5xl md:text-7xl font-serif tracking-widest">
                            <h1 className="text-white drop-shadow-2xl">Regalado & Regalado</h1>
                        </div>
                    </div>
                </div>
                
                <div className={`${activeView === 'REPORTES' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <ReportsView onCancel={() => handleNavigate('HOME')} />
                </div>
                <div className={`${activeView === 'PERFILES' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <ListaPerfiles role="cliente" isContador={true} onCancel={() => handleNavigate('HOME')} />
                </div>
                <div className={`${activeView === 'PAGOS' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <RevisionPagosView />
                </div>
                <div className={`${activeView === 'CHAT' ? 'flex-grow flex flex-col' : 'hidden'}`}>
                    <ContadorChatView session={session} />
                </div>
            </main>
        </div>
    );
};

export default ContadorDashboard;